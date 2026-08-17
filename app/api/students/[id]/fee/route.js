import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateStudentFee } from '@/lib/feeHelper';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { course, remainingFee, dueDate, waivedFine, feeNotes } = body;

    // Update in file db
    const updated = db.updateStudentFee(id, {
      course,
      remainingFee,
      dueDate,
      waivedFine,
      feeNotes
    });

    // Also update in MongoDB Atlas if connected
    try {
      await connectToDatabase();
      await Student.findOneAndUpdate(
        { $or: [{ _id: id.length === 24 ? id : null }, { rollNo: id.toUpperCase() }] },
        {
          ...(course !== undefined ? { course } : {}),
          ...(remainingFee !== undefined ? { remainingFee: Number(remainingFee) } : {}),
          ...(dueDate !== undefined ? { dueDate } : {}),
          ...(waivedFine !== undefined ? { waivedFine: Number(waivedFine) } : {}),
          ...(feeNotes !== undefined ? { feeNotes } : {})
        },
        { new: true }
      );
    } catch (e) {
      console.warn('MongoDB Atlas sync note:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Student course and fee details updated successfully!',
      student: updated
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, amount } = body; // action: 'waiveFine' | 'payAmount' | 'clearAll'

    if (!action) {
      return NextResponse.json({ success: false, message: 'Settlement action is required' }, { status: 400 });
    }

    const updated = db.settleStudentFee(id, { action, amount });

    // Also sync to MongoDB Atlas
    try {
      await connectToDatabase();
      await Student.findOneAndUpdate(
        { $or: [{ _id: id.length === 24 ? id : null }, { rollNo: id.toUpperCase() }] },
        {
          remainingFee: updated.remainingFee,
          waivedFine: updated.waivedFine
        }
      );
    } catch (e) {
      console.warn('MongoDB Atlas sync note:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Fee settlement recorded successfully!',
      student: updated
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
