# Content & audio license records

Principle (blueprint §35): every shipped asset must have a documented source,
license and review step. When in doubt, remove the asset.

## Typing corpora

| Corpus | Source | License | Version |
|---|---|---|---|
| `src/lib/content/english.ts` | Original prose authored for TypingArena | Proprietary-to-project (original work), free to use within this project | `original-en-v2` |
| `src/lib/content/indonesian.ts` | Original Bahasa Indonesia authored for TypingArena (not machine-translated) | Same as above | `original-id-v2` |

## Dictation & transcription audio

| Field | Value |
|---|---|
| Files | `public/audio/dictation/*.mp3`, `public/audio/transcription/*.mp3` |
| Narrations | Original scripts written for TypingArena (`src/lib/content/audio-clips.json` — single source of truth) |
| Voices | Microsoft Edge neural voices via **edge-tts**, rendered OFFLINE during development only: en-US-AriaNeural, en-US-AndrewNeural, id-ID-ArdiNeural, id-ID-GadisNeural |
| Verification | `public/audio/manifest.json` records per-file sha256 + size; unit tests assert code transcripts == manifest and files exist |
| Runtime policy | The website ONLY downloads/plays these files. No TTS/ASR API is called at runtime. CI greps production bundles for `speechSynthesis`. |

**Known risk (honest disclosure):** synthetic neural voices are used for
bootstrap content. Before commercial-scale launch, re-record with human
narration or a TTS license that explicitly grants redistribution rights for
generated audio, and re-verify Microsoft's current service terms.

## Future ingestion checklist (e.g. Common Voice)

1. Verify the exact current license of the release being downloaded (do not
   rely on older statements).
2. Record dataset version, file IDs, import date in this table.
3. Preserve attribution requirements if any.
4. Confirm redistribution rights for our hosting jurisdiction.
5. Re-verify on each new ingest.
