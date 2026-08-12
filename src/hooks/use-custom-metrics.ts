import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useUserDataSync } from "@/hooks/use-user-data-sync";
import { getCustomFieldDefs, registerCustomField, type MetricFieldDef } from "@/lib/metrics";

export function useCustomMetrics() {
  const { session } = useAuth();
  const [customFields, setCustomFields] = useState<MetricFieldDef[]>([]);

  const refresh = useCallback(() => setCustomFields(getCustomFieldDefs()), []);

  useEffect(() => {
    refresh();
  }, [session?.phone, refresh]);

  useUserDataSync(refresh);

  const addCustomField = useCallback(
    (label: string) => {
      const def = registerCustomField(label);
      refresh();
      return def;
    },
    [refresh],
  );

  return { customFields, refresh, addCustomField };
}
