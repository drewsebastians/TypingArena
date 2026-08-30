# Theme and styling context

## Compact token summary

- Framework: Next.js App Router, React 19, TypeScript strict, static export.
- CSS: Tailwind CSS v4 via `@import "tailwindcss"`; no Tailwind config file.
- Fonts: `Geist` (`--font-geist-sans`) and `Geist_Mono` (`--font-geist-mono`).
- Light palette: background `#ffffff`, foreground `#171717`, white cards, zinc borders/text, amber accent, emerald success, sky info, violet/indigo/rose route accents.
- Dark palette: background `#09090b`, foreground `#fafafa`, zinc-900 cards, zinc-800 borders, same semantic accents with dark variants.
- Layout: max-width 6xl shell, 16px horizontal gutters, 24–40px vertical rhythm, rounded-xl/2xl cards, pill controls, stable 90px horizontal ad slots and 250px rectangle slots.
- Breakpoints used: `sm` for compact-to-wide card behavior, `lg` for desktop navigation; mobile menu remains usable down to 320px.
- Active-task contract: `html[data-exercise-active]` reduces header opacity; `SafeAdSlot` renders nothing while the marker/context is active.
- Focus/touch: primary controls use `min-h-11` / `h-11 w-11` (44px target); the mobile navigation is a modal focus-trapped drawer.

## Raw source: `src/app/globals.css`

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: #09090b;
    --foreground: #fafafa;
  }
}
.dark {
  --background: #09090b;
  --foreground: #fafafa;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
}

.font-mono {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
}

.ad-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  border: 1px dashed #e4e4e7;
  background: #fafafa;
  color: #a1a1aa;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.dark .ad-slot {
  background: #18181b;
  border-color: #27272a;
}

html[data-exercise-active] header {
  opacity: 0.45;
}
html[data-exercise-active] header:hover,
html[data-exercise-active] header:focus-within {
  opacity: 1;
}
```

## Raw source: `next.config.ts`

```ts
import type { NextConfig } from "next";
const isGithubPages = process.env.GITHUB_PAGES === "true";
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isGithubPages ? "/TypingArena" : "",
  assetPrefix: isGithubPages ? "/TypingArena/" : undefined,
  trailingSlash: true,
};
export default nextConfig;
```

## Raw source: `postcss.config.mjs`

```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```
