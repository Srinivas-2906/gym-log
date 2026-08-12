const USERS_KEY = "daylog-auth-users";
const SESSION_KEY = "daylog-auth-session";

export const DEFAULT_OTP = "1234";

export interface AuthSession {
  phone: string;
}

interface StoredUser {
  pin: string;
}

function readUsers(): Record<string, StoredUser> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, StoredUser>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, StoredUser>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function formatPhoneDisplay(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return digits ? `+${digits}` : "";
}

export function hasUser(phone: string): boolean {
  const key = normalizePhone(phone);
  return key.length === 10 && Boolean(readUsers()[key]);
}

export function verifyOtp(otp: string): boolean {
  return otp.trim() === DEFAULT_OTP;
}

export function verifyPin(phone: string, pin: string): boolean {
  const user = readUsers()[normalizePhone(phone)];
  return user?.pin === pin.trim();
}

export function saveUserPin(phone: string, pin: string): void {
  const key = normalizePhone(phone);
  const users = readUsers();
  users[key] = { pin: pin.trim() };
  writeUsers(users);
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed?.phone && hasUser(parsed.phone)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setSession(phone: string): AuthSession {
  const session = { phone: normalizePhone(phone) };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function updatePin(phone: string, pin: string): void {
  saveUserPin(phone, pin);
}
