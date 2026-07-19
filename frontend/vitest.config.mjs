import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    pool: "threads",
    server: {
      deps: {
        inline: ["@asamuzakjp/css-color"],
      }
    }
  },
  ssr: {
    noExternal: ["@asamuzakjp/css-color"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@asamuzakjp/css-color": path.resolve(__dirname, "./tests/mocks/css-color.js"),
    },
  },
});
