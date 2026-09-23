/**
 * U.B.R Beverage Pre-Order System Types
 * สอดคล้องกับโครงสร้างฐานข้อมูล MSSQL และระบบงานจริง:
 * - Trade: ข้อมูลสินค้าพรีออเดอร์ (Type_Name = 'Pre Order')
 * - Fnt_Header_online: ข้อมูลส่วนหัวใบสั่งจองพรีออเดอร์
 * - Fnt_Detail_online: รายการสินค้าในใบสั่งจอง
 * - Customer_online: ข้อมูลจัดส่งและข้อมูลลูกค้า ณ เวลาสั่งจอง
 * - Customer: ข้อมูลสมาชิกลูกค้าในระบบ POS
 */

// ==========================================
// 1. Order & Document Status (สถานะเอกสารและการชำระเงิน)
// ==========================================

/**
 * สถานะเอกสารคำสั่งจองพรีออเดอร์ (ตรงตาม Fnt_Header_online.Doc_Sts)
 * - '0' = กำลังดำเนินการ
 * - '3' = ออกใบเสร็จแล้ว
 * - '4' = ยกเลิก Order
 */
export enum DocStatus {
  PROCESSING = '0', // กำลังดำเนินการ
  COMPLETED = '3',  // ออกใบเสร็จแล้ว
  CANCELLED = '4',  // ยกเลิก Order
}

/**
 * ข้อมูลคำอธิบายและโทนสีสถานะของ Doc_Sts
 */
export const DOC_STATUS_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: 'กำลังดำเนินการ', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  '3': { label: 'ออกใบเสร็จแล้ว', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  '4': { label: 'ยกเลิก Order', color: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

/**
 * สถานะการชำระเงิน (ตรงตาม Fnt_Header_online.money_sts)
 * - '0' = ยังไม่ชำระ / รอตรวจสอบ
 * - '1' = ชำระเงินแล้ว
 */
export enum PaymentStatus {
  UNPAID = '0',
  PAID = '1',
}

/**
 * ช่องทางการชำระเงิน
 * - 'M' = เก็บเงินปลายทาง (Cash on Delivery)
 * - 'T' = โอนเงิน (Bank Transfer / PromptPay)
 */
export type PaymentMethod = 'M' | 'T';

// ==========================================
// 2. Product & Catalog (ข้อมูลสินค้าและหมวดหมู่)
// ==========================================

export interface CategoryItem {
  Type_Name: string;
  Product_Count?: number;
}

/**
 * ข้อมูลสินค้าพรีออเดอร์สำหรับแสดงผลในหน้า Catalog & Detail
 * อ้างอิงจากตาราง Trade ใน MSSQL
 */
export interface Product {
  id: string;              // Trade_Id
  name: string;            // Trade_Name
  nameEN?: string;         // Trade_NameEN
  category: string;        // Type_Name (เช่น Pre Order หรือชื่อหมวดหมู่)
  unitName: string;        // Unit_Name (หน่วยนับ เช่น ขวด, ลัง, แพ็ค)
  price: number;           // Sale_Price1 (ราคาขายหลัก)
  salePrice1: number;      // Sale_Price1
  depositPrice?: number;   // Trade.Trade_deposit (ราคามัดจำต่อหน่วย ฿)
  depositPercent: number;  // % คำนวณไดนามิก: (depositPrice / price) * 100 (0 ถ้าไม่มี)
  origin?: string;         // Trade_Province หรือประเทศต้นทาง
  description?: string;    // Trade_Note
  imageUrl: string;        // Trade_Part_Image (fallback: /images/ubr_beverage_logo.png)
  isPopular?: boolean;
  leadTimeDays?: number;   // Optional (ไม่มีคอลัมน์ใน DB ตาม business rule)
  alcoholPercent?: number; // Optional
}

// ==========================================
// 3. Cart Items (ข้อมูลสินค้าในตะกร้า)
// ==========================================

export interface CartItem {
  tradeId: string;
  tradeName: string;
  tradeNameEN?: string;
  unitName: string;
  typeName?: string;
  salePrice: number;
  depositPrice?: number;
  qty: number;
  image?: string;
}

// ==========================================
// 4. Order Entities (Fnt_Header_online & Fnt_Detail_online)
// ==========================================

/**
 * รายการสินค้ารายบรรทัดในคำสั่งซื้อ (Fnt_Detail_online)
 */
export interface OrderItemDetail {
  ID_NO?: number;
  Trade_Id: string;
  Trade_Name: string;
  Qty: number;
  Unit_Name: string;
  Type_Name?: string;
  Sale_Price: number;
  Sale_Price1?: number;
  Line_Total: number;
  fn_deposit_D?: number;   // ยอดมัดจำรวมของบรรทัดนี้ (Qty * depositPrice)
  Type_Free?: string;
  Promotion_No?: string;
  fn_type_sale?: string;
}

/**
 * ข้อมูลการจัดส่งและลูกค้าที่บันทึกไว้ใน Customer_online
 */
export interface OrderShippingInfo {
  Customer_Id?: string;
  Customer_Name: string;
  Customer_Tel: string;
  Customer_Address: string;
  Customer_Zip: string;
  Customer_Email?: string;
  Customer_Remark?: string;
  Pb_Now?: string;
  Sts?: string;
  type_sale?: string;
}

/**
 * สรุปข้อมูลคำสั่งซื้อสำหรับหน้ารายการประวัติ (Orders History)
 * ดึงจาก Fnt_Header_online ร่วมกับ Subquery
 */
export interface OrderSummary {
  Fn_Doc_No: string;
  Fn_Doc_Date: string;
  Doc_Sts: string;
  Doc_Sts_Name?: string;
  Customer_Id: string;
  ShipToName?: string;
  Customer_Name?: string;
  Customer_Tel?: string;
  Customer_Address?: string;
  Fn_Total: number;
  fn_deposit_H?: number;   // ยอดมัดจำรวมทั้งใบสั่งจอง
  money_sts: string;
  money_sts_name?: string;
  Fn_Doc_No_local?: string;
  FILE_NAME_PIC?: string;
  confirm_at?: string;
  fn_type_sale?: string;
  ItemCount: number;
  Sample_Trade_Name?: string;
  Sample_Type_Name?: string;
}

/**
 * ข้อมูลคำสั่งซื้อแบบละเอียดสำหรับหน้า Order Details (/orders/[docNo])
 */
export interface OrderDetail {
  Branch_Id: string;
  Fn_Doc_No: string;
  Fn_Doc_Date: string;
  Doc_Sts: string;
  Doc_Sts_Name: string;
  Customer_Id: string;
  Customer_Name?: string;
  Customer_Tel?: string;
  Customer_Address?: string;
  Customer_Zip?: string;
  Fn_Total: number;
  fn_deposit_H?: number;
  Fn_Amount: number;
  money_sts: string;
  money_sts_name: string;
  Fn_Doc_No_local?: string;
  FILE_NAME_PIC?: string;
  confirm_at?: string;
  fn_type_sale?: string;
  Fn_Remark?: string;
  shipping: OrderShippingInfo;
  items: OrderItemDetail[];
}

/**
 * โครงสร้างข้อมูลสำหรับสร้างคำสั่งจองพรีออเดอร์ใหม่ (Checkout)
 */
export interface CreateOrderPayload {
  customerId: string;
  customerName: string;
  customerTel: string;
  customerAddress: string;
  customerZip: string;
  paymentMethod: PaymentMethod;
  paymentSlipFilename?: string;
  qrRef?: string;
  remark?: string;
  items: Array<{
    tradeId: string;
    tradeName: string;
    qty: number;
    unitName: string;
    typeId?: string;
    typeName?: string;
    salePrice: number;
    depositPrice?: number;
  }>;
}
