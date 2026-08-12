import type { LogEntry } from "@/lib/activities";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { EntryImageAction } from "@/lib/entry-images";
import { LogEntryForm } from "./log-entry-form";

interface EditEntrySheetProps {
  entry: LogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Omit<LogEntry, "id" | "createdAt">, image?: EntryImageAction) => void;
}

export function EditEntrySheet({ entry, open, onOpenChange, onSave }: EditEntrySheetProps) {
  if (!entry) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6"
      >
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="font-serif text-2xl">Edit entry</SheetTitle>
          <SheetDescription>
            Update sets, reps, notes, or move this to another day.
          </SheetDescription>
        </SheetHeader>
        <LogEntryForm
          key={entry.id}
          date={entry.date}
          entry={entry}
          submitLabel="Save changes"
          onSubmit={(data, image) => {
            onSave(entry.id, data, image);
            onOpenChange(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
