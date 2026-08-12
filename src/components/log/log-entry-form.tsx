import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityKind, LogEntry } from "@/lib/activities";
import {
  activeFieldsFromEntry,
  entryPayloadFromMetrics,
  KIND_LABELS,
  metricsFromEntry,
  todayKey,
} from "@/lib/activities";
import { KIND_DEFAULT_FIELDS, parseMetricValues } from "@/lib/metrics";
import { useCustomMetrics } from "@/hooks/use-custom-metrics";
import { usePresets } from "@/hooks/use-presets";
import { MetricFields } from "@/components/log/metric-fields";
import { ImageUploadField } from "@/components/log/image-upload-field";
import { PresetChips } from "@/components/log/preset-chips";
import type { EntryImageAction } from "@/lib/entry-images";

interface LogEntryFormProps {
  date: string;
  entry?: LogEntry;
  submitLabel?: string;
  showPresets?: boolean;
  onSubmit: (entry: Omit<LogEntry, "id" | "createdAt">, image?: EntryImageAction) => void;
}

const kinds: ActivityKind[] = ["strength", "cardio", "other"];

function metricsToStrings(metrics: Record<string, number | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(metrics)) {
    if (value != null && value > 0) out[key] = String(value);
  }
  return out;
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
  showPresets = true,
  onSubmit,
}: LogEntryFormProps) {
  const isEditing = entry != null;
  const nameRef = useRef<HTMLInputElement>(null);
  const { presets, replacePresets } = usePresets();
  const { addCustomField } = useCustomMetrics();

  const [name, setName] = useState(entry?.name ?? "");
  const [kind, setKind] = useState<ActivityKind>(entry?.kind ?? "strength");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [day, setDay] = useState(entry?.date ?? date);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [activeFields, setActiveFields] = useState<string[]>(
    entry ? activeFieldsFromEntry(entry) : KIND_DEFAULT_FIELDS.strength,
  );
  const [metricValues, setMetricValues] = useState<Record<string, string>>(
    entry ? metricsToStrings(metricsFromEntry(entry)) : {},
  );
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageTouched, setImageTouched] = useState(false);

  useEffect(() => {
    if (!entry) {
      setDay(date);
      return;
    }
    setName(entry.name);
    setKind(entry.kind);
    setNotes(entry.notes ?? "");
    setDay(entry.date);
    setActiveFields(activeFieldsFromEntry(entry));
    setMetricValues(metricsToStrings(metricsFromEntry(entry)));
    const match = presets.find((p) => p.name.toLowerCase() === entry.name.toLowerCase());
    setSelectedPresetId(match?.id ?? null);
    setImageBlob(null);
    setImageTouched(false);
  }, [date, entry, presets]);

  const reset = () => {
    setName("");
    setKind("strength");
    setNotes("");
    setDay(date);
    setSelectedPresetId(null);
    setActiveFields(KIND_DEFAULT_FIELDS.strength);
    setMetricValues({});
    setImageBlob(null);
    setImageTouched(false);
  };

  const handlePresetSelect = (preset: (typeof presets)[number]) => {
    setSelectedPresetId(preset.id);
    setName(preset.name);
    setKind(preset.kind);
    setActiveFields(preset.fields);
    nameRef.current?.focus();
  };

  const handleKindChange = (nextKind: ActivityKind) => {
    setKind(nextKind);
    setSelectedPresetId(null);
    setActiveFields(KIND_DEFAULT_FIELDS[nextKind]);
  };

  const handleMetricChange = (key: string, value: string) => {
    setMetricValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddField = (label: string) => {
    const def = addCustomField(label);
    setActiveFields((prev) => (prev.includes(def.key) ? prev : [...prev, def.key]));
    return def.key;
  };

  const buildPayload = (): Omit<LogEntry, "id" | "createdAt"> =>
    entryPayloadFromMetrics({
      date: day || todayKey(),
      name: name.trim(),
      kind,
      notes: notes.trim() || undefined,
      metrics: parseMetricValues(metricValues),
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const imageAction = isEditing ? (imageTouched ? imageBlob : undefined) : imageBlob;
    onSubmit(buildPayload(), imageAction ?? undefined);
    if (!isEditing) {
      reset();
      nameRef.current?.focus();
    }
  };

  const inputClass =
    "w-full scroll-mt-24 rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary";
  const labelClass = "mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground";
  const fieldFocus = (element: HTMLElement) => scrollFieldIntoView(element);

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border paper p-4">
      {showPresets && !isEditing ? (
        <div className="mb-3">
          <PresetChips
            presets={presets}
            selectedId={selectedPresetId}
            onSelect={handlePresetSelect}
            onSave={replacePresets}
          />
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
            onChange={(e) => {
              setName(e.target.value);
              setSelectedPresetId(null);
            }}
            onFocus={(e) => fieldFocus(e.currentTarget)}
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
              onClick={() => handleKindChange(k)}
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

        <MetricFields
          fields={activeFields}
          values={metricValues}
          onChange={handleMetricChange}
          onAddField={handleAddField}
          onFocus={fieldFocus}
        />

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
              onFocus={(e) => fieldFocus(e.currentTarget)}
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
              onFocus={(e) => fieldFocus(e.currentTarget)}
              enterKeyHint="done"
              placeholder="Felt strong"
              className={inputClass}
            />
          </div>
        </div>

        <ImageUploadField
          entryId={entry?.id}
          value={imageBlob}
          touched={imageTouched}
          onChange={(blob, touched) => {
            setImageBlob(blob);
            setImageTouched(touched);
          }}
        />

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
            Suggestions adapt fields — Walk shows min, cal, steps. Add your own metrics anytime.
          </p>
        ) : null}
      </div>
    </form>
  );
}
