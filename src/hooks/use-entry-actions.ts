import { toast } from "sonner";

import type { LogEntry } from "@/lib/activities";
import { formatDayLabel, useEntries, yesterdayKey } from "@/lib/activities";
import type { EntryImageAction } from "@/lib/entry-images";
import { copyEntryImage, deleteEntryImage, saveEntryImage } from "@/lib/entry-images";

async function applyImageAction(entryId: string, image?: EntryImageAction) {
  if (image === undefined) return;
  if (image === null) {
    await deleteEntryImage(entryId);
    return;
  }
  await saveEntryImage(entryId, image);
}

export function useEntryActions() {
  const { entries, refresh, create, update, duplicate, copyDay, remove } = useEntries();

  return {
    entries,
    refresh,
    createEntry: (entry: Omit<LogEntry, "id" | "createdAt">, image?: EntryImageAction) => {
      const created = create(entry);
      void applyImageAction(created.id, image);
      toast.success(`${entry.name} logged.`);
    },
    updateEntry: (
      id: string,
      entry: Omit<LogEntry, "id" | "createdAt">,
      image?: EntryImageAction,
    ) => {
      update(id, entry);
      void applyImageAction(id, image);
      toast.success(`${entry.name} updated.`);
    },
    duplicateEntry: (id: string) => {
      const copy = duplicate(id);
      if (copy) {
        void copyEntryImage(id, copy.id);
        toast.success(`${copy.name} logged again.`);
      }
    },
    copyDayRoutine: (fromDate: string, toDate: string) => {
      const copied = copyDay(fromDate, toDate);
      if (copied.length === 0) {
        toast.error("Nothing to copy from that day.");
        return copied;
      }
      const sources = entries
        .filter((e) => e.date === fromDate)
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
      copied.forEach((entry, index) => {
        const source = sources[index];
        if (source) void copyEntryImage(source.id, entry.id);
      });
      toast.success(
        `Copied ${copied.length} ${copied.length === 1 ? "entry" : "entries"} from ${formatDayLabel(fromDate).toLowerCase()}.`,
      );
      return copied;
    },
    copyYesterdayRoutine: (toDate: string) => {
      const fromDate = yesterdayKey();
      const copied = copyDay(fromDate, toDate);
      if (copied.length === 0) {
        toast.error("Nothing logged yesterday.");
        return copied;
      }
      toast.success(
        `Copied ${copied.length} ${copied.length === 1 ? "entry" : "entries"} from yesterday.`,
      );
      return copied;
    },
    deleteEntry: (id: string) => {
      remove(id);
      void deleteEntryImage(id);
      toast.success("Entry removed.");
    },
  };
}
