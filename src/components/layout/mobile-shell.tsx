import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, LineChart, NotebookPen, User } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { useKeyboardInset } from "@/hooks/use-keyboard-inset";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Today", icon: NotebookPen },
  { to: "/history", label: "Days", icon: CalendarDays },
  { to: "/stats", label: "Trends", icon: LineChart },
  { to: "/settings", label: "You", icon: User },
];

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const keyboardInset = useKeyboardInset();

  const navStyle: CSSProperties = {
    bottom: keyboardInset,
  };

  return (
    <div className="app-scroll h-[100dvh] bg-background pb-[calc(5.75rem+env(safe-area-inset-bottom))] font-sans text-foreground antialiased">
      <main className="mx-auto max-w-md scroll-pb-6">{children}</main>

      <nav
        style={navStyle}
        className={cn(
          "fixed inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md",
          "px-5 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))]",
          "transition-[bottom] duration-200 ease-out will-change-[bottom]",
        )}
      >
        <div className="mx-auto flex max-w-md items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group flex flex-1 flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "flex h-9 w-14 items-center justify-center rounded-full transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground group-hover:bg-secondary group-hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </span>
                <span
                  className={cn(
                    "text-[10px] tracking-wide transition-colors",
                    isActive ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
