import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function GET() {
  try {
    const session = await getCurrentCustomer();
    if (!session || !session.customerId) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบก่อนเข้าถึงข้อมูลส่วนตัว' },
        { status: 401 }
      );
    }

    const pool = await getDbPool();
    const result = await pool
      .request()
      .input('customerId', session.customerId.trim())
      .query(`
        SELECT TOP 1
          Customer_Id,
          Customer_Name,
          Customer_Tax,
          Customer_Branch,
          Customer_Address,
          Customer_Zip,
          Customer_Contact,
          Customer_Tel,
          Customer_Fax,
          Customer_Email,
          Customer_Type,
          Customer_Lavel,
          Cus_User,
          Cus_Emp_Sale,
          Cus_Emp_Sale_Name,
          Customer_Promotion,
          Customer_Sts,
          Customer_Remark
        FROM Customer
        WHERE RTRIM(LTRIM(Customer_Id)) = @customerId
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลลูกค้าในระบบ' },
        { status: 404 }
      );
    }

    const cus = result.recordset[0];
    const rawLevel = parseInt(cus.Customer_Lavel, 10);
    const customerLevel = !isNaN(rawLevel) && rawLevel >= 1 && rawLevel <= 5 ? rawLevel : 1;

    const profile = {
      customerId: (cus.Customer_Id || '').trim(),
      cusUser: (cus.Cus_User || '').trim(),
      customerName: (cus.Customer_Name || '').trim(),
      customerTax: (cus.Customer_Tax || '').trim(),
      customerBranch: (cus.Customer_Branch || '').trim(),
      customerAddress: (cus.Customer_Address || '').trim(),
      customerZip: (cus.Customer_Zip || '').trim(),
      customerContact: (cus.Customer_Contact || '').trim(),
      customerTel: (cus.Customer_Tel || '').trim(),
      customerFax: (cus.Customer_Fax || '').trim(),
      customerEmail: (cus.Customer_Email || '').trim(),
      customerType: (cus.Customer_Type || '').trim(),
      customerLevel,
      salesEmployeeId: (cus.Cus_Emp_Sale || '').trim(),
      salesEmployeeName: (cus.Cus_Emp_Sale_Name || '').trim(),
      customerPromotion: (cus.Customer_Promotion || '').trim(),
      customerSts: (cus.Customer_Sts || '').trim(),
      remark: (cus.Customer_Remark || '').trim(),
    };

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Error fetching customer account:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentCustomer();
    if (!session || !session.customerId) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      customerName,
      customerContact,
      customerTel,
      customerEmail,
      customerAddress,
      customerZip,
      customerTax,
      customerBranch,
    } = body;

    const pool = await getDbPool();
    await pool
      .request()
      .input('customerId', session.customerId.trim())
      .input('customerName', customerName ? String(customerName).trim() : '')
      .input('customerContact', customerContact ? String(customerContact).trim() : '')
      .input('customerTel', customerTel ? String(customerTel).trim() : '')
      .input('customerEmail', customerEmail ? String(customerEmail).trim() : '')
      .input('customerAddress', customerAddress ? String(customerAddress).trim() : '')
      .input('customerZip', customerZip ? String(customerZip).trim() : '')
      .input('customerTax', customerTax ? String(customerTax).trim() : '')
      .input('customerBranch', customerBranch ? String(customerBranch).trim() : '')
      .query(`
        UPDATE Customer
        SET
          Customer_Name = CASE WHEN @customerName <> '' THEN @customerName ELSE Customer_Name END,
          Customer_Contact = @customerContact,
          Customer_Tel = @customerTel,
          Customer_Email = @customerEmail,
          Customer_Address = @customerAddress,
          Customer_Zip = @customerZip,
          Customer_Tax = @customerTax,
          Customer_Branch = @customerBranch
        WHERE RTRIM(LTRIM(Customer_Id)) = @customerId
      `);

    return NextResponse.json({
      success: true,
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    console.error('Error updating customer account:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message },
      { status: 500 }
    );
  }
}
