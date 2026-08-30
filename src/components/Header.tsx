"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { getStreak, getUsername } from "@/lib/history";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

type Group = {
  id: string;
  labelKey: string;
  items: Array<{ href: string; key: string }>;
};

const GROUPS: Group[] = [
  {
    id: "practice",
    labelKey: "nav.practice",
    items: [
      { href: "/typing-test", key: "nav.sprint" },
      { href: "/tes-mengetik", key: "nav.sprint" },
      { href: "/data-entry-test", key: "nav.sprint" }, // Data Entry uses sprint label fallback; distinct desc in page
      { href: "/dictation", key: "nav.dictation" },
      { href: "/transcription-practice", key: "nav.transcription" },
      { href: "/transcription-library", key: "nav.library" },
      { href: "/noise-challenge", key: "nav.noise" },
    ],
  },
  {
    id: "compete",
    labelKey: "nav.compete",
    items: [
      { href: "/daily-arena", key: "nav.daily" },
      { href: "/leaderboard", key: "nav.leaderboard" },
      { href: "/seasons", key: "nav.seasons" },
      { href: "/friends", key: "nav.friends" },
      { href: "/multiplayer", key: "nav.multiplayer" },
    ],
  },
  {
    id: "teams",
    labelKey: "nav.groups",
    items: [
      { href: "/teams", key: "nav.teams" },
      { href: "/career", key: "nav.career" },
      { href: "/custom", key: "nav.custom" },
      { href: "/assessments", key: "nav.assessments" },
    ],
  },
];



export default function Header() {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const [streak, setStreak] = useState(0);
  const [username, setU] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setStreak(getStreak().current);
    setU(getUsername());
  }, [pathname]);

  const flipLocale = () => setLocale(locale === "en" ? "id" : "en");

  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + "/"),
    [pathname],
  );
  const groupActive = useCallback((g: Group) => g.items.some((it) => isActive(it.href)), [isActive]);

  // Drawer focus + body scroll lock
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // focus close button
    setTimeout(() => drawerCloseRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  // close dropdown on route change or outside click handled via blur
  useEffect(() => {
    setOpenGroup(null);
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-sm font-black text-white dark:bg-white dark:text-black">TA</div>
          <span className="hidden text-lg font-bold tracking-tight sm:inline">TypingArena</span>
        </Link>

        {/* Desktop grouped nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {GROUPS.map((g) => (
            <div key={g.id} className="relative">
              <button
                aria-expanded={openGroup === g.id}
                aria-haspopup="menu"
                onClick={() => setOpenGroup(openGroup === g.id ? null : g.id)}
                onBlur={(e) => {
                  // close when focus leaves the group container
                  if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) setOpenGroup(null);
                }}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${groupActive(g) ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
              >
                {t(g.labelKey)}
                <span aria-hidden className="text-xs opacity-60">▾</span>
              </button>
              {openGroup === g.id && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {g.items.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      role="menuitem"
                      className={`block rounded-lg px-3 py-2 text-sm ${isActive(it.href) ? "bg-black text-white dark:bg-white dark:text-black" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                    >
                      {t(it.key)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link
            href="/progress"
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${isActive("/progress") ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
          >
            {t("nav.progressFull")}
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={flipLocale}
            aria-label={`Switch to ${locale === "en" ? "Indonesian" : "English"}`}
            className="rounded-full border px-3 py-1.5 text-xs font-bold uppercase"
          >
            {locale === "en" ? "EN → ID" : "ID → EN"}
          </button>
          <div
            className="hidden items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 sm:flex dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300"
            title={t("nav.progressFull")}
          >
            <span aria-hidden>🔥</span> {streak}
          </div>
          {username && <span className="hidden text-sm font-medium text-zinc-700 lg:inline dark:text-zinc-300">@{username}</span>}
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border lg:hidden"
          >
            <span aria-hidden className="text-lg">☰</span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button aria-label="Close navigation menu" className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute right-0 top-0 flex h-full w-[86%] max-w-[360px] flex-col overflow-y-auto bg-white p-4 shadow-xl dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Menu</span>
              <button
                ref={drawerCloseRef}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-full border px-3 py-1.5 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-5">
              {GROUPS.map((g) => (
                <section key={g.id} aria-labelledby={`group-${g.id}`}>
                  <h2 id={`group-${g.id}`} className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {t(g.labelKey)}
                  </h2>
                  <div className="mt-2 flex flex-col gap-1">
                    {g.items.map((it) => (
                      <Link
                        key={it.href}
                        href={it.href}
                        className={`rounded-lg px-3 py-2.5 text-sm ${isActive(it.href) ? "bg-black text-white dark:bg-white dark:text-black" : "bg-zinc-100 dark:bg-zinc-800"}`}
                      >
                        {t(it.key)}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
              <section aria-labelledby="group-progress">
                <h2 id="group-progress" className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  {t("nav.progressFull")}
                </h2>
                <Link href="/progress" className={`mt-2 block rounded-lg px-3 py-2.5 text-sm ${isActive("/progress") ? "bg-black text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                  {t("nav.progressFull")}
                </Link>
                <Link href="/privacy" className="mt-1 block rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Privacy
                </Link>
              </section>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <button onClick={flipLocale} className="rounded-full border px-3 py-1.5 text-xs font-bold uppercase">
                {locale === "en" ? "English → Indonesia" : "Indonesia → English"}
              </button>
              <span className="text-xs text-zinc-500">🔥 {streak} day streak</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
