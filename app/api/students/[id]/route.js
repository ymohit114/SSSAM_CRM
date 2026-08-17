import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const student = db.getStudentById(params.id);
    if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    return NextResponse.json({ success: true, student });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const updated = db.updateStudent(params.id, body);
    return NextResponse.json({ success: true, message: 'Student updated successfully', student: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    db.deleteStudent(params.id);
    return NextResponse.json({ success: true, message: 'Student removed successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
