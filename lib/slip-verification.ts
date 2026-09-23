import sharp from 'sharp';
import jsQR from 'jsqr';
import { createWorker } from 'tesseract.js';

export interface SlipVerificationResult {
  hasQr: boolean;
  qrData?: string;
  error?: string;
}

export interface SlipQrData {
  transRef?: string;
  sendingBank?: string;
  sendingBankName?: string;
  transferDateTime?: string;
  transferDateTimeFormatted?: string;
  rawQr?: string;
}

export interface SlipVerificationFullResult {
  isValid: boolean;
  hasQr: boolean;
  qrData?: string;
  slipInfo?: SlipQrData;
  detectedAmount?: number | null;
  expectedAmount?: number;
  amountMatched: boolean;
  error?: string;
  rawText?: string;
}

export const THAI_BANK_NAMES: Record<string, string> = {
  '002': 'ธนาคารกรุงเทพ (BBL)',
  '004': 'ธนาคารกสิกรไทย (KBANK)',
  '006': 'ธนาคารกรุงไทย (KTB)',
  '011': 'ธนาคารทหารไทยธนชาต (TTB)',
  '014': 'ธนาคารไทยพาณิชย์ (SCB)',
  '025': 'ธนาคารกรุงศรีอยุธยา (BAY)',
  '069': 'ธนาคารเกียรตินาคินภัทร (KKP)',
  '022': 'ธนาคารซีไอเอ็มบีไทย (CIMBT)',
  '067': 'ธนาคารทิสโก้ (TISCO)',
  '024': 'ธนาคารยูโอบี (UOB)',
  '071': 'ธนาคารไทยเครดิต (TCRB)',
  '073': 'ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)',
  '030': 'ธนาคารออมสิน (GSB)',
  '034': 'ธ.ก.ส. (BAAC)',
  '033': 'ธนาคารอาคารสงเคราะห์ (GHB)',
  '070': 'ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย (EXIM)',
};

export function decodeTlvTags(payload: string): Record<string, string> {
  const tags: Record<string, string> = {};
  let idx = 0;
  while (idx < payload.length) {
    if (idx + 4 > payload.length) break;
    const tagId = payload.substring(idx, idx + 2);
    const lenStr = payload.substring(idx + 2, idx + 4);
    const length = parseInt(lenStr, 10);
    if (isNaN(length) || length <= 0 || idx + 4 + length > payload.length) break;
    tags[tagId] = payload.substring(idx + 4, idx + 4 + length);
    idx += 4 + length;
  }
  return tags;
}

export function parseSlipQrData(qrData: string): SlipQrData {
  const result: SlipQrData = {
    rawQr: qrData,
  };
  if (!qrData) return result;

  const topTags = decodeTlvTags(qrData);

  // Format A: ITMX Standard Mini QR (Tag 00 -> Subtags)
  if (topTags['00']) {
    const subTags = decodeTlvTags(topTags['00']);
    if (subTags['01']) result.sendingBank = subTags['01'];
    if (subTags['02']) result.transRef = subTags['02'];
  }

  // Format B: Universal Slip Tag Standard (Tag 03=Bank, Tag 04=DateTime, Tag 05=TransRef)
  if (topTags['03'] && !result.sendingBank) result.sendingBank = topTags['03'];
  if (topTags['04'] && !result.transferDateTime) result.transferDateTime = topTags['04'];
  if (topTags['05'] && !result.transRef) result.transRef = topTags['05'];

  // Format C: Regex Heuristics Fallback
  if (!result.transRef || !result.sendingBank) {
    const bankM = qrData.match(/(?:0303|0103)(\d{3})/);
    if (bankM && !result.sendingBank) result.sendingBank = bankM[1];

    const dtM = qrData.match(/(?:04(?:12|14))?((?:20\d{2})(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{4,6})/);
    if (dtM && !result.transferDateTime) result.transferDateTime = dtM[1];

    const refM = qrData.match(/05\d{2}([A-Za-z0-9_-]{10,35})/) || qrData.match(/02\d{2}([A-Za-z0-9_-]{10,35})/);
    if (refM && !result.transRef) result.transRef = refM[1];
  }

  if (!result.transRef && qrData.length >= 20) {
    const alphanumeric = qrData.match(/[A-Za-z0-9]{12,}/g);
    if (alphanumeric && alphanumeric.length > 0) {
      result.transRef = alphanumeric[alphanumeric.length - 1];
    }
  }

  if (result.sendingBank) {
    result.sendingBankName = THAI_BANK_NAMES[result.sendingBank] || `ธนาคารรหัส ${result.sendingBank}`;
  }

  if (result.transferDateTime && result.transferDateTime.length >= 12) {
    const dt = result.transferDateTime;
    try {
      let formattedDt = `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)} ${dt.slice(8, 10)}:${dt.slice(10, 12)}`;
      if (dt.length >= 14) formattedDt += `:${dt.slice(12, 14)}`;
      result.transferDateTimeFormatted = formattedDt;
    } catch {
      // Ignored
    }
  }

  return result;
}

/**
 * ฟังก์ชันตรวจสอบว่ารูปภาพสลิปมี QR Code อ้างอิงหรือไม่
 * ใช้วิธี Multi-pass scanning ร่วมกับ sharp และ jsQR
 */
export async function verifySlipQr(imageBuffer: Buffer): Promise<SlipVerificationResult> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return {
        hasQr: false,
        error: 'ไฟล์รูปภาพไม่ถูกต้องหรือไม่สามารถอ่านขนาดรูปภาพได้',
      };
    }

    // ขนาดความกว้างที่เหมาะสมและเร็วที่สุด (หลีกเลี่ยง null ซึ่งเป็นขนาดรูปเต็มจากกล้องมือถือที่ช้ามาก)
    const targetWidths: number[] = [800, 1200, 600];

    for (const targetWidth of targetWidths) {
      try {
        let pipeline = sharp(imageBuffer);

        if (targetWidth && metadata.width > targetWidth) {
          pipeline = pipeline.resize({ width: targetWidth, withoutEnlargement: true });
        }

        const { data, info } = await pipeline
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        const clampedArray = new Uint8ClampedArray(data);
        const code = jsQR(clampedArray, info.width, info.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data && code.data.trim().length > 0) {
          return {
            hasQr: true,
            qrData: code.data.trim(),
          };
        }
      } catch (passError) {
        console.warn(`Scan pass failed for targetWidth ${targetWidth}:`, passError);
      }
    }

    // Pass พิเศษ: ปรับความคมชัด/คอนทราสต์ (Greyscale + Normalise)
    try {
      const { data, info } = await sharp(imageBuffer)
        .resize({ width: 1000, withoutEnlargement: true })
        .grayscale()
        .normalise()
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const clampedArray = new Uint8ClampedArray(data);
      const code = jsQR(clampedArray, info.width, info.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data && code.data.trim().length > 0) {
        return {
          hasQr: true,
          qrData: code.data.trim(),
        };
      }
    } catch {
      // Ignored
    }

    return {
      hasQr: false,
      error: 'สลิปไม่ถูกต้อง! กรุณาอัปโหลดสลิปที่ถูกต้อง',
    };
  } catch (error: any) {
    console.error('Error verifying slip QR:', error);
    return {
      hasQr: false,
      error: 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพสลิป: ' + (error.message || ''),
    };
  }
}

/**
 * ดึงจำนวนเงินจาก EMVCo PromptPay QR Code (Tag 54) หากเป็น PromptPay MPM Payload
 */
export function parseEmvTag54Amount(qrData: string): number | null {
  if (!qrData || !qrData.startsWith('000201')) return null;
  try {
    let idx = 0;
    while (idx < qrData.length - 4) {
      const tag = qrData.slice(idx, idx + 2);
      const len = parseInt(qrData.slice(idx + 2, idx + 4), 10);
      if (isNaN(len) || len <= 0) break;
      const val = qrData.slice(idx + 4, idx + 4 + len);
      if (tag === '54') {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) return num;
      }
      idx += 4 + len;
    }
  } catch {
    // Ignore parsing error
  }
  return null;
}

/**
 * สกัดจำนวนเงินจากข้อความ OCR ที่ได้จากรูปสลิป
 */
export function extractAmountFromOcrText(
  text: string,
  expectedAmount?: number
): { detectedAmount: number | null; matchesExpected: boolean } {
  if (!text) return { detectedAmount: null, matchesExpected: false };

  // 1. ตรวจสอบว่าในข้อความมีตัวเลขตรงกับ expectedAmount พอดีหรือไม่
  if (expectedAmount != null && expectedAmount > 0) {
    const formattedWithComma = expectedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const formattedNoComma = expectedAmount.toFixed(2);
    const intString = String(Math.floor(expectedAmount));

    if (
      text.includes(formattedWithComma) ||
      text.includes(formattedNoComma) ||
      (expectedAmount % 1 === 0 && new RegExp(`\\b${intString}(?:\\.00)?\\b`).test(text))
    ) {
      return { detectedAmount: expectedAmount, matchesExpected: true };
    }
  }

  // 2. Regular Expressions สำหรับดึงจำนวนเงินจากสลิปธนาคารไทย
  // รองรับทั้ง สระอำ แบบ U+0E33 และ U+0E4D+U+0E32
  const patterns = [
    // แบบมีคีย์เวิร์ดกำกับชัดเจน (รองรับการขึ้นบรรทัดใหม่ \n และวงเล็บสกุลเงิน เช่น "จำนวนเงิน\n(บาท)\n500.00")
    /(?:จ[ำาํ]นวนเงิน(?:ที่โอน|โอน|ที่ช[ำาํ]ระ)?|ยอด(?:เงิน)?(?:โอน|ช[ำาํ]ระ)?|จ[ำาํ]นวน|transfer\s*amount|total\s*amount|amount|paid\s*amount)\s*(?:\([^)]*\))?\s*[:\s]*([0-9,]+\.?[0-9]*)/i,
    // แบบตามด้วยหน่วยเงิน เช่น "1,250.00 บาท", "500.00 THB", "2.00 Baht"
    /([0-9,]+\.[0-9]{2})\s*(?:บาท|THB|baht)/i,
    // แบบขึ้นต้นด้วยสกุลเงิน เช่น "บาท 500.00", "฿ 500.00", "THB 1,250.00"
    /(?:บาท|THB|฿)\s*([0-9,]+\.[0-9]{2})/i,
    // ตัวเลขทศนิยม 2 ตำแหน่งทั่วไป
    /([0-9,]+\.[0-9]{2})/,
  ];

  for (const regex of patterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        const matches =
          expectedAmount != null ? Math.abs(parsed - expectedAmount) < 0.01 : false;
        return { detectedAmount: parsed, matchesExpected: matches };
      }
    }
  }

  return { detectedAmount: null, matchesExpected: false };
}

// ตัวแปรแคช Worker ของ Tesseract เพื่อไม่ต้องโหลดใหม่ทุกครั้ง (Warm Worker Optimization)
let cachedTesseractWorkerPromise: Promise<any> | null = null;

async function getWarmTesseractWorker() {
  if (!cachedTesseractWorkerPromise) {
    cachedTesseractWorkerPromise = createWorker('tha+eng').catch((err) => {
      cachedTesseractWorkerPromise = null;
      throw err;
    });
  }
  return cachedTesseractWorkerPromise;
}

/**
 * ใช้ Tesseract OCR สกัดจำนวนเงินจากภาพสลิป (Optimized High-Speed)
 */
export async function extractAmountFromSlipImage(
  imageBuffer: Buffer,
  expectedAmount?: number
): Promise<{ detectedAmount: number | null; matchesExpected: boolean; rawText?: string }> {
  try {
    // ปรับขนาดความกว้างเป็น 800px ซึ่งเป็นขนาดที่เหมาะสมที่สุดสำหรับ OCR อ่านตัวเลข (เร็วกว่าขนาด 1400px เดิมหลายเท่า)
    const processedBuffer = await sharp(imageBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .grayscale()
      .normalise()
      .toBuffer();

    const worker = await getWarmTesseractWorker();
    const { data } = await worker.recognize(processedBuffer);
    const rawText = data?.text || '';

    const { detectedAmount, matchesExpected } = extractAmountFromOcrText(
      rawText,
      expectedAmount
    );

    return {
      detectedAmount,
      matchesExpected,
      rawText,
    };
  } catch (err: any) {
    console.error('Error performing slip OCR:', err);
    // กรณีเกิดข้อผิดพลาด ให้รีเซ็ตแคช worker เพื่อให้รอบหน้าสร้างใหม่
    cachedTesseractWorkerPromise = null;
    return {
      detectedAmount: null,
      matchesExpected: false,
      rawText: '',
    };
  }
}

/**
 * เรียกใช้ Python Slip Verification Microservice (FastAPI + zxing-cpp + RapidOCR)
 * หาก Service กำลังทำงาน จะได้ผลลัพธ์ในเวลาเพียง ~0.3 - 0.5 วินาที
 * หาก Service ไม่ได้เปิด หรือเกิด timeout จะคืนค่า null เพื่อ fallback ไปใช้ Node.js
 */
export async function verifySlipViaPythonMicroservice(
  imageBuffer: Buffer,
  expectedAmount?: number
): Promise<SlipVerificationFullResult | null> {
  // พอร์ตอ่านจาก .env (SLIP_SERVICE_PORT) — SLIP_VERIFIER_URL ให้ทับได้ (pm2 จะเซ็คให้เอง)
  const serviceUrl =
    process.env.SLIP_VERIFIER_URL || `http://127.0.0.1:${process.env.SLIP_SERVICE_PORT || '8000'}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
    formData.append('file', blob, 'slip.jpg');
    if (expectedAmount != null && expectedAmount > 0) {
      formData.append('expected_amount', expectedAmount.toString());
    }

    const res = await fetch(`${serviceUrl}/verify-slip`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[SlipVerifier] Python service returned HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      isValid: Boolean(data.isValid),
      hasQr: Boolean(data.hasQr),
      qrData: data.qrData || undefined,
      slipInfo: data.slipInfo || (data.qrData ? parseSlipQrData(data.qrData) : undefined),
      detectedAmount: data.detectedAmount != null ? Number(data.detectedAmount) : null,
      expectedAmount: data.expectedAmount != null ? Number(data.expectedAmount) : expectedAmount,
      amountMatched: Boolean(data.amountMatched),
      error: data.error || undefined,
      rawText: data.rawText || undefined,
    };
  } catch {
    clearTimeout(timeoutId);
    // Connection refused / offline / timeout => fallback to Node.js
    return null;
  }
}

/**
 * ฟังก์ชันตรวจสอบสลิปแบบครบวงจร (Full Slip Verification):
 * 1. ตรวจสอบว่ามี QR Code อ้างอิงบนสลิปหรือไม่
 * 2. ตรวจสอบว่าจำนวนเงินในสลิปตรงกับยอดที่ต้องชำระ (expectedAmount) หรือไม่
 * 
 * * ใช้ Python Microservice ความเร็วสูงเป็นอันดับแรก (< 0.5s) และ Fallback เป็น Node.js อัตโนมัติ
 */
export async function verifySlipFull(
  imageBuffer: Buffer,
  expectedAmount?: number
): Promise<SlipVerificationFullResult> {
  // ด่านที่ 0: ลองเรียกใช้ Python Microservice ความเร็วสูงก่อน
  try {
    const pyResult = await verifySlipViaPythonMicroservice(imageBuffer, expectedAmount);
    if (pyResult !== null) {
      return pyResult;
    }
  } catch (pyErr) {
    console.warn('[SlipVerifier] Python call error:', pyErr);
  }

  // หาก Python Microservice ไม่ทำงาน ให้รันต่อด้วย Node.js Fallback
  // ด่านที่ 1: ตรวจสอบ QR Code อ้างอิง
  const qrResult = await verifySlipQr(imageBuffer);
  if (!qrResult.hasQr) {
    return {
      isValid: false,
      hasQr: false,
      expectedAmount,
      amountMatched: false,
      error:
        qrResult.error ||
        'สลิปไม่ถูกต้อง! กรุณาอัปโหลดสลิปที่ถูกต้อง',
    };
  }

  const slipInfo = qrResult.qrData ? parseSlipQrData(qrResult.qrData) : undefined;

  // หากไม่มีการระบุ expectedAmount ให้ผ่านหากพบ QR
  if (expectedAmount == null || expectedAmount <= 0) {
    return {
      isValid: true,
      hasQr: true,
      qrData: qrResult.qrData,
      slipInfo,
      amountMatched: true,
    };
  }

  // ด่านที่ 2: ตรวจสอบจำนวนเงิน
  // 2.1 ลองดึงจาก EMVCo PromptPay Tag 54 ก่อน
  let detectedAmount = qrResult.qrData ? parseEmvTag54Amount(qrResult.qrData) : null;
  let amountMatched =
    detectedAmount != null ? Math.abs(detectedAmount - expectedAmount) < 0.01 : false;
  let rawText: string | undefined;

  // 2.2 หากไม่พบใน Tag 54 ให้ทำ OCR อ่านข้อความจากรูปสลิป
  if (!amountMatched) {
    const ocrResult = await extractAmountFromSlipImage(imageBuffer, expectedAmount);
    rawText = ocrResult.rawText;
    if (ocrResult.matchesExpected) {
      detectedAmount = expectedAmount;
      amountMatched = true;
    } else if (ocrResult.detectedAmount != null) {
      detectedAmount = ocrResult.detectedAmount;
      amountMatched = Math.abs(detectedAmount - expectedAmount) < 0.01;
    }
  }

  if (!amountMatched) {
    const expectedFormatted = expectedAmount.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const detectedFormatted =
      detectedAmount != null
        ? detectedAmount.toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : 'ไม่สามารถระบุได้';

    return {
      isValid: false,
      hasQr: true,
      qrData: qrResult.qrData,
      slipInfo,
      detectedAmount,
      expectedAmount,
      amountMatched: false,
      rawText,
      error: `ยอดเงินในสลิป (฿${detectedFormatted}) ไม่ตรงกับยอดที่ต้องชำระ (฿${expectedFormatted}) กรุณาตรวจสอบสลิปและอัปโหลดใหม่อีกครั้ง`,
    };
  }

  return {
    isValid: true,
    hasQr: true,
    qrData: qrResult.qrData,
    slipInfo,
    detectedAmount: detectedAmount ?? expectedAmount,
    expectedAmount,
    amountMatched: true,
    rawText,
  };
}
