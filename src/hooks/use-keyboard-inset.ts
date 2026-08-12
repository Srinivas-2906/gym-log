import { useEffect, useState } from "react";

const KEYBOARD_THRESHOLD = 50;

function measureKeyboardInset(baselineHeight: number): number {
  const viewport = window.visualViewport;
  if (!viewport) return 0;

  // Standard overlay keyboard (iOS Safari / Chrome with overlays-content).
  const fromViewport = window.innerHeight - viewport.height - viewport.offsetTop;

  // Fallback when the layout viewport shrinks (interactive-widget=resizes-content).
  const fromLayoutShrink = baselineHeight - window.innerHeight;

  return Math.max(0, Math.round(Math.max(fromViewport, fromLayoutShrink)));
}

/**
 * Tracks on-screen keyboard height. Nav visibility should follow inset, not focus alone —
 * iOS keeps inputs focused after the keyboard is dismissed.
 */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    let raf = 0;
    let baselineHeight = window.innerHeight;

    const sync = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        setInset(measureKeyboardInset(baselineHeight));
      });
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        window.setTimeout(sync, 50);
        window.setTimeout(sync, 200);
        window.setTimeout(sync, 400);
      }
    };

    const onFocusOut = () => {
      window.setTimeout(sync, 50);
      window.setTimeout(sync, 200);
      window.setTimeout(sync, 450);
    };

    const onOrientationChange = () => {
      baselineHeight = window.innerHeight;
      sync();
    };

    const viewport = window.visualViewport;

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("touchend", sync, { passive: true });
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", onOrientationChange);
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);

    sync();

    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("touchend", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", onOrientationChange);
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
    };
  }, []);

  const isOpen = inset > KEYBOARD_THRESHOLD;

  return { inset, isOpen };
}
