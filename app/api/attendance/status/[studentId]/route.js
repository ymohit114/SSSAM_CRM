import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';
import { isWithinGeofence } from '@/lib/geo';
import { getIndianDateTime } from '@/lib/indianTime';

export async function GET(request, { params }) {
  try {
    const { studentId } = params;
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
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
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
        institute.geofenceRadius || 50
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
        geofenceRadius: institute.geofenceRadius || 50
      },
      currentDistance: distance,
      isWithinGeofence: isWithin
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
