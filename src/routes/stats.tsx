import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/layout/mobile-shell";
import { entryReps, entryVolume, groupByDay, streakDays, useEntries } from "@/lib/activities";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Trends — Daylog Workout Journal" },
      {
        name: "description",
        content: "See your streak, active days, volume and most logged activities.",
      },
      { property: "og:title", content: "Trends — Daylog Workout Journal" },
      {
        property: "og:description",
        content: "See your streak, active days, volume and most logged activities.",
      },
    ],
  }),
  component: TrendsPage,
});

function TrendsPage() {
  const { entries } = useEntries();
  const days = groupByDay(entries);

  const totalVolume = entries.reduce((sum, e) => sum + entryVolume(e), 0);
  const totalReps = entries.reduce((sum, e) => sum + entryReps(e), 0);
  const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMin ?? 0), 0);
  const totalDistance = entries.reduce((sum, e) => sum + (e.distanceKm ?? 0), 0);

  const stats = [
    { label: "Active days", value: days.length.toString() },
    { label: "Current streak", value: `${streakDays(entries)}d` },
    { label: "Entries", value: entries.length.toString() },
    { label: "Total reps", value: totalReps.toLocaleString() },
    { label: "Volume", value: `${totalVolume.toLocaleString()} kg` },
    { label: "Active minutes", value: totalMinutes.toLocaleString() },
  ];

  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.name, (counts.get(entry.name) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = top[0]?.[1] ?? 1;

  return (
    <MobileShell>
      <div className="space-y-7 px-5 pb-6 pt-9">
        <header className="slide-up">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Overview</p>
          <h1 className="mt-1 font-serif text-[42px] leading-[0.95]">Trends</h1>
        </header>

        <div className="grid grid-cols-2 gap-2 slide-up-1">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border paper px-4 py-4">
              <p className="font-mono text-2xl leading-none">{stat.value}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {totalDistance > 0 ? (
          <p className="font-mono text-[12px] text-muted-foreground slide-up-2">
            {totalDistance.toLocaleString()} km covered so far
          </p>
        ) : null}

        <section className="space-y-3 slide-up-3">
          <h2 className="font-serif text-2xl">Most logged</h2>
          {top.length > 0 ? (
            <div className="space-y-2.5">
              {top.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span>{name}</span>
                    <span className="font-mono text-muted-foreground">{count}×</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              Log a few activities and your patterns will show up here.
            </p>
          )}
        </section>
      </div>
    </MobileShell>
  );
}
