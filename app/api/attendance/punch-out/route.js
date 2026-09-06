import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateDistance } from '@/lib/geo';
import { getIndianDateTime } from '@/lib/indianTime';
import { verifyAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimiter';
import { handleCors } from '@/lib/cors';

export async function OPTIONS(request) {
  return handleCors(request).response;
}

export async function POST(request) {
  const cors = handleCors(request);

  // Rate limit punch out attempts (30 req / min)
  const rateLimit = checkRateLimit(request, { maxRequests: 30, keyPrefix: 'attendance_punch_out' });
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const body = await request.json();
    const { studentId, lat, lng, selfieImg, studySummary, overrideDistance, time, date, isTampered } = body;

    if (isTampered) {
      return NextResponse.json({
        success: false,
        message: 'Security Violation: Developer Tools or simulated GPS location detected. Please punch via a real mobile device without simulation tools.'
      }, { status: 403, headers: cors.headers });
    }

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'Student ID is required.' }, { status: 400, headers: cors.headers });
    }

    // Authorization: Student can only punch out for self; Admin can punch for anyone
    const auth = verifyAuth(request, 'any', studentId);
    if (!auth.authorized) {
      return auth.response;
    }

    if (!studySummary || studySummary.trim().length < 20) {
      return NextResponse.json({
        success: false,
        message: 'Daily study summary is required (Minimum 20 characters).'
      }, { status: 400, headers: cors.headers });
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
      return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404, headers: cors.headers });
    }

    const institute = db.getInstitute();
    const maxRadius = institute.geofenceRadius || 25;

    let userLat = parseFloat(lat);
    let userLng = parseFloat(lng);
    let distance = calculateDistance(userLat, userLng, institute.latitude, institute.longitude);

    if (!overrideDistance && distance > maxRadius) {
      return NextResponse.json({
        success: false,
        message: `Punch Out Failed: You are ${Math.round(distance)}m away from ${institute.name}. Maximum allowed distance is ${maxRadius}m. Please be inside campus.`,
        currentDistance: distance,
        maxRadius
      }, { status: 403, headers: cors.headers });
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

    // Sync to MongoDB Attendance collection
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
          studentId: student.id,
          studentName: student.name,
          rollNo: student.rollNo,
          course: student.course,
          date: dateStr,
          punchOutTime: timeStr,
          punchOutLat: userLat || institute.latitude,
          punchOutLng: userLng || institute.longitude,
          punchOutDistance: distance === 999999 ? 0 : distance,
          studySummary: studySummary.trim()
        },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.warn('MongoDB attendance punch out sync note:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: `Punch Out recorded successfully! Great work today!`,
      record
    }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400, headers: cors.headers });
  }
}
