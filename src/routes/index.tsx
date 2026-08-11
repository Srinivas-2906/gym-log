import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/layout/mobile-shell";
import { DaySection } from "@/components/log/day-section";
import { LogEntryForm } from "@/components/log/log-entry-form";
import { entriesForDate, entryVolume, groupByDay, streakDays, todayKey } from "@/lib/activities";
import { useEntryActions } from "@/hooks/use-entry-actions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Daylog Workout Journal" },
      {
        name: "description",
        content:
          "Log whatever you did today — push-ups, pull-ups, cardio — and see your day at a glance.",
      },
      { property: "og:title", content: "Today — Daylog Workout Journal" },
      {
        property: "og:description",
        content:
          "Log whatever you did today — push-ups, pull-ups, cardio — and see your day at a glance.",
      },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { entries, createEntry, updateEntry, duplicateEntry, deleteEntry } = useEntryActions();
  const today = todayKey();
  const todays = entriesForDate(entries, today);
  const todayGroups = groupByDay(todays);
  const streak = streakDays(entries);

  const volume = todays.reduce((sum, e) => sum + entryVolume(e), 0);
  const minutes = todays.reduce((sum, e) => sum + (e.durationMin ?? 0), 0);

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
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1 font-serif text-[42px] leading-[0.95]">Today's log</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Write down whatever you did. Tap any entry to edit it.
          </p>
        </header>

        <div className="grid grid-cols-3 gap-2 slide-up-1">
          {[
            { label: "Entries", value: todays.length.toString() },
            { label: "Volume", value: volume > 0 ? `${volume.toLocaleString()}` : "—" },
            { label: "Streak", value: streak > 0 ? `${streak}d` : "—" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border paper px-3 py-3">
              <p className="font-mono text-xl leading-none">{stat.value}</p>
              <p className="mt-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="slide-up-2">
          <LogEntryForm date={today} onSubmit={createEntry} />
        </div>

        <div className="space-y-4 slide-up-3">
          {todayGroups.length > 0 ? (
            todayGroups.map((group) => (
              <DaySection key={group.date} group={group} {...entryHandlers} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center">
              <p className="font-serif text-xl">Nothing logged yet</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Add your first activity above — even a 10 minute walk counts.
              </p>
            </div>
          )}
          {minutes > 0 ? (
            <p className="font-mono text-[11px] text-muted-foreground">
              {minutes} active minutes today
            </p>
          ) : null}
        </div>

        <Link
          to="/history"
          className="inline-block border-b border-primary/60 font-mono text-[11px] uppercase tracking-wider text-primary slide-up-4"
        >
          See all days
        </Link>
      </div>
    </MobileShell>
  );
}
