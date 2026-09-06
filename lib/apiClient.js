'use client';

/**
 * Retrieve active auth token from localStorage / session
 */
export function getStoredToken() {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Direct sssam_token
    const token = localStorage.getItem('sssam_token');
    if (token) return token;

    // 2. In sssam_admin object
    const adminStr = localStorage.getItem('sssam_admin');
    if (adminStr) {
      const admin = JSON.parse(adminStr);
      if (admin && admin.token) return admin.token;
    }

    // 3. In sssam_user object
    const userStr = localStorage.getItem('sssam_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.token) return user.token;
    }
  } catch (err) {
    console.error('Error reading stored token:', err);
  }
  return null;
}

/**
 * Store auth token in localStorage and cookies
 */
export function setStoredToken(token, user = null) {
  if (typeof window === 'undefined') return;

  try {
    if (token) {
      localStorage.setItem('sssam_token', token);
      // Set cookie for Next.js SSR / API routes
      document.cookie = `sssam_token=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
    }
    if (user) {
      if (user.role === 'admin') {
        localStorage.setItem('sssam_admin', JSON.stringify({ ...user, token }));
      } else {
        localStorage.setItem('sssam_user', JSON.stringify({ ...user, token }));
      }
    }
  } catch (err) {
    console.error('Error setting stored token:', err);
  }
}

/**
 * Remove stored tokens on logout
 */
export function clearStoredToken() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('sssam_token');
    localStorage.removeItem('sssam_admin');
    localStorage.removeItem('sssam_user');
    sessionStorage.removeItem('sssam_admin_auth');
    document.cookie = 'sssam_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'sssam_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch (err) {
    console.error('Error clearing stored token:', err);
  }
}

/**
 * Authenticated fetch helper for client components
 */
export async function fetchWithAuth(url, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || 'same-origin'
  });

  return response;
}
