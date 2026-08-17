import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    default: 'admin@mohit.com',
  },
  password: {
    type: String,
    required: true,
    default: '1234567890',
  },
  name: {
    type: String,
    default: 'Mohit Yadav (Admin)',
  },
  role: {
    type: String,
    default: 'admin',
  },
}, { timestamps: true });

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
