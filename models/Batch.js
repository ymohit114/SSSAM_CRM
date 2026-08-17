import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  timing: {
    type: String,
    default: '09:00 - 13:00',
  },
  totalStudents: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
