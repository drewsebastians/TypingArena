#!/usr/bin/env node
// Production readiness gate (blueprint §12/§26).
//
// A DEMO build (default) may degrade shared features honestly.
// A PRODUCTION build (DEPLOY_TARGET=production) must FAIL CLOSED when critical
// configuration is missing or looks like a placeholder, so shared features can
// never be silently disabled and SEO/auth URLs can never point at a fake
// origin.
import fs from "node:fs";
import path from "node:path";

const target = process.env.DEPLOY_TARGET ?? "demo";
const required = ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const missing = required.filter((k) => !process.env[k] || process.env[k].trim() === "");
const PLACEHOLDER = /(example\.(com|org)|placeholder|your-project|typingarena\.example|localhost)/i;

console.log(`deploy target: ${target}`);
if (target === "production") {
  const problems = [];
  if (missing.length > 0) {
    problems.push(`missing required environment variables:\n      ${missing.join("\n      ")}`);
  } else {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL.trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.trim();
    if (!/^https:\/\//.test(siteUrl)) problems.push("NEXT_PUBLIC_SITE_URL must be an https:// canonical origin");
    if (PLACEHOLDER.test(siteUrl)) problems.push("NEXT_PUBLIC_SITE_URL still contains a placeholder value");
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in|net)\/?$/i.test(supabaseUrl) && PLACEHOLDER.test(supabaseUrl)) {
      problems.push("NEXT_PUBLIC_SUPABASE_URL looks like a placeholder");
    }
    if ((process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").length < 40) {
      problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is too short to be a real anon key");
    }
  }
  if (problems.length > 0) {
    console.error(`\nPRODUCTION BUILD BLOCKED:\n  ${problems.join("\n  ")}`);
    console.error(`\nProduction deployments must ship the shared backend + canonical site URL configured.`);
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

// Static-output sanity — when a build already exists (post-build invocation),
// verify sitemap/robots exist and no placeholder domain leaked anywhere.
const outDir = path.join(process.cwd(), "out");
if (fs.existsSync(outDir)) {
  let leaked = false;
  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { scan(p); continue; }
      if (!/\.(html|xml|txt|js|mjs)$/.test(entry.name)) continue;
      const content = fs.readFileSync(p, "utf8");
      if (/typingarena\.example|placeholder\.invalid|example\.com\/typing/i.test(content)) {
        console.error(`placeholder domain leaked into ${path.relative(process.cwd(), p)}`);
        leaked = true;
      }
    }
  };
  scan(outDir);
  if (leaked) process.exit(1);
  const forbiddenAuthUi = /\b(sign\s*in|sign\s*up|log\s*in|magic\s+link)\b|>\s*account\s*</i;
  let authUiLeaked = false;
  const scanAuthUi = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { scanAuthUi(p); continue; }
      if (!/\.html$/.test(entry.name)) continue;
      const content = fs.readFileSync(p, "utf8");
      if (forbiddenAuthUi.test(content)) {
        console.error(`legacy auth UI text leaked into ${path.relative(process.cwd(), p)}`);
        authUiLeaked = true;
      }
    }
  };
  scanAuthUi(outDir);
  if (authUiLeaked) process.exit(1);
  for (const f of ["sitemap.xml", "robots.txt"]) {
    if (!fs.existsSync(path.join(outDir, f))) {
      console.error(`missing required static artifact: ${f}`);
      process.exit(1);
    }
  }
  console.log("static output verified: sitemap + robots present, no placeholder domains or legacy auth UI");
}
