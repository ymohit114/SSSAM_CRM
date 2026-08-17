import mongoose from 'mongoose';

const InstituteSettingsSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'SSSAM Academy',
  },
  tagline: {
    type: String,
    default: 'Excellence in Education & Training',
  },
  address: {
    type: String,
    default: 'Ground Floor, M-24, near SBI Bank, Block M, Old DLF Colony, Sector 14, Gurugram, Haryana 122001',
  },
  latitude: {
    type: Number,
    default: 28.471764,
  },
  longitude: {
    type: Number,
    default: 77.045612,
  },
  geofenceRadius: {
    type: Number,
    default: 25, // 25 meters
  },
  requirePhoto: {
    type: Boolean,
    default: false,
  },
  startTime: {
    type: String,
    default: '09:00',
  },
  lateThresholdMinutes: {
    type: Number,
    default: 15,
  },
  endTime: {
    type: String,
    default: '17:00',
  },
  adminPin: {
    type: String,
    default: '1234',
  },
}, { timestamps: true, collection: 'institutesettings' });

export default mongoose.models.InstituteSettings || mongoose.model('InstituteSettings', InstituteSettingsSchema, 'institutesettings');
