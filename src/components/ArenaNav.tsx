"use client";

import SectionNav from "@/components/SectionNav";
import { track } from "@/lib/analytics";

const ITEMS = [
  { href: "/daily-arena", label: { en: "Today", id: "Hari ini" } },
  { href: "/leaderboard", label: { en: "Leaderboard", id: "Papan peringkat" } },
  { href: "/seasons", label: { en: "Season", id: "Musim" } },
  { href: "/multiplayer", label: { en: "Multiplayer", id: "Multiplayer" } },
  { href: "/friends", label: { en: "Friend Challenges", id: "Tantangan teman" } },
] as const;

export default function ArenaNav() {
  return (
    <SectionNav
      section="arena"
      title={{ en: "Arena", id: "Arena" }}
      ariaLabel={{ en: "Arena navigation", id: "Navigasi arena" }}
      items={ITEMS}
      onNavigate={(href) => track("arena_tab_opened", { destination: href })}
    />
  );
}
