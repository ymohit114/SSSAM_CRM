import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';
import { getIndianDateTime } from '@/lib/indianTime';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || getIndianDateTime().dateStr;

    let students = [];
    let logs = [];

    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      const mongoStudents = await Student.find({ status: { $ne: 'rejected' } }).lean();
      if (mongoStudents && mongoStudents.length > 0) {
        students = mongoStudents.map(doc => ({
          id: doc._id.toString(),
          rollNo: doc.rollNo,
          name: doc.name,
          phone: doc.phone,
          email: doc.email,
          course: doc.course,
          status: doc.status || 'approved',
          isApproved: doc.isApproved
        }));

        const mongoLogs = await Attendance.find({ date: dateStr }).lean();
        logs = (mongoLogs || []).map(l => ({
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
      console.warn('MongoDB attendance today fallback:', mongoErr.message);
    }

    // 2. Fallback to local db if MongoDB returned empty
    if (students.length === 0) {
      students = db.getStudents();
      logs = db.getAttendanceLogs({ date: dateStr });
    }

    const presentCount = logs.filter(l => l.punchInTime).length;
    const absentCount = Math.max(0, students.length - presentCount);

    const stats = {
      totalStudents: students.length,
      presentToday: presentCount,
      absentToday: absentCount,
      totalStudyMinutes: logs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0)
    };

    const fullRoster = students.map(student => {
      const log = logs.find(l => l.studentId === student.id || l.rollNo === student.rollNo);
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
