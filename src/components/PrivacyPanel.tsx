"use client";

import { useState } from "react";
import { clearAllLocalData, exportAllResults } from "@/lib/history";
import { clearQueue as clearSyncQueue, pendingSyncCount } from "@/lib/sync";
import { deleteSharedData } from "@/lib/remote";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import { clearQueue as clearAnalyticsQueue, track } from "@/lib/analytics";

export default function PrivacyPanel({ onDeleted }: { onDeleted: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const download = () => {
    const data = JSON.stringify(exportAllResults(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "typingarena-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteLocal = () => {
    if (!window.confirm("Delete all TypingArena practice data stored on this device?")) return;
    clearAllLocalData();
    clearSyncQueue();
    clearAnalyticsQueue();
    onDeleted();
    setMsg("Local data deleted.");
    track("history_deleted", { scope: "local" });
  };

  const deleteShared = async () => {
    if (!window.confirm("Delete shared results and workspaces owned by this device identity? This cannot be undone.")) return;
    setBusy(true);
    setMsg(null);
    try {
      await deleteSharedData();
      setMsg("Shared data deleted from this device identity.");
      track("shared_data_deleted", {});
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Shared data could not be deleted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border bg-white p-4 dark:bg-zinc-900">
      <h2 className="text-sm font-bold">Privacy & data</h2>
      <p className="mt-1 text-xs text-zinc-500">Practice history lives in this browser. Export it anytime, or remove local and shared data separately.</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button onClick={download} className="min-h-11 rounded-full border px-4 py-1.5">Export practice data (JSON)</button>
        <button onClick={deleteLocal} className="min-h-11 rounded-full border border-red-300 px-4 py-1.5 text-red-700">Delete local data</button>
        {IS_REMOTE_CONFIGURED && <button disabled={busy || pendingSyncCount() > 0} onClick={() => void deleteShared()} className="min-h-11 rounded-full border border-red-300 px-4 py-1.5 text-red-700 disabled:opacity-50">{busy ? "Deleting…" : "Delete shared data"}</button>}
      </div>
      {msg && <p role="status" className="mt-2 text-xs text-emerald-700">{msg}</p>}
    </div>
  );
}
