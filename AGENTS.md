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
- **Database**: Microsoft SQL Server (MSSQL) connected via `mssql` (`lib/db.ts`)
  - **Connection Pooling**: Singleton Promise lock preventing pool recreation race conditions, `max: 30`, `min: 5`, `idleTimeoutMillis: 30000`, `acquireTimeoutMillis: 15000`, self-healing error handler.
  - **Indexes**: Optimized nonclustered covering indexes on `Trade(Type_Name, Trade_Name)`, `Trade(Trade_Id)`, `Fnt_Detail_online(Branch_Id, Fn_Doc_No, Customer_Id)`, `Fnt_Header_online(Customer_Id, Fn_Doc_Date)`, `Customer(Cus_User)`, etc. (migration script: `scripts/optimize-database.js`).
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
  - `Fnt_Detail_online` (line items: `Trade_Id`, `Qty`, `Unit_Name`, `Type_Name = 'Pre Order'`, `Sale_Price`, `Line_Total`, `fn_deposit_D`, etc. Note: `Fnt_Detail_online` does NOT have `fn_type_sale` column; that column is in `Fnt_Header_online`)
  - `Customer_online` (ordering customer info snapshot: `Customer_Id`, `Customer_Name`, `Customer_Tel`, `Customer_Address`, `Customer_Zip`, `Customer_Email`, `Customer_Remark`, `Sts`, `Pb_User`, `Pb_Now`, `Fn_Doc_No`, `type_sale = 'Pre Order'`)
- **Order Document Status (`Doc_Sts`)**:
  - `1` = `รอชำระ` (Waiting for payment - Bank transfer without slip attached)
  - `0` = `กำลังดำเนินการ` (In progress - COD or Bank transfer with slip attached)
  - `3` = `ออกใบเสร็จแล้ว` (Receipt issued / Completed)
  - `4` = `ยกเลิก Order` (Cancelled order)
  - *Note*: Pre-order system only sets/updates `1` and `0`. When a payment slip is uploaded for an order with status `1`, it transitions to `0` ONLY when: (1) slip contains a valid reference QR code, and (2) the detected slip amount matches the expected payable amount (deposit `fn_deposit_H` or `Fn_Total`).
- **Purchase Order Document (ใบสั่งซื้อ / PO)**:
  - Can be viewed/printed/downloaded (`/orders/[docNo]/purchase-order-viewer`) when `Doc_Sts` is `'0'` (`กำลังดำเนินการ`) or `'3'` (`ออกใบเสร็จแล้ว`).
  - When `Doc_Sts` is awaiting payment (`'1'`) or cancelled (`'4'`), the print/download button is hidden from the order details page, and direct access to `/purchase-order-viewer` shows a notification informing the user.
- Slip upload endpoint: `/api/upload` (validates that image contains a readable QR code and matches the order amount before saving payment slips to `/public/uploads/slips/[docNo]/[originalFilename]` retaining original file name and storing `[originalFilename]` in `Fnt_Header_online.FILE_NAME_PIC`).
  - **ทน build (durable path)**: standalone `server.js` ทำ `process.chdir(__dirname)` → `process.cwd()` = `.next/standalone` ซึ่งถูกลบทุกครั้งที่ `next build` — `/api/upload` จึงเขียนไฟล์สลิปทั้งที่ `public/uploads/slips` ของรูทโปรเจกต์ (รอด rebuild) และที่ public ที่ server กำลังเสิร์ฟ (เปิดดูได้ทันที) ถ้าทั้งสองที่เป็นที่เดียวกันจะเขียนแค่รอบเดียว
  - **High-Speed Python Microservice**: FastAPI service (`python-service/`) runs on `http://127.0.0.1:8000` with `zxing-cpp` QR detection and `RapidOCR` ONNX engine (< 0.5s response).
  - **Graceful Fallback**: If Python microservice is offline or times out (> 3.5s), `lib/slip-verification.ts` automatically and seamlessly falls back to the in-process Node.js engine (`sharp` + `jsQR` + `tesseract.js`).
  - **Start Command**: Run `run_slip_service.bat` or `npm run slip-service` (ทั้งคู่อ่านพอร์ตจาก `SLIP_SERVICE_PORT` ใน `.env` — เปลี่ยนพอร์ต = แก้ `.env` ที่เดียว แล้ว restart ทุก service)

### Customer Authentication & Login

- **Table**: `Customer`
- **Credentials**:
  - Customer Username: `Customer.Cus_User` (with fallback to `Customer.Customer_Id`)
  - Customer Password: `Customer.Cus_SPass`
  - Password is verified directly against `RTRIM(LTRIM(cus.Cus_SPass))`
- **Session & Orders Binding**:
  - Always store `Customer_Id` into `CustomerSession.customerId` so all pre-order transactions link properly to the customer's POS account.

### API Security & Rate Limiting (`proxy.ts`, `lib/rate-limit.ts`)

- **Architecture**: Next.js 16 Proxy (`proxy.ts`) using an in-memory Sliding Window Counter (`lib/rate-limit.ts`).
- **5-Tier Strategy**:
  - **Tier 1 (Auth/Login)**: `POST /api/auth/login` — 20 req/min (Strict IP partition to prevent brute-force).
  - **Tier 2 (Heavy Tasks)**: `POST /api/upload` (Slip OCR) & `/api/orders/[docNo]/pdf` (Puppeteer) — 30 req/min.
  - **Tier 3 (Transactional)**: `POST /api/orders` (Order placement) — 40 req/min, `GET /api/orders/[docNo]` — 120 req/min.
  - **Tier 4 (Interactive)**: `/api/cart`, `/api/customer/account`, `/api/auth/me`, `GET /api/orders` — 240 req/min.
  - **Tier 5 (Public/Catalog)**: `/api/products`, `/api/categories`, `/api/carousel`, `/api/bank-accounts` — 600 req/min; Global API fallback — 1,000 req/min.
- **Headers & 429 Response**: Returns standard `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` on status `429`.

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
  - Navigation Bar: Burgundy (`#800020` / `#68001a`) with gold/amber accents. Hidden on standalone pages: `/login`, `/cookie-policy`, `/privacy-policy`, and purchase order documents.
    - Mobile Search Morph Animation (`components/Navbar.tsx`): Tapping the mobile search icon triggers a coordinated 300ms spring slide & scale morph transition (`cubic-bezier(0.16, 1, 0.3, 1)`). The standard navbar row gracefully fades & shifts left (`opacity-0 -translate-x-3`) while the white search pill expands smoothly into place from the right (`opacity-100 translate-x-0 scale-100`) with auto-focus. Tapping `[ ✕ ]` smoothly reverses the animation.
- **Login System (`/login` & Authentication Gate)**:
  - Private B2B Store Gate: Visitors must log in to access the store (`/` and store pages redirect unauthenticated requests to `/login` via `proxy.ts` and client-side guards).
  - Standalone `/login` page (`app/login/page.tsx` & `LoginClient.tsx`): Styled with `CompanyLogo` on the top Burgundy header row (`bg-[#800020]`, `max-w-[1600px]`, `h-16 sm:h-20`), with the middle area being clean white (`bg-white`) containing the centered login card (title "เข้าสู่ระบบ", input fields, remember me checkbox, customer service note, and submit button). Main Navbar hidden and Footer displayed at the bottom. During submission and redirect, an animated streaming gold/amber progress bar (`.animate-top-loading-bar`) runs along the bottom edge of the Burgundy Logo header while the submit button shows loading status, seamlessly redirecting to the store catalog without full-screen loading page flicker.
  - Modal login popup (`LoginModal.tsx`) and guest cart merging (`ubr_pending_checkout_merge`) have been completely removed and decommissioned because authentication is 100% enforced via Private B2B Store Gate. Customers must always be logged in before viewing or purchasing products.
- **Product Catalog Cards (`components/ProductCatalog.tsx`)**:
  - Cards feature a smooth staggered slide-up & fade-in entrance animation (`.animate-product-card-slide-up`, `translateY: 22px -> 0`, `opacity: 0 -> 1`, `cubic-bezier(0.16, 1, 0.3, 1)`) with cascading wave delay (`min(index, 14) * 35ms`) upon entering the catalog.
- **Product Details (`/products/[id]`)**:
  - Focus purely on product imagery, name, SKU badge, lead time, pricing, deposit calculation, and action buttons.
  - Features smooth slide-up showcase entrance animation (`.animate-product-detail-slide-up`, `translateY: 24px -> 0`, `opacity: 0 -> 1`).
  - Omit dummy wholesale tier tables and mock workflow boxes unless explicitly requested.
- **Cart Page (`/cart`)**:
  - Content sections (header, items table card, sticky bottom checkout bar, and empty state) feature smooth slide-up & fade-in entrance animation (`.animate-cart-slide-up`, `translateY: 22px -> 0`, `opacity: 0 -> 1`, `cubic-bezier(0.16, 1, 0.3, 1)`) with subtle cascading delays (`40ms`, `80ms`, `120ms`).
- **Checkout & Confirmation Page (`/checkout`)**:
  - Content sections (header, delivery address card, items card, bottom navigation link, payment & summary card, and empty state) feature smooth slide-up & fade-in entrance animation (`.animate-checkout-slide-up`, `translateY: 22px -> 0`, `opacity: 0 -> 1`, `cubic-bezier(0.16, 1, 0.3, 1)`) with cascading delays (`40ms`, `80ms`, `100ms`, `120ms`).
- **Order Details Page (`/orders/[docNo]`)**:
  - Content cards (status stepper header banner, delivery address card, ordered items card, payment method card, financial summary card, and bottom action toolbar) feature smooth slide-up entrance animation (`.animate-order-slide-up`, `translateY: 22px -> 0`, `opacity: 0 -> 1`, `cubic-bezier(0.16, 1, 0.3, 1)`) with subtle cascading wave delays (`40ms`, `80ms`, `100ms`, `120ms`, `140ms`).
- **Account & History Pages (`/customer/account`, `/orders/history`, `/customer/account/address`, `/purchases/history`)**:
  - The left sidebar (`components/AccountLayout.tsx`) features a GPU-accelerated animated sliding active black `#000000` capsule pill (`rounded-full bg-[#000000] text-white font-semibold shadow-sm`, `transform: translateY(...)`, `duration-300 cubic-bezier(0.25, 1, 0.5, 1)`). Clicking an item triggers an immediate optimistic position glide, tactile scale press (`active:scale-[0.98]`), click pulse (`.animate-menu-click`), and hover text slide (`hover:translate-x-1 hover:text-black hover:bg-slate-200/50`). State is cached across route changes to eliminate position reset and flickering.
  - In mobile view (< lg), the header bar features an animated rotating morph hamburger button (Menu ↔ X with `rotate-90 scale-75` transitions) and a CSS Grid accordion collapsible menu (`.mobile-menu-enter` / `.mobile-menu-exit`) for smooth height and fade open/close animations.
  - The right-side main content panel features a gentle, smooth slide-up & fade-in entrance animation (`.animate-account-slide-up`, `translateY: 10px -> 0`, `opacity: 0 -> 1`, 0.3s cubic-bezier(0.16, 1, 0.3, 1)).
  - During route transitions and data fetching, nested `loading.tsx` maintains the left sidebar visible while centering `WineLoading` (`size="md"`) exclusively within the right-side main content panel without layout remounts or bouncing.
- **Unified Loading System (`components/WineLoading.tsx`)**:
  - All page loading states across the application (homepage Suspense & catalog loading `app/page.tsx` & `ProductCatalog.tsx`, product details `app/products/[id]/page.tsx`, cart hydration `app/cart/page.tsx`, checkout `app/checkout/page.tsx`, order history, payment, and customer account) use `WineLoading` (`size="md"`) featuring the floating burgundy bottle with PRE-ORDER label and bouncing dots centered gracefully on `#f5f5f5`. Generic gray skeleton pulses are completely avoided. Root `app/loading.tsx` is omitted so route-specific layouts (like Account sidebar) maintain their persistent layout instead of flashing full-screen loading.
- **Form Controls**:
  - Input fields use `bg-slate-50 border border-slate-200 text-slate-900 focus:border-amber-500 focus:bg-white`.
  - Primary call-to-action buttons use U.B.R. Brand Burgundy (`bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white font-bold`).

---

## 5. Development & Testing Commands

- **Dev Server**: `npm run dev` (port ตาม `PORT` ใน `.env` ปัจจุบัน `http://localhost:3001`)
  - `dev`/`start` รันผ่าน `scripts/run-next.js` ซึ่งเรียก `loadEnvConfig` จาก `@next/env` **ก่อน** ส่งต่อให้ Next.js CLI
  - เหตุผล: ตัว CLI อ่าน `process.env.PORT` ตอน parse args *ก่อน* ที่ Next.js จะโหลด `.env` ( loader รันใน child process ทีหลัง) ทำให้ `PORT=` ใน `.env` ไม่มีผลถ้ารัน `next dev` ตรง ๆ
  - แก้พอร์ต = แก้ `.env` อย่างเดียว (ค่ามากสุด: OS env > `.env.local` > `.env`)
- **Production Start**: `npm run start` — เพราะ `next.config.ts` ตั้ง `output: 'standalone'` → **`next start` ใช้ไม่ได้** (Next 16 เตือน: `Use "node .next/standalone/server.js" instead.`)
  - `scripts/run-next.js start` โหลด `.env*` ก่อน แล้วตรวจ/คัดลอก `public` + `.next/static` เข้า `.next/standalone` ผ่าน `scripts/standalone-assets.js` (standalone ไม่ copy สองโฟลเดอร์นี้ให้เองตามเอกสาร Next.js → ไม่งั้น CSS/JS/รูป 404)
  - รองรับทั้งแบบ in-place (`.next/standalone/server.js`) และแบบ copy-deploy (`server.js` ที่รูทโฟลเดอร์)
  - พอร์ต production อ่านจาก `.env` (`PORT=3001`) — `npm run start -- -p xxxx` ไม่มีผล (server.js อ่าน env ไม่ใช่ argv)
- **One-command Start/Stop**: `start_all.bat` / `stop_all.bat`
  - `start_all.bat` อ่าน `PORT`/`SLIP_SERVICE_PORT` จาก `.env` → ปิดพอร์ตค้าง → เปิด Slip Service หน้าต่างแยก → `npm run dev` ในหน้าต่างปัจจุบัน
  - `stop_all.bat` ปิดทั้งสองพอร์ตตามค่าจาก `.env`
- **Build Verification**: `cmd /c npm.cmd run build` (Turbopack production build)
  - `postbuild` (`node scripts/standalone-assets.js`) รันอัตโนมัติทุกครั้งหลัง build → คัดลอก `public` และ `.next/static` เข้า `.next/standalone/` (merge ไม่ลบไฟล์ที่มีอยู่ เช่น สลิปที่อัปโหลด runtime)
- **Deploy**: `deploy.bat` — หา `DEPLOY_DIR` อัตโนมัติผ่าน `scripts/resolve-deploy-dir.js` (ลำดับ: env `UBR_DEPLOY_DIR` → physicalPath ของ IIS site `UBR-PreOrder` → โฟลเดอร์โปรเจกต์)
  - ถ้าได้โฟลเดอร์เดียวกับโปรเจกต์ = โหมด **IN-PLACE** (build แล้วรันจากที่เดิม ไม่ copy ไฟล์)
  - จะ `pm2 stop all` + `pm2 delete all` **ก่อน build** เพื่อปลด lock ที่ `.next\standalone` (กัน `EBUSY` ตอน build)
  - โหมด COPY จะ copy `scripts\` ไปด้วย เพื่อให้ `npm run start` ในโฟลเดอร์ deploy ใช้ได้
  - ไม่พบ pm2 → ข้าม step PM2 แล้วให้เริ่มเองด้วย `npm run start` หรือ `start_all.bat`
- **Linting**: `npm run lint`
