#!/usr/bin/env node
// Minimal static file server for the exported site (out/) — used by Playwright
// E2E runs and local production-output inspection. No dependencies.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const PORT = Number(process.env.PORT ?? 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url ?? "/", `http://localhost:${PORT}`).pathname);
    let filePath = path.join(ROOT, urlPath.replace(/^\/+/, ""));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      // trailingSlash export: /route → /route/index.html
      const withIndex = path.join(ROOT, urlPath.replace(/^\/+/, ""), "index.html");
      if (fs.existsSync(withIndex)) filePath = withIndex;
      else {
        res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
        return;
      }
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(500).end();
  }
});

server.listen(PORT, () => console.log(`static out/ served at http://localhost:${PORT}`));
