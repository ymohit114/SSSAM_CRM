import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';
import { checkRateLimit } from '@/lib/rateLimiter';
import { handleCors } from '@/lib/cors';

export async function OPTIONS(request) {
  return handleCors(request).response;
}

export async function POST(request) {
  const cors = handleCors(request);

  // Rate limit registration attempts (10 req / min)
  const rateLimit = checkRateLimit(request, {
    maxRequests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'auth_student_register'
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({
        success: false,
        message: 'Name, Email, Mobile Number, and Password are all required.'
      }, { status: 400, headers: cors.headers });
    }

    if (password.length < 4) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 4 characters long.'
      }, { status: 400, headers: cors.headers });
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check existing records in MongoDB Atlas
    try {
      await connectToDatabase();
      const existingMongo = await Student.findOne({
        $or: [
          { phone: cleanPhone },
          { email: cleanEmail }
        ]
      }).lean();

      if (existingMongo) {
        if (existingMongo.status === 'approved' || existingMongo.isApproved) {
          return NextResponse.json({
            success: false,
            message: `A student with this Mobile Number (${cleanPhone}) or Email is already registered and approved (${existingMongo.rollNo}). Please login using your password.`
          }, { status: 409, headers: cors.headers });
        } else {
          return NextResponse.json({
            success: false,
            message: `An application with this Mobile Number (${cleanPhone}) is already submitted and pending admin approval.`
          }, { status: 409, headers: cors.headers });
        }
      }
    } catch (dbErr) {
      console.warn('MongoDB duplicate check note:', dbErr.message);
    }

    // 2. Register in local database
    let newStudent;
    try {
      newStudent = db.registerStudent({
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password: password.trim()
      });
    } catch (localErr) {
      // If local db throws duplicate error
      return NextResponse.json({
        success: false,
        message: localErr.message || 'An account with this Mobile Number or Email already exists.'
      }, { status: 409, headers: cors.headers });
    }

    // 3. Sync to MongoDB Atlas
    try {
      await connectToDatabase();
      await Student.create({
        rollNo: newStudent.rollNo,
        name: newStudent.name,
        phone: newStudent.phone,
        email: newStudent.email,
        password: newStudent.password,
        status: 'pending',
        isApproved: false,
        course: 'Not Assigned Yet',
        feeType: 'single',
        remainingFee: 0,
        dueDate: ''
      });
    } catch (e) {
      console.warn('MongoDB Atlas registration sync note:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! It is now pending Admin approval. You will be able to login once approved by the office.',
      student: {
        name: newStudent.name,
        phone: newStudent.phone,
        email: newStudent.email,
        status: 'pending'
      }
    }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: cors.headers });
  }
}
