import { useEffect, useState } from "react";

/**
 * Pixels the on-screen keyboard occupies from the bottom of the layout viewport.
 * Works on iPhone Chrome/Safari via visualViewport (WebKit).
 */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    let raf = 0;

    const measure = () => {
      const viewport = window.visualViewport;
      if (!viewport) {
        setInset(0);
        return;
      }

      // iOS WebKit: keyboard height = layout height minus visible area minus top offset.
      const keyboard = window.innerHeight - viewport.height - viewport.offsetTop;
      setInset(Math.max(0, Math.round(keyboard)));
    };

    const sync = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(measure);
    };

    const onFocusIn = () => {
      window.setTimeout(sync, 50);
      window.setTimeout(sync, 200);
      window.setTimeout(sync, 400);
    };

    const onFocusOut = () => {
      window.setTimeout(sync, 50);
      window.setTimeout(sync, 200);
      window.setTimeout(sync, 450);
    };

    const viewport = window.visualViewport;

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("touchend", sync, { passive: true });
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);

    sync();

    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("touchend", sync);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
    };
  }, []);

  return inset;
}
