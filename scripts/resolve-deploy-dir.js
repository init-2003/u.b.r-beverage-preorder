#!/usr/bin/env node
/**
 * หาโฟลเดอร์ deploy อัตโนมัติ (แทนการ hardcode path ใน deploy.bat)
 *
 * ลำดับความสำคัญ:
 *   1) ตัวแปรสภาพแวดล้อม `UBR_DEPLOY_DIR` — ระบุเองเมื่อต้องการชี้โฟลเดอร์อื่น
 *      ตัวอย่าง:  set UBR_DEPLOY_DIR=C:\inetpub\ubr-preorder  แล้วค่อยรัน deploy.bat
 *   2) physicalPath ของ IIS site `UBR-PreOrder` (อ่านจาก applicationHost.config)
 *      → ได้ path ที่ IIS ชี้จริง ๆ ไม่ต้องเดา
 *   3) โฟลเดอร์โปรเจกต์ (ที่สคริปต์นี้อยู่) — deploy ณ ที่เดิม (in-place)
 *
 * ใช้งาน: deploy.bat เรียกผ่าน for /f แล้วเอา path บรรทัดเดียวที่พิมพ์ออก
 *          node scripts/resolve-deploy-dir.js
 */
'use strict'

const fs = require('fs')
const path = require('path')

const SITE_NAME = 'UBR-PreOrder'
const projectRoot = path.resolve(__dirname, '..')

function normalize(p) {
  return String(p).trim().replace(/^"|"$/g, '').replace(/[\\/]+$/, '')
}

// 1) override จาก environment
if (process.env.UBR_DEPLOY_DIR && normalize(process.env.UBR_DEPLOY_DIR)) {
  console.log(normalize(process.env.UBR_DEPLOY_DIR))
  process.exit(0)
}

// 2) physicalPath ของ IIS site
try {
  const winDir = process.env.windir || 'C:\\Windows'
  const appHostPath = path.join(winDir, 'System32', 'inetsrv', 'config', 'applicationHost.config')
  if (fs.existsSync(appHostPath)) {
    const xml = fs.readFileSync(appHostPath, 'utf8')
    const siteMatch = xml.match(
      new RegExp(`<site[^>]*\\bname="${SITE_NAME}"[^>]*>([\\s\\S]*?)</site>`, 'i')
    )
    if (siteMatch) {
      const physicalMatch = siteMatch[1].match(/physicalPath="([^"]+)"/i)
      if (physicalMatch && physicalMatch[1]) {
        console.log(normalize(physicalMatch[1]).replace(/&amp;/gi, '&'))
        process.exit(0)
      }
    }
  }
} catch (err) {
  // มีสิทธิ์ไม่พออ่าน / ไม่มี IIS → fallback ข้อ 3
}

// 3) โฟลเดอร์โปรเจกต์ (in-place)
console.log(normalize(projectRoot))
