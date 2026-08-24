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
import {
  deleteMyRemoteData,
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

  if (!IS_REMOTE_CONFIGURED) {
    return (
      <div className="mt-4 rounded-xl border bg-zinc-50 p-4 text-xs text-zinc-500 dark:bg-zinc-900">
        Accounts &amp; cross-device sync activate when the competition backend is configured. Local progress works fully offline.
      </div>
    );
  }

  const migrateIfNeeded = async () => {
    if (!user || wasMigratedToAccount()) return;
    const all = exportAllResults();
    const payloads: Parameters<typeof migrateLocalHistory>[0] = [
      ...all.typing.map((r) => ({
        exerciseId: r.exerciseId,
        exerciseVersion: r.exerciseVersion,
        scoringVersion: r.scoringVersion,
        mode: r.mode,
        language: r.language,
        durationSec: r.durationSec,
        elapsedMs: r.elapsedMs,
        wpm: r.grossWpm,
        accuracy: r.accuracy,
        integrity: r.integrity,
        challengeDate: r.challengeDate,
        typedChars: r.typedChars,
        uncorrectedErrors: r.uncorrectedErrors,
      })),
      ...all.dictation.map((r) => ({
        exerciseId: r.exerciseId,
        exerciseVersion: r.exerciseVersion,
        scoringVersion: r.scoringVersion,
        normalizationVersion: r.normalizationVersion,
        mode: "dictation" as const,
        language: r.language,
        durationSec: 60,
        elapsedMs: r.completionMs,
        wpm: r.effectiveWpm,
        accuracy: r.wordAccuracy,
        integrity: r.integrity,
        typedChars: 0,
        uncorrectedErrors: 0,
      })),
    ];
    try {
      await migrateLocalHistory(payloads);
      markMigratedToAccount();
      setMsg(`Imported ${payloads.length} local results to your account.`);
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
                if (!window.confirm("Delete ALL account data (attempts, profile)? This cannot be undone.")) return;
                try {
                  await deleteMyRemoteData();
                  await signOutUser();
                  setMsg("All remote account data deleted.");
                  setUser(null);
                  track("history_deleted", { scope: "remote-account" });
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Deletion failed");
                }
              }}
              className="rounded-full border border-red-300 px-4 py-1.5 text-red-700"
            >
              Delete account data
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
