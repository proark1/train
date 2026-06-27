import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Phase 0 look-dev app. See PLAN.md §19.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
});
