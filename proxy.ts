import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  extractClientIp,
  extractCustomerIdFromToken,
} from '@/lib/rate-limit';
import { matchRateLimitPolicy } from '@/lib/rate-limit-config';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only apply rate limiting to /api routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const method = request.method;
  const policy = matchRateLimitPolicy(pathname, method);
  const clientIp = extractClientIp(request.headers);

  // Determine partition key
  let partitionKey = `ip:${clientIp}`;
  if (policy.useCustomerPartition) {
    const customerToken = request.cookies.get('ubr_customer_token')?.value;
    const customerId = extractCustomerIdFromToken(customerToken);
    if (customerId) {
      partitionKey = `cus:${customerId}`;
    }
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

// Intercept only API endpoints
export const config = {
  matcher: ['/api/:path*'],
};
