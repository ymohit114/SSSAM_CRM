import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateStudentFee } from '@/lib/feeHelper';

export async function GET() {
  try {
    let mongoStudents = null;

    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      const docs = await Student.find({}).sort({ createdAt: -1 }).lean();
      if (docs && docs.length > 0) {
        mongoStudents = docs.map(doc => {
          const s = {
            id: doc._id.toString(),
            rollNo: doc.rollNo,
            name: doc.name,
            phone: doc.phone,
            email: doc.email,
            password: doc.password,
            status: doc.status || (doc.isApproved ? 'approved' : 'pending'),
            isApproved: doc.isApproved != null ? doc.isApproved : doc.status === 'approved',
            course: doc.course || 'Not Assigned Yet',
            feeType: doc.feeType || 'single',
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
      }
    } catch (mongoErr) {
      console.warn('MongoDB students query fallback note:', mongoErr.message);
    }

    if (mongoStudents && mongoStudents.length > 0) {
      return NextResponse.json({
        success: true,
        count: mongoStudents.length,
        students: mongoStudents
      });
    }

    // 2. Fallback to local db if MongoDB is empty or unreachable
    const students = db.getStudents();
    return NextResponse.json({ success: true, count: students.length, students });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { rollNo, name, course, phone, email, gender, joinDate, remainingFee, dueDate } = body;
    if (!rollNo || !name) {
      return NextResponse.json({ success: false, message: 'Roll number and name are required.' }, { status: 400 });
    }

    const newStudent = db.addStudent({
      rollNo,
      name,
      course,
      phone,
      email,
      gender,
      joinDate,
      remainingFee,
      dueDate
    });

    // Sync to MongoDB
    try {
      await connectToDatabase();
      await Student.findOneAndUpdate(
        { rollNo: newStudent.rollNo },
        {
          rollNo: newStudent.rollNo,
          name: newStudent.name,
          phone: newStudent.phone,
          email: newStudent.email,
          password: newStudent.password,
          status: 'approved',
          isApproved: true,
          course: newStudent.course,
          feeType: newStudent.feeType,
          remainingFee: newStudent.remainingFee,
          dueDate: newStudent.dueDate
        },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.warn('MongoDB student add sync note:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Student registered successfully',
      student: newStudent
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
