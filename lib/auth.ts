import crypto from 'crypto';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET || 'ubr_beverage_preorder_secret_key_2026';

export interface CustomerSession {
  customerId: string;
  cusUser?: string;
  customerName: string;
  customerTel: string;
  customerAddress: string;
  customerZip: string;
  customerLevel: number; // 1 to 5
}

export function signToken(data: CustomerSession): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyToken(token: string): CustomerSession | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('base64url');
    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded as CustomerSession;
  } catch {
    return null;
  }
}

export async function getCurrentCustomer(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('ubr_customer_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
