import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkStudentFeeDueStatus } from '@/lib/feeReminderService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'morning'; // 'morning' (9 AM) or 'evening' (6 PM)

    const students = db.getStudents().filter(s => s.active);
    const remindedStudents = [];

    for (const student of students) {
      const reminder = checkStudentFeeDueStatus(student);
      if (reminder.hasReminder) {
        const message = type === 'evening' ? reminder.eveningMessage : reminder.morningMessage;
        const title = reminder.isOverdue
          ? `🚨 SSSAM Overdue Fee Notice`
          : type === 'evening'
          ? `🌆 SSSAM Fee Alert (Evening)`
          : `🔔 SSSAM Fee Reminder (Morning)`;

        remindedStudents.push({
          studentId: student.id,
          studentName: student.name,
          rollNo: student.rollNo,
          remainingFee: reminder.remainingFee,
          dueDate: reminder.dueDate,
          daysLabel: reminder.daysLabel,
          title,
          message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({
      success: true,
      remindCount: remindedStudents.length,
      reminderType: type,
      remindedStudents
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
