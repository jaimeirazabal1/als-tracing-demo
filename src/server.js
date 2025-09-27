import http from "node:http";
import { AsyncLocalStorage } from "node:async_hooks";
import { performance } from "node:perf_hooks";
import { randomUUID } from "node:crypto";

const als = new AsyncLocalStorage();

// Helper: log con el cid actual
function log(...args) {
  const store = als.getStore();
  const tag = store?.cid ? `[${store.cid}]` : "[no-cid]";
  console.log(tag, ...args);
}

// Wrapper de fetch que inyecta x-corr-id y mide duración
async function fetchWithCtx(url, options = {}) {
  const store = als.getStore() || {};
  const headers = new Headers(options.headers || {});
  if (store.cid) headers.set("x-corr-id", store.cid);

  const t0 = performance.now();
  const res = await fetch(url, { ...options, headers });
  const t = (performance.now() - t0).toFixed(1);
  log("fetch", url, res.status, `${t}ms`);
  return res;
}

// Crea/propaga contexto por petición
function withRequestContext(req, res, handler) {
  const incomingCid = req.headers["x-corr-id"];
  const cid = incomingCid || randomUUID();
  const ctx = { cid, t0: performance.now() };

  // Expone el cid al cliente (útil en troubleshooting)
  res.setHeader("x-corr-id", cid);

  // Ejecuta el handler “dentro” del contexto ALS
  als.run(ctx, handler);
}

const server = http.createServer((req, res) => {
  withRequestContext(req, res, async () => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    log(req.method, url.pathname);

    // Endpoint “downstream” simulado (actúa como servicio externo)
    if (url.pathname === "/downstream") {
      // Simula trabajo asincrónico
      await new Promise((r) => setTimeout(r, Math.random() * 200 + 50));
      const gotCid = req.headers["x-corr-id"] || "none";
      log("downstream recibió x-corr-id =", gotCid);
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true, gotCid }));
      return;
    }

    // Endpoint principal que hace 2 llamadas paralelas al downstream
    if (url.pathname === "/api/work") {
      // Demuestra que ALS se mantiene en timers
      setTimeout(() => log("callback de timer ve el contexto"), 10);

      const [a, b] = await Promise.all([
        fetchWithCtx("http://localhost:3001/downstream").then((r) => r.json()),
        (async () => {
          await new Promise((r) => setTimeout(r, 30));
          return fetchWithCtx("http://localhost:3001/downstream").then((r) =>
            r.json()
          );
        })(),
      ]);

      const { cid, t0 } = als.getStore();
      const elapsed = (performance.now() - t0).toFixed(1);
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({ ok: true, cid, elapsedMs: elapsed, results: [a, b] })
      );
      return;
    }

    // Raíz: muestra el cid actual
    if (url.pathname === "/") {
      const { cid } = als.getStore();
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ hello: "world", cid }));
      return;
    }

    res.statusCode = 404;
    res.end("Not found");
  });
});

server.listen(3001, () => console.log("listening on http://localhost:3001"));
