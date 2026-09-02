"use client";
import SeasonsPanel from "@/components/SeasonsPanel";
import ToolPageShell from "@/components/tool/ToolPageShell";
import RelatedTools from "@/components/tool/RelatedTools";
import { getRouteByPath } from "@/lib/routeRegistry";
import { useLocale } from "@/components/LocaleProvider";
import ArenaNav from "@/components/ArenaNav";

export default function SeasonsPage() {
  const { locale } = useLocale();
  const route = getRouteByPath("/seasons");
  return (
    <ToolPageShell
      eyebrow={locale === "id" ? "Kompetisi" : "Compete"}
      title={locale === "id" ? "Musim Kompetitif" : "Ranked Seasons"}
      description={locale === "id" ? "Peringkat bulanan yang hanya menghitung upaya ranked yang diterima server." : "Monthly ranked ladders that count only server-accepted ranked attempts."}
    >
      <ArenaNav />
      <SeasonsPanel />
      {route && <RelatedTools route={route} />}
    </ToolPageShell>
  );
}
