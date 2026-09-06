import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimiter';
import { handleCors } from '@/lib/cors';

export async function OPTIONS(request) {
  return handleCors(request).response;
}

export async function POST(request) {
  const cors = handleCors(request);

  // Rate limit admin login attempts (10 req / min)
  const rateLimit = checkRateLimit(request, {
    maxRequests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'auth_admin_login'
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Admin email and password are required.'
      }, { status: 400, headers: cors.headers });
    }

    const admin = db.verifyAdmin(email, password);

    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Admin credentials. (Use: admin@mohit.com / 1234567890)'
      }, { status: 401, headers: cors.headers });
    }

    // Generate signed JWT Token
    const token = createToken({
      id: 'admin',
      role: 'admin',
      email: admin.email,
      name: admin.name
    }, 7 * 24 * 3600);

    const userWithToken = {
      ...admin,
      token
    };

    const response = NextResponse.json({
      success: true,
      message: 'Admin login successful!',
      token,
      user: userWithToken
    }, { headers: cors.headers });

    // Set secure cookie
    response.cookies.set('sssam_admin_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600
    });

    response.cookies.set('sssam_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600
    });

    return response;
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: cors.headers });
  }
}
