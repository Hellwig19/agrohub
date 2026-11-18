import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";

export function pwaPlugin(): Plugin {
  return {
    name: "agrohub-pwa",
    apply: "build",
    applyToEnvironment: (environment) => environment.name === "client",
    generateBundle(_options, bundle) {
      const worker = readFileSync(new URL("./service-worker.js", import.meta.url), "utf8");
      const version = createHash("sha256")
        .update(worker)
        .update(JSON.stringify(Object.keys(bundle).sort()))
        .update(readFileSync(new URL("../../public/offline.html", import.meta.url)))
        .update(readFileSync(new URL("../../public/manifest.webmanifest", import.meta.url)))
        .update(readFileSync(new URL("../../public/icons/icon-192.png", import.meta.url)))
        .update(readFileSync(new URL("../../public/icons/icon-512.png", import.meta.url)))
        .update(readFileSync(new URL("../../public/icons/icon-maskable-512.png", import.meta.url)))
        .update(readFileSync(new URL("../../public/icons/apple-touch-icon.png", import.meta.url)))
        .digest("hex")
        .slice(0, 16);
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: worker.replaceAll("__BUILD_VERSION__", version),
      });
    },
  };
}
