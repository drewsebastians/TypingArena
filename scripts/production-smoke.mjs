#!/usr/bin/env node
// Production launch smoke — verifies a DEPLOYED TypingArena origin.
//
// Usage:
//   SITE_URL=https://typing.example.com node scripts/production-smoke.mjs
//   node scripts/production-smoke.mjs https://drewsebastians.github.io/TypingArena
//
// No secrets, no repo-coupled assumptions beyond public route names.
// Deterministic; uses only Node's global fetch (Node >= 18).

const target = (process.env.SITE_URL || process.argv[2] || "").replace(/\/+$/, "");
if (!target || !/^https?:\/\//.test(target)) {
  console.error("Usage: SITE_URL=<https origin>[/<base-path>] node scripts/production-smoke.mjs");
  process.exit(2);
}

const u = new URL(target);
const ORIGIN = `${u.protocol}//${u.host}`;
const BASE = u.pathname.replace(/\/+$/, ""); // "" or e.g. "/TypingArena"
const PLACEHOLDER = /(example\.(com|org)|typingarena\.example|placeholder|your-project)/i;

let passed = 0;
let failed = 0;
function ok(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  PASS ${name}`);
  } else {
    failed++;
    console.error(`  FAIL ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

async function fetchText(path, expect = 200) {
  const res = await fetch(`${ORIGIN}${BASE}${path}`, { redirect: "follow" });
  let body = "";
  if (expect === 200) body = await res.text().catch(() => "");
  return { res, body };
}

console.log(`smoke target: ${target} (origin ${ORIGIN}, base "${BASE || "/"}")`);

// ---------------------------------------------------------------------------
// 1. Route matrix — every public page must render 200 HTML
// ---------------------------------------------------------------------------
const ROUTES = [
  "/",
  "/typing-test",
  "/typing-test/1-minute",
  "/typing-test/5-minute",
  "/tes-mengetik",
  "/data-entry-test",
  "/punctuation-typing-test",
  "/noise-challenge",
  "/dictation/english",
  "/dictation/indonesian",
  "/transcription-practice",
  "/transcription-library",
  "/career",
  "/daily-arena",
  "/leaderboard",
  "/seasons",
  "/friends",
  "/multiplayer",
  "/teams",
  "/custom",
  "/assessments",
  "/progress",
  "/privacy",
];

console.log("\n[routes]");
for (const route of ROUTES) {
  try {
    const { res, body } = await fetchText(route);
    ok(
      `GET ${route}`,
      res.status === 200 && /text\/html/i.test(res.headers.get("content-type") ?? "") && body.length > 500,
      `status=${res.status}`,
    );
  } catch (e) {
    ok(`GET ${route}`, false, String(e));
  }
}

// ---------------------------------------------------------------------------
// 2. SEO: robots + sitemap contract
// ---------------------------------------------------------------------------
console.log("\n[seo]");
{
  const { res, body } = await fetchText("/robots.txt");
  ok("robots.txt reachable", res.status === 200);
  ok("robots disallows /progress", /Disallow:\s*\/progress/i.test(body));
  ok("robots references sitemap", /sitemap:/i.test(body));
}
let sitemapBody = "";
{
  const { res, body } = await fetchText("/sitemap.xml");
  sitemapBody = body;
  ok("sitemap.xml reachable", res.status === 200 && sitemapBody.includes("<loc>"));
  const locs = [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  ok("sitemap has entries", locs.length >= 5, `found ${locs.length}`);
  const offOrigin = locs.filter((l) => !l.startsWith(`${ORIGIN}${BASE}/`) && l !== `${ORIGIN}${BASE}`);
  ok("all sitemap URLs use the canonical origin+base", offOrigin.length === 0, offOrigin.slice(0, 3).join(" | "));
  const badDomains = locs.filter((l) => PLACEHOLDER.test(l));
  ok("no placeholder domains in sitemap", badDomains.length === 0);
  ok("progress excluded from sitemap", !locs.some((l) => /\/progress/.test(l)));
}

// ---------------------------------------------------------------------------
// 3. Homepage sanity: canonical, title, no placeholders, real asset refs
// ---------------------------------------------------------------------------
console.log("\n[homepage]");
let homeHtml = "";
{
  const { body } = await fetchText("/");
  homeHtml = body;
  ok("title present", /<title>[^<]{3,}<\/title>/i.test(homeHtml));
  const canon = homeHtml.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
    ?? homeHtml.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  ok(
    "canonical matches site url + base",
    Boolean(canon) && (canon[1] === `${target}/` || canon[1] === `${target}`),
    canon ? canon[1] : "none found",
  );
  ok("no placeholder domains in html", !PLACEHOLDER.test(homeHtml));
  ok("html lang attribute present", /<html[^>]+lang=/i.test(homeHtml));
}

// ---------------------------------------------------------------------------
// 4. Critical static assets resolve (one JS chunk + one audio file)
// ---------------------------------------------------------------------------
console.log("\n[assets]");
{
  const jsRef = homeHtml.match(/(?:src=|href=)["']([^"']*\/_next\/static\/[^"']+\.js)["']/i)
    ?? homeHtml.match(/["']([^"']*\/_next\/static\/chunks\/[^"']+\.js)["']/i);
  if (jsRef) {
    const jsUrl = jsRef[1].startsWith("http")
      ? jsRef[1]
      : `${ORIGIN}${jsRef[1].startsWith(BASE) ? "" : BASE}${jsRef[1]}`;
    const res = await fetch(jsUrl, { method: "GET" });
    ok("critical JS chunk loads", res.status === 200, `${res.status} ${jsUrl}`);
  } else {
    ok("critical JS chunk loads", false, "no /_next/static chunk referenced in homepage html");
  }

  const { body: dictHtml } = await fetchText("/dictation/english");
  const audioRef = dictHtml.match(/["']([^"']*\/audio\/dictation\/[^"']+\.wav)["']/i);
  if (audioRef) {
    const audioUrl = audioRef[1].startsWith("http")
      ? audioRef[1]
      : `${ORIGIN}${audioRef[1].startsWith("/") ? "" : BASE}${audioRef[1]}`;
    const res = await fetch(audioUrl, { method: "GET" });
    const type = res.headers.get("content-type") ?? "";
    ok("static dictation audio loads", res.status === 200 && /audio|octet-stream/i.test(type), `${res.status} ${type} ${audioUrl}`);
  } else {
    ok("static dictation audio loads", false, "no wav reference found on /dictation/english");
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\nsmoke complete: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
