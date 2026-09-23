import QRCode from 'qrcode';

/**
 * เบอร์โทรศัพท์ PromptPay สำหรับทดสอบ (Temporary Test PromptPay)
 */
export const TEST_PROMPTPAY_PHONE = '0811128199';

/**
 * สลับโหมดทดสอบ PromptPay:
 * true = ใช้เบอร์ 0811128199 สำหรับทดสอบ
 * false = ใช้ K-Shop Biller ID (หจก. อุบลรุ่งเรืองเบฟเวอเรจ)
 */
export const USE_TEST_PROMPTPAY = true;

/**
 * Calculates CRC16-CCITT for PromptPay / EMVCo QR code string
 * Algorithm accurately matches cuscrc16() from D:\Download\genkshop\genkshop.php
 */
export function cuscrc16(data: string): number {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return crc;
}

function f(id: string, value: string): string {
  return [id, ('00' + value.length).slice(-2), value].join('');
}

function serialize(xs: (string | false | undefined | null)[]): string {
  return xs.filter(Boolean).join('');
}

function sanitizeTarget(id: string): string {
  return id.replace(/[^0-9]/g, '');
}

function formatTarget(id: string): string {
  const numbers = sanitizeTarget(id);
  if (numbers.length >= 13) return numbers;
  return ('0000000000000' + numbers.replace(/^0/, '66')).slice(-13);
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function formatCrc(crcValue: number): string {
  return ('0000' + crcValue.toString(16).toUpperCase()).slice(-4);
}

/**
 * Generates official EMVCo Thai PromptPay payload for Mobile Number or Tax ID (BOT Standard)
 * @param amount - Amount in THB
 * @param target - Phone number (e.g. 0811128199) or Tax ID
 */
export function generatePromptPayPayload(
  amount: number | string,
  target: string = TEST_PROMPTPAY_PHONE
): string {
  const sanitized = sanitizeTarget(target);
  const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  const targetType = sanitized.length >= 13 ? '02' : '01'; // 01 = Phone, 02 = Tax ID

  const data = [
    f('00', '01'),
    f('01', numAmount > 0 ? '12' : '11'),
    f('29', serialize([
      f('00', 'A000000677010111'),
      f(targetType, formatTarget(sanitized)),
    ])),
    f('58', 'TH'),
    f('53', '764'),
    numAmount > 0 && f('54', formatAmount(numAmount)),
  ];

  const dataToCrc = serialize(data) + '6304';
  const crcVal = cuscrc16(dataToCrc);
  data.push(f('63', formatCrc(crcVal)));

  return serialize(data);
}

/**
 * Generates the full EMVCo PromptPay / Kasikorn K-Shop string payload
 * with exact Merchant ID (KB000001607597) & Biller ID (010753600031508)
 * as defined in D:\Download\genkshop\genkshop.php
 *
 * @param amount - Number or string representation of the amount (e.g. 500, 2000.25)
 * @returns Complete EMVCo QR string with Tag 63 CRC16 checksum
 */
export function generateKShopPayload(amount: number | string): string {
  const sHeader =
    '00020101021130810016A00000067701011201150107536000315080214KB0000016075970320KPS004KB00000160759731690016A00000067701011301030040214KB0000016075970420KPS004KB000001607597530376454';
  const sFooter = '5802TH6304';

  const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  const amtStr = numAmount.toFixed(2);
  const lfloat = String(amtStr.length).padStart(2, '0');

  const dataWithoutCrc = sHeader + lfloat + amtStr + sFooter;
  const crcNum = cuscrc16(dataWithoutCrc);
  const sum = crcNum.toString(16).toUpperCase().padStart(4, '0');

  return dataWithoutCrc + sum;
}

/**
 * Generates high-resolution Base64 Data URL (PNG) for the QR code
 *
 * @param amount - Amount to be encoded in the QR code
 * @param width - Desired pixel width of the QR code (default 320)
 * @returns Promise<string> containing 'data:image/png;base64,...'
 */
export async function generateKShopQrDataUrl(
  amount: number | string,
  width: number = 320
): Promise<string> {
  const payload = USE_TEST_PROMPTPAY
    ? generatePromptPayPayload(amount, TEST_PROMPTPAY_PHONE)
    : generateKShopPayload(amount);

  return await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Alias for generateKShopQrDataUrl
 */
export async function generatePromptPayQrDataUrl(
  amount: number | string,
  width: number = 320
): Promise<string> {
  return generateKShopQrDataUrl(amount, width);
}
