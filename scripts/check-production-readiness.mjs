#!/usr/bin/env node
// Production readiness gate (blueprint §24/§40).
//
// A DEMO build (default) may degrade shared features honestly.
// A PRODUCTION build (DEPLOY_TARGET=production) must fail closed when critical
// configuration is missing so shared features can never be silently disabled.
import fs from "node:fs";
import path from "node:path";

const target = process.env.DEPLOY_TARGET ?? "demo";
const required = ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const missing = required.filter((k) => !process.env[k] || process.env[k].trim() === "");

console.log(`deploy target: ${target}`);
if (target === "production") {
  if (missing.length > 0) {
    console.error(`\nPRODUCTION BUILD BLOCKED — missing required environment variables:\n  ${missing.join("\n  ")}`);
    console.error(`\nProduction deployments must ship with the shared backend + canonical site URL configured.`);
    process.exit(1);
  }
  if (!/^https:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL)) {
    console.error("PRODUCTION BUILD BLOCKED — NEXT_PUBLIC_SITE_URL must be https:// in production.");
    process.exit(1);
  }
  console.log("production readiness: OK");
} else {
  // Demo/demo-adjacent builds: warn loudly but allow honest degradation.
  const warnings = missing.map((k) => `  - ${k}: shared features will show setup notices`);
  if (warnings.length) console.warn(`demo build degrades gracefully:\n${warnings.join("\n")}`);
}

// Audio manifest sanity — every referenced clip must exist on disk.
const manifestPath = path.join(process.cwd(), "public", "audio", "manifest.json");
const clips = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "lib", "content", "audio-clips.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
let bad = 0;
for (const clip of clips.clips) {
  const entry = manifest.files[clip.id];
  const onDisk = fs.existsSync(path.join(process.cwd(), "public", clip.kind === "dictation" ? "audio/dictation" : "audio/transcription", `${clip.id}.wav`));
  if (!entry || !onDisk) {
    console.error(`missing audio asset for ${clip.id}`);
    bad++;
  } else if (!entry.path.endsWith(".wav")) {
    console.error(`stale asset format for ${clip.id} (${entry.path}) — regenerate audio`);
    bad++;
  }
}
if (bad > 0) process.exit(1);
console.log(`audio assets verified: ${clips.clips.length}/${clips.clips.length} present (piper wav)`);
