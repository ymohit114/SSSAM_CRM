import { NextResponse } from 'next/server';

/**
 * In-memory sliding-window store for IP rate limiting
 */
const rateLimitMap = new Map();

// Periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitMap.entries()) {
      if (data.expiresAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Extract Client IP from Request headers
 */
export function getClientIp(request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim();

    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp) return cfIp.trim();
  } catch (err) {
    console.error('Error getting client IP:', err);
  }
  return '127.0.0.1';
}

/**
 * Check Rate Limit for Request
 * @param {Request} request
 * @param {object} options
 * @param {number} options.maxRequests - Max allowed requests in window (default 120)
 * @param {number} options.windowMs - Window time in milliseconds (default 60,000ms / 1 min)
 * @param {string} options.keyPrefix - Prefix for specific route group (e.g. 'auth_login')
 * @returns {{ allowed: boolean, remaining: number, resetTime: number, response?: NextResponse }}
 */
export function checkRateLimit(request, options = {}) {
  const {
    maxRequests = 120,
    windowMs = 60 * 1000,
    keyPrefix = 'global'
  } = options;

  const ip = getClientIp(request);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  let record = rateLimitMap.get(key);

  if (!record || record.expiresAt < now) {
    record = {
      count: 1,
      expiresAt: now + windowMs
    };
    rateLimitMap.set(key, record);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: record.expiresAt
    };
  }

  record.count += 1;

  if (record.count > maxRequests) {
    const retryAfterSec = Math.ceil((record.expiresAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.expiresAt,
      response: NextResponse.json({
        success: false,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please wait ${retryAfterSec} seconds before trying again.`
      }, {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.expiresAt / 1000))
        }
      })
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.expiresAt
  };
}
