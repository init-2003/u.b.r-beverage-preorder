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
  - **Indexes**: Optimized nonclustered covering indexes on `Trade(productType, Trade_Name)`, `Trade(Trade_Id)`, `Fnt_Detail_online(Branch_Id, Fn_Doc_No, Customer_Id)`, `Fnt_Header_online(Customer_Id, Fn_Doc_Date)`, `Customer(Cus_User)`, etc. (migration script: `scripts/optimize-database.js`).
- **State Management**: React Context (`context/`):
  - `AuthContext`: Manages customer login session, POS customer ID, address, and role.
  - `CartContext`: Pre-order cart state, item quantities, and localStorage persistence (`ubr_cart_items`).
  - `BreadcrumbContext`: Dynamic breadcrumb title override (`setCustomTitle`) across pages.

---

## 2. Database & Business Rules

### Product Data & Pre-Order Filter

- **Pre-Order Condition & SubMenu Reference**:
  - Query products from `Trade` joined with `Type_SubMenu` on `SubMenu_ID_Ref`:
    ```sql
    FROM Trade t
    LEFT JOIN Type_SubMenu sm ON t.SubMenu_ID_Ref = sm.SubMenu_ID
    WHERE UPPER(RTRIM(LTRIM(ISNULL(t.productType, '')))) = 'PREORDER' OR RTRIM(LTRIM(t.Type_Name)) = 'Pre Order'
    ```
  - **Category Display**: Product category is resolved as `sm.SubMenu_NameTH || t.Type_Name || 'Pre Order'`.
  - **CRITICAL**: Do **NOT** use or reference `Trade_Type_Sts_Web` (it has been deprecated and completely removed).
- **Price Calculation**:
  - Price is taken strictly from `Sale_Price1`.
  - If `Sale_Price1 <= 0` or null, display price is numeric `฿0` (or `฿0.00`).
  - **CRITICAL**: Do **NOT** fallback to `t.Cost_Price` (it is confidential internal cost price and must never be shown to customers).
- **Deposit Calculation & Rules**:
  - Primary source is `Trade.Trade_deposit` storing the deposit percentage `%` (e.g. `20` = 20%).
  - Deposit %: `Trade.Trade_deposit` (0 - 100%).
  - Unit deposit price: `(Active_Price * Trade_deposit) / 100` (฿/unit).
  - **CRITICAL**: If `Trade_deposit <= 0` or null, deposit % is 0 and the `%` badge/label is completely omitted from the UI (no hardcoded category percentage fallback).
  - Pre-order orders save total deposit in Baht to `Fnt_Header_online.fn_deposit_H` and item line total deposit in Baht to `Fnt_Detail_online.fn_deposit_D` (`Qty * unitDepositPrice`).
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
- **Clean Checkout URL (`/checkout`) & Remark Lifecycle**:
  - Navigation to checkout (from cart, catalog cards, or product details) uses clean `/checkout` without query strings. Selected item IDs and direct purchase data are stored in `sessionStorage` (`ubr_cart_selected_ids`, `ubr_direct_checkout`). If legacy query parameters are present on initial load, `/checkout` automatically cleanses the browser address bar to `/checkout` via `window.history.replaceState(null, '', '/checkout')`.
  - **Remark Draft Lifecycle (`หมายเหตุ`)**: Order remark text (`ubr_checkout_remark`) persists during browser reload/refresh (F5) via `sessionStorage`. It is managed globally by `CheckoutDraftManager` in `app/layout.tsx` which immediately purges all checkout draft data the moment the user navigates away from `/checkout` (unmounting, clicking '< เลือกดูสินค้าต่อ', navbar navigation, logo clicks, or order placement).
- **Clean Storefront URL (`/`)**:
  - Selecting categories, main types, or submenus on desktop (Sidebar) or mobile (Drawer) retains a clean URL in the browser address bar: strictly `http://localhost:3001/` (or `/`).
  - Active selection is persisted via `localStorage` (`ubr_selected_category`, `ubr_selected_type_id`, `ubr_selected_submenu_id`) and synchronized across components via `CATEGORY_CHANGE_EVENT`.
  - If a user opens a legacy URL with query parameters (e.g. `/?typeId=01&category=...&subMenuId=1`), the page automatically reads the parameters into state and storage, and cleanses the address bar back to `/` via `window.history.replaceState(null, '', cleanUrl)`.
- **Storefront Scroll Restoration (`ubr_home_scroll_y`)**:
  - Scroll positions on both mobile and desktop are saved in real-time to `sessionStorage` (`ubr_home_scroll_y`).
  - **Navigation Scroll Safeguard**: When navigating to product details (`/products/[id]`) or checkout (`/checkout`), Next.js triggers an internal scroll reset to `0` before unmounting the old view. A navigation lock (`ubr_navigating_away = '1'` and `isNavigatingAwayRef`) plus capture-phase click listener prevent this transition reset from overwriting the user's scroll position with `0`.
  - **Multi-Stage Restoration**: Upon returning to `/` or refreshing, scroll is restored via a progressive backoff loop (`requestAnimationFrame` + `setTimeout` up to 15 attempts bounded by `document.documentElement.scrollHeight - window.innerHeight`), ensuring smooth return even on mobile devices where image layout and grid reflow take 100-300ms.
  - **Category / Logo Reset**: Explicitly selecting a category (Sidebar / Mobile Drawer / Pills) or tapping the company logo resets `ubr_home_scroll_y` to `0` and smoothly scrolls to top.
- **Order Details URL (`/orders/[docNo]`)**:
  - Viewing order details shows the explicit document number URL `/orders/[docNo]` (e.g. `/orders/ORD69001046`). The active document number is saved to `sessionStorage` (`ubr_active_order_doc_no`).
  - If a user directly accesses `/orders`, `app/orders/page.tsx` retrieves `ubr_active_order_doc_no` from `sessionStorage` and immediately redirects to `/orders/[docNo]`. If no active order exists in session storage, it safely redirects to `/orders/history`.
  - Order cards across `/orders/history`, `/purchases/history`, and `/orders/[docNo]` feature crisp `border border-slate-200 shadow-xs` with matching `border-slate-200` interior dividers to provide clear visual boundaries on the clean `#ffffff` canvas.
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
  - **Graceful Fallback**: If Python microservice is offline or times out (> 3.5s), `lib/slip-verification.ts` automatically and seamlessly falls back to the in-process Node.js engine (`sharp` + `jsQR` + `tesseract.js` using local offline `osd.traineddata`, `tha.traineddata`, and `eng.traineddata` for automatic orientation detection and slip rotation).
  - **Start Command**: Run `run_slip_service.bat` or `npm run slip-service` (ทั้งคู่อ่านพอร์ตจาก `SLIP_SERVICE_PORT` ใน `.env` — เปลี่ยนพอร์ต = แก้ `.env` ที่เดียว แล้ว restart ทุก service)

### Customer Authentication & Login

- **Table**: `Customer`
- **Credentials**:
  - Customer Username: `Customer.Cus_User` (with fallback to `Customer.Customer_Id`)
  - Customer Password: `Customer.Cus_SPass`
  - Password is verified directly against `RTRIM(LTRIM(cus.Cus_SPass))`
- **Session & Orders Binding**:
  - Always store `Customer_Id` into `CustomerSession.customerId` so all pre-order transactions link properly to the customer's POS account.
- **Default Storefront State on Login / Logout (`/`)**:
  - When a customer logs out or logs in, the storefront resets to its pristine default state:
    - **Category Sidebar**: Defaults to **OPEN (Expanded)** (`isSidebarCollapsed = false`, `ubr_sidebar_collapsed = 'false'`, `ubr_sidebar_collapsed_wide = 'false'`) across both cookies and session storage.
    - **Category Selection**: Cleared to "สินค้าทั้งหมด" (`all`, no `typeId`, no `subMenuId`).
    - **Scroll Position**: Reset to `0` (`ubr_home_scroll_y = '0'`).
    - **Orders History Active Tab**: Defaults strictly to "ทั้งหมด" (`all`, `ubr_orders_active_tab = 'all'`) when visiting `/orders/history` without query parameters, and resets upon logout and login.
    - **Temporary Checkout**: Direct checkout drafts and cart item selections are wiped clean.

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
  - Body Background: `#ffffff` (Pure clean white across the entire application, including homepage, product details, cart, checkout, orders, and account. Product catalog cards feature crisp `border border-slate-200` for clear visual boundaries on the white canvas).
  - Navigation Bar: Burgundy (`#800020` / `#68001a`) with gold/amber accents. Hidden on standalone pages: `/login`, `/cookie-policy`, `/privacy-policy`, and purchase order documents.
    - **Mobile Scroll-Direction Auto-Hiding Navbar (`components/Navbar.tsx`)**: Exclusively on mobile (`< sm` / `< 640px`), the header behaves like a modern feed navbar (e.g. Facebook, Safari). When scrolling DOWN through products/content past the header threshold (`scrollY > 64px` and `delta > 8`), the navbar smoothly slides UP out of view (`max-sm:-translate-y-full`, `transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`) to maximize screen estate. When scrolling UP (`delta < -8`) or reaching near the top (`scrollY <= 24px`), the navbar smoothly slides back DOWN into view (`max-sm:translate-y-0`). While the mobile sidebar drawer or search overlay is open, hiding is disabled. On desktop (`>= sm`), the navbar remains sticky and strictly visible (`sm:translate-y-0`) without hiding.
    - Mobile Search Morph Animation (`components/Navbar.tsx`): Tapping the mobile search icon triggers a coordinated 300ms spring slide & scale morph transition (`cubic-bezier(0.16, 1, 0.3, 1)`). The standard navbar row gracefully fades & shifts left (`opacity-0 -translate-x-3`) while the white search pill expands smoothly into place from the right (`opacity-100 translate-x-0 scale-100`) with auto-focus. Tapping `[ ✕ ]` smoothly reverses the animation.
    - Mobile Category Sidebar Drawer (`components/Navbar.tsx`): In mobile view (`< sm`), category selection is accessible via a 3-bar hamburger icon (`Menu` from `lucide-react`) both on the main navbar (left of Navbar) and inside the search pill. Tapping it opens a smooth hardware-accelerated full-width Sidebar Drawer (`w-full`, anchored directly below the navbar `top-16`, `h-[calc(100vh-4rem)]`, strictly `sm:hidden` with window resize listeners auto-closing on desktop viewports `>= 640px` to prevent drawer leaks upon resizing). The hamburger button morphs smoothly into an `X` (`✕`) icon while open. Tapping the `X` button or selecting a category closes the drawer and morphs the button back to `☰`. Inside the drawer, navigation uses a 2-level iOS-style sliding drill-down:
      - **Level 1 (Main Categories)**: Displays "สินค้าทั้งหมด" and main category types from `/api/menu-tree` with `> ChevronRight` arrows. Tapping a category with submenus slides the panel track (`w-[200%]`, `translateX(-50%)`, 300ms spring ease) to Level 2. Tapping a category without submenus selects it immediately and closes the drawer.
      - **Level 2 (Sub-Categories)**: Features a sticky top header `< [ชื่อหมวดหมู่]` (`ChevronLeft`) to slide back to Level 1. The list begins with `[ชื่อหมวดหมู่]ทั้งหมด` (without right chevron) to filter by the entire type, followed by submenus with `> ChevronRight` arrows. Active selection is synchronized across URL (`typeId`, `subMenuId`, `category`), local storage, and desktop navbar. On the mobile navbar, the company name text is hidden and the logo emblem is positioned cleanly in the horizontal center (`[☰]` ... `[Logo]` ... `[🔍][👤][🛒]`). On desktop (`>= sm`), the company logo renders with `suffix="(Pre-order)"` (`หจก.อุบลรุ่งเรืองเบฟเวอเรจ (Pre-order)`), the redundant category dropdown pill inside the search bar has been removed, providing a clean, spacious full-width search bar with burgundy search button, while category filtering is handled via the Left Category Sidebar.
    - Category Dropdown Staggered Cascade Animation (`.animate-dropdown-panel`, `.animate-dropdown-item`): When opening the category dropdown (both desktop search bar pill and mobile drawer), the container reveals with a smooth spring unfold (`translateY: -8px -> 0`, `scale: 0.98 -> 1`), and each category item cascades down sequentially one by one (`animationDelay: (idx + 1) * 35ms`, `translateY: -10px -> 0`, `opacity: 0 -> 1`) for a fluid waterfall reveal effect.
    - Category Selection Persistence (`lib/category-storage.ts`): When a user selects a category (e.g. `เบอร์เบิร์น`) via the navbar dropdown pill or mobile sidebar drawer, the selection is saved to `localStorage` (`ubr_selected_category` and `ubr_selected_submenu_id`) and synchronized via `ubr_category_change` custom events. When navigating to other pages (e.g. `/products/[id]`, `/cart`, `/checkout`, `/orders/history`) where `?category=` is omitted from the URL, the navbar category pill retains and displays the remembered category label instead of resetting to "ทั้งหมด ⌵". When the user explicitly selects "ทั้งหมด" or clicks "ดูสินค้าทั้งหมด", the stored category is cleared and reset to "ทั้งหมด ⌵".
  - **Background Scroll Locking on Modals & Dropdowns (`components/ui/Modal.tsx`, `components/Navbar.tsx`, `components/CartDropdown.tsx`)**:
    - When `MobileCategorySidebarContent` is open: Navbar `<header>` switches to `fixed top-0 inset-x-0` to guarantee zero gap between the navbar and drawer. Background scroll locking is handled via non-invasive non-passive event listeners (`touchmove`, `wheel`, and navigation keys) and `overscroll-contain touch-pan-y` without setting `overflow: hidden` on `html`/`body`, preserving `position: sticky` and preventing navbar clipping/gap leaks when opening the drawer from scrolled positions.
    - When `SearchCategoryDropdown` or `CartDropdown` is open: Non-invasive event interception (`wheel` and `touchmove` outside the container) and `overscroll-contain` isolate list scrolling.
- **Login System (`/login` & Authentication Gate)**:
  - Private B2B Store Gate: Visitors must log in to access the store (`/` and store pages redirect unauthenticated requests to `/login` via `proxy.ts` and client-side guards).
  - Standalone `/login` page (`app/login/page.tsx` & `LoginClient.tsx`): Styled with `CompanyLogo` (`suffix="(Pre-order)"`) on the top Burgundy header row (`bg-[#800020]`, `max-w-[1600px]`, `h-16 sm:h-20`), with the middle area being clean white (`bg-white`) containing the centered login form in a seamless, cardless layout (title "เข้าสู่ระบบ", input fields, remember me checkbox, customer service note, and submit button directly on the white canvas without card borders or shadows). Main Navbar hidden and Footer displayed at the bottom. During submission and redirect, an animated streaming gold/amber progress bar (`.animate-top-loading-bar`) runs along the bottom edge of the Burgundy Logo header while the submit button shows loading status, seamlessly redirecting strictly to the store homepage (`/` - `http://localhost:3001/`) without full-screen loading page flicker. Every new login ALWAYS redirects strictly to `/`.
  - **Error Alert Placement**: The authentication error alert banner (`Alert variant="error"`, e.g. "ไม่พบบัญชีลูกค้านี้ในระบบ") is placed directly above the submit button (below the inputs, checkboxes, and support note) so that when an error occurs, the input fields (`รหัสลูกค้า`, `รหัสผ่าน`) stay completely stationary and are never pushed down by layout shift.
  - Modal login popup (`LoginModal.tsx`) and guest cart merging (`ubr_pending_checkout_merge`) have been completely removed and decommissioned because authentication is 100% enforced via Private B2B Store Gate. Customers must always be logged in before viewing or purchasing products.
- **Policy Documents (`/cookie-policy`, `/privacy-policy`)**:
  - Rendered in a clean, formal Microsoft Word document format (plain white paper canvas, centered document headings, no web card borders/shadows/gradients).
  - All data tables use standard Word-style full-grid borders (`border-collapse border border-slate-400 [&_th]:border [&_th]:border-slate-400 [&_td]:border [&_td]:border-slate-400`) with light gray header rows (`bg-slate-100`) and rectangular cell boundaries.
- **Left Category Sidebar & Catalog Grid (`components/CategorySidebar.tsx`, `components/ProductCatalog.tsx`)**:
  - The homepage layout on desktop (`>= sm`) is divided into two columns: Left Category Sidebar (`w-60 xl:w-64 shrink-0 self-stretch rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs sticky top-[127px] h-[calc(100vh-143px)] flex flex-col`) horizontally aligned with the top of the Banner Carousel, and Right Main Content Area (`flex-1 min-w-0`) containing the Banner Carousel (`components/BannerCarousel.tsx`) at the top and the Product Catalog below it (on mobile `< sm`, the Banner Carousel spans full width, and category selection is handled via the mobile navbar drawer).
  - **Dual-Track Independent Scrolling**: The left category sidebar remains sticky-pinned (`top-[127px] h-[calc(100vh-143px)]`) when scrolling down the products, staying completely motionless from scroll 0 and perfectly aligned with the banner. The top "สินค้าทั้งหมด" button is permanently pinned at the top (`shrink-0`), while the category list scrolls independently (`flex-1 min-h-0 overflow-y-auto sidebar-scrollbar overscroll-contain touch-pan-y`) when the menu tree expands with multiple submenus, isolated from the right catalog scroll track without scroll chaining.
  - **Scroll Blur & Fade Masks (`.sidebar-scroll-fade-top`, `.sidebar-scroll-fade-bottom`)**: To eliminate abrupt text clipping at the top divider line and bottom card border when scrolling through categories, the scroll container is wrapped with dynamic soft blur & fade gradient overlays (`backdrop-filter: blur(4px)`, masked linear gradients). The top fade gracefully activates when scrolled down (`scrollTop > 2`) and disappears when at the top; the bottom fade indicates additional content below and disappears when scrolled to the end. The overlays use `pointer-events-none` and `right: 6px` so the scrollbar remains crisp and fully interactive.
  - **Scroll Position Persistence (`ubr_sidebar_scroll_top`)**: The scroll position (`scrollTop`) of the Left Category Sidebar is automatically persisted to `sessionStorage` in real time and upon unmount/`beforeunload`. When the user refreshes the page (F5) or navigates to other pages (e.g. `/products/[id]`, `/cart`, `/orders`) and returns to the storefront, the exact sidebar scroll position is restored seamlessly.
  - **Navbar Category Toggle & Responsive Auto-Collapse (< 1200px)**:
    - **Navbar 3-Line Hamburger Button (`components/Navbar.tsx`)**: The 3-line hamburger menu button (`☰` / `Menu`) is anchored on the top Burgundy navbar directly to the left of the Company Logo, with the logo shifted slightly to the right (`ml-1.5 sm:ml-2.5`) across all pages. On the homepage, tapping `[ ☰ ]` on the navbar triggers `SIDEBAR_TOGGLE_EVENT` to smoothly toggle the Left Category Sidebar. On other pages (or mobile `< sm`), it opens the Category Drawer or navigates to `/`.
    - **Clean Body Layout on Collapse**: When collapsed, the in-page sidebar animates smoothly to `w-0` with negative margin `-mr-4 lg:-mr-6`, eliminating awkward floating buttons in the page body and allowing the banner carousel and product catalog to span **100% full width**. On wide screens, the product catalog expands to **5 columns** (`grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`). The top row of the expanded sidebar still provides the `<` (`ChevronLeft`) button for in-page collapsing.
    - **Auto-Collapse on Shrunk Screens**: When the browser window is resized or opened on a narrower screen (< 1200px, including tablet / split-screen viewports 768px-1199px), the sidebar automatically collapses to width 0 without cluttering the page body, leaving the 3-column product grid (`md:grid-cols-3`) with plenty of breathing space, accessible via the `[ ☰ ]` button on the navbar. When resized back to wide desktop (>= 1200px), it smoothly auto-expands back to full width. The collapse state is persisted in `sessionStorage` (`ubr_sidebar_collapsed` and `ubr_sidebar_collapsed_wide`).
  - **Menu Hierarchy**: Main categories are populated from table `[Type]`, with collapsible/expandable submenus from table `Type_SubMenu` (`Type_SubMenu.Type_ID = Type.Type_Id`). Categories with submenus display a smooth-rotating Chevron Right arrow (`> ChevronRight`) upon expansion instead of +/-.
  - Pre-order product counts are calculated dynamically (`/api/menu-tree`) per Type and SubMenu.
  - Active selection is synchronized across URL (`typeId`, `subMenuId`, `category`), local storage (`ubr_selected_type_id`, `ubr_selected_submenu_id`, `ubr_selected_category`), navbar category dropdown, and mobile drawer.
- **Product Catalog Cards & Empty States (`components/ProductCatalog.tsx`)**:
  - Cards feature a smooth staggered slide-up & fade-in entrance animation (`.animate-product-card-slide-up`, `translateY: 22px -> 0`, `opacity: 0 -> 1`, `cubic-bezier(0.16, 1, 0.3, 1)`) with cascading wave delay (`min(index, 14) * 35ms`) upon entering the catalog.
  - **Unified Animated Illustration Design System (Pure SVG + CSS Keyframes)**:
    - All empty state illustrations feature gentle isometric object floating (`@keyframes ...Float 3.2s ease-in-out infinite`), soft pastel background circles (`#EBF0F5`), ground shadows, twinkling sparkle stars (`@keyframes sparkleTwinkle 2.2s`), and rising bubbles (`@keyframes bubbleRise 3s`):
      - **Empty Category (`components/EmptyCategoryIllustration.tsx`)**: Isometric kraft box with prominent circular red cross badge (`กากบาท ✕`) displaying "ยังไม่มีสินค้าในหมวดหมู่นี้" and "[ ดูสินค้าทั้งหมด ]" button.
      - **Empty Search (`components/EmptySearchIllustration.tsx`)**: Isometric parcel box with teal tape, white label, and magnifying glass lens displaying "ไม่พบสินค้าที่ค้นหา".
      - **Empty Cart (`components/EmptyCartIllustration.tsx` & `CartDropdown.tsx`)**: Warm kraft shopping bag floating with swaying Thai Baht ฿ price tag.
      - **Empty Orders (`components/EmptyOrdersIllustration.tsx`)**: Honey-wood clipboard with wiggling mint pencil on `/orders/history`.
      - **Empty Checkout (`components/EmptyCheckoutIllustration.tsx`)**: Shopping bag with fluttering order receipt and shimmering golden ฿ coin on `/checkout`.
      - **Empty Purchases (`components/EmptyPaymentIllustration.tsx`)**: Multi-layer 3D floating Burgundy U.B.R card, receipt bill, and ฿ coin on `/purchases/history`.
      - **Order Steppers (`components/orders/Step*Illustration.tsx`)**: Dynamic micro-animations for active/completed states (floating cards, rotating gears, fluttering receipts, pulsing seals).
- **Product Details (`/products/[id]`)**:
  - Focus purely on product imagery, name, SKU badge, lead time, pricing, deposit calculation, and action buttons.
  - **Deposit Percentage Badge**: When `depositPercent > 0`, a yellow sticker badge (`มัดจำ ...%` with `#ffe01b` background, amber border, and blue text) is anchored at the top-right corner of the product image showcase, harmonized with the catalog card sticker badge.
  - **Mobile Card Layout**: On mobile screens (`< sm`), the container uses `px-4 sm:px-6 lg:px-8` and `pt-6 sm:pt-8` with an Apple-squircle showcase card (`rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs`) with clean `p-5 sm:p-8 lg:p-10` internal padding, harmonizing seamlessly with the card aesthetic used across `/cart`, `/checkout`, `/orders/[docNo]`, and `/customer/account`.
  - Omit dummy wholesale tier tables and mock workflow boxes unless explicitly requested.
- **Cart Page (`/cart`)**:
  - Mirrored and aligned 100% to the Checkout page (`/checkout`) visual hierarchy and component breakdown.
  - **Clean Card Table Layout**: Items table uses a clean Apple-squircle card (`rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs`) with table header, items list, and dashed bottom action bar (Select all, delete selected, and total items count aligned horizontally on the exact same row `flex-row items-center justify-between` on both mobile and desktop). Below the items card sits the bottom action bar (`< เลือกดูสินค้าต่อ` pill button and selected count), followed by a standalone Order Summary Card (`rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs`) with financial summary rows, dashed divider, and bottom action footer with full-width mobile checkout button (`[ดำเนินการสั่งซื้อ]`). Empty cart state is cardless directly on the white canvas without card borders.
  - Content sections feature smooth slide-up & fade-in entrance animation (`.animate-cart-slide-up`, `translateY: 22px -> 0`, `opacity: 0 -> 1`, `cubic-bezier(0.16, 1, 0.3, 1)`) with subtle cascading delays (`40ms`, `80ms`, `100ms`, `140ms`).
- **Checkout & Confirmation Page (`/checkout`)**:
  - Content sections (header, delivery address section, items table, bottom navigation link, standalone payment method section, standalone order summary section with submit button, and empty state) feature smooth slide-up & fade-in entrance animation (`.animate-checkout-slide-up`, `translateY: 22px -> 0`, `opacity: 0 -> 1`, `cubic-bezier(0.16, 1, 0.3, 1)`) with cascading delays (`40ms`, `80ms`, `100ms`, `120ms`, `140ms`). Empty checkout state is cardless directly on the white canvas without card borders.
  - **Clean Card Table Layout**: Sections (Delivery Address, Items Table, Payment Method, Order Summary) use clean Apple-squircle cards (`rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs`) within standard responsive container padding (`px-4 sm:px-6 lg:px-8`), ensuring all divider and border lines stay bounded within the card boundaries instead of stretching edge-to-edge.
- **Order Details Page (`/orders/[docNo]`)**:
  - Mirrored and aligned 100% to the Checkout page (`/checkout`) visual hierarchy and component breakdown.
  - **Clean Card Table Layout**: Status stepper header, delivery address, ordered items table, payment method, and order summary all use clean Apple-squircle cards (`rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs`), ensuring all divider and border lines stay bounded within the card boundaries instead of stretching edge-to-edge. Container uses `pt-6 sm:pt-8` (24px on mobile) to provide clean breathing space under the sticky burgundy navbar and its drop shadow.
  - **Unified Bottom Summary & Action**: Payment method is displayed as an independent standalone section (eliminating duplicate payment method rows inside the summary section), remark and item count are integrated into the items card dashed bottom bar, and bottom action buttons are embedded cleanly in the summary card's dashed footer with "สั่งซื้อสินค้าอื่นๆ" aligned to the left and "ดูใบสั่งซื้อ" to the right (`justify-between`). On mobile screens (< sm), action buttons across the page (e.g. `[สแกน QR Code ชำระเงิน]`, `[ดูสลิป]`, `[สั่งซื้อสินค้าอื่นๆ]`, `[ดูใบสั่งซื้อ]`) feature 38px-42px touch targets (`min-h-[38px]` to `min-h-[42px]`) with responsive typography (`text-xs sm:text-sm font-bold`), and bottom summary actions adapt dynamically side-by-side (`flex-1 min-w-0`) for effortless mobile tapping while retaining left/right layout on desktop (`sm:flex-initial`).
  - Content sections feature smooth slide-up entrance animation (`.animate-order-slide-up`, `translateY: 22px -> 0`, `opacity: 0 -> 1`, `cubic-bezier(0.16, 1, 0.3, 1)`) with subtle cascading wave delays (`40ms`, `80ms`, `100ms`, `120ms`, `140ms`).
- **Account & History Pages (`/customer/account`, `/orders/history`, `/customer/account/address`, `/purchases/history`)**:
  - The left sidebar (`components/AccountLayout.tsx`) on desktop (>= lg) features a clean, minimal design matching mobile with dashed divider lines (`border-dashed border-slate-200`) separating each menu item. The active menu item is emphasized with bold text (`font-bold text-slate-900`), while inactive items use regular typography (`font-normal text-slate-600 hover:text-slate-900`) on a clean white background, completely unified across mobile and desktop.
  - In mobile view (< lg), the header bar features an animated rotating morph hamburger button (Menu ↔ X with `rotate-90 scale-75` transitions) and a CSS Grid accordion collapsible menu (`.mobile-menu-enter` / `.mobile-menu-exit`) for smooth height and fade open/close animations. The mobile collapsible menu stretches edge-to-edge full width (`-mx-4 sm:-mx-6 lg:mx-0`) with clean `border-dashed border-slate-200` divider lines separating each menu item (`border-b border-dashed border-slate-200` and top `border-t border-dashed border-slate-200`), eliminating floating card boxes and pill backgrounds on mobile in favor of clean bold/regular typography matching modern design.
  - On `/orders/history`, the status tabs capsule bar (`ทั้งหมด`, `รอชำระ`, `กำลังดำเนินการ`, `ออกใบเสร็จแล้ว`, `ยกเลิก`) features smooth horizontal scrolling on mobile (`shrink-0 whitespace-nowrap px-4 text-[13px]`) with auto-centering on tap/mount, expanding across equal-width columns on desktop (`sm:flex-1 sm:text-sm`), while the animated Burgundy indicator smoothly tracks the active tab.
  - The right-side main content panel features a gentle, smooth slide-up & fade-in entrance animation (`.animate-account-slide-up`, `translateY: 10px -> 0`, `opacity: 0 -> 1`, 0.3s cubic-bezier(0.16, 1, 0.3, 1)).
  - During route transitions and data fetching, nested `loading.tsx` maintains the left sidebar visible while centering `WineLoading` (`size="md"`) exclusively within the right-side main content panel without layout remounts or bouncing.
- **Universal Responsive Type Scale System (`app/globals.css`)**:
  - Standardized scale across Mobile (< 640px) and Desktop (>= 640px) using font pairing: **Prompt** (Headings, buttons, currency/prices) + **Noto Sans Thai** (Body text, labels, inputs).
  - **Display / Hero**: Mobile `24px` (`text-2xl`), Desktop `30px - 32px` (`text-3xl`).
  - **Heading 1 (H1)**: Mobile `20px` (`text-xl`), Desktop `24px` (`text-2xl`).
  - **Heading 2 (H2 - Cards)**: Mobile `16px` (`text-base`), Desktop `18px` (`text-lg`).
  - **Heading 3 (H3 - Modals/Catalog)**: Mobile `15px`, Desktop `16px` (`text-base`).
  - **Body Primary**: Mobile `14px` (`text-sm`), Desktop `15px - 16px` (`text-base`).
  - **Body Secondary / Meta**: Mobile `12px` (`text-xs`), Desktop `13px - 14px` (`text-sm`).
  - **Captions / Badges / Tags**: Mobile `11px`, Desktop `12px` (`text-xs`).
  - **Hero Price (Grand Total / Product Details)**: Mobile `22px - 24px` (`text-xl sm:text-2xl`), Desktop `28px - 30px` (`text-2xl sm:text-3xl`).
  - **Item Line Price**: Mobile `14px - 15px` (`text-sm`), Desktop `16px` (`text-base`).
  - **Form Controls & iOS Safari Auto-Zoom Prevention**:
    - Input fields use `bg-slate-50 border border-slate-200 text-slate-900 focus:border-amber-500 focus:bg-white`.
    - **iOS Safari 16px Font Rule**: All text inputs, textareas, and selects must maintain a minimum `font-size` of `16px` (`text-base` or global rule in `globals.css`) on mobile viewports (`< sm` / `max-width: 639.98px`) to prevent iOS Safari from triggering automatic viewport zoom upon focus. Enforced globally in `app/globals.css`.
    - Primary call-to-action buttons use U.B.R. Brand Burgundy (`bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white font-bold`).
  - **Mobile Touch Targets & Button Standards (< sm)**:
    - **Primary CTA Buttons**: Submit, checkout, and buy buttons feature `min-h-[44px]` to `min-h-[48px]` with `text-sm sm:text-base font-bold` for effortless thumb tapping.
    - **Secondary & Card Action Buttons**: Details, payment, PO, and slip buttons feature `min-h-[38px]` to `min-h-[42px]` with `text-xs sm:text-sm font-semibold / font-bold`. On mobile order/purchase cards, multi-button pairs use `flex-1 sm:flex-none` for equal-width distribution.
    - **Quantity Steppers (+ / -)**: Compact table steppers use `h-8` with `w-7.5` buttons and `w-9` input; detail showcase steppers use `h-10` with `w-10` buttons. Quantity input text and (+/-) buttons use clean regular weight (`font-normal`) rather than bold/black styling.
    - **Mobile 4-Column Table Stats**: Compact stats rows (`จำนวน`, `ราคา/หน่วย`, `ราคารวม`, `ยอดมัดจำ`) use `text-[11px] sm:text-xs font-bold leading-none truncate` preventing text wrapping on narrow mobile screens (360px-390px).
    - **Floating Draggable Cart Button (`components/DraggableCartButton.tsx`)**:
      - **Mobile (`< sm`)**: Displays strictly as a comfortable floating circular FAB (`w-16 h-16` / 64px) with 28px cart icon (`w-7 h-7`) and gold badge (`{totalQty}` at `w-6 h-6`), completely omitting the text label to preserve mobile screen estate while enabling effortless thumb tapping.
      - **Desktop (`>= sm`)**: Displays as a normally expanded full pill capsule (`sm:px-5 sm:py-3` ~174px width) showing cart icon, gold badge, and the text label `ดูสินค้าในตะกร้า`.
      - **Cursor Behavior**: Uses standard pointer (`cursor-pointer`) on hover (no grab hand), transitioning to grabbing hand (`active:cursor-grabbing` and `isDragging`) when pressed and dragging.
      - **Corner Snapping**: Draggable across the viewport, automatically snapping to the nearest quadrant corner with spring bounce and persisting corner selection to `localStorage` (`ubr_floating_cart_corner`).

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
