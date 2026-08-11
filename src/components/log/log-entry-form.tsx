import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityKind, LogEntry } from "@/lib/activities";
import { KIND_LABELS, QUICK_PRESETS, todayKey } from "@/lib/activities";

interface LogEntryFormProps {
  date: string;
  entry?: LogEntry;
  submitLabel?: string;
  onSubmit: (entry: Omit<LogEntry, "id" | "createdAt">) => void;
}

const kinds: ActivityKind[] = ["strength", "cardio", "other"];

function num(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function numToString(value: number | undefined): string {
  return value != null && value > 0 ? String(value) : "";
}

function scrollFieldIntoView(element: HTMLElement) {
  window.requestAnimationFrame(() => {
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

export function LogEntryForm({
  date,
  entry,
  submitLabel = "Add to log",
  onSubmit,
}: LogEntryFormProps) {
  const isEditing = entry != null;
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(entry?.name ?? "");
  const [kind, setKind] = useState<ActivityKind>(entry?.kind ?? "strength");
  const [sets, setSets] = useState(numToString(entry?.sets));
  const [reps, setReps] = useState(numToString(entry?.reps));
  const [weight, setWeight] = useState(numToString(entry?.weight));
  const [duration, setDuration] = useState(numToString(entry?.durationMin));
  const [distance, setDistance] = useState(numToString(entry?.distanceKm));
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [day, setDay] = useState(entry?.date ?? date);

  useEffect(() => {
    if (entry) {
      setName(entry.name);
      setKind(entry.kind);
      setSets(numToString(entry.sets));
      setReps(numToString(entry.reps));
      setWeight(numToString(entry.weight));
      setDuration(numToString(entry.durationMin));
      setDistance(numToString(entry.distanceKm));
      setNotes(entry.notes ?? "");
      setDay(entry.date);
      return;
    }
    setDay(date);
  }, [date, entry]);

  const reset = () => {
    setName("");
    setKind("strength");
    setSets("");
    setReps("");
    setWeight("");
    setDuration("");
    setDistance("");
    setNotes("");
    setDay(date);
  };

  const buildPayload = (): Omit<LogEntry, "id" | "createdAt"> => ({
    date: day || todayKey(),
    name: name.trim(),
    kind,
    sets: num(sets),
    reps: num(reps),
    weight: num(weight),
    durationMin: num(duration),
    distanceKm: num(distance),
    notes: notes.trim() || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(buildPayload());
    if (!isEditing) {
      reset();
      nameRef.current?.focus();
    }
  };

  const inputClass =
    "w-full scroll-mt-24 rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary";
  const labelClass = "mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground";
  const fieldFocus = (event: React.FocusEvent<HTMLInputElement>) =>
    scrollFieldIntoView(event.currentTarget);

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border paper p-4">
      {!isEditing ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setName(preset.name);
                setKind(preset.kind);
                nameRef.current?.focus();
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
      ) : null}

      <div className="space-y-3">
        <div>
          <label className={labelClass} htmlFor="activity-name">
            What did you do?
          </label>
          <input
            ref={nameRef}
            id="activity-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={fieldFocus}
            enterKeyHint="next"
            autoComplete="off"
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
                enterKeyHint="next"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                onFocus={fieldFocus}
                placeholder="3"
                className={`${inputClass} text-center font-mono`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="reps">
                Reps
              </label>
              <input
                id="reps"
                inputMode="numeric"
                enterKeyHint="next"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                onFocus={fieldFocus}
                placeholder="12"
                className={`${inputClass} text-center font-mono`}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="weight">
                Kg
              </label>
              <input
                id="weight"
                inputMode="decimal"
                enterKeyHint="next"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onFocus={fieldFocus}
                placeholder="0"
                className={`${inputClass} text-center font-mono`}
              />
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass} htmlFor="duration">
              {kind === "strength" ? "Minutes (optional)" : "Minutes"}
            </label>
            <input
              id="duration"
              inputMode="numeric"
              enterKeyHint="next"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onFocus={fieldFocus}
              placeholder="30"
              className={`${inputClass} text-center font-mono`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="distance">
              {kind === "strength" ? "Km (optional)" : "Km"}
            </label>
            <input
              id="distance"
              inputMode="decimal"
              enterKeyHint="next"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              onFocus={fieldFocus}
              placeholder="5"
              className={`${inputClass} text-center font-mono`}
            />
          </div>
        </div>

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
              onFocus={fieldFocus}
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
              onFocus={fieldFocus}
              enterKeyHint="done"
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
          {isEditing ? <Check className="mr-1 size-4" /> : <Plus className="mr-1 size-4" />}{" "}
          {submitLabel}
        </Button>

        {!isEditing ? (
          <p className="text-center text-[12px] text-muted-foreground">
            Log as many entries as you want — same day or any past day.
          </p>
        ) : null}
      </div>
    </form>
  );
}
