import { useCallback, useEffect, useState } from "react";

export type ActivityKind = "strength" | "cardio" | "other";

export interface LogEntry {
  id: string;
  /** Local calendar day, YYYY-MM-DD */
  date: string;
  name: string;
  kind: ActivityKind;
  sets?: number | undefined;
  reps?: number | undefined;
  weight?: number | undefined;
  durationMin?: number | undefined;
  distanceKm?: number | undefined;
  notes?: string | undefined;
  createdAt: string;
}

export interface QuickPreset {
  name: string;
  kind: ActivityKind;
}

export const QUICK_PRESETS: QuickPreset[] = [
  { name: "Push-ups", kind: "strength" },
  { name: "Pull-ups", kind: "strength" },
  { name: "Squats", kind: "strength" },
  { name: "Bench Press", kind: "strength" },
  { name: "Deadlift", kind: "strength" },
  { name: "Plank", kind: "other" },
  { name: "Running", kind: "cardio" },
  { name: "Cycling", kind: "cardio" },
  { name: "Walk", kind: "cardio" },
  { name: "Swimming", kind: "cardio" },
  { name: "Yoga", kind: "other" },
  { name: "Stretching", kind: "other" },
];

export const KIND_LABELS: Record<ActivityKind, string> = {
  strength: "Strength",
  cardio: "Cardio",
  other: "Other",
};

const STORAGE_KEY = "daylog-entries";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function todayKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function getEntries(): LogEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: LogEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addEntry(input: Omit<LogEntry, "id" | "createdAt">): LogEntry {
  const entry: LogEntry = { ...input, id: generateId(), createdAt: new Date().toISOString() };
  saveEntries([entry, ...getEntries()]);
  return entry;
}

export function deleteEntry(id: string): void {
  saveEntries(getEntries().filter((e) => e.id !== id));
}

export function updateEntry(
  id: string,
  input: Omit<LogEntry, "id" | "createdAt">,
): LogEntry | undefined {
  const entries = getEntries();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return undefined;

  const updated: LogEntry = { ...entries[index], ...input };
  entries[index] = updated;
  saveEntries(entries);
  return updated;
}

export function duplicateEntry(id: string): LogEntry | undefined {
  const source = getEntries().find((entry) => entry.id === id);
  if (!source) return undefined;

  return addEntry({
    date: source.date,
    name: source.name,
    kind: source.kind,
    sets: source.sets,
    reps: source.reps,
    weight: source.weight,
    durationMin: source.durationMin,
    distanceKm: source.distanceKm,
    notes: source.notes,
  });
}

export function entriesForDate(entries: LogEntry[], date: string): LogEntry[] {
  return entries.filter((e) => e.date === date);
}

export interface DayGroup {
  date: string;
  entries: LogEntry[];
}

export function groupByDay(entries: LogEntry[]): DayGroup[] {
  const map = new Map<string, LogEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.date) ?? [];
    list.push(entry);
    map.set(entry.date, list);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, list]) => ({
      date,
      entries: list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    }));
}

export function entryVolume(entry: LogEntry): number {
  if (entry.kind !== "strength") return 0;
  const sets = entry.sets ?? 0;
  const reps = entry.reps ?? 0;
  const weight = entry.weight ?? 0;
  return sets * reps * weight;
}

export function entryReps(entry: LogEntry): number {
  return (entry.sets ?? 0) * (entry.reps ?? 0);
}

export function summarizeEntry(entry: LogEntry): string {
  const parts: string[] = [];
  if (entry.sets && entry.reps) parts.push(`${entry.sets} × ${entry.reps}`);
  else if (entry.reps) parts.push(`${entry.reps} reps`);
  if (entry.weight) parts.push(`${entry.weight} kg`);
  if (entry.durationMin) parts.push(`${entry.durationMin} min`);
  if (entry.distanceKm) parts.push(`${entry.distanceKm} km`);
  return parts.join(" · ");
}

export function formatDayLabel(dateKey: string): string {
  const today = todayKey();
  if (dateKey === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === todayKey(yesterday)) return "Yesterday";
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function streakDays(entries: LogEntry[]): number {
  const days = new Set(entries.map((e) => e.date));
  let streak = 0;
  const cursor = new Date();
  // A streak may start today or yesterday.
  if (!days.has(todayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(todayKey(cursor))) return 0;
  }
  while (days.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function useEntries() {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    setEntries(getEntries());

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setEntries(getEntries());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const refresh = useCallback(() => setEntries(getEntries()), []);

  const create = useCallback((input: Omit<LogEntry, "id" | "createdAt">) => {
    const entry = addEntry(input);
    setEntries(getEntries());
    return entry;
  }, []);

  const update = useCallback((id: string, input: Omit<LogEntry, "id" | "createdAt">) => {
    const entry = updateEntry(id, input);
    setEntries(getEntries());
    return entry;
  }, []);

  const duplicate = useCallback((id: string) => {
    const entry = duplicateEntry(id);
    setEntries(getEntries());
    return entry;
  }, []);

  const remove = useCallback((id: string) => {
    deleteEntry(id);
    setEntries(getEntries());
  }, []);

  return { entries, refresh, create, update, duplicate, remove };
}
