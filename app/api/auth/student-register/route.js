import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({
        success: false,
        message: 'Name, Email, Mobile Number, and Password are all required.'
      }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 4 characters long.'
      }, { status: 400 });
    }

    // Register in local database
    const newStudent = db.registerStudent({
      name,
      email,
      phone,
      password
    });

    // Sync to MongoDB Atlas
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
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err.message
    }, { status: 400 });
  }
}
