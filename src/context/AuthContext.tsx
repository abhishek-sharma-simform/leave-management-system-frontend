import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "@/api/auth";
import { AuthContext } from "@/context/auth-context";
import type { AuthContextValue } from "@/context/auth-context";
import { clearAuth, getStoredUser, storeAuth } from "@/lib/authStorage";
import type { AuthUser } from "@/types";

export function AuthProvider({ children }: { children: ReactNode }) {
  // Seeded from the auth cookie so a page refresh does not sign the user out.
  // The token itself is not kept in state — only the Axios interceptor reads
  // it, and it reads it straight from storage.
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedIn } = await authApi.login(email, password);

    storeAuth(token, loggedIn);
    setUser(loggedIn);

    return loggedIn;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isManager: user?.role === "MANAGER", login, logout }),
    [user, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
