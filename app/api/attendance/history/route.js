import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date');
    const batchId = searchParams.get('batchId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const logs = db.getAttendanceLogs({ startDate, endDate, date, batchId, studentId, status });
    return NextResponse.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
