"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getStreak, getUsername } from "@/lib/history";
import { getLocale, setLocale, t, type Locale } from "@/lib/i18n";

const NAV_KEYS: Array<{ href: string; key: string }> = [
  { href: "/typing-test", key: "nav.sprint" },
  { href: "/dictation", key: "nav.dictation" },
  { href: "/transcription-practice", key: "nav.transcription" },
  { href: "/transcription-library", key: "nav.library" },
  { href: "/career", key: "nav.career" },
  { href: "/multiplayer", key: "nav.multiplayer" },
  { href: "/teams", key: "nav.teams" },
  { href: "/custom", key: "nav.custom" },
  { href: "/daily-arena", key: "nav.daily" },
  { href: "/leaderboard", key: "nav.leaderboard" },
  { href: "/seasons", key: "nav.seasons" },
  { href: "/friends", key: "nav.friends" },
  { href: "/noise-challenge", key: "nav.noise" },
  { href: "/assessments", key: "nav.assessments" },
  { href: "/progress", key: "nav.progress" },
];

export default function Header() {
  const pathname = usePathname();
  const [streak, setStreak] = useState(0);
  const [username, setU] = useState<string | null>(null);
  const [locale, setLoc] = useState<Locale>("en");

  useEffect(() => {
    setStreak(getStreak().current);
    setU(getUsername());
    setLoc(getLocale());
  }, [pathname]);

  const flipLocale = () => {
    const next: Locale = locale === "en" ? "id" : "en";
    setLocale(next);
    setLoc(next);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-sm font-black text-white dark:bg-white dark:text-black">TA</div>
          <span className="hidden text-lg font-bold tracking-tight sm:inline">TypingArena</span>
        </Link>
        <nav aria-label="primary" className="hidden items-center gap-0.5 xl:flex">
          {NAV_KEYS.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-2.5 py-1.5 text-sm font-medium transition ${pathname === n.href || pathname.startsWith(n.href + "/") ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={flipLocale} aria-label={`switch to ${locale === "en" ? "Indonesian" : "English"}`} className="rounded-full border px-3 py-1.5 text-xs font-bold uppercase">
            {locale === "en" ? "EN→ID" : "ID→EN"}
          </button>
          <div className="hidden items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 sm:flex dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300" title={t("nav.progress")}>
            <span aria-hidden>🔥</span> {streak}
          </div>
          {username && <span className="hidden text-sm font-medium text-zinc-700 lg:inline dark:text-zinc-300">@{username}</span>}
        </div>
      </div>
      {/* mobile nav */}
      <div className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-2 py-2 xl:hidden dark:border-zinc-900">
        {NAV_KEYS.map((n) => (
          <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${pathname === n.href ? "bg-black text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}>
            {t(n.key)}
          </Link>
        ))}
      </div>
    </header>
  );
}
