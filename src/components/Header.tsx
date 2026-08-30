"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { getStreak } from "@/lib/history";
import { getRouteById, type RouteDefinition } from "@/lib/routeRegistry";
import { t } from "@/lib/i18n";

type NavGroup = {
  id: string;
  label: string;
  routeIds: readonly string[];
};

const PRIMARY_ROUTE_IDS = ["typing-test", "dictation", "progress"] as const;
const GROUPS: readonly NavGroup[] = [
  {
    id: "practice",
    label: "nav.practice",
    routeIds: ["transcription-practice", "career", "data-entry-test", "punctuation-typing-test", "transcription-library", "noise-challenge"],
  },
  {
    id: "arena",
    label: "nav.compete",
    routeIds: ["daily-arena", "leaderboard", "seasons", "multiplayer", "friends"],
  },
  {
    id: "more",
    label: "nav.more",
    routeIds: ["teams", "custom", "assessments", "privacy"],
  },
];

function route(id: string): RouteDefinition | undefined {
  return getRouteById(id);
}

const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex=\"-1\"])";

export default function Header() {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const [streak, setStreak] = useState(0);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setStreak(getStreak().current);
  }, [pathname]);

  const isActive = useCallback((path: string) => pathname === path || pathname.startsWith(`${path}/`), [pathname]);
  const groupActive = useCallback((group: NavGroup) => group.routeIds.some((id) => route(id) && isActive(route(id)!.path)), [isActive]);
  const flipLocale = () => setLocale(locale === "en" ? "id" : "en");

  useEffect(() => {
    setOpenGroup(null);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusDrawer = () => drawerCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = drawerRef.current ? Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(focusDrawer, 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.setTimeout(() => previousFocus?.focus(), 0);
    };
  }, [drawerOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2" aria-label="TypingArena home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-black text-white dark:bg-white dark:text-black">TA</span>
          <span className="hidden text-lg font-bold tracking-tight sm:inline">TypingArena</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {PRIMARY_ROUTE_IDS.map((id) => {
            const item = route(id);
            return item ? <DesktopLink key={id} item={item} active={isActive(item.path)} locale={locale} /> : null;
          })}
          {GROUPS.map((group) => (
            <div key={group.id} className="relative">
              <button
                aria-expanded={openGroup === group.id}
                aria-haspopup="menu"
                onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)}
                onBlur={(event) => {
                  if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) setOpenGroup(null);
                }}
                className={`inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${groupActive(group) ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
              >
                {t(group.label)} <span aria-hidden className="text-xs opacity-60">▾</span>
              </button>
              {openGroup === group.id && <DesktopMenu group={group} isActive={isActive} locale={locale} />}
            </div>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button onClick={flipLocale} aria-label={`Switch to ${locale === "en" ? "Indonesian" : "English"}`} className="min-h-11 rounded-full border px-3 py-1.5 text-xs font-bold uppercase">
            {locale === "en" ? "EN → ID" : "ID → EN"}
          </button>
          <div className="hidden min-h-11 items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 sm:flex dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300" title={t("nav.progressFull")}>
            <span aria-hidden>🔥</span> {streak}
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={t("nav.menu")}
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border lg:hidden"
          >
            <span aria-hidden className="text-lg">☰</span>
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button aria-label="Close menu backdrop" className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div ref={drawerRef} id="mobile-drawer" role="dialog" aria-modal="true" aria-label={t("nav.menu")} className="absolute right-0 top-0 flex h-full w-[86%] max-w-[360px] flex-col overflow-y-auto bg-white p-4 shadow-xl dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{t("nav.menu")}</span>
              <button ref={drawerCloseRef} onClick={() => setDrawerOpen(false)} aria-label={t("nav.closeMenu")} className="min-h-11 min-w-11 rounded-full border px-3 py-1.5 text-sm">✕</button>
            </div>
            <div className="mt-4 flex flex-col gap-5">
              {PRIMARY_ROUTE_IDS.map((id) => {
                const item = route(id);
                return item ? <MobileLink key={id} item={item} active={isActive(item.path)} locale={locale} /> : null;
              })}
              {GROUPS.map((group) => (
                <section key={group.id} aria-labelledby={`group-${group.id}`}>
                  <h2 id={`group-${group.id}`} className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t(group.label)}</h2>
                  <div className="mt-2 flex flex-col gap-1">
                    {group.routeIds.map((id) => {
                      const item = route(id);
                      return item ? <MobileLink key={id} item={item} active={isActive(item.path)} locale={locale} /> : null;
                    })}
                  </div>
                </section>
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <button onClick={flipLocale} className="min-h-11 rounded-full border px-3 py-1.5 text-xs font-bold uppercase">{locale === "en" ? "English → Indonesia" : "Indonesia → English"}</button>
              <span className="text-xs text-zinc-500">🔥 {streak} day streak</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function DesktopLink({ item, active, locale }: { item: RouteDefinition; active: boolean; locale: "en" | "id" }) {
  return <Link href={item.path} aria-current={active ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm font-medium ${active ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}>{item.label[locale]}</Link>;
}

function DesktopMenu({ group, isActive, locale }: { group: NavGroup; isActive: (path: string) => boolean; locale: "en" | "id" }) {
  return (
    <div role="menu" className="absolute left-0 top-full z-50 mt-2 min-w-[230px] rounded-xl border bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      {group.routeIds.map((id) => {
        const item = route(id);
        if (!item) return null;
        const active = isActive(item.path);
        return <Link key={id} href={item.path} role="menuitem" aria-current={active ? "page" : undefined} className={`block rounded-lg px-3 py-2.5 text-sm ${active ? "bg-black text-white dark:bg-white dark:text-black" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>{item.label[locale]}</Link>;
      })}
    </div>
  );
}

function MobileLink({ item, active, locale }: { item: RouteDefinition; active: boolean; locale: "en" | "id" }) {
  return <Link href={item.path} aria-current={active ? "page" : undefined} className={`min-h-11 rounded-lg px-3 py-2.5 text-sm ${active ? "bg-black text-white dark:bg-white dark:text-black" : "bg-zinc-100 dark:bg-zinc-800"}`}>{item.label[locale]}</Link>;
}
