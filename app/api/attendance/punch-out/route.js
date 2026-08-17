import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateDistance } from '@/lib/geo';

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, lat, lng, selfieImg, studySummary, overrideDistance } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'Student ID is required.' }, { status: 400 });
    }

    if (!studySummary || studySummary.trim().length < 20) {
      return NextResponse.json({
        success: false,
        message: 'Daily study summary is required (Minimum 20 characters).'
      }, { status: 400 });
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
        message: `Punch Out Failed: You are ${Math.round(distance)}m away from ${institute.name}. Maximum allowed distance is ${maxRadius}m.`,
        currentDistance: distance,
        maxRadius
      }, { status: 403 });
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const record = db.recordPunchOut({
      studentId: student.id,
      date: dateStr,
      time: timeStr,
      lat: userLat || institute.latitude,
      lng: userLng || institute.longitude,
      distance: distance === 999999 ? 0 : distance,
      selfieImg,
      studySummary: studySummary.trim()
    });

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
