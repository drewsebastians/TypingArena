"use client";
// Employer skills assessments — practice/operational assessment only.
// Creator builds a module sequence; candidates complete via invite link
// Results are private to the organizer.
import { useEffect, useState } from "react";
import type { InviteState } from "@/lib/remote";
import {
  createAssessment,
  fetchAssessmentDefinition,
  fetchAssessmentResults,
  fetchMyAssessments,
  issueResourceManagementToken,
  recoverResourceManagement,
  revokeResourceManagementToken,
  revokeAssessmentInvite,
  submitAssessmentResult,
  InviteInvalidError,
  type AssessmentRecord,
} from "@/lib/remote";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import { sanitizeTitle } from "@/lib/sanitize";
import TypingEngine from "@/components/TypingEngine";
import DictationEngine from "@/components/DictationEngine";
import TranscriptionEngine from "@/components/TranscriptionEngine";
import { ENGLISH_CORPUS } from "@/lib/content/english";
import { findDictationClip, findTranscriptionClip } from "@/lib/content/dictation";
import { t } from "@/lib/i18n";
import type { CorpusItem, DictationResult, TranscriptionResult, TypingResult } from "@/lib/types";
import { track } from "@/lib/analytics";
import { parseManageFragment } from "@/lib/resourceAccess";

const MODULE_LIBRARY: Array<{ kind: string; ref: string; durationSec: number; label: string }> = [
  { kind: "typing-sprint", ref: "sprint", durationSec: 30, label: "Sprint 30s" },
  { kind: "typing-numbers", ref: "numbers", durationSec: 30, label: "Data entry 30s" },
  { kind: "dictation", ref: "dict-en-005", durationSec: 60, label: "Business dictation" },
  { kind: "transcription", ref: "trans-en-002", durationSec: 120, label: "Office transcription clip" },
];

export default function AssessmentsPanel() {
  const [invite, setInvite] = useState<string | null>(null);
  const [manage, setManage] = useState<{ id: string; token: string } | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const inv = p.get("invite");
    if (inv) setInvite(inv.toUpperCase());
    const manageId = p.get("manage");
    const token = parseManageFragment(window.location.hash);
    if (manageId && token) setManage({ id: manageId, token });
  }, []);

  if (invite) return <CandidateFlow invite={invite} />;
  if (manage) return <RecoverAssessment resource={manage} />;
  return <CreatorPanel />;
}

function RecoverAssessment({ resource }: { resource: { id: string; token: string } }) {
  const [message, setMessage] = useState("Recovering workspace…");
  const [recovered, setRecovered] = useState(false);
  useEffect(() => {
    recoverResourceManagement("assessment", resource.id, resource.token)
      .then(() => {
        track("manage_link_recovered", { resourceType: "assessment" });
        window.history.replaceState({}, "", window.location.pathname);
        setRecovered(true);
      })
      .catch((e: unknown) => setMessage(e instanceof Error ? e.message : "Management link is invalid or expired"));
  }, [resource.id, resource.token]);
  if (recovered) return <CreatorPanel />;
  return <div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-2xl font-black">Workspace recovery</h1><p role="status" className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{message}</p></div>;
}

// ---------------------------------------------------------------------------
// Candidate flow (invite link identifies the assessment)
//
// The module sequence is resolved FROM THE SAVED ASSESSMENT DEFINITION via the
// invite token — never a client-side default list. The server validates invite
// status/expiry and rejects result payloads that do not describe the defined
// modules with plausible metrics.
// ---------------------------------------------------------------------------

interface CandidateModuleResult {
  label: string;
  kind: string;
  ref: string;
  wpm: number;
  accuracy: number;
}

type CandidateState = "resolving" | "intro" | "ready" | "invalid" | "done";
interface CandidateRejection {
  heading: string;
  detail: string;
}

function CandidateFlow({ invite }: { invite: string }) {
  const [state, setState] = useState<CandidateState>("resolving");
  const [rejection, setRejection] = useState<CandidateRejection | null>(null);
  const [title, setTitle] = useState("");
  const [modules, setModules] = useState<AssessmentRecord["modules"]>([]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<CandidateModuleResult[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [candidateKey] = useState(() => `c_${Math.random().toString(36).slice(2, 10)}`);

  // Resolve the exact saved definition for this invite, distinguishing every
  // lifecycle failure honestly (invalid / revoked / not open / expired).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const def = await fetchAssessmentDefinition(invite);
        if (cancelled) return;
        setTitle(def.title);
        setModules(def.modules);
        setState("intro");
      } catch (e) {
        if (!cancelled) {
          track("assessment_invite_invalid", {});
          const state: InviteState =
            e instanceof InviteInvalidError ? e.state : "invalid";
          setRejection({
            heading:
              state === "revoked" ? "Invite revoked"
              : state === "expired" ? "Invite expired"
              : state === "not_open" ? "Assessment not open yet"
              : "Invite invalid",
            detail:
              state === "revoked" ? "The organizer has withdrawn this assessment link."
              : state === "expired" ? "This assessment window has closed. Ask the organizer for a fresh invite."
              : state === "not_open" ? "The organizer has not opened this assessment yet. Check back later."
              : "This assessment link could not be validated. Ask the organizer for a fresh invite link.",
          });
          setState("invalid");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invite]);

  // Submission fires from an effect once all modules are recorded — never
  // during render.
  useEffect(() => {
    if (state !== "ready" || idx < modules.length || idx === 0) return;
    let cancelled = false;
    (async () => {
      try {
        await submitAssessmentResult({
          inviteCode: invite,
          candidateKey,
          results: { modules: results },
          flags,
        });
        if (!cancelled) {
          setState("done");
          track("assessment_completed", { modules: modules.length });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Submission failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, idx, modules.length, invite, candidateKey, results, flags]);

  const record = (
    mod: AssessmentRecord["modules"][number],
    r: { grossWpm?: number; effectiveWpm?: number; accuracy?: number; wordAccuracy?: number },
    integrity: string,
  ) => {
    setResults((prev) => [
      ...prev,
      {
        label: mod.label,
        kind: mod.kind,
        ref: mod.ref,
        wpm: r.grossWpm ?? r.effectiveWpm ?? 0,
        accuracy: r.accuracy ?? r.wordAccuracy ?? 0,
      },
    ]);
    if (integrity !== "ranked") setFlags((f) => [...f, integrity]);
    setIdx((i) => i + 1);
  };

  if (state === "resolving") {
    return <p className="py-16 text-center text-sm text-zinc-500">Validating invite…</p>;
  }

  if (state === "invalid" && rejection) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black">{rejection.heading}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{rejection.detail}</p>
      </div>
    );
  }

  if (state === "intro") {
    const approximateSeconds = modules.reduce((sum, module) => sum + Number(module.durationSec ?? 0), 0);
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-2xl border bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Practice assessment</p>
          <h1 className="mt-2 text-2xl font-black">{sanitizeTitle(title)}</h1>
          <div className="mt-5 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"><div className="text-2xl font-black">{modules.length}</div><div className="text-xs text-zinc-500">modules</div></div>
            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"><div className="text-2xl font-black">{approximateSeconds > 0 ? `${Math.ceil(approximateSeconds / 60)} min` : "—"}</div><div className="text-xs text-zinc-500">approx. duration</div></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">Complete the saved modules in order. Your results are shared with the organizer for this assessment; individual answers are not published publicly.</p>
          <button type="button" onClick={() => { setState("ready"); track("assessment_begin_clicked", { modules: modules.length }); }} className="mt-5 min-h-11 rounded-full bg-black px-6 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">Begin assessment →</button>
        </div>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black">Assessment complete ✓</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Thank you — your completion has been recorded and the organizer can now see your summary. Your individual answers stay private to the organizer.
        </p>
      </div>
    );
  }

  if (idx >= modules.length) {
    return <p className="py-16 text-center text-sm text-zinc-500">Submitting…</p>;
  }

  const mod = modules[idx];
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <p className="text-center text-xs uppercase tracking-widest text-zinc-500">
        {sanitizeTitle(title)} · module {idx + 1}/{modules.length} · practice/operational assessment
      </p>
      <div className="mt-6">
        {mod.kind.startsWith("typing") && (
          <TypingEngine
            key={`${mod.kind}-${mod.ref}-${idx}`}
            pool={[pickAssessmentItem(mod.ref)]}
            language="en"
            mode={mod.kind === "typing-numbers" ? "numbers" : "sprint"}
            durationSec={mod.durationSec ?? 30}
            exerciseId={`assess-${mod.ref}`}
            onComplete={(r: TypingResult) => record(mod, r, r.integrity)}
          />
        )}
        {mod.kind === "dictation" && (
          <DictationEngine key={`${mod.kind}-${mod.ref}-${idx}`} item={findDictationClip(mod.ref)!} onComplete={(r: DictationResult) => record(mod, r, r.integrity)} />
        )}
        {mod.kind === "transcription" && (
          <TranscriptionEngine key={`${mod.kind}-${mod.ref}-${idx}`} item={findTranscriptionClip(mod.ref)!} onComplete={(r: TranscriptionResult) => record(mod, r, r.integrity)} />
        )}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function pickAssessmentItem(modeRef: string): CorpusItem {
  const pool = ENGLISH_CORPUS.filter((c) => c.mode === modeRef);
  const arr = pool.length > 0 ? pool : ENGLISH_CORPUS.filter((c) => c.mode === "sprint");
  return arr[0];
}

// ---------------------------------------------------------------------------
// Creator / admin view
// ---------------------------------------------------------------------------

function CreatorPanel() {
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<number[]>([0, 1]);
  const [list, setList] = useState<AssessmentRecord[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [managementLinks, setManagementLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!IS_REMOTE_CONFIGURED) return;
    void fetchMyAssessments()
      .then(setList)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load your assessments"));
  }, []);

  if (!IS_REMOTE_CONFIGURED) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <p className="mt-3 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-900">{t("common.backendRequired")}</p>
      </div>
    );
  }

  if (openId) return <ResultsView assessmentId={openId} onBack={() => setOpenId(null)} />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Data-entry screening v1" aria-label="assessment title" maxLength={80} className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800" />
        <fieldset className="mt-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Modules</legend>
          <div className="mt-2 flex flex-col gap-2">
            {MODULE_LIBRARY.map((m, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(i)}
                  onChange={(e) => setSelected((prev) => (e.target.checked ? [...prev, i] : prev.filter((x) => x !== i)))}
                />
                {m.label}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          onClick={async () => {
            try {
              const created = await createAssessment({
                title: sanitizeTitle(title),
                modules: selected.map((i) => MODULE_LIBRARY[i]),
              });
              const management = await issueResourceManagementToken("assessment", created.id);
              setManagementLinks((prev) => ({ ...prev, [created.id]: `${window.location.origin}${window.location.pathname}?manage=${created.id}#manage=${management.token}` }));
              track("assessment_created", {});
              track("manage_link_created", { resourceType: "assessment" });
              setList(await fetchMyAssessments());
              setTitle("");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Create failed");
            }
          }}
          disabled={title.trim().length < 2 || selected.length === 0}
          className="mt-4 min-h-11 rounded-full bg-black px-6 py-2 text-sm font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          Create + generate invite link
        </button>
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <h3 className="mt-8 font-bold">My assessments</h3>
      <div className="mt-2 divide-y rounded-xl border bg-white dark:bg-zinc-900">
        {list.length === 0 && <p className="px-4 py-5 text-center text-sm text-zinc-500">Nothing yet.</p>}
        {list.map((a) => (
          <div key={a.id}>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className="flex-1 font-semibold">{sanitizeTitle(a.title)}</span>
            <code className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs dark:bg-zinc-800">{a.invite_code}</code>
            <button type="button" onClick={() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?invite=${a.invite_code}`)} className="min-h-11 rounded-full border px-3 py-1 text-xs">Copy invite</button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const management = await issueResourceManagementToken("assessment", a.id);
                  const link = `${window.location.origin}${window.location.pathname}?manage=${a.id}#manage=${management.token}`;
                  setManagementLinks((prev) => ({ ...prev, [a.id]: link }));
                  await navigator.clipboard.writeText(link);
                  track("manage_link_created", { resourceType: "assessment" });
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not create management link");
                }
              }}
              className="min-h-11 rounded-full border px-3 py-1 text-xs"
            >
              Copy management link
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("Revoke active management links for this assessment?")) return;
                try {
                  await revokeResourceManagementToken("assessment", a.id);
                  setManagementLinks((prev) => {
                    const next = { ...prev };
                    delete next[a.id];
                    return next;
                  });
                  track("manage_link_revoked", { resourceType: "assessment" });
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not revoke management links");
                }
              }}
              className="min-h-11 text-xs text-red-600 underline"
            >
              Revoke management links
            </button>
            <button type="button" onClick={() => setOpenId(a.id)} className="min-h-11 rounded-full border px-3 py-1 text-xs font-semibold">Results →</button>
            {a.revoked ? (
              <span className="text-xs font-bold uppercase text-red-600">revoked</span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm("Revoke this invite? Candidates with the link will be told it was revoked.")) return;
                  try {
                    await revokeAssessmentInvite(a.id);
                    track("assessment_invite_revoked", {});
                    setList(await fetchMyAssessments());
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Revoke failed");
                  }
                }}
                className="min-h-11 text-xs text-red-600 underline"
              >
                Revoke
              </button>
            )}
            </div>
            {managementLinks[a.id] && <p className="mx-4 mb-3 break-all rounded bg-amber-50 p-2 font-mono text-[11px] text-amber-900 dark:bg-amber-950 dark:text-amber-100">Keep this management link private: {managementLinks[a.id]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsView({ assessmentId, onBack }: { assessmentId: string; onBack: () => void }) {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof fetchAssessmentResults>>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    void fetchAssessmentResults(assessmentId)
      .then(setRows)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "Could not load results"));
  }, [assessmentId]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button type="button" onClick={onBack} className="mb-3 min-h-11 text-sm underline">← my assessments</button>
      <h2 className="text-xl font-bold">Candidate summaries</h2>
      {loadError && (
        <p role="alert" className="mt-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </p>
      )}
      {!loadError && (
        <div className="mt-3 divide-y rounded-xl border bg-white dark:bg-zinc-900">
          {rows.length === 0 && <p className="px-4 py-6 text-center text-sm text-zinc-500">No completions yet — share the invite link.</p>}
          {rows.map((r, i) => {
            const mods = ((r.results as { modules?: CandidateModuleResult[] }).modules ?? []);
            const avgAcc = mods.length ? Math.round(mods.reduce((s, m) => s + m.accuracy, 0) / mods.length) : 0;
            return (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{r.label}</span>
                  <span className="text-xs text-zinc-500">{new Date(r.completed_at).toLocaleString()}</span>
                </div>
                <ul className="mt-1 text-xs text-zinc-500">
                  {mods.map((m, j) => (
                    <li key={j}>{m.label}: {Math.round(m.wpm)} WPM · {Math.round(m.accuracy)}%</li>
                  ))}
                </ul>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span>Avg accuracy {avgAcc}%</span>
                  {r.integrity_flags.length > 0 && <span className="font-bold text-red-600">flags: {r.integrity_flags.join(", ")}</span>}
                  {r.integrity_flags.length === 0 && <span className="font-bold text-emerald-700 dark:text-emerald-300">clean run</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
