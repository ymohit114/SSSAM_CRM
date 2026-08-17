import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateStudentFee } from '@/lib/feeHelper';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    let student = null;

    // 1. Try finding in MongoDB Atlas
    try {
      await connectToDatabase();
      const orConditions = [
        { rollNo: { $regex: new RegExp(`^${id}$`, 'i') } },
        { phone: id }
      ];
      if (mongoose.Types.ObjectId.isValid(id)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }

      const doc = await Student.findOne({ $or: orConditions }).lean();
      if (doc) {
        const s = {
          id: doc._id.toString(),
          rollNo: doc.rollNo,
          name: doc.name,
          phone: doc.phone,
          email: doc.email,
          password: doc.password,
          status: doc.status || 'approved',
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
        student = {
          ...s,
          feeInfo: calculateStudentFee(s)
        };
      }
    } catch (mongoErr) {
      console.warn('MongoDB student by id query fallback:', mongoErr.message);
    }

    // 2. Fallback to local db
    if (!student) {
      student = db.getStudentById(id);
    }

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, student });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // 1. Update in MongoDB Atlas
    try {
      await connectToDatabase();
      const orConditions = [
        { rollNo: { $regex: new RegExp(`^${id}$`, 'i') } },
        { phone: id }
      ];
      if (mongoose.Types.ObjectId.isValid(id)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      await Student.findOneAndUpdate({ $or: orConditions }, { $set: body });
    } catch (e) {
      console.warn('MongoDB student update note:', e.message);
    }

    // 2. Update local db
    let updated = null;
    try {
      updated = db.updateStudent(id, body);
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      student: updated || body
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // 1. Delete from MongoDB Atlas
    try {
      await connectToDatabase();
      const orConditions = [
        { rollNo: { $regex: new RegExp(`^${id}$`, 'i') } },
        { phone: id }
      ];
      if (mongoose.Types.ObjectId.isValid(id)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      await Student.findOneAndDelete({ $or: orConditions });
    } catch (e) {
      console.warn('MongoDB student delete note:', e.message);
    }

    // 2. Delete from local db
    try {
      db.deleteStudent(id);
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, message: 'Student removed successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
