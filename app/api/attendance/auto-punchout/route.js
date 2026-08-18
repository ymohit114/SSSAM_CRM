import { NextResponse } from 'next/server';
import { executeAutoPunchOut } from '@/lib/autoPunchOutService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const result = await executeAutoPunchOut({ force });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    const result = await executeAutoPunchOut({ force });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
