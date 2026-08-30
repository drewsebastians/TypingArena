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
import { getLocale } from "./i18n";
import { sanitizeNickname } from "./nickname";
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
  /** Server-confirmed idempotent duplicate of a previously persisted attempt. */
  duplicate?: boolean;
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
  await ensureSharedIdentity();
  const { data, error } = await c.rpc("submit_attempt", { p: p as unknown as Record<string, unknown> });
  if (error) throw new Error(`Attempt rejected: ${error.message}`);
  return (data ?? {}) as SubmitResponse;
}

/** Fetch the current anonymous shared session's complete attempt history (any
 *  integrity), newest first, auto-paginated. Kept for explicit internal
 *  hydration; ordinary practice never calls it. */
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

// ---------------------------------------------------------------------------
// Friend challenges
// ---------------------------------------------------------------------------

export async function createFriendChallenge(p: {
  creatorName: string;
  payload: FriendChallengeRecord["payload"];
}): Promise<string> {
  const identity = await ensureSharedIdentity(p.creatorName);
  const displayName = identity.username || sanitizeNickname(p.creatorName) || "typer";
  const id = generateChallengeId();
  const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const { error } = await getClient().from("friend_challenges").insert({
    id,
    creator_id: identity.id,
    creator_name: displayName,
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

/**
 * Submit a friend-challenge result through the validating RPC. Evidence
 * counts (when available) are derived server-side; casual claimed values are
 * clamped. Challenge existence/expiry and rate limits are enforced remotely.
 */
export async function submitFriendResult(
  challengeId: string,
  p: { displayName: string; wpm: number; accuracy: number; typedChars?: number; correctChars?: number; elapsedMs?: number },
): Promise<void> {
  const identity = await ensureSharedIdentity(p.displayName);
  const displayName = identity.username || sanitizeNickname(p.displayName) || "guest";
  const { error } = await getClient().rpc("submit_friend_result", {
    p_challenge_id: challengeId.trim().toUpperCase(),
    p: {
      display_name: displayName,
      ...(p.typedChars !== undefined && p.correctChars !== undefined && p.elapsedMs !== undefined
        ? { typed_chars: Math.round(p.typedChars), correct_chars: Math.round(p.correctChars), elapsed_ms: Math.round(p.elapsedMs) }
        : { claimed_wpm: p.wpm, claimed_accuracy: p.accuracy }),
    },
  });
  if (error) {
    const msg = error.message.includes("challenge_not_found_or_expired")
      ? "This challenge no longer exists or has expired"
      : error.message.includes("implausible_result")
        ? "Result rejected as implausible"
        : error.message.includes("rate_limited")
          ? "Too many submissions — try again later"
          : error.message;
    throw new Error(msg);
  }
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
// Shared identity (anonymous-first product)
// ---------------------------------------------------------------------------

export interface AccountUser {
  id: string;
  /** Intentionally always null — email is not a product identity. */
  email: null;
  username: string | null;
  isAnonymous: boolean;
}

export async function getCurrentUser(): Promise<AccountUser | null> {
  if (!IS_REMOTE_CONFIGURED || typeof window === "undefined") return null;
  const c = getClient();
  const { data } = await c.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await c.from("profiles").select("username").eq("id", data.user.id).maybeSingle();
  const authUser = data.user as typeof data.user & { is_anonymous?: boolean };
  return {
    id: data.user.id,
    email: null,
    username: (profile as { username: string | null } | null)?.username ?? null,
    isAnonymous: authUser.is_anonymous !== false,
  };
}

let sharedIdentityPromise: Promise<AccountUser> | null = null;

/**
 * Lazily establish the authenticated Supabase identity needed by a shared
 * action. Visiting the app and ordinary practice never calls this function.
 * Concurrent callers share one anonymous bootstrap request so a double-click
 * cannot create two browser identities.
 */
export async function ensureSharedIdentity(nickname?: string): Promise<AccountUser> {
  if (!IS_REMOTE_CONFIGURED) throw new RemoteUnavailableError();
  if (typeof window === "undefined") throw new Error("Shared identity is browser-only");
  if (sharedIdentityPromise) return sharedIdentityPromise;

  const requestedNickname = nickname === undefined ? null : sanitizeNickname(nickname);
  if (nickname !== undefined && !requestedNickname) {
    throw new Error("Nickname must be 2–24 letters, numbers, spaces, or simple punctuation");
  }

  sharedIdentityPromise = (async () => {
    const c = getClient();
    const { data: sessionData, error: sessionError } = await c.auth.getSession();
    if (sessionError) throw new Error(sessionError.message);

    let authUser = sessionData.session?.user ?? null;
    let created = false;
    if (!authUser) {
      const { data, error } = await c.auth.signInAnonymously();
      if (error || !data.user) throw new Error(error?.message ?? "Could not start a shared session");
      authUser = data.user;
      created = true;
    }

    const { data: profile, error: profileError } = await c.rpc("ensure_shared_profile", {
      p_username: requestedNickname,
      p_locale: getLocale(),
    });
    if (profileError) {
      const message = profileError.message.includes("nickname_taken")
        ? "That nickname is already in use — choose another one"
        : profileError.message;
      throw new Error(message);
    }
    if (created) trackAnonymousIdentityCreated();
    const profileRow = (profile ?? {}) as { username?: string | null };
    return {
      id: authUser!.id,
      email: null,
      username: profileRow.username ?? null,
      isAnonymous: true,
    };
  })();

  try {
    return await sharedIdentityPromise;
  } finally {
    sharedIdentityPromise = null;
  }
}

function trackAnonymousIdentityCreated(): void {
  // Kept in a helper so the event payload can never accidentally grow a
  // session token, auth UUID, or other identity-bearing value.
  void import("./analytics").then(({ track }) => track("anonymous_identity_created", {}));
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

export async function updateNickname(nickname: string): Promise<AccountUser> {
  return ensureSharedIdentity(nickname);
}

export async function deleteSharedData(): Promise<void> {
  const c = getClient();
  const current = await getCurrentUser();
  if (!current) return;
  const { error } = await c.rpc("delete_my_shared_data");
  if (error) throw new Error(error.message);
  await c.auth.signOut();
}

export interface ResourceManagementToken {
  resourceType: "team" | "custom" | "assessment";
  resourceId: string;
  token: string;
  expiresAt: string | null;
}

export async function issueResourceManagementToken(
  resourceType: ResourceManagementToken["resourceType"],
  resourceId: string,
): Promise<ResourceManagementToken> {
  await ensureSharedIdentity();
  const { data, error } = await getClient().rpc("issue_resource_management_token", {
    p_resource_type: resourceType,
    p_resource_id: resourceId,
  });
  if (error) throw new Error(mapManagementError(error.message));
  const row = (data ?? {}) as { resource_type?: string; resource_id?: string; token?: string; expires_at?: string | null };
  if (!row.token || !row.resource_id) throw new Error("Management link could not be created");
  return { resourceType: resourceType, resourceId: row.resource_id, token: row.token, expiresAt: row.expires_at ?? null };
}

export async function validateResourceManagementToken(
  resourceType: ResourceManagementToken["resourceType"],
  resourceId: string,
  token: string,
): Promise<{ resourceType: string; resourceId: string; ownerId: string; expiresAt: string }> {
  await ensureSharedIdentity();
  const { data, error } = await getClient().rpc("validate_resource_management_token", {
    p_resource_type: resourceType,
    p_resource_id: resourceId,
    p_token: token,
  });
  if (error) throw new Error(mapManagementError(error.message));
  const row = (data ?? {}) as { resource_type?: string; resource_id?: string; owner_id?: string; expires_at?: string };
  if (!row.resource_id || !row.owner_id || !row.expires_at) throw new Error("Management link is invalid or expired");
  return { resourceType: String(row.resource_type), resourceId: row.resource_id, ownerId: row.owner_id, expiresAt: row.expires_at };
}

export async function recoverResourceManagement(
  resourceType: ResourceManagementToken["resourceType"],
  resourceId: string,
  token: string,
): Promise<{ resourceType: string; resourceId: string; ownerId: string }> {
  await ensureSharedIdentity();
  const { data, error } = await getClient().rpc("recover_resource_management", {
    p_resource_type: resourceType,
    p_resource_id: resourceId,
    p_token: token,
  });
  if (error) throw new Error(mapManagementError(error.message));
  const row = (data ?? {}) as { resource_type?: string; resource_id?: string; owner_id?: string };
  if (!row.resource_id || !row.owner_id) throw new Error("Management link is invalid or expired");
  return { resourceType: String(row.resource_type), resourceId: row.resource_id, ownerId: row.owner_id };
}

export async function revokeResourceManagementToken(
  resourceType: ResourceManagementToken["resourceType"],
  resourceId: string,
): Promise<void> {
  await ensureSharedIdentity();
  const { error } = await getClient().rpc("revoke_resource_management_token", {
    p_resource_type: resourceType,
    p_resource_id: resourceId,
  });
  if (error) throw new Error(mapManagementError(error.message));
}

function mapManagementError(message: string): string {
  if (message.includes("rate_limited")) return "Too many management-link requests — try again later";
  if (message.includes("nickname_taken")) return "That nickname is already in use — choose another one";
  if (message.includes("not_found_or_not_owner")) return "This resource is no longer managed by this device";
  if (message.includes("management_invalid")) return "Management link is invalid or expired";
  return message;
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
  await ensureSharedIdentity();
  // Atomic SECURITY DEFINER RPC: creates the team AND its owner membership.
  // Direct client inserts into teams/team_members are no longer permitted —
  // membership exists only through authorized paths (create/join-by-code).
  const { data, error } = await c.rpc("create_team", { p_name: name.trim().slice(0, 60) });
  if (error) {
    const msg = error.message.includes("rate_limited")
      ? "Too many teams created — try again later"
      : error.message;
    throw new Error(msg);
  }
  return data as unknown as TeamRecord;
}

export async function joinTeamByCode(code: string): Promise<string> {
  await ensureSharedIdentity();
  const { data, error } = await getClient().rpc("join_team", { p_code: code.trim().toUpperCase() });
  if (error) {
    const msg = error.message.includes("team_not_found")
      ? "Team code not found"
      : error.message.includes("rate_limited")
        ? "Too many join attempts — try again in an hour"
        : error.message;
    throw new Error(msg);
  }
  return String(data);
}

export async function fetchMyTeams(): Promise<Array<TeamRecord & { role: string }>> {
  // Read-only route hydration must not create an anonymous identity. A
  // session created by an explicit shared action is still read here when it
  // exists.
  const identity = await getCurrentUser();
  if (!identity) return [];
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
  await ensureSharedIdentity();
  const { error } = await getClient().from("team_members").delete().eq("team_id", teamId);
  if (error) throw new Error(error.message);
}

export interface TeamMemberRow {
  user_id: string;
  role: string;
  username: string | null;
}

/** Membership roster for a team the caller belongs to (usernames only —
 *  emails are never exposed anywhere in the product). */
export async function fetchTeamMembers(teamId: string): Promise<TeamMemberRow[]> {
  const c = getClient();
  const { data, error } = await c
    .from("team_members")
    .select("user_id,role")
    .eq("team_id", teamId)
    .limit(500);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ user_id: string; role: string }>;
  if (rows.length === 0) return [];
  const prof = await c.from("public_profiles").select("id,username").in("id", rows.map((r) => r.user_id));
  const names = new Map(((prof.data ?? []) as Array<{ id: string; username: string | null }>).map((p) => [p.id, p.username]));
  return rows.map((r) => ({ ...r, username: names.get(r.user_id) ?? null }));
}

export async function deleteTeamAsOwner(teamId: string): Promise<void> {
  await ensureSharedIdentity();
  const { error } = await getClient().from("teams").delete().eq("id", teamId);
  if (error) throw new Error(error.message);
}

export interface AssignmentDefinition {
  /** Corpus mode for typing kinds, or the exact clip id for audio kinds. */
  ref: string;
  language: Language;
  durationSec: number;
  version: string;
}

export interface AssignmentRecord {
  id: string;
  title: string;
  kind: string;
  payload: Partial<AssignmentDefinition> & Record<string, unknown>;
  due_at: string | null;
}

export async function createAssignment(
  teamId: string,
  p: { title: string; kind: string; definition?: AssignmentDefinition; dueAt?: string },
): Promise<void> {
  const c = getClient();
  const identity = await ensureSharedIdentity();
  const { error } = await c.from("assignments").insert({
    team_id: teamId,
    title: p.title.slice(0, 80),
    kind: p.kind,
    payload: (p.definition ?? {}) as Record<string, unknown>,
    due_at: p.dueAt ?? null,
    created_by: identity.id,
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

/**
 * Bind a completion to a REAL persisted attempt. The server validates that
 * the attempt belongs to the caller, matches the assignment's mode/exercise
 * definition, clears an effort floor, and computes the score itself — the
 * client never submits a score.
 */
export async function completeAssignment(assignmentId: string, attemptClientId: string): Promise<{ score: number; wpm: number; accuracy: number }> {
  const c = getClient();
  await ensureSharedIdentity();
  const { data, error } = await c.rpc("complete_assignment", {
    p_assignment_id: assignmentId,
    p_client_id: attemptClientId,
  });
  if (error) {
    const msg = error.message.includes("attempt_not_found")
      ? "Finish the exercise first — no result found for this assignment"
      : error.message.includes("attempt_mismatch")
        ? "This result does not match the assigned exercise"
        : error.message.includes("attempt_too_short")
          ? "The attempt was too short to count — run the full exercise"
          : error.message.includes("not_a_member")
            ? "Join this team before completing assignments"
            : error.message;
    throw new Error(msg);
  }
  return (data ?? {}) as { score: number; wpm: number; accuracy: number };
}

export interface TeamCompletionRow {
  assignment_id: string;
  user_id: string;
  username: string | null;
  score: number;
  wpm: number | null;
  accuracy: number | null;
  completed_at: string;
}

/** Aggregate completion rows for a team's assignments (dashboard view). */
export async function fetchTeamCompletions(teamId: string): Promise<TeamCompletionRow[]> {
  const c = getClient();
  const assignments = await fetchAssignments(teamId);
  if (assignments.length === 0) return [];
  const ids = assignments.map((a) => a.id);
  const { data, error } = await c
    .from("assignment_completions")
    .select("assignment_id,user_id,score,wpm,accuracy,completed_at")
    .in("assignment_id", ids)
    .limit(1000);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<{ assignment_id: string; user_id: string; score: number; wpm: number | null; accuracy: number | null; completed_at: string }>;
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
  await ensureSharedIdentity();
  const { data, error } = await getClient().rpc("create_custom_test", { p: p as unknown as Record<string, unknown> });
  if (error) throw new Error(error.message.includes("sign_in") ? "Could not start the shared workspace" : error.message);
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
  const identity = await getCurrentUser();
  if (!identity) return [];
  const c = getClient();
  // Ownership must be enforced here as well as in RLS: the unlisted
  // world-read policy means a bare select also returns OTHER users' unlisted
  // tests, which would pollute the "my tests" surface.
  const { data, error } = await c
    .from("custom_tests")
    .select("id,owner_id,title,language,body,visibility")
    .eq("owner_id", identity.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return ((data ?? []) as CustomTestRecord[]).filter((r) => r.owner_id === identity.id);
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

export interface CreatedRoom {
  code: string;
  /** Secret returned ONLY to the room creator; authorizes start/rematch. */
  hostToken: string;
}

export async function createRoom(p: { hostName: string; language: Language; durationSec: number }): Promise<CreatedRoom> {
  await ensureSharedIdentity(p.hostName);
  const { data, error } = await getClient().rpc("create_room", {
    p: { host_name: p.hostName, language: p.language, duration_sec: p.durationSec },
  });
  if (error) throw new Error(error.message.includes("rate_limited") ? "Too many rooms created — try later" : error.message);
  const r = (data ?? {}) as { code?: string; host_token?: string };
  if (!r.code || !r.host_token) throw new Error("Room creation failed");
  return { code: String(r.code), hostToken: String(r.host_token) };
}

export async function fetchRoom(code: string): Promise<RoomRecord> {
  const { data, error } = await getClient().from("rooms").select("*").eq("code", code.toUpperCase()).maybeSingle();
  if (error || !data) throw new Error("Room not found or expired");
  return data as RoomRecord;
}

/** Host-authoritative start: only the creator's secret token is accepted. */
export async function startRoom(code: string, hostToken: string): Promise<void> {
  await ensureSharedIdentity();
  const { error } = await getClient().rpc("start_room", { p_code: code.toUpperCase(), p_host_token: hostToken });
  if (error) {
    const msg = error.message.includes("already_started")
      ? "Race already started"
      : error.message.includes("not_host")
        ? "Only the host can start the race"
        : error.message.includes("room_expired")
          ? "This room has expired"
          : error.message;
    throw new Error(msg);
  }
}

/** Host-only rematch: same room code, fresh seed, cleared results. */
export async function restartRoom(code: string, hostToken: string): Promise<void> {
  await ensureSharedIdentity();
  const { error } = await getClient().rpc("restart_room", { p_code: code.toUpperCase(), p_host_token: hostToken });
  if (error) {
    const msg = error.message.includes("not_host") ? "Only the host can restart the race" : error.message;
    throw new Error(msg);
  }
}

/** Host-only cancellation: ends a stale/abandoned race so no further finishes
 *  can be recorded. Idempotent once cancelled. */
export async function cancelRoom(code: string, hostToken: string): Promise<void> {
  await ensureSharedIdentity();
  const { error } = await getClient().rpc("close_room", { p_code: code.toUpperCase(), p_host_token: hostToken });
  if (error) {
    const msg = error.message.includes("not_host") ? "Only the host can end the race" : error.message;
    throw new Error(msg);
  }
}

/** Submit race evidence — the server recomputes wpm/accuracy from counts
 *  inside the validated race window and dedupes per player. */
export async function finishRoom(
  code: string,
  playerKey: string,
  p: {
    displayName: string;
    typedChars: number;
    correctChars: number;
    elapsedMs: number;
  },
): Promise<{ accepted: boolean; duplicate?: boolean; wpm?: number; accuracy?: number }> {
  await ensureSharedIdentity(p.displayName);
  const { data, error } = await getClient().rpc("finish_room", {
    p_code: code.toUpperCase(),
    p_player_key: playerKey,
    p: {
      display_name: p.displayName,
      typed_chars: Math.round(p.typedChars),
      correct_chars: Math.round(p.correctChars),
      elapsed_ms: Math.round(p.elapsedMs),
    },
  });
  if (error) {
    const msg = error.message.includes("implausible_result")
      ? "Result rejected as implausible"
      : error.message.includes("race_window_closed")
        ? "The race window already closed"
        : error.message.includes("race_not_running")
          ? "Race is not running"
          : error.message;
    throw new Error(msg);
  }
  return (data ?? { accepted: true }) as { accepted: boolean; duplicate?: boolean; wpm?: number; accuracy?: number };
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
  revoked?: boolean;
  opens_at?: string | null;
}

export async function createAssessment(p: { title: string; modules: AssessmentRecord["modules"]; windowHours?: number }): Promise<AssessmentRecord> {
  const c = getClient();
  const identity = await ensureSharedIdentity();
  const { data, error } = await c
    .from("assessments")
    .insert({ owner_id: identity.id, title: p.title.slice(0, 80), modules: p.modules, window_hours: p.windowHours ?? 72 })
    .select("id,title,modules,invite_code,window_hours")
    .single();
  if (error) throw new Error(error.message);
  return data as AssessmentRecord;
}

export type InviteState = "invalid" | "expired" | "revoked" | "not_open";

export class InviteInvalidError extends Error {
  readonly state: InviteState;
  constructor(state: InviteState) {
    super(
      state === "revoked" ? "This invite has been revoked by the organizer"
      : state === "expired" ? "This invite has expired"
      : state === "not_open" ? "This assessment is not open yet"
      : "This invite is invalid",
    );
    this.name = "InviteInvalidError";
    this.state = state;
  }
}

/**
 * Candidate-side resolution of the SAVED assessment definition by invite
 * token. Returns exactly the module sequence the creator stored — never a
 * client-side default — after validating the full invite lifecycle
 * (invalid / revoked / not-yet-open / expired).
 */
export async function fetchAssessmentDefinition(inviteCode: string): Promise<{
  title: string;
  modules: AssessmentRecord["modules"];
  opens_at: string | null;
  expires_at: string;
}> {
  const { data, error } = await getClient().rpc("fetch_assessment_definition", {
    p_invite: inviteCode.trim().toUpperCase(),
  });
  if (error) {
    if (error.message.includes("invite_revoked")) throw new InviteInvalidError("revoked");
    if (error.message.includes("invite_not_open")) throw new InviteInvalidError("not_open");
    if (error.message.includes("invite_expired")) throw new InviteInvalidError("expired");
    throw new InviteInvalidError("invalid");
  }
  const r = (data ?? {}) as { title?: string; modules?: AssessmentRecord["modules"]; opens_at?: string | null; expires_at?: string };
  if (!r.modules || r.modules.length === 0) throw new InviteInvalidError("invalid");
  return {
    title: String(r.title ?? "Assessment"),
    modules: r.modules,
    opens_at: r.opens_at ?? null,
    expires_at: String(r.expires_at),
  };
}

/** Owner-only invite revocation — candidates then receive a distinct
 *  "revoked" state instead of being able to keep completing. */
export async function revokeAssessmentInvite(assessmentId: string): Promise<void> {
  await ensureSharedIdentity();
  const { error } = await getClient().rpc("revoke_assessment_invite", { p_assessment_id: assessmentId });
  if (error) throw new Error(error.message.includes("not_found_or_not_owner") ? "Assessment not found" : error.message);
}

export async function fetchMyAssessments(): Promise<AssessmentRecord[]> {
  const identity = await getCurrentUser();
  if (!identity) return [];
  const { data, error } = await getClient()
    .from("assessments")
    .select("id,title,modules,invite_code,window_hours,revoked,opens_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as AssessmentRecord[];
}

export async function fetchAssessmentResults(assessmentId: string): Promise<Array<{ candidate_key: string; label: string; results: Record<string, unknown>; integrity_flags: string[]; completed_at: string }>> {
  const identity = await getCurrentUser();
  if (!identity) return [];
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
  await ensureSharedIdentity();
  const { error } = await getClient().rpc("submit_assessment_result", {
    p: { invite_code: p.inviteCode, candidate_key: p.candidateKey, label: p.label ?? "candidate", results: p.results, flags: p.flags ?? [] },
  });
  if (error) {
    const msg = error.message.includes("invite_invalid")
      ? "This invite is no longer valid"
      : error.message.includes("invalid_results")
        ? "Result payload was rejected — please retake the assessment"
        : error.message;
    throw new Error(msg);
  }
}
