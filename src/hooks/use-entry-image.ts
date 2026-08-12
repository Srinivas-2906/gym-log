import { useEffect, useState } from "react";

import { getEntryImage } from "@/lib/entry-images";

export function useEntryImageUrl(entryId: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!entryId) {
      setUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    getEntryImage(entryId)
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entryId]);

  return url;
}
