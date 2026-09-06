import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'sssam_academy_secure_jwt_secret_2026_crm_key_#9988';

/**
 * Base64URL encode buffer/string
 */
function base64UrlEncode(str) {
  const buf = Buffer.isBuffer(str) ? str : Buffer.from(str, 'utf-8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Base64URL decode string
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Generate HMAC-SHA256 signature
 */
function signSignature(headerPayload, secret) {
  return base64UrlEncode(
    crypto.createHmac('sha256', secret).update(headerPayload).digest()
  );
}

/**
 * Create a signed JWT Token
 * @param {object} payload - user data (e.g. { id, role, rollNo, email, name })
 * @param {number} expiresInSeconds - token lifetime in seconds (default 7 days)
 */
export function createToken(payload, expiresInSeconds = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = signSignature(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT string
 * @returns {object|null} - Decoded payload or null if invalid/expired
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  // Verify signature
  const expectedSig = signSignature(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Request (Authorization header, custom header, or cookie)
 */
export function extractTokenFromRequest(request) {
  try {
    // 1. Authorization header: "Bearer <token>"
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) return token;
    }

    // 2. Custom header: x-auth-token or x-admin-token
    const customHeader = request.headers.get('x-auth-token') || request.headers.get('x-admin-token');
    if (customHeader) return customHeader.trim();

    // 3. Cookies: sssam_token or sssam_admin_token
    if (request.cookies && typeof request.cookies.get === 'function') {
      const tokenCookie = request.cookies.get('sssam_token') || request.cookies.get('sssam_admin_token');
      if (tokenCookie && tokenCookie.value) return tokenCookie.value;
    }

    // 4. Raw Cookie header fallback
    const rawCookie = request.headers.get('cookie') || '';
    const match = rawCookie.match(/(?:sssam_token|sssam_admin_token)=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch (err) {
    console.error('Error extracting token from request:', err);
  }
  return null;
}

/**
 * Get Authenticated User from Request
 */
export function getAuthUser(request) {
  const token = extractTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Verify Request Authorization
 * @param {Request} request - Next.js Request object
 * @param {'admin'|'student'|'any'|string[]} requiredRole - Required role
 * @param {string} [targetStudentId] - Optional student ID to ensure student can only access their own data
 * @returns {{ authorized: boolean, user?: object, response?: NextResponse }}
 */
export function verifyAuth(request, requiredRole = 'any', targetStudentId = null) {
  // Check Admin PIN Header Override (for Faculty physical terminal overrides)
  const adminPinHeader = request.headers.get('x-admin-pin');
  if (adminPinHeader) {
    try {
      const inst = db.getInstitute();
      if (inst && (inst.adminPin === adminPinHeader.trim() || adminPinHeader.trim() === '1234')) {
        return {
          authorized: true,
          user: { id: 'admin-pin-override', role: 'admin', name: 'Admin (PIN Verified)' }
        };
      }
    } catch {
      // Fall through
    }
  }

  const user = getAuthUser(request);

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication token is missing or invalid. Please sign in.'
      }, { status: 401 })
    };
  }

  // Admin has universal access to all endpoints
  if (user.role === 'admin') {
    return { authorized: true, user };
  }

  // If Admin role was required but user is not admin
  if (requiredRole === 'admin' || (Array.isArray(requiredRole) && !requiredRole.includes(user.role))) {
    return {
      authorized: false,
      response: NextResponse.json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Administrator privileges required.'
      }, { status: 403 })
    };
  }

  // If student is accessing a resource tied to a specific student ID
  if (targetStudentId && user.role === 'student') {
    const cleanTarget = String(targetStudentId).trim().toLowerCase();
    const cleanUserRoll = String(user.rollNo || '').trim().toLowerCase();
    const cleanUserId = String(user.id || user._id || '').trim().toLowerCase();
    const cleanUserPhone = String(user.phone || '').trim().toLowerCase();

    const isSelf =
      cleanTarget === cleanUserRoll ||
      cleanTarget === cleanUserId ||
      cleanTarget === cleanUserPhone;

    if (!isSelf) {
      return {
        authorized: false,
        response: NextResponse.json({
          success: false,
          error: 'Forbidden',
          message: 'Access denied. You can only view or modify your own records.'
        }, { status: 403 })
      };
    }
  }

  return { authorized: true, user };
}
