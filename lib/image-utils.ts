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

export const DEFAULT_PRODUCT_IMAGE = '/images/ubr_beverage_logo_thumb.webp';
export const DEFAULT_PRODUCT_IMAGE_HIGHRES = '/images/ubr_beverage_logo.webp';
export const DEFAULT_PRODUCT_IMAGE_PNG = '/images/ubr_beverage_logo.png';

/**
 * Resolve product image path:
 * If the image exists on disk in `public/`, return its web path.
 * If not, return the highly optimized 9KB WebP thumbnail logo.
 */
export function resolveProductImageUrl(
  imagePath?: string | null,
  highRes = false
): string {
  const defaultFallback = highRes
    ? DEFAULT_PRODUCT_IMAGE_HIGHRES
    : DEFAULT_PRODUCT_IMAGE;

  if (!imagePath || !imagePath.trim()) {
    return defaultFallback;
  }

  const clean = imagePath.trim().replace(/^[\/\\]+/, '').replace(/\\/g, '/');
  const filesSet = getPublicFilesSet();

  // 1. Direct match in public directory
  if (filesSet.has(clean.toLowerCase()) || filesSet.has(`/${clean.toLowerCase()}`)) {
    return `/${clean}`;
  }

  // 2. Check if clean starts with 'images/' or 'uploads/'
  if (!clean.startsWith('images/') && !clean.startsWith('uploads/')) {
    const withImages = `images/${clean}`;
    if (filesSet.has(withImages.toLowerCase()) || filesSet.has(`/${withImages.toLowerCase()}`)) {
      return `/${withImages}`;
    }
  }

  // 3. Fallback to lightweight optimized logo
  return defaultFallback;
}
