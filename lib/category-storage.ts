/**
 * Category Persistence Helper
 * Remembers selected category across page navigations (e.g. visiting product details, cart, checkout, orders)
 */

export const SELECTED_CATEGORY_STORAGE_KEY = 'ubr_selected_category';
export const SELECTED_SUBMENU_ID_STORAGE_KEY = 'ubr_selected_submenu_id';
export const CATEGORY_CHANGE_EVENT = 'ubr_category_change';

export function getStoredCategory(): string {
  if (typeof window === 'undefined') return 'all';
  try {
    const val = localStorage.getItem(SELECTED_CATEGORY_STORAGE_KEY);
    if (!val || val === 'all' || val === 'ทั้งหมด') return 'all';
    return val;
  } catch {
    return 'all';
  }
}

export function getStoredSubMenuId(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const val = localStorage.getItem(SELECTED_SUBMENU_ID_STORAGE_KEY);
    if (!val) return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) ? undefined : num;
  } catch {
    return undefined;
  }
}

export function setStoredCategory(category: string, subMenuId?: number): void {
  if (typeof window === 'undefined') return;
  try {
    if (!category || category === 'all' || category === 'ทั้งหมด') {
      localStorage.removeItem(SELECTED_CATEGORY_STORAGE_KEY);
      localStorage.removeItem(SELECTED_SUBMENU_ID_STORAGE_KEY);
    } else {
      localStorage.setItem(SELECTED_CATEGORY_STORAGE_KEY, category);
      if (subMenuId && subMenuId > 0) {
        localStorage.setItem(SELECTED_SUBMENU_ID_STORAGE_KEY, String(subMenuId));
      } else {
        localStorage.removeItem(SELECTED_SUBMENU_ID_STORAGE_KEY);
      }
    }
  } catch {}

  try {
    window.dispatchEvent(
      new CustomEvent(CATEGORY_CHANGE_EVENT, {
        detail: {
          category: !category || category === 'all' || category === 'ทั้งหมด' ? 'all' : category,
          subMenuId,
        },
      })
    );
  } catch {}
}

export function clearStoredCategory(): void {
  setStoredCategory('all');
}
