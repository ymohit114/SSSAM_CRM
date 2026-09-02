import mongoose from 'mongoose';
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
    let updated = null;
    try {
      updated = db.updateStudentFee(id, {
        course,
        remainingFee,
        dueDate,
        waivedFine,
        feeNotes
      });
    } catch (dbErr) {
      console.warn('Local db updateStudentFee note:', dbErr.message);
    }

    // Also update in MongoDB Atlas if connected
    try {
      await connectToDatabase();
      const orConditions = [
        { rollNo: id },
        { rollNo: id.toUpperCase() },
        { phone: id }
      ];
      if (mongoose.Types.ObjectId.isValid(id)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }

      const updatedDoc = await Student.findOneAndUpdate(
        { $or: orConditions },
        {
          ...(course !== undefined ? { course } : {}),
          ...(remainingFee !== undefined ? { remainingFee: Number(remainingFee) } : {}),
          ...(dueDate !== undefined ? { dueDate } : {}),
          ...(waivedFine !== undefined ? { waivedFine: Number(waivedFine) } : {}),
          ...(feeNotes !== undefined ? { feeNotes } : {})
        },
        { new: true }
      ).lean();

      if (updatedDoc && !updated) {
        updated = {
          id: updatedDoc._id.toString(),
          ...updatedDoc,
          feeInfo: calculateStudentFee(updatedDoc)
        };
      }
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

    let updated = null;
    try {
      updated = db.settleStudentFee(id, { action, amount });
    } catch (dbErr) {
      console.warn('Local db settleStudentFee note:', dbErr.message);
    }

    // Also sync to MongoDB Atlas
    try {
      await connectToDatabase();
      const orConditions = [
        { rollNo: id },
        { rollNo: id.toUpperCase() },
        { phone: id }
      ];
      if (mongoose.Types.ObjectId.isValid(id)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }

      const updatedDoc = await Student.findOneAndUpdate(
        { $or: orConditions },
        {
          ...(updated?.remainingFee !== undefined ? { remainingFee: updated.remainingFee } : {}),
          ...(updated?.waivedFine !== undefined ? { waivedFine: updated.waivedFine } : {})
        },
        { new: true }
      ).lean();

      if (updatedDoc && !updated) {
        updated = {
          id: updatedDoc._id.toString(),
          ...updatedDoc,
          feeInfo: calculateStudentFee(updatedDoc)
        };
      }
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
