import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateDistance } from '@/lib/geo';
import { checkStudentFeeDueStatus } from '@/lib/feeReminderService';
import { getIndianDateTime } from '@/lib/indianTime';

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, lat, lng, selfieImg, overrideDistance, time, date } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'Student ID is required.' }, { status: 400 });
    }

    let student = null;

    // 1. Check MongoDB Atlas first
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
          password: doc.password,
          course: doc.course,
          feeType: doc.feeType,
          remainingFee: doc.remainingFee,
          dueDate: doc.dueDate,
          status: doc.status || 'approved',
          isApproved: doc.isApproved
        };
      }
    } catch (e) {
      console.warn('MongoDB student lookup note on punch in:', e.message);
    }

    // 2. Fallback: check local db
    if (!student) {
      student = db.getStudentById(studentId);
    }

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404 });
    }

    const institute = db.getInstitute();
    const maxRadius = institute.geofenceRadius || 25;

    let userLat = parseFloat(lat);
    let userLng = parseFloat(lng);
    let distance = calculateDistance(userLat, userLng, institute.latitude, institute.longitude);

    if (!overrideDistance && distance > maxRadius) {
      return NextResponse.json({
        success: false,
        message: `Punch In Failed: You are ${Math.round(distance)}m away from ${institute.name}. Maximum allowed distance is ${maxRadius}m. Please be inside campus.`,
        currentDistance: distance,
        maxRadius
      }, { status: 403 });
    }

    const ist = getIndianDateTime();
    const dateStr = (date && date.length === 10) ? date : ist.dateStr;
    const timeStr = (time && time.length >= 5) ? time : ist.timeStr;

    // Status is always Present (students have flexible personal batch timings)
    const status = "Present";

    const record = db.recordPunchIn({
      studentId: student.id || student.rollNo,
      student,
      date: dateStr,
      time: timeStr,
      lat: userLat || institute.latitude,
      lng: userLng || institute.longitude,
      distance: distance === 999999 ? 0 : distance,
      selfieImg,
      status
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
          punchInTime: timeStr,
          punchInLat: userLat || institute.latitude,
          punchInLng: userLng || institute.longitude,
          punchInDistance: distance === 999999 ? 0 : distance,
          status,
          verified: true
        },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.warn('MongoDB attendance punch in sync note:', e.message);
    }

    // Check if student has fee due within 7 days or overdue
    const feeReminder = checkStudentFeeDueStatus(student);

    return NextResponse.json({
      success: true,
      message: `Punch In successful!`,
      record,
      student,
      feeReminder
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
