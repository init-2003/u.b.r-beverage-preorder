import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { getCartFromDb, syncCartToDb, clearCartInDb, CartItemSyncInput } from '@/lib/cart-service';

export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        items: [],
      });
    }

    const items = await getCartFromDb(customer.customerId);
    return NextResponse.json({
      success: true,
      authenticated: true,
      customerId: customer.customerId,
      items,
    });
  } catch (error: any) {
    console.error('Error fetching cart from DB:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบเพื่อบันทึกตะกร้าสินค้า' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const items: CartItemSyncInput[] = Array.isArray(body.items) ? body.items : [];

    const result = await syncCartToDb(customer.customerId, items);

    return NextResponse.json({
      customerId: customer.customerId,
      ...result,
    });
  } catch (error: any) {
    console.error('Error syncing cart to DB:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to sync cart' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json({ success: true, message: 'Not logged in' });
    }

    await clearCartInDb(customer.customerId);
    return NextResponse.json({ success: true, customerId: customer.customerId });
  } catch (error: any) {
    console.error('Error clearing cart in DB:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
