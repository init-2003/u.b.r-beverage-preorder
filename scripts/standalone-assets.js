#!/usr/bin/env node
/**
 * คัดลอก `public` และ `.next/static` เข้าไปใน `.next/standalone`
 *
 * เหตุผล: ตามเอกสาร Next.js (`node_modules/next/dist/docs/.../output.md`)
 *   "This minimal server does not copy the `public` or `.next/static` folders
 *    by default ... cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/"
 *   → ถ้าไม่ก็อปปี้ server.js จะเสิร์ฟ CSS/JS/ favicon/ รูป/ ฟอนต์ ไม่ได้ (404)
 *
 * สำคัญ: ใช้ `fs.cpSync(..., { recursive: true, force: true })` แบบ MERGE
 *   - ไฟล์ที่มีอยู่แล้วใน destination (เช่น สลิปที่อัปโหลดตอน runtime) จะ "ไม่ถูกลบ"
 *   - เท่ากับคำสั่ง `cp -r` ตามที่เอกสารแนะนำ แต่ไม่ลบของเดิมทิ้ง
 *
 * เรียกอัตโนมัติผ่าน npm `postbuild` (ทุกครั้งที่ `npm run build`)
 * และเรียกจาก `scripts/run-next.js` ตอน `npm run start` (กัน build แบบ raw `next build`)
 */
'use strict'

const fs = require('fs')
const path = require('path')

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0
  let n = 0
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) n += countFiles(full)
    else if (e.isFile()) n += 1
  }
  return n
}

/**
 * @param {string} projectRoot  รูทโปรเจกต์ (โฟลเดอร์ที่มี package.json + .next)
 * @param {{ log?: boolean }} [opts]
 * @returns {{ ok: boolean, copied: string[] }}
 */
function copyStandaloneAssets(projectRoot, opts = {}) {
  const log = opts.log === true
  const standalone = path.join(projectRoot, '.next', 'standalone')

  if (!fs.existsSync(path.join(standalone, 'server.js'))) {
    if (log) console.log('[standalone-assets] ยังไม่มี .next/standalone/server.js (รัน `npm run build` ก่อน)')
    return { ok: false, copied: [] }
  }

  /** @type {Array<[string, string, string]>} [label, src, dest] */
  const pairs = [
    ['public', path.join(projectRoot, 'public'), path.join(standalone, 'public')],
    ['.next/static', path.join(projectRoot, '.next', 'static'), path.join(standalone, '.next', 'static')],
  ]

  const copied = []
  for (const [label, src, dest] of pairs) {
    if (!fs.existsSync(src)) {
      if (log) console.warn(`[standalone-assets] ไม่พบโฟลเดอร์ต้นทาง: ${src}`)
      continue
    }
    fs.mkdirSync(dest, { recursive: true })
    fs.cpSync(src, dest, { recursive: true, force: true })
    copied.push(`${label} -> ${countFiles(dest)} ไฟล์`)
  }

  if (log) console.log(`[standalone-assets] OK: ${copied.join(' | ') || 'ไม่มีอะไรต้องคัดลอก'}`)
  return { ok: true, copied }
}

/**
 * ตรวจ/คัดลอก assets ให้ server.js ตัวที่กำลังจะรัน
 * รองรับ 2 รูปแบบ: แบบ in-place (`/project/.next/standalone/server.js`)
 * และ แบบ copy deploy (`/deploy-dir/server.js`)
 *
 * @param {string} serverPath path เต็มของ server.js
 * @param {{ log?: boolean }} [opts]
 */
function ensureAssetsForServer(serverPath, opts = {}) {
  const log = opts.log !== false
  const dir = path.dirname(serverPath)

  // แบบ in-place: .../.next/standalone/server.js → รูทโปรเจกต์คือ 2 ระดับเหนือขึ้นไป
  if (/[\\/]\.next[\\/]standalone$/i.test(dir)) {
    const projectRoot = path.resolve(dir, '..', '..')
    return copyStandaloneAssets(projectRoot, { log })
  }

  // แบบ copy deploy: deploy.bat เป็นคนวาง public/ และ .next/static/ ไว้ให้แล้ว
  const staticDir = path.join(dir, '.next', 'static')
  const publicDir = path.join(dir, 'public')
  if (log) {
    if (!fs.existsSync(staticDir)) {
      console.warn(`[standalone-assets] ไม่พบ ${staticDir} — static อาจหาย (ตรวจ step copy ใน deploy.bat)`)
    }
    if (!fs.existsSync(publicDir)) {
      console.warn(`[standalone-assets] ไม่พบ ${publicDir} — รูป/ ฟอนต์จะ 404`)
    }
  }
  return { ok: fs.existsSync(staticDir) && fs.existsSync(publicDir), copied: [] }
}

module.exports = { copyStandaloneAssets, ensureAssetsForServer, countFiles }

// รันตรง ๆ (npm postbuild): node scripts/standalone-assets.js
if (require.main === module) {
  copyStandaloneAssets(process.cwd(), { log: true })
}
