import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

/** Mirrors the backend's `authMiddleware`: no session, no access. */
export function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
