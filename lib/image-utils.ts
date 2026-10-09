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
export const UBONRR_PRODUCT_IMAGE_ENDPOINT =
  'https://ubonrr.com/services/getinfo/getproductdetail.php?Trade_ID=';

/**
 * Resolve product image path:
 * - If imagePath is null or empty -> fallback to /images/ubr_beverage_logo.png
 * - If external URL (http://, https://, data:) -> return as-is
 * - If image exists in public/ directory -> return clean root-relative path (e.g. /images/xxx.jpg)
 * - If image does not exist on disk -> fallback to /images/ubr_beverage_logo.png to prevent 404 errors
 */
export function resolveProductImageUrl(
  imagePath?: string | null
): string {
  if (!imagePath || !imagePath.trim()) {
    return DEFAULT_PRODUCT_IMAGE_PNG;
  }

  const clean = imagePath.trim();
  if (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('data:')
  ) {
    return clean;
  }

  const normalized = clean.replace(/\\/g, '/').replace(/^\/+/, '');
  const filesSet = getPublicFilesSet();

  // 1. Direct match in public directory (e.g. 'images/foo.jpg')
  if (
    filesSet.has(normalized.toLowerCase()) ||
    filesSet.has(`/${normalized.toLowerCase()}`)
  ) {
    return `/${normalized}`;
  }

  // 2. Check with images/ prefix if not already present
  if (!normalized.startsWith('images/') && !normalized.startsWith('uploads/')) {
    const withImages = `images/${normalized}`;
    if (
      filesSet.has(withImages.toLowerCase()) ||
      filesSet.has(`/${withImages.toLowerCase()}`)
    ) {
      return `/${withImages}`;
    }
  }

  // 3. Direct filesystem check for any newly added runtime uploads or race conditions
  try {
    const directPath = path.join(process.cwd(), 'public', normalized);
    if (fs.existsSync(directPath)) {
      filesSet.add(normalized.toLowerCase());
      filesSet.add(`/${normalized.toLowerCase()}`);
      return `/${normalized}`;
    }
    if (!normalized.startsWith('images/') && !normalized.startsWith('uploads/')) {
      const directWithImages = path.join(process.cwd(), 'public', 'images', normalized);
      if (fs.existsSync(directWithImages)) {
        filesSet.add(`images/${normalized.toLowerCase()}`);
        filesSet.add(`/images/${normalized.toLowerCase()}`);
        return `/images/${normalized}`;
      }
    }
  } catch {
    // ignore filesystem errors and fallback safely
  }

  // 4. Remote image resolution from ubonrr.com service
  // Example: 'images/885710416304.png' -> 'https://ubonrr.com/services/getinfo/getproductdetail.php?Trade_ID=images/885710416304.png'
  const tradeParam = normalized.startsWith('images/') ? normalized : `images/${normalized}`;
  return `${UBONRR_PRODUCT_IMAGE_ENDPOINT}${encodeURIComponent(tradeParam).replace(/%2F/g, '/')}`;
}
