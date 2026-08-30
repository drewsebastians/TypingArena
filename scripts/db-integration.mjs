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
//  8. Team membership authorization: direct inserts/role escalation blocked,
//     create_team/join_team RPCs work, idempotent rejoin, rate limiting, leave.
//  9. Assignment completions bind to REAL attempts; scores derived server-side;
//     arbitrary-score payloads are structurally impossible.
// 10. Assessment invites resolve EXACT saved modules; expired/invalid invites
//     rejected; results private to owner; payload bounds enforced; lifecycle
//     states (not-open/revoked) distinguished.
// 11. Multiplayer host authority (token-verified start/rematch) + evidence-
//     derived results inside the race window; duplicates collapse.
// 12. Account deletion cascades owned teams.
// 13. Attempts write-path closure: forged ranked direct insert DENIED,
//     practice direct insert DENIED, UPDATE-to-ranked DENIED, RPC works,
//     history reads preserved.
// 14. Official ranked exercise binding: unknown exercise families demoted to
//     practice; career never ranks; imports stay unranked with derived wpm.
// 15. Friend results via validating RPC: evidence-derived metrics, name
//     sanitization, direct insert denied, unknown challenge rejected.
// 16. Assessment invite lifecycle: not_open / revoked states + owner-only
//     revoke RPC.
// 17. Team admin permissions: member cannot publish, admin can, self-promote
//     and ownership seizure denied, owner kick preserved.
// 18. Anonymous-style shared identity bootstrap and profile nickname rules.
// 19. Resource-scoped management capabilities: hash-only storage, scope,
//     recovery, rotation, revocation, and direct-table isolation.
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

  // 4 — daily challenge binding (exercise id must be the canonical daily form)
  {
    const today = (await client.query("select (now() at time zone 'Asia/Jakarta')::date d")).rows[0].d.toISOString().slice(0, 10);
    const wrong = await asUser(userA, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [
        JSON.stringify(validEvidence({ mode: "daily", exercise_id: `daily-${today}`, challenge_date: "2020-01-01", challenge_version: "v2", client_id: crypto.randomUUID() })),
      ]),
    );
    ok("wrong challenge_date rejected from ranked", wrong.rows[0].r.accepted === false);
    const right = await asUser(userA, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [
        JSON.stringify(validEvidence({ mode: "daily", exercise_id: `daily-${today}`, challenge_date: today, challenge_version: "v2", client_id: crypto.randomUUID() })),
      ]),
    );
    ok("correct-date daily ranked", right.rows[0].r.integrity === "ranked", JSON.stringify(right.rows[0].r));
    const dup = await asUser(userA, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [
        JSON.stringify(validEvidence({ mode: "daily", exercise_id: `daily-${today}`, challenge_date: today, challenge_version: "v2", client_id: crypto.randomUUID(), typed_chars: 160, correct_chars: 150, claimed_wpm: 64, claimed_accuracy: 93.8 })),
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
    // App flow adds the owner as a member at creation time.
    await client.query("insert into public.team_members (team_id, user_id, role) select id, owner_id, 'owner' from public.teams where join_code=$1", [teamCode]);
    const joined = await asUser(userB, () => client.query("SELECT public.join_team($1) tid", [teamCode]));
    ok("second user joins by code", Boolean(joined.rows[0].tid));
    const members = await client.query("select count(*) c from public.team_members m join public.teams t on t.id=m.team_id where t.join_code=$1", [teamCode]);
    ok("membership recorded", Number(members.rows[0].c) === 2);
  }

  const teamId = (await client.query("select id from public.teams where join_code='TESTCODE99'")).rows[0].id;

  // Expect an error from fn(); optionally matching a message fragment.
  async function expectError(name, fn, needle) {
    try {
      await fn();
      failed++;
      console.error(`  ✗ ${name} — expected an error but none was thrown`);
    } catch (e) {
      if (!needle || String(e.message).includes(needle)) {
        passed++;
        console.log(`  ✓ ${name}`);
      } else {
        failed++;
        console.error(`  ✗ ${name} — got "${e.message}", wanted "${needle}"`);
      }
    }
  }

  async function asAnon(fn) {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE anon");
    try {
      const result = await fn();
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw e;
    }
  }

  // 18–19 — ANONYMOUS-FIRST IDENTITY + RESOURCE CAPABILITIES
  {
    // A null email models the product's anonymous Auth identity. The RPCs
    // authorize by auth.uid(), never by a client-supplied arbitrary UUID.
    const anonymousOwner = await createUser(null);
    const recoveryUser = await createUser(null);
    const profile = await asUser(anonymousOwner, () =>
      client.query("SELECT public.ensure_shared_profile($1,$2) p", ["Anonymous Owner", "en"]),
    );
    const email = await client.query("select email from auth.users where id=$1", [anonymousOwner]);
    ok("anonymous-style identity has no email", email.rows[0].email === null);
    ok("shared bootstrap stores a nickname", profile.rows[0].p.username === "Anonymous Owner");

    const createdTeam = await asUser(anonymousOwner, () =>
      client.query("SELECT public.create_team($1) t", ["Capability Team"]),
    );
    const capabilityTeamId = createdTeam.rows[0].t.id;
    const createdCustom = await asUser(anonymousOwner, () =>
      client.query("SELECT public.create_custom_test($1::jsonb) id", [
        JSON.stringify({ title: "Capability drill", language: "en", body: "A private capability test passage.", visibility: "private" }),
      ]),
    );
    const capabilityCustomId = createdCustom.rows[0].id;
    const createdAssessment = await asUser(anonymousOwner, () =>
      client.query(
        "insert into public.assessments (owner_id,title,modules) values ($1,$2,$3::jsonb) returning id",
        [anonymousOwner, "Capability Assessment", JSON.stringify([{ id: "module-1", mode: "sprint", language: "en", duration_sec: 30 }])],
      ),
    );
    const capabilityAssessmentId = createdAssessment.rows[0].id;

    const issue = async (type, id) => (await asUser(anonymousOwner, () =>
      client.query("SELECT public.issue_resource_management_token($1,$2) r", [type, id]),
    )).rows[0].r;
    const teamCapability = await issue("team", capabilityTeamId);
    const customCapability = await issue("custom", capabilityCustomId);
    const assessmentCapability = await issue("assessment", capabilityAssessmentId);
    ok(
      "capability tokens have high entropy and are returned only at issue time",
      [teamCapability, customCapability, assessmentCapability].every((r) => /^[0-9a-f]{64}$/.test(r.token)),
    );
    const stored = await client.query(
      "select resource_type, octet_length(token_hash) hash_bytes from public.resource_capabilities where resource_id = any($1::text[])",
      [[capabilityTeamId, capabilityCustomId, capabilityAssessmentId]],
    );
    ok("only SHA-256-sized capability hashes are stored", stored.rows.length === 3 && stored.rows.every((r) => Number(r.hash_bytes) === 32));
    await expectError(
      "authenticated clients cannot read capability rows",
      () => asUser(anonymousOwner, () => client.query("select token_hash from public.resource_capabilities limit 1")),
    );
    await expectError(
      "capability cannot cross resource types",
      () => asUser(recoveryUser, () => client.query(
        "select public.validate_resource_management_token('custom',$1,$2)",
        [capabilityCustomId, teamCapability.token],
      )),
      "management_invalid",
    );
    await expectError(
      "non-owner cannot issue a management capability",
      () => asUser(recoveryUser, () => client.query(
        "select public.issue_resource_management_token('team',$1)",
        [capabilityTeamId],
      )),
      "not_found_or_not_owner",
    );

    const recoveredTeam = await asUser(recoveryUser, () =>
      client.query("SELECT public.recover_resource_management('team',$1,$2) r", [capabilityTeamId, teamCapability.token]),
    );
    const recoveredCustom = await asUser(recoveryUser, () =>
      client.query("SELECT public.recover_resource_management('custom',$1,$2) r", [capabilityCustomId, customCapability.token]),
    );
    const recoveredAssessment = await asUser(recoveryUser, () =>
      client.query("SELECT public.recover_resource_management('assessment',$1,$2) r", [capabilityAssessmentId, assessmentCapability.token]),
    );
    ok("valid scoped capability recovers exactly its team", recoveredTeam.rows[0].r.resource_id === capabilityTeamId);
    ok("valid scoped capability recovers exactly its custom test", recoveredCustom.rows[0].r.resource_id === capabilityCustomId);
    ok("valid scoped capability recovers exactly its assessment", recoveredAssessment.rows[0].r.resource_id === capabilityAssessmentId);
    const owners = await client.query(
      "select (select owner_id from public.teams where id=$1) team_owner, (select owner_id from public.custom_tests where id=$2) custom_owner, (select owner_id from public.assessments where id=$3) assessment_owner",
      [capabilityTeamId, capabilityCustomId, capabilityAssessmentId],
    );
    ok(
      "recovery transfers only the named resource to the current identity",
      owners.rows[0].team_owner === recoveryUser
        && owners.rows[0].custom_owner === recoveryUser
        && owners.rows[0].assessment_owner === recoveryUser,
    );
    await expectError(
      "successful recovery invalidates the previous custom capability",
      () => asUser(recoveryUser, () => client.query(
        "select public.validate_resource_management_token('custom',$1,$2)",
        [capabilityCustomId, customCapability.token],
      )),
      "management_invalid",
    );
    await expectError(
      "successful recovery invalidates the previous assessment capability",
      () => asUser(recoveryUser, () => client.query(
        "select public.validate_resource_management_token('assessment',$1,$2)",
        [capabilityAssessmentId, assessmentCapability.token],
      )),
      "management_invalid",
    );

    const rotated = await asUser(recoveryUser, () =>
      client.query("SELECT public.issue_resource_management_token('team',$1) r", [capabilityTeamId]),
    );
    await expectError(
      "issuing a new capability revokes the previous one",
      () => asUser(recoveryUser, () => client.query(
        "select public.validate_resource_management_token('team',$1,$2)",
        [capabilityTeamId, teamCapability.token],
      )),
      "management_invalid",
    );
    await asUser(recoveryUser, () =>
      client.query("select public.revoke_resource_management_token('team',$1)", [capabilityTeamId]),
    );
    await expectError(
      "owner revocation invalidates the active capability",
      () => asUser(recoveryUser, () => client.query(
        "select public.validate_resource_management_token('team',$1,$2)",
        [capabilityTeamId, rotated.rows[0].r.token],
      )),
      "management_invalid",
    );
  }

  const userC = await createUser("user-c@test.local");
  const userD = await createUser("user-d@test.local");

  // 8 — TEAM MEMBERSHIP AUTHORIZATION REGRESSIONS (blueprint §6)
  {
    // 8a: random authenticated user cannot direct-insert membership by UUID.
    await expectError(
      "random user cannot direct-insert into another team's roster",
      () => asUser(userC, () =>
        client.query("insert into public.team_members (team_id, user_id, role) values ($1,$2,'member')", [teamId, userC]),
      ),
    );

    // 8b: nobody can self-insert an owner role anywhere.
    await expectError(
      "role escalation via direct insert is blocked",
      () => asUser(userB, () =>
        client.query("insert into public.team_members (team_id, user_id, role) values ($1,$2,'owner')", [teamId, userB]),
      ),
    );

    // 8c: direct team creation path is closed (RPC only now).
    await expectError(
      "direct teams insert policy removed (create_team RPC is the path)",
      () => asUser(userB, () =>
        client.query("insert into public.teams (name, owner_id) values ('Shadow Team', $1)", [userB]),
      ),
    );

    // 8d: create_team RPC works and creates the owner membership atomically.
    const created = await asUser(userB, () => client.query("SELECT public.create_team($1) t", ["Audit Squad"]));
    const t2 = created.rows[0].t;
    ok("create_team returns id + join_code", Boolean(t2.id) && Boolean(t2.join_code));
    const ownerRow = await client.query("select role from public.team_members where team_id=$1 and user_id=$2", [t2.id, userB]);
    ok("owner membership created atomically by create_team", ownerRow.rows.length === 1 && ownerRow.rows[0].role === "owner");

    // 8e: invalid join code fails cleanly.
    await expectError("invalid join code rejected", () =>
      asUser(userC, () => client.query("SELECT public.join_team('NOPE0000')")), "team_not_found");

    // 8f: re-joining is idempotent (single membership row).
    await asUser(userB, () => client.query("SELECT public.join_team($1)", ["TESTCODE99"]));
    const bRows = await client.query("select count(*) c from public.team_members where team_id=$1 and user_id=$2", [teamId, userB]);
    ok("existing member rejoin is idempotent", Number(bRows.rows[0].c) === 1);

    // 8g: join rate limiting (10/hour per user).
    const rlCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = `RATELIM${i}QZ`;
      await client.query("insert into public.teams (name, join_code, owner_id) values ($1,$2,$3)", [`RL Team ${i}`, code, userA]);
      rlCodes.push(code);
    }
    for (const code of rlCodes) {
      await asUser(userD, () => client.query("SELECT public.join_team($1)", [code]));
    }
    await expectError("11th join within the hour is rate-limited", () =>
      asUser(userD, () => client.query("SELECT public.join_team($1)", ["ZZZZZZZZ"])), "rate_limited");
  }

  // 9 — CLASSROOM ASSIGNMENTS REQUIRE REAL RESULTS (blueprint §7)
  {
    // Owner publishes a sprint assignment with a concrete exercise definition.
    const assignment = await asUser(userA, () =>
      client.query(
        "insert into public.assignments (team_id, title, kind, payload, created_by) values ($1,'Week 3 numeric drill','sprint',$2,$3) returning id",
        [teamId, JSON.stringify({ ref: "sprint", language: "en", durationSec: 30, version: "v2" }), userA],
      ),
    );
    const assignmentId = assignment.rows[0].id;

    // Anonymous arbitrary-score insertion is impossible (no insert policy).
    await expectError(
      "anonymous direct completion insert blocked",
      () => asAnon(() =>
        client.query("insert into public.assignment_completions (assignment_id, user_id, score) values ($1,$2,100)", [assignmentId, userB]),
      ),
    );
    await expectError(
      "member cannot direct-insert a completion with score 100 anymore",
      () => asUser(userB, () =>
        client.query("insert into public.assignment_completions (assignment_id, user_id, score) values ($1,$2,100)", [assignmentId, userB]),
      ),
    );

    // Member runs the REAL exercise → evidence → server-derived completion.
    const realAttempt = validEvidence({
      mode: "sprint",
      exercise_id: "assignment:sprint:sprint:en",
      typed_chars: 150,
      correct_chars: 142,
      claimed_wpm: 60,
      claimed_accuracy: 94.7,
    });
    const submitted = await asUser(userB, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [JSON.stringify(realAttempt)]),
    );
    const sOut = submitted.rows[0].r;
    // Classroom attempts are intentionally NON-official exercises: the RPC
    // must PERSIST them (practice), never reject or rank them.
    ok("member attempt persisted through submit_attempt",
      typeof sOut.integrity === "string" && sOut.reason !== "rate_limited" && sOut.reason !== "invalid_evidence",
      JSON.stringify(sOut));
    const done = await asUser(userB, () =>
      client.query("SELECT public.complete_assignment($1,$2) r", [assignmentId, realAttempt.client_id]),
    );
    const expectedScore = Math.round((94.7 * 0.6 + Math.min(60, 100) * 0.4) * 10) / 10;
    ok("completion derives deterministic score from attempt", Number(done.rows[0].r.score) === Number(expectedScore), JSON.stringify(done.rows[0].r));
    const compRow = await client.query(
      "select c.attempt_id, c.wpm, c.accuracy, a.id is not null bound from public.assignment_completions c left join public.attempts a on a.id=c.attempt_id where c.assignment_id=$1 and c.user_id=$2",
      [assignmentId, userB],
    );
    ok("completion references the real attempt row", Boolean(compRow.rows[0]?.bound));
    ok("completion stores derived wpm/accuracy", Number(compRow.rows[0].wpm) === 60 && Number(compRow.rows[0].accuracy) === 94.7);

    // Unrelated attempt (different exercise identity) cannot satisfy it.
    const unrelated = validEvidence({ mode: "sprint", exercise_id: "en-sprint-999" });
    await asUser(userB, () => client.query("SELECT public.submit_attempt($1::jsonb)", [JSON.stringify(unrelated)]));
    await expectError(
      "unrelated attempt cannot satisfy the assignment",
      () => asUser(userB, () => client.query("SELECT public.complete_assignment($1,$2)", [assignmentId, unrelated.client_id])),
      "attempt_mismatch",
    );

    // Mode mismatch: dictation attempt against sprint assignment.
    const wrongMode = validEvidence({
      client_id: crypto.randomUUID(),
      mode: "dictation",
      exercise_id: "assignment:sprint:sprint:en",
      duration_sec: 60,
    });
    await asUser(userB, () => client.query("SELECT public.submit_attempt($1::jsonb)", [JSON.stringify(wrongMode)]));
    await expectError(
      "wrong-mode attempt cannot satisfy the assignment",
      () => asUser(userB, () => client.query("SELECT public.complete_assignment($1,$2)", [assignmentId, wrongMode.client_id])),
      "attempt_mismatch",
    );

    // Unknown attempt id.
    await expectError(
      "missing attempt is rejected (no fabricated completions)",
      () => asUser(userB, () => client.query("SELECT public.complete_assignment($1,'nonexistent-client-id')", [assignmentId])),
      "attempt_not_found",
    );

    // Another user's attempt cannot satisfy MY completion path (owner tries
    // to complete using the member's client_id — lookup is scoped to caller).
    await expectError(
      "another user's attempt cannot satisfy the assignment",
      () => asUser(userA, () => client.query("SELECT public.complete_assignment($1,$2)", [assignmentId, realAttempt.client_id])),
      "attempt_not_found",
    );

    // Non-members cannot complete at all.
    await expectError(
      "non-member cannot submit a completion",
      () => asUser(userC, () => client.query("SELECT public.complete_assignment($1,'whatever')", [assignmentId])),
      "not_a_member",
    );

    // Duplicate completion stays a single row (best-score retention).
    const betterAttempt = validEvidence({
      mode: "sprint",
      exercise_id: "assignment:sprint:sprint:en",
      typed_chars: 180,
      correct_chars: 174,
      claimed_wpm: 72,
      claimed_accuracy: 96.7,
    });
    await asUser(userB, () => client.query("SELECT public.submit_attempt($1::jsonb)", [JSON.stringify(betterAttempt)]));
    await asUser(userB, () => client.query("SELECT public.complete_assignment($1,$2)", [assignmentId, betterAttempt.client_id]));
    const count = await client.query("select count(*) c from public.assignment_completions where assignment_id=$1", [assignmentId]);
    const updated = await client.query("select score, wpm from public.assignment_completions where assignment_id=$1 limit 1", [assignmentId]);
    ok("duplicate completion keeps one row", Number(count.rows[0].c) === 1);
    ok("better retake raises the recorded score deterministically",
      Number(updated.rows[0].score) === Math.round((96.7 * 0.6 + Math.min(72, 100) * 0.4) * 10) / 10);

    // Leaving works correctly (own row only).
    const left = await asUser(userB, () =>
      client.query("delete from public.team_members where team_id=$1 and user_id=$2 returning user_id", [teamId, userB]),
    );
    ok("leaving a team removes own membership", left.rows.length === 1 || Number(left.rowCount) === 1);
    // Rejoin for downstream scenarios.
    await asUser(userB, () => client.query("SELECT public.join_team($1)", ["TESTCODE99"]));
  }

  // 10 — EMPLOYER ASSESSMENT INVITE DEFINITION RESOLUTION (blueprint §8)
  {
    const modules = [
      { kind: "typing-sprint", ref: "sprint", durationSec: 30, label: "Sprint 30s" },
      { kind: "transcription", ref: "trans-en-002", durationSec: 120, label: "Office transcription clip" },
    ];
    const created = await asUser(userA, () =>
      client.query(
        "insert into public.assessments (owner_id, title, modules) values ($1,'Screening A+D',$2::jsonb) returning id, invite_code",
        [userA, JSON.stringify(modules)],
      ),
    );
    const assessmentId = created.rows[0].id;
    const inviteCode = created.rows[0].invite_code;

    // Candidate resolves EXACTLY the saved sequence (order preserved).
    const def = await asAnon(() => client.query("SELECT public.fetch_assessment_definition($1) d", [inviteCode]));
    const gotModules = def.rows[0].d.modules;
    ok("invite resolves saved module count", gotModules.length === 2, JSON.stringify(gotModules));
    ok("invite resolves modules in exact order", gotModules[0].kind === "typing-sprint" && gotModules[1].kind === "transcription");
    ok("definition leaks no owner identity", !("owner_id" in def.rows[0].d) && !("email" in def.rows[0].d));

    await expectError("invalid invite rejected", () =>
      asAnon(() => client.query("SELECT public.fetch_assessment_definition('BOGUS00000')")), "invite_invalid");

    // Expired invite rejected for both definition fetch AND submission.
    const expired = await asUser(userA, () =>
      client.query(
        "insert into public.assessments (owner_id, title, modules, window_hours, created_at) values ($1,'Expired',$2::jsonb,1, now() - interval '3 hours') returning invite_code",
        [userA, JSON.stringify([modules[0]])],
      ),
    );
    await expectError("expired invite rejected on fetch", () =>
      asAnon(() => client.query("SELECT public.fetch_assessment_definition($1)", [expired.rows[0].invite_code])), "invite_expired");
    await expectError("expired invite rejected on submission", () =>
      asAnon(() => client.query("SELECT public.submit_assessment_result($1::jsonb)", [
        JSON.stringify({ invite_code: expired.rows[0].invite_code, candidate_key: "c1", results: { modules: [{ label: "m", kind: "typing-sprint", ref: "sprint", wpm: 40, accuracy: 90 }] } }),
      ])), "invite_invalid_expired_or_revoked");

    // Valid candidate submission persists; duplicates collapse.
    const validModules = [
      { label: "Sprint", kind: "typing-sprint", ref: "sprint", wpm: 55, accuracy: 95 },
      { label: "Trans", kind: "transcription", ref: "trans-en-002", wpm: 35, accuracy: 88 },
    ];
    await asAnon(() => client.query("SELECT public.submit_assessment_result($1::jsonb)", [
      JSON.stringify({ invite_code: inviteCode, candidate_key: "cand-1", results: { modules: validModules } }),
    ]));
    await asAnon(() => client.query("SELECT public.submit_assessment_result($1::jsonb)", [
      JSON.stringify({ invite_code: inviteCode, candidate_key: "cand-1", results: { modules: [{ label: "Sprint", kind: "typing-sprint", ref: "sprint", wpm: 99, accuracy: 99 }, { label: "Trans", kind: "transcription", ref: "trans-en-002", wpm: 40, accuracy: 90 }] } }),
    ]));
    const candRows = await client.query("select count(*) c from public.assessment_results where assessment_id=$1 and candidate_key='cand-1'", [assessmentId]);
    ok("candidate result stored once (idempotent duplicate)", Number(candRows.rows[0].c) === 1);

    // Identity + order binding: swapped module order is REJECTED.
    await expectError("swapped module order rejected", () =>
      asAnon(() => client.query("SELECT public.submit_assessment_result($1::jsonb)", [
        JSON.stringify({ invite_code: inviteCode, candidate_key: "cand-swapped", results: { modules: [validModules[1], validModules[0]] } }),
      ])), "invalid_results");
    // Invented module identity rejected.
    await expectError("module identity substitution rejected", () =>
      asAnon(() => client.query("SELECT public.submit_assessment_result($1::jsonb)", [
        JSON.stringify({ invite_code: inviteCode, candidate_key: "cand-forged", results: { modules: [validModules[0], { label: "Fake", kind: "dictation", ref: "dict-en-001", wpm: 50, accuracy: 90 }] } }),
      ])), "invalid_results");

    await expectError("oversized module metrics rejected", () =>
      asAnon(() => client.query("SELECT public.submit_assessment_result($1::jsonb)", [
        JSON.stringify({ invite_code: inviteCode, candidate_key: "cand-evil", results: { modules: [{ label: "x", wpm: 9999, accuracy: 101 }] } }),
      ])), "invalid_results");
    await expectError("empty module payload rejected", () =>
      asAnon(() => client.query("SELECT public.submit_assessment_result($1::jsonb)", [
        JSON.stringify({ invite_code: inviteCode, candidate_key: "cand-empty", results: { modules: [] } }),
      ])), "invalid_results");

    // Results are private to the owner (RLS): another user AND anonymous
    // callers see nothing.
    const leaked = await asUser(userB, () =>
      client.query("select count(*) c from public.assessment_results where assessment_id=$1", [assessmentId]),
    );
    ok("assessment results invisible to non-owner", Number(leaked.rows[0].c) === 0);
    const anonPeek = await asAnon(() => client.query("select count(*) c from public.assessment_results"));
    ok("anonymous sees zero assessment results", Number(anonPeek.rows[0].c) === 0);
    const ownView = await asUser(userA, () =>
      client.query("select count(*) c from public.assessment_results where assessment_id=$1", [assessmentId]),
    );
    ok("owner still reads own assessment results", Number(ownView.rows[0].c) >= 1);

    // Assessment content has no leaderboard surface (separate table, no path).
    const boardRows = await asAnon(() =>
      client.query("select count(*) c from public.public_leaderboard where id::text in (select id::text from public.assessment_results)"),
    );
    ok("assessment content never reaches public boards", Number(boardRows.rows[0].c) === 0);
  }

  // 11 — MULTIPLAYER HOST AUTHORITY + RESULT VALIDATION (blueprint §9)
  {
    const createdRoom = await asAnon(() => client.query("SELECT public.create_room($1::jsonb) r", [
      JSON.stringify({ host_name: "Host", language: "en", duration_sec: 30 }),
    ]));
    const room = createdRoom.rows[0].r;
    ok("create_room returns code + host token", Boolean(room.code) && Boolean(room.host_token) && room.host_token.length >= 32);
    const storedHash = await client.query("select host_token_hash from public.rooms where code=$1", [room.code]);
    ok("only the token HASH is stored", storedHash.rows[0].host_token_hash !== room.host_token && storedHash.rows[0].host_token_hash.length === 64);

    // Non-host cannot start someone else's room.
    await expectError("random participant cannot start the room", () =>
      asAnon(() => client.query("SELECT public.start_room($1,'forged-token')", [room.code])), "not_host");

    // Finishing before start is impossible.
    await expectError("results cannot arrive while in lobby", () =>
      asAnon(() => client.query("SELECT public.finish_room($1,'p1',$2::jsonb)", [
        room.code, JSON.stringify({ display_name: "p1", typed_chars: 100, correct_chars: 90, elapsed_ms: 30000 }),
      ])), "race_not_running");

    // Host starts.
    await asAnon(() => client.query("SELECT public.start_room($1,$2)", [room.code, room.host_token]));
    const running = await client.query("select state, ends_at from public.rooms where code=$1", [room.code]);
    ok("host token starts the race", running.rows[0].state === "running" && running.rows[0].ends_at !== null);

    // Forged implausible evidence rejected (>220 derived wpm).
    await expectError("forged 250+ WPM evidence rejected", () =>
      asAnon(() => client.query("SELECT public.finish_room($1,'cheater',$2::jsonb)", [
        room.code, JSON.stringify({ display_name: "cheater", typed_chars: 1000, correct_chars: 950, elapsed_ms: 5000 }),
      ])), "implausible_result");

    // Structurally invalid evidence rejected.
    await expectError("negative counts rejected", () =>
      asAnon(() => client.query("SELECT public.finish_room($1,'p0',$2::jsonb)", [
        room.code, JSON.stringify({ display_name: "p0", typed_chars: -5, correct_chars: 0, elapsed_ms: 30000 }),
      ])), "invalid_evidence");
    await expectError("correct > typed invariant enforced", () =>
      asAnon(() => client.query("SELECT public.finish_room($1,'p0b',$2::jsonb)", [
        room.code, JSON.stringify({ display_name: "p0b", typed_chars: 10, correct_chars: 900, elapsed_ms: 30000 }),
      ])), "invalid_evidence");

    // Honest evidence accepted and RECOMPUTED server-side.
    const finish = await asAnon(() => client.query("SELECT public.finish_room($1,'player-a',$2::jsonb) r", [
      room.code, JSON.stringify({ display_name: "Player A", typed_chars: 150, correct_chars: 142, elapsed_ms: 30000 }),
    ]));
    ok("valid evidence accepted", finish.rows[0].r.accepted === true);
    ok("wpm recomputed server-side from counts", Number(finish.rows[0].r.wpm) === 60, JSON.stringify(finish.rows[0].r));
    ok("accuracy recomputed server-side from counts", Number(finish.rows[0].r.accuracy) === 94.7);

    // Duplicate finish collapses onto the same row.
    const dupFinish = await asAnon(() => client.query("SELECT public.finish_room($1,'player-a',$2::jsonb) r", [
      room.code, JSON.stringify({ display_name: "Player A", typed_chars: 120, correct_chars: 110, elapsed_ms: 25000 }),
    ]));
    ok("duplicate finish reported as duplicate", dupFinish.rows[0].r.duplicate === true);
    const dupCount = await client.query("select count(*) c from public.room_results where room_code=$1 and player_key='player-a'", [room.code]);
    ok("duplicate finish does not duplicate rows", Number(dupCount.rows[0].c) === 1);

    // Closed window rejects late submissions.
    await client.query("update public.rooms set ends_at = now() - interval '60 seconds' where code=$1", [room.code]);
    await expectError("late finish after window close rejected", () =>
      asAnon(() => client.query("SELECT public.finish_room($1,'late-player',$2::jsonb)", [
        room.code, JSON.stringify({ display_name: "late", typed_chars: 100, correct_chars: 90, elapsed_ms: 20000 }),
      ])), "race_window_closed");
    await client.query("update public.rooms set ends_at = now() + interval '20 seconds' where code=$1", [room.code]);

    // Rematch authority: host-only restart clears state + results.
    await expectError("non-host cannot rematch", () =>
      asAnon(() => client.query("SELECT public.restart_room($1,'bad-token')", [room.code])), "not_host");
    await asAnon(() => client.query("SELECT public.restart_room($1,$2)", [room.code, room.host_token]));
    const restarted = await client.query("select state from public.rooms where code=$1", [room.code]);
    const cleared = await client.query("select count(*) c from public.room_results where room_code=$1", [room.code]);
    ok("host rematch resets room to lobby", restarted.rows[0].state === "lobby");
    ok("host rematch clears prior results", Number(cleared.rows[0].c) === 0);
  }

  // 12 — ACCOUNT DELETION CASCades THROUGH OWNED TEAMS
  {
    const doomed = await createUser("doomed@test.local");
    const dt = await asUser(doomed, () => client.query("SELECT public.create_team('Doomed Team') t"));
    await asUser(doomed, () => client.query("SELECT public.delete_my_account()"));
    const gone = await client.query("select count(*) c from public.teams where id=$1", [dt.rows[0].t.id]);
    const ghost = await client.query("select count(*) c from auth.users where id=$1", [doomed]);
    ok("deletion cascades owned teams + auth user", Number(gone.rows[0].c) === 0 && Number(ghost.rows[0].c) === 0);
  }

  // 13 — ATTEMPTS WRITE-PATH CLOSURE (release-blocking; blueprint §28)
  {
    // Exact §28 forgery: direct insert claiming ranked + accepted.
    await expectError(
      "authenticated FORGED RANKED direct insert DENIED",
      () => asUser(userB, () =>
        client.query(
          "insert into public.attempts (user_id, exercise_id, exercise_version, scoring_version, mode, language, duration_sec, elapsed_ms, typed_chars, wpm, accuracy, integrity, ranked_accepted) values ($1,'sprint-en-30-1','v3','v2.0.0','sprint','en',30,30000,150,220,100,'ranked',true)",
          [userB],
        ),
      ),
    );
    await expectError(
      "authenticated practice direct insert DENIED (RPC is the only write path)",
      () => asUser(userB, () =>
        client.query(
          "insert into public.attempts (user_id, exercise_id, exercise_version, scoring_version, mode, language, duration_sec, elapsed_ms, typed_chars, wpm, accuracy, integrity) values ($1,'sprint-en-30-1','v3','v2.0.0','sprint','en',30,30000,150,60,95,'practice')",
          [userB],
        ),
      ),
    );
    const anyAttempt = await client.query("select id, integrity, ranked_accepted from public.attempts where user_id=$1 limit 1", [userB]);
    if (anyAttempt.rows.length > 0) {
      const before = anyAttempt.rows[0];
      // UPDATE is revoked at the GRANT layer (authoritative columns are
      // RPC-only), so the mutation is denied outright.
      await expectError(
        "owner cannot UPDATE attempt into ranked state",
        () => asUser(userB, () =>
          client.query("update public.attempts set integrity='ranked', ranked_accepted=true where id=$1", [before.id]),
        ),
      );
      const after = await client.query("select integrity, ranked_accepted from public.attempts where id=$1", [before.id]);
      ok("attempt row unchanged after denied mutation",
        after.rows[0].integrity === before.integrity
        && Boolean(after.rows[0].ranked_accepted) === Boolean(before.ranked_accepted),
        JSON.stringify({ before, after: after.rows[0] }));
    }
    // Owner history read still works.
    const mine = await asUser(userB, () =>
      client.query("select count(*) c from public.attempts where user_id=$1", [userB]),
    );
    ok("owner still reads private attempt history", Number(mine.rows[0].c) >= 1);
    // Authoritative RPC still inserts correctly after the lock-down.
    const rpcStill = await asUser(userB, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [JSON.stringify(validEvidence())]),
    );
    ok("submit_attempt still persists through RPC",
      rpcStill.rows[0].r.accepted === true || rpcStill.rows[0].r.duplicate === true,
      JSON.stringify(rpcStill.rows[0].r));
  }

  // 14 — OFFICIAL RANKED EXERCISE BINDING
  {
    const unofficial = validEvidence({ exercise_id: "friend-ABC123XYZ" });
    const out = await asUser(userA, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [JSON.stringify(unofficial)]),
    );
    const r = out.rows[0].r;
    ok("non-official exercise demoted to practice", r.accepted === false && r.integrity === "practice" && (r.reasons ?? []).includes("unofficial_exercise"), JSON.stringify(r));
    const visible = await client.query(
      "select count(*) c from public.public_leaderboard lb join attempts a on a.id=lb.id where a.client_id=$1",
      [unofficial.client_id],
    );
    ok("demoted entry invisible on public board", Number(visible.rows[0].c) === 0);

    // Live product family ids rank.
    const liveFamily = validEvidence({ exercise_id: "sprint-en-30-7" });
    const liveOut = await asUser(userA, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [JSON.stringify(liveFamily)]),
    );
    ok("live product exercise family ranks", liveOut.rows[0].r.accepted === true, JSON.stringify(liveOut.rows[0].r));

    // Career content can never rank by policy.
    const careerTry = validEvidence({ mode: "career", exercise_id: "career-data-entry-0", duration_sec: 30 });
    const careerOut = await asUser(userA, () =>
      client.query("SELECT public.submit_attempt($1::jsonb) r", [JSON.stringify(careerTry)]),
    );
    ok("career mode forced to practice", careerOut.rows[0].r.integrity === "practice" && careerOut.rows[0].r.accepted === false, JSON.stringify(careerOut.rows[0].r));

    // migrate_local_history imports stay unranked and are derived server-side.
    const imported = await asUser(userC, () =>
      client.query("SELECT public.migrate_local_history($1::jsonb) n", [
        JSON.stringify([{
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
        }]),
      ]),
    );
    ok("history import via RPC succeeds", Number(imported.rows[0].n) === 1);
    const impRow = await client.query(
      "select a.integrity, a.ranked_accepted, a.wpm from public.attempts a join auth.users u on u.id=a.user_id where u.email='user-c@test.local' order by a.created_at desc limit 1",
    );
    ok("imported rows forced practice/unranked with derived wpm",
      impRow.rows[0].integrity === "practice" && impRow.rows[0].ranked_accepted === false && Number(impRow.rows[0].wpm) === 60);
  }

  // 15 — FRIEND CHALLENGE RESULT TRUST
  {
    const chId = "FRIENDTEST01";
    await client.query(
      "insert into public.friend_challenges (id, creator_name, payload) values ($1,'creator',$2::jsonb)",
      [chId, JSON.stringify({ exerciseId: "sprint-en-30-1", language: "en", mode: "sprint", durationSec: 30, createdAt: Date.now() })],
    );
    const fr = await asAnon(() =>
      client.query("SELECT public.submit_friend_result($1,$2::jsonb) r", [
        chId,
        JSON.stringify({ display_name: "guest!!", typed_chars: 150, correct_chars: 142, elapsed_ms: 30000 }),
      ]),
    );
    ok("friend result derived server-side from evidence", Number(fr.rows[0].r.wpm) === 60, JSON.stringify(fr.rows[0].r));
    const storedName = await client.query("select display_name from public.friend_challenge_results where challenge_id=$1", [chId]);
    ok("display name sanitized", storedName.rows[0].display_name === "guest", storedName.rows[0].display_name);
    await expectError("direct friend-result insert DENIED (RPC only)", () =>
      asAnon(() => client.query(
        "insert into public.friend_challenge_results (challenge_id, display_name, wpm, accuracy) values ($1,'cheater',300,100)",
        [chId],
      )),
    );
    await expectError("friend result for unknown/expired challenge rejected", () =>
      asAnon(() => client.query("SELECT public.submit_friend_result($1,$2::jsonb)", [
        "NOPECHALLX", JSON.stringify({ display_name: "x", claimed_wpm: 50, claimed_accuracy: 90 }),
      ])), "challenge_not_found_or_expired");
  }

  // 16 — ASSESSMENT INVITE LIFECYCLE (open/revoked/expired)
  {
    const mkAssessment = async (over = {}) =>
      (await asUser(userA, () =>
        client.query(
          "insert into public.assessments (owner_id, title, modules, opens_at, revoked) values ($1,$2,$3::jsonb,$4,$5) returning id, invite_code",
          [userA, over.title ?? "Lifecycle", JSON.stringify(over.modules ?? [{ kind: "typing-sprint", ref: "sprint", durationSec: 30, label: "Sprint 30s" }]), over.opensAt ?? null, over.revoked ?? false],
        ),
      )).rows[0];

    const notOpen = await mkAssessment({ opensAt: new Date(Date.now() + 3600_000).toISOString() });
    await expectError("future-dated invite reports not_open", () =>
      asAnon(() => client.query("SELECT public.fetch_assessment_definition($1)", [notOpen.invite_code])), "invite_not_open");

    const revocable = await mkAssessment();
    await expectError("revoke by non-owner DENIED", () =>
      asUser(userB, () => client.query("SELECT public.revoke_assessment_invite($1)", [revocable.id])), "not_found_or_not_owner");
    await asUser(userA, () => client.query("SELECT public.revoke_assessment_invite($1)", [revocable.id]));
    await expectError("revoked invite rejected on fetch", () =>
      asAnon(() => client.query("SELECT public.fetch_assessment_definition($1)", [revocable.invite_code])), "invite_revoked");
    await expectError("revoked invite rejected on submission", () =>
      asAnon(() => client.query("SELECT public.submit_assessment_result($1::jsonb)", [
        JSON.stringify({ invite_code: revocable.invite_code, candidate_key: "cx", results: { modules: [{ label: "m", wpm: 40, accuracy: 90 }] } }),
      ])), "invite_invalid_expired_or_revoked");
  }

  // 17 — TEAM ADMIN PERMISSIONS
  {
    // member cannot publish assignments…
    await expectError("member cannot mutate assignments", () =>
      asUser(userB, () =>
        client.query(
          "insert into public.assignments (team_id, title, kind, created_by) values ($1,'Member Sneak','sprint',$2)",
          [teamId, userB],
        ),
      ),
    );
    // …but an admin can.
    await client.query("update public.team_members set role='admin' where team_id=$1 and user_id=$2", [teamId, userB]);
    const adminPub = await asUser(userB, () =>
      client.query(
        "insert into public.assignments (team_id, title, kind, created_by) values ($1,'Admin Week','sprint',$2) returning id",
        [teamId, userB],
      ),
    );
    ok("admin can publish assignments", Boolean(adminPub.rows[0].id));
    // Self-promotion / ownership seizure blocked: UPDATE on team_members is
    // revoked outright; teams UPDATE exists only for the owner policy.
    await expectError("admin cannot self-promote to owner via team_members UPDATE", () =>
      asUser(userB, () =>
        client.query("update public.team_members set role='owner' where team_id=$1 and user_id=$2", [teamId, userB]),
      ),
    );
    const roleAfter = await client.query("select role from public.team_members where team_id=$1 and user_id=$2", [teamId, userB]);
    ok("role remains admin after denied promotion", roleAfter.rows[0].role === "admin");
    // Owner-only UPDATE → non-owner affects 0 rows (RLS silent deny).
    const seize = await asUser(userB, () =>
      client.query("update public.teams set owner_id=$1 where id=$2", [userB, teamId]),
    );
    const ownerAfter = await client.query("select owner_id from public.teams where id=$1", [teamId]);
    ok("ownership unchanged after denied seizure", Number(seize.rowCount) === 0 && String(ownerAfter.rows[0].owner_id) === String(userA));
    // Owner can remove a member/admin directly (kick power preserved).
    const kicked = await asUser(userA, () =>
      client.query("delete from public.team_members where team_id=$1 and user_id=$2 returning user_id", [teamId, userB]),
    );
    ok("owner can remove members", kicked.rowCount === 1 || kicked.rows.length === 1);
    // Restore B's membership for any downstream readers.
    await asUser(userB, () => client.query("SELECT public.join_team('TESTCODE99')"));
    // REGRESSION (pass V): authenticated roster reads must not hit
    // 'infinite recursion detected in policy' (self-referencing 0002 policy).
    const roster = await asUser(userB, () =>
      client.query("select count(*) c from public.team_members where team_id=$1", [teamId]),
    );
    ok("member can read team roster without RLS recursion", Number(roster.rows[0].c) >= 2, JSON.stringify(roster.rows[0]));
    // REGRESSION (pass V): browser roles cannot touch rate-limit buckets.
    const denied = await asUser(userB, () => {
      return client
        .query("begin")
        .then(() =>
          client.query("SET LOCAL ROLE authenticated").then(() =>
            client.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userB, role: "authenticated" })]).then(async () => {
              let blocked = false;
              try {
                await client.query("delete from public.rate_limits");
              } catch {
                blocked = true;
              }
              await client.query("ROLLBACK").catch(() => undefined);
              return blocked;
            }),
          ),
        );
    });
    ok("rate_limits are locked away from browser roles", denied === true);
  }

  // 18 — CAREER ASSIGNMENTS + ROOM CANCELLATION (closure pass IV)
  {
    // Career assignment: full track binds via canonical 'career:{trackId}'.
    const careerAssignment = await asUser(userA, () =>
      client.query(
        "insert into public.assignments (team_id, title, kind, payload, created_by) values ($1,'Q3 career screen','career',$2::jsonb,$3) returning id",
        [teamId, JSON.stringify({ ref: "data-entry", version: "v2" }), userA],
      ),
    );
    const careerId = careerAssignment.rows[0].id;
    const careerAttempt = validEvidence({
      mode: "career",
      exercise_id: "career:data-entry",
      duration_sec: 90,
      elapsed_ms: 90000,
      typed_chars: 200,
      correct_chars: 180,
      claimed_wpm: 44,
      claimed_accuracy: 90,
    });
    await asUser(userB, () => client.query("SELECT public.submit_attempt($1::jsonb)", [JSON.stringify(careerAttempt)]));
    const careerDone = await asUser(userB, () =>
      client.query("SELECT public.complete_assignment($1,$2) r", [careerId, careerAttempt.client_id]),
    );
    // Server derives wpm=26.7 (typed 200 over 90s), acc=90 → score formula.
    ok("career assignment completes from real track attempt",
      Number(careerDone.rows[0].r.score) === Math.round((90 * 0.6 + Math.min(26.7, 100) * 0.4) * 10) / 10,
      JSON.stringify(careerDone.rows[0].r));

    // Wrong track identity cannot satisfy the assignment.
    const wrongTrack = validEvidence({
      mode: "career",
      exercise_id: "career:punctuation",
      duration_sec: 60,
      elapsed_ms: 60000,
      typed_chars: 120,
      correct_chars: 110,
      claimed_wpm: 40,
      claimed_accuracy: 91,
    });
    await asUser(userB, () => client.query("SELECT public.submit_attempt($1::jsonb)", [JSON.stringify(wrongTrack)]));
    await expectError(
      "wrong-track career attempt rejected",
      () => asUser(userB, () => client.query("SELECT public.complete_assignment($1,$2)", [careerId, wrongTrack.client_id])),
      "attempt_mismatch",
    );

    // Room cancellation: host-only, blocks further finishes.
    const createdRoom = await asAnon(() => client.query("SELECT public.create_room($1::jsonb) r", [
      JSON.stringify({ host_name: "HostIV", language: "en", duration_sec: 30 }),
    ]));
    const room = createdRoom.rows[0].r;
    await asAnon(() => client.query("SELECT public.start_room($1,$2)", [room.code, room.host_token]));
    await expectError("non-host cannot cancel a room", () =>
      asAnon(() => client.query("SELECT public.close_room($1,'forged')", [room.code])), "not_host");
    await asAnon(() => client.query("SELECT public.close_room($1,$2)", [room.code, room.host_token]));
    const cancelledState = await client.query("select state, ends_at from public.rooms where code=$1", [room.code]);
    ok("host cancellation marks room finished", cancelledState.rows[0].state === "finished" && cancelledState.rows[0].ends_at !== null);
    await expectError("finish after cancellation rejected (race not running)", () =>
      asAnon(() => client.query("SELECT public.finish_room($1,'p9',$2::jsonb)", [
        room.code, JSON.stringify({ display_name: "p9", typed_chars: 100, correct_chars: 90, elapsed_ms: 20000 }),
      ])), "race_not_running");
    // Idempotent re-cancel is safe.
    await asAnon(() => client.query("SELECT public.close_room($1,$2)", [room.code, room.host_token]));
    ok("re-cancellation is idempotent",
      (await client.query("select state from public.rooms where code=$1", [room.code])).rows[0].state === "finished");
  }
} finally {
  await client.end().catch(() => undefined);
}

console.log(`\ndb-integration: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
