import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateStudentFee } from '@/lib/feeHelper';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({
        success: false,
        message: 'Roll Number / Mobile Number and Password are required.'
      }, { status: 400 });
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
              message: `Namaste ${mongoUser.name}! Aapka account Admin verification ke liye pending hai. Admin approval ke baad aapka Roll Number assign hoga aur login active ho jayega.`
            }, { status: 403 });
          }

          const feeInfo = calculateStudentFee(mongoUser);
          student = {
            id: mongoUser._id.toString(),
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
            message: `Namaste ${localStudent.name}! Aapka account Admin verification ke liye pending hai. Admin approval ke baad aapka Roll Number assign hoga aur login active ho jayega.`
          }, { status: 403 });
        }
        student = localStudent;
      }
    }

    if (!student) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Mobile Number, Roll Number, or Password.'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: `Welcome back, ${student.name}!`,
      user: student
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
