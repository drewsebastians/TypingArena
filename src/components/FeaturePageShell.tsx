"use client";

import type { ReactNode } from "react";
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
      {children}
      <SafeAdSlot slot={slot} context="outside-task" className="mx-auto mt-8 max-w-3xl" />
      {route && <RelatedTools route={route} />}
    </ToolPageShell>
  );
}
