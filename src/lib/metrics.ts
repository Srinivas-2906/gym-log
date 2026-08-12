export type BuiltinMetricKey =
  "sets" | "reps" | "weight" | "durationMin" | "distanceKm" | "calories" | "steps";

export interface MetricFieldDef {
  key: string;
  label: string;
  placeholder: string;
  inputMode: "numeric" | "decimal" | "text";
  builtin: boolean;
}

export const BUILTIN_METRICS: Record<BuiltinMetricKey, MetricFieldDef> = {
  sets: { key: "sets", label: "Sets", placeholder: "3", inputMode: "numeric", builtin: true },
  reps: { key: "reps", label: "Reps", placeholder: "12", inputMode: "numeric", builtin: true },
  weight: { key: "weight", label: "Kg", placeholder: "0", inputMode: "decimal", builtin: true },
  durationMin: {
    key: "durationMin",
    label: "Min",
    placeholder: "30",
    inputMode: "numeric",
    builtin: true,
  },
  distanceKm: {
    key: "distanceKm",
    label: "Km",
    placeholder: "5",
    inputMode: "decimal",
    builtin: true,
  },
  calories: {
    key: "calories",
    label: "Cal",
    placeholder: "200",
    inputMode: "numeric",
    builtin: true,
  },
  steps: { key: "steps", label: "Steps", placeholder: "8000", inputMode: "numeric", builtin: true },
};

export const KIND_DEFAULT_FIELDS: Record<"strength" | "cardio" | "other", string[]> = {
  strength: ["sets", "reps", "weight"],
  cardio: ["durationMin", "distanceKm", "calories", "steps"],
  other: ["durationMin"],
};

import { readUserItem, writeUserItem } from "@/lib/user-scope";

export function slugifyFieldKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
}

export function getCustomFieldDefs(): MetricFieldDef[] {
  if (typeof window === "undefined") return [];
  const raw = readUserItem("customFields");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as MetricFieldDef[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomFieldDefs(defs: MetricFieldDef[]): void {
  if (typeof window === "undefined") return;
  writeUserItem("customFields", JSON.stringify(defs));
}

export function registerCustomField(label: string): MetricFieldDef {
  const trimmed = label.trim();
  const key = slugifyFieldKey(trimmed) || `field_${Date.now()}`;
  const existing = getCustomFieldDefs();
  const found = existing.find((f) => f.key === key);
  if (found) return found;

  const def: MetricFieldDef = {
    key,
    label: trimmed,
    placeholder: "0",
    inputMode: "decimal",
    builtin: false,
  };
  saveCustomFieldDefs([...existing, def]);
  return def;
}

export function getMetricDef(key: string): MetricFieldDef {
  const builtin = BUILTIN_METRICS[key as BuiltinMetricKey];
  if (builtin) return builtin;
  const custom = getCustomFieldDefs().find((f) => f.key === key);
  return (
    custom ?? {
      key,
      label: key,
      placeholder: "0",
      inputMode: "decimal",
      builtin: false,
    }
  );
}

export function parseMetricValues(
  values: Record<string, string>,
): Record<string, number | undefined> {
  const out: Record<string, number | undefined> = {};
  for (const [key, raw] of Object.entries(values)) {
    if (raw.trim() === "") {
      out[key] = undefined;
      continue;
    }
    const n = Number(raw);
    out[key] = Number.isFinite(n) && n > 0 ? n : undefined;
  }
  return out;
}

export function resolveFieldDefs(keys: string[]): MetricFieldDef[] {
  return keys.map(getMetricDef);
}
