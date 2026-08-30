"use client";
import type { ReactNode } from "react";

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-black tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
    </div>
  );
}

export function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>{children}</div>;
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="text-sm text-zinc-500">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Notice({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "warning" | "info" }) {
  const styles =
    variant === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
      : variant === "info"
        ? "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200"
        : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400";
  return <div className={`rounded-xl border p-4 text-sm ${styles}`}>{children}</div>;
}
