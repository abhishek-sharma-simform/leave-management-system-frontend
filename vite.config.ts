import path from "node:path";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const apiBaseUrl = env.VITE_API_BASE_URL;

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      // Proxying /api to the backend (VITE_API_BASE_URL, see .env) keeps
      // every request same-origin, so the app works unchanged whether it is
      // served by Vite or by a reverse proxy in front of the API.
      proxy: apiBaseUrl
        ? {
            "/api": {
              target: new URL(apiBaseUrl).origin,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  };
});
