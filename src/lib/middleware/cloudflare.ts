// ============================================
// Cloudflare Configuration
// ============================================

/**
 * Cloudflare middleware for Next.js
 * Handles edge functions, geo-routing, and DDoS protection
 */

import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (we handle API separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get client IP for rate limiting and geo-routing
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Add Cloudflare-specific headers
  response.headers.set('X-Client-IP', clientIP);
  
  // Geo location headers (added by Cloudflare)
  const cfCountry = request.headers.get('cf-ipcountry');
  const cfCity = request.headers.get('cf-ipcity');
  const cfRegion = request.headers.get('cf-region');
  
  if (cfCountry) {
    response.headers.set('X-Geo-Country', cfCountry);
    response.headers.set('X-Geo-City', cfCity || '');
    response.headers.set('X-Geo-Region', cfRegion || '');
  }

  // Handle country-specific redirects
  const { pathname } = request.nextUrl;
  
  // Only check for geo-routing on homepage
  if (pathname === '/') {
    // Rwanda-focused: default to Rwanda
    // Could add country-specific content here
  }

  // Security headers (Cloudflare handles most, but we add extra)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

// ============================================
// Edge Function: Geo-Routing
// ============================================

export function getGeoFromRequest(request: NextRequest): {
  country: string;
  city: string;
  region: string;
  latitude: string;
  longitude: string;
} {
  return {
    country: request.headers.get('cf-ipcountry') || 'RW',
    city: request.headers.get('cf-ipcity') || 'Kigali',
    region: request.headers.get('cf-region') || '',
    latitude: request.headers.get('cf-latitude') || '-1.9403',
    longitude: request.headers.get('cf-longitude') || '29.8739',
  };
}

// ============================================
// Edge Function: Auth Check
// ============================================

export async function authMiddleware(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  role?: string;
}> {
  // Check for auth token in cookies or headers
  const authToken = request.cookies.get('auth-token')?.value 
    || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!authToken) {
    return { isAuthenticated: false };
  }

  // In production, validate token at edge for performance
  // This would call a lightweight edge function
  try {
    // Simplified validation - in production use JWT verification
    const parts = authToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return {
        isAuthenticated: true,
        userId: payload.sub,
        role: payload.role,
      };
    }
  } catch {
    return { isAuthenticated: false };
  }

  return { isAuthenticated: false };
}

// ============================================
// Rate Limiting Helper
// ============================================

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / (windowSeconds * 1000))}`;
  
  const current = rateLimitStore.get(key) || { count: 0, reset: now + windowSeconds * 1000 };
  
  if (now > current.reset) {
    // Reset window
    current.count = 1;
    current.reset = now + windowSeconds * 1000;
  } else {
    current.count++;
  }
  
  rateLimitStore.set(key, current);
  
  const remaining = Math.max(0, limit - current.count);
  
  return {
    success: current.count <= limit,
    remaining,
    reset: current.reset,
  };
}
