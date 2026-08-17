import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({
        success: false,
        message: 'Roll Number / Mobile Number and Password are required.'
      }, { status: 400 });
    }

    const student = db.verifyStudent(identifier, password);

    if (!student) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Mobile Number, Roll Number, or Password.'
      }, { status: 401 });
    }

    // Check if account is still pending admin approval
    if (student.isPending) {
      return NextResponse.json({
        success: false,
        isPending: true,
        message: `Namaste ${student.name}! Aapka account Admin verification ke liye pending hai. Admin approval ke baad aapka Roll Number assign hoga aur login active ho jayega.`
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: `Welcome back, ${student.name}!`,
      user: student
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
