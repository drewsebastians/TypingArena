"use client";
// Account panel — optional magic-link auth, public username management,
// one-shot local-history migration, sign-out and remote data deletion.
import { useEffect, useState } from "react";
import {
  exportAllResults,
  getUsername,
  markMigratedToAccount,
  setUsername,
  wasMigratedToAccount,
} from "@/lib/history";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import { audioEvidence, flushQueue, hydrateFromRemote, markIdsSynced, typingEvidence } from "@/lib/sync";
import {
  deleteMyAccount,
  migrateLocalHistory,
  onAuthChange,
  signInWithEmail,
  signOutUser,
  updateUsername,
  type AccountUser,
} from "@/lib/remote";
import { track } from "@/lib/analytics";

export default function AccountPanel({ onChanged }: { onChanged: () => void }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setName(getUsername() ?? "");
    if (!IS_REMOTE_CONFIGURED) return;
    const unsub = onAuthChange((u) => setUser(u));
    return () => void unsub();
  }, []);

  // Hydrate + flush whenever a session appears (covers fresh devices).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const report = await hydrateFromRemote();
        await flushQueue();
        const restored =
          report.addedTyping + report.addedDictation + report.addedTranscription + report.addedCareer;
        if (!cancelled && restored > 0) {
          setMsg(`Synced ${restored} results from your account.`);
          onChanged();
        }
      } catch {
        /* offline: local-first practice continues; retry on next load */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, onChanged]);

  if (!IS_REMOTE_CONFIGURED) {
    return (
      <div className="mt-4 rounded-xl border bg-zinc-50 p-4 text-xs text-zinc-500 dark:bg-zinc-900">
        Accounts &amp; cross-device sync activate when the competition backend is configured. Local progress works fully offline.
      </div>
    );
  }

  const migrateIfNeeded = async () => {
    if (!user || wasMigratedToAccount()) {
      await flushQueue();
      return;
    }
    const all = exportAllResults();
    const payloads = [
      // Migration copies stay practice locally-flagged server-side; the
      // server re-derives everything and never auto-ranks imported rows.
      ...all.typing.map((r) => ({ ...typingEvidence(r), integrity: r.integrity === "ranked" ? ("practice" as const) : r.integrity })),
      ...all.dictation.map((r) => audioEvidence(r, "dictation")),
      ...all.transcription.map((r) => audioEvidence(r, "transcription")),
    ];
    try {
      const { migrated } = await migrateLocalHistory(payloads);
      markIdsSynced(payloads.map((p) => p.clientId));
      markMigratedToAccount();
      setMsg(`Imported ${migrated} local results. History now syncs across devices.`);
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Migration failed — local data kept.");
    }
  };

  return (
    <div className="mt-4 rounded-xl border bg-white p-4 dark:bg-zinc-900">
      <h2 className="text-sm font-bold">Account</h2>
      {user ? (
        <>
          <p className="mt-1 text-sm">
            Signed in as <span className="font-mono">{user.email}</span> (private — never shown publicly)
          </p>
          <label htmlFor="public-name" className="mt-2 block text-xs font-medium">Public leaderboard username</label>
          <div className="mt-1 flex gap-2">
            <input
              id="public-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              className="flex-1 rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800"
              placeholder="how others see you"
            />
            <button
              onClick={async () => {
                try {
                  await updateUsername(name.trim());
                  setUsername(name.trim());
                  setMsg("Username saved.");
                  onChanged();
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Save failed");
                }
              }}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              Save
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {!wasMigratedToAccount() && (
              <button onClick={() => void migrateIfNeeded()} className="rounded-full border px-4 py-1.5">Import local history →</button>
            )}
            <button
              onClick={async () => {
                try {
                  await signOutUser();
                  track("account_signout", {});
                  setUser(null);
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Sign-out failed");
                }
              }}
              className="rounded-full border px-4 py-1.5"
            >
              Sign out
            </button>
            <button
              onClick={async () => {
                if (!window.confirm("Permanently delete your account AND all data (history, profile)? This cannot be undone.")) return;
                try {
                  await deleteMyAccount();
                  setMsg("Account and all data permanently deleted.");
                  setUser(null);
                  track("account_deleted", {});
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Deletion failed");
                }
              }}
              className="rounded-full border border-red-300 px-4 py-1.5 text-red-700"
            >
              Delete account
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Optional — sign in to sync history across devices and enter ranked boards.</p>
          {magicSent ? (
            <p role="status" className="mt-2 text-sm text-emerald-700">Check your inbox for the sign-in link.</p>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="email address"
                className="flex-1 rounded-lg border px-3 py-2 text-sm dark:bg-zinc-800"
              />
              <button
                onClick={async () => {
                  setErr(null);
                  try {
                    await signInWithEmail(email.trim());
                    setMagicSent(true);
                    track("account_login", { stage: "otp-sent" });
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : "Sign-in failed");
                  }
                }}
                disabled={!email.includes("@")}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black"
              >
                Email me a link
              </button>
            </div>
          )}
        </>
      )}
      {msg && <p role="status" className="mt-2 text-xs text-emerald-700">{msg}</p>}
      {err && <p role="alert" className="mt-2 text-xs text-red-600">{err}</p>}
    </div>
  );
}
