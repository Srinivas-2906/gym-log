import { useCallback, useEffect, useState } from "react";

import type { ActivityKind } from "@/lib/activities";
import {
  addPreset,
  getPresets,
  removePreset,
  savePresets,
  type ActivityPreset,
} from "@/lib/presets";

const PRESETS_STORAGE_KEY = "daylog-presets";

export function usePresets() {
  const [presets, setPresets] = useState<ActivityPreset[]>([]);

  const refresh = useCallback(() => setPresets(getPresets()), []);

  useEffect(() => {
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === PRESETS_STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const createPreset = useCallback(
    (input: { name: string; kind: ActivityKind; fields: string[] }) => {
      const preset = addPreset(input);
      refresh();
      return preset;
    },
    [refresh],
  );

  const deletePreset = useCallback(
    (id: string) => {
      removePreset(id);
      refresh();
    },
    [refresh],
  );

  const replacePresets = useCallback(
    (next: ActivityPreset[]) => {
      savePresets(next);
      refresh();
    },
    [refresh],
  );

  return { presets, refresh, createPreset, deletePreset, replacePresets };
}
