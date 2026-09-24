import axios from "axios";
import { clearAuth, getStoredToken } from "./authStorage";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
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
