'use client';

import React from 'react';

export interface PurchaseOrderItem {
  ID_NO?: number;
  Trade_Id: string;
  Trade_Name: string;
  Qty: number;
  Unit_Name?: string;
  Sale_Price: number;
  Sale_Price1?: number;
  Line_Total: number;
  fn_deposit_D?: number;
}

export interface PurchaseOrderData {
  Branch_Id?: string;
  Fn_Doc_No: string;
  Fn_Doc_Date?: string;
  confirm_at?: string;
  Doc_Sts?: string;
  Doc_Sts_Name?: string;
  Customer_Id: string;
  Customer_Name?: string;
  Customer_Tel?: string;
  Customer_Address?: string;
  Customer_Zip?: string;
  Fn_Total: number;
  fn_deposit_H?: number;
  Fn_Amount?: number;
  money_sts: string;
  money_sts_name?: string;
  Fn_Remark?: string;
  shipping?: {
    Customer_Name?: string;
    Customer_Tel?: string;
    Customer_Address?: string;
    Customer_Zip?: string;
    Customer_Email?: string;
    Customer_Remark?: string;
    Pb_Now?: string;
  };
  items: PurchaseOrderItem[];
}

interface PurchaseOrderDocumentProps {
  order: PurchaseOrderData;
  className?: string;
}

function formatDate(val?: string): string {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

const BASE_ROW_HEIGHT = 28;
// งบความจุบรรทัดตารางสินค้าต่อ 1 หน้า A4 (16 บรรทัด = 448px พอดีเต็มแผ่นโดยไม่ดันส่วนท้ายตกหน้า)
const MAX_PAGE_UNITS = 16;

/**
 * คำนวณจำนวนบรรทัดที่รายการสินค้าจะใช้จริงตามความยาวของชื่อสินค้า
 * ความกว้างคอลัมน์ ~300px จุได้ประมาณ 36 ตัวอักษรต่อ 1 บรรทัด
 */
function getItemLineUnits(tradeName: string): number {
  if (!tradeName) return 1;
  const charsPerLine = 36;
  const segments = tradeName.split('\n');
  let totalLines = 0;
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) {
      totalLines += 1;
      continue;
    }
    totalLines += Math.max(1, Math.ceil(trimmed.length / charsPerLine));
  }
  return Math.max(1, totalLines);
}

interface PageChunk {
  pageNumber: number;
  items: PurchaseOrderItem[];
  startIndex: number;
  totalPageUnits: number;
  fillerHeight: number;
  isLastPage: boolean;
}

/**
 * จัดกลุ่มรายการสินค้าลงแต่ละหน้ากระดาษ A4 ตามจำนวนบรรทัดที่ใช้จริง
 * ถ้ารายการใดมีชื่อยาวหลายบรรทัด จะลดจำนวนรายการในหน้านั้นลงอัตโนมัติ
 * เพื่อไม่ให้ดันกล่องสรุปยอดและลายเซ็นล้นไปหน้าถัดไปเด็ดขาด
 */
function chunkOrderItems(items: PurchaseOrderItem[], extraRemarkUnits = 0): PageChunk[] {
  const pageBudget = Math.max(6, MAX_PAGE_UNITS - extraRemarkUnits);

  if (!items || items.length === 0) {
    return [{
      pageNumber: 1,
      items: [],
      startIndex: 0,
      totalPageUnits: 0,
      fillerHeight: pageBudget * BASE_ROW_HEIGHT,
      isLastPage: true,
    }];
  }

  const pages: PageChunk[] = [];
  let currentItems: PurchaseOrderItem[] = [];
  let currentUnits = 0;
  let startIndex = 0;
  let pageNumber = 1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemUnits = getItemLineUnits(item.Trade_Name || '');

    // ถ้าเพิ่มรายการนี้แล้วเกินงบของหน้านี้ ให้ตัดขึ้นหน้าใหม่
    if (currentUnits + itemUnits > pageBudget && currentItems.length > 0) {
      pages.push({
        pageNumber,
        items: currentItems,
        startIndex,
        totalPageUnits: currentUnits,
        fillerHeight: Math.max(0, (pageBudget - currentUnits) * BASE_ROW_HEIGHT),
        isLastPage: false,
      });
      pageNumber++;
      currentItems = [item];
      currentUnits = itemUnits;
      startIndex = i;
    } else {
      currentItems.push(item);
      currentUnits += itemUnits;
    }
  }

  if (currentItems.length > 0) {
    pages.push({
      pageNumber,
      items: currentItems,
      startIndex,
      totalPageUnits: currentUnits,
      fillerHeight: Math.max(0, (pageBudget - currentUnits) * BASE_ROW_HEIGHT),
      isLastPage: true,
    });
  }

  if (pages.length > 0) {
    pages[pages.length - 1].isLastPage = true;
  }

  return pages;
}

export default function PurchaseOrderDocument({
  order,
  className = '',
}: PurchaseOrderDocumentProps) {
  const customerName =
    order.shipping?.Customer_Name || order.Customer_Name || '';
  const customerTel =
    order.shipping?.Customer_Tel || order.Customer_Tel || '';
  const customerAddr =
    (order.shipping?.Customer_Address || order.Customer_Address || '').trim();
  const customerZip =
    (order.shipping?.Customer_Zip || order.Customer_Zip || '').trim();
  const fullAddress = customerZip && !customerAddr.includes(customerZip)
    ? `${customerAddr} ${customerZip}`
    : customerAddr;

  const docDate = order.confirm_at || order.Fn_Doc_Date;
  const formattedDate = formatDate(docDate);

  const calculatedItemsSubtotal = order.items && order.items.length > 0
    ? order.items.reduce((acc, it) => acc + (Number(it.Line_Total) || ((Number(it.Sale_Price != null && it.Sale_Price > 0 ? it.Sale_Price : it.Sale_Price1) || 0) * (Number(it.Qty) || 0))), 0)
    : 0;
  const sumItems = Number(order.Fn_Total) > 0 ? Number(order.Fn_Total) : calculatedItemsSubtotal;
  const deposit = Number(order.fn_deposit_H) || 0;
  const grandTotal = sumItems;

  const isCOD =
    order.money_sts === 'M' ||
    (order.money_sts_name && order.money_sts_name.includes('ปลายทาง')) ||
    (order.money_sts_name && order.money_sts_name.toUpperCase().includes('COD'));

  const isTransfer =
    order.money_sts === 'T' ||
    (order.money_sts_name && order.money_sts_name.includes('โอน')) ||
    (order.money_sts_name && order.money_sts_name.toLowerCase().includes('promptpay'));

  const moneyStsName = isCOD
    ? 'เก็บเงินปลายทาง'
    : isTransfer
      ? 'โอนผ่านบัญชี'
      : (order.money_sts_name || '-');

  const paymentStatusText = isTransfer
    ? 'ชำระเงินแล้ว'
    : isCOD
      ? 'ชำระเงินปลายทาง'
      : (order.Doc_Sts === '3' ? 'ชำระเงินแล้ว' : 'รอชำระเงิน');

  const rawRemark = (order.shipping?.Customer_Remark || order.Fn_Remark || '').trim();
  const displayRemark = rawRemark === '-' ? '' : rawRemark;

  const remarkLines = displayRemark ? Math.max(1, Math.ceil(displayRemark.length / 75)) : 1;
  const extraRemarkUnits = Math.max(0, remarkLines - 1);
  const pages = chunkOrderItems(order.items || [], extraRemarkUnits);

  return (
    <div className={`crtorderpdf-wrapper ${className}`}>
      {pages.map((page) => (
        <div key={page.pageNumber} className="a4">
          {/* ================= HEADER ================= */}
          <header>
            <div className="brand">
              <img src="/images/ubr_beverage_logo.png" alt="U.B.R.Beverage" />
              <div className="brand-info">
                <h1>U.B.R.Beverage</h1>
                <div className="sub">ที่อยู่: 36/1 ถ.เขื่อนธานี ต.ในเมือง อ.เมือง จ.อุบลราชธานี 34000</div>
                <div className="sub">โทร: 081-2823929, 085-7796626</div>
              </div>
            </div>
            <div className="doc-title">
              <div className="type">ใบสั่งซื้อ / Purchase Order</div>
              {pages.length > 1 && (
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', fontWeight: 'bold' }}>
                  หน้า {page.pageNumber} / {pages.length}
                </div>
              )}
            </div>
          </header>

          {/* ================= CUSTOMER & ORDER CARDS ================= */}
          <div className="customer-order-cards">
            {/* ซ้าย 50% */}
            <div className="card-col-left">
              <div className="card">
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: 700, lineHeight: 1.3 }}>
                  ข้อมูลลูกค้า / Customer Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.35, fontSize: '13px' }}>
                  <span className="muted">
                    <strong style={{ fontWeight: 700 }}>ชื่อลูกค้า (Customer Name):</strong> <span id="supName" style={{ fontSize: '13px', fontWeight: 'normal' }}>{customerName}</span>
                  </span>

                  <span className="muted">
                    <strong style={{ fontWeight: 700 }}>ที่อยู่จัดส่ง (Shipping Address):</strong> <span id="supAddr" style={{ fontSize: '13px', fontWeight: 'normal' }}>{fullAddress}</span>
                  </span>

                  <span className="muted">
                    <strong style={{ fontWeight: 700 }}>โทร (Tel.):</strong> <span id="supTel" style={{ fontSize: '13px', fontWeight: 'normal' }}>{customerTel || '-'}</span>
                  </span>

                  <span className="muted">
                    <strong style={{ fontWeight: 700 }}>อีเมล (Email):</strong> <span id="supContact" style={{ fontSize: '13px', fontWeight: 'normal' }}>{order.shipping?.Customer_Email ? ` ${order.shipping.Customer_Email}` : ''}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ขวา 50% */}
            <div className="card-col-right">
              <div className="card">
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: 700, lineHeight: 1.3 }}>
                  ข้อมูลคำสั่งซื้อ / Order Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.35, fontSize: '13px' }}>
                  <span className="muted">
                    <strong style={{ fontWeight: 700 }}>เลขที่ออเดอร์ (Order No.):</strong> <span style={{ fontSize: '13px', fontWeight: 'normal' }}>{order.Fn_Doc_No}</span>
                  </span>

                  <span className="muted">
                    <strong style={{ fontWeight: 700 }}>วันที่สั่งซื้อ (Date):</strong> <span style={{ fontSize: '13px', fontWeight: 'normal' }}>{formattedDate}</span>
                  </span>

                  <span className="muted">
                    <strong style={{ fontWeight: 700 }}>วิธีการชำระ (Payment Method):</strong> <span style={{ fontSize: '13px', fontWeight: 'normal' }}>{moneyStsName}</span>
                  </span>

                  <span className="muted">
                    <strong style={{ fontWeight: 700 }}>สถานะชำระ (Payment Status):</strong> <span style={{ fontSize: '13px', fontWeight: 'normal' }}>{paymentStatusText}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= LINE ITEMS TABLE ================= */}
          <section className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '40px' }}>
                    ลำดับ
                    <br />
                    No.
                  </th>
                  <th className="text-center">
                    รายการสินค้า
                    <br />
                    Item list
                  </th>
                  <th className="text-center" style={{ width: '80px' }}>
                    จำนวน
                    <br />
                    Qty
                  </th>
                  <th className="text-center" style={{ width: '90px' }}>
                    หน่วย
                    <br />
                    Unit
                  </th>
                  <th className="text-center" style={{ width: '110px' }}>
                    ราคาต่อหน่วย
                    <br />
                    Unit Price
                  </th>
                  <th className="text-center" style={{ width: '120px' }}>
                    จำนวนเงิน
                    <br />
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.items && page.items.length > 0 ? (
                  page.items.map((item, idx) => {
                    const unitPrice = Number(item.Sale_Price != null && item.Sale_Price > 0 ? item.Sale_Price : item.Sale_Price1 || 0);
                    const lineTotal = Number(item.Line_Total) > 0 ? Number(item.Line_Total) : (unitPrice * item.Qty);
                    return (
                      <tr key={item.Trade_Id || idx}>
                        <td className="text-center">{page.startIndex + idx + 1}</td>
                        <td style={{ wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.35 }}>
                          {item.Trade_Name}
                        </td>
                        <td className="text-center mono">{item.Qty.toLocaleString()}</td>
                        <td className="text-center">{item.Unit_Name || ''}</td>
                        <td className="text-end mono">
                          {unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-end mono">
                          {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center" style={{ padding: '16px', color: '#64748b' }}>
                      ไม่มีรายการสินค้า
                    </td>
                  </tr>
                )}

                {/* ช่องว่างยืดตารางให้ยาวลงมาเต็มฟอร์ม โดยไม่มีเส้นคั่นแนวนอน */}
                {page.fillerHeight > 0 && (
                  <tr className="table-filler-row" style={{ height: `${page.fillerHeight}px` }}>
                    <td style={{ height: `${page.fillerHeight}px` }}>&nbsp;</td>
                    <td style={{ height: `${page.fillerHeight}px` }}>&nbsp;</td>
                    <td style={{ height: `${page.fillerHeight}px` }}>&nbsp;</td>
                    <td style={{ height: `${page.fillerHeight}px` }}>&nbsp;</td>
                    <td style={{ height: `${page.fillerHeight}px` }}>&nbsp;</td>
                    <td style={{ height: `${page.fillerHeight}px` }}>&nbsp;</td>
                  </tr>
                )}

                {/* Summary Rows (แสดงเฉพาะหน้าสุดท้าย) */}
                {page.isLastPage && (
                  <>
                    <tr>
                      <td colSpan={5} className="text-end">
                        <b>ยอดรวมทั้งสิ้น / Grand Total</b>
                        {deposit > 0 && (
                          <>
                            <br />
                            <span style={{ color: '#000000', fontWeight: 'bold' }}>ยอดชำระมัดจำ / Deposit</span>
                            <br />
                            <b>ยอดคงเหลือชำระเมื่อรับมอบ / Remaining</b>
                          </>
                        )}
                      </td>
                      <td className="text-end mono">
                        <b>{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                        {deposit > 0 && (
                          <>
                            <br />
                            <span style={{ color: '#000000', fontWeight: 'bold' }}>
                              {deposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <br />
                            <b>
                              {Math.max(0, grandTotal - deposit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </b>
                          </>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6}>
                        <b>หมายเหตุ : </b>{displayRemark}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </section>

          {/* ================= TOTALS & REMARKS ================= */}
          {page.isLastPage && (
            <>
              <section className="totals">
                <div className="note">
                  <strong>เงื่อนไขเพิ่มเติม / Additional Conditions</strong>
                  <br />
                  - สินค้าต้องอยู่ในสภาพเรียบร้อยและครบถ้วนก่อนรับมอบ
                  <br />
                  - โปรดระบุเลขที่ใบสั่งซื้อ (Order No.) บนใบกำกับภาษีทุกครั้ง
                </div>
              </section>

              {/* ================= SIGNATURES ================= */}
              <section className="signatures">
                <div className="sig">
                  <div className="line"></div>
                  <div className="label">ผู้ขอซื้อ / Requested By</div>
                </div>
                <div className="sig">
                  <div className="line"></div>
                  <div className="label">ผู้อนุมัติ / Approved By</div>
                </div>
                <div className="sig">
                  <div className="line"></div>
                  <div className="label">ผู้รับของ / Received By</div>
                </div>
              </section>
            </>
          )}
        </div>
      ))}

      {/* ================= EXACT CSS FROM crtorderpdf.php ================= */}
      <style jsx global>{`
        @font-face {
          font-family: "Sarabun";
          src: url("/fonts/Sarabun/Sarabun-Thin.ttf") format("truetype");
          font-weight: 100; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "Sarabun";
          src: url("/fonts/Sarabun/Sarabun-Light.ttf") format("truetype");
          font-weight: 300; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "Sarabun";
          src: url("/fonts/Sarabun/Sarabun-Regular.ttf") format("truetype");
          font-weight: 400; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "Sarabun";
          src: url("/fonts/Sarabun/Sarabun-Medium.ttf") format("truetype");
          font-weight: 500; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "Sarabun";
          src: url("/fonts/Sarabun/Sarabun-SemiBold.ttf") format("truetype");
          font-weight: 600; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "Sarabun";
          src: url("/fonts/Sarabun/Sarabun-Bold.ttf") format("truetype");
          font-weight: 700; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "Sarabun";
          src: url("/fonts/Sarabun/Sarabun-ExtraBold.ttf") format("truetype");
          font-weight: 800; font-style: normal; font-display: swap;
        }

        .crtorderpdf-wrapper {
          --blue-600: #000000;
          --blue-700: #000000;
          --slate-700: #000000;
          --slate-500: #000000;
          --border: #000000;
          font-family: "Sarabun", "TH Sarabun New", sans-serif;
          color: #000000;
          background: #ffffff;
          margin: 0 auto;
          box-sizing: border-box;
          max-width: 850px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .crtorderpdf-wrapper * {
          box-sizing: border-box;
          font-family: "Sarabun", "TH Sarabun New", sans-serif !important;
          color: #000000 !important;
        }

        .crtorderpdf-wrapper .a4 {
          width: 100%;
          padding: 10mm 10mm 12mm 10mm;
          box-shadow: none;
          border-radius: 0;
          background: #ffffff;
        }

        .crtorderpdf-wrapper header {
          border-bottom: 2px solid var(--border);
          padding-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .crtorderpdf-wrapper .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .crtorderpdf-wrapper .brand img {
          width: 64px;
          height: 64px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .crtorderpdf-wrapper .brand .brand-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1px;
        }

        .crtorderpdf-wrapper .brand h1 {
          margin: 0;
          font-size: 20px;
          line-height: 1.2;
          font-weight: 700;
          color: #000000;
          display: block;
        }

        .crtorderpdf-wrapper .brand .sub {
          color: #000000;
          font-size: 14px;
          line-height: 1.35;
        }

        .crtorderpdf-wrapper .doc-title {
          float: right;
          text-align: right;
        }

        .crtorderpdf-wrapper .doc-title .type {
          font-weight: 700;
          font-size: 22px;
          color: #000000;
        }

        .crtorderpdf-wrapper .badge {
          display: inline;
          padding: 2px 8px;
          border-radius: 999px;
          background: #ffffff;
          color: #000000;
          border: 1px solid var(--border);
          font-size: 14px;
          font-weight: 600;
        }

        .crtorderpdf-wrapper .customer-order-cards {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }

        .crtorderpdf-wrapper .card-col-left,
        .crtorderpdf-wrapper .card-col-right {
          flex: 1;
          width: 50%;
          min-width: 0;
        }

        .crtorderpdf-wrapper .card {
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 13px;
          margin-top: 0;
          box-sizing: border-box;
          height: 100%;
        }

        .crtorderpdf-wrapper .card h3 {
          margin: 0 0 4px 0;
          font-size: 14.5px;
          color: #000000;
          font-weight: 700;
        }

        .crtorderpdf-wrapper .row {
          overflow: hidden;
          margin-top: 4px;
        }

        .crtorderpdf-wrapper .row .col {
          float: left;
          width: 50%;
          font-size: 14px;
        }

        .crtorderpdf-wrapper .muted {
          color: #000000;
          font-size: 14px;
          line-height: 1.4;
        }

        .crtorderpdf-wrapper .table-wrapper {
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
          margin-top: 10px;
        }

        .crtorderpdf-wrapper table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          font-size: 14px;
          border: none;
        }

        .crtorderpdf-wrapper thead th {
          background: #ffffff;
          color: #000000;
          text-align: center !important;
          vertical-align: middle;
          padding: 6px;
          border: 1px solid var(--border);
          border-top: none;
          font-weight: 600;
          font-size: 14px;
          line-height: 1.3;
          background-clip: padding-box;
        }

        .crtorderpdf-wrapper thead th:first-child {
          border-left: none;
        }

        .crtorderpdf-wrapper thead th:last-child {
          border-right: none;
        }

        .crtorderpdf-wrapper tbody td {
          border: 1px solid var(--border);
          padding: 5px 6px;
          vertical-align: middle;
          line-height: 1.35;
          font-size: 14px;
          color: #000000;
        }

        .crtorderpdf-wrapper tbody td:first-child {
          border-left: none;
        }

        .crtorderpdf-wrapper tbody td:last-child {
          border-right: none;
        }

        .crtorderpdf-wrapper tbody tr:last-child td {
          border-bottom: none;
        }

        .crtorderpdf-wrapper tbody tr.table-filler-row td {
          padding: 0;
          border: 1px solid var(--border);
          background: #ffffff;
        }

        .crtorderpdf-wrapper tbody tr.table-filler-row td:first-child {
          border-left: none;
        }

        .crtorderpdf-wrapper tbody tr.table-filler-row td:last-child {
          border-right: none;
        }

        .crtorderpdf-wrapper tfoot td {
          border: 1px solid var(--border);
          padding: 6px 8px;
          font-size: 14px;
        }

        .crtorderpdf-wrapper .text-end {
          text-align: right;
        }

        .crtorderpdf-wrapper .text-center {
          text-align: center;
        }

        .crtorderpdf-wrapper .mono {
          font-family: inherit;
        }

        /* totals: note เงื่อนไขเพิ่มเติม */
        .crtorderpdf-wrapper .totals {
          margin-top: 6px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .crtorderpdf-wrapper .note {
          width: 100%;
          border: 1px dashed var(--border);
          border-radius: 6px;
          padding: 5px 10px;
          font-size: 13.5px;
          line-height: 1.35;
          box-sizing: border-box;
        }

        /* ลายเซ็น 3 ช่อง */
        .crtorderpdf-wrapper .signatures {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .crtorderpdf-wrapper .sig {
          flex: 1;
          min-width: 0;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 6px;
          height: 80px;
          position: relative;
          font-size: 14px;
          background: #ffffff;
          box-sizing: border-box;
          text-align: center;
        }

        .crtorderpdf-wrapper .sig .line {
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 24px;
          border-bottom: 1px dashed var(--border);
          height: 1px;
        }

        .crtorderpdf-wrapper .sig .label {
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 4px;
          text-align: center;
          font-size: 13px;
          color: #000000;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 7mm;
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: "Sarabun", "TH Sarabun New", sans-serif !important;
          }

          .no-print,
          nav,
          footer {
            display: none !important;
          }

          .crtorderpdf-wrapper {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            font-family: "Sarabun", "TH Sarabun New", sans-serif !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          .crtorderpdf-wrapper * {
            font-family: "Sarabun", "TH Sarabun New", sans-serif !important;
          }

          .crtorderpdf-wrapper .a4 {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 1.5mm !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .crtorderpdf-wrapper header,
          .crtorderpdf-wrapper .customer-order-cards,
          .crtorderpdf-wrapper .totals,
          .crtorderpdf-wrapper .signatures,
          .crtorderpdf-wrapper tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
