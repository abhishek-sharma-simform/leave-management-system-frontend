import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

/** Mirrors the backend's `requireRole("MANAGER")` on the /manager routes. */
export function ManagerRoute() {
  const { isManager } = useAuth();

  if (!isManager) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
