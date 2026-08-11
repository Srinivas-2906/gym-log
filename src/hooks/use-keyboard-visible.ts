import { useEffect, useState } from "react";

/** Keyboard open when the visual viewport shrinks significantly (not merely input focus). */
function isKeyboardOpen(): boolean {
  const viewport = window.visualViewport;
  if (!viewport) return false;

  const heightGap = window.innerHeight - viewport.height;
  const offsetGap = viewport.offsetTop;

  // Mobile keyboards usually shrink the visible area by ~150px+.
  return heightGap > 120 || offsetGap > 80;
}

/**
 * True while the on-screen keyboard is open. Does NOT stay true after scroll-dismiss
 * on iOS where the input can remain focused but the keyboard is gone.
 */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(isKeyboardOpen());

    const onFocusIn = () => {
      window.setTimeout(sync, 50);
      window.setTimeout(sync, 200);
    };

    const onFocusOut = () => {
      window.setTimeout(sync, 50);
      window.setTimeout(sync, 250);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.visualViewport?.addEventListener("resize", sync);
    window.addEventListener("resize", sync);

    sync();

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return visible;
}
