// App layout: permanent demo banner + navy sidebar + content area.
import { Link } from "@tanstack/react-router";
import { Info, LayoutDashboard, Radar, Calculator, Droplets } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/detect", label: "New detection", icon: Radar },
  { to: "/economics", label: "Economics", icon: Calculator },
  { to: "/about", label: "About", icon: Info },
] as const;

export function DemoBanner() {
  return (
    <div role="status" className="sticky top-0 z-[1000] bg-banner px-3 py-1.5 text-center text-xs font-semibold text-banner-foreground">
      DEMO DATA — simulated scenario, not real incidents
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <DemoBanner />
      <div className="flex flex-col md:flex-row">
        <aside className="no-print bg-sidebar text-sidebar-foreground md:sticky md:top-8 md:h-[calc(100vh-2rem)] md:w-56 md:shrink-0">
          <div className="flex items-center gap-2 px-4 py-4">
            <Droplets className="h-6 w-6 text-sidebar-primary" />
            <span className="text-lg font-bold text-sidebar-accent-foreground">OilWatch AI</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent"
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>
          <p className="hidden px-4 text-xs opacity-60 md:block">Caspian Sea · Kazakhstan sector</p>
        </aside>
        <main className="min-w-0 flex-1 p-3 md:p-5">{children}</main>
      </div>
    </div>
  );
}
