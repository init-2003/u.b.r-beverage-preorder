import fs from 'fs';
import path from 'path';

// Cached set of existing file paths in the public directory
let cachedPublicFiles: Set<string> | null = null;
let lastCacheScanTime = 0;
const CACHE_TTL_MS = 60 * 1000; // Rescan at most once per minute

/**
 * Returns a Set of all normalized lowercased file paths existing in `public/`
 */
export function getPublicFilesSet(): Set<string> {
  const now = Date.now();
  if (cachedPublicFiles && now - lastCacheScanTime < CACHE_TTL_MS) {
    return cachedPublicFiles;
  }

  const set = new Set<string>();
  const publicDir = path.join(process.cwd(), 'public');

  function scanDirectory(currentDir: string, relPrefix = '') {
    try {
      if (!fs.existsSync(currentDir)) return;
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          scanDirectory(path.join(currentDir, entry.name), relPath);
        } else {
          const lower = relPath.toLowerCase().replace(/\\/g, '/');
          set.add(lower);
          set.add(`/${lower}`);
        }
      }
    } catch (err) {
      console.error('Error scanning public directory for images:', err);
    }
  }

  scanDirectory(publicDir);
  cachedPublicFiles = set;
  lastCacheScanTime = now;
  return set;
}

export const DEFAULT_PRODUCT_IMAGE = '/images/ubr_beverage_logo.png';
export const DEFAULT_PRODUCT_IMAGE_HIGHRES = '/images/ubr_beverage_logo.png';
export const DEFAULT_PRODUCT_IMAGE_PNG = '/images/ubr_beverage_logo.png';

/**
 * Resolve product image path:
 * - If imagePath is null or empty -> fallback to /images/ubr_beverage_logo.png
 * - If imagePath is provided -> ensure clean root-relative or external URL path
 */
export function resolveProductImageUrl(
  imagePath?: string | null,
  _highRes = false
): string {
  if (!imagePath || !imagePath.trim()) {
    return DEFAULT_PRODUCT_IMAGE_PNG;
  }

  const clean = imagePath.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  const normalized = clean.replace(/\\/g, '/');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}
