import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';
import { getIndianDateTime, formatISTTime } from '@/lib/indianTime';
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
  const rateLimit = checkRateLimit(request, { maxRequests: 60, keyPrefix: 'admin_punch_out' });
  if (!rateLimit.allowed) return rateLimit.response;

  // Authorization: Requires Admin
  const auth = verifyAuth(request, 'admin');
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { studentId, date, punchOutTime, remarks, studySummary } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'Student ID is required.' }, { status: 400, headers: cors.headers });
    }

    const ist = getIndianDateTime();
    const targetDate = date || ist.dateStr;
    const finalPunchOutTime = punchOutTime ? (punchOutTime.length === 5 ? `${punchOutTime}:00` : punchOutTime) : ist.timeStr;
    const finalRemarks = remarks || 'Punched out manually by Admin';
    const finalStudySummary = studySummary || 'Completed session (Punched out by Admin)';

    let student = db.getStudentById(studentId);

    // MongoDB Atlas fallback lookup
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
        console.warn('MongoDB student lookup note on admin punch out:', e.message);
      }
    }

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404, headers: cors.headers });
    }

    // 1. Update Local DB
    let localRecord;
    try {
      localRecord = db.manualAttendanceRecord({
        studentId: student.id || student.rollNo,
        date: targetDate,
        punchOutTime: finalPunchOutTime,
        status: 'Present',
        remarks: finalRemarks
      });
      if (localRecord) {
        localRecord.studySummary = finalStudySummary;
      }
    } catch (localErr) {
      console.warn('Local db record update note:', localErr.message);
    }

    // 2. Sync / Upsert to MongoDB Atlas
    let mongoRecord = null;
    try {
      await connectToDatabase();
      const institute = db.getInstitute();

      // Find existing attendance
      let attDoc = await Attendance.findOne({
        $or: [
          { studentId: student.id, date: targetDate },
          { rollNo: student.rollNo, date: targetDate }
        ]
      });

      let punchInTimeStr = attDoc?.punchInTime || '09:00:00';
      
      // Calculate duration
      const [inH, inM, inS = 0] = punchInTimeStr.split(':').map(Number);
      const [outH, outM, outS = 0] = finalPunchOutTime.split(':').map(Number);
      const durationMinutes = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));

      if (attDoc) {
        attDoc.punchOutTime = finalPunchOutTime;
        attDoc.punchOutLat = institute.latitude;
        attDoc.punchOutLng = institute.longitude;
        attDoc.punchOutDistance = 0;
        attDoc.durationMinutes = durationMinutes;
        attDoc.studySummary = finalStudySummary;
        attDoc.remarks = finalRemarks;
        attDoc.status = 'Present';
        await attDoc.save();
        mongoRecord = attDoc.toObject();
      } else {
        const created = await Attendance.create({
          studentId: student.id || student._id,
          rollNo: student.rollNo,
          studentName: student.name,
          date: targetDate,
          punchInTime: punchInTimeStr,
          punchInLat: institute.latitude,
          punchInLng: institute.longitude,
          punchInDistance: 0,
          punchOutTime: finalPunchOutTime,
          punchOutLat: institute.latitude,
          punchOutLng: institute.longitude,
          punchOutDistance: 0,
          durationMinutes,
          studySummary: finalStudySummary,
          status: 'Present',
          remarks: finalRemarks
        });
        mongoRecord = created.toObject();
      }
    } catch (mongoErr) {
      console.warn('MongoDB attendance update note on admin punch out:', mongoErr.message);
    }

    const finalRecord = mongoRecord || localRecord;

    return NextResponse.json({
      success: true,
      message: `Successfully punched out ${student.name} at ${formatISTTime(finalPunchOutTime)}.`,
      record: finalRecord
    }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to punch out student.' }, { status: 500, headers: cors.headers });
  }
}
