# คู่มือการติดตั้งและขึ้นระบบ Production บน IIS (U.B.R. Beverage Pre-Order)

เอกสารนี้สำหรับผู้ดูแลระบบ (System Administrator / DevOps) ในการนำแพ็กเกจ **U.B.R. Beverage Pre-Order** ขึ้นใช้งานบน Server เครื่องใหม่ที่รันระบบปฏิบัติการ Windows Server / Windows 10/11 Pro ร่วมกับ IIS

---

## สรุปภาพรวมการทำงาน (Architecture Overview)

- **IIS (Port 80 / 443)** ทำหน้าที่เป็น Reverse Proxy รับ request จากผู้ใช้งานภายนอก แล้วส่งต่อไปยัง Next.js ผ่านโมดูล URL Rewrite + ARR
- **Next.js Standalone (Port 3001)** รันบน Node.js จัดการหน้าเว็บ, สั่งจอง, ตะกร้าสินค้า, และพิมพ์เอกสาร PO
- **Python Slip Microservice (Port 8000)** รันบน FastAPI ทำหน้าที่ถอดรหัส QR Code สลิปธนาคารและอ่านยอดเงินด้วย OCR ความเร็วสูง (< 0.5 วินาที)
- **PM2** ทำหน้าที่เป็น Process Manager ควบคุมให้ทั้งสอง Service ทำงานตลอด 24 ชั่วโมง และรีสตาร์ตอัตโนมัติหากเกิดข้อผิดพลาด

---

## ขั้นตอนที่ 1: เตรียมและติดตั้งโปรแกรมบน Server ใหม่ (Prerequisites)

ก่อนเริ่มนำไฟล์ขึ้น กรุณาดาวน์โหลดและติดตั้งโปรแกรมต่อไปนี้บน Server ปลายทาง:

### 1.1 เปิดฟีเจอร์ Web Server (IIS)
- เข้าที่ **Server Manager** -> **Add Roles and Features**
- เลือก **Web Server (IIS)**
- ภายใต้หัวข้อ **Application Development** ให้ติ๊กเลือก:
  - `WebSocket Protocol` (จำเป็นสำหรับการสื่อสารแบบ Realtime)
  - `HTTP Redirection`

### 1.2 ติดตั้งส่วนขยาย IIS (จำเป็นอย่างยิ่ง)
1. **URL Rewrite Module 2.1 (x64)**:
   - ดาวน์โหลด: [Microsoft URL Rewrite Module 2.1](https://www.iis.net/downloads/microsoft/url-rewrite)
2. **Application Request Routing (ARR) 3.0 (x64)**:
   - ดาวน์โหลด: [Microsoft Application Request Routing 3.0](https://www.iis.net/downloads/microsoft/application-request-routing)

> [!IMPORTANT]
> **การเปิดใช้งาน ARR Proxy ใน IIS (จุดสำคัญที่สุด):**
> 1. เปิดโปรแกรม **Internet Information Services (IIS) Manager**
> 2. ที่หน้าต่างด้านซ้าย ให้คลิกที่ **ชื่อ Server (Root Node)**
> 3. ในหน้าต่างกลาง ดับเบิลคลิกที่ไอคอน **Application Request Routing Cache**
> 4. ที่แผงด้านขวา (Actions Panel) คลิกที่ **Server Proxy Settings...**
> 5. ติ๊กถูกที่ช่อง **"Enable proxy"**
> 6. คลิก **Apply** ที่แผงด้านขวาบน

### 1.3 ติดตั้ง Runtimes
1. **Node.js LTS (v20.x หรือ v22.x)**:
   - ดาวน์โหลด: [https://nodejs.org](https://nodejs.org) (เลือกเวอร์ชัน Windows Installer (.msi) 64-bit)
2. **Python (3.10 - 3.12 หรือ 3.14)**:
   - ดาวน์โหลด: [https://www.python.org/downloads/](https://www.python.org/downloads/)
   - **ข้อควรระวัง**: ขณะติดตั้ง ให้ติ๊กเลือกช่อง **"Add Python to PATH"** ด้านล่างสุดด้วย
3. **PM2 Process Manager**:
   - เปิด Command Prompt (cmd) แล้วรัน:
     ```cmd
     npm install -g pm2
     ```
4. **Google Chrome หรือ Microsoft Edge**:
   - ติดตั้งในเครื่อง เพื่อให้ระบบออกใบสั่งซื้อ (Purchase Order PDF) ทำงานได้

---

## ขั้นตอนที่ 2: วางไฟล์ระบบที่เซิร์ฟเวอร์ (Deploy Files)

1. ก๊อปปี้ไฟล์ `ubr-preorder-release.zip` หรือโฟลเดอร์ `dist_release` ไปยังเซิร์ฟเวอร์
2. แตกไฟล์ทั้งหมดลงในโฟลเดอร์:
   ```
   C:\inetpub\ubr-preorder\
   ```
3. ตรวจสอบโครงสร้างโฟลเดอร์ให้มีลักษณะดังนี้:
   ```
   C:\inetpub\ubr-preorder\
   ├── .next\
   │   └── static\
   ├── node_modules\
   ├── public\
   ├── python-service\
   │   ├── main.py
   │   ├── verifier.py
   │   └── requirements.txt
   ├── .env.production
   ├── ecosystem.config.js
   ├── server.js
   ├── web.config
   ├── eng.traineddata
   ├── tha.traineddata
   ├── setup_target_server.ps1
   ├── setup_iis_site.ps1
   ├── start_server.bat
   ├── stop_server.bat
   └── restart_server.bat
   ```

---

## ขั้นตอนที่ 3: รันสคริปต์เตรียมความพร้อมอัตโนมัติ

1. เปิด **PowerShell ด้วยสิทธิ์ Administrator** (คลิกขวา -> Run as administrator)
2. รันคำสั่งต่อไปนี้:
   ```powershell
   cd C:\inetpub\ubr-preorder
   powershell -ExecutionPolicy Bypass -File .\setup_target_server.ps1
   ```
   *สคริปต์จะทำการ:*
   - ติดตั้ง Python packages สำหรับตรวจสลิป (`fastapi`, `uvicorn`, `zxing-cpp`, `rapidocr-onnxruntime`, `numpy`, `opencv`, ฯลฯ)
   - กำหนดสิทธิ์โฟลเดอร์ให้กลุ่ม `IIS_IUSRS` และ `IUSR`
   - ตรวจสอบการเชื่อมต่อ Port 1433 ไปยัง MSSQL Database (`192.168.2.3`)

---

## ขั้นตอนที่ 4: สร้างและตั้งค่า IIS Website

คุณสามารถทำได้ 2 วิธี (เลือกวิธีใดวิธีหนึ่ง):

### วิธีที่ 1: รันสคริปต์อัตโนมัติ (แนะนำ)
เปิด PowerShell (Administrator) แล้วรัน:
```powershell
powershell -ExecutionPolicy Bypass -File .\setup_iis_site.ps1
```
*สคริปต์จะสร้าง Application Pool `UBR-PreOrder-Pool` (No Managed Code) และสร้าง Website `UBR-PreOrder` บนพอร์ต 80 ให้อัตโนมัติ*

### วิธีที่ 2: ตั้งค่าด้วยมือผ่าน IIS Manager (GUI)
1. เปิด **IIS Manager**
2. สร้าง **Application Pool**:
   - Name: `UBR-PreOrder-Pool`
   - .NET CLR version: **No Managed Code**
   - Managed pipeline mode: **Integrated**
3. สร้าง **Website**:
   - Site name: `UBR-PreOrder`
   - Application pool: `UBR-PreOrder-Pool`
   - Physical path: `C:\inetpub\ubr-preorder`
   - Binding: Type `http`, Port `80` (หรือพอร์ตที่ต้องการ)

---

## ขั้นตอนที่ 5: เริ่มต้นการทำงานของระบบ (Start Services)

1. ดับเบิลคลิกที่ไฟล์:
   ```
   C:\inetpub\ubr-preorder\start_server.bat
   ```
   *หรือเปิด cmd แล้วรัน `pm2 start ecosystem.config.js && pm2 save`*
2. ตรวจสอบตารางสถานะของ PM2:
   - `ubr-preorder`: สถานะ **online**
   - `ubr-slip-service`: สถานะ **online**

---

## ขั้นตอนที่ 6: การตั้งค่าให้ Service เปิดอัตโนมัติเมื่อ Server Restart

เพื่อให้ระบบเปิดตัวเองอัตโนมัติทุกครั้งที่ Windows Server ถูกรีบูต:

### วิธีที่ 1: ใช้ PM2 Windows Service (แนะนำ)
เปิด Command Prompt (Administrator) แล้วรัน:
```cmd
npm install -g pm2-windows-service
pm2-service-install -n PM2
```
(เมื่อระบบถามว่าให้บันทึก environment ปัจจุบันหรือไม่ ให้กดตอบ `Y`)

### วิธีที่ 2: ใช้ Windows Task Scheduler
1. เปิด **Task Scheduler** บน Windows
2. สร้าง Basic Task ชื่อ `Start UBR Pre-Order Services`
3. ตั้ง Trigger เป็น **When the computer starts**
4. Action: **Start a program**
5. Program/script: `C:\inetpub\ubr-preorder\start_server.bat`

---

## คำสั่งสำหรับดูแลระบบ (Operations & Maintenance)

- **ดูสถานะการทำงาน**:
  ```cmd
  pm2 status
  ```
- **ดูบันทึกเหตุการณ์ (Logs แบบ Realtime)**:
  ```cmd
  pm2 logs
  ```
- **รีสตาร์ตระบบทั้งหมด**:
  ดับเบิลคลิก `C:\inetpub\ubr-preorder\restart_server.bat` หรือรัน:
  ```cmd
  pm2 restart all
  ```
- **หยุดการทำงานชั่วคราว**:
  ดับเบิลคลิก `C:\inetpub\ubr-preorder\stop_server.bat`
- **ไฟล์ Logs**:
  - `C:\inetpub\ubr-preorder\logs\nextjs-out.log`
  - `C:\inetpub\ubr-preorder\logs\nextjs-error.log`
  - `C:\inetpub\ubr-preorder\logs\slip-out.log`
  - `C:\inetpub\ubr-preorder\logs\slip-error.log`

---

## การเปลี่ยนพอร์ต (ปรับแก้ที่จุดเดียวใน .env.production)

ระบบถูกออกแบบให้สามารถปรับเปลี่ยนพอร์ตได้ที่ **จุดเดียว** ในไฟล์ `.env.production` (หรือ `.env`):

```env
# Production Server & Service Ports
PORT=3001              # พอร์ตของ Next.js Web Server
SLIP_SERVICE_PORT=8000 # พอร์ตของ Python Slip Microservice
```

> [!TIP]
> **สิ่งที่ระบบจะทำให้อัตโนมัติเมื่อเปลี่ยนพอร์ตใน `.env.production`:**
> 1. เมื่อสั่ง `pm2 restart all` (หรือดับเบิลคลิก `restart_server.bat`)
> 2. `ecosystem.config.js` จะอ่านค่าพอร์ตใหม่จาก `.env.production`
> 3. ทำการอัปเดตกฎ Rewrite ใน `web.config` ของ IIS ให้อัตโนมัติทันที
> 4. ปรับพอร์ตของ Next.js, Uvicorn (Python) และส่ง URL ตรวจสลิปให้ Next.js เชื่อมต่อตรงกันโดยอัตโนมัติ 100% โดยที่คุณไม่ต้องไปไล่แก้หลายไฟล์
