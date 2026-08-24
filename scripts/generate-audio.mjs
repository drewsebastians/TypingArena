#!/usr/bin/env node
// Offline static-audio generation (DEVELOPMENT TOOL — never shipped to the site).
//
// Reads src/lib/content/audio-clips.json and synthesizes each narration to a
// static MP3 under public/audio/<kind>/<id>.mp3 using edge-tts (Microsoft
// neural voices). Also writes public/audio/manifest.json with sha256 checksums
// so assets can be verified.
//
// The WEBSITE RUNTIME only downloads/plays these files; it never calls any TTS
// service. See docs/LICENSES.md for licensing notes.
//
// Usage: npm run generate:audio   (requires python -m pip install edge-tts)

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "src", "lib", "content", "audio-clips.json");
const AUDIO_DIR = path.join(ROOT, "public", "audio");

const data = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
fs.mkdirSync(path.join(AUDIO_DIR, "dictation"), { recursive: true });
fs.mkdirSync(path.join(AUDIO_DIR, "transcription"), { recursive: true });

const files = {};
let count = 0;
for (const clip of data.clips) {
  const outPath = path.join(AUDIO_DIR, clip.kind, `${clip.id}.mp3`);
  const text = clip.transcript.replace(/—/g, ",").replace(/;/g, ",");
  console.log(`→ ${clip.id} (${clip.voice} ${clip.rate})`);
  try {
    execFileSync("python", [
      "-m", "edge_tts",
      "--voice", clip.voice,
      "--rate", clip.rate,
      "--text", text,
      "--write-media", outPath,
    ], { stdio: ["ignore", "ignore", "inherit"] });
  } catch (err) {
    console.error(`FAILED: ${clip.id}`, err.message);
    process.exitCode = 1;
    continue;
  }
  const buf = fs.readFileSync(outPath);
  files[clip.id] = {
    path: `/audio/${clip.kind}/${clip.id}.mp3`,
    bytes: buf.length,
    sha256: createHash("sha256").update(buf).digest("hex"),
    voice: clip.voice,
    rate: clip.rate,
  };
  count++;
}

const manifest = {
  generatedAt: new Date().toISOString(),
  generator: { tool: "edge-tts", stage: "development-time only; runtime plays static files" },
  license: data.license,
  contentVersion: data.version,
  files,
};
fs.writeFileSync(path.join(AUDIO_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nGenerated ${count}/${data.clips.length} clips + manifest.json`);
