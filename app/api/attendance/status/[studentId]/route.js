import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';
import { isWithinGeofence } from '@/lib/geo';
import { getIndianDateTime } from '@/lib/indianTime';
import { executeAutoPunchOut } from '@/lib/autoPunchOutService';
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
  const { studentId } = params;

  // Rate limit status checks (120 req / min)
  const rateLimit = checkRateLimit(request, { maxRequests: 120, keyPrefix: 'attendance_status' });
  if (!rateLimit.allowed) return rateLimit.response;

  // Authorization: Student can only view own status; Admin can view any
  const auth = verifyAuth(request, 'any', studentId);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    // Run background auto punch out check
    await executeAutoPunchOut().catch(e => console.warn('Auto punch out check in status route:', e.message));

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    const { dateStr } = getIndianDateTime();

    let student = null;
    let todayRecord = null;

    // 1. Try finding in MongoDB Atlas
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
          course: doc.course,
          status: doc.status || 'approved'
        };

        // Query today's attendance record from MongoDB
        const attDoc = await Attendance.findOne({
          $or: [
            { studentId: doc._id.toString(), date: dateStr },
            { rollNo: doc.rollNo, date: dateStr }
          ]
        }).lean();

        if (attDoc) {
          todayRecord = attDoc;
        }
      }
    } catch (mongoErr) {
      console.warn('MongoDB attendance status lookup fallback:', mongoErr.message);
    }

    // 2. Fallback to local db
    if (!student) {
      student = db.getStudentById(studentId);
    }

    if (!todayRecord && student) {
      todayRecord = db.getTodayRecord(student.id, dateStr) || db.getTodayRecord(student.rollNo, dateStr);
    }

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404, headers: cors.headers });
    }

    const institute = db.getInstitute();

    let distance = null;
    let isWithin = false;

    if (lat != null && lng != null) {
      const geoCheck = isWithinGeofence(
        parseFloat(lat),
        parseFloat(lng),
        institute.latitude,
        institute.longitude,
        institute.geofenceRadius || 25
      );
      distance = geoCheck.distance;
      isWithin = geoCheck.isWithin;
    }

    return NextResponse.json({
      success: true,
      student,
      todayRecord,
      institute: {
        name: institute.name,
        latitude: institute.latitude,
        longitude: institute.longitude,
        geofenceRadius: institute.geofenceRadius || 25
      },
      currentDistance: distance,
      isWithinGeofence: isWithin
    }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: cors.headers });
  }
}
