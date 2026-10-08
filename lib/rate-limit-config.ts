/**
 * Rate Limiting Policies & Route Mapping Configuration
 * Defined based on the approved 5-Tier Strategy in plan_rate_limiting.md
 */

export interface RateLimitPolicy {
  id: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4' | 'Tier 5';
  limit: number;
  windowMs: number;
  useCustomerPartition?: boolean;
  message: string;
}

export const RATE_LIMIT_POLICIES: Record<string, RateLimitPolicy> = {
  // Tier 1: Sensitive Auth (Login brute force & credential stuffing protection)
  LOGIN: {
    id: 'login',
    tier: 'Tier 1',
    limit: 20, // 20 requests per minute
    windowMs: 60 * 1000, // 1 minute
    useCustomerPartition: false, // strictly partition by IP to prevent brute forcing
    message: 'พยายามเข้าสู่ระบบถี่เกินไป เพื่อความปลอดภัยกรุณารอ 1 นาทีก่อนลองใหม่',
  },

  // Tier 2: Heavy Tasks (OCR Slip Scanning via Python/Sharp/Tesseract)
  UPLOAD_SLIP: {
    id: 'upload_slip',
    tier: 'Tier 2',
    limit: 30, // 30 requests per minute
    windowMs: 60 * 1000,
    useCustomerPartition: false,
    message: 'อัปโหลดสลิปถี่เกินไป กรุณารอสักครู่ก่อนอัปโหลดใหม่',
  },

  // Tier 2: Heavy Tasks (PDF Generation via Puppeteer)
  PDF_GENERATION: {
    id: 'pdf_gen',
    tier: 'Tier 2',
    limit: 30, // 30 requests per minute
    windowMs: 60 * 1000,
    useCustomerPartition: true,
    message: 'กำลังสร้างไฟล์เอกสาร PDF ถี่เกินไป กรุณารอสักครู่ก่อนดาวน์โหลดใหม่',
  },

  // Tier 3: Transactional (Order Placement & DB Sequence Lock on PBM_CTRL)
  CHECKOUT: {
    id: 'checkout',
    tier: 'Tier 3',
    limit: 40, // 40 requests per minute
    windowMs: 60 * 1000,
    useCustomerPartition: true,
    message: 'ทำรายการสั่งจองถี่เกินไป กรุณารอสักครู่เพื่อป้องกันคำสั่งซื้อซ้ำซ้อน',
  },

  // Tier 3: Sensitive Document Lookup (Prevent guessing docNo / password params)
  ORDER_DETAIL: {
    id: 'order_detail',
    tier: 'Tier 3',
    limit: 120, // 120 requests per minute (2 req/sec)
    windowMs: 60 * 1000,
    useCustomerPartition: true,
    message: 'เรียกดูข้อมูลเอกสารคำสั่งซื้อถี่เกินไป กรุณารอสักครู่',
  },

  // Tier 4: Interactive (Cart mutations & reads)
  CART: {
    id: 'cart',
    tier: 'Tier 4',
    limit: 240, // 240 requests per minute (4 req/sec)
    windowMs: 60 * 1000,
    useCustomerPartition: true,
    message: 'อัปเดตตะกร้าสินค้าถี่เกินไป กรุณารอสักครู่',
  },

  // Tier 4: Account & Order History
  ACCOUNT: {
    id: 'account',
    tier: 'Tier 4',
    limit: 240, // 240 requests per minute (4 req/sec)
    windowMs: 60 * 1000,
    useCustomerPartition: true,
    message: 'เรียกใช้งานข้อมูลบัญชีถี่เกินไป กรุณารอสักครู่',
  },

  // Tier 5: Public Catalog & Browsing
  CATALOG: {
    id: 'catalog',
    tier: 'Tier 5',
    limit: 600, // 600 requests per minute (10 req/sec)
    windowMs: 60 * 1000,
    useCustomerPartition: false,
    message: 'เรียกดูข้อมูลสินค้าถี่เกินไป กรุณารอสักครู่',
  },

  // Tier 5: Global Fallback for any other API route
  GLOBAL_API: {
    id: 'global_api',
    tier: 'Tier 5',
    limit: 1000, // 1,000 requests per minute
    windowMs: 60 * 1000,
    useCustomerPartition: false,
    message: 'มีการส่งคำขอมายังระบบถี่เกินไป กรุณารอสักครู่',
  },
};

/**
 * Determine the matching RateLimitPolicy for a given URL pathname and HTTP method.
 */
export function matchRateLimitPolicy(
  pathname: string,
  method: string
): RateLimitPolicy {
  const normPath = pathname.toLowerCase();
  const normMethod = method.toUpperCase();

  // 1. Login
  if (normPath === '/api/auth/login' && normMethod === 'POST') {
    return RATE_LIMIT_POLICIES.LOGIN;
  }

  // 2. Slip upload
  if (normPath === '/api/upload') {
    return RATE_LIMIT_POLICIES.UPLOAD_SLIP;
  }

  // 3. PDF generation
  if (
    normPath.includes('/pdf') ||
    normPath === '/api/orders/purchase-order/downloads'
  ) {
    return RATE_LIMIT_POLICIES.PDF_GENERATION;
  }

  // 4. Order creation (POST /api/orders)
  if (normPath === '/api/orders' && normMethod === 'POST') {
    return RATE_LIMIT_POLICIES.CHECKOUT;
  }

  // 5. Order detail view (GET /api/orders/[docNo])
  if (normPath.startsWith('/api/orders/') && normMethod === 'GET') {
    return RATE_LIMIT_POLICIES.ORDER_DETAIL;
  }

  // 6. Cart
  if (normPath.startsWith('/api/cart')) {
    return RATE_LIMIT_POLICIES.CART;
  }

  // 7. Account / Session / Order History
  if (
    normPath.startsWith('/api/customer/account') ||
    normPath === '/api/auth/me' ||
    normPath === '/api/auth/logout' ||
    (normPath === '/api/orders' && normMethod === 'GET')
  ) {
    return RATE_LIMIT_POLICIES.ACCOUNT;
  }

  // 8. Catalog (Products, Categories, Carousel, Bank Accounts)
  if (
    normPath.startsWith('/api/products') ||
    normPath.startsWith('/api/categories') ||
    normPath.startsWith('/api/carousel') ||
    normPath.startsWith('/api/bank-accounts')
  ) {
    return RATE_LIMIT_POLICIES.CATALOG;
  }

  // 9. Default Global API
  return RATE_LIMIT_POLICIES.GLOBAL_API;
}
