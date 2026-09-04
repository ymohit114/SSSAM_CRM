import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Attendance record ID is required' }, { status: 400 });
    }

    let deleted = false;

    // 1. Delete from MongoDB Atlas
    try {
      await connectToDatabase();
      if (mongoose.Types.ObjectId.isValid(id)) {
        const res = await Attendance.findByIdAndDelete(id);
        if (res) deleted = true;
      }
      if (!deleted) {
        const res = await Attendance.deleteOne({
          $or: [
            { _id: id },
            { id: id }
          ]
        });
        if (res.deletedCount > 0) deleted = true;
      }
    } catch (mongoErr) {
      console.warn('MongoDB attendance delete note:', mongoErr.message);
    }

    // 2. Delete from local db
    try {
      const localRes = db.deleteAttendanceRecord(id);
      if (localRes) deleted = true;
    } catch (localErr) {
      console.warn('Local db delete note:', localErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance log deleted successfully.'
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
