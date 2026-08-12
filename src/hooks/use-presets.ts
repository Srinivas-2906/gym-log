import { useCallback, useEffect, useState } from "react";

import type { ActivityKind } from "@/lib/activities";
import { useAuth } from "@/hooks/use-auth";
import { useUserDataSync } from "@/hooks/use-user-data-sync";
import {
  addPreset,
  getPresets,
  removePreset,
  savePresets,
  type ActivityPreset,
} from "@/lib/presets";
import { userStorageKey } from "@/lib/user-scope";

export function usePresets() {
  const { session } = useAuth();
  const [presets, setPresets] = useState<ActivityPreset[]>([]);

  const refresh = useCallback(() => setPresets(getPresets()), []);

  useEffect(() => {
    refresh();
  }, [session?.phone, refresh]);

  useUserDataSync(refresh);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === userStorageKey("presets")) refresh();
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
