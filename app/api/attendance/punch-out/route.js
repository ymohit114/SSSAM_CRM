import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateDistance } from '@/lib/geo';
import { getIndianDateTime } from '@/lib/indianTime';

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, lat, lng, selfieImg, studySummary, overrideDistance, time, date } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'Student ID is required.' }, { status: 400 });
    }

    if (!studySummary || studySummary.trim().length < 20) {
      return NextResponse.json({
        success: false,
        message: 'Daily study summary is required (Minimum 20 characters).'
      }, { status: 400 });
    }

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
            rollNo: doc.rollNo,
            name: doc.name,
            phone: doc.phone,
            email: doc.email,
            course: doc.course
          };
        }
      } catch (e) {
        console.warn('MongoDB student lookup note on punch out:', e.message);
      }
    }

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404 });
    }

    const institute = db.getInstitute();
    const maxRadius = institute.geofenceRadius || 50;

    let userLat = parseFloat(lat);
    let userLng = parseFloat(lng);
    let distance = calculateDistance(userLat, userLng, institute.latitude, institute.longitude);

    if (!overrideDistance && distance > maxRadius) {
      return NextResponse.json({
        success: false,
        message: `Punch Out Failed: You are ${Math.round(distance)}m away from ${institute.name}. Maximum allowed distance is ${maxRadius}m.`,
        currentDistance: distance,
        maxRadius
      }, { status: 403 });
    }

    const ist = getIndianDateTime();
    const dateStr = (date && date.length === 10) ? date : ist.dateStr;
    const timeStr = (time && time.length >= 5) ? time : ist.timeStr;

    const record = db.recordPunchOut({
      studentId: student.id || student.rollNo,
      student,
      date: dateStr,
      time: timeStr,
      lat: userLat || institute.latitude,
      lng: userLng || institute.longitude,
      distance: distance === 999999 ? 0 : distance,
      selfieImg,
      studySummary: studySummary.trim()
    });

    // Also sync punch-out to MongoDB Attendance collection
    try {
      await connectToDatabase();
      await Attendance.findOneAndUpdate(
        {
          $or: [
            { studentId: student.id, date: dateStr },
            { rollNo: student.rollNo, date: dateStr }
          ]
        },
        {
          punchOutTime: timeStr,
          punchOutLat: userLat || institute.latitude,
          punchOutLng: userLng || institute.longitude,
          punchOutDistance: distance === 999999 ? 0 : distance,
          studySummary: studySummary.trim(),
          durationMinutes: record.durationMinutes || 0
        }
      );
    } catch (e) {
      console.warn('MongoDB punch out sync note:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: `Punch Out successful! Total duration: ${Math.floor(record.durationMinutes / 60)}h ${record.durationMinutes % 60}m`,
      record,
      student
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
