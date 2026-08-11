import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, LineChart, NotebookPen, User } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Today", icon: NotebookPen },
  { to: "/history", label: "Days", icon: CalendarDays },
  { to: "/stats", label: "Trends", icon: LineChart },
  { to: "/settings", label: "You", icon: User },
];

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-28">
      <main className="mx-auto max-w-md">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-md px-5 pb-7 pt-3">
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
                  className={[
                    "flex h-9 w-14 items-center justify-center rounded-full transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground group-hover:bg-secondary group-hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </span>
                <span
                  className={[
                    "text-[10px] tracking-wide transition-colors",
                    isActive ? "text-foreground font-medium" : "text-muted-foreground",
                  ].join(" ")}
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
