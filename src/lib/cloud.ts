import type { ActivityPreset } from "@/lib/presets";
import type { MetricFieldDef } from "@/lib/metrics";
import type { LogEntry } from "@/lib/activities";
import { DATA_CHANGED_EVENT, userStorageKey } from "@/lib/user-scope";

export interface JournalData {
  entries: LogEntry[];
  presets: ActivityPreset[];
  customFields: MetricFieldDef[];
}

const API_TIMEOUT_MS = 12_000;

function cloudTokenKey(phone: string) {
  return `daylog-${phone}-cloud-token`;
}

export function getCloudToken(phone: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(cloudTokenKey(phone));
}

export function setCloudToken(phone: string, token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cloudTokenKey(phone), token);
}

export function clearCloudToken(phone: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(cloudTokenKey(phone));
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(path, {
      ...init,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    window.clearTimeout(id);
  }
}

export async function cloudUserExists(phone: string): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/auth/exists?phone=${encodeURIComponent(phone)}`, {
      method: "GET",
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { exists?: boolean };
    return Boolean(json.exists);
  } catch {
    return false;
  }
}

export async function cloudRegister(args: {
  phone: string;
  pin: string;
  otp: string;
}): Promise<{ token: string } | null> {
  try {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(args),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { token?: string };
    return json.token ? { token: json.token } : null;
  } catch {
    return null;
  }
}

export async function cloudLogin(args: {
  phone: string;
  pin: string;
}): Promise<{ token: string } | null> {
  try {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(args),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { token?: string };
    return json.token ? { token: json.token } : null;
  } catch {
    return null;
  }
}

function mergeByUpdatedAt(local: LogEntry[], remote: LogEntry[]): LogEntry[] {
  const map = new Map<string, LogEntry>();
  for (const e of remote) map.set(e.id, e);
  for (const e of local) {
    const existing = map.get(e.id);
    if (!existing) {
      map.set(e.id, e);
      continue;
    }
    const a = (e.updatedAt ?? e.createdAt) || "";
    const b = (existing.updatedAt ?? existing.createdAt) || "";
    if (a > b) map.set(e.id, e);
  }
  return [...map.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function mergePresets(local: ActivityPreset[], remote: ActivityPreset[]): ActivityPreset[] {
  const map = new Map<string, ActivityPreset>();
  for (const p of remote) map.set(p.id, p);
  for (const p of local) if (!map.has(p.id)) map.set(p.id, p);
  return [...map.values()];
}

function mergeCustomFields(local: MetricFieldDef[], remote: MetricFieldDef[]): MetricFieldDef[] {
  const map = new Map<string, MetricFieldDef>();
  for (const f of remote) map.set(f.key, f);
  for (const f of local) if (!map.has(f.key)) map.set(f.key, f);
  return [...map.values()];
}

export async function cloudPull(args: {
  phone: string;
  token: string;
  local: JournalData;
}): Promise<{ merged: JournalData; serverUpdatedAtMs: number } | null> {
  try {
    const res = await apiFetch("/api/data", {
      method: "GET",
      headers: { authorization: `Bearer ${args.token}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: JournalData;
      updatedAtMs?: number;
    };
    if (!json.data || typeof json.updatedAtMs !== "number") return null;
    return {
      merged: {
        entries: mergeByUpdatedAt(args.local.entries, json.data.entries ?? []),
        presets: mergePresets(args.local.presets, json.data.presets ?? []),
        customFields: mergeCustomFields(args.local.customFields, json.data.customFields ?? []),
      },
      serverUpdatedAtMs: json.updatedAtMs,
    };
  } catch {
    return null;
  }
}

export async function cloudPush(args: {
  token: string;
  data: JournalData;
  clientUpdatedAtMs: number;
}): Promise<{ updatedAtMs: number } | null> {
  try {
    const res = await apiFetch("/api/data", {
      method: "PUT",
      headers: { authorization: `Bearer ${args.token}` },
      body: JSON.stringify({
        data: args.data,
        clientUpdatedAtMs: args.clientUpdatedAtMs,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { updatedAtMs?: number };
    return typeof json.updatedAtMs === "number" ? { updatedAtMs: json.updatedAtMs } : null;
  } catch {
    return null;
  }
}

export function startCloudSync(args: {
  phone: string;
  token: string;
  getLocal: () => JournalData;
  applyLocal: (next: JournalData) => void;
  getClientUpdatedAtMs: () => number;
  setClientUpdatedAtMs: (ms: number) => void;
}) {
  let disposed = false;
  let pushing = false;
  let pending = false;
  let lastPushedAtMs = 0;

  const pushNow = async () => {
    if (disposed || pushing) {
      pending = true;
      return;
    }
    pushing = true;
    try {
      const clientUpdatedAtMs = args.getClientUpdatedAtMs();
      const res = await cloudPush({
        token: args.token,
        data: args.getLocal(),
        clientUpdatedAtMs,
      });
      if (res) {
        lastPushedAtMs = Date.now();
        args.setClientUpdatedAtMs(res.updatedAtMs);
      }
    } finally {
      pushing = false;
      if (pending) {
        pending = false;
        void pushNow();
      }
    }
  };

  const pullThenConverge = async () => {
    const pulled = await cloudPull({
      phone: args.phone,
      token: args.token,
      local: args.getLocal(),
    });
    if (disposed || !pulled) return;
    args.applyLocal(pulled.merged);
    args.setClientUpdatedAtMs(Math.max(args.getClientUpdatedAtMs(), pulled.serverUpdatedAtMs));
    void pushNow();
  };

  const onDataChanged = () => {
    if (disposed) return;
    // Debounce by time only; data changes can be frequent.
    const now = Date.now();
    if (now - lastPushedAtMs < 1200) {
      pending = true;
      return;
    }
    void pushNow();
  };

  void pullThenConverge();
  window.addEventListener(DATA_CHANGED_EVENT, onDataChanged);

  // Periodic best-effort pull to sync changes from other devices.
  const interval = window.setInterval(() => {
    if (disposed) return;
    void pullThenConverge();
  }, 30_000);

  // Also pull when a new session is opened in another tab.
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === userStorageKey("entries") ||
      event.key === userStorageKey("presets") ||
      event.key === userStorageKey("customFields")
    ) {
      void pullThenConverge();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    disposed = true;
    window.removeEventListener(DATA_CHANGED_EVENT, onDataChanged);
    window.removeEventListener("storage", onStorage);
    window.clearInterval(interval);
  };
}
