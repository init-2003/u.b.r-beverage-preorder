import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { PurchaseOrderData, PurchaseOrderItem } from '@/components/orders/PurchaseOrderDocument';

let cachedFontRegular = '';
let cachedFontBold = '';
let cachedLogo = '';

function getAssets() {
  if (!cachedFontRegular) {
    const fontRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Sarabun', 'Sarabun-Regular.ttf');
    if (fs.existsSync(fontRegularPath)) {
      cachedFontRegular = fs.readFileSync(fontRegularPath).toString('base64');
    }
  }
  if (!cachedFontBold) {
    const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Sarabun', 'Sarabun-Bold.ttf');
    if (fs.existsSync(fontBoldPath)) {
      cachedFontBold = fs.readFileSync(fontBoldPath).toString('base64');
    }
  }
  if (!cachedLogo) {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'ubr_beverage_logo.png');
    if (fs.existsSync(logoPath)) {
      cachedLogo = fs.readFileSync(logoPath).toString('base64');
    }
  }
  return { fontRegular: cachedFontRegular, fontBold: cachedFontBold, logo: cachedLogo };
}

function getBrowserExecutablePath(): string {
  const candidatePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) return p;
  }
  throw new Error('Chrome or Edge browser executable not found on server.');
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
const MAX_PAGE_UNITS = 16;

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

export function generatePurchaseOrderHtml(order: PurchaseOrderData): string {
  const { fontRegular, fontBold, logo } = getAssets();

  const customerName = order.shipping?.Customer_Name || order.Customer_Name || '';
  const customerTel = order.shipping?.Customer_Tel || order.Customer_Tel || '';
  const customerAddr = (order.shipping?.Customer_Address || order.Customer_Address || '').trim();
  const customerZip = (order.shipping?.Customer_Zip || order.Customer_Zip || '').trim();
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

  const pagesHtml = pages.map((page) => {
    let itemsRows = '';
    if (page.items && page.items.length > 0) {
      page.items.forEach((item, idx) => {
        const globalIndex = page.startIndex + idx + 1;
        const unitPrice = Number(item.Sale_Price != null && item.Sale_Price > 0 ? item.Sale_Price : item.Sale_Price1 || 0);
        const lineTotal = Number(item.Line_Total) > 0 ? Number(item.Line_Total) : (unitPrice * item.Qty);
        itemsRows += `
          <tr>
            <td class="text-center">${globalIndex}</td>
            <td style="word-break: break-word; white-space: normal; line-height: 1.35;">${item.Trade_Name}</td>
            <td class="text-center mono">${Number(item.Qty || 1).toLocaleString()}</td>
            <td class="text-center">${item.Unit_Name || ''}</td>
            <td class="text-end mono">${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="text-end mono">${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      });
    } else {
      itemsRows = `
        <tr>
          <td colspan="6" class="text-center" style="padding: 16px; color: #64748b;">ไม่มีรายการสินค้า</td>
        </tr>
      `;
    }

    const fillerRow = page.fillerHeight > 0 ? `
      <tr class="table-filler-row" style="height: ${page.fillerHeight}px;">
        <td style="height: ${page.fillerHeight}px;">&nbsp;</td>
        <td style="height: ${page.fillerHeight}px;">&nbsp;</td>
        <td style="height: ${page.fillerHeight}px;">&nbsp;</td>
        <td style="height: ${page.fillerHeight}px;">&nbsp;</td>
        <td style="height: ${page.fillerHeight}px;">&nbsp;</td>
        <td style="height: ${page.fillerHeight}px;">&nbsp;</td>
      </tr>
    ` : '';

    const totalsSection = page.isLastPage ? `
      <tr>
        <td colspan="5" class="text-end">
          <b>ยอดรวมทั้งสิ้น / Grand Total</b>
          ${deposit > 0 ? `
            <br />
            <span style="color: #000000; font-weight: bold;">ยอดชำระมัดจำ / Deposit</span>
            <br />
            <b>ยอดคงเหลือชำระเมื่อรับมอบ / Remaining</b>
          ` : ''}
        </td>
        <td class="text-end mono">
          <b>${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
          ${deposit > 0 ? `
            <br />
            <span style="color: #000000; font-weight: bold;">
              ${deposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <br />
            <b>
              ${Math.max(0, grandTotal - deposit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </b>
          ` : ''}
        </td>
      </tr>
      <tr>
        <td colspan="6">
          <b>หมายเหตุ : </b>${displayRemark}
        </td>
      </tr>
    ` : '';

    const bottomExtras = page.isLastPage ? `
      <section class="totals">
        <div class="note">
          <strong>เงื่อนไขเพิ่มเติม / Additional Conditions</strong><br />
          - สินค้าต้องอยู่ในสภาพเรียบร้อยและครบถ้วนก่อนรับมอบ<br />
          - โปรดระบุเลขที่ใบสั่งซื้อ (Order No.) บนใบกำกับภาษีทุกครั้ง
        </div>
      </section>
      <section class="signatures">
        <div class="sig">
          <div class="line"></div>
          <div class="label">ผู้ขอซื้อ / Requested By</div>
        </div>
        <div class="sig">
          <div class="line"></div>
          <div class="label">ผู้อนุมัติ / Approved By</div>
        </div>
        <div class="sig">
          <div class="line"></div>
          <div class="label">ผู้รับของ / Received By</div>
        </div>
      </section>
    ` : '';

    return `
      <div class="a4">
        <header>
          <div class="brand">
            <img src="data:image/png;base64,${logo}" alt="U.B.R.Beverage" />
            <div class="brand-info">
              <h1>U.B.R.Beverage</h1>
              <div class="sub">ที่อยู่: 36/1 ถ.เขื่อนธานี ต.ในเมือง อ.เมือง จ.อุบลราชธานี 34000</div>
              <div class="sub">โทร: 081-2823929, 085-7796626</div>
            </div>
          </div>
          <div class="doc-title">
            <div class="type">ใบสั่งซื้อ / Purchase Order</div>
            ${pages.length > 1 ? `<div style="font-size: 13px; color: #64748b; margin-top: 2px; font-weight: bold;">หน้า ${page.pageNumber} / ${pages.length}</div>` : ''}
          </div>
        </header>

        <div class="customer-order-cards">
          <div class="card-col-left">
            <div class="card">
              <h3 style="margin: 0 0 4px 0; font-size: 14.5px; font-weight: 700; line-height: 1.3;">ข้อมูลลูกค้า / Customer Details</h3>
              <div style="display: flex; flex-direction: column; gap: 2px; line-height: 1.35; font-size: 13px;">
                <span class="muted"><strong style="font-weight: 700;">ชื่อลูกค้า (Customer Name):</strong> <span style="font-size: 13px; font-weight: normal;">${customerName}</span></span>
                <span class="muted"><strong style="font-weight: 700;">ที่อยู่จัดส่ง (Shipping Address):</strong> <span style="font-size: 13px; font-weight: normal;">${fullAddress}</span></span>
                <span class="muted"><strong style="font-weight: 700;">โทร (Tel.):</strong> <span style="font-size: 13px; font-weight: normal;">${customerTel || '-'}</span></span>
                <span class="muted"><strong style="font-weight: 700;">อีเมล (Email):</strong> <span style="font-size: 13px; font-weight: normal;">${order.shipping?.Customer_Email ? ` ${order.shipping.Customer_Email}` : ''}</span></span>
              </div>
            </div>
          </div>
          <div class="card-col-right">
            <div class="card">
              <h3 style="margin: 0 0 4px 0; font-size: 14.5px; font-weight: 700; line-height: 1.3;">ข้อมูลคำสั่งซื้อ / Order Details</h3>
              <div style="display: flex; flex-direction: column; gap: 2px; line-height: 1.35; font-size: 13px;">
                <span class="muted"><strong style="font-weight: 700;">เลขที่ออเดอร์ (Order No.):</strong> <span style="font-size: 13px; font-weight: normal;">${order.Fn_Doc_No}</span></span>
                <span class="muted"><strong style="font-weight: 700;">วันที่สั่งซื้อ (Date):</strong> <span style="font-size: 13px; font-weight: normal;">${formattedDate}</span></span>
                <span class="muted"><strong style="font-weight: 700;">วิธีการชำระ (Payment Method):</strong> <span style="font-size: 13px; font-weight: normal;">${moneyStsName}</span></span>
                <span class="muted"><strong style="font-weight: 700;">สถานะชำระ (Payment Status):</strong> <span style="font-size: 13px; font-weight: normal;">${paymentStatusText}</span></span>
              </div>
            </div>
          </div>
        </div>

        <section class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 40px;">ลำดับ<br>No.</th>
                <th class="text-center">รายการสินค้า<br>Item list</th>
                <th class="text-center" style="width: 80px;">จำนวน<br>Qty</th>
                <th class="text-center" style="width: 90px;">หน่วย<br>Unit</th>
                <th class="text-center" style="width: 110px;">ราคาต่อหน่วย<br>Unit Price</th>
                <th class="text-center" style="width: 120px;">จำนวนเงิน<br>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
              ${fillerRow}
              ${totalsSection}
            </tbody>
          </table>
        </section>

        ${bottomExtras}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>PurchaseOrderNo${order.Fn_Doc_No || 'PO'}</title>
  <style>
    @font-face {
      font-family: 'Sarabun';
      src: url('data:font/truetype;charset=utf-8;base64,${fontRegular}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Sarabun';
      src: url('data:font/truetype;charset=utf-8;base64,${fontBold}') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    @page {
      size: A4 portrait;
      margin: 6mm 7mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Sarabun', 'TH Sarabun New', sans-serif !important;
      color: #000000 !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: 'Sarabun', 'TH Sarabun New', sans-serif !important;
    }
    .crtorderpdf-wrapper {
      --blue-600: #000000;
      --blue-700: #000000;
      --slate-700: #000000;
      --slate-500: #000000;
      --border: #000000;
      font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
      color: #000000;
      background: #ffffff;
      margin: 0 auto;
      box-sizing: border-box;
      width: 100%;
      border: none;
    }
    .crtorderpdf-wrapper .a4 {
      width: 100%;
      box-sizing: border-box;
      background: #ffffff;
      padding: 0 1.5mm;
      page-break-after: always;
      break-after: page;
    }
    .crtorderpdf-wrapper .a4:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }
    .crtorderpdf-wrapper header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      break-inside: avoid;
      page-break-inside: avoid;
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
      line-height: 1.2;
    }
    .crtorderpdf-wrapper .customer-order-cards {
      display: flex;
      gap: 12px;
      margin-top: 10px;
      break-inside: avoid;
      page-break-inside: avoid;
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
      background: #ffffff;
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
    .crtorderpdf-wrapper .text-end {
      text-align: right;
    }
    .crtorderpdf-wrapper .text-center {
      text-align: center;
    }
    .crtorderpdf-wrapper .mono {
      font-family: inherit;
    }
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
  </style>
</head>
<body>
  <div class="crtorderpdf-wrapper">
    ${pagesHtml}
  </div>
</body>
</html>`;
}

export async function generatePurchaseOrderPdf(order: PurchaseOrderData): Promise<Buffer> {
  const executablePath = getBrowserExecutablePath();
  const html = generatePurchaseOrderHtml(order);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluateHandle('document.fonts.ready');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '6mm',
        bottom: '6mm',
        left: '7mm',
        right: '7mm',
      },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close().catch(() => {});
  }
}
