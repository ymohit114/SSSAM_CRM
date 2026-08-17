import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const students = db.getStudents();
    return NextResponse.json({ success: true, count: students.length, students });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { rollNo, name, batchId, phone, email, gender, joinDate } = body;
    if (!rollNo || !name) {
      return NextResponse.json({ success: false, message: 'Roll number and name are required.' }, { status: 400 });
    }

    const newStudent = db.addStudent({ rollNo, name, batchId, phone, email, gender, joinDate });
    return NextResponse.json({ success: true, message: 'Student registered successfully', student: newStudent }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
