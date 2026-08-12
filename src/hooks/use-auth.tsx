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

  const logout = useCallback(() => {
    clearSession();
    setActiveUserPhone(null);
    setSessionState(null);
  }, []);

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
