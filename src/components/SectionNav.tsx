"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

export interface SectionNavItem {
  href: string;
  label: { en: string; id: string };
}

export default function SectionNav({
  section,
  title,
  ariaLabel,
  items,
  onNavigate,
}: {
  section: string;
  title: { en: string; id: string };
  ariaLabel: { en: string; id: string };
  items: readonly SectionNavItem[];
  onNavigate?: (href: string) => void;
}) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label={ariaLabel[locale]}
      data-section-nav={section}
      className="mb-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex min-w-max items-center gap-2 px-1">
        <span className="mr-1 shrink-0 px-2 text-xs font-black uppercase tracking-widest text-zinc-500">{title[locale]}</span>
        <div className="flex flex-wrap gap-1" role="list">
          {items.map((item) => {
            const isCurrent = active(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="listitem"
                aria-current={isCurrent ? "page" : undefined}
                onClick={() => onNavigate?.(item.href)}
                className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${isCurrent ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
              >
                {item.label[locale]}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
