import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isWithinGeofence } from '@/lib/geo';

export async function GET(request, { params }) {
  try {
    const { studentId } = params;
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const student = db.getStudentById(studentId);
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const todayRecord = db.getTodayRecord(student.id, dateStr);
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
