# U.B.R Beverage Pre-Order (หจก. อุบลรุ่งเรืองเบฟเวอเรจ)

ระบบสั่งจองสินค้าออนไลน์ (Pre-Order Web Application) สำหรับ หจก. อุบลรุ่งเรืองเบฟเวอเรจ พัฒนาด้วย Next.js 16 (App Router), Microsoft SQL Server (MSSQL), Tailwind CSS และ Python Microservice สำหรับตรวจสอบสลิปการโอนเงินอัตโนมัติ

---

## 🚀 ฟีเจอร์หลัก (Key Features)

- **ระบบสั่งจองสินค้า (Pre-Order Catalog)**: ค้นหา กรองหมวดหมู่สินค้า ดูข้อมูลมัดจำและราคาสินค้าตามเงื่อนไข
- **ระบบตะกร้าสินค้า (Real-time Cart Persistence)**: บันทึกข้อมูลตะกร้าสินค้าแบบเรียลไทม์ลงฐานข้อมูล (`Fnt_Detail_online`)
- **การชำระเงินและตรวจสลิปอัตโนมัติ (Automated Slip Verification)**:
  - รองรับ QR พร้อมเพย์ / ธนาคาร
  - สแกน QR และอ่านยอดเงินในสลิปผ่าน Python FastAPI Microservice (`zxing-cpp` + `RapidOCR`) รวดเร็ว < 0.5 วินาที
  - ระบบ Fallback ด้วย Sharp + Tesseract.js / jsQR บน Node.js
- **เอกสารใบสั่งซื้อ (Purchase Order Document & PDF)**: พิมพ์และส่งออกใบสั่งซื้อ (PO) รูปแบบ PDF ได้ทันทีเมื่อสถานะออกใบเสร็จเรียบร้อย
- **ระบบจัดการบัญชีลูกค้า (Customer Account)**: ตรวจสอบประวัติการสั่งจองและจัดการที่อยู่จัดส่ง

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend & Backend**: Next.js 16 (React 19, TypeScript, App Router, Turbopack)
- **Styling**: Tailwind CSS, Lucide React
- **Database**: Microsoft SQL Server (MSSQL) ผ่าน `mssql`
- **Slip Verification**: Python 3.10+ (FastAPI, Uvicorn, zxing-cpp, RapidOCR)
- **Production Server**: Internet Information Services (IIS) บน Windows Server ด้วย URL Rewrite + ARR Proxy และ PM2

---

## 📦 การติดตั้งและรันในสภาพแวดล้อม Development

1. **คัดลอกไฟล์ Environment**:
   ```bash
   cp .env.example .env.local
   ```
   (กำหนดค่าการเชื่อมต่อฐานข้อมูล MSSQL และพอร์ตใน `.env.local`)

2. **ติดตั้ง Dependencies**:
   ```bash
   npm install
   ```

3. **ติดตั้ง Python Microservice**:
   ```bash
   cd python-service
   pip install -r requirements.txt
   cd ..
   ```

4. **รัน Development Server**:
   ```bash
   # เริ่มระบบเว็บ Next.js (พอร์ต 3000)
   npm run dev

   # เริ่มระบบตรวจสลิป Python (พอร์ต 8000)
   npm run slip-service
   ```

---

## 🏢 การขึ้นระบบ Production บน IIS (Windows Server)

ดูรายละเอียดขั้นตอนการติดตั้ง การตั้งค่า ARR Proxy และคำแนะนำสำหรับผู้ดูแลระบบอย่างละเอียดได้ที่:
- [IIS_PRODUCTION_GUIDE.md](IIS_PRODUCTION_GUIDE.md)
- [IIS_PRODUCTION_GUIDE.txt](IIS_PRODUCTION_GUIDE.txt)

---

## 📄 ลิขสิทธิ์
หจก. อุบลรุ่งเรืองเบฟเวอเรจ (U.B.R. Beverage)
