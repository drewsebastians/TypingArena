# Owner-Authorized Environment Inventory

Captured: 2026-08-31 (Asia/Jakarta)

> Superseding correction (2026-08-31): Owner authorization is confirmed under
> the latest credentialed operator prompt. The current release classification is
> **READY FOR CREDENTIALLED OPERATOR — ACCESS BLOCKER ONLY** because the
> production project identity and secure operator credentials remain
> unavailable.

Only redacted presence/status information is recorded. No secret values,
tokens, keys, or private connection strings are included.

| Area | Status | Evidence |
|---|---|---|
| Hosting provider | PRESENT | GitHub Pages project site |
| Public demo origin | PRESENT | https://drewsebastians.github.io/TypingArena/ |
| Latest published revision | KNOWN | main at b99779bc208c5abd2aa2e67e618927a2db949c42; Deploy run 33297195121 |
| PR #4 deployed | NO | Published revision is main, not the PR branch |
| Production origin variable | ABSENT | Repository and github-pages variable listings are empty |
| Supabase URL secret | ABSENT | Repository and github-pages secret listings are empty |
| Supabase anon-key secret | ABSENT | Repository and github-pages secret listings are empty |
| Analytics provider keys | ABSENT | No PostHog or GA4 secret names reported |
| AdSense client | ABSENT | No AdSense secret name reported |
| Local production env | ABSENT | Only .env.example exists; no matching process keys |
| Production Supabase project/ref | UNKNOWN / NOT PROVIDED | No ref or credentialed operator is available |
| Supabase CLI | MISSING | Not available on this machine |
| Docker/local Supabase | NOT AVAILABLE | No local Docker command is available |
| Repository migrations | PRESENT | supabase/migrations/0001 through 0016 |
| Production migration history | UNKNOWN | Cannot link/read production without project identity and CLI |
| Production migration delta | UNKNOWN | No production preflight performed |
| Anonymous Sign-Ins | UNKNOWN | Production Auth settings unavailable |
| Auth Site URL/redirects | UNKNOWN | Production Auth settings unavailable |
| Production RLS/RPC/capability contract | UNKNOWN | Local DB proof exists; production contract unverified |
| Production purge schedule | UNKNOWN | No approved scheduler or production access available |
| Tournament/Edge Function | DEFERRED | Not required for initial Goal-First launch |
| Analytics activation | DISABLED / NOT CONFIGURED | Consent-gated implementation remains unconfigured |
| AdSense activation | NOT APPROVED / NOT CONFIGURED | No publisher value or ads.txt added |
| Search Console | UNKNOWN | Post-deploy external validation |
| Manual accessibility/CWV | PENDING | Requires real-device/operator evidence |
| Exact authorization gate | CONFIRMED | Latest prompt accepts semantic authorization regardless of terminal punctuation |

## Environment stop condition

The attached prompt requires the exact production project identity, migration
history/delta, backup or approved recovery method, and credentialed operator
before any production mutation. Those prerequisites are not proven here.

Do not run supabase db push, change Supabase Auth, set production secrets or
variables, merge PR #4, or dispatch a production deployment from this state.
The access blocker must be cleared by a credentialed operator outside chat.
