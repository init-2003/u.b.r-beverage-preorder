/**
 * คำนวณยอดเงินมัดจำ (฿) และ % มัดจำ
 * 
 * ในตาราง Trade: Trade.Trade_deposit เป็นค่า % (เช่น 20 หมายถึง 20%)
 * หาก Trade_deposit <= 0 หรือ null -> depositPercent = 0, depositPrice = 0
 */

export interface DepositInfo {
  depositPercent: number; // % มัดจำ (0 - 100)
  depositPrice: number;   // ยอดมัดจำบาทต่อหน่วย (฿/หน่วย)
}

export function calcDeposit(
  salePrice: number | null | undefined,
  tradeDepositPct: number | null | undefined
): DepositInfo {
  const price = Number(salePrice) || 0;
  const rawPct = Number(tradeDepositPct) || 0;

  if (rawPct <= 0 || price <= 0) {
    return {
      depositPercent: 0,
      depositPrice: 0,
    };
  }

  // Clamp ให้อยู่ในช่วง 0 - 100
  const depositPercent = Math.min(Math.max(rawPct, 0), 100);
  
  // คำนวณยอดมัดจำต่อหน่วยเป็นบาท ทศนิยม 2 ตำแหน่ง
  const depositPrice = Math.round(((price * depositPercent) / 100) * 100) / 100;

  return {
    depositPercent,
    depositPrice,
  };
}

/**
 * ฟอร์แมตยอดเงินมัดจำ (฿):
 * - หากมีเศษทศนิยม (เช่น ฿336.45 หรือ ฿336.40) แสดงทศนิยม 2 ตำแหน่ง
 * - หากเป็นจำนวนเต็ม (ไม่มีเศษ เช่น ฿336) แสดงจำนวนเต็มปกติ
 */
export function formatDepositPrice(amount: number | null | undefined): string {
  const num = Number(amount) || 0;
  if (num % 1 !== 0) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return num.toLocaleString('en-US');
}
