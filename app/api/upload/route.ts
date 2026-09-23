import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDbPool } from '@/lib/db';
import { verifySlipFull } from '@/lib/slip-verification';
import { getCurrentCustomer } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const docNo = (formData.get('docNo') as string || '').trim();
    const expectedAmountParam = formData.get('expectedAmount') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบไฟล์ที่อัปโหลด' },
        { status: 400 }
      );
    }

    let expectedAmount: number | undefined;

    // 1. หากมี docNo ให้ตรวจสอบสิทธิ์และดึงยอดเงินที่ต้องชำระจากฐานข้อมูล MSSQL โดยตรง
    if (docNo) {
      const customer = await getCurrentCustomer();
      if (!customer) {
        return NextResponse.json(
          { success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' },
          { status: 401 }
        );
      }

      try {
        const pool = await getDbPool();
        const orderRes = await pool
          .request()
          .input('docNo', docNo)
          .query(`
            SELECT TOP 1 Fn_Doc_No, Customer_Id, fn_deposit_H, Fn_Total, Doc_Sts
            FROM Fnt_Header_online
            WHERE Fn_Doc_No = @docNo
          `);

        if (orderRes.recordset.length > 0) {
          const row = orderRes.recordset[0];
          const orderCustomerId = (row.Customer_Id || '').trim();

          // ตรวจสอบความเป็นเจ้าของคำสั่งซื้อ
          if (orderCustomerId && orderCustomerId !== customer.customerId) {
            return NextResponse.json(
              { success: false, message: 'คุณไม่มีสิทธิ์อัปโหลดสลิปสำหรับคำสั่งซื้อนี้' },
              { status: 403 }
            );
          }

          const dep = Number(row.fn_deposit_H);
          const tot = Number(row.Fn_Total);
          expectedAmount = dep > 0 ? dep : tot;
        }
      } catch (dbErr) {
        console.error('Failed to query order payable amount:', dbErr);
      }
    }

    // หากไม่ได้ยอดจากฐานข้อมูล ลองดูจาก expectedAmountParam
    if (expectedAmount == null && expectedAmountParam) {
      const parsed = parseFloat(expectedAmountParam);
      if (!isNaN(parsed) && parsed > 0) {
        expectedAmount = parsed;
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. ตรวจสอบสลิปครบวงจร: สลิปมี QR Code อ้างอิง และจำนวนเงินตรงกับยอด
    const verifyResult = await verifySlipFull(buffer, expectedAmount);

    if (!verifyResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            verifyResult.error ||
            'สลิปไม่ถูกต้อง! กรุณาอัปโหลดสลิปที่ถูกต้อง',
          hasQr: verifyResult.hasQr,
          detectedAmount: verifyResult.detectedAmount,
          expectedAmount: verifyResult.expectedAmount,
        },
        { status: 400 }
      );
    }

    // 3. ตรวจสอบการใช้สลิปซ้ำ (Duplicate Slip Prevention)
    const qrRef = (verifyResult.slipInfo?.transRef || verifyResult.qrData || '').trim().slice(0, 250);

    if (qrRef) {
      try {
        const pool = await getDbPool();
        const dupCheck = await pool
          .request()
          .input('qrRef', qrRef)
          .input('currentDocNo', docNo)
          .query(`
            SELECT TOP 1 Fn_Doc_No, Doc_Sts, Pb_Now
            FROM Fnt_Header_online
            WHERE QR_REF = @qrRef 
              AND RTRIM(LTRIM(Fn_Doc_No)) <> RTRIM(LTRIM(@currentDocNo))
              AND Doc_Sts <> '4'
            ORDER BY Pb_Now DESC
          `);

        if (dupCheck.recordset.length > 0) {
          const dupRow = dupCheck.recordset[0];
          const dupDocNo = dupRow.Fn_Doc_No?.trim();
          console.warn(`[Upload Slip] Duplicate slip detected! transRef=${qrRef} already used in order ${dupDocNo}`);

          return NextResponse.json(
            {
              success: false,
              message: 'สลิปนี้ถูกใช้งานไปแล้ว กรุณาอัปโหลดสลิปใหม่',
              isDuplicate: true,
              duplicateDocNo: dupDocNo,
              hasQr: true,
              slipInfo: verifyResult.slipInfo,
            },
            { status: 400 }
          );
        }
      } catch (dupErr) {
        console.error('Failed to check duplicate slip:', dupErr);
      }
    }

    // 4. เมื่อผ่านเงื่อนไข บันทึกไฟล์รูปสลิปลงเซิร์ฟเวอร์
    // รูปแบบการเก็บ: public/uploads/slips/[เลขออเดอร์]/[ชื่อเดิมของไฟล์สลิป]
    const originalFilename = path.basename(file.name || 'slip.jpg');
    const orderFolder = docNo ? docNo.trim() : '';

    const uploadDir = orderFolder
      ? path.join(process.cwd(), 'public', 'uploads', 'slips', orderFolder)
      : path.join(process.cwd(), 'public', 'uploads', 'slips');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = originalFilename;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    // จัดเก็บลงฟิลด์ FILE_NAME_PIC ใน MSSQL เป็น [ชื่อไฟล์เดิม] อย่างเดียว
    const dbFilename = filename;

    // 5. หากมี docNo อัปเดตสถานะคำสั่งซื้อจาก '1' (รอชำระ) เป็น '0' (กำลังดำเนินการ) พร้อมบันทึก QR_REF และ Due_Date_Pay
    if (docNo) {
      try {
        let paymentDateTime = new Date();
        if (verifyResult.slipInfo?.transferDateTimeFormatted) {
          const parsed = new Date(verifyResult.slipInfo.transferDateTimeFormatted);
          if (!isNaN(parsed.getTime())) {
            paymentDateTime = parsed;
          }
        }

        const pool = await getDbPool();
        await pool
          .request()
          .input('docNo', docNo)
          .input('filename', dbFilename)
          .input('qrRef', qrRef)
          .input('dueDatePay', paymentDateTime)
          .query(`
            UPDATE Fnt_Header_online
            SET FILE_NAME_PIC = @filename,
                QR_REF = @qrRef,
                Doc_Sts = '0',
                Doc_Sts_Name = N'กำลังดำเนินการ',
                Due_Date_Pay = @dueDatePay
            WHERE Fn_Doc_No = @docNo
          `);
      } catch (updateErr) {
        console.error('Failed to update order status in upload API:', updateErr);
      }
    }

    const publicUrl = orderFolder
      ? `/uploads/slips/${encodeURIComponent(orderFolder)}/${encodeURIComponent(filename)}`
      : `/uploads/slips/${encodeURIComponent(filename)}`;

    return NextResponse.json({
      success: true,
      filename: dbFilename,
      url: publicUrl,
      qrData: verifyResult.qrData,
      slipInfo: verifyResult.slipInfo,
      detectedAmount: verifyResult.detectedAmount,
      expectedAmount: verifyResult.expectedAmount,
      docSts: '0',
      docStsName: 'กำลังดำเนินการ',
      message: 'ตรวจสอบ QR Code และยอดเงินในสลิปถูกต้องเรียบร้อยแล้ว สถานะคำสั่งซื้อเปลี่ยนเป็นกำลังดำเนินการ',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + error.message },
      { status: 500 }
    );
  }
}
