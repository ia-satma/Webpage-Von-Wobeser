import { defineConfig } from "vitest/config";
import path from "path";

// Config de tests. Entorno 'node': las unidades cubiertas (getDisplayValue,
// requireRole) son lógica pura / middleware Express, no DOM. Los .test.ts están
// excluidos de tsc (tsconfig), así que vitest es quien los ejecuta.
export default defineConfig({
  test: {
    environment: "node",
    include: [
      "client/src/**/*.test.{ts,tsx}",
      "server/**/*.test.ts",
      "shared/**/*.test.ts",
      "services/**/*.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
});
