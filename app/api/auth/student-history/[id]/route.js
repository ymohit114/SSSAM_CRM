import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateStudentFee } from '@/lib/feeHelper';
import { verifyAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimiter';
import { handleCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS(request) {
  return handleCors(request).response;
}

export async function GET(request, { params }) {
  const cors = handleCors(request);
  const { id } = params;

  if (!id) {
    return NextResponse.json({ success: false, message: 'Student ID is required.' }, { status: 400, headers: cors.headers });
  }

  // Rate limit
  const rateLimit = checkRateLimit(request, { maxRequests: 120, keyPrefix: 'student_history' });
  if (!rateLimit.allowed) return rateLimit.response;

  // Authorization: Student can only view own history; Admin can view any
  const auth = verifyAuth(request, 'any', id);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    let student = null;
    let logs = [];

    // 1. Try fetching directly from MongoDB Atlas
    try {
      await connectToDatabase();
      const orConditions = [
        { rollNo: { $regex: new RegExp(`^${id}$`, 'i') } },
        { phone: id },
        { email: id.toLowerCase() }
      ];
      if (mongoose.Types.ObjectId.isValid(id)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }

      const doc = await Student.findOne({ $or: orConditions }).lean();
      if (doc) {
        student = {
          id: doc._id.toString(),
          _id: doc._id.toString(),
          rollNo: doc.rollNo,
          name: doc.name,
          phone: doc.phone,
          email: doc.email,
          course: doc.course,
          feeType: doc.feeType,
          totalCourseFee: doc.totalCourseFee,
          paidAmount: doc.paidAmount,
          remainingFee: doc.remainingFee,
          dueDate: doc.dueDate,
          gender: doc.gender,
          role: 'student',
          status: doc.status || 'approved'
        };

        // Query attendance records for this student
        const attendanceDocs = await Attendance.find({
          $or: [
            { studentId: doc._id.toString() },
            { studentId: doc.rollNo },
            { rollNo: doc.rollNo }
          ]
        }).sort({ date: -1, createdAt: -1 }).lean();

        logs = (attendanceDocs || []).map(a => ({
          id: a._id.toString(),
          studentId: a.studentId,
          rollNo: a.rollNo,
          studentName: a.studentName,
          date: a.date,
          punchInTime: a.punchInTime,
          punchOutTime: a.punchOutTime,
          status: a.status || 'Present',
          durationMinutes: a.durationMinutes || 0,
          studySummary: a.studySummary || '',
          punchInDistance: a.punchInDistance,
          punchOutDistance: a.punchOutDistance,
          remarks: a.remarks || ''
        }));
      }
    } catch (e) {
      console.warn('MongoDB student history fetch note:', e.message);
    }

    // 2. Fallback: local memory db
    if (!student) {
      const localData = db.getStudentHistory(id);
      if (localData && localData.student) {
        return NextResponse.json({
          success: true,
          ...localData
        }, { headers: cors.headers });
      }
    }

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404, headers: cors.headers });
    }

    const feeInfo = calculateStudentFee(student);
    const totalPunches = logs.length;
    const presentDays = logs.filter(l => l.status === 'Present' || l.status === 'Late').length;
    const lateDays = logs.filter(l => l.status === 'Late').length;
    const totalMinutes = logs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

    return NextResponse.json({
      success: true,
      student,
      feeInfo,
      logs,
      stats: {
        totalDays: totalPunches,
        presentDays,
        lateDays,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10
      }
    }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: cors.headers });
  }
}
