/**
 * Comprehensive Input Validation & Sanitization Engine for U.B.R Beverage Pre-Order
 * Protects against SQL Injection, Command Injection, Path Traversal, and NoSQL / Object Injection.
 */

// Strict pattern for document numbers (e.g. ORD69000888, ORDautorun)
const DOC_NO_REGEX = /^[A-Za-z0-9_-]{3,50}$/;

// Strict pattern for product/trade IDs (alphanumeric, dashes, underscores)
const TRADE_ID_REGEX = /^[A-Za-z0-9_.\s\/-]{1,50}$/;

// Safe filename regex (allows only alphanumeric, hyphen, underscore, dot)
const SAFE_FILENAME_REGEX = /^[A-Za-z0-9_.-]+$/;

// Allowed file extensions for uploads
const ALLOWED_UPLOAD_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

// Suspicious SQL / Command / NoSQL injection signatures
const INJECTION_PATTERNS = [
  // SQL Injection patterns
  /(\b(UNION(\s+ALL)?)\b.*?\bSELECT\b)/i,
  /(;\s*(DROP|ALTER|TRUNCATE|DELETE|INSERT|UPDATE)\b)/i,
  /(\bEXEC(\s+SP_|\s+XP_)?\s*\()/i,
  /(\bxp_cmdshell\b)/i,
  /('--|\/\*|\*\/)/,
  /(\bOR\b\s+['"]?1['"]?\s*=\s*['"]?1['"]?)/i,
  /(\bAND\b\s+['"]?1['"]?\s*=\s*['"]?2['"]?)/i,

  // Command Injection patterns
  /[;&|`$><\r\n\0]/,
  /(\b(sh|bash|cmd|powershell|curl|wget|nc|netcat)\b)/i,

  // Path Traversal
  /(\.\.[\/\\])/,

  // NoSQL / Prototype Pollution
  /(__proto__|constructor|prototype)/,
  /(\$where|\$gt|\$gte|\$lt|\$lte|\$ne|\$in|\$nin|\$regex)/i,
];

/**
 * Check if a string contains any dangerous injection patterns.
 */
export function containsInjectionPatterns(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return INJECTION_PATTERNS.some((pattern) => pattern.test(val));
}

/**
 * Sanitize generic string input:
 * - Rejects non-string types (prevents object/NoSQL injection)
 * - Strips NULL bytes and dangerous control characters
 * - Trims whitespace
 * - Enforces maximum length
 */
export function sanitizeString(
  val: unknown,
  maxLength = 255,
  defaultValue = ''
): string {
  if (typeof val !== 'string') return defaultValue;

  // Strip NULL bytes and control characters (excluding tab and newline where appropriate)
  const cleaned = val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();

  if (cleaned.length > maxLength) {
    return cleaned.slice(0, maxLength);
  }
  return cleaned;
}

/**
 * Validate and sanitize document numbers (e.g. `ORD69000888`, `ORDautorun`).
 * Returns sanitized string or null if invalid format.
 */
export function sanitizeDocNo(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const clean = val.trim();
  if (!DOC_NO_REGEX.test(clean) || clean.includes('..')) {
    return null;
  }
  return clean;
}

/**
 * Validate and sanitize Trade_Id (Product SKU).
 */
export function sanitizeTradeId(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const clean = val.trim();
  if (!clean || clean.length > 50 || clean.includes('..') || clean.includes(';') || clean.includes('--')) {
    return null;
  }
  return clean;
}

/**
 * Escape wildcard characters (`%`, `_`, `[`) for safe use in MSSQL LIKE clauses.
 */
export function escapeSqlLike(val: unknown, maxLength = 100): string {
  if (typeof val !== 'string') return '';
  const clean = sanitizeString(val, maxLength);
  // In T-SQL LIKE clauses: [ is escaped as [[] , % as [%] , _ as [_]
  return clean.replace(/[[%_]/g, '[$&]');
}

/**
 * Sanitize integer quantities (strictly positive integer between min and max).
 */
export function sanitizeQuantity(val: unknown, min = 1, max = 99999): number {
  const parsed = parseInt(String(val), 10);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < min) {
    return min;
  }
  return Math.min(max, parsed);
}

/**
 * Sanitize prices (non-negative finite float).
 */
export function sanitizePrice(val: unknown, max = 1000000000): number {
  const parsed = parseFloat(String(val));
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.min(max, parsed);
}

/**
 * Sanitize phone number (keeps digits, +, -, and spaces).
 */
export function sanitizePhone(val: unknown): string {
  if (typeof val !== 'string') return '';
  const clean = val.replace(/[^\d+\-\s]/g, '').trim();
  return clean.slice(0, 30);
}

/**
 * Basic email format sanitizer.
 */
export function sanitizeEmail(val: unknown): string {
  if (typeof val !== 'string') return '';
  const clean = val.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (clean.length > 100 || !emailRegex.test(clean)) {
    return '';
  }
  return clean;
}

/**
 * Sanitize uploaded file name and verify extension.
 * Completely blocks directory traversal (`../`), null bytes, and Windows reserved device names.
 */
export function sanitizeSafeFilename(rawFilename: unknown): {
  isValid: boolean;
  safeName: string;
  ext: string;
  error?: string;
} {
  if (typeof rawFilename !== 'string' || !rawFilename.trim()) {
    return { isValid: false, safeName: '', ext: '', error: 'ชื่อไฟล์ไม่ถูกต้อง' };
  }

  // Strip path traversal and slashes
  let baseName = rawFilename
    .replace(/^.*[\\\/]/, '') // remove directory path
    .replace(/\0/g, '')       // strip null bytes
    .trim();

  // Extract extension
  const lastDot = baseName.lastIndexOf('.');
  if (lastDot === -1) {
    return { isValid: false, safeName: '', ext: '', error: 'ไฟล์ต้องมีนามสกุลที่ถูกต้อง' };
  }

  const ext = baseName.slice(lastDot).toLowerCase();
  if (!ALLOWED_UPLOAD_EXTS.has(ext)) {
    return {
      isValid: false,
      safeName: '',
      ext,
      error: `ไม่อนุญาตให้อัปโหลดไฟล์นามสกุล ${ext} (อนุญาตเฉพาะรูปภาพ .jpg, .png, .webp)`,
    };
  }

  // Name without extension
  const nameWithoutExt = baseName.slice(0, lastDot).replace(/[^A-Za-z0-9_-]/g, '_');
  const safeName = `${nameWithoutExt || 'slip'}${ext}`;

  // Check Windows reserved names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
  const reservedRegex = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
  if (reservedRegex.test(safeName)) {
    return {
      isValid: false,
      safeName: '',
      ext,
      error: 'ชื่อไฟล์ขัดกับข้อกำหนดความปลอดภัยของระบบ',
    };
  }

  return { isValid: true, safeName, ext };
}

/**
 * Validation Result Type
 */
export interface ValidationResult<T> {
  isValid: boolean;
  error?: string;
  data?: T;
}

/**
 * Validate and sanitize Login payload (`POST /api/auth/login`)
 */
export function validateLoginPayload(body: unknown): ValidationResult<{
  username: string;
  password: string;
  rememberMe: boolean;
}> {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'ข้อมูลคำขอไม่ถูกต้อง' };
  }

  const b = body as Record<string, unknown>;
  const rawUser = b.username;
  const rawPass = b.password;

  if (typeof rawUser !== 'string' || !rawUser.trim()) {
    return { isValid: false, error: 'กรุณากรอกรหัสลูกค้า (Cus_User)' };
  }

  const username = sanitizeString(rawUser, 50);
  const password = typeof rawPass === 'string' ? rawPass.trim().slice(0, 100) : '';

  // Reject obvious SQL/Command injection attempts in credentials
  if (containsInjectionPatterns(username)) {
    return { isValid: false, error: 'รูปแบบชื่อผู้ใช้งานไม่ถูกต้อง' };
  }

  return {
    isValid: true,
    data: {
      username,
      password,
      rememberMe: Boolean(b.rememberMe),
    },
  };
}

/**
 * Validate and sanitize Order Creation payload (`POST /api/orders`)
 */
export function validateOrderPayload(body: unknown): ValidationResult<{
  items: Array<{
    tradeId: string;
    tradeName: string;
    qty: number;
    unitName: string;
    typeId: string;
    typeName: string;
    salePrice: number;
    depositPrice?: number;
    remark?: string;
  }>;
  paymentMethod: 'T' | 'M';
  customerName: string;
  customerTel: string;
  customerAddress: string;
  customerZip: string;
  customerEmail: string;
  remark: string;
  paymentSlipFilename: string;
}> {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'ข้อมูลคำสั่งซื้อไม่ถูกต้อง' };
  }

  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.items) || b.items.length === 0) {
    return { isValid: false, error: 'ไม่มีรายการสินค้าในคำสั่งซื้อ' };
  }

  if (b.items.length > 100) {
    return { isValid: false, error: 'รายการสินค้าเกินขีดจำกัดสูงสุด (100 รายการ)' };
  }

  const sanitizedItems = [];
  for (let i = 0; i < b.items.length; i++) {
    const it = b.items[i];
    if (!it || typeof it !== 'object') {
      return { isValid: false, error: `รายการสินค้าลำดับที่ ${i + 1} ไม่ถูกต้อง` };
    }

    const tradeId = sanitizeTradeId(it.tradeId);
    if (!tradeId) {
      return { isValid: false, error: `รหัสสินค้าในรายการที่ ${i + 1} ไม่ถูกต้อง` };
    }

    const tradeName = sanitizeString(it.tradeName, 200);
    const qty = sanitizeQuantity(it.qty, 1, 99999);
    const unitName = sanitizeString(it.unitName, 30);
    const typeId = sanitizeString(it.typeId, 30);
    const typeName = sanitizeString(it.typeName, 50);
    const salePrice = sanitizePrice(it.salePrice);
    const depositPrice = it.depositPrice ? sanitizePrice(it.depositPrice) : undefined;
    const remark = it.remark ? sanitizeString(it.remark, 200) : undefined;

    sanitizedItems.push({
      tradeId,
      tradeName,
      qty,
      unitName,
      typeId,
      typeName,
      salePrice,
      depositPrice,
      remark,
    });
  }

  const customerName = sanitizeString(b.customerName, 100);
  const customerTel = sanitizePhone(b.customerTel);
  const customerAddress = sanitizeString(b.customerAddress, 300);
  const customerZip = sanitizeString(b.customerZip, 10);
  const customerEmail = sanitizeEmail(b.customerEmail);
  const remark = sanitizeString(b.remark, 500);
  const paymentSlipFilename = sanitizeString(b.paymentSlipFilename, 150);

  const paymentMethod = b.paymentMethod === 'T' ? 'T' : 'M';

  return {
    isValid: true,
    data: {
      items: sanitizedItems,
      paymentMethod,
      customerName,
      customerTel,
      customerAddress,
      customerZip,
      customerEmail,
      remark,
      paymentSlipFilename,
    },
  };
}

/**
 * Validate and sanitize Cart Sync payload (`POST /api/cart`)
 */
export function validateCartSyncPayload(body: unknown): ValidationResult<{
  items: Array<{
    tradeId: string;
    tradeName: string;
    tradeNameEN?: string;
    unitName: string;
    typeName?: string;
    salePrice: number;
    depositPrice?: number;
    qty: number;
    image?: string;
  }>;
}> {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'ข้อมูลตะกร้าสินค้าไม่ถูกต้อง' };
  }

  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.items)) {
    return { isValid: false, error: 'รายการสินค้าต้องเป็น Array' };
  }

  if (b.items.length > 100) {
    return { isValid: false, error: 'จำนวนรายการสินค้าในตะกร้าเกินขีดจำกัดสูงสุด (100 รายการ)' };
  }

  const sanitizedItems = [];
  for (let i = 0; i < b.items.length; i++) {
    const it = b.items[i];
    if (!it || typeof it !== 'object') {
      continue;
    }

    const tradeId = sanitizeTradeId(it.tradeId);
    if (!tradeId) {
      continue;
    }

    const tradeName = sanitizeString(it.tradeName, 200);
    const tradeNameEN = it.tradeNameEN ? sanitizeString(it.tradeNameEN, 200) : undefined;
    const unitName = sanitizeString(it.unitName, 30);
    const typeName = it.typeName ? sanitizeString(it.typeName, 50) : undefined;
    const salePrice = sanitizePrice(it.salePrice);
    const depositPrice = it.depositPrice ? sanitizePrice(it.depositPrice) : undefined;
    const qty = sanitizeQuantity(it.qty, 1, 99999);
    const image = it.image ? sanitizeString(it.image, 500) : undefined;

    sanitizedItems.push({
      tradeId,
      tradeName,
      tradeNameEN,
      unitName,
      typeName,
      salePrice,
      depositPrice,
      qty,
      image,
    });
  }

  return {
    isValid: true,
    data: {
      items: sanitizedItems,
    },
  };
}

/**
 * Validate and sanitize Customer Account Update (`PUT /api/customer/account`)
 */
export function validateCustomerUpdatePayload(body: unknown): ValidationResult<{
  customerName: string;
  customerContact: string;
  customerTel: string;
  customerEmail: string;
  customerAddress: string;
  customerZip: string;
  customerTax: string;
  customerBranch: string;
}> {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'ข้อมูลไม่ถูกต้อง' };
  }

  const b = body as Record<string, unknown>;

  return {
    isValid: true,
    data: {
      customerName: sanitizeString(b.customerName, 100),
      customerContact: sanitizeString(b.customerContact, 100),
      customerTel: sanitizePhone(b.customerTel),
      customerEmail: sanitizeEmail(b.customerEmail),
      customerAddress: sanitizeString(b.customerAddress, 300),
      customerZip: sanitizeString(b.customerZip, 10),
      customerTax: sanitizeString(b.customerTax, 30),
      customerBranch: sanitizeString(b.customerBranch, 20),
    },
  };
}
