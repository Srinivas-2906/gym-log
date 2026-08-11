import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityKind, LogEntry } from "@/lib/activities";
import { KIND_LABELS, QUICK_PRESETS, todayKey } from "@/lib/activities";

interface LogEntryFormProps {
  date: string;
  onSubmit: (entry: Omit<LogEntry, "id" | "createdAt">) => void;
}

const kinds: ActivityKind[] = ["strength", "cardio", "other"];

function num(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function LogEntryForm({ date, onSubmit }: LogEntryFormProps) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ActivityKind>("strength");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [day, setDay] = useState(date);

  const reset = () => {
    setName("");
    setSets("");
    setReps("");
    setWeight("");
    setDuration("");
    setDistance("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      date: day || todayKey(),
      name: trimmed,
      kind,
      sets: num(sets),
      reps: num(reps),
      weight: num(weight),
      durationMin: num(duration),
      distanceKm: num(distance),
      notes: notes.trim() || undefined,
    });
    reset();
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary";
  const labelClass = "mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border paper p-4">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => {
              setName(preset.name);
              setKind(preset.kind);
            }}
            className={[
              "rounded-full border px-3 py-1 text-[12px] transition-colors",
              name === preset.name
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
            ].join(" ")}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <label className={labelClass} htmlFor="activity-name">
            What did you do?
          </label>
          <input
            id="activity-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push-ups, Evening run, Football"
            className={inputClass}
          />
        </div>

        <div className="flex gap-1.5">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={[
                "flex-1 rounded-lg border px-3 py-2 text-[13px] transition-colors",
                kind === k
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>

        {kind === "strength" ? (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelClass} htmlFor="sets">
                Sets
              </label>
              <input
                id="sets"
                inputMode="numeric"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                placeholder="3"
                className={`${inputClass} font-mono text-center`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="reps">
                Reps
              </label>
              <input
                id="reps"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="12"
                className={`${inputClass} font-mono text-center`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="weight">
                Kg
              </label>
              <input
                id="weight"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                className={`${inputClass} font-mono text-center`}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass} htmlFor="duration">
                Minutes
              </label>
              <input
                id="duration"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                className={`${inputClass} font-mono text-center`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="distance">
                Km
              </label>
              <input
                id="distance"
                inputMode="decimal"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="5"
                className={`${inputClass} font-mono text-center`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass} htmlFor="day">
              Day
            </label>
            <input
              id="day"
              type="date"
              value={day}
              max={todayKey()}
              onChange={(e) => setDay(e.target.value)}
              className={`${inputClass} font-mono text-[13px]`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="notes">
              Note
            </label>
            <input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Felt strong"
              className={inputClass}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!name.trim()}
          className="h-12 w-full rounded-xl text-[15px] font-medium"
        >
          <Plus className="mr-1 size-4" /> Add to log
        </Button>
      </div>
    </form>
  );
}
