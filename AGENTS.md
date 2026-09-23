<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# U.B.R Beverage Pre-Order System (หจก. อุบลรุ่งเรืองเบฟเวอเรจ)

This document provides developer and AI agent instructions, system architecture, database rules, and UI/UX conventions for the U.B.R Beverage Pre-Order application.

---

## 1. Tech Stack & Environment

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: Microsoft SQL Server (MSSQL) connected via `mssql` (`lib/db.ts`)
- **Styling**: Tailwind CSS, Lucide React icons
- **State Management**: React Context (`context/`):
  - `AuthContext`: Manages customer login session, POS customer ID, address, and role.
  - `CartContext`: Pre-order cart state, item quantities, and localStorage persistence (`ubr_cart_items`).
  - `BreadcrumbContext`: Dynamic breadcrumb title override (`setCustomTitle`) across pages.

---

## 2. Database & Business Rules

### Product Data & Pre-Order Filter

- **Pre-Order Condition**:
  - Always query products from the `Trade` table where:
    ```sql
    WHERE RTRIM(LTRIM(t.Type_Name)) = 'Pre Order'
    ```
  - **CRITICAL**: Do **NOT** use or reference `Trade_Type_Sts_Web` (it has been deprecated and completely removed).
- **Price Calculation**:
  - Price is taken strictly from `Sale_Price1`.
  - If `Sale_Price1 <= 0` or null, display price is numeric `฿0` (or `฿0.00`).
  - **CRITICAL**: Do **NOT** fallback to `t.Cost_Price` (it is confidential internal cost price and must never be shown to customers).
- **Deposit Calculation & Rules**:
  - Primary source is `Trade.Trade_deposit` (money column in database).
  - Unit deposit price: `Trade.Trade_deposit` (฿/unit).
  - Deposit % is calculated dynamically: `(Trade_deposit / Active_Price) * 100`.
  - **CRITICAL**: If `Trade_deposit <= 0` or null, deposit % is 0 and the `%` badge/label is completely omitted from the UI (no hardcoded category percentage fallback).
  - Pre-order orders save total deposit to `Fnt_Header_online.fn_deposit_H` and item line deposit to `Fnt_Detail_online.fn_deposit_D`.
- **Default Product Image**:
  - Whenever a product has no image in the database (`Trade_Part_Image` is null/empty) or the image URL fails to load (error/404), fallback to `/images/ubr_beverage_logo.png` (the official U.B.R. Beverage logo).
- **Lead Time Badge**:
  - The `Trade` table has no column for lead time. Do NOT display "รอสินค้า ... วัน" badge on product cards or product details (omitted completely).

### Orders & Checkout

- **Order Document Number (`Fn_Doc_No`) Sequence**:
  - Sequenced from table `PBM_CTRL` where `PB_RUN_CD = 'ORD'` and `Branch_ID = '001'`.
  - Format: `[PB_RUN_CD][PB_RUN_YR][PB_RUN_NO 6 digits]` (e.g. `ORD69000888`).
  - Atomically increments `PB_RUN_NO = PB_RUN_NO + 1` within the database transaction with row locks for next orders.
- **Pre-Order Cart Persistence (`ORDautorun`)**:
  - When an authenticated customer adds, updates, or removes items in their cart, items are persisted in real time strictly to `Fnt_Detail_online` using `Fn_Doc_No = 'ORDautorun'` referenced by `Customer_Id`.
  - `Fnt_Header_online` is NEVER written or created for temporary cart states. It is reserved strictly for finalized, placed orders.
  - The actual document number (e.g. `ORD69000893`) is NOT generated until checkout is completed.
  - Upon checkout submission, `PBM_CTRL` atomically generates the next real document number sequence, the finalized order is saved to both `Fnt_Header_online` and `Fnt_Detail_online`, and the checked-out items are cleared/cut from the customer's `ORDautorun` cart in `Fnt_Detail_online`.
- Pre-orders are saved to tables:
  - `Fnt_Header_online` (header info: `Branch_Id`, `Fn_Doc_No`, `Fn_Doc_Date`, `Doc_Sts`, `Customer_Id`, `Fn_Total`, `Fn_Amount`, `money_sts`, `FILE_NAME_PIC`, `Fn_Remark`, `fn_deposit_H`, `fn_type_sale = 'Pre Order'`, etc.)
  - `Fnt_Detail_online` (line items: `Trade_Id`, `Qty`, `Unit_Name`, `Sale_Price`, `Line_Total`, `fn_deposit_D`, `fn_type_sale = 'Pre Order'`, etc.)
  - `Customer_online` (ordering customer info snapshot: `Customer_Id`, `Customer_Name`, `Customer_Tel`, `Customer_Address`, `Customer_Zip`, `Customer_Email`, `Customer_Remark`, `Sts`, `Pb_User`, `Pb_Now`, `Fn_Doc_No`, `type_sale = 'Pre Order'`)
- **Order Document Status (`Doc_Sts`)**:
  - `1` = `รอชำระ` (Waiting for payment - Bank transfer without slip attached)
  - `0` = `กำลังดำเนินการ` (In progress - COD or Bank transfer with slip attached)
  - `3` = `ออกใบเสร็จแล้ว` (Receipt issued / Completed)
  - `4` = `ยกเลิก Order` (Cancelled order)
  - *Note*: Pre-order system only sets/updates `1` and `0`. When a payment slip is uploaded for an order with status `1`, it transitions to `0` ONLY when: (1) slip contains a valid reference QR code, and (2) the detected slip amount matches the expected payable amount (deposit `fn_deposit_H` or `Fn_Total`).
- **Purchase Order Document (ใบสั่งซื้อ / PO)**:
  - Can only be viewed/printed/downloaded (`/orders/[docNo]/view-purchase-order`) when `Doc_Sts = '3'` (`ออกใบเสร็จแล้ว`).
  - When `Doc_Sts` is not `'3'`, the print button is hidden from the order details page, and direct access to `/view-purchase-order` shows a notification informing that the receipt must be issued first.
- Slip upload endpoint: `/api/upload` (validates that image contains a readable QR code and matches the order amount before saving payment slips to `/public/uploads/slips/[docNo]/[originalFilename]` retaining original file name and storing `[originalFilename]` in `Fnt_Header_online.FILE_NAME_PIC`).
  - **High-Speed Python Microservice**: FastAPI service (`python-service/`) runs on `http://127.0.0.1:8000` with `zxing-cpp` QR detection and `RapidOCR` ONNX engine (< 0.5s response).
  - **Graceful Fallback**: If Python microservice is offline or times out (> 3.5s), `lib/slip-verification.ts` automatically and seamlessly falls back to the in-process Node.js engine (`sharp` + `jsQR` + `tesseract.js`).
  - **Start Command**: Run `run_slip_service.bat` or `npm run slip-service`.

### Customer Authentication & Login

- **Table**: `Customer`
- **Credentials**:
  - Customer Username: `Customer.Cus_User` (with fallback to `Customer.Customer_Id`)
  - Customer Password: `Customer.Cus_SPass`
  - Password is verified directly against `RTRIM(LTRIM(cus.Cus_SPass))`
- **Session & Orders Binding**:
  - Always store `Customer_Id` into `CustomerSession.customerId` so all pre-order transactions link properly to the customer's POS account.


---

## 3. Navigation & Breadcrumb System

### Global Breadcrumb Architecture (`components/GlobalBreadcrumbs.tsx`)

- **Status**: Removed / Omitted completely from `app/layout.tsx` per user design preference.
- Pages render cleanly directly below the main navigation bar without breadcrumb text.
- **RULE**: Do **NOT** add `<nav aria-label="Breadcrumb">` elements or re-insert `<GlobalBreadcrumbs />` into layouts unless explicitly requested.

### Breadcrumb Trail Rules:

1. **Homepage (All Products - `/`)**: `หน้าหลัก`
2. **Homepage with Category (`/?category=[หมวดหมู่]`)**:
   `หน้าหลัก › [ชื่อหมวดหมู่]` (e.g. `หน้าหลัก › สินค้าโปรโมชัน`)
3. **Product Detail (`/products/[id]`)**:
   `หน้าหลัก › [ชื่อสินค้า]`
4. **Cart (`/cart`)**:
   `หน้าหลัก › ตะกร้าสินค้า`
5. **Pre-Order Confirmation & Checkout (`/checkout`)**:
   - **When clicked from Home Page card (`from=catalog`)**:
     `หน้าหลัก › ยืนยันการสั่งจองสินค้า` (2 items)
   - **When clicked from Product Detail page (`from=product`)**:
     `หน้าหลัก › [ชื่อสินค้า] › ยืนยันการสั่งจองสินค้า` (3 items)
   - **When clicked from Cart (`from=cart` or multi-item checkout)**:
     `หน้าหลัก › ตะกร้าสินค้า › ยืนยันการสั่งจองสินค้า` (3 items)
6. **Order History (`/orders/history` or `/orders`)**:
   `หน้าหลัก › ประวัติการสั่งจองสินค้า`
7. **Order Details (`/orders/[docNo]`)**:
   `หน้าหลัก › ประวัติการสั่งจองสินค้า › [เลขที่ใบสั่งจอง]`
8. **Login (`/login`)**:
   `หน้าหลัก › เข้าสู่ระบบ`
9. **Customer Account Pages (`/customer/account`, `/customer/account/address`)**:
   - `หน้าหลัก › บัญชีของฉัน` (`/customer/account`)
   - `หน้าหลัก › บัญชีของฉัน › ข้อมูลที่อยู่จัดส่งสินค้า` (`/customer/account/address`)

### Navigation & Back Navigation

- Breadcrumb navigation is clean and text-only (`หน้าหลัก › ...`). The right-side `← ย้อนกลับ` button has been removed from `GlobalBreadcrumbs` per user design preference.
- Users navigate using the clickable breadcrumb links (e.g. `หน้าหลัก`), browser navigation, or in-page contextual back links.

---

## 4. UI / UX Design System & Conventions

- **Unified Layout Max-Width**:
  - All main page containers, Navbar, Breadcrumbs, and Footer use a standardized `max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8` for full visual harmony on widescreen displays.
- **Clean White Theme**:
  - Cards: `bg-white border border-slate-200 rounded-lg shadow-sm/shadow-xl`.
  - Body Background: `#f5f5f5` (Off-white / Soft gray background highlighting white cards).
  - Navigation Bar: Deep burgundy (`#290308` / `#42070f`) with gold/amber accents.
- **Login Modal (`LoginModal.tsx`)**:
  - Modal login popup triggered dynamically across the site via `useAuth().openLoginModal()` (e.g. Navbar, checkout, and protected pages).
  - Standalone `/login` page has been deprecated and removed.
- **Product Details (`/products/[id]`)**:
  - Focus purely on product imagery, name, SKU badge, lead time, pricing, deposit calculation, and action buttons.
  - Omit dummy wholesale tier tables and mock workflow boxes unless explicitly requested.
- **Form Controls**:
  - Input fields use `bg-slate-50 border border-slate-200 text-slate-900 focus:border-amber-500 focus:bg-white`.
  - Primary call-to-action buttons use U.B.R. Brand Red (`bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white font-bold`).

---

## 5. Development & Testing Commands

- **Dev Server**: `npm run dev` (starts on `http://localhost:3000`)
- **Build Verification**: `cmd /c npm.cmd run build` (Turbopack production build)
- **Linting**: `npm run lint`
