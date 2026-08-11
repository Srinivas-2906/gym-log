import { Dumbbell, HeartPulse, Sparkles, Trash2 } from "lucide-react";
import type { LogEntry } from "@/lib/activities";
import { summarizeEntry } from "@/lib/activities";

const kindIcon = {
  strength: Dumbbell,
  cardio: HeartPulse,
  other: Sparkles,
};

interface EntryRowProps {
  entry: LogEntry;
  onDelete?: (id: string) => void;
}

export function EntryRow({ entry, onDelete }: EntryRowProps) {
  const Icon = kindIcon[entry.kind];
  const summary = summarizeEntry(entry);
  const time = new Date(entry.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border paper px-4 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium leading-tight">{entry.name}</p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          {summary ? `${summary} · ` : ""}
          {time}
        </p>
        {entry.notes ? (
          <p className="mt-1 text-[13px] italic text-muted-foreground">{entry.notes}</p>
        ) : null}
      </div>
      {onDelete ? (
        <button
          type="button"
          aria-label={`Delete ${entry.name}`}
          onClick={() => onDelete(entry.id)}
          className="mt-1 text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
