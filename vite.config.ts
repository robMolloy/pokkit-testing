import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import type { ConfigEnv } from "vite";
import react from "@vitejs/plugin-react";
import Pages from "vite-plugin-pages";

export default (p: { mode: ConfigEnv }) => {
  const env = loadEnv(p.mode.command, process.cwd(), "");

  return defineConfig({
    base: env.VITE_APP_BASE_URL,
    plugins: [
      react(),
      tailwindcss(),
      Pages({
        dirs: "src/pages",
        extensions: ["page.tsx", "tsx"],
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  });
};
