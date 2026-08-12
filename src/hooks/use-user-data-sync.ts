import { useEffect } from "react";

import { USER_CHANGED_EVENT } from "@/lib/user-scope";

export function useUserDataSync(onChange: () => void) {
  useEffect(() => {
    const handler = () => onChange();
    window.addEventListener(USER_CHANGED_EVENT, handler);
    return () => window.removeEventListener(USER_CHANGED_EVENT, handler);
  }, [onChange]);
}
