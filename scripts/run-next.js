#!/usr/bin/env node
/**
 * Next.js CLI launcher ที่โหลดไฟล์ `.env*` ก่อน
 *
 * ปัญหา: ตัว CLI ของ Next.js ใช้ `process.env.PORT` (ผ่าน commander `.env('PORT')`)
 * ตอน parse arguments ซึ่งเกิด "ก่อน" ที่ Next.js จะเรียก `loadEnvConfig`
 * (ตัว loader รันใน child process หลังจากเลือกพอร์ตเสร็จแล้ว)
 * ผลคือ `PORT=3001` ใน `.env` ไม่เคยมีผลกับ `next dev` / `next start`
 *
 * วิธีแก้: เรียก `loadEnvConfig` จาก `@next/env` (loader ตัวเดียวกับที่ Next.js
 * ใช้เอง — ได้ลำดับความสำคัญของ `.env*` ถูกต้องตามเอกสาร) ก่อนส่งต่อให้ CLI จริง
 *
 * ใช้งาน: node scripts/run-next.js <next-command> [args...]
 *         (ผูกไว้ใน package.json ที่ `npm run dev` / `npm run start`)
 */
'use strict'

const { loadEnvConfig } = require('@next/env')

const command = process.argv[2]

// ตรงกับที่ Next.js เรียกเอง: loadEnvConfig(dir, phase === PHASE_DEVELOPMENT_SERVER)
// เพื่อให้เลือกไฟล์ `.env.development*` / `.env.production*` ได้ถูกต้อง
loadEnvConfig(process.cwd(), command === 'dev')

require('next/dist/bin/next')
