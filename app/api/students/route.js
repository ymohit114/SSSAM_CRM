import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateStudentFee } from '@/lib/feeHelper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    let isMongoConnected = false;
    let mongoStudents = [];

    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      isMongoConnected = true;
      const docs = await Student.find({}).sort({ createdAt: -1 }).lean();
      mongoStudents = (docs || []).map(doc => {
        const s = {
          id: doc._id.toString(),
          _id: doc._id.toString(),
          rollNo: doc.rollNo,
          name: doc.name,
          phone: doc.phone,
          email: doc.email,
          password: doc.password,
          status: doc.status || (doc.isApproved ? 'approved' : 'pending'),
          isApproved: doc.isApproved != null ? doc.isApproved : doc.status === 'approved',
          course: doc.course || 'Not Assigned Yet',
          feeType: doc.feeType || 'single',
          totalCourseFee: doc.totalCourseFee || 0,
          paidAmount: doc.paidAmount || 0,
          remainingFee: doc.remainingFee != null ? doc.remainingFee : 0,
          dueDate: doc.dueDate || '',
          installments: doc.installments || [],
          currentInstallment: doc.currentInstallment || 1,
          totalInstallments: doc.totalInstallments || 1,
          waivedFine: doc.waivedFine || 0,
          gender: doc.gender || 'Male',
          active: doc.active !== false,
          joinDate: doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
        return {
          ...s,
          feeInfo: calculateStudentFee(s)
        };
      });
    } catch (mongoErr) {
      console.warn('MongoDB students query fallback note:', mongoErr.message);
    }

    if (isMongoConnected) {
      return NextResponse.json({
        success: true,
        count: mongoStudents.length,
        students: mongoStudents
      });
    }

    // 2. Fallback to local db if MongoDB is not connected
    const students = db.getStudents();
    return NextResponse.json({ success: true, count: students.length, students });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { rollNo, name, phone, email, password, course, remainingFee, dueDate, gender } = body;

    if (!rollNo || !name) {
      return NextResponse.json({
        success: false,
        message: 'Roll number and Name are required.'
      }, { status: 400 });
    }

    const newStudentData = {
      rollNo: rollNo.trim().toUpperCase(),
      name: name.trim(),
      phone: phone || '',
      email: email || '',
      password: password || '123456',
      course: course || 'Full Stack Web Development',
      remainingFee: Number(remainingFee != null ? remainingFee : 5000),
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      gender: gender || 'Male',
      status: 'approved',
      isApproved: true,
      active: true
    };

    // 1. Create in MongoDB Atlas
    let createdMongo = null;
    try {
      await connectToDatabase();
      createdMongo = await Student.create(newStudentData);
    } catch (e) {
      console.warn('MongoDB create student note:', e.message);
    }

    // 2. Create in local db
    let createdLocal = null;
    try {
      createdLocal = db.addStudent(newStudentData);
    } catch (e) {
      console.warn('Local db create student note:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Student added successfully',
      student: createdMongo || createdLocal || newStudentData
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
