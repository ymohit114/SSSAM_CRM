import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const batches = db.getBatches();
    return NextResponse.json({ success: true, batches });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, timing } = body;
    if (!name) return NextResponse.json({ success: false, message: 'Batch name is required' }, { status: 400 });
    const batch = db.addBatch({ name, timing });
    return NextResponse.json({ success: true, message: 'Batch created', batch }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Batch ID is required' }, { status: 400 });
    db.deleteBatch(id);
    return NextResponse.json({ success: true, message: 'Batch deleted' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
