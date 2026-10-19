import SwalLib from 'sweetalert2';

let activeSwalCount = 0;
let cleanUpScrollLock: (() => void) | null = null;

function lockScroll() {
  if (typeof window === 'undefined') return;
  activeSwalCount++;
  if (activeSwalCount > 1) return; // already locked

  const handleWheel = (e: WheelEvent) => {
    // Fail-safe: ถ้าไม่มี SweetAlert เปิดอยู่ในหน้า ให้ปลดล็อกทันทีและคืนค่าการ scroll ปกติ
    if (!SwalLib.isVisible() && !document.querySelector('.swal2-container.swal2-shown')) {
      if (cleanUpScrollLock) cleanUpScrollLock();
      activeSwalCount = 0;
      return;
    }

    const target = e.target as HTMLElement | null;
    const scrollable = target?.closest('.swal2-html-container') as HTMLElement | null;
    if (!scrollable) {
      if (e.cancelable) e.preventDefault();
    } else {
      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      if (
        (e.deltaY < 0 && scrollTop <= 0) ||
        (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1)
      ) {
        if (e.cancelable) e.preventDefault();
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    // Fail-safe: ถ้าไม่มี SweetAlert เปิดอยู่ในหน้า ให้ปลดล็อกทันทีและคืนค่าการ scroll ปกติ
    if (!SwalLib.isVisible() && !document.querySelector('.swal2-container.swal2-shown')) {
      if (cleanUpScrollLock) cleanUpScrollLock();
      activeSwalCount = 0;
      return;
    }

    const target = e.target as HTMLElement | null;
    const scrollable = target?.closest('.swal2-html-container') as HTMLElement | null;
    if (!scrollable) {
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!SwalLib.isVisible() && !document.querySelector('.swal2-container.swal2-shown')) {
      return;
    }

    const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    if (scrollKeys.includes(e.key)) {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (!isInput) {
        e.preventDefault();
      }
    }
  };

  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('keydown', handleKeyDown);

  cleanUpScrollLock = () => {
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('keydown', handleKeyDown);
    cleanUpScrollLock = null;
  };
}

export function forceUnlockScroll() {
  if (typeof window === 'undefined') return;
  activeSwalCount = 0;
  if (cleanUpScrollLock) {
    cleanUpScrollLock();
  }
}

export function unlockScroll() {
  if (typeof window === 'undefined') return;
  activeSwalCount = Math.max(0, activeSwalCount - 1);
  
  // ตรวจสอบสถานะจริงใน DOM เมื่อ modal ปิด
  setTimeout(() => {
    const isVisible = SwalLib.isVisible() || !!document.querySelector('.swal2-container.swal2-shown');
    if (!isVisible || activeSwalCount <= 0) {
      forceUnlockScroll();
    }
  }, 20);
}

/**
 * Pre-configured SweetAlert2 for U.B.R. Beverage Pre-order system
 * with brand colors (#800020 burgundy), Thai defaults,
 * disabled body height-auto / scrollbar shifts to protect sticky Navbar,
 * and non-invasive background scroll locking while open.
 */
export const Swal = SwalLib.mixin({
  confirmButtonColor: '#800020',
  cancelButtonColor: '#94a3b8',
  confirmButtonText: 'ตกลง',
  showCancelButton: false,
  heightAuto: false,
  scrollbarPadding: false,
  didOpen: () => {
    lockScroll();
  },
  didClose: () => {
    unlockScroll();
  },
  customClass: {
    popup: 'ubr-swal-popup',
    title: 'ubr-swal-title',
    htmlContainer: 'ubr-swal-html',
    confirmButton: 'ubr-swal-confirm-btn rounded-full',
    cancelButton: 'ubr-swal-cancel-btn rounded-full',
  },
});

export const ubrSwal = Swal;
export default Swal;
