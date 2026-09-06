import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Student from '@/models/Student';
import { connectToDatabase } from '@/lib/mongodb';
import { calculateStudentFee } from '@/lib/feeHelper';
import { verifyAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimiter';
import { handleCors } from '@/lib/cors';

export async function OPTIONS(request) {
  return handleCors(request).response;
}

export async function POST(request, { params }) {
  const cors = handleCors(request);

  // Rate limit
  const rateLimit = checkRateLimit(request, { maxRequests: 60, keyPrefix: 'student_approve' });
  if (!rateLimit.allowed) return rateLimit.response;

  // Authorization: Requires Admin
  const auth = verifyAuth(request, 'admin');
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = params;
    const body = await request.json();
    const {
      rollNo,
      course,
      phone,
      email,
      name,
      feeType = 'single',
      remainingFee,
      dueDate,
      installments = [],
      totalInstallments = 1
    } = body;

    if (!rollNo || !course) {
      return NextResponse.json({
        success: false,
        message: 'Roll Number and Course Name are required for approval.'
      }, { status: 400, headers: cors.headers });
    }

    const cleanRollNo = rollNo.trim().toUpperCase();
    let approvedStudent = null;

    // 1. Update in MongoDB Atlas
    try {
      await connectToDatabase();
      
      const orConditions = [];
      if (id && mongoose.Types.ObjectId.isValid(id)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      if (id) {
        orConditions.push({ rollNo: id });
        orConditions.push({ rollNo: id.toUpperCase() });
        orConditions.push({ phone: id });
      }
      if (phone) {
        orConditions.push({ phone: phone });
      }
      if (email) {
        orConditions.push({ email: email.toLowerCase() });
      }
      if (cleanRollNo) {
        orConditions.push({ rollNo: cleanRollNo });
      }

      const updateData = {
        rollNo: cleanRollNo,
        course: course.trim(),
        feeType,
        remainingFee: Number(remainingFee || 0),
        dueDate: dueDate || '',
        installments,
        currentInstallment: 1,
        totalInstallments: Number(totalInstallments || (installments.length || 1)),
        status: 'approved',
        isApproved: true
      };

      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (email) updateData.email = email;
      if (body.password) updateData.password = body.password.trim();

      const updatedDoc = await Student.findOneAndUpdate(
        { $or: orConditions },
        { $set: updateData },
        { new: true }
      ).lean();

      if (updatedDoc) {
        approvedStudent = {
          id: updatedDoc._id.toString(),
          rollNo: updatedDoc.rollNo,
          name: updatedDoc.name,
          phone: updatedDoc.phone,
          email: updatedDoc.email,
          password: updatedDoc.password,
          status: 'approved',
          isApproved: true,
          course: updatedDoc.course,
          feeType: updatedDoc.feeType,
          remainingFee: updatedDoc.remainingFee,
          dueDate: updatedDoc.dueDate,
          installments: updatedDoc.installments,
          currentInstallment: updatedDoc.currentInstallment,
          totalInstallments: updatedDoc.totalInstallments,
          gender: updatedDoc.gender || 'Male'
        };
      }
    } catch (mongoErr) {
      console.warn('MongoDB approval update note:', mongoErr.message);
    }

    // 2. Also try approving in local db
    try {
      const localResult = db.approveStudent(id, {
        rollNo: cleanRollNo,
        course,
        feeType,
        remainingFee: Number(remainingFee || 0),
        dueDate: dueDate || '',
        installments,
        totalInstallments
      });
      if (!approvedStudent) approvedStudent = localResult;
    } catch (localErr) {
      console.log('Local db approve note:', localErr.message);
    }

    if (!approvedStudent) {
      return NextResponse.json({ success: false, message: 'Student record not found for approval.' }, { status: 404, headers: cors.headers });
    }

    const studentWithFee = {
      ...approvedStudent,
      feeInfo: calculateStudentFee(approvedStudent)
    };

    return NextResponse.json({
      success: true,
      message: `Student ${approvedStudent.name} (${approvedStudent.rollNo}) has been approved and activated!`,
      student: studentWithFee
    }, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: cors.headers });
  }
}
