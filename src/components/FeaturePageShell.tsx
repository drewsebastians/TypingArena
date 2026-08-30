"use client";

import { useEffect, type ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { SafeAdSlot } from "@/components/AdSlot";
import ToolPageShell from "@/components/tool/ToolPageShell";
import RelatedTools from "@/components/tool/RelatedTools";
import { getRouteByPath } from "@/lib/routeRegistry";

type Copy = { eyebrow: string; title: string; description: string };

export default function FeaturePageShell({
  routePath,
  slot,
  copy,
  children,
}: {
  routePath: string;
  slot: string;
  copy: { en: Copy; id: Copy };
  children: ReactNode;
}) {
  const { locale } = useLocale();
  const route = getRouteByPath(routePath);
  const content = copy[locale];
  return (
    <ToolPageShell eyebrow={content.eyebrow} title={content.title} description={content.description}>
      <QueryStateRobots />
      {children}
      <SafeAdSlot slot={slot} context="outside-task" className="mx-auto mt-8 max-w-3xl" />
      {route && <RelatedTools route={route} />}
    </ToolPageShell>
  );
}

/** Shared-resource URLs contain invite/capability state and must not become
 * search landing pages. The static route remains indexable; only the query
 * state is marked noindex after hydration. */
function QueryStateRobots() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sensitive = ["challenge", "test", "manage", "invite"].some((key) => params.has(key));
    if (!sensitive) return;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    meta.dataset.queryStateRobots = "true";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  return null;
}
