// PM2 Ecosystem Configuration for U.B.R Beverage Pre-Order
// Usage: pm2 start ecosystem.config.js
// พอร์ต Next.js อ่านจาก .env / .env.local / .env.production (ไม่แก้ package.json)

const fs = require('fs');
const path = require('path');

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

// ลำดับ: ไฟล์ท้ายทับค่าไฟล์ต้น — .env / .env.local ทับ .env.production
const env = loadEnv(['.env.production', '.env', '.env.local']);

const appPort = parseInt(env.PORT || '3001', 10);
const slipPort = parseInt(env.SLIP_SERVICE_PORT || '8000', 10);
const slipUrl = env.SLIP_VERIFIER_URL || `http://127.0.0.1:${slipPort}`;
const hostname = env.HOSTNAME || '0.0.0.0';

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

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function resolveNextApp() {
  const standaloneCandidates = [
    path.join(__dirname, 'server.js'),
    path.join(__dirname, '.next', 'standalone', 'server.js'),
  ];
  for (const candidate of standaloneCandidates) {
    if (fs.existsSync(candidate)) {
      return { script: candidate, cwd: path.dirname(candidate), args: '' };
    }
  }

  const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
  if (fs.existsSync(nextBin)) {
    // ไม่ส่ง --port — Next.js อ่าน PORT จาก env
    return { script: nextBin, cwd: __dirname, args: 'start' };
  }

  throw new Error(
    '[PM2] ไม่พบ Next.js — บนเครื่อง server ให้รัน: npm install && npm run build แล้วค่อย pm2 start ecosystem.config.js'
  );
}

const nextApp = resolveNextApp();
console.log(`[PM2 Ecosystem] Next.js PORT=${appPort} script=${nextApp.script} ${nextApp.args || ''}`.trim());

module.exports = {
  apps: [
    {
      name: 'ubr-preorder',
      script: nextApp.script,
      args: nextApp.args || undefined,
      cwd: nextApp.cwd,
      env: {
        PORT: appPort,
        HOSTNAME: hostname,
        NODE_ENV: env.NODE_ENV || 'production',
        DB_CONNECTION: env.DB_CONNECTION || 'sqlsrv',
        DB_HOST: env.DB_HOST || '192.168.2.3',
        DB_PORT: env.DB_PORT || '1433',
        DB_DATABASE: env.DB_DATABASE || 'DBUbonRR',
        DB_USERNAME: env.DB_USERNAME || 'sa',
        DB_PASSWORD: env.DB_PASSWORD || '1201455',
        NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME || 'U.B.R Beverage Pre-Order',
        NEXT_PUBLIC_BRANCH_ID: env.NEXT_PUBLIC_BRANCH_ID || '001',
        JWT_SECRET: env.JWT_SECRET || 'ubr_beverage_preorder_secret_key_2026',
        SLIP_VERIFIER_URL: slipUrl,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: path.join(logsDir, 'nextjs-error.log'),
      out_file: path.join(logsDir, 'nextjs-out.log'),
      merge_logs: true,
      time: true,
      windowsHide: true,
    },
    {
      name: 'ubr-slip-service',
      script: 'python',
      args: `-m uvicorn python-service.main:app --host 127.0.0.1 --port ${slipPort}`,
      interpreter: 'none',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      error_file: path.join(logsDir, 'slip-error.log'),
      out_file: path.join(logsDir, 'slip-out.log'),
      merge_logs: true,
      time: true,
      windowsHide: true,
    },
  ],
};
