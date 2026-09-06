import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateStudentFee } from '@/lib/feeHelper';
import { verifyAuth } from '@/lib/auth';
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
  const rateLimit = checkRateLimit(request, { maxRequests: 120, keyPrefix: 'students_list' });
  if (!rateLimit.allowed) return rateLimit.response;

  // Authorization: Requires Admin or Authenticated user
  const auth = verifyAuth(request, 'admin');
  if (!auth.authorized) {
    return auth.response;
  }

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
      }, { headers: cors.headers });
    }

    // 2. Fallback to local db if MongoDB is not connected
    const students = db.getStudents();
    return NextResponse.json({ success: true, count: students.length, students }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: cors.headers });
  }
}

export async function POST(request) {
  const cors = handleCors(request);

  // Rate limit
  const rateLimit = checkRateLimit(request, { maxRequests: 60, keyPrefix: 'students_create' });
  if (!rateLimit.allowed) return rateLimit.response;

  // Authorization: Requires Admin
  const auth = verifyAuth(request, 'admin');
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { rollNo, name, phone, email, password, course, remainingFee, dueDate, gender } = body;

    if (!rollNo || !name) {
      return NextResponse.json({
        success: false,
        message: 'Roll number and Name are required.'
      }, { status: 400, headers: cors.headers });
    }

    const newStudentData = {
      rollNo: rollNo.trim().toUpperCase(),
      name: name.trim(),
      phone: phone || '',
      email: email || '',
      password: password || '123456',
      course: course || 'Full Stack Web Development',
      remainingFee: Number(remainingFee != null ? remainingFee : 5000),
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      gender: gender || 'Male',
      status: 'approved',
      isApproved: true,
      active: true
    };

    // 1. Create in MongoDB Atlas
    let createdMongo = null;
    try {
      await connectToDatabase();
      createdMongo = await Student.create(newStudentData);
    } catch (e) {
      console.warn('MongoDB create student note:', e.message);
    }

    // 2. Create in local db
    let createdLocal = null;
    try {
      createdLocal = db.addStudent(newStudentData);
    } catch (e) {
      console.warn('Local db create student note:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Student added successfully',
      student: createdMongo || createdLocal || newStudentData
    }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400, headers: cors.headers });
  }
}
