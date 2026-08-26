import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateStudentFee } from '@/lib/feeHelper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    let isMongoConnected = false;
    let mongoStudents = [];

    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      isMongoConnected = true;
      const docs = await Student.find({}).sort({ createdAt: -1 }).lean();
      mongoStudents = (docs || []).map(doc => {
        const s = {
          id: doc._id.toString(),
          _id: doc._id.toString(),
          rollNo: doc.rollNo,
          name: doc.name,
          phone: doc.phone,
          email: doc.email,
          password: doc.password,
          status: doc.status || (doc.isApproved ? 'approved' : 'pending'),
          isApproved: doc.isApproved != null ? doc.isApproved : doc.status === 'approved',
          course: doc.course || 'Not Assigned Yet',
          feeType: doc.feeType || 'single',
          totalCourseFee: doc.totalCourseFee || 0,
          paidAmount: doc.paidAmount || 0,
          remainingFee: doc.remainingFee != null ? doc.remainingFee : 0,
          dueDate: doc.dueDate || '',
          installments: doc.installments || [],
          currentInstallment: doc.currentInstallment || 1,
          totalInstallments: doc.totalInstallments || 1,
          waivedFine: doc.waivedFine || 0,
          gender: doc.gender || 'Male',
          active: doc.active !== false,
          joinDate: doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
        return {
          ...s,
          feeInfo: calculateStudentFee(s)
        };
      });
    } catch (mongoErr) {
      console.warn('MongoDB students query fallback note:', mongoErr.message);
    }

    if (isMongoConnected) {
      return NextResponse.json({
        success: true,
        count: mongoStudents.length,
        students: mongoStudents
      });
    }

    // 2. Fallback to local db if MongoDB is not connected
    const students = db.getStudents();
    return NextResponse.json({ success: true, count: students.length, students });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
