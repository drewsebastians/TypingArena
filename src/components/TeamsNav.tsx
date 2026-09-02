"use client";

import SectionNav from "@/components/SectionNav";

const ITEMS = [
  { href: "/teams", label: { en: "Teams", id: "Tim" } },
  { href: "/custom", label: { en: "Custom Tests", id: "Tes buatan" } },
  { href: "/assessments", label: { en: "Assessments", id: "Asesmen" } },
] as const;

export default function TeamsNav() {
  return (
    <SectionNav
      section="teams"
      title={{ en: "For Teams", id: "Untuk tim" }}
      ariaLabel={{ en: "For Teams navigation", id: "Navigasi untuk tim" }}
      items={ITEMS}
    />
  );
}
