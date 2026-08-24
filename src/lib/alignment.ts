// Deterministic sequence alignment used by scoring (Wagner–Fischer with traceback).
//
// Why alignment: positional (index-by-index) comparison misclassifies every
// character after a single insertion or deletion. Alignment attributes errors to
// the actual edit operations that produced the final text.
//
// Cost model: substitution 1, insertion 1, deletion 1. Ties prefer
// match > substitution > insertion > deletion so behaviour is fully
// deterministic across platforms.

export type AlignOp =
  | { type: "match"; expected: string; typed: string }
  | { type: "substitute"; expected: string; typed: string }
  | { type: "insert"; expected: null; typed: string }
  | { type: "delete"; expected: string; typed: null };

export interface AlignStats {
  matches: number;
  substitutions: number;
  insertions: number;
  deletions: number;
}

export function alignSequences(expected: string, typed: string): { ops: AlignOp[]; stats: AlignStats } {
  const m = expected.length;
  const n = typed.length;
  // dp[i][j] = edit distance between expected[0..i) and typed[0..j)
  const dp: Uint32Array[] = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    const row = dp[i];
    const prev = dp[i - 1];
    const chA = expected.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      if (chA === typed.charCodeAt(j - 1)) {
        row[j] = prev[j - 1];
      } else {
        const sub = prev[j - 1] + 1;
        const del = prev[j] + 1; // delete expected char (user skipped it)
        const ins = row[j - 1] + 1; // insert extra char
        row[j] = Math.min(sub, del, ins);
      }
    }
  }

  const ops: AlignOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expected[i - 1] === typed[j - 1]) {
      ops.push({ type: "match", expected: expected[i - 1], typed: typed[j - 1] });
      i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push({ type: "substitute", expected: expected[i - 1], typed: typed[j - 1] });
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ type: "delete", expected: expected[i - 1], typed: null });
      i--;
    } else {
      ops.push({ type: "insert", expected: null, typed: typed[j - 1] });
      j--;
    }
  }
  ops.reverse();

  const stats: AlignStats = { matches: 0, substitutions: 0, insertions: 0, deletions: 0 };
  for (const op of ops) stats[op.type === "match" ? "matches" : op.type === "substitute" ? "substitutions" : op.type === "insert" ? "insertions" : "deletions"]++;
  return { ops, stats };
}

/**
 * Word-level alignment (same algorithm over token arrays). Returns, for each
 * reference word index, whether it was matched. Used for dictation /
 * transcription word accuracy where word order matters but position drift must
 * not cascade.
 */
export function alignWords(refWords: string[], typedWords: string[]): { matchedRef: boolean[]; matchedTypedCount: number } {
  const m = refWords.length;
  const n = typedWords.length;
  const dp: Uint32Array[] = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (refWords[i - 1] === typedWords[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const matchedRef = new Array<boolean>(m).fill(false);
  let matchedTypedCount = 0;
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && refWords[i - 1] === typedWords[j - 1]) {
      matchedRef[i - 1] = true;
      matchedTypedCount++;
      i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      i--;
    } else {
      j--;
    }
  }
  return { matchedRef, matchedTypedCount };
}
