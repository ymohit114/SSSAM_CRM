import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = db.getInstitute();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      name,
      tagline,
      address,
      latitude,
      longitude,
      geofenceRadius,
      requirePhoto,
      startTime,
      lateThresholdMinutes,
      endTime,
      adminPin
    } = body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (tagline !== undefined) updates.tagline = tagline;
    if (address !== undefined) updates.address = address;
    if (latitude !== undefined) updates.latitude = parseFloat(latitude);
    if (longitude !== undefined) updates.longitude = parseFloat(longitude);
    if (geofenceRadius !== undefined) updates.geofenceRadius = Math.max(10, parseInt(geofenceRadius, 10));
    if (requirePhoto !== undefined) updates.requirePhoto = Boolean(requirePhoto);
    if (startTime !== undefined) updates.startTime = startTime;
    if (lateThresholdMinutes !== undefined) updates.lateThresholdMinutes = parseInt(lateThresholdMinutes, 10);
    if (endTime !== undefined) updates.endTime = endTime;
    if (adminPin !== undefined) updates.adminPin = adminPin;

    const updated = db.updateInstitute(updates);
    return NextResponse.json({ success: true, message: 'Settings updated successfully', settings: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
