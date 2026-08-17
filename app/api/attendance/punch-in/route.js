import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateDistance } from '@/lib/geo';
import { checkStudentFeeDueStatus } from '@/lib/feeReminderService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, lat, lng, selfieImg, overrideDistance } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'Student ID is required.' }, { status: 400 });
    }

    const student = db.getStudentById(studentId);
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
        message: `Punch In Failed: You are ${Math.round(distance)}m away from ${institute.name}. Maximum allowed distance is ${maxRadius}m. Please be inside campus.`,
        currentDistance: distance,
        maxRadius
      }, { status: 403 });
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    // Status is always Present (students have flexible personal batch timings)
    const status = "Present";

    const record = db.recordPunchIn({
      studentId: student.id,
      date: dateStr,
      time: timeStr,
      lat: userLat || institute.latitude,
      lng: userLng || institute.longitude,
      distance: distance === 999999 ? 0 : distance,
      selfieImg,
      status
    });

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
