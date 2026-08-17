import { NextResponse } from 'next/server';
import AppVersion from '@/models/AppVersion';
import { connectToDatabase } from '@/lib/mongodb';
import { CURRENT_APP_VERSION } from '@/config/appVersion';

const DEFAULT_VERSION_INFO = {
  version: '1.1.0',
  versionCode: 2,
  minVersion: '1.0.0',
  title: 'New SSSAM Portal Update Available! 🚀',
  description: 'Enhancements, live database sync, and instant attendance updates.',
  releaseNotes: [
    '⚡ Direct MongoDB Atlas sync for registrations and real-time approvals',
    '📍 Enhanced Campus Geofence Accuracy & Instant Punch In/Out',
    '🔔 Automated Fee Due Reminders & Push Alerts',
    '🛡️ Performance optimizations and battery savings'
  ],
  apkUrl: 'https://sssam-crm.vercel.app/SSSAM-Portal.apk',
  apkSize: '8.8 MB',
  forceUpdate: false,
  active: true,
  updatedAt: new Date().toISOString()
};

export async function GET() {
  try {
    let versionInfo = null;

    try {
      await connectToDatabase();
      const latestDoc = await AppVersion.findOne({ active: true }).sort({ createdAt: -1 }).lean();
      if (latestDoc) {
        versionInfo = {
          id: latestDoc._id.toString(),
          version: latestDoc.version,
          versionCode: latestDoc.versionCode,
          minVersion: latestDoc.minVersion,
          title: latestDoc.title,
          description: latestDoc.description,
          releaseNotes: latestDoc.releaseNotes || [],
          apkUrl: latestDoc.apkUrl || 'https://sssam-crm.vercel.app/SSSAM-Portal.apk',
          apkSize: latestDoc.apkSize || '8.8 MB',
          forceUpdate: Boolean(latestDoc.forceUpdate),
          updatedAt: latestDoc.updatedAt || latestDoc.createdAt
        };
      }
    } catch (e) {
      console.warn('MongoDB app-version fallback notice:', e.message);
    }

    if (!versionInfo) {
      versionInfo = DEFAULT_VERSION_INFO;
    }

    return NextResponse.json({
      success: true,
      currentClientVersion: CURRENT_APP_VERSION,
      latestVersion: versionInfo
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err.message,
      currentClientVersion: CURRENT_APP_VERSION,
      latestVersion: DEFAULT_VERSION_INFO
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      version,
      versionCode,
      minVersion,
      title,
      description,
      releaseNotes,
      apkUrl,
      apkSize,
      forceUpdate
    } = body;

    if (!version) {
      return NextResponse.json({ success: false, message: 'Version string (e.g. 1.1.0) is required.' }, { status: 400 });
    }

    let savedDoc = null;

    try {
      await connectToDatabase();
      
      const newVersion = await AppVersion.create({
        version: String(version).trim(),
        versionCode: Number(versionCode) || 2,
        minVersion: String(minVersion || '1.0.0').trim(),
        title: title || `SSSAM Academy Update v${version}`,
        description: description || 'New features and improvements',
        releaseNotes: Array.isArray(releaseNotes) ? releaseNotes : (releaseNotes ? releaseNotes.split('\n').filter(Boolean) : []),
        apkUrl: apkUrl || 'https://sssam-crm.vercel.app/SSSAM-Portal.apk',
        apkSize: apkSize || '8.8 MB',
        forceUpdate: Boolean(forceUpdate),
        active: true
      });

      savedDoc = newVersion;
    } catch (dbErr) {
      console.warn('MongoDB app-version save error:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      message: `In-App Update v${version} published successfully!`,
      version: savedDoc || body
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
