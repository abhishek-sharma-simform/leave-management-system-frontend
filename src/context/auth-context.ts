import { createContext, use } from "react";
import type { AuthUser } from "@/types";

export type AuthContextValue = {
  user: AuthUser | null;
  isManager: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

// The context and its hook live apart from <AuthProvider> so that the
// provider's module only exports a component — otherwise Fast Refresh has to
// remount the whole tree on every edit to this file.
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = use(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }

  return context;
}
