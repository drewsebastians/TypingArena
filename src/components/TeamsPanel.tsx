"use client";
// Teams & Classrooms — create/join rooms, publish REAL assignments, aggregate
// dashboard. Assignments launch the actual TypingArena engines and completions
// are bound server-side to real attempt evidence (never an arbitrary score).
// Member emails never surface; display names/usernames only.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  completeAssignment,
  createAssignment,
  createTeam,
  deleteTeamAsOwner,
  fetchAssignments,
  fetchMyTeams,
  fetchTeamCompletions,
  fetchTeamMembers,
  joinTeamByCode,
  leaveTeam,
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
  const [state, setState] = useState<"loading" | "ready" | "unconfigured" | "signed-out">("loading");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    void import("@/lib/remote").then(({ getCurrentUser }) =>
      getCurrentUser().then((u) => {
        if (!u && IS_REMOTE_CONFIGURED) setState("signed-out");
      }),
    );
    void refresh();
  }, [refresh]);

  if (state === "unconfigured") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-black">{t("teams.title")}</h1>
        <p className="mt-3 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-900">{t("common.backendRequired")}</p>
      </div>
    );
  }

  if (activeId) {
    return <TeamDetail teamId={activeId} onBack={() => setActiveId(null)} />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">{t("teams.title")}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        For workplace teams, study groups and classrooms. Only public usernames are visible — never emails. Members see their own detailed results; admins see aggregates.
      </p>

      {state === "signed-out" && (
        <p className="mt-3 text-sm text-zinc-500">
          <Link href="/progress" className="underline">{t("common.signInFirst")}</Link>
        </p>
      )}

      {state === "ready" && (
        <>
          <div className="mt-6 flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              New team
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Data Entry Cohort A" maxLength={60} className="mt-1 block w-64 rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800" />
            </label>
            <button
              onClick={async () => {
                try {
                  await createTeam(sanitizeTitle(name));
                  setName("");
                  await refresh();
                  track("team_created", {});
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Create failed");
                }
              }}
              disabled={name.trim().length < 2}
              className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black"
            >
              {t("teams.createTeam")}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="JOIN CODE" aria-label="team code" className="w-36 rounded-lg border px-3 py-2 font-mono uppercase dark:bg-zinc-800" />
              <button
                onClick={async () => {
                  try {
                    await joinTeamByCode(code);
                    setCode("");
                    await refresh();
                    track("team_joined", {});
                  } catch (e) {
                    track("team_join_failed", {});
                    setError(e instanceof Error ? e.message : "Join failed");
                  }
                }}
                disabled={code.length < 6}
                className="rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-40"
              >
                {t("teams.joinByCode")}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-6 divide-y rounded-xl border bg-white dark:bg-zinc-900">
            {teams.length === 0 && <p className="px-4 py-6 text-center text-sm text-zinc-500">No teams yet — create one or join with a code.</p>}
            {teams.map((tm) => (
              <div key={tm.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex-1 font-semibold">{sanitizeTitle(tm.name)}</span>
                <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs dark:bg-zinc-800">{tm.join_code}</span>
                <span className={`text-xs font-bold uppercase ${tm.role === "owner" ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-500"}`}>{tm.role}</span>
                <button onClick={() => setActiveId(tm.id)} className="rounded-full border px-4 py-1.5 text-xs font-semibold">Open room →</button>
                {tm.role === "owner" ? (
                  <button onClick={async () => { if (!window.confirm(`Delete team "${tm.name}" and all its assignments?`)) return; await deleteTeamAsOwner(tm.id); await refresh(); }} className="text-xs text-red-600 underline">Delete</button>
                ) : (
                  <button onClick={async () => { await leaveTeam(tm.id); await refresh(); }} className="text-xs text-red-600 underline">Leave</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team detail: dashboard + assignment publishing + REAL member runs
// ---------------------------------------------------------------------------

function TeamDetail({ teamId, onBack }: { teamId: string; onBack: () => void }) {
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
        <button onClick={() => setRunningId(null)} className="mb-4 text-sm underline">← Back to room</button>
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
      <button onClick={onBack} className="mb-4 text-sm underline">← All teams</button>

      {/* Dashboard aggregation */}
      <h2 className="font-bold">Room dashboard</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <Stat label="Members" value={String(members.length)} />
        <Stat label="Assignments" value={String(assignments.length)} />
        <Stat label="Completions" value={String(completions.length)} />
        <Stat label="Overall rate" value={`${overallRate}%`} />
      </div>

      {/* Admin: create assignment */}
      <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h3 className="text-sm font-bold">Publish an assignment</h3>
        <p className="mt-1 text-xs text-zinc-500">Members run the actual exercise here; their completion score is computed from the real result.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 3 — numeric records" aria-label="assignment title" className="w-56 rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800" />
          <select value={kind} onChange={(e) => setKind(e.target.value as AssignmentKind)} aria-label="assignment kind" className="rounded-lg border px-2 py-2 text-sm capitalize dark:bg-zinc-800">
            {ASSIGNMENT_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          {kind === "career" ? (
            <select value={careerTrackId} onChange={(e) => setCareerTrackId(e.target.value)} aria-label="career track" className="max-w-[16rem] rounded-lg border px-2 py-2 text-sm dark:bg-zinc-800">
              {CAREER_TRACKS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : TYPING_KINDS.has(kind) ? (
            <>
              <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} aria-label="assignment language" className="rounded-lg border px-2 py-2 text-sm dark:bg-zinc-800">
                <option value="en">English</option>
                <option value="id">Indonesia</option>
              </select>
              <label className="text-xs text-zinc-500">
                Duration
                <input type="number" min={15} max={300} step={15} value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))} aria-label="assignment duration seconds" className="ml-1 w-20 rounded-lg border px-2 py-1.5 text-sm dark:bg-zinc-800" />
              </label>
            </>
          ) : (
            <select value={clipRef} onChange={(e) => setClipRef(e.target.value)} aria-label="audio clip" className="max-w-[16rem] rounded-lg border px-2 py-2 text-sm dark:bg-zinc-800">
              {(kind === "dictation" ? DICTATION_CLIPS : TRANSCRIPTION_CLIPS).map((c) => (
                <option key={c.id} value={c.id}>{c.id} ({c.language})</option>
              ))}
            </select>
          )}
          <label className="text-xs text-zinc-500">
            Due
            <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} aria-label="due date" className="ml-1 rounded-lg border px-2 py-1.5 text-sm dark:bg-zinc-800" />
          </label>
          <button
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
            className="rounded-full bg-black px-5 py-2 text-xs font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black"
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
                    onClick={() => setRunningId(a.id)}
                    disabled={busy}
                    className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-black"
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
        <button onClick={onBack} className="mb-4 text-sm underline">← Back to room</button>
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
      <button onClick={onBack} className="mb-4 text-sm underline">← Back to room</button>
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
