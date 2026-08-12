import { useCallback, useEffect, useState } from "react";

import { getCustomFieldDefs, registerCustomField, type MetricFieldDef } from "@/lib/metrics";

export function useCustomMetrics() {
  const [customFields, setCustomFields] = useState<MetricFieldDef[]>([]);

  const refresh = useCallback(() => setCustomFields(getCustomFieldDefs()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
