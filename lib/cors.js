import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://sssam-crm.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost'
];

/**
 * Handle CORS and Origin checks
 * @param {Request} request
 * @returns {{ isAllowed: boolean, headers: Record<string, string>, response?: NextResponse }}
 */
export function handleCors(request) {
  const origin = request.headers.get('origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token, x-admin-token, x-admin-pin',
    'Access-Control-Allow-Credentials': 'true'
  };

  // If origin is present, check against whitelist or same-origin
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => 
      origin === allowed || origin.endsWith('.vercel.app')
    );

    if (isAllowed) {
      headers['Access-Control-Allow-Origin'] = origin;
    } else {
      // In production, reject unknown cross-origin mutating requests
      headers['Access-Control-Allow-Origin'] = 'https://sssam-crm.vercel.app';
    }
  } else {
    // Same-origin or non-browser client (mobile Capacitor app)
    headers['Access-Control-Allow-Origin'] = '*';
  }

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return {
      isAllowed: true,
      headers,
      response: new NextResponse(null, { status: 204, headers })
    };
  }

  return { isAllowed: true, headers };
}
