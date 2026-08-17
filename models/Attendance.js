import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true,
  },
  studentId: {
    type: String,
    required: true,
    index: true,
  },
  rollNo: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  punchInTime: {
    type: String, // HH:MM:SS
    default: null,
  },
  punchInLat: {
    type: Number,
    default: null,
  },
  punchInLng: {
    type: Number,
    default: null,
  },
  punchInDistance: {
    type: Number,
    default: 0,
  },
  punchInSelfie: {
    type: String,
    default: null,
  },
  punchOutTime: {
    type: String,
    default: null,
  },
  punchOutLat: {
    type: Number,
    default: null,
  },
  punchOutLng: {
    type: Number,
    default: null,
  },
  punchOutDistance: {
    type: Number,
    default: null,
  },
  punchOutSelfie: {
    type: String,
    default: null,
  },
  studySummary: {
    type: String,
    default: '', // Min 20 characters on punch out
  },
  durationMinutes: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent', 'Leave'],
    default: 'Present',
  },
  remarks: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
