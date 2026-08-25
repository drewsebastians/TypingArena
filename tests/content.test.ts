import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DICTATION_CLIPS, TRANSCRIPTION_CLIPS } from "@/lib/content/dictation";
import { ENGLISH_CORPUS, ENGLISH_SPRINT_POOL } from "@/lib/content/english";
import { INDONESIAN_CORPUS } from "@/lib/content/indonesian";
import clipJson from "@/lib/content/audio-clips.json";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("corpus integrity", () => {
  it("metadata is derived from text (never drifted)", () => {
    for (const c of [...ENGLISH_CORPUS, ...INDONESIAN_CORPUS]) {
      expect(c.charCount).toBe(c.text.length);
      expect(c.wordCount).toBe(c.text.trim().split(/\s+/).filter(Boolean).length);
    }
  });

  it("ids are unique across all corpora", () => {
    const ids = [...ENGLISH_CORPUS, ...INDONESIAN_CORPUS].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("both languages have substantial pools for repeat practice", () => {
    expect(ENGLISH_SPRINT_POOL.length).toBeGreaterThanOrEqual(10);
    expect(INDONESIAN_CORPUS.filter((c) => c.mode === "sprint").length).toBeGreaterThanOrEqual(6);
    expect(ENGLISH_CORPUS.filter((c) => c.mode === "numbers").length).toBeGreaterThanOrEqual(4);
    expect(ENGLISH_CORPUS.filter((c) => c.mode === "punctuation").length).toBeGreaterThanOrEqual(4);
    expect(INDONESIAN_CORPUS.filter((c) => c.mode === "copy-pro").length).toBeGreaterThanOrEqual(3);
  });

  it("Indonesian corpus is original (not machine-translated English) — spot checks", () => {
    const idText = INDONESIAN_CORPUS.map((c) => c.text).join(" ");
    expect(idText).toContain("Rp"); // Indonesian currency formatting
    expect(idText.toLowerCase()).toContain("yang");
    expect(idText.toLowerCase()).toContain("dengan");
  });
});

describe("audio content — static assets and manifest consistency", () => {
  const manifestPath = path.join(root, "public", "audio", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    files: Record<string, { path: string; sha256: string; bytes: number }>;
  };

  it("every dictation/transcription clip has a generated static audio file on disk", () => {
    for (const clip of [...DICTATION_CLIPS, ...TRANSCRIPTION_CLIPS]) {
      const onDisk = path.join(root, "public", clip.audioPath.replace(/^\//, ""));
      expect(fs.existsSync(onDisk), `missing audio asset for ${clip.id}`).toBe(true);
      expect(manifest.files[clip.id]).toBeDefined();
    }
  });

  it("manifest checksums match the files on disk sizes", () => {
    for (const [id, meta] of Object.entries(manifest.files)) {
      const buf = fs.readFileSync(path.join(root, "public", meta.path.replace(/^\//, "")));
      expect(buf.length, id).toBe(meta.bytes);
    }
  });

  it("transcripts in code match the single-source manifest", () => {
    const byId = new Map(clipJson.clips.map((c) => [c.id, c.transcript]));
    for (const clip of DICTATION_CLIPS) {
      expect(byId.get(clip.id)).toBe(clip.transcript);
    }
    for (const clip of TRANSCRIPTION_CLIPS) {
      expect(byId.get(clip.id)).toBe(clip.transcript);
    }
  });

  it("dictation exists in BOTH languages; transcription clips are long-form", () => {
    expect(DICTATION_CLIPS.filter((d) => d.language === "en").length).toBeGreaterThanOrEqual(6);
    expect(DICTATION_CLIPS.filter((d) => d.language === "id").length).toBeGreaterThanOrEqual(4);
    expect(TRANSCRIPTION_CLIPS.length).toBeGreaterThanOrEqual(6);
    for (const t of TRANSCRIPTION_CLIPS) {
      expect(t.durationSec).toBeGreaterThanOrEqual(20); // advisory; player measures real duration
      expect(t.minDurationSec).toBeGreaterThanOrEqual(30);
    }
  });

  it("every clip carries source + license provenance", () => {
    for (const clip of [...DICTATION_CLIPS, ...TRANSCRIPTION_CLIPS]) {
      expect(clip.source).toContain("piper-dev-v3");
      expect(clip.license.length).toBeGreaterThan(20);
      expect(clip.speakerVoice).toMatch(/-medium$/);
    }
  });
});


