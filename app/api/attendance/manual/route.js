import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';
import { getIndianDateTime } from '@/lib/indianTime';
import { verifyAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimiter';
import { handleCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS(request) {
  return handleCors(request).response;
}

export async function POST(request) {
  const cors = handleCors(request);

  // Rate limit
  const rateLimit = checkRateLimit(request, { maxRequests: 60, keyPrefix: 'attendance_manual' });
  if (!rateLimit.allowed) return rateLimit.response;

  // Authorization: Requires Admin
  const auth = verifyAuth(request, 'admin');
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { studentId, date, punchInTime, punchOutTime, status, remarks, studySummary } = body;

    if (!studentId || !date) {
      return NextResponse.json({ success: false, message: 'Student and date are required.' }, { status: 400, headers: cors.headers });
    }

    let student = db.getStudentById(studentId);

    // Atlas fallback lookup
    if (!student) {
      try {
        await connectToDatabase();
        const orConditions = [
          { rollNo: { $regex: new RegExp(`^${studentId}$`, 'i') } },
          { phone: studentId }
        ];
        if (mongoose.Types.ObjectId.isValid(studentId)) {
          orConditions.push({ _id: new mongoose.Types.ObjectId(studentId) });
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
            course: doc.course
          };
        }
      } catch (e) {
        console.warn('MongoDB student lookup note on manual attendance:', e.message);
      }
    }

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404, headers: cors.headers });
    }

    const finalPunchIn = punchInTime ? (punchInTime.length === 5 ? `${punchInTime}:00` : punchInTime) : '09:00:00';
    const finalPunchOut = punchOutTime ? (punchOutTime.length === 5 ? `${punchOutTime}:00` : punchOutTime) : null;
    const finalStatus = status || 'Present';
    const finalRemarks = remarks || 'Manual entry by Admin';
    const finalStudySummary = studySummary || (finalPunchOut ? 'Manual Attendance recorded by Faculty' : '');

    // Calculate duration
    let durationMinutes = 0;
    if (finalPunchIn && finalPunchOut) {
      const [inH, inM] = finalPunchIn.split(':').map(Number);
      const [outH, outM] = finalPunchOut.split(':').map(Number);
      durationMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));
    }

    // 1. Update Local DB
    let localRecord = null;
    try {
      localRecord = db.manualAttendanceRecord({
        studentId: student.id || student.rollNo,
        date,
        punchInTime: finalPunchIn,
        punchOutTime: finalPunchOut,
        status: finalStatus,
        remarks: finalRemarks
      });
      if (localRecord) {
        localRecord.durationMinutes = durationMinutes;
        localRecord.studySummary = finalStudySummary;
      }
    } catch (localErr) {
      console.warn('Local db manual record error:', localErr.message);
    }

    // 2. Sync to MongoDB Atlas
    let mongoRecord = null;
    try {
      await connectToDatabase();
      const institute = db.getInstitute();

      let attDoc = await Attendance.findOne({
        $or: [
          { studentId: student.id, date },
          { rollNo: student.rollNo, date }
        ]
      });

      if (attDoc) {
        attDoc.punchInTime = finalPunchIn;
        attDoc.punchOutTime = finalPunchOut;
        attDoc.status = finalStatus;
        attDoc.remarks = finalRemarks;
        attDoc.durationMinutes = durationMinutes;
        if (finalStudySummary) attDoc.studySummary = finalStudySummary;
        await attDoc.save();
        mongoRecord = attDoc.toObject();
      } else {
        const created = await Attendance.create({
          studentId: student.id || student._id,
          rollNo: student.rollNo,
          studentName: student.name,
          date,
          punchInTime: finalPunchIn,
          punchInLat: institute.latitude,
          punchInLng: institute.longitude,
          punchInDistance: 0,
          punchOutTime: finalPunchOut,
          punchOutLat: finalPunchOut ? institute.latitude : null,
          punchOutLng: finalPunchOut ? institute.longitude : null,
          punchOutDistance: 0,
          durationMinutes,
          status: finalStatus,
          remarks: finalRemarks,
          studySummary: finalStudySummary
        });
        mongoRecord = created.toObject();
      }
    } catch (mongoErr) {
      console.warn('MongoDB manual attendance sync error:', mongoErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance record updated manually.',
      record: mongoRecord || localRecord
    }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to update attendance.' }, { status: 400, headers: cors.headers });
  }
}
