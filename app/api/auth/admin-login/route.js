import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Admin email and password are required.'
      }, { status: 400 });
    }

    const admin = db.verifyAdmin(email, password);

    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Admin credentials. (Use: admin@mohit.com / 1234567890)'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin login successful!',
      user: admin
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
