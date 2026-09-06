import { NextResponse } from 'next/server';
import { executeAutoPunchOut } from '@/lib/autoPunchOutService';
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
  const rateLimit = checkRateLimit(request, { maxRequests: 60, keyPrefix: 'auto_punchout' });
  if (!rateLimit.allowed) return rateLimit.response;

  // Check Cron Authorization or Admin
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'sssam_cron_secret_2026';
  const isCron = authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const auth = verifyAuth(request, 'admin');
    if (!auth.authorized) return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const result = await executeAutoPunchOut({ force });
    return NextResponse.json(result, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: cors.headers });
  }
}

export async function POST(request) {
  const cors = handleCors(request);

  // Authorization: Requires Admin or Cron Secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'sssam_cron_secret_2026';
  const isCron = authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const auth = verifyAuth(request, 'admin');
    if (!auth.authorized) return auth.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    const result = await executeAutoPunchOut({ force });
    return NextResponse.json(result, { headers: cors.headers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: cors.headers });
  }
}
