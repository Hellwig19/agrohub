import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const origin = "https://agrohub.example";
function workerHarness() {
  const handlers = new Map<string, (event: Record<string, unknown>) => void>();
  const stores = new Map<string, Map<string, Response>>();
  let skipped = 0;
  let claimed = 0;
  let online = true;
  const source = readFileSync(
    new URL("../src/pwa/service-worker.js", import.meta.url),
    "utf8",
  ).replaceAll("__BUILD_VERSION__", "test");
  vm.runInNewContext(source, {
    URL,
    Response,
    self: {
      location: { origin },
      addEventListener: (name: string, fn: (event: Record<string, unknown>) => void) =>
        handlers.set(name, fn),
      clients: {
        claim: async () => {
          claimed++;
        },
      },
      skipWaiting: async () => {
        skipped++;
      },
    },
    caches: {
      keys: async () => [...stores.keys()],
      delete: async (key: string) => stores.delete(key),
      open: async (key: string) => {
        if (!stores.has(key)) stores.set(key, new Map());
        const store = stores.get(key)!;
        return {
          addAll: async (urls: string[]) => {
            urls.forEach((url) =>
              store.set(
                url,
                new Response(url === "/offline.html" ? "offline-page" : "public-asset"),
              ),
            );
          },
          match: async (url: string) => store.get(url)?.clone(),
        };
      },
    },
    fetch: async () => {
      if (!online) throw new TypeError("offline");
      return new Response("private-network-response");
    },
  });
  async function lifecycle(name: string) {
    let pending: Promise<unknown> = Promise.resolve();
    handlers.get(name)!({
      waitUntil: (promise: Promise<unknown>) => {
        pending = promise;
      },
    });
    await pending;
  }
  function request(
    path: string,
    options: { method?: string; mode?: string; headers?: Headers } = {},
  ) {
    let response: Promise<Response> | undefined;
    handlers.get("fetch")!({
      request: {
        method: options.method ?? "GET",
        url: new URL(path, origin).href,
        mode: options.mode ?? "navigate",
        headers: options.headers ?? new Headers(),
      },
      respondWith: (promise: Promise<Response>) => {
        response = promise;
      },
    });
    return response;
  }
  return {
    stores,
    handlers,
    lifecycle,
    request,
    offline: () => {
      online = false;
    },
    skipped: () => skipped,
    claimed: () => claimed,
  };
}

test("manifest and platform icons have valid install metadata and declared dimensions", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
  );
  assert.equal(manifest.id, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some((icon: { purpose: string }) => icon.purpose === "maskable"));
  for (const icon of [
    ...manifest.icons,
    { src: "/icons/apple-touch-icon.png", sizes: "180x180" },
  ]) {
    const png = readFileSync(new URL(`../public${icon.src}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});

test("service worker serves the offline page without persisting authenticated navigation", async () => {
  const worker = workerHarness();
  await worker.lifecycle("install");
  assert.equal(await (await worker.request("/talhoes"))!.text(), "private-network-response");
  const stored = [...worker.stores.values()][0]!;
  assert.equal(stored.has("/talhoes"), false);
  worker.offline();
  assert.equal(await (await worker.request("/talhoes"))!.text(), "offline-page");
  assert.equal(
    await (await worker.request("/icons/icon-192.png", { mode: "no-cors" }))!.text(),
    "public-asset",
  );
});

test("service worker leaves APIs, credentials, external resources and mutations alone", async () => {
  const worker = workerHarness();
  await worker.lifecycle("install");
  for (const path of [
    "/api/public/telemetria",
    "/_server/functions/id",
    "https://project.supabase.co/rest/v1/profiles",
    "https://tiles.example/tile.png",
  ]) {
    assert.equal(worker.request(path), undefined);
  }
  assert.equal(worker.request("/talhoes", { method: "POST" }), undefined);
  assert.equal(
    worker.request("/talhoes", { headers: new Headers({ authorization: "Bearer secret" }) }),
    undefined,
  );
});

test("updates wait for user consent and only clean this app's old caches", async () => {
  const worker = workerHarness();
  worker.stores.set("agrohub-pwa-old", new Map());
  worker.stores.set("another-app", new Map());
  await worker.lifecycle("install");
  assert.equal(worker.skipped(), 0);
  await worker.lifecycle("activate");
  assert.equal(worker.stores.has("agrohub-pwa-old"), false);
  assert.equal(worker.stores.has("another-app"), true);
  assert.equal(worker.claimed(), 1);
  worker.handlers.get("message")!({ data: { type: "SKIP_WAITING" } });
  assert.equal(worker.skipped(), 1);
});
