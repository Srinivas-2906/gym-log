import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/layout/mobile-shell";
import { DaySection } from "@/components/log/day-section";
import { groupByDay, useEntries } from "@/lib/activities";

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
  const { entries, remove } = useEntries();
  const groups = groupByDay(entries);

  return (
    <MobileShell>
      <div className="space-y-7 px-5 pb-6 pt-9">
        <header className="slide-up">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            {groups.length} {groups.length === 1 ? "day" : "days"} logged
          </p>
          <h1 className="mt-1 font-serif text-[42px] leading-[0.95]">Your days</h1>
        </header>

        <div className="space-y-7 slide-up-2">
          {groups.length > 0 ? (
            groups.map((group) => <DaySection key={group.date} group={group} onDelete={remove} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
              <p className="font-serif text-xl">No days yet</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Log something today and it will show up here.
              </p>
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
