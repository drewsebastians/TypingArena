"use client";
// Teams & Classrooms — create/join rooms, publish REAL assignments, aggregate
// dashboard. Assignments launch the actual TypingArena engines and completions
// are bound server-side to real attempt evidence (never an arbitrary score).
// Contact details never surface; display names/usernames only.
import { useCallback, useEffect, useState } from "react";
import {
  completeAssignment,
  createAssignment,
  createTeam,
  deleteTeamAsOwner,
  fetchAssignments,
  fetchMyTeams,
  fetchTeamCompletions,
  fetchTeamMembers,
  issueResourceManagementToken,
  joinTeamByCode,
  leaveTeam,
  revokeResourceManagementToken,
  submitAttempt,
  type AssignmentRecord,
  type AssignmentDefinition,
  type TeamCompletionRow,
  type TeamMemberRow,
  type TeamRecord,
} from "@/lib/remote";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import { audioEvidence, typingEvidence } from "@/lib/sync";
import type { SubmitAttemptPayload } from "@/lib/remote";
import { sanitizeTitle } from "@/lib/sanitize";
import { t } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import TypingEngine from "@/components/TypingEngine";
import DictationEngine from "@/components/DictationEngine";
import TranscriptionEngine from "@/components/TranscriptionEngine";
import { ENGLISH_CORPUS } from "@/lib/content/english";
import { INDONESIAN_CORPUS } from "@/lib/content/indonesian";
import { DICTATION_CLIPS, TRANSCRIPTION_CLIPS, findDictationClip } from "@/lib/content/dictation";
import { CAREER_TRACKS, audioEfficiency, scoreModules, typingEfficiency, getTrack } from "@/lib/career";
import type { CareerAssessmentResult, CareerModule, ModuleScore } from "@/lib/career";
import type { CorpusItem, DictationResult, Language, TranscriptionResult, TypingResult } from "@/lib/types";
import { parseManageFragment } from "@/lib/resourceAccess";
import { recoverResourceManagement } from "@/lib/remote";

/** Single-exercise kinds plus full career tracks — all executable end-to-end. */
const ASSIGNMENT_KINDS = ["sprint", "copy-pro", "numbers", "punctuation", "dictation", "transcription", "career"] as const;
type AssignmentKind = (typeof ASSIGNMENT_KINDS)[number];

const TYPING_KINDS: ReadonlySet<string> = new Set(["sprint", "copy-pro", "numbers", "punctuation"]);

function corpusFor(language: Language): CorpusItem[] {
  const base = language === "en" ? ENGLISH_CORPUS : INDONESIAN_CORPUS;
  return base.filter((c) => c.mode === "sprint" || c.mode === "copy-pro" || c.mode === "numbers" || c.mode === "punctuation");
}

export default function TeamsPanel() {
  const [teams, setTeams] = useState<Array<TeamRecord & { role: string }>>([]);
  const [state, setState] = useState<"loading" | "ready" | "unconfigured">("loading");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [managementLinks, setManagementLinks] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    if (!IS_REMOTE_CONFIGURED) {
      setState("unconfigured");
      return;
    }
    try {
      const list = await fetchMyTeams();
      setTeams(list as unknown as Array<TeamRecord & { role: string }>);
      setState("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load teams");
      setState("ready");
    }
  }, []);

  useEffect(() => {
    const manageId = new URLSearchParams(window.location.search).get("manage");
    const token = parseManageFragment(window.location.hash);
    if (manageId && token) {
      setState("ready");
      setError("Recovering workspace…");
      void recoverResourceManagement("team", manageId, token)
        .then(() => {
          track("manage_link_recovered", { resourceType: "team" });
          window.history.replaceState({}, "", window.location.pathname);
          setError(null);
          void refresh();
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "Management link is invalid or expired");
          setState("ready");
        });
    } else {
      void refresh();
    }
  }, [refresh]);

  if (state === "unconfigured") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <p className="mt-3 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-900">{t("common.backendRequired")}</p>
      </div>
    );
  }

  if (activeId) {
    return <TeamDetail teamId={activeId} team={teams.find((tm) => tm.id === activeId)} onBack={() => setActiveId(null)} onRefresh={refresh} />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {state === "ready" && (
        <>
          <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
            <h2 className="text-sm font-bold">Join a team</h2>
            <p className="mt-1 text-xs text-zinc-500">Use the code shared by your teacher, manager, or practice group.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="JOIN CODE" aria-label="team code" className="min-h-11 w-36 rounded-lg border px-3 py-2 font-mono uppercase dark:bg-zinc-800" />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await joinTeamByCode(code);
                    setCode("");
                    await refresh();
                    track("team_joined", {});
                    track("teams_intent_selected", { intent: "join" });
                  } catch (e) {
                    track("team_join_failed", {});
                    setError(e instanceof Error ? e.message : "Join failed");
                  }
                }}
                disabled={code.length < 6}
                className="min-h-11 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black"
              >
                {t("teams.joinByCode")}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

          <section className="mt-6" aria-labelledby="your-teams-title">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your teams</p>
                <h2 id="your-teams-title" className="mt-1 text-xl font-black">Practice groups you can open</h2>
              </div>
              <span className="text-xs text-zinc-500">{teams.length} total</span>
            </div>
            <div className="mt-3 divide-y rounded-xl border bg-white dark:bg-zinc-900">
            {teams.length === 0 && <p className="px-4 py-6 text-center text-sm text-zinc-500">No teams yet — join one above or create a new group below.</p>}
            {teams.map((tm) => (
              <div key={tm.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex-1 font-semibold">{sanitizeTitle(tm.name)}</span>
                <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs dark:bg-zinc-800">{tm.join_code}</span>
                <span className={`text-xs font-bold uppercase ${tm.role === "owner" ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-500"}`}>{tm.role}</span>
                <button type="button" onClick={() => { setActiveId(tm.id); track("teams_intent_selected", { intent: "open" }); }} className="min-h-11 rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-black">Open</button>
                <details className="basis-full rounded-lg border p-2 sm:basis-auto sm:border-0 sm:p-0">
                  <summary className="min-h-11 cursor-pointer list-none px-2 py-2 text-xs font-semibold sm:py-3">Settings</summary>
                  <div className="mt-2 flex flex-wrap gap-2 sm:absolute sm:z-10 sm:mt-0 sm:rounded-xl sm:border sm:bg-white sm:p-3 sm:shadow-lg dark:sm:border-zinc-800 dark:sm:bg-zinc-900">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const management = await issueResourceManagementToken("team", tm.id);
                          const link = `${window.location.origin}${window.location.pathname}?manage=${tm.id}#manage=${management.token}`;
                          setManagementLinks((prev) => ({ ...prev, [tm.id]: link }));
                          await navigator.clipboard.writeText(link);
                          track("manage_link_created", { resourceType: "team" });
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Could not create management link");
                        }
                      }}
                      className="min-h-11 rounded-full border px-3 py-1.5 text-xs"
                    >
                      Copy management link
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm("Revoke active management links for this team?")) return;
                        try {
                          await revokeResourceManagementToken("team", tm.id);
                          setManagementLinks((prev) => {
                            const next = { ...prev };
                            delete next[tm.id];
                            return next;
                          });
                          track("manage_link_revoked", { resourceType: "team" });
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Could not revoke management links");
                        }
                      }}
                      className="min-h-11 rounded-full border border-red-300 px-3 py-1.5 text-xs text-red-600"
                    >
                      Revoke links
                    </button>
                    {tm.role === "owner" ? (
                      <button type="button" onClick={async () => { if (!window.confirm(`Delete team "${tm.name}" and all its assignments?`)) return; await deleteTeamAsOwner(tm.id); await refresh(); }} className="min-h-11 rounded-full border border-red-300 px-3 py-1.5 text-xs text-red-600">Delete team</button>
                    ) : (
                      <button type="button" onClick={async () => { await leaveTeam(tm.id); await refresh(); }} className="min-h-11 rounded-full border border-red-300 px-3 py-1.5 text-xs text-red-600">Leave team</button>
                    )}
                    {managementLinks[tm.id] && <p className="w-full break-all rounded bg-amber-50 p-2 font-mono text-[11px] text-amber-900 dark:bg-amber-950 dark:text-amber-100">Keep this management link private: {managementLinks[tm.id]}</p>}
                  </div>
                </details>
              </div>
            ))}
            </div>
          </section>

          <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
            <h2 className="text-sm font-bold">Create a team</h2>
            <p className="mt-1 text-xs text-zinc-500">Start a private practice group and invite people with its join code.</p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Team name
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Data Entry Cohort A" maxLength={60} className="mt-1 block min-h-11 w-64 rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800" />
              </label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const created = await createTeam(sanitizeTitle(name));
                    const management = await issueResourceManagementToken("team", created.id);
                    setManagementLinks((prev) => ({ ...prev, [created.id]: `${window.location.origin}${window.location.pathname}?manage=${created.id}#manage=${management.token}` }));
                    setName("");
                    await refresh();
                    track("team_created", {});
                    track("teams_intent_selected", { intent: "create" });
                    track("manage_link_created", { resourceType: "team" });
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Create failed");
                  }
                }}
                disabled={name.trim().length < 2}
                className="min-h-11 rounded-full bg-black px-5 py-2 text-sm font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black"
              >
                {t("teams.createTeam")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team detail: dashboard + assignment publishing + REAL member runs
// ---------------------------------------------------------------------------

function TeamDetail({ teamId, team, onBack, onRefresh }: { teamId: string; team?: TeamRecord & { role: string }; onBack: () => void; onRefresh: () => Promise<void> }) {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [completions, setCompletions] = useState<TeamCompletionRow[]>([]);
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<AssignmentKind>("sprint");
  const [durationSec, setDurationSec] = useState(30);
  const [language, setLanguage] = useState<Language>("en");
  const [clipRef, setClipRef] = useState<string>(TRANSCRIPTION_CLIPS[0]?.id ?? "");
  const [careerTrackId, setCareerTrackId] = useState<string>(CAREER_TRACKS[0]?.id ?? "data-entry");
  const [dueAt, setDueAt] = useState<string>("");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "assignments" | "members" | "results" | "settings">("overview");
  const [managementLink, setManagementLink] = useState<string | null>(null);
  // Ticking "now" lives in state (set from an effect) so render stays pure.
  const [nowTs, setNowTs] = useState(() => 0);
  useEffect(() => {
    setNowTs(Date.now());
    const id = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    setAssignments(await fetchAssignments(teamId).catch(() => []));
    setCompletions(await fetchTeamCompletions(teamId).catch(() => []));
    setMembers(await fetchTeamMembers(teamId).catch(() => []));
  }, [teamId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const myCompletion = useCallback(
    (assignmentId: string) => completions.find((c) => c.assignment_id === assignmentId),
    [completions],
  );

  const finishAssignment = useCallback(
    async (a: AssignmentRecord, payload: ReturnType<typeof typingEvidence>) => {
      setBusyId(a.id);
      setError(null);
      try {
        // 1) Persist REAL evidence through the authoritative RPC…
        await submitAttempt(payload);
        // 2) …then bind the completion to it. The server re-validates
        //    ownership + exercise match and computes the score itself.
        await completeAssignment(a.id, payload.clientId);
        setDoneIds((prev) => new Set([...prev, a.id]));
        track("assignment_completed", { assignmentId: a.id });
        await refresh();
      } catch (e) {
        track("assignment_submission_failed", { assignmentId: a.id });
        setError(e instanceof Error ? e.message : "Completion failed");
      } finally {
        setBusyId(null);
        setRunningId(null);
      }
    },
    [refresh],
  );

  const onTypingDone = useCallback(
    (a: AssignmentRecord, r: TypingResult) => {
      void finishAssignment(a, typingEvidence(r));
    },
    [finishAssignment],
  );
  const onAudioDone = useCallback(
    (a: AssignmentRecord, mode: "dictation" | "transcription", r: DictationResult | TranscriptionResult) => {
      void finishAssignment(a, audioEvidence(r, mode));
    },
    [finishAssignment],
  );

  const running = assignments.find((a) => a.id === runningId) ?? null;

  // Per-assignment aggregates for the teacher/admin dashboard.
  const perAssignment = assignments.map((a) => {
    const rows = completions.filter((c) => c.assignment_id === a.id);
    const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
    return {
      assignment: a,
      completedCount: rows.length,
      avgScore: avg(rows.map((r) => Number(r.score))),
      avgWpm: avg(rows.map((r) => Number(r.wpm)).filter((x) => !Number.isNaN(x))),
      avgAccuracy: avg(rows.map((r) => Number(r.accuracy)).filter((x) => !Number.isNaN(x))),
      overdue: Boolean(a.due_at && new Date(a.due_at).getTime() < nowTs && rows.length < members.length),
    };
  });
  const overallRate =
    assignments.length === 0 || members.length === 0
      ? 0
      : Math.round((completions.length / (assignments.length * members.length)) * 100);

  if (running) {
    const def = running.payload as Partial<AssignmentDefinition>;
    const ref = String(def.ref ?? "");
    const lang = (def.language === "id" ? "id" : "en") as Language;
    const dur = Math.max(15, Math.min(300, Number(def.durationSec ?? 30)));
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <button type="button" onClick={() => setRunningId(null)} className="mb-4 min-h-11 text-sm underline">← Back to room</button>
        <p className="text-center text-xs uppercase tracking-widest text-zinc-500">
          Assignment · {running.title}
        </p>
        <div className="mt-6">
          {running.kind === "career" && (
            <CareerAssignmentRunner
              assignment={running}
              onBack={() => setRunningId(null)}
              onFinish={(payload) => void finishAssignment(running, payload)}
            />
          )}
          {TYPING_KINDS.has(running.kind) && (
            <TypingEngine
              pool={corpusFor(lang).filter((c) => c.mode === (running.kind === "punctuation" ? "punctuation" : running.kind))}
              language={lang}
              mode={running.kind as TypingResult["mode"]}
              durationSec={dur}
              exerciseId={`assignment:${running.kind}:${ref}:${lang}`}
              onComplete={(r) => onTypingDone(running, r)}
            />
          )}
          {running.kind === "dictation" && (
            <DictationEngine
              item={findDictationClip(ref)!}
              exerciseId={`assignment:${running.kind}:${ref}:${lang}`}
              onComplete={(r) => onAudioDone(running, "dictation", r)}
            />
          )}
          {running.kind === "transcription" && (
            <TranscriptionEngine
              item={TRANSCRIPTION_CLIPS.find((c) => c.id === ref)!}
              exerciseId={`assignment:${running.kind}:${ref}:${lang}`}
              onComplete={(r) => onAudioDone(running, "transcription", r)}
            />
          )}
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button type="button" onClick={onBack} className="mb-4 min-h-11 text-sm underline">← All teams</button>

      <div className="flex flex-wrap gap-2 border-b pb-3" role="tablist" aria-label="Team workspace sections">
        {(["overview", "assignments", "members", "results", "settings"] as const).map((item) => (
          <button type="button" key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`min-h-11 rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${tab === item ? "bg-black text-white dark:bg-white dark:text-black" : "border bg-white dark:bg-zinc-900"}`}>{item}</button>
        ))}
      </div>

      {tab === "overview" && (
        <section className="mt-6" aria-labelledby="team-overview-title">
          <h2 id="team-overview-title" className="font-bold">Room overview</h2>
          <div className="mt-2 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Stat label="Members" value={String(members.length)} />
            <Stat label="Assignments" value={String(assignments.length)} />
            <Stat label="Completions" value={String(completions.length)} />
            <Stat label="Overall rate" value={`${overallRate}%`} />
          </div>
          <div className="mt-4 rounded-xl border bg-white p-4 text-sm dark:bg-zinc-900">
            <p className="font-semibold">Keep the room moving</p>
            <p className="mt-1 text-xs text-zinc-500">Publish reviewed exercises from Assignments, see people in Members, and use Results for completion summaries.</p>
            <button type="button" onClick={() => setTab(assignments.length > 0 ? "assignments" : "members")} className="mt-3 min-h-11 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black">{assignments.length > 0 ? "Open assignments" : "View members"} →</button>
          </div>
        </section>
      )}

      {tab === "assignments" && <>
      {/* Admin: create assignment */}
      <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h3 className="text-sm font-bold">Publish an assignment</h3>
        <p className="mt-1 text-xs text-zinc-500">Members run the actual exercise here; their completion score is computed from the real result.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 3 — numeric records" aria-label="assignment title" className="w-56 rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800" />
          <select value={kind} onChange={(e) => setKind(e.target.value as AssignmentKind)} aria-label="assignment kind" className="min-h-11 rounded-lg border px-2 py-2 text-sm capitalize dark:bg-zinc-800">
            {ASSIGNMENT_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          {kind === "career" ? (
            <select value={careerTrackId} onChange={(e) => setCareerTrackId(e.target.value)} aria-label="career track" className="min-h-11 max-w-[16rem] rounded-lg border px-2 py-2 text-sm dark:bg-zinc-800">
              {CAREER_TRACKS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : TYPING_KINDS.has(kind) ? (
            <>
              <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} aria-label="assignment language" className="min-h-11 rounded-lg border px-2 py-2 text-sm dark:bg-zinc-800">
                <option value="en">English</option>
                <option value="id">Indonesia</option>
              </select>
              <label className="text-xs text-zinc-500">
                Duration
                <input type="number" min={15} max={300} step={15} value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))} aria-label="assignment duration seconds" className="ml-1 min-h-11 w-20 rounded-lg border px-2 py-1.5 text-sm dark:bg-zinc-800" />
              </label>
            </>
          ) : (
            <select value={clipRef} onChange={(e) => setClipRef(e.target.value)} aria-label="audio clip" className="min-h-11 max-w-[16rem] rounded-lg border px-2 py-2 text-sm dark:bg-zinc-800">
              {(kind === "dictation" ? DICTATION_CLIPS : TRANSCRIPTION_CLIPS).map((c) => (
                <option key={c.id} value={c.id}>{c.id} ({c.language})</option>
              ))}
            </select>
          )}
          <label className="text-xs text-zinc-500">
            Due
            <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} aria-label="due date" className="ml-1 min-h-11 rounded-lg border px-2 py-1.5 text-sm dark:bg-zinc-800" />
          </label>
          <button
            type="button"
            onClick={async () => {
              try {
                const definition: AssignmentDefinition = kind === "career"
                  ? { ref: careerTrackId, language: "en", durationSec: getTrack(careerTrackId)?.modules.reduce((s, m) => s + m.durationSec, 0) ?? 90, version: "v2" }
                  : TYPING_KINDS.has(kind)
                    ? { ref: kind, language, durationSec, version: "v2" }
                    : { ref: clipRef, language: (kind === "dictation" ? findDictationClip(clipRef)?.language : TRANSCRIPTION_CLIPS.find((c) => c.id === clipRef)?.language) ?? "en", durationSec: kind === "dictation" ? 60 : 120, version: "v2" };
                await createAssignment(teamId, {
                  title: sanitizeTitle(title),
                  kind,
                  definition,
                  dueAt: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : undefined,
                });
                track("assignment_created", {});
                setTitle("");
                setDueAt("");
                await refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Publish failed");
              }
            }}
            disabled={title.trim().length < 2 || (!TYPING_KINDS.has(kind) && !clipRef)}
            className="min-h-11 rounded-full bg-black px-5 py-2 text-xs font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            Publish
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Assignment list: member runs + admin aggregates */}
      <div className="mt-4 divide-y rounded-xl border bg-white dark:bg-zinc-900">
        {perAssignment.map(({ assignment: a, completedCount, avgScore, avgWpm, avgAccuracy, overdue }) => {
          const mine = myCompletion(a.id) ?? undefined;
          const isDone = Boolean(mine) || doneIds.has(a.id);
          const busy = busyId === a.id;
          const def = a.payload as Partial<AssignmentDefinition>;
          return (
            <div key={a.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-zinc-500">
                    {a.kind}
                    {TYPING_KINDS.has(a.kind) && def.language ? ` · ${def.language === "en" ? "English" : "Indonesia"}` : ""}
                    {def.durationSec ? ` · ${def.durationSec}s` : ""}
                    {a.due_at ? ` · due ${new Date(a.due_at).toLocaleDateString()}` : ""}
                    {overdue ? ' · OVERDUE' : ""}
                  </div>
                </div>
                {!isDone ? (
                  <button
                    type="button"
                    onClick={() => setRunningId(a.id)}
                    disabled={busy}
                    className="min-h-11 rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-black"
                  >
                    Start assignment →
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    COMPLETED{mine ? ` · score ${Number(mine.score).toFixed(1)}` : ""}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-zinc-500">
                <span>{completedCount}/{members.length || "?"} completed</span>
                {avgScore !== null && <span>avg score {avgScore.toFixed(1)}</span>}
                {avgWpm !== null && <span>avg {Math.round(avgWpm)} wpm</span>}
                {avgAccuracy !== null && <span>avg accuracy {Math.round(avgAccuracy)}%</span>}
              </div>
              {completions
                .filter((c) => c.assignment_id === a.id)
                .slice(0, 8)
                .map((r) => (
                  <div key={`${r.assignment_id}-${r.user_id}`} className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span>👤 @{r.username}</span>
                    <span className="font-mono">score {Number(r.score).toFixed(1)}</span>
                    {r.wpm !== null && <span>{Math.round(Number(r.wpm))} wpm</span>}
                    {r.accuracy !== null && <span>{Math.round(Number(r.accuracy))}% acc</span>}
                    <span>{new Date(r.completed_at).toLocaleDateString()}</span>
                  </div>
                ))}
            </div>
          );
        })}
        {assignments.length === 0 && <p className="px-4 py-6 text-center text-sm text-zinc-500">No assignments yet.</p>}
      </div>
      </>}

      {tab === "members" && (
        <section className="mt-6 rounded-xl border bg-white dark:bg-zinc-900" aria-labelledby="team-members-title">
          <div className="border-b p-4">
            <h2 id="team-members-title" className="font-bold">Members</h2>
            <p className="mt-1 text-xs text-zinc-500">Only display names and roles are shown. Contact details never appear here.</p>
          </div>
          <div className="divide-y">
            {members.map((member) => <div key={member.user_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span className="font-semibold">@{member.username ?? "member"}</span><span className="text-xs font-bold uppercase text-zinc-500">{member.role}</span></div>)}
            {members.length === 0 && <p className="px-4 py-6 text-center text-sm text-zinc-500">No member records are available yet.</p>}
          </div>
        </section>
      )}

      {tab === "results" && (
        <section className="mt-6 rounded-xl border bg-white dark:bg-zinc-900" aria-labelledby="team-results-title">
          <div className="border-b p-4">
            <h2 id="team-results-title" className="font-bold">Results</h2>
            <p className="mt-1 text-xs text-zinc-500">Completion summaries come from real submitted attempts; missing rows stay missing.</p>
          </div>
          <div className="divide-y">
            {perAssignment.map(({ assignment: a, completedCount, avgScore, avgWpm, avgAccuracy }) => <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"><span className="min-w-0 flex-1 truncate font-semibold">{a.title}</span><span>{completedCount}/{members.length || "?"} complete</span><span className="text-xs text-zinc-500">{avgScore === null ? "No score yet" : `avg ${avgScore.toFixed(1)}${avgWpm === null ? "" : ` · ${Math.round(avgWpm)} WPM`}${avgAccuracy === null ? "" : ` · ${Math.round(avgAccuracy)}%`}`}</span></div>)}
            {assignments.length === 0 && <p className="px-4 py-6 text-center text-sm text-zinc-500">No results until an assignment is published.</p>}
          </div>
        </section>
      )}

      {tab === "settings" && (
        <section className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900" aria-labelledby="team-settings-title">
          <h2 id="team-settings-title" className="font-bold">Room settings</h2>
          <p className="mt-1 text-xs text-zinc-500">Rare management and membership actions live here so the room stays focused on practice.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const management = await issueResourceManagementToken("team", teamId);
                  const link = `${window.location.origin}/teams?manage=${teamId}#manage=${management.token}`;
                  setManagementLink(link);
                  await navigator.clipboard.writeText(link);
                  track("manage_link_created", { resourceType: "team" });
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not create management link");
                }
              }}
              className="min-h-11 rounded-full border px-4 py-2 text-sm font-semibold"
            >
              Copy management link
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("Revoke active management links for this team?")) return;
                try {
                  await revokeResourceManagementToken("team", teamId);
                  setManagementLink(null);
                  track("manage_link_revoked", { resourceType: "team" });
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not revoke management links");
                }
              }}
              className="min-h-11 rounded-full border border-red-300 px-4 py-2 text-sm text-red-600"
            >
              Revoke links
            </button>
            {team?.role === "owner" ? (
              <button type="button" onClick={async () => { if (!window.confirm("Delete this team and all its assignments?")) return; await deleteTeamAsOwner(teamId); await onRefresh(); onBack(); }} className="min-h-11 rounded-full border border-red-300 px-4 py-2 text-sm text-red-600">Delete team</button>
            ) : (
              <button type="button" onClick={async () => { if (!window.confirm("Leave this team?")) return; await leaveTeam(teamId); await onRefresh(); onBack(); }} className="min-h-11 rounded-full border border-red-300 px-4 py-2 text-sm text-red-600">Leave team</button>
            )}
          </div>
          {managementLink && <p className="mt-3 break-all rounded bg-amber-50 p-3 font-mono text-[11px] text-amber-900 dark:bg-amber-950 dark:text-amber-100">Keep this management link private: {managementLink}</p>}
          {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Career assignment runner — executes the FULL assigned track module-by-module
// through the real engines, then submits the aggregated career attempt for
// server-side binding (mode 'career', exercise 'career:{trackId}').
// ---------------------------------------------------------------------------

function careerCorpus(modeRef: string, language: Language, seedKey: string): CorpusItem {
  const base = language === "en" ? ENGLISH_CORPUS : INDONESIAN_CORPUS;
  const pool = base.filter((c) => c.mode === modeRef);
  const arr = pool.length > 0 ? pool : base.filter((c) => c.mode === "sprint");
  let h = 2166136261;
  for (let i = 0; i < seedKey.length; i++) h = Math.imul(h ^ seedKey.charCodeAt(i), 16777619);
  return arr[(h >>> 0) % arr.length];
}

function CareerAssignmentRunner({ assignment, onFinish, onBack }: {
  assignment: AssignmentRecord;
  onFinish: (payload: SubmitAttemptPayload) => void;
  onBack: () => void;
}) {
  const trackId = String((assignment.payload as { ref?: string }).ref ?? "");
  const track = getTrack(trackId);
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<ModuleScore[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (!track) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <button type="button" onClick={onBack} className="mb-4 text-sm underline">← Back to room</button>
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">This assignment references an unknown career track.</p>
      </div>
    );
  }

  const record = (s: ModuleScore) => {
    const all = [...scores, s];
    if (all.length < track.modules.length) {
      setScores(all);
      setIdx((i) => i + 1);
      return;
    }
    if (submitted) return;
    setSubmitted(true);
    // Identical transparent scoring to standalone Career Mode.
    const result: CareerAssessmentResult = scoreModules(track, all);
    const totalDur = track.modules.reduce((sum, m) => sum + m.durationSec, 0);
    onFinish({
      clientId: `career-${track.id}-${result.completedAt}`,
      exerciseId: `career:${track.id}`,
      exerciseVersion: "v3",
      scoringVersion: "v2.0.0",
      mode: "career",
      language: "en",
      durationSec: Math.max(30, totalDur),
      elapsedMs: Math.max(30000, totalDur * 1000),
      typedChars: Math.max(20, all.reduce((s, m) => s + Math.round((m.speedWpm * 5 * 30) / 60), 0)),
      correctChars: Math.max(10, all.reduce((s, m) => s + Math.round(((m.speedWpm * 5 * 30) / 60) * (m.accuracy / 100)), 0)),
      uncorrectedErrors: 0,
      pasteFlag: false,
      claimedWpm: Math.round(all.reduce((s, m) => s + m.speedWpm, 0) / Math.max(1, all.length)),
      claimedAccuracy: Math.round(all.reduce((s, m) => s + m.accuracy, 0) / Math.max(1, all.length)),
      integrity: all.some((m) => m.integrityFlags.length > 0) ? "flagged" : "ranked",
      metrics: { kind: "career", assessment: result as unknown as Record<string, unknown> },
    });
  };

  const mod: CareerModule | undefined = track.modules[idx];
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button type="button" onClick={onBack} className="mb-4 text-sm underline">← Back to room</button>
      <p className="text-center text-xs uppercase tracking-widest text-zinc-500">
        {assignment.title} · {track.name} · module {Math.min(idx + 1, track.modules.length)}/{track.modules.length}
      </p>
      <div className="mt-6">
        {mod?.kind === "typing" && (
          <TypingEngine
            key={`${track.id}-${idx}`}
            pool={[careerCorpus(mod.ref, mod.language, `${track.id}-${idx}`)]}
            language={mod.language}
            mode="copy-pro"
            durationSec={mod.durationSec}
            exerciseId={`career-${track.id}-${idx}`}
            onComplete={(r: TypingResult) =>
              record({
                label: mod.label,
                kind: "typing",
                accuracy: r.accuracy,
                speedWpm: r.grossWpm,
                efficiency: typingEfficiency(r.correctedErrors, r.typedChars),
                integrityFlags: r.integrity === "ranked" ? [] : [r.integrity],
              })
            }
          />
        )}
        {mod?.kind === "dictation" && (
          <DictationEngine
            key={mod.ref}
            item={findDictationClip(mod.ref)!}
            onComplete={(r: DictationResult) =>
              record({
                label: mod.label,
                kind: "dictation",
                accuracy: r.wordAccuracy,
                speedWpm: r.effectiveWpm,
                efficiency: audioEfficiency(r.playback.replayRatio),
                integrityFlags: r.integrity === "ranked" ? [] : [r.integrity],
              })
            }
          />
        )}
        {mod?.kind === "transcription" && (
          <TranscriptionEngine
            key={mod.ref}
            item={TRANSCRIPTION_CLIPS.find((c) => c.id === mod.ref)!}
            onComplete={(r: TranscriptionResult) =>
              record({
                label: mod.label,
                kind: "transcription",
                accuracy: r.wordAccuracy,
                speedWpm: r.effectiveWpm,
                efficiency: audioEfficiency(r.playback.replayRatio),
                integrityFlags: r.integrity === "ranked" ? [] : [r.integrity],
              })
            }
          />
        )}
      </div>
      <p className="mt-3 text-xs text-zinc-500">Practice/operational skills check — not a certification. Your completion score is derived from these real results.</p>
    </div>
  );
}
