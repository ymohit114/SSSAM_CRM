import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  rollNo: {
    type: String,
    uppercase: true,
    trim: true,
    default: '',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    default: '123456',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  course: {
    type: String,
    default: 'Not Assigned Yet',
  },
  feeType: {
    type: String,
    enum: ['single', 'installment'],
    default: 'single',
  },
  remainingFee: {
    type: Number,
    default: 0,
  },
  dueDate: {
    type: String,
    default: '',
  },
  installments: [
    {
      installmentNo: { type: Number, required: true },
      amount: { type: Number, required: true },
      dueDate: { type: String, required: true },
      status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' },
      paidDate: { type: String, default: null },
    }
  ],
  currentInstallment: {
    type: Number,
    default: 1,
  },
  totalInstallments: {
    type: Number,
    default: 1,
  },
  waivedFine: {
    type: Number,
    default: 0,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male',
  },
  active: {
    type: Boolean,
    default: true,
  },
  joinDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
