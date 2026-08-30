"use client";
import CareerPanel from "@/components/CareerPanel";
import ToolPageShell from "@/components/tool/ToolPageShell";
import RelatedTools from "@/components/tool/RelatedTools";
import { getRouteByPath } from "@/lib/routeRegistry";
import { useLocale } from "@/components/LocaleProvider";

export default function CareerPage() {
  const { locale } = useLocale();
  const route = getRouteByPath("/career");
  return (
    <ToolPageShell
      eyebrow={locale === "id" ? "Kesiapan kerja" : "Work readiness"}
      title={locale === "id" ? "Mode Karier — Asesmen Latihan" : "Career Mode — Practice Assessments"}
      description={locale === "id" ? "Benchmark keterampilan terstruktur dari latihan terkurasi. Skor transparan, tanpa klaim sertifikasi." : "Structured benchmarks built from reviewed exercises. Transparent scoring with no certification claims."}
    >
      <CareerPanel />
      {route && <RelatedTools route={route} />}
    </ToolPageShell>
  );
}
