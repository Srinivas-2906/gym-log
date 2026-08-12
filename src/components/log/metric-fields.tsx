import { Plus } from "lucide-react";
import { useState } from "react";

import { getMetricDef, type MetricFieldDef } from "@/lib/metrics";

interface MetricFieldsProps {
  fields: string[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onAddField: (label: string) => string | null;
  onFocus?: (element: HTMLElement) => void;
}

export function MetricFields({ fields, values, onChange, onAddField, onFocus }: MetricFieldsProps) {
  const [addingField, setAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  const inputClass =
    "w-full scroll-mt-24 rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary text-center font-mono";
  const labelClass = "mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground";

  const submitField = () => {
    const trimmed = newFieldLabel.trim();
    if (!trimmed) return;
    const key = onAddField(trimmed);
    if (key) {
      setNewFieldLabel("");
      setAddingField(false);
    }
  };

  const renderField = (def: MetricFieldDef) => (
    <div key={def.key}>
      <label className={labelClass} htmlFor={`metric-${def.key}`}>
        {def.label}
      </label>
      <input
        id={`metric-${def.key}`}
        inputMode={def.inputMode === "decimal" ? "decimal" : "numeric"}
        enterKeyHint="next"
        value={values[def.key] ?? ""}
        onChange={(e) => onChange(def.key, e.target.value)}
        onFocus={(e) => onFocus?.(e.currentTarget)}
        placeholder={def.placeholder}
        className={inputClass}
      />
    </div>
  );

  const cols = fields.length <= 2 ? fields.length || 1 : fields.length === 3 ? 3 : 2;

  return (
    <div className="space-y-2">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(cols, 4)}, minmax(0, 1fr))` }}
      >
        {fields.map((key) => renderField(getMetricDef(key)))}
      </div>

      {addingField ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitField();
              }
              if (e.key === "Escape") {
                setAddingField(false);
                setNewFieldLabel("");
              }
            }}
            placeholder="e.g. Cal, Weight, RPE"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-base outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={submitField}
            className="rounded-lg border border-primary px-3 text-[12px] text-primary"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingField(true)}
          className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-primary"
        >
          <Plus className="size-3.5" /> Add metric
        </button>
      )}
    </div>
  );
}
