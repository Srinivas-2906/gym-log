import { useEffect, useState } from "react";

function isFormField(
  element: Element | null,
): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  );
}

/** True when the on-screen keyboard is likely open (mobile input focus / viewport shrink). */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => {
      const viewport = window.visualViewport;
      const focusedField = isFormField(document.activeElement);
      const viewportShrunk = viewport != null && viewport.height < window.innerHeight * 0.82;
      setVisible(focusedField || viewportShrunk);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (isFormField(event.target as Element)) setVisible(true);
    };

    const onFocusOut = () => {
      window.setTimeout(sync, 80);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
    };
  }, []);

  return visible;
}
