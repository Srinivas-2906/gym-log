import type { DayGroup } from "@/lib/activities";
import { entryVolume, formatDayLabel } from "@/lib/activities";
import { EntryRow } from "./entry-row";

interface DaySectionProps {
  group: DayGroup;
  onDelete?: (id: string) => void;
}

export function DaySection({ group, onDelete }: DaySectionProps) {
  const volume = group.entries.reduce((sum, e) => sum + entryVolume(e), 0);
  const minutes = group.entries.reduce((sum, e) => sum + (e.durationMin ?? 0), 0);

  const meta = [
    `${group.entries.length} ${group.entries.length === 1 ? "entry" : "entries"}`,
    volume > 0 ? `${volume.toLocaleString()} kg volume` : null,
    minutes > 0 ? `${minutes} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
        <h3 className="font-serif text-2xl leading-none">{formatDayLabel(group.date)}</h3>
        <span className="font-mono text-[11px] text-muted-foreground">{meta}</span>
      </div>
      <div className="space-y-2 pt-1">
        {group.entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} {...(onDelete ? { onDelete } : {})} />
        ))}
      </div>
    </section>
  );
}
