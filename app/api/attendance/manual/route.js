import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, date, punchInTime, punchOutTime, status, remarks } = body;

    if (!studentId || !date) {
      return NextResponse.json({ success: false, message: 'Student and date are required.' }, { status: 400 });
    }

    const record = db.manualAttendanceRecord({
      studentId,
      date,
      punchInTime,
      punchOutTime,
      status,
      remarks
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance record updated manually.',
      record
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
