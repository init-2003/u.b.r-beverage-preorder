/**
 * Input Validation & Sanitization Engine for U.B.R Beverage Pre-Order (Zod 4)
 *
 * ป้องกัน SQL Injection, Command Injection, Path Traversal และ NoSQL / Object Injection
 *
 * หลักการ:
 * - Zod บังคับ "ชนิดข้อมูล" ระดับ runtime (object/array แทน string ถูกปฏิเสธ → กัน `{ "$gt": "" }`)
 *   และ strip key ที่ไม่ได้ประกาศไว้ทิ้งโดยอัตโนมัติ (กัน prototype pollution / mass assignment)
 * - ฟิลด์ข้อความ "ตัดความยาว + ลบ control chars" (ไม่ปฏิเสธ) เพื่อคง contract เดิมกับ frontend
 * - ตัวเลข (qty / price) clamp เข้าช่วงที่ปลอดภัย
 * - ค่าที่ไปต่อท้าย path หรือใช้เป็น key (docNo, tradeId, filename) ใช้ whitelist เข้มงวด
 * - SQL ทุกจุดยังใช้ parameterized query (`.input()`); LIKE ใช้ `escapeSqlLike`
 */

import { z } from 'zod';

// ข้อความ error เริ่มต้นของ Zod เป็นภาษาไทย (ข้อความที่ระบุเองใน schema จะมาก่อนเสมอ)
z.config(z.locales.th());

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Safe filename: อนุญาตเฉพาะนามสกุลที่ระบุ
const ALLOWED_UPLOAD_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

// Control chars ที่ต้องลบ (เว้น \t \n \r)
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// Suspicious SQL / Command / NoSQL injection signatures
const INJECTION_PATTERNS = [
  // SQL Injection
  /(\b(UNION(\s+ALL)?)\b.*?\bSELECT\b)/i,
  /(;\s*(DROP|ALTER|TRUNCATE|DELETE|INSERT|UPDATE)\b)/i,
  /(\bEXEC(\s+SP_|\s+XP_)?\s*\()/i,
  /(\bxp_cmdshell\b)/i,
  /('--|\/\*|\*\/)/,
  /(\bOR\b\s+['"]?1['"]?\s*=\s*['"]?1['"]?)/i,
  /(\bAND\b\s+['"]?1['"]?\s*=\s*['"]?2['"]?)/i,

  // Command Injection (shell metacharacters / null byte / newline)
  /[;&|`$><\r\n\0]/,

  // Path Traversal
  /(\.\.[\/\\])/,

  // NoSQL / Prototype Pollution
  /(__proto__)/,
  /(\$where|\$gt|\$gte|\$lt|\$lte|\$ne|\$in|\$nin|\$regex)/i,
];

// ---------------------------------------------------------------------------
// Primitive sanitizers (ใช้ได้ทั้งใน route และใน schema ด้านล่าง)
// ---------------------------------------------------------------------------

/**
 * ตรวจว่าสตริงมี signature ของ injection หรือไม่
 */
export function containsInjectionPatterns(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return INJECTION_PATTERNS.some((pattern) => pattern.test(val));
}

/**
 * Sanitize ข้อความ: ไม่ใช่ string → ค่า default, ลบ control chars, trim, ตัดความยาว
 */
export function sanitizeString(
  val: unknown,
  maxLength = 255,
  defaultValue = ''
): string {
  if (typeof val !== 'string') return defaultValue;
  const cleaned = val.replace(CONTROL_CHARS_REGEX, '').trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

/**
 * Escape wildcard (`%`, `_`, `[`) สำหรับ T-SQL LIKE
 */
export function escapeSqlLike(val: unknown, maxLength = 100): string {
  if (typeof val !== 'string') return '';
  const clean = sanitizeString(val, maxLength);
  return clean.replace(/[[%_]/g, '[$&]');
}

/**
 * จำนวนเต็มบวก clamp เข้าช่วง [min, max]
 */
export function sanitizeQuantity(val: unknown, min = 1, max = 99999): number {
  const parsed = parseInt(String(val), 10);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < min) return min;
  return Math.min(max, parsed);
}

/**
 * ราคา: ตัวเลขไม่ติดลบ
 */
export function sanitizePrice(val: unknown, max = 1000000000): number {
  const parsed = parseFloat(String(val));
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) return 0;
  return Math.min(max, parsed);
}

/**
 * เบอร์โทร: เก็บเฉพาะตัวเลข + - , / และเว้นวรรค
 */
export function sanitizePhone(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[^\d+\-\s,\/]/g, '').trim().slice(0, 50);
}

const EmailSchema = z.email();

/**
 * อีเมล: ไม่ถูกต้อง → '' (lenient)
 */
export function sanitizeEmail(val: unknown): string {
  if (typeof val !== 'string') return '';
  const clean = val.trim().toLowerCase();
  if (clean.length > 100 || !EmailSchema.safeParse(clean).success) return '';
  return clean;
}

// ---------------------------------------------------------------------------
// Reusable Zod building blocks
// ---------------------------------------------------------------------------

const MSG_DOC_NO = 'เลขที่เอกสารไม่ถูกต้อง';
const MSG_TRADE_ID = 'รหัสสินค้าไม่ถูกต้อง';

/** เลขที่เอกสาร เช่น ORD69000888 / ORDautorun (กัน path traversal + SQL) */
export const DocNoSchema = z
  .string(MSG_DOC_NO)
  .trim()
  .regex(/^[A-Za-z0-9_-]{3,50}$/, MSG_DOC_NO);

/** รหัสสินค้า (Trade_Id) */
export const TradeIdSchema = z
  .string(MSG_TRADE_ID)
  .trim()
  .min(1, MSG_TRADE_ID)
  .max(50, MSG_TRADE_ID)
  .refine(
    (v) => !v.includes('..') && !v.includes(';') && !v.includes('--') && !/[\x00-\x1F\x7F]/.test(v),
    MSG_TRADE_ID
  );

/** ข้อความ (ต้องเป็น string, ลบ control chars, ตัดความยาว) */
const textField = (max: number) => z.string().transform((v) => sanitizeString(v, max));
/** ไม่ส่งมา/null → '' */
const textOrEmpty = (max: number) => textField(max).nullish().transform((v) => v ?? '');
/** ไม่ส่งมา/null/ว่าง → undefined */
const textOrUndefined = (max: number) => textField(max).nullish().transform((v) => v || undefined);
/** ไม่ส่งมา/null → undefined (ค่าว่างคงไว้) */
const textKeepEmpty = (max: number) => textField(max).nullish().transform((v) => v ?? undefined);

const numberLike = z.union([z.number(), z.string()]);
const qtyField = numberLike.nullish().transform((v) => sanitizeQuantity(v ?? 1, 1, 99999));
const priceField = numberLike.nullish().transform((v) => sanitizePrice(v ?? 0));
const depositField = numberLike.nullish().transform((v) => (v ? sanitizePrice(v) : undefined));

const phoneField = z.string().nullish().transform((v) => sanitizePhone(v ?? ''));
const lenientEmailField = z.string().nullish().transform((v) => sanitizeEmail(v ?? ''));

/** query param แบบจำนวนเต็ม: ไม่ใช่ตัวเลข → default, ที่เหลือ clamp */
const intParam = (def: number, min: number, max: number) =>
  z
    .string()
    .nullish()
    .transform((v) => {
      const n = parseInt(v ?? '', 10) || def;
      return Math.max(min, Math.min(max, n));
    });

// ---------------------------------------------------------------------------
// Payload schemas
// ---------------------------------------------------------------------------

const MSG_USERNAME_REQUIRED = 'กรุณากรอกรหัสลูกค้า (Cus_User)';

/** POST /api/auth/login */
export const LoginPayloadSchema = z.object(
  {
    username: z
      .string(MSG_USERNAME_REQUIRED)
      .trim()
      .min(1, MSG_USERNAME_REQUIRED)
      .transform((v) => sanitizeString(v, 50))
      .refine((v) => !containsInjectionPatterns(v), 'รูปแบบชื่อผู้ใช้งานไม่ถูกต้อง'),
    password: z
      .string()
      .nullish()
      .transform((v) => (v ?? '').trim().slice(0, 100)),
    rememberMe: z.coerce.boolean().optional().default(false),
  },
  'ข้อมูลคำขอไม่ถูกต้อง'
);

const OrderItemSchema = z.object(
  {
    tradeId: TradeIdSchema,
    tradeName: textOrEmpty(200),
    qty: qtyField,
    unitName: textOrEmpty(30),
    typeId: textOrEmpty(30),
    typeName: textOrEmpty(50),
    salePrice: priceField,
    depositPrice: depositField,
    remark: textOrUndefined(200),
  },
  'ข้อมูลไม่ถูกต้อง'
);

const MSG_NO_ITEMS = 'ไม่มีรายการสินค้าในคำสั่งซื้อ';

/** POST /api/orders (ที่อยู่/เบอร์โทรเช็คใน route เพราะมี fallback จาก session) */
export const OrderPayloadSchema = z.object(
  {
    items: z
      .array(OrderItemSchema, MSG_NO_ITEMS)
      .min(1, MSG_NO_ITEMS)
      .max(100, 'รายการสินค้าเกินขีดจำกัดสูงสุด (100 รายการ)'),
    paymentMethod: z.enum(['T', 'M']).catch('M'),
    customerName: textOrEmpty(100),
    customerTel: phoneField,
    customerAddress: textOrEmpty(300),
    customerZip: textOrEmpty(10),
    customerEmail: lenientEmailField,
    remark: textOrEmpty(500),
    paymentSlipFilename: textOrEmpty(150),
  },
  'ข้อมูลคำสั่งซื้อไม่ถูกต้อง'
);

const CartItemSchema = z.object({
  tradeId: TradeIdSchema,
  tradeName: textOrEmpty(200),
  tradeNameEN: textOrUndefined(200),
  unitName: textOrEmpty(30),
  typeName: textOrUndefined(50),
  salePrice: priceField,
  depositPrice: depositField,
  qty: qtyField,
  image: textOrUndefined(500),
});

/** POST /api/cart — รายการที่ไม่ผ่านจะถูกข้าม (คง behavior เดิม) แทนที่จะปฏิเสธทั้งตะกร้า */
export const CartSyncPayloadSchema = z.object(
  {
    items: z
      .array(z.unknown(), 'รายการสินค้าต้องเป็น Array')
      .max(100, 'จำนวนรายการสินค้าในตะกร้าเกินขีดจำกัดสูงสุด (100 รายการ)')
      .transform((list) =>
        list.flatMap((it) => {
          const parsed = CartItemSchema.safeParse(it);
          return parsed.success ? [parsed.data] : [];
        })
      ),
  },
  'ข้อมูลตะกร้าสินค้าไม่ถูกต้อง'
);

/** PUT /api/customer/account — อีเมลที่กรอกแต่รูปแบบผิดจะถูกปฏิเสธ (ไม่เขียนทับด้วยค่าว่างเงียบ ๆ) */
export const CustomerUpdatePayloadSchema = z.object(
  {
    customerName: textOrEmpty(100),
    customerContact: textOrEmpty(100),
    customerTel: phoneField,
    customerEmail: z
      .string()
      .nullish()
      .transform((v) => (v ?? '').trim().toLowerCase())
      .refine(
        (v) => v === '' || (v.length <= 100 && EmailSchema.safeParse(v).success),
        'รูปแบบอีเมลไม่ถูกต้อง'
      ),
    customerAddress: textOrEmpty(300),
    customerZip: textOrEmpty(10),
    customerTax: textOrEmpty(30),
    customerBranch: textOrEmpty(20),
  },
  'ข้อมูลไม่ถูกต้อง'
);

const DOC_STATUSES = ['0', '1', '3', '4'] as const;

/** PATCH /api/orders/[docNo] */
export const OrderPatchPayloadSchema = z.object(
  {
    docSts: z
      .union([z.string(), z.number()])
      .nullish()
      .transform((v) => (v == null ? undefined : String(v).trim()))
      .pipe(z.enum(DOC_STATUSES, 'สถานะคำสั่งซื้อไม่ถูกต้อง').optional()),
    docStsName: textKeepEmpty(50),
    trackingNo: textKeepEmpty(100),
    remark: textKeepEmpty(500),
    paymentSlipFilename: textKeepEmpty(150),
  },
  'ข้อมูลไม่ถูกต้อง'
);

// ---------------------------------------------------------------------------
// Query-string schemas (ไม่ throw: ทุกฟิลด์ lenient)
// ---------------------------------------------------------------------------

/** GET /api/products */
export const ProductsQuerySchema = z.object({
  category: z.string().nullish().transform((v) => sanitizeString(v ?? '', 50)),
  search: z.string().nullish().transform((v) => sanitizeString(v ?? '', 100)),
  page: intParam(1, 1, 10000),
  limit: intParam(24, 1, 60),
});

/** GET /api/orders */
export const OrdersQuerySchema = z.object({
  limit: intParam(50, 1, 200),
  tel: phoneField,
  customerId: z.string().nullish().transform((v) => sanitizeString(v ?? '', 50)),
});

export function parseProductsQuery(searchParams: URLSearchParams) {
  return ProductsQuerySchema.parse({
    category: searchParams.get('category'),
    search: searchParams.get('search'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  });
}

export function parseOrdersQuery(searchParams: URLSearchParams) {
  return OrdersQuerySchema.parse({
    limit: searchParams.get('limit'),
    tel: searchParams.get('tel'),
    customerId: searchParams.get('customerId'),
  });
}

// ---------------------------------------------------------------------------
// Param helpers (คงชื่อเดิมที่ route ใช้อยู่)
// ---------------------------------------------------------------------------

/** เลขที่เอกสารที่ถูกต้อง หรือ null */
export function sanitizeDocNo(val: unknown): string | null {
  const parsed = DocNoSchema.safeParse(val);
  return parsed.success ? parsed.data : null;
}

/** Trade_Id ที่ถูกต้อง หรือ null */
export function sanitizeTradeId(val: unknown): string | null {
  const parsed = TradeIdSchema.safeParse(val);
  return parsed.success ? parsed.data : null;
}

// ---------------------------------------------------------------------------
// File upload
// ---------------------------------------------------------------------------

/**
 * Sanitize ชื่อไฟล์อัปโหลด + ตรวจนามสกุล
 * บล็อก directory traversal, null byte และชื่ออุปกรณ์สงวนของ Windows
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

  const baseName = rawFilename
    .replace(/^.*[\\\/]/, '') // remove directory path
    .replace(/\0/g, '') // strip null bytes
    .trim();

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

  const nameWithoutExt = baseName.slice(0, lastDot).replace(/[^A-Za-z0-9_-]/g, '_');
  const safeName = `${nameWithoutExt || 'slip'}${ext}`;

  // Windows reserved names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i.test(safeName)) {
    return {
      isValid: false,
      safeName: '',
      ext,
      error: 'ชื่อไฟล์ขัดกับข้อกำหนดความปลอดภัยของระบบ',
    };
  }

  return { isValid: true, safeName, ext };
}

// ---------------------------------------------------------------------------
// Validators (รูปแบบผลลัพธ์เดิม: { isValid, error?, data? })
// ---------------------------------------------------------------------------

export interface ValidationResult<T> {
  isValid: boolean;
  error?: string;
  data?: T;
}

export type LoginPayload = z.output<typeof LoginPayloadSchema>;
export type OrderPayload = z.output<typeof OrderPayloadSchema>;
export type CartSyncPayload = z.output<typeof CartSyncPayloadSchema>;
export type CustomerUpdatePayload = z.output<typeof CustomerUpdatePayloadSchema>;
export type OrderPatchPayload = z.output<typeof OrderPatchPayloadSchema>;

/** ข้อความ error แรกของ Zod (รายการสินค้าจะแนบลำดับที่ผิดให้) */
function firstErrorMessage(error: z.ZodError, fallback: string): string {
  const issue = error.issues[0];
  if (!issue) return fallback;
  const [root, index] = issue.path;
  if (root === 'items' && typeof index === 'number') {
    return `รายการสินค้าลำดับที่ ${index + 1}: ${issue.message}`;
  }
  return issue.message || fallback;
}

function runSchema<S extends z.ZodType>(
  schema: S,
  input: unknown,
  fallback: string
): ValidationResult<z.output<S>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { isValid: false, error: firstErrorMessage(parsed.error, fallback) };
  }
  return { isValid: true, data: parsed.data };
}

export const validateLoginPayload = (body: unknown) =>
  runSchema(LoginPayloadSchema, body, 'ข้อมูลคำขอไม่ถูกต้อง');

export const validateOrderPayload = (body: unknown) =>
  runSchema(OrderPayloadSchema, body, 'ข้อมูลคำสั่งซื้อไม่ถูกต้อง');

export const validateCartSyncPayload = (body: unknown) =>
  runSchema(CartSyncPayloadSchema, body, 'ข้อมูลตะกร้าสินค้าไม่ถูกต้อง');

export const validateCustomerUpdatePayload = (body: unknown) =>
  runSchema(CustomerUpdatePayloadSchema, body, 'ข้อมูลไม่ถูกต้อง');

export const validateOrderPatchPayload = (body: unknown) =>
  runSchema(OrderPatchPayloadSchema, body, 'ข้อมูลไม่ถูกต้อง');
