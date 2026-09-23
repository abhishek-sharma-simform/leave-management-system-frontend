import {
  CalendarDays,
  FilePlus2,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Wallet,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const EMPLOYEE_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leave-requests/apply", label: "Apply Leave", icon: FilePlus2 },
  { to: "/leave-requests/me", label: "My Requests", icon: ListChecks },
  { to: "/leave-balances", label: "Balances", icon: Wallet },
  { to: "/calendar", label: "Team Calendar", icon: CalendarDays },
];

// Only rendered for MANAGER accounts, matching the backend's role guard.
const MANAGER_LINKS = [
  { to: "/manager/requests", label: "Pending Requests", icon: Inbox },
];

export function AppLayout() {
  const { user, isManager, logout } = useAuth();
  const navigate = useNavigate();

  const links = isManager
    ? [...EMPLOYEE_LINKS, ...MANAGER_LINKS]
    : EMPLOYEE_LINKS;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            <span className="font-semibold">Leave Management</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {user?.role}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 overflow-x-auto px-4 pb-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/leave-requests/me"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
