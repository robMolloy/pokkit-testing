/// <reference types="vite/client" />
/// <reference types="vitest" />

import type { ConfigEnv } from "vite";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default (p: { mode: ConfigEnv }) => {
  const env = loadEnv(p.mode.command, process.cwd(), "");

  return defineConfig({
    base: env.VITE_APP_BASE_URL,
    test: {
      globals: true,
      environment: "node",
    },
  });
};
