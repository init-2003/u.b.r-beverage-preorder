#!/usr/bin/env node
/**
 * Next.js launcher ที่โหลดไฟล์ `.env*` ก่อน — ใช้กับทั้ง `dev` และ `start`
 *
 * ปัญหา 1 (เดิม): ตัว CLI ของ Next.js อ่าน `process.env.PORT` ตอน parse arguments
 *   (ก่อนที่ Next.js จะเรียก `loadEnvConfig`) → `PORT=3001` ใน `.env` ไม่มีผล
 *   → แก้โดยเรียก `loadEnvConfig` จาก `@next/env` (loader ตัวเดียวกับที่ Next.js
 *   ใช้เอง — ได้ลำดับความสำคัญของ `.env*` ถูกต้องตามเอกสาร) ก่อนส่งต่อให้ CLI
 *
 * ปัญหา 2: `next.config.ts` ตั้ง `output: 'standalone'` → `next start` ใช้ไม่ได้เลย
 *   (Next 16 เตือน: "next start does not work with output: standalone.
 *    Use node .next/standalone/server.js instead.")
 *   → คำสั่ง `start` จึงรัน `.next/standalone/server.js` ตรง ๆ แทน
 *   (หรือ `server.js` ที่รูทโฟลเดอร์ สำหรับรูปแบบ copy-deploy)
 *
 * หมายเหตุ: server.js อ่าน `PORT` / `HOSTNAME` จาก environment (ไม่ใช่ argv)
 *   → ตั้งพอร์ตผ่าน `.env` เท่านั้น (`npm run start -- -p 3005` จะไม่มีผล)
 *
 * ใช้งาน: node scripts/run-next.js <next-command> [args...]
 *         (ผูกไว้ใน package.json ที่ `npm run dev` / `npm run start`)
 */
'use strict'

const fs = require('fs')
const path = require('path')
const { loadEnvConfig } = require('@next/env')

const command = process.argv[2]

// ตรงกับที่ Next.js เรียกเอง: loadEnvConfig(dir, phase === PHASE_DEVELOPMENT_SERVER)
// เพื่อให้เลือกไฟล์ `.env.development*` / `.env.production*` ได้ถูกต้อง
loadEnvConfig(process.cwd(), command === 'dev')

if (command === 'start') {
  const cwd = process.cwd()
  // ลำดับ: server.js ที่รูท (รูปแบบ copy-deploy) → .next/standalone/server.js (in-place)
  const serverPath = [
    path.join(cwd, 'server.js'),
    path.join(cwd, '.next', 'standalone', 'server.js'),
  ].find((p) => fs.existsSync(p))

  if (!serverPath) {
    console.error('')
    console.error('[run-next] ไม่พบ standalone server (ยังไม่ได้ build?)')
    console.error('[run-next] รัน `npm run build` ก่อน แล้วค่อย `npm run start`')
    console.error('')
    process.exit(1)
  }

  // standalone ไม่ copy `public` และ `.next/static` มาให้เอง (ตามเอกสาร Next.js)
  // → ตรวจ/คัดลอกก่อนเสมอ กัน CSS/JS/รูป/ฟอนต์ 404
  try {
    require('./standalone-assets').ensureAssetsForServer(serverPath, { log: true })
  } catch (err) {
    console.error('[run-next] คัดลอก assets เข้า standalone ไม่สำเร็จ (ไฟล์ถูก lock / instance เดิมยังรันอยู่?):')
    console.error('[run-next]  ' + err.message)
    process.exit(1)
  }

  console.log(`[run-next] start standalone -> ${path.relative(cwd, serverPath) || serverPath}`)
  console.log(`[run-next] PORT=${process.env.PORT} HOSTNAME=${process.env.HOSTNAME || '0.0.0.0'}`)
  require(serverPath)
} else {
  require('next/dist/bin/next')
}
