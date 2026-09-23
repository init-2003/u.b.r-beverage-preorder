// PM2 Ecosystem Configuration for U.B.R Beverage Pre-Order
// Usage: pm2 start ecosystem.config.js

const fs = require('fs');
const path = require('path');

// 1. อ่านการตั้งค่าจากไฟล์ .env.production หรือ .env โดยอัตโนมัติ
function loadEnv(fileNames) {
  const merged = {};
  for (const name of fileNames) {
    const fullPath = path.join(__dirname, name);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            let val = trimmed.substring(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.substring(1, val.length - 1);
            }
            merged[key] = val;
          }
        }
      });
    }
  }
  return merged;
}

const env = loadEnv(['.env.production', '.env']);

// ดึงพอร์ตที่กำหนดจาก .env (หากไม่กำหนดจะใช้ค่าเริ่มต้น Next.js = 3000, Python = 8000)
const appPort = parseInt(env.PORT || '3000', 10);
const slipPort = parseInt(env.SLIP_SERVICE_PORT || '8000', 10);
const slipUrl = env.SLIP_VERIFIER_URL || `http://127.0.0.1:${slipPort}`;

// 2. ซิงค์พอร์ตใน web.config (IIS Reverse Proxy) ให้ตรงกับ PORT ใน .env โดยอัตโนมัติ
try {
  const webConfigPath = path.join(__dirname, 'web.config');
  if (fs.existsSync(webConfigPath)) {
    const content = fs.readFileSync(webConfigPath, 'utf8');
    const updated = content.replace(
      /(<action\s+type="Rewrite"\s+url="http:\/\/localhost:)\d+(\/\{R:1\}"\s*\/>)/i,
      `$1${appPort}$2`
    );
    if (updated !== content) {
      fs.writeFileSync(webConfigPath, updated, 'utf8');
      console.log(`[PM2 Ecosystem] Synced web.config rewrite port to ${appPort}`);
    }
  }
} catch (err) {
  console.warn('[PM2 Ecosystem] Could not sync web.config automatically:', err.message);
}

module.exports = {
  apps: [
    // ── Next.js Production Server ──
    {
      name: 'ubr-preorder',
      script: 'server.js',
      cwd: __dirname,
      env: {
        PORT: appPort,
        HOSTNAME: env.HOSTNAME || '0.0.0.0',
        NODE_ENV: env.NODE_ENV || 'production',
        // Database
        DB_CONNECTION: env.DB_CONNECTION || 'sqlsrv',
        DB_HOST: env.DB_HOST || '192.168.2.3',
        DB_PORT: env.DB_PORT || '1433',
        DB_DATABASE: env.DB_DATABASE || 'DBUbonRR',
        DB_USERNAME: env.DB_USERNAME || 'sa',
        DB_PASSWORD: env.DB_PASSWORD || '1201455',
        // App
        NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME || 'U.B.R Beverage Pre-Order',
        NEXT_PUBLIC_BRANCH_ID: env.NEXT_PUBLIC_BRANCH_ID || '001',
        JWT_SECRET: env.JWT_SECRET || 'ubr_beverage_preorder_secret_key_2026',
        SLIP_VERIFIER_URL: slipUrl,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/nextjs-error.log',
      out_file: './logs/nextjs-out.log',
      merge_logs: true,
      time: true,
    },

    // ── Python Slip Verification Microservice ──
    {
      name: 'ubr-slip-service',
      interpreter: 'python',
      script: '-m',
      args: `uvicorn python-service.main:app --host 127.0.0.1 --port ${slipPort}`,
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      error_file: './logs/slip-error.log',
      out_file: './logs/slip-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
