// Pulls failed-run scenario output safely (no secrets persisted).
import { execSync } from "node:child_process";
const run = process.argv[2];
if (!run) {
  console.error("usage: node scripts/ci-scenarios.mjs <run-id>");
  process.exit(1);
}
const out = execSync(`gh run view ${run} --log-failed`, { encoding: "utf8", maxBuffer: 1 << 27 });
for (const line of out.split("\n")) {
  if (/scenario|scenarios passed|usage:/.test(line)) console.log(line);
}
