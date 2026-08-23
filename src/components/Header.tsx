"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getStreak, getUsername, setUsername } from "@/lib/history";

const nav = [
  { href: "/typing-test", label: "Sprint" },
  { href: "/dictation", label: "Dictation" },
  { href: "/transcription-practice", label: "Transcription" },
  { href: "/noise-challenge", label: "Noise" },
  { href: "/friends", label: "Friends" },
  { href: "/daily-arena", label: "Daily Arena" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/progress", label: "Progress" },
];

export default function Header() {
  const pathname = usePathname();
  const [streak, setStreak] = useState(0);
  const [username, setU] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    setStreak(getStreak());
    setU(getUsername());
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-sm font-black text-white dark:bg-white dark:text-black">TA</div>
          <span className="text-lg font-bold tracking-tight">TypingArena</span>
          <span className="hidden rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 sm:inline">BETA</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${pathname === n.href || pathname.startsWith(n.href + "/") ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300 sm:flex" title="Daily streak">
            <span>🔥</span> {streak} day
          </div>
          {username ? (
            <span className="hidden text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:inline">@{username}</span>
          ) : (
            <button onClick={() => setEditing(v=>!v)} className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black">
              Set name
            </button>
          )}
        </div>
      </div>
      {/* mobile nav */}
      <div className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-2 py-2 dark:border-zinc-900 lg:hidden">
        {nav.map(n => (
          <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${pathname === n.href ? "bg-black text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}>{n.label}</Link>
        ))}
      </div>
      {editing && (
        <div className="border-t border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-md gap-2">
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="choose username for leaderboard" className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" maxLength={16} />
            <button onClick={() => { if(input.trim()){ setUsername(input.trim()); setU(input.trim()); setEditing(false); } }} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">Save</button>
            <button onClick={()=>setEditing(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </header>
  );
}
