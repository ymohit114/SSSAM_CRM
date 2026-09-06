import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkStudentFeeDueStatus } from '@/lib/feeReminderService';
import { verifyAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimiter';
import { handleCors } from '@/lib/cors';

export async function OPTIONS(request) {
  return handleCors(request).response;
}

export async function GET(request) {
  const cors = handleCors(request);

  // Rate limit
  const rateLimit = checkRateLimit(request, { maxRequests: 60, keyPrefix: 'cron_fee_reminders' });
  if (!rateLimit.allowed) return rateLimit.response;

  // Verify Cron authorization or Admin
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'sssam_cron_secret_2026';
  const isCron = authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const auth = verifyAuth(request, 'admin');
    if (!auth.authorized) return auth.response;
  }

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
    }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: cors.headers });
  }
}
