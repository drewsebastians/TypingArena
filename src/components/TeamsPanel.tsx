"use client";
// Teams & Classrooms — create/join rooms, publish assignments, aggregate
// dashboard. Member emails never surface; display names/usernames only.
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
  joinTeamByCode,
  leaveTeam,
  type AssignmentRecord,
  type TeamRecord,
} from "@/lib/remote";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import { sanitizeTitle } from "@/lib/sanitize";
import { t } from "@/lib/i18n";
import { track } from "@/lib/analytics";

const ASSIGNMENT_KINDS = ["sprint", "copy-pro", "numbers", "dictation", "transcription", "career"] as const;

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

function TeamDetail({ teamId, onBack }: { teamId: string; onBack: () => void }) {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [completions, setCompletions] = useState<Array<{ assignment_id: string; user_id: string; username: string | null; score: number; completed_at: string }>>([]);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<string>("sprint");
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    void (async () => {
      setAssignments(await fetchAssignments(teamId).catch(() => []));
      setCompletions(await fetchTeamCompletions(teamId).catch(() => []));
    })();
  }, [teamId]);

  const completionRate =
    assignments.length === 0
      ? 0
      : Math.round((new Set(completions.map((c) => c.assignment_id)).size / assignments.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button onClick={onBack} className="mb-4 text-sm underline">← All teams</button>

      {/* Dashboard aggregation */}
      <h2 className="font-bold">Room dashboard</h2>
      <div className="mt-2 grid grid-cols-3 gap-3 text-center">
        <Stat label="Assignments" value={String(assignments.length)} />
        <Stat label="Completions" value={String(completions.length)} />
        <Stat label="Avg score" value={completions.length ? String(Math.round(completions.reduce((s, c) => s + c.score, 0) / completions.length)) : "—"} />
      </div>
      <p className="mt-1 text-xs text-zinc-500">{completionRate}% of assignments have at least one completion.</p>

      {/* Admin: create assignment */}
      <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h3 className="text-sm font-bold">Publish an assignment</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 3 — numeric records" aria-label="assignment title" className="w-56 rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800" />
          <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="assignment kind" className="rounded-lg border px-2 py-2 text-sm dark:bg-zinc-800">
            {ASSIGNMENT_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <button
            onClick={async () => {
              await createAssignment(teamId, { title: sanitizeTitle(title), kind });
              setTitle("");
              setAssignments(await fetchAssignments(teamId));
            }}
            disabled={title.trim().length < 2}
            className="rounded-full bg-black px-5 py-2 text-xs font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Assignment list + completions */}
      <div className="mt-4 divide-y rounded-xl border bg-white dark:bg-zinc-900">
        {assignments.map((a) => {
          const rows = completions.filter((c) => c.assignment_id === a.id);
          const isDone = done.has(a.id);
          return (
            <div key={a.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-zinc-500">{a.kind}{a.due_at ? ` · due ${new Date(a.due_at).toLocaleDateString()}` : ""}</div>
                </div>
                {!isDone ? (
                  <button
                    onClick={() => {
                      completeAssignment(a.id, 100)
                        .then(() => {
                          setDone(new Set([...done, a.id]));
                          void fetchTeamCompletions(teamId).then(setCompletions);
                          track("assignment_completed", { assignmentId: a.id });
                        })
                        .catch(() => undefined);
                    }}
                    className="rounded-full border px-4 py-1.5 text-xs font-semibold"
                  >
                    Mark complete
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">COMPLETED</span>
                )}
              </div>
              {rows.length > 0 && (
                <ul className="mt-2 text-xs text-zinc-500">
                  {rows.map((r, i) => (
                    <li key={i}>👤 @{r.username} — score {r.score} · {new Date(r.completed_at).toLocaleDateString()}</li>
                  ))}
                </ul>
              )}
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
