#!/usr/bin/env node
// Offline static-audio generation (DEVELOPMENT TOOL — never shipped to the site).
//
// Reads src/lib/content/audio-clips.json and synthesizes each narration with
// **Piper TTS** (MIT-licensed engine AND MIT-licensed voice models from
// rhasspy/piper-voices), producing WAV files under public/audio/<kind>/<id>.wav.
//
// RIGHTS: Piper's MIT license explicitly permits use and redistribution of the
// software, models, and generated outputs, including commercial use. See
// docs/LICENSES.md for the full record.
//
// The WEBSITE RUNTIME only downloads/plays these files; it never calls any TTS
// service. Usage: npm run generate:audio  (requires: pip install piper-tts)

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "src", "lib", "content", "audio-clips.json");
const AUDIO_DIR = path.join(ROOT, "public", "audio");

// Piper length_scale: >1 = slower, <1 = faster.
const SPEED_TO_LENGTH_SCALE = { slow: 1.25, medium: 1.0, fast: 0.85 };

const data = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
for (const kind of ["dictation", "transcription"]) {
  fs.mkdirSync(path.join(AUDIO_DIR, kind), { recursive: true });
}

// Ensure every needed voice model is present locally.
const voices = [...new Set(data.clips.map((c) => c.voice))];
for (const voice of voices) {
  console.log(`→ ensuring voice ${voice}`);
  execFileSync("python", ["-m", "piper.download_voices", voice], { stdio: "inherit" });
}

function speak(voice, lengthScale, text, outPath) {
  execFileSync("python", [
    "-m", "piper",
    "-m", voice,
    `--length-scale`, String(lengthScale),
    "-f", outPath,
  ], { input: text, stdio: ["pipe", "ignore", "inherit"] });
}

// Remove stale files (e.g., previous .mp3 generation) so the manifest is truthful.
for (const kind of ["dictation", "transcription"]) {
  const dir = path.join(AUDIO_DIR, kind);
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".wav")) fs.rmSync(path.join(dir, f));
  }
}

const files = {};
let count = 0;
for (const clip of data.clips) {
  const outPath = path.join(AUDIO_DIR, clip.kind, `${clip.id}.wav`);
  // Piper reads plain text; normalize dashes/semicolons to commas for natural pauses.
  const text = clip.transcript.replace(/—/g, ",").replace(/;/g, ",");
  const lengthScale = SPEED_TO_LENGTH_SCALE[clip.speed ?? "medium"] ?? 1.0;
  process.stdout.write(`→ ${clip.id} (${clip.voice} ×${lengthScale}) … `);
  try {
    speak(clip.voice, lengthScale, text, outPath);
  } catch (err) {
    console.error(`FAILED: ${clip.id}`, err.message);
    process.exitCode = 1;
    continue;
  }
  const buf = fs.readFileSync(outPath);
  files[clip.id] = {
    path: `/audio/${clip.kind}/${clip.id}.wav`,
    bytes: buf.length,
    sha256: createHash("sha256").update(buf).digest("hex"),
    voice: clip.voice,
    speed: clip.speed ?? "medium",
  };
  count++;
  console.log(`${(buf.length / 1024).toFixed(0)} KB`);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  generator: {
    tool: "piper-tts",
    stage: "development-time only; runtime plays static files",
    license: "MIT (engine + voice models); generated audio redistribution permitted, including commercial use",
  },
  license: data.license,
  contentVersion: data.version,
  files,
};
fs.writeFileSync(path.join(AUDIO_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nGenerated ${count}/${data.clips.length} clips + manifest.json`);
