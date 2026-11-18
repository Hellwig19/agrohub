import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { pwaPlugin } from "./src/pwa/vite-plugin.ts";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    react(),
    pwaPlugin(),
    command === "build" && nitro({ defaultPreset: "node-server" }),
  ],
  server: { host: "127.0.0.1", port: 5173 },
  resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom"] },
}));
