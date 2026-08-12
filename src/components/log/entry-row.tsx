import { useState } from "react";
import { Copy, Dumbbell, HeartPulse, Pencil, Sparkles, Trash2 } from "lucide-react";
import type { LogEntry } from "@/lib/activities";
import { summarizeEntry } from "@/lib/activities";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditEntrySheet } from "./edit-entry-sheet";
import { EntryImageThumb } from "./entry-image-thumb";

const kindIcon = {
  strength: Dumbbell,
  cardio: HeartPulse,
  other: Sparkles,
};

interface EntryRowProps {
  entry: LogEntry;
  onUpdate?: (id: string, data: Omit<LogEntry, "id" | "createdAt">) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function EntryRow({ entry, onUpdate, onDuplicate, onDelete }: EntryRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const summary = summarizeEntry(entry);
  const Icon = kindIcon[entry.kind];
  const time = new Date(entry.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border border-border paper px-4 py-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => onUpdate && setEditOpen(true)}
            disabled={!onUpdate}
          >
            <p className="truncate text-[15px] font-medium leading-tight">{entry.name}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {summary ? `${summary} · ` : ""}
              {time}
            </p>
            {entry.notes ? (
              <p className="mt-1 text-[13px] italic text-muted-foreground">{entry.notes}</p>
            ) : null}
          </button>
          <EntryImageThumb entryId={entry.id} entryName={entry.name} />
        </div>

        <div className="mt-0.5 flex shrink-0 items-center gap-1">
          {onUpdate ? (
            <button
              type="button"
              aria-label={`Edit ${entry.name}`}
              onClick={() => setEditOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Pencil className="size-4" />
            </button>
          ) : null}
          {onDuplicate ? (
            <button
              type="button"
              aria-label={`Log ${entry.name} again`}
              onClick={() => onDuplicate(entry.id)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Copy className="size-4" />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              aria-label={`Delete ${entry.name}`}
              onClick={() => setDeleteOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {onUpdate ? (
        <EditEntrySheet
          entry={entry}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSave={onUpdate}
        />
      ) : null}

      {onDelete ? (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent className="mx-4 max-w-sm rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
              <AlertDialogDescription>
                Remove <span className="font-medium text-foreground">{entry.name}</span> from your
                log. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(entry.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}
