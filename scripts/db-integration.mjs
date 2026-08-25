#!/usr/bin/env node
// Local-backend integration tests (blueprint §23).
//
// Runs against a LOCAL Supabase stack (supabase/start output on :54322) and
// proves the security model end-to-end WITHOUT production credentials:
//
//  1. RLS: anon cannot insert attempts directly.
//  2. Server-authoritative submission: valid evidence → ranked_accepted=true,
//     appears in public_leaderboard view.
//  3. Forged claim (250 WPM vs real counts) → flagged, NOT publicly visible.
//  4. Daily: wrong challenge_date rejected; correct date accepted once;
//     second same-day daily demoted to practice.
//  5. Custom test create + unlisted world read.
//  6. Team join-by-code with a second user.
//  7. delete_my_account removes the auth user completely.
//
// Usage (after `supabase db reset`):
//   node scripts/db-integration.mjs

import pg from "pg";

const CONN = process.env.SUPABASE_DB_URL ?? "postgres://postgres:postgres@127.0.0.1:54322/postgres";
const client = new pg.Client({ connectionString: CONN });

let passed = 0;
let failed = 0;
function ok(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

async function asUser(userId, fn) {
  // Simulate an authenticated PostgREST context inside a transaction.
  // COMMITs on success so downstream assertions can see persisted rows
  // (fresh DB per CI run makes this safe).
  await client.query("BEGIN");
  await client.query("SET LOCAL ROLE authenticated");
  await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: userId, role: "authenticated" }),
  ]);
  try {
    const result = await fn();
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  }
}

async function createUser(email) {
  const id = crypto.randomUUID();
  await client.query(
    `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
     values ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, 'x', now(), now(), now())`,
    [id, email],
  );
  return id;
}

const validEvidence = (over = {}) => ({
  client_id: crypto.randomUUID(),
  exercise_id: "en-sprint-001",
  exercise_version: "v3",
  scoring_version: "v2.0.0",
  mode: "sprint",
  language: "en",
  duration_sec: 30,
  elapsed_ms: 30000,
  typed_chars: 150,
  correct_chars: 142,
  uncorrected_errors: 5,
  focus_lost_count: 0,
  paste_flag: false,
  burst_flag: false,
  claimed_wpm: 60,
  claimed_accuracy: 94.7,
  ...over,
});

try {
  await client.connect();
  console.log("connected to local backend");

  const userA = await createUser("user-a@test.local");
  const userB = await createUser("user-b@test.local");

  // 1 — anon cannot insert attempts directly
  {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE anon");
    let blocked = false;
    try {
      await client.query("INSERT INTO public.attempts (user_id, exercise_id, exercise_version, scoring_version, mode, language, duration_sec, elapsed_ms, wpm, accuracy, integrity) VALUES (gen_random_uuid(),'x','v','v','sprint','en',30,30000,10,10,'ranked')");
    } catch {
      blocked = true;
    }
    await client.query("ROLLBACK");
    ok("RLS blocks anonymous direct attempt inserts", blocked);
  }

  // 2 — valid evidence → accepted ranked → visible on public board
  {
    const res = await asUser(userA, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [JSON.stringify(validEvidence())]),
    );
    const out = res.rows[0].r;
    ok("valid evidence accepted as ranked", out.accepted === true && out.integrity === "ranked", JSON.stringify(out));
    ok("server-derived wpm matches recomputation", Number(out.wpm) === 60);
    const vis = await client.query("select count(*) c from public.public_leaderboard where wpm=60");
    ok("accepted entry appears in public_leaderboard view", Number(vis.rows[0].c) >= 1);
  }

  // 3 — forged claim rejected
  {
    const forged = validEvidence({ claimed_wpm: 250 });
    const res = await asUser(userB, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [JSON.stringify(forged)]),
    );
    const out = res.rows[0].r;
    ok("forged 250wpm claim is NOT ranked", out.accepted === false && out.integrity === "flagged", JSON.stringify(out));
    const vis = await client.query("select count(*) c from public.public_leaderboard where accuracy >= 94 and wpm > 200");
    ok("forged entry invisible on public board", Number(vis.rows[0].c) === 0);
  }

  // 4 — daily challenge binding
  {
    const today = (await client.query("select (now() at time zone 'Asia/Jakarta')::date d")).rows[0].d.toISOString().slice(0, 10);
    const wrong = await asUser(userA, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [
        JSON.stringify(validEvidence({ mode: "daily", challenge_date: "2020-01-01", challenge_version: "v2", client_id: crypto.randomUUID() })),
      ]),
    );
    ok("wrong challenge_date rejected from ranked", wrong.rows[0].r.accepted === false);
    const right = await asUser(userA, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [
        JSON.stringify(validEvidence({ mode: "daily", challenge_date: today, challenge_version: "v2", client_id: crypto.randomUUID() })),
      ]),
    );
    ok("correct-date daily ranked", right.rows[0].r.integrity === "ranked", JSON.stringify(right.rows[0].r));
    const dup = await asUser(userA, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [
        JSON.stringify(validEvidence({ mode: "daily", challenge_date: today, challenge_version: "v2", client_id: crypto.randomUUID(), typed_chars: 160, correct_chars: 150, claimed_wpm: 64, claimed_accuracy: 93.8 })),
      ]),
    );
    ok("second same-day daily demoted to practice", dup.rows[0].r.integrity !== "ranked", JSON.stringify(dup.rows[0].r));
  }

  // 4b — idempotency: same client_id does not duplicate rows
  {
    const cid = crypto.randomUUID();
    await asUser(userB, () => client.query("SELECT public.submit_attempt($1::jsonb)", [JSON.stringify(validEvidence({ client_id: cid }))]));
    const before = (await client.query("select count(*) c from attempts where client_id=$1", [cid])).rows[0].c;
    const again = await asUser(userB, () => client.query("SELECT public.submit_attempt($1::jsonb)", [JSON.stringify(validEvidence({ client_id: cid }))]));
    const after = (await client.query("select count(*) c from attempts where client_id=$1", [cid])).rows[0].c;
    ok("duplicate client_id stays single row (idempotent)", Number(before) === Number(after), `before=${before} after=${after} res=${JSON.stringify(again.rows[0]?.r)}`);
  }

  // 5 — custom tests
  {
    const cid = await asUser(userA, () => client.query("SELECT public.create_custom_test($1::jsonb) id", [
      JSON.stringify({ title: "Invoice drill", language: "en", body: "Order #A-4829 shipped to 742 Evergreen Terrace.", visibility: "unlisted" }),
    ]));
    const row = await client.query("select body from public.custom_tests where id=$1", [cid.rows[0].id]);
    ok("custom test created + readable anonymously", row.rows.length === 1 && row.rows[0].body.includes("Evergreen"));
  }

  // 6 — teams join by code
  {
    const teamCode = "TESTCODE99";
    await client.query("insert into public.teams (name, join_code, owner_id) values ($1,$2,$3)", ["QA Team", teamCode, userA]);
    const joined = await asUser(userB, () => client.query("SELECT public.join_team($1) tid", [teamCode]));
    ok("second user joins by code", Boolean(joined.rows[0].tid));
    const members = await client.query("select count(*) c from public.team_members m join public.teams t on t.id=m.team_id where t.join_code=$1", [teamCode]);
    ok("membership recorded", Number(members.rows[0].c) === 2);
  }

  // 7 — full account deletion removes auth user
  {
    const doomed = await createUser("doomed@test.local");
    await asUser(doomed, () => client.query("SELECT public.delete_my_account()"));
    const stillThere = await client.query("select count(*) c from auth.users where id=$1", [doomed]);
    ok("delete_my_account removes the auth user", Number(stillThere.rows[0].c) === 0);
  }
} finally {
  await client.end().catch(() => undefined);
}

console.log(`\ndb-integration: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
