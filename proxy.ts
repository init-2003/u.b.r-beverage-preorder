import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  extractClientIp,
  extractCustomerIdFromToken,
} from '@/lib/rate-limit';
import { matchRateLimitPolicy } from '@/lib/rate-limit-config';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const customerToken = request.cookies.get('ubr_customer_token')?.value;
  const customerId = extractCustomerIdFromToken(customerToken);
  const isAuthenticated = Boolean(customerId);

  // 1. หน้า /login
  if (pathname === '/login') {
    const hasLoginParams =
      request.nextUrl.searchParams.has('cususer') ||
      request.nextUrl.searchParams.has('user') ||
      request.nextUrl.searchParams.has('username') ||
      request.nextUrl.search.includes('cususer=');

    if (isAuthenticated && !hasLoginParams) {
      // ล็อกอินอยู่แล้ว และไม่ได้ส่งพารามิเตอร์มาล็อกอินใหม่ พาไปหน้าหลัก หรือหน้าที่ต้องการ
      const redirectTarget = request.nextUrl.searchParams.get('redirect') || '/';
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
    return NextResponse.next();
  }

  // 2. ถ้าเป็น API endpoint — บังคับใช้ Rate Limiting
  if (pathname.startsWith('/api')) {
    const method = request.method;
    const policy = matchRateLimitPolicy(pathname, method);
    const clientIp = extractClientIp(request.headers);

    // Determine partition key
    let partitionKey = `ip:${clientIp}`;
    if (policy.useCustomerPartition && customerId) {
      partitionKey = `cus:${customerId}`;
    }

    const rateLimitKey = `rl:${policy.id}:${partitionKey}`;
    const result = checkRateLimit(rateLimitKey, policy.limit, policy.windowMs);

    // If rate limit exceeded, return HTTP 429 Too Many Requests
    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          tier: policy.tier,
          message: policy.message,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.retryAfter),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetTime),
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // If allowed, proceed and append standard rate limit headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetTime));

    return response;
  }

  // หน้าสาธารณะที่ไม่ต้องล็อกอิน (นโยบายความเป็นส่วนตัวและคุกกี้)
  const isPublicPolicy = pathname === '/cookie-policy' || pathname === '/privacy-policy';
  if (isPublicPolicy) {
    return NextResponse.next();
  }

  // 3. หน้าหน้าร้านทั้งหมด (เช่น /, /products, /cart, /checkout, /orders, /customer)
  // บังคับว่าต้องเข้าสู่ระบบก่อนเท่านั้น หากยังไม่เข้าสู่ระบบจะส่งไปหน้า /login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Intercept pages and APIs, excluding static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)$).*)',
  ],
};
