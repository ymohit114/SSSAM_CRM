import mongoose from 'mongoose';

const AppVersionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    default: '1.1.0',
  },
  versionCode: {
    type: Number,
    required: true,
    default: 2,
  },
  minVersion: {
    type: String,
    default: '1.0.0',
  },
  title: {
    type: String,
    default: 'New SSSAM Portal Update Available! 🚀',
  },
  description: {
    type: String,
    default: 'Enhancements, live database sync, and instant attendance updates.',
  },
  releaseNotes: {
    type: [String],
    default: [
      '⚡ Direct MongoDB Atlas sync for registrations and real-time approvals',
      '📍 Enhanced Campus Geofence Accuracy & Instant Punch In/Out',
      '🔔 Automated Fee Due Reminders & Push Alerts',
      '🛡️ Performance optimizations and battery savings'
    ],
  },
  apkUrl: {
    type: String,
    default: 'https://sssam-crm.vercel.app/SSSAM-Portal.apk',
  },
  apkSize: {
    type: String,
    default: '8.8 MB',
  },
  forceUpdate: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

export default mongoose.models.AppVersion || mongoose.model('AppVersion', AppVersionSchema);
