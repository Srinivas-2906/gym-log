import type { ActivityKind } from "@/lib/activities";
import { KIND_DEFAULT_FIELDS } from "@/lib/metrics";
import { readUserItem, writeUserItem } from "@/lib/user-scope";

export interface ActivityPreset {
  id: string;
  name: string;
  kind: ActivityKind;
  fields: string[];
}

export const DEFAULT_PRESETS: ActivityPreset[] = [
  { id: "push-ups", name: "Push-ups", kind: "strength", fields: ["sets", "reps"] },
  { id: "pull-ups", name: "Pull-ups", kind: "strength", fields: ["sets", "reps"] },
  { id: "squats", name: "Squats", kind: "strength", fields: ["sets", "reps", "weight"] },
  { id: "bench-press", name: "Bench Press", kind: "strength", fields: ["sets", "reps", "weight"] },
  { id: "deadlift", name: "Deadlift", kind: "strength", fields: ["sets", "reps", "weight"] },
  { id: "plank", name: "Plank", kind: "other", fields: ["durationMin"] },
  {
    id: "running",
    name: "Running",
    kind: "cardio",
    fields: ["durationMin", "distanceKm", "calories"],
  },
  {
    id: "cycling",
    name: "Cycling",
    kind: "cardio",
    fields: ["durationMin", "distanceKm", "calories"],
  },
  {
    id: "walk",
    name: "Walk",
    kind: "cardio",
    fields: ["durationMin", "distanceKm", "calories", "steps"],
  },
  {
    id: "swimming",
    name: "Swimming",
    kind: "cardio",
    fields: ["durationMin", "distanceKm", "calories"],
  },
  { id: "yoga", name: "Yoga", kind: "other", fields: ["durationMin"] },
  { id: "stretching", name: "Stretching", kind: "other", fields: ["durationMin"] },
];

function generatePresetId(name: string): string {
  return `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getPresets(): ActivityPreset[] {
  if (typeof window === "undefined") return DEFAULT_PRESETS;
  const raw = readUserItem("presets");
  if (!raw) {
    savePresets(DEFAULT_PRESETS);
    return DEFAULT_PRESETS;
  }
  try {
    const parsed = JSON.parse(raw) as ActivityPreset[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRESETS;
  } catch {
    return DEFAULT_PRESETS;
  }
}

export function savePresets(presets: ActivityPreset[]): void {
  if (typeof window === "undefined") return;
  writeUserItem("presets", JSON.stringify(presets));
}

export function addPreset(input: {
  name: string;
  kind: ActivityKind;
  fields: string[];
}): ActivityPreset {
  const preset: ActivityPreset = {
    id: generatePresetId(input.name),
    name: input.name.trim(),
    kind: input.kind,
    fields: input.fields.length > 0 ? input.fields : KIND_DEFAULT_FIELDS[input.kind],
  };
  savePresets([...getPresets(), preset]);
  return preset;
}

export function removePreset(id: string): void {
  savePresets(getPresets().filter((p) => p.id !== id));
}

export function resetPresetsToDefault(): void {
  savePresets(DEFAULT_PRESETS);
}
