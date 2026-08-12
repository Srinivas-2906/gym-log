const LEGACY_KEYS = {
  entries: "daylog-entries",
  presets: "daylog-presets",
  customFields: "daylog-custom-fields",
} as const;

const LEGACY_MIGRATED_KEY = "daylog-legacy-migrated";

let activeUserPhone: string | null = null;

export const USER_CHANGED_EVENT = "daylog-user-changed";

export function setActiveUserPhone(phone: string | null): void {
  activeUserPhone = phone;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(USER_CHANGED_EVENT, { detail: { phone } }));
  }
}

export function getActiveUserPhone(): string | null {
  return activeUserPhone;
}

export function userStorageKey(suffix: keyof typeof LEGACY_KEYS | string): string {
  if (!activeUserPhone) return `daylog-guest-${suffix}`;
  return `daylog-${activeUserPhone}-${suffix}`;
}

export function readUserItem(suffix: keyof typeof LEGACY_KEYS): string | null {
  if (typeof window === "undefined" || !activeUserPhone) return null;
  return window.localStorage.getItem(userStorageKey(suffix));
}

export function writeUserItem(suffix: keyof typeof LEGACY_KEYS, value: string): void {
  if (typeof window === "undefined" || !activeUserPhone) return;
  window.localStorage.setItem(userStorageKey(suffix), value);
}

export function migrateLegacyUserData(phone: string): void {
  if (typeof window === "undefined") return;

  setActiveUserPhone(phone);

  if (window.localStorage.getItem(LEGACY_MIGRATED_KEY)) return;

  let migrated = false;
  for (const suffix of Object.keys(LEGACY_KEYS) as (keyof typeof LEGACY_KEYS)[]) {
    const legacy = window.localStorage.getItem(LEGACY_KEYS[suffix]);
    const userKey = userStorageKey(suffix);
    if (legacy && !window.localStorage.getItem(userKey)) {
      window.localStorage.setItem(userKey, legacy);
      migrated = true;
    }
  }

  if (migrated) {
    window.localStorage.setItem(LEGACY_MIGRATED_KEY, phone);
    for (const suffix of Object.keys(LEGACY_KEYS) as (keyof typeof LEGACY_KEYS)[]) {
      window.localStorage.removeItem(LEGACY_KEYS[suffix]);
    }
  }
}

export function imageStorageKey(entryId: string): string {
  const phone = activeUserPhone ?? "guest";
  return `${phone}:${entryId}`;
}
