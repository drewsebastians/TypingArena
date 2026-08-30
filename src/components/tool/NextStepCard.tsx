"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics";

export interface NextStep {
  href: string;
  label: string;
}

export default function NextStepCard({
  title = "What to do next",
  body,
  steps,
  children,
}: {
  title?: string;
  body?: string;
  steps?: readonly NextStep[];
  children?: ReactNode;
}) {
  return (
    <aside className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950" data-next-step>
      <h3 className="font-bold text-amber-950 dark:text-amber-100">{title}</h3>
      {body && <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">{body}</p>}
      {steps && steps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {steps.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              onClick={() => track("result_next_action_clicked", { to: step.href })}
              className="inline-flex min-h-11 items-center rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600"
            >
              {step.label} →
            </Link>
          ))}
        </div>
      )}
      {children}
    </aside>
  );
}
