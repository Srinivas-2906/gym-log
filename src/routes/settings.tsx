import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import athleteImg from "@/assets/athlete.jpg";
import { saveEntries, useEntries } from "@/lib/activities";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "You — Daylog Workout Journal" },
      { name: "description", content: "Manage your journal data and see what's coming next." },
      { property: "og:title", content: "You — Daylog Workout Journal" },
      {
        property: "og:description",
        content: "Manage your journal data and see what's coming next.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { entries, refresh } = useEntries();

  const handleClearData = () => {
    if (confirm("Delete every logged activity? This cannot be undone.")) {
      saveEntries([]);
      refresh();
      toast.success("Journal cleared.");
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daylog-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MobileShell>
      <div className="space-y-7 px-5 pb-6 pt-9">
        <header className="slide-up">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Account</p>
          <h1 className="mt-1 font-serif text-[42px] leading-[0.95]">You</h1>
        </header>

        <div className="flex items-center gap-4 slide-up-1">
          <div className="size-16 shrink-0 overflow-hidden rounded-full border border-border">
            <img
              src={athleteImg}
              alt="Your profile"
              width={64}
              height={64}
              className="size-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif text-2xl leading-none">Athlete</h2>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {entries.length} activities logged
            </p>
          </div>
        </div>

        <section className="space-y-2 slide-up-2">
          <h3 className="font-serif text-2xl">Data</h3>
          <Button
            onClick={handleExport}
            variant="outline"
            className="h-12 w-full justify-start rounded-xl text-[14px]"
          >
            Export journal as JSON
          </Button>
          <Button
            onClick={handleClearData}
            variant="outline"
            className="h-12 w-full justify-start rounded-xl border-destructive/40 text-[14px] text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Clear all logged activities
          </Button>
        </section>

        <section className="rounded-2xl border border-border paper p-5 slide-up-3">
          <h3 className="font-serif text-2xl">Coming next</h3>
          <ul className="mt-2 space-y-1 text-[14px] text-muted-foreground">
            <li>Diet & meal logging</li>
            <li>Smart watch sync</li>
            <li>Suggested activities based on your history</li>
            <li>Cloud sync across devices</li>
          </ul>
        </section>
      </div>
    </MobileShell>
  );
}
