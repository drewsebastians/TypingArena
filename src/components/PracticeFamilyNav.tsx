"use client";

import SectionNav from "@/components/SectionNav";

const ITEMS = [
  { href: "/typing-test", label: { en: "Typing", id: "Mengetik" } },
  { href: "/dictation", label: { en: "Listening", id: "Menyimak" } },
  { href: "/transcription-practice", label: { en: "Transcription", id: "Transkripsi" } },
  { href: "/career", label: { en: "Work Skills", id: "Keterampilan kerja" } },
] as const;

export default function PracticeFamilyNav() {
  return (
    <SectionNav
      section="practice"
      title={{ en: "Practice", id: "Latihan" }}
      ariaLabel={{ en: "Practice family navigation", id: "Navigasi keluarga latihan" }}
      items={ITEMS}
    />
  );
}
