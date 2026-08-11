import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/layout/mobile-shell";
import { DaySection } from "@/components/log/day-section";
import { LogEntryForm } from "@/components/log/log-entry-form";
import { groupByDay, todayKey } from "@/lib/activities";
import { useEntryActions } from "@/hooks/use-entry-actions";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Your Days — Daylog Workout Journal" },
      { name: "description", content: "Browse every day you trained, entry by entry." },
      { property: "og:title", content: "Your Days — Daylog Workout Journal" },
      { property: "og:description", content: "Browse every day you trained, entry by entry." },
    ],
  }),
  component: DaysPage,
});

function DaysPage() {
  const { entries, createEntry, updateEntry, duplicateEntry, deleteEntry } = useEntryActions();
  const groups = groupByDay(entries);

  const entryHandlers = {
    onUpdate: updateEntry,
    onDuplicate: duplicateEntry,
    onDelete: deleteEntry,
  };

  return (
    <MobileShell>
      <div className="space-y-7 px-5 pb-6 pt-9">
        <header className="slide-up">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            {groups.length} {groups.length === 1 ? "day" : "days"} logged
          </p>
          <h1 className="mt-1 font-serif text-[42px] leading-[0.95]">Your days</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Edit, duplicate, or delete any entry. Log more below for today or a past day.
          </p>
        </header>

        <div className="slide-up-1">
          <LogEntryForm date={todayKey()} onSubmit={createEntry} />
        </div>

        <div className="space-y-7 slide-up-2">
          {groups.length > 0 ? (
            groups.map((group) => <DaySection key={group.date} group={group} {...entryHandlers} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
              <p className="font-serif text-xl">No days yet</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Log something above and it will show up here.
              </p>
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
