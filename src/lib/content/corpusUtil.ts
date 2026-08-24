import type { CorpusItem, Difficulty, Language, Mode } from "../types";

export type CorpusSeed = Omit<CorpusItem, "charCount" | "wordCount" | "punctuationTypes">;

const PUNCT_RE = /[.,!?;:"'`“”‘’«»()\[\]{}\-–—…·/|@$#%&*+=<>~^]/;

/**
 * Single source of truth for corpus metadata: char count, word count and
 * punctuation inventory are always DERIVED from the text itself, so metadata
 * can never drift from content.
 */
export function defineCorpusItem(seed: CorpusSeed): CorpusItem {
  const text = seed.text;
  return {
    ...seed,
    charCount: text.length,
    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
    punctuationTypes: [...new Set([...text].filter((c) => PUNCT_RE.test(c)))],
  };
}

export function item(
  id: string,
  language: Language,
  mode: Mode,
  difficulty: Difficulty,
  tags: string[],
  source: string,
  text: string,
): CorpusItem {
  return defineCorpusItem({ id, text, language, mode, difficulty, tags, source });
}
