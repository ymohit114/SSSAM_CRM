import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    let logs = [];

    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      const filter = {};

      if (date) {
        filter.date = date;
      } else if (startDate && endDate) {
        filter.date = { $gte: startDate, $lte: endDate };
      }

      if (studentId) {
        filter.$or = [{ studentId: studentId }, { rollNo: studentId }];
      }

      if (status && status !== 'all') {
        filter.status = status;
      }

      const mongoLogs = await Attendance.find(filter).sort({ date: -1, createdAt: -1 }).lean();
      if (mongoLogs && mongoLogs.length > 0) {
        logs = mongoLogs.map(l => ({
          id: l._id.toString(),
          _id: l._id.toString(),
          studentId: l.studentId,
          rollNo: l.rollNo,
          studentName: l.studentName,
          date: l.date,
          punchInTime: l.punchInTime,
          punchOutTime: l.punchOutTime,
          status: l.status,
          durationMinutes: l.durationMinutes || 0,
          studySummary: l.studySummary || '',
          distance: l.punchInDistance || 0
        }));
      }
    } catch (mongoErr) {
      console.warn('MongoDB attendance history fallback:', mongoErr.message);
    }

    // 2. Fallback to local db if MongoDB returned empty
    if (logs.length === 0) {
      logs = db.getAttendanceLogs({ startDate, endDate, date, studentId, status });
    }

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date');
    const studentId = searchParams.get('studentId');

    // Also check json body if id not passed in query
    if (!id && !startDate && !date && !studentId) {
      try {
        const body = await request.json();
        if (body.id) id = body.id;
      } catch {}
    }

    let deletedCount = 0;

    // 1. Delete from MongoDB Atlas
    try {
      await connectToDatabase();
      if (id) {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const res = await Attendance.findByIdAndDelete(id);
          if (res) deletedCount++;
        }
        if (deletedCount === 0) {
          const res = await Attendance.deleteOne({
            $or: [
              { _id: id },
              { id: id }
            ]
          });
          deletedCount += (res.deletedCount || 0);
        }
      } else if (date || (startDate && endDate) || studentId) {
        const filter = {};
        if (date) filter.date = date;
        else if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
        if (studentId) filter.$or = [{ studentId }, { rollNo: studentId }];
        const res = await Attendance.deleteMany(filter);
        deletedCount += (res.deletedCount || 0);
      }
    } catch (mongoErr) {
      console.warn('MongoDB attendance delete note:', mongoErr.message);
    }

    // 2. Also delete from local db
    try {
      if (id) {
        db.deleteAttendanceRecord(id);
      } else if (date || (startDate && endDate) || studentId) {
        db.deleteAttendanceLogs({ startDate, endDate, date, studentId });
      }
    } catch (localErr) {
      console.warn('Local db delete note:', localErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance log(s) deleted successfully.',
      deletedCount
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
