# Content & audio license records

Principle: every shipped asset must have a documented source, license and
review step. When in doubt, remove the asset.

## Typing corpora

| Corpus | Source | License | Version |
|---|---|---|---|
| `src/lib/content/english.ts` (+ specialized packs) | Original prose authored for TypingArena | Original work of this project; free to use within it | `original-en-v3` |
| `src/lib/content/indonesian.ts` | Original Bahasa Indonesia authored for TypingArena (not machine-translated) | Same as above | `original-id-v3` |

## Dictation & transcription audio — RIGHTS CLOSED

| Field | Value |
|---|---|
| Files | `public/audio/dictation/*.wav`, `public/audio/transcription/*.wav` |
| Narrations | Original scripts written for TypingArena (`src/lib/content/audio-clips.json` — single source of truth) |
| Engine | **Piper TTS** (`piper-tts` pip package), MIT license |
| Voice models | `en_US-amy-medium`, `en_US-joe-medium`, `id_ID-news_tts-medium` from `rhasspy/piper-voices` (ONNX), **MIT license** |
| Generation stage | Offline, during development only (`npm run generate:audio`). The website runtime only downloads/plays the static WAV files; no TTS/ASR API is called at runtime (CI greps bundles for `speechSynthesis`). |
| Verification | `public/audio/manifest.json` stores per-file sha256 + size; unit tests assert code transcripts == manifest and files exist on disk. |

**Commercial-use status:** Piper's MIT license covers the engine and the voice
models and permits redistribution of generated outputs without attribution,
including commercial use. No "reverify before launch" caveat remains for
shipped audio.

## User-uploaded custom audio (custom tests)

Uploaders must confirm they hold the rights to the uploaded recording and its
transcript. TypingArena does not claim ownership of user uploads; uploaders can
delete their files at any time. Uploaded content never enters official ranked
boards.

## Future ingestion checklist (e.g. Common Voice)

1. Verify the exact current license of the release being downloaded.
2. Record dataset version, file IDs, import date in this table.
3. Preserve attribution requirements if any.
4. Confirm redistribution rights.
5. Re-verify on each new ingest.
