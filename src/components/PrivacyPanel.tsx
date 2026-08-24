"use client";
// Privacy controls — local data export + deletion.
import { useState } from "react";
import { clearAllLocalData, exportAllResults } from "@/lib/history";
import { clearQueue } from "@/lib/analytics";
import { track } from "@/lib/analytics";

export default function PrivacyPanel({ onDeleted }: { onDeleted: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);

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

  return (
    <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
      <h2 className="text-sm font-bold">Privacy</h2>
      <p className="mt-1 text-xs text-zinc-500">Your history lives in this browser. Export it anytime, or delete everything from this device.</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button onClick={download} className="rounded-full border px-4 py-1.5">Export my data (JSON)</button>
        <button
          onClick={() => {
            if (!window.confirm("Delete ALL local TypingArena data (history, streak, username)?")) return;
            clearAllLocalData();
            clearQueue();
            onDeleted();
            setMsg("Local data deleted.");
            track("history_deleted", { scope: "local" });
          }}
          className="rounded-full border border-red-300 px-4 py-1.5 text-red-700"
        >
          Delete all local data
        </button>
      </div>
      {msg && <p role="status" className="mt-2 text-xs text-emerald-700">{msg}</p>}
    </div>
  );
}
