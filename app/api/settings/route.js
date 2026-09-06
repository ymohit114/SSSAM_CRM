import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import InstituteSettings from '@/models/InstituteSettings';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyAuth, getAuthUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimiter';
import { handleCors } from '@/lib/cors';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS(request) {
  return handleCors(request).response;
}

export async function GET(request) {
  const cors = handleCors(request);

  // Rate limit
  const rateLimit = checkRateLimit(request, { maxRequests: 120, keyPrefix: 'settings_get' });
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    let settings = null;
    try {
      await connectToDatabase();
      const mongoSettings = await InstituteSettings.findOne({}).lean();
      if (mongoSettings) {
        settings = {
          name: mongoSettings.name || 'SSSAM Academy',
          tagline: mongoSettings.tagline || 'Excellence in Education & Training',
          address: mongoSettings.address || 'Ground Floor, M-24, near SBI Bank, Block M, Old DLF Colony, Sector 14, Gurugram, Haryana 122001',
          latitude: mongoSettings.latitude ?? 28.471764,
          longitude: mongoSettings.longitude ?? 77.045612,
          geofenceRadius: mongoSettings.geofenceRadius ?? 25,
          requirePhoto: Boolean(mongoSettings.requirePhoto),
          startTime: mongoSettings.startTime || '09:00',
          lateThresholdMinutes: mongoSettings.lateThresholdMinutes ?? 15,
          endTime: mongoSettings.endTime || '17:00',
          adminPin: mongoSettings.adminPin || '1234'
        };
      }
    } catch (e) {
      console.warn('MongoDB settings fetch note:', e.message);
    }

    if (!settings) {
      settings = db.getInstitute();
    }

    const user = getAuthUser(request);
    const isAdmin = user && user.role === 'admin';

    // Mask sensitive adminPin if not admin
    const safeSettings = {
      ...settings,
      adminPin: isAdmin ? settings.adminPin : '****'
    };

    return NextResponse.json({ success: true, settings: safeSettings }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: cors.headers });
  }
}

export async function PUT(request) {
  const cors = handleCors(request);

  // Authorization: Requires Admin
  const auth = verifyAuth(request, 'admin');
  if (!auth.authorized) {
    return auth.response;
  }

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

    // Sync to MongoDB Atlas
    try {
      await connectToDatabase();
      await InstituteSettings.findOneAndUpdate(
        {},
        { $set: updates },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (e) {
      console.warn('MongoDB settings sync note:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updated
    }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400, headers: cors.headers });
  }
}
