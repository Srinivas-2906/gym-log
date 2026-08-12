import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { LoginScreen } from "@/components/auth/login-screen";
import { useAuth } from "@/hooks/use-auth";
import { saveUserPin } from "@/lib/auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { ready, isAuthenticated, completeLogin } = useAuth();

  if (!ready) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Loading…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={(phone, pin) => {
          if (pin) saveUserPin(phone, pin);
          completeLogin(phone);
          void navigate({ to: "/" });
        }}
      />
    );
  }

  return children;
}
