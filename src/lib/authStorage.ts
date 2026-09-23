import type { AuthUser } from "@/types";

// The token and user live in cookies (rather than localStorage) so a refresh
// keeps you signed in. They are read from here by both AuthContext (for React
// state) and the Axios request interceptor (which runs outside React and
// cannot use the context).
//
// These are plain, JS-readable cookies, not httpOnly ones: a browser cookie
// can only be marked httpOnly by the server that sets it via a `Set-Cookie`
// response header, which this API doesn't do (it returns the token in the
// JSON login response body instead). So this offers no extra protection
// against XSS over localStorage — it's a storage-location change, not a
// security upgrade. A real XSS-hardened setup would need the backend to set
// an httpOnly cookie on login and the frontend to stop handling the token
// itself.
const TOKEN_KEY = "lms.token";
const USER_KEY = "lms.user";

// Matches the backend's token lifetime (see the 401 handling in axios.ts) so
// the cookie never outlives a token that's already invalid.
const MAX_AGE_SECONDS = 60 * 60 * 24;

function getCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  if (!match) return null;

  return decodeURIComponent(match.slice(name.length + 1));
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function getStoredToken(): string | null {
  return getCookie(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = getCookie(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    // A corrupted entry should log the user out rather than crash the app.
    return null;
  }
}

export function storeAuth(token: string, user: AuthUser) {
  setCookie(TOKEN_KEY, token);
  setCookie(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  deleteCookie(TOKEN_KEY);
  deleteCookie(USER_KEY);
}
