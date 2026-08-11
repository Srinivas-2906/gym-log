import { toast } from "sonner";

import type { LogEntry } from "@/lib/activities";
import { useEntries } from "@/lib/activities";

export function useEntryActions() {
  const { entries, refresh, create, update, duplicate, remove } = useEntries();

  return {
    entries,
    refresh,
    createEntry: (entry: Omit<LogEntry, "id" | "createdAt">) => {
      create(entry);
      toast.success(`${entry.name} logged.`);
    },
    updateEntry: (id: string, entry: Omit<LogEntry, "id" | "createdAt">) => {
      update(id, entry);
      toast.success(`${entry.name} updated.`);
    },
    duplicateEntry: (id: string) => {
      const copy = duplicate(id);
      if (copy) toast.success(`${copy.name} logged again.`);
    },
    deleteEntry: (id: string) => {
      remove(id);
      toast.success("Entry removed.");
    },
  };
}
