import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      rollNo,
      course,
      feeType = 'single',
      remainingFee,
      dueDate,
      installments = [],
      totalInstallments = 1
    } = body;

    if (!rollNo || !course) {
      return NextResponse.json({
        success: false,
        message: 'Roll Number and Course Name are required for approval.'
      }, { status: 400 });
    }

    // Approve in local database
    const approvedStudent = db.approveStudent(id, {
      rollNo,
      course,
      feeType,
      remainingFee: Number(remainingFee || 0),
      dueDate: dueDate || '',
      installments,
      totalInstallments
    });

    // Sync approval to MongoDB Atlas
    try {
      await connectToDatabase();
      await Student.findOneAndUpdate(
        { $or: [{ _id: id.length === 24 ? id : null }, { phone: approvedStudent.phone }, { email: approvedStudent.email }] },
        {
          rollNo: approvedStudent.rollNo,
          course: approvedStudent.course,
          feeType: approvedStudent.feeType,
          remainingFee: approvedStudent.remainingFee,
          dueDate: approvedStudent.dueDate,
          installments: approvedStudent.installments,
          currentInstallment: approvedStudent.currentInstallment,
          totalInstallments: approvedStudent.totalInstallments,
          status: 'approved',
          isApproved: true
        },
        { new: true, upsert: true }
      );
    } catch (e) {
      console.warn('MongoDB Atlas approval sync note:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: `Student ${approvedStudent.name} (${approvedStudent.rollNo}) has been approved and activated!`,
      student: approvedStudent
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
