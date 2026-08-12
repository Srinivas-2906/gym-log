import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { clearSession, getSession, setSession, type AuthSession } from "@/lib/auth";
import { migrateLegacyUserData, setActiveUserPhone } from "@/lib/user-scope";
import { clearCloudToken, getCloudToken, startCloudSync } from "@/lib/cloud";
import { getEntries, saveEntries } from "@/lib/activities";
import { getPresets, savePresets } from "@/lib/presets";
import { getCustomFieldDefs, saveCustomFieldDefs } from "@/lib/metrics";

interface AuthContextValue {
  session: AuthSession | null;
  ready: boolean;
  isAuthenticated: boolean;
  completeLogin: (phone: string) => AuthSession;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = getSession();
    if (current?.phone) {
      migrateLegacyUserData(current.phone);
    } else {
      setActiveUserPhone(null);
    }
    setSessionState(current);
    setReady(true);
  }, []);

  const completeLogin = useCallback((phone: string) => {
    migrateLegacyUserData(phone);
    const next = setSession(phone);
    setSessionState(next);
    return next;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!session?.phone) return;
    const token = getCloudToken(session.phone);
    if (!token) return;

    const cloudUpdatedKey = `daylog-${session.phone}-cloud-updatedAtMs`;
    const getClientUpdatedAtMs = () => {
      const raw = window.localStorage.getItem(cloudUpdatedKey);
      const n = raw ? Number(raw) : 0;
      return Number.isFinite(n) ? n : 0;
    };
    const setClientUpdatedAtMs = (ms: number) => {
      window.localStorage.setItem(cloudUpdatedKey, `${ms}`);
    };

    const stop = startCloudSync({
      phone: session.phone,
      token,
      getLocal: () => ({
        entries: getEntries(),
        presets: getPresets(),
        customFields: getCustomFieldDefs(),
      }),
      applyLocal: (next) => {
        saveEntries(next.entries);
        savePresets(next.presets);
        saveCustomFieldDefs(next.customFields);
      },
      getClientUpdatedAtMs,
      setClientUpdatedAtMs,
    });

    return () => stop();
  }, [session?.phone]);

  const logout = useCallback(() => {
    if (session?.phone) clearCloudToken(session.phone);
    clearSession();
    setActiveUserPhone(null);
    setSessionState(null);
  }, [session?.phone]);

  const value = useMemo(
    () => ({
      session,
      ready,
      isAuthenticated: session != null,
      completeLogin,
      logout,
    }),
    [session, ready, completeLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
