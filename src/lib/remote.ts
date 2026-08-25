"use client";
// Shared-product backend adapter (Supabase/Postgres, see ADR-001).
//
// Architecture decision: static-export frontend + Supabase direct client
// operations guarded by Row Level Security. This preserves cheap static hosting
// while making leaderboards / daily boards / friend challenges genuinely
// multi-user. Server-side validation lives in the SQL migration (constraints +
// views + policies), because client-side checks alone are not security.
//
// Every function throws RemoteUnavailableError when the backend is not
// configured — callers MUST degrade honestly (show a setup notice, keep local
// practice working). No fake rows are ever substituted.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { IS_REMOTE_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import type { IntegrityState, Language, Mode } from "./types";

export class RemoteUnavailableError extends Error {
  constructor() {
    super("Shared competition backend is not configured");
    this.name = "RemoteUnavailableError";
  }
}

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  if (!IS_REMOTE_CONFIGURED) throw new RemoteUnavailableError();
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

// ---------------------------------------------------------------------------
// Types mirroring the SQL schema
// ---------------------------------------------------------------------------

export interface PublicLeaderboardRow {
  id: string;
  user_id: string;
  username: string | null;
  mode: Mode;
  language: Language;
  duration_sec: number;
  wpm: number;
  accuracy: number;
  scored_at: string;
}

export interface DailyBoardRow {
  id: string;
  user_id: string;
  username: string | null;
  wpm: number;
  accuracy: number;
  scored_at: string;
}

export interface FriendChallengeRecord {
  id: string;
  creator_name: string;
  challenge_version: string;
  payload: {
    exerciseId: string;
    language: Language;
    mode: Mode;
    durationSec: number;
    createdAt: number;
  };
  expires_at: string | null;
}

export interface FriendChallengeResultRow {
  id: string;
  challenge_id: string;
  display_name: string;
  wpm: number;
  accuracy: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export async function fetchLeaderboard(opts: {
  mode?: Mode;
  language?: Language;
  durationSec?: number;
  limit?: number;
}): Promise<PublicLeaderboardRow[]> {
  let query = getClient()
    .from("public_leaderboard")
    .select("id,user_id,username,mode,language,duration_sec,wpm,accuracy,scored_at")
    .order("wpm", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.mode) query = query.eq("mode", opts.mode);
  if (opts.language) query = query.eq("language", opts.language);
  if (opts.durationSec) query = query.eq("duration_sec", opts.durationSec);
  const { data, error } = await query;
  if (error) throw new Error(`Leaderboard query failed: ${error.message}`);
  return (data ?? []) as PublicLeaderboardRow[];
}

export async function fetchMyBestRank(): Promise<number | null> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) return null;
  // Rank of the user's best ranked WPM within sprint/30s/en as a canonical board.
  const { data, error } = await c.rpc("my_best_rank", { p_user: userData.user.id });
  if (error) throw new Error(`Rank query failed: ${error.message}`);
  return typeof data === "number" ? data : null;
}

// ---------------------------------------------------------------------------
// Daily Arena
// ---------------------------------------------------------------------------

export async function fetchDailyBoard(challengeDate: string): Promise<DailyBoardRow[]> {
  const { data, error } = await getClient()
    .from("public_daily_board")
    .select("id,user_id,username,wpm,accuracy,scored_at")
    .eq("challenge_date", challengeDate)
    .order("wpm", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Daily board query failed: ${error.message}`);
  return (data ?? []) as DailyBoardRow[];
}

export interface SubmitAttemptPayload {
  clientId: string;
  exerciseId: string;
  exerciseVersion: string;
  scoringVersion: string;
  normalizationVersion?: string;
  mode: Mode;
  language: Language;
  durationSec: number;
  elapsedMs: number;
  typedChars: number;
  correctChars?: number;
  uncorrectedErrors?: number;
  focusLostCount?: number;
  pasteFlag?: boolean;
  burstFlag?: boolean;
  claimedWpm?: number;
  claimedAccuracy?: number;
  integrity: IntegrityState;
  challengeDate?: string;
  challengeVersion?: string;
  metrics?: Record<string, unknown>;
}

export interface SubmitResponse {
  accepted?: boolean;
  integrity?: string;
  wpm?: number;
  accuracy?: number;
  reason?: string;
  reasons?: string[];
}

/** Persist an attempt THROUGH THE SERVER-AUTHORITATIVE RPC.
 *  The database recomputes wpm/accuracy from evidence and decides
 *  integrity/ranked itself; the client's claim is advisory only. */
export async function submitAttempt(p: SubmitAttemptPayload): Promise<SubmitResponse> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in to save attempts to the shared arena");
  const { data, error } = await c.rpc("submit_attempt", { p: p as unknown as Record<string, unknown> });
  if (error) throw new Error(`Attempt rejected: ${error.message}`);
  return (data ?? {}) as SubmitResponse;
}

/** Fetch the signed-in user's complete attempt history (any integrity),
 *  newest first, auto-paginated. Used for cross-device hydration. */
export async function fetchMyAttempts(pageSize = 200): Promise<Array<Record<string, unknown>>> {
  const c = getClient();
  const all: Array<Record<string, unknown>> = [];
  let from = 0;
  for (;;) {
    const { data, error } = await c
      .from("attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`History fetch failed: ${error.message}`);
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/** Complete account deletion: product data AND the auth user itself. */
export async function deleteMyAccount(): Promise<void> {
  const c = getClient();
  const { data } = await c.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  const { error } = await c.rpc("delete_my_account");
  if (error) throw new Error(error.message);
  await signOutUser();
}

// ---------------------------------------------------------------------------
// Friend challenges
// ---------------------------------------------------------------------------

export async function createFriendChallenge(p: {
  creatorName: string;
  payload: FriendChallengeRecord["payload"];
}): Promise<string> {
  const id = generateChallengeId();
  const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const { error } = await getClient().from("friend_challenges").insert({
    id,
    creator_name: p.creatorName.slice(0, 24),
    challenge_version: p.payload.createdAt ? "v2" : "v2",
    payload: p.payload,
    expires_at: expiresAt,
  });
  if (error) throw new Error(`Challenge creation failed: ${error.message}`);
  return id;
}

export async function fetchFriendChallenge(id: string): Promise<FriendChallengeRecord> {
  const { data, error } = await getClient()
    .from("friend_challenges")
    .select("id,creator_name,challenge_version,payload,expires_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Challenge lookup failed: ${error.message}`);
  if (!data) throw new Error(`Challenge ${id} not found`);
  return data as unknown as FriendChallengeRecord;
}

export async function submitFriendResult(
  challengeId: string,
  p: { displayName: string; wpm: number; accuracy: number },
): Promise<void> {
  const { error } = await getClient().from("friend_challenge_results").insert({
    challenge_id: challengeId,
    display_name: p.displayName.slice(0, 24),
    wpm: p.wpm,
    accuracy: p.accuracy,
  });
  if (error) throw new Error(`Result submission failed: ${error.message}`);
}

export async function fetchFriendResults(challengeId: string): Promise<FriendChallengeResultRow[]> {
  const { data, error } = await getClient()
    .from("friend_challenge_results")
    .select("id,challenge_id,display_name,wpm,accuracy,created_at")
    .eq("challenge_id", challengeId)
    .order("wpm", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Results lookup failed: ${error.message}`);
  return (data ?? []) as FriendChallengeResultRow[];
}

/** UnGuessable-enough share ids: Crockford-ish base32, 10 chars (~1e15 space). */
function generateChallengeId(): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = new Uint8Array(10);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

// ---------------------------------------------------------------------------
// Auth (optional accounts — anonymous-first product)
// ---------------------------------------------------------------------------

export async function signInWithEmail(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await getClient().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  if (error) throw new Error(error.message);
}

export async function signOutUser(): Promise<void> {
  const { error } = await getClient().auth.signOut();
  if (error) throw new Error(error.message);
}

export interface AccountUser {
  id: string;
  email: string | null;
  username: string | null;
}

export async function getCurrentUser(): Promise<AccountUser | null> {
  if (!IS_REMOTE_CONFIGURED || typeof window === "undefined") return null;
  const c = getClient();
  const { data } = await c.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await c.from("profiles").select("username").eq("id", data.user.id).maybeSingle();
  return { id: data.user.id, email: data.user.email ?? null, username: (profile as { username: string } | null)?.username ?? null };
}

export function onAuthChange(cb: (user: AccountUser | null) => void): () => void {
  if (!IS_REMOTE_CONFIGURED || typeof window === "undefined") return () => undefined;
  const c = getClient();
  void getCurrentUser().then(cb);
  const sub = c.auth.onAuthStateChange(() => {
    void getCurrentUser().then(cb);
  });
  return () => sub.data.subscription.unsubscribe();
}

export async function updateUsername(username: string): Promise<void> {
  const c = getClient();
  const { data } = await c.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  const { error } = await c
    .from("profiles")
    .upsert({ id: data.user.id, username: username.slice(0, 24) }, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

/** Push local anonymous history to the signed-in account (one-shot migration).
 *  Full result objects travel in `metrics` for lossless cross-device hydration.
 *  Server-side unique(user_id, client_id) makes this idempotent. */
export async function migrateLocalHistory(
  items: Array<SubmitAttemptPayload>,
): Promise<{ migrated: number }> {
  const c = getClient();
  const { data } = await c.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  const rows = items.map((p) => ({
    user_id: data.user.id,
    client_id: p.clientId,
    exercise_id: p.exerciseId,
    exercise_version: p.exerciseVersion,
    scoring_version: p.scoringVersion,
    normalization_version: p.normalizationVersion ?? null,
    mode: p.mode,
    language: p.language,
    duration_sec: p.durationSec,
    elapsed_ms: Math.round(p.elapsedMs),
    typed_chars: Math.max(0, Math.min(20000, p.typedChars ?? 0)),
    uncorrected_errors: Math.max(0, p.uncorrectedErrors ?? 0),
    wpm: Math.max(0, Math.min(300, p.claimedWpm ?? 0)),
    accuracy: Math.max(0, Math.min(100, p.claimedAccuracy ?? 0)),
    integrity: (p.integrity === "flagged" ? "flagged" : "practice") as string,
    challenge_date: p.challengeDate ?? null,
    challenge_version: p.challengeVersion ?? null,
    ranked_accepted: false,
    metrics: (p.metrics ?? {}) as Record<string, unknown>,
  }));
  let migrated = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const { error } = await c.from("attempts").insert(chunk);
    if (error) {
      if (chunk.length === 1 && error.code === "23505") {
        migrated++;
        continue;
      }
      for (const row of chunk) {
        const { error: e2 } = await c.from("attempts").insert(row);
        if (!e2 || e2.code === "23505") migrated++;
        else throw new Error(`Migration failed: ${e2.message}`);
      }
      continue;
    }
    migrated += chunk.length;
  }
  return { migrated };
}

// ---------------------------------------------------------------------------
// Teams / classrooms
// ---------------------------------------------------------------------------

export interface TeamRecord {
  id: string;
  name: string;
  join_code: string;
  owner_id: string;
}

export async function createTeam(name: string): Promise<TeamRecord> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in first");
  const { data, error } = await c
    .from("teams")
    .insert({ name: name.slice(0, 60), owner_id: userData.user.id })
    .select("id,name,join_code,owner_id")
    .single();
  if (error) throw new Error(error.message);
  await c.from("team_members").insert({ team_id: (data as TeamRecord).id, user_id: userData.user.id, role: "owner" });
  return data as TeamRecord;
}

export async function joinTeamByCode(code: string): Promise<string> {
  const { data, error } = await getClient().rpc("join_team", { p_code: code.trim().toUpperCase() });
  if (error) throw new Error(error.message.includes("team_not_found") ? "Team code not found" : error.message);
  return String(data);
}

export async function fetchMyTeams(): Promise<Array<TeamRecord & { role: string }>> {
  const c = getClient();
  const memberships = await c.from("team_members").select("team_id,role");
  if (memberships.error) throw new Error(memberships.error.message);
  const rows = ((memberships.data ?? []) as Array<{ team_id: string; role: string }>);
  if (rows.length === 0) return [];
  const ids = rows.map((m) => m.team_id);
  const teams = await c.from("teams").select("id,name,join_code,owner_id").in("id", ids);
  if (teams.error) throw new Error(teams.error.message);
  const roleById = new Map(rows.map((m) => [m.team_id, m.role]));
  return ((teams.data ?? []) as TeamRecord[]).map((t) => ({ ...t, role: roleById.get(t.id) ?? "member" }));
}

export async function leaveTeam(teamId: string): Promise<void> {
  const { error } = await getClient().from("team_members").delete().match({ team_id: teamId });
  if (error) throw new Error(error.message);
}

export async function deleteTeamAsOwner(teamId: string): Promise<void> {
  const { error } = await getClient().from("teams").delete().eq("id", teamId);
  if (error) throw new Error(error.message);
}

export interface AssignmentRecord {
  id: string;
  title: string;
  kind: string;
  payload: Record<string, unknown>;
  due_at: string | null;
}

export async function createAssignment(teamId: string, p: { title: string; kind: string; payload?: Record<string, unknown>; dueAt?: string }): Promise<void> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in first");
  const { error } = await c.from("assignments").insert({
    team_id: teamId,
    title: p.title.slice(0, 80),
    kind: p.kind,
    payload: p.payload ?? {},
    due_at: p.dueAt ?? null,
    created_by: userData.user.id,
  });
  if (error) throw new Error(error.message);
}

export async function fetchAssignments(teamId: string): Promise<AssignmentRecord[]> {
  const { data, error } = await getClient()
    .from("assignments")
    .select("id,title,kind,payload,due_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as AssignmentRecord[];
}

export async function completeAssignment(assignmentId: string, score: number, attemptId?: string): Promise<void> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in first");
  const { error } = await c.from("assignment_completions").upsert(
    { assignment_id: assignmentId, user_id: userData.user.id, score, attempt_id: attemptId ?? null },
    { onConflict: "assignment_id,user_id" },
  );
  if (error) throw new Error(error.message);
}

/** Aggregate completion rows for a team's assignments (dashboard view). */
export async function fetchTeamCompletions(teamId: string): Promise<Array<{ assignment_id: string; user_id: string; username: string | null; score: number; completed_at: string }>> {
  const c = getClient();
  const assignments = await fetchAssignments(teamId);
  if (assignments.length === 0) return [];
  const ids = assignments.map((a) => a.id);
  const { data, error } = await c
    .from("assignment_completions")
    .select("assignment_id,user_id,score,completed_at")
    .in("assignment_id", ids)
    .limit(1000);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ assignment_id: string; user_id: string; score: number; completed_at: string }>;
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  let names = new Map<string, string>();
  if (userIds.length > 0) {
    const prof = await c.from("public_profiles").select("id,username").in("id", userIds);
    if (!prof.error) names = new Map(((prof.data ?? []) as Array<{ id: string; username: string | null }>).map((p) => [p.id, p.username ?? "member"]));
  }
  return rows.map((r) => ({ ...r, username: names.get(r.user_id) ?? "member" }));
}

// ---------------------------------------------------------------------------
// Custom tests
// ---------------------------------------------------------------------------

export interface CustomTestRecord {
  id: string;
  owner_id: string | null;
  title: string;
  language: Language;
  body: string;
  visibility: "private" | "unlisted";
}

export async function createCustomTest(p: { title: string; language: Language; body: string; visibility: "private" | "unlisted" }): Promise<string> {
  const { data, error } = await getClient().rpc("create_custom_test", { p: p as unknown as Record<string, unknown> });
  if (error) throw new Error(error.message.includes("sign_in") ? "Sign in to create custom tests" : error.message);
  return String(data);
}

export async function fetchCustomTest(id: string): Promise<CustomTestRecord> {
  const { data, error } = await getClient()
    .from("custom_tests")
    .select("id,owner_id,title,language,body,visibility")
    .eq("id", id.toUpperCase())
    .maybeSingle();
  if (error || !data) throw new Error("Custom test not found or expired");
  return data as CustomTestRecord;
}

export async function fetchMyCustomTests(): Promise<CustomTestRecord[]> {
  const { data, error } = await getClient()
    .from("custom_tests")
    .select("id,owner_id,title,language,body,visibility")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as CustomTestRecord[];
}

// ---------------------------------------------------------------------------
// Multiplayer rooms
// ---------------------------------------------------------------------------

export interface RoomRecord {
  code: string;
  host_name: string;
  state: "lobby" | "running" | "finished";
  exercise_kind: string;
  language: Language;
  duration_sec: number;
  stream_seed: string;
  ends_at: string | null;
}

export async function createRoom(p: { hostName: string; language: Language; durationSec: number }): Promise<string> {
  const { data, error } = await getClient().rpc("create_room", {
    p: { host_name: p.hostName, language: p.language, duration_sec: p.durationSec },
  });
  if (error) throw new Error(error.message.includes("rate_limited") ? "Too many rooms created — try later" : error.message);
  return String(data);
}

export async function fetchRoom(code: string): Promise<RoomRecord> {
  const { data, error } = await getClient().from("rooms").select("*").eq("code", code.toUpperCase()).maybeSingle();
  if (error || !data) throw new Error("Room not found or expired");
  return data as RoomRecord;
}

export async function startRoom(code: string, playerKey: string): Promise<void> {
  const { error } = await getClient().rpc("start_room", { p_code: code.toUpperCase(), p_player_key: playerKey });
  if (error) throw new Error(error.message.includes("already_started") ? "Race already started" : error.message);
}

export async function finishRoom(code: string, playerKey: string, p: { displayName: string; wpm: number; accuracy: number }): Promise<void> {
  const { error } = await getClient().rpc("finish_room", {
    p_code: code.toUpperCase(),
    p_player_key: playerKey,
    p: { display_name: p.displayName, claimed_wpm: p.wpm, claimed_accuracy: p.accuracy },
  });
  if (error) throw new Error(error.message);
}

export interface RoomResultRow {
  player_key: string;
  display_name: string;
  wpm: number;
  accuracy: number;
}

export async function fetchRoomResults(code: string): Promise<RoomResultRow[]> {
  const { data, error } = await getClient()
    .from("room_results")
    .select("player_key,display_name,wpm,accuracy")
    .eq("room_code", code.toUpperCase())
    .order("wpm", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RoomResultRow[];
}

// ---------------------------------------------------------------------------
// Employer assessments
// ---------------------------------------------------------------------------

export interface AssessmentRecord {
  id: string;
  title: string;
  modules: Array<{ kind: string; ref: string; durationSec?: number; label: string }>;
  invite_code: string;
  window_hours: number;
}

export async function createAssessment(p: { title: string; modules: AssessmentRecord["modules"]; windowHours?: number }): Promise<AssessmentRecord> {
  const c = getClient();
  const { data: userData } = await c.auth.getUser();
  if (!userData.user) throw new Error("Sign in first");
  const { data, error } = await c
    .from("assessments")
    .insert({ owner_id: userData.user.id, title: p.title.slice(0, 80), modules: p.modules, window_hours: p.windowHours ?? 72 })
    .select("id,title,modules,invite_code,window_hours")
    .single();
  if (error) throw new Error(error.message);
  return data as AssessmentRecord;
}

export async function fetchMyAssessments(): Promise<AssessmentRecord[]> {
  const { data, error } = await getClient()
    .from("assessments")
    .select("id,title,modules,invite_code,window_hours")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as AssessmentRecord[];
}

export async function fetchAssessmentResults(assessmentId: string): Promise<Array<{ candidate_key: string; label: string; results: Record<string, unknown>; integrity_flags: string[]; completed_at: string }>> {
  const { data, error } = await getClient()
    .from("assessment_results")
    .select("candidate_key,label,results,integrity_flags,completed_at")
    .eq("assessment_id", assessmentId)
    .order("completed_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ candidate_key: string; label: string; results: Record<string, unknown>; integrity_flags: string[]; completed_at: string }>;
}

export async function submitAssessmentResult(p: { inviteCode: string; candidateKey: string; label?: string; results: Record<string, unknown>; flags?: string[] }): Promise<void> {
  const { error } = await getClient().rpc("submit_assessment_result", {
    p: { invite_code: p.inviteCode, candidate_key: p.candidateKey, label: p.label ?? "candidate", results: p.results, flags: p.flags ?? [] },
  });
  if (error) throw new Error(error.message);
}
