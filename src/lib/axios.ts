import axios from "axios";
import { clearAuth, getStoredToken } from "./authStorage";

// Relative base URL: in dev, Vite proxies /api to localhost:5000 (see
// vite.config.ts); in production the same path can be served by a reverse
// proxy in front of the API, so no build-time switch is needed.
export const api = axios.create({
  baseURL: "/api/v1",
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 means the token is missing, invalid, or expired (they last a day).
    // Drop the stored session and bounce to the login screen. A hard redirect
    // keeps this simple: the interceptor runs outside the Router's context.
    if (error.response?.status === 401) {
      clearAuth();

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);
