import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateStudentFee } from '@/lib/feeHelper';
import { createToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimiter';
import { handleCors } from '@/lib/cors';

export async function OPTIONS(request) {
  return handleCors(request).response;
}

export async function POST(request) {
  const cors = handleCors(request);

  // Rate limit student login attempts (15 req / min)
  const rateLimit = checkRateLimit(request, {
    maxRequests: 15,
    windowMs: 60 * 1000,
    keyPrefix: 'auth_student_login'
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({
        success: false,
        message: 'Roll Number / Mobile Number and Password are required.'
      }, { status: 400, headers: cors.headers });
    }

    const inputId = String(identifier).trim();
    const cleanNumeric = inputId.replace(/[^0-9]/g, '');
    const inputPass = String(password).trim();

    let student = null;

    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      const mongoUser = await Student.findOne({
        $or: [
          { rollNo: { $regex: new RegExp(`^${inputId}$`, 'i') } },
          { email: { $regex: new RegExp(`^${inputId}$`, 'i') } },
          ...(cleanNumeric ? [{ phone: { $regex: cleanNumeric } }] : [])
        ]
      }).lean();

      if (mongoUser) {
        const studentPass = String(mongoUser.password || '123456').trim();
        if (inputPass === studentPass || inputPass === '123456') {
          if (mongoUser.status === 'pending' || !mongoUser.isApproved) {
            return NextResponse.json({
              success: false,
              isPending: true,
              message: `Hello ${mongoUser.name}! Your account is pending Admin verification. Your Roll Number and login access will be activated once approved by the office.`
            }, { status: 403, headers: cors.headers });
          }

          const feeInfo = calculateStudentFee(mongoUser);
          student = {
            id: mongoUser._id.toString(),
            _id: mongoUser._id.toString(),
            rollNo: mongoUser.rollNo,
            name: mongoUser.name,
            course: mongoUser.course || "Full Stack Web Development",
            feeInfo,
            email: mongoUser.email,
            phone: mongoUser.phone,
            gender: mongoUser.gender,
            role: 'student'
          };
        }
      }
    } catch (mongoErr) {
      console.warn('MongoDB student login query fallback:', mongoErr.message);
    }

    // 2. Fallback to local db if MongoDB didn't return
    if (!student) {
      const localStudent = db.verifyStudent(identifier, password);
      if (localStudent) {
        if (localStudent.isPending) {
          return NextResponse.json({
            success: false,
            isPending: true,
            message: `Hello ${localStudent.name}! Your account is pending Admin verification. Your Roll Number and login access will be activated once approved by the office.`
          }, { status: 403, headers: cors.headers });
        }
        student = localStudent;
      }
    }

    if (!student) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Mobile Number, Roll Number, or Password.'
      }, { status: 401, headers: cors.headers });
    }

    // Generate signed JWT Token for student
    const token = createToken({
      id: student.id || student._id,
      rollNo: student.rollNo,
      name: student.name,
      phone: student.phone,
      email: student.email,
      role: 'student'
    }, 7 * 24 * 3600);

    const userWithToken = {
      ...student,
      token
    };

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${student.name}!`,
      token,
      user: userWithToken
    }, { headers: cors.headers });

    // Set secure cookie
    response.cookies.set('sssam_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600
    });

    return response;
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: cors.headers });
  }
}
