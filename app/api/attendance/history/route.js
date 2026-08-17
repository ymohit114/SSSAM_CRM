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
