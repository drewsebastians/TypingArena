// Scans source text files for mojibake markers (Ã, â€, replacement char).
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["src", "e2e", "tests", "scripts", "docs", "supabase"];
const EXTS = new Set([".ts", ".tsx", ".json", ".md", ".yaml", ".mjs"]);
let bad = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (EXTS.has(path.extname(entry.name))) {
      if (entry.name === "check-encoding.mjs") continue; // scanner contains its own marker chars
      const text = fs.readFileSync(p, "utf8");
      if (/[\u00C3\u00E2\uFFFD]/.test(text)) {
        console.log(`${p}`);
        bad++;
      }
    }
  }
}
for (const r of ROOTS) if (fs.existsSync(r)) walk(r);
console.log(bad === 0 ? "NO MOJIBAKE MARKERS" : `${bad} files need review`);
