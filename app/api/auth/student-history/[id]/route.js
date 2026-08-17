import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Student ID is required.' }, { status: 400 });
    }

    const data = db.getStudentHistory(id);

    if (!data.student) {
      return NextResponse.json({ success: false, message: 'Student not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
