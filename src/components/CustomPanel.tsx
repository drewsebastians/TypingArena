"use client";
// Custom tests — user-created practice content. Practice-only by design:
// custom content NEVER enters official ranked boards (server enforces mode
// 'custom-practice' invisibility on public views).
import { useEffect, useState } from "react";
import TypingEngine from "@/components/TypingEngine";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import {
  createCustomTest,
  fetchCustomTest,
  fetchMyCustomTests,
  issueResourceManagementToken,
  recoverResourceManagement,
  revokeResourceManagementToken,
  type CustomTestRecord,
} from "@/lib/remote";
import { sanitizeCustomText, sanitizeTitle } from "@/lib/sanitize";
import { t } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import type { CorpusItem, Language, TypingResult } from "@/lib/types";
import { parseManageFragment, stripManageFragment } from "@/lib/resourceAccess";

function asCorpusItem(test: CustomTestRecord): CorpusItem {
  return {
    id: `custom-${test.id}`,
    text: test.body,
    language: test.language,
    mode: "sprint",
    difficulty: "medium",
    source: "user-custom",
    tags: [],
    charCount: test.body.length,
    wordCount: test.body.trim().split(/\s+/).filter(Boolean).length,
    punctuationTypes: [],
  };
}

export default function CustomPanel() {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [mine, setMine] = useState<CustomTestRecord[]>([]);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"private" | "unlisted">("unlisted");
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [managementLinks, setManagementLinks] = useState<Record<string, string>>({});
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!IS_REMOTE_CONFIGURED) return;
    let cancelled = false;
    const load = async () => {
      const params = new URLSearchParams(window.location.search);
      const manageId = params.get("manage");
      const token = parseManageFragment(window.location.hash);
      try {
        if (manageId && token) {
          setRecovering(true);
          await recoverResourceManagement("custom", manageId, token);
          if (cancelled) return;
          track("manage_link_recovered", { resourceType: "custom" });
          const url = new URL(window.location.href);
          url.searchParams.delete("manage");
          url.hash = stripManageFragment(url.hash);
          window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        }
        const testId = params.get("test");
        if (testId && !manageId) {
          if (!cancelled) setViewingId(testId.toUpperCase());
          return;
        }
        const list = await fetchMyCustomTests();
        if (!cancelled) setMine(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load your tests");
      } finally {
        if (!cancelled) setRecovering(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- recipient view: complete someone's shared test -----------------------
  if (viewingId) {
    return <TakeCustomTest testId={viewingId} onBack={() => setViewingId(null)} />;
  }

  if (!IS_REMOTE_CONFIGURED) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-black">{t("custom.title")}</h1>
        <p className="mt-3 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-900">{t("common.backendRequired")}</p>
      </div>
    );
  }

  if (recovering) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black">Workspace recovery</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Recovering your custom test workspace…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">{t("custom.title")}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Your own practice passages with share links. Content is sanitized and length-limited; custom tests are practice-only and never enter global ranked boards.
      </p>

      <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <label htmlFor="ct-title" className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">Title</label>
        <input id="ct-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Invoice drill" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800" />
        <div className="mt-2 flex gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Language
            <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="ml-2 rounded-lg border px-2 py-1 dark:bg-zinc-800">
              <option value="en">English</option>
              <option value="id">Indonesia</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Visibility
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as "private" | "unlisted")} className="ml-2 rounded-lg border px-2 py-1 dark:bg-zinc-800">
              <option value="unlisted">Unlisted link</option>
              <option value="private">Private</option>
            </select>
          </label>
        </div>
        <label htmlFor="ct-body" className="mt-3 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Passage ({body.length}/4000)</label>
        <textarea id="ct-body" value={body} onChange={(e) => setBody(e.target.value.slice(0, 4000))} rows={6} placeholder="Paste or write the practice passage—" className="mt-1 w-full rounded-lg border p-3 font-mono text-sm dark:bg-zinc-800" />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={async () => {
              setError(null);
              try {
                const cleanTitle = sanitizeTitle(title);
                const cleanBody = sanitizeCustomText(body);
                if (cleanTitle.length < 2 || cleanBody.length < 10) {
                  setError("Title >= 2 chars and passage >= 10 chars required.");
                  return;
                }
                const id = await createCustomTest({ title: cleanTitle, language, body: cleanBody, visibility });
                const management = await issueResourceManagementToken("custom", id);
                track("custom_test_created", {});
                track("manage_link_created", { resourceType: "custom" });
                const shareLink = `${window.location.origin}${window.location.pathname}?test=${id}`;
                const managementLink = `${window.location.origin}${window.location.pathname}?manage=${id}#manage=${management.token}`;
                setCreatedId(id);
                setCreatedLink(shareLink);
                setManagementLinks((prev) => ({ ...prev, [id]: managementLink }));
                setMine(await fetchMyCustomTests());
                setTitle("");
                setBody("");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Create failed");
              }
            }}
            disabled={title.trim().length < 2 || body.trim().length < 10}
            className="rounded-full bg-black px-6 py-2 text-sm font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {t("custom.create")}
          </button>
          {error && <span role="alert" className="text-sm text-red-600">{error}</span>}
        </div>
        {createdLink && (
          <div className="mt-3 space-y-2 text-xs">
            <p className="break-all rounded bg-emerald-50 p-2 font-mono text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Share link: {createdLink}</p>
            {createdId && managementLinks[createdId] && <p className="break-all rounded bg-amber-50 p-2 font-mono text-amber-900 dark:bg-amber-950 dark:text-amber-100">Private management link: {managementLinks[createdId]}</p>}
          </div>
        )}
      </div>

      <h3 className="mt-8 font-bold">My tests</h3>
      <div className="mt-2 divide-y rounded-xl border bg-white dark:bg-zinc-900">
        {mine.length === 0 && <p className="px-4 py-5 text-center text-sm text-zinc-500">Nothing yet.</p>}
        {mine.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className="flex-1 font-semibold">{sanitizeTitle(m.title)}</span>
            <span className="mr-3 text-xs text-zinc-500">{m.language} · {m.visibility}</span>
            <button onClick={() => setViewingId(m.id)} className="rounded-full border px-4 py-1.5 text-xs font-semibold">Open →</button>
            <button
              onClick={async () => {
                try {
                  const management = await issueResourceManagementToken("custom", m.id);
                  const link = `${window.location.origin}${window.location.pathname}?manage=${m.id}#manage=${management.token}`;
                  setManagementLinks((prev) => ({ ...prev, [m.id]: link }));
                  await navigator.clipboard.writeText(link);
                  track("manage_link_created", { resourceType: "custom" });
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not create management link");
                }
              }}
              className="rounded-full border px-3 py-1.5 text-xs"
            >
              Copy management link
            </button>
            <button
              onClick={async () => {
                if (!window.confirm("Revoke active management links for this test?")) return;
                try {
                  await revokeResourceManagementToken("custom", m.id);
                  setManagementLinks((prev) => {
                    const next = { ...prev };
                    delete next[m.id];
                    return next;
                  });
                  track("manage_link_revoked", { resourceType: "custom" });
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not revoke management links");
                }
              }}
              className="text-xs text-red-600 underline"
            >
              Revoke links
            </button>
            {managementLinks[m.id] && <p className="w-full break-all rounded bg-amber-50 p-2 font-mono text-[11px] text-amber-900 dark:bg-amber-950 dark:text-amber-100">Keep this management link private: {managementLinks[m.id]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TakeCustomTest({ testId, onBack }: { testId: string; onBack: () => void }) {
  const [test, setTest] = useState<CustomTestRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TypingResult | null>(null);

  useEffect(() => {
    fetchCustomTest(testId)
      .then((t) => {
        setTest(t);
        track("custom_test_run", { language: t.language });
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Load failed"));
  }, [testId]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-center text-sm text-red-700">{error}</p>
        <button onClick={onBack} className="mt-3 underline text-sm">← back</button>
      </div>
    );
  }
  if (!test) return <p className="py-16 text-center text-sm text-zinc-500">{t("common.loading")}</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button onClick={onBack} className="mb-3 text-sm underline">| all custom tests</button>
      <h1 className="text-2xl font-black">{sanitizeTitle(test.title)}</h1>
      <p className="text-xs uppercase tracking-widest text-zinc-500">Custom practice · {test.language === "en" ? "English" : "Bahasa Indonesia"} · practice-only</p>

      {!result ? (
        <div className="mt-6">
          <TypingEngine pool={[asCorpusItem(test)]} language={test.language} mode="sprint" durationSec={60} exerciseId={`custom-${test.id}`} onComplete={setResult} />
        </div>
      ) : (
        <div className="mt-6 rounded-xl border bg-white p-6 dark:bg-zinc-900">
          <h2 className="font-bold">Result — saved locally as practice{` `}
            {IS_REMOTE_CONFIGURED && "(shared only when you choose to publish; never ranked)"}
          </h2>
          <div className="mt-2 grid grid-cols-3 gap-3 text-center">
            <div><div className="text-xs text-zinc-500">WPM</div><div className="text-2xl font-black">{result.grossWpm}</div></div>
            <div><div className="text-xs text-zinc-500">Accuracy</div><div className="text-2xl font-black">{result.accuracy}%</div></div>
            <div><div className="text-xs text-zinc-500">Integrity</div><div className="text-sm font-bold">{result.integrity}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
