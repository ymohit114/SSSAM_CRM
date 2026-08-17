import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const logs = db.getAttendanceLogs({ date: dateStr });
    const stats = db.getStats(dateStr);
    const students = db.getStudents();

    const fullRoster = students.map(student => {
      const log = logs.find(l => l.studentId === student.id);
      return {
        student,
        attendance: log || {
          status: 'Absent',
          punchInTime: null,
          punchOutTime: null,
          durationMinutes: 0
        }
      };
    });

    return NextResponse.json({
      success: true,
      date: dateStr,
      stats,
      logs,
      fullRoster
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
