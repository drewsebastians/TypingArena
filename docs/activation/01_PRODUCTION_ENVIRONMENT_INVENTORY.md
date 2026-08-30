# Production Environment Inventory

Captured: 2026-08-31 (Asia/Jakarta)

Only presence, status, and public deployment metadata are recorded here. No
secret values, tokens, keys, or database connection strings are included.

| Surface | Observed state | Evidence / owner action |
|---|---|---|
| Published host | PRESENT: GitHub Pages project site | https://drewsebastians.github.io/TypingArena/ |
| Latest published revision | KNOWN: main at b99779bc208c5abd2aa2e67e618927a2db949c42 | Latest successful Deploy workflow run 33297195121 |
| PR #4 published | NO | Deploy workflow runs shown are main pushes; PR head is not the published revision |
| GitHub Actions production site variable | ABSENT | Repository variable listing returned no entries; owner must set NEXT_PUBLIC_SITE_URL |
| GitHub Actions Supabase URL secret | ABSENT | Repository and github-pages environment secret listings returned no entries |
| GitHub Actions Supabase anon-key secret | ABSENT | Repository and github-pages environment secret listings returned no entries |
| Optional analytics secrets | ABSENT | No PostHog or GA4 secret names reported |
| Optional AdSense secret | ABSENT | No AdSense secret name reported |
| Local production env | ABSENT | Only .env.example exists; no matching process environment keys |
| Production Supabase project/ref | UNKNOWN / NOT PROVIDED | No production ref or credentials are available in the workspace |
| Supabase CLI | MISSING | Not available on this machine |
| Docker/local Supabase | MISSING / NOT AVAILABLE | No local Docker command was available; GitHub DB CI supplies local-stack proof |
| Migration chain | PRESENT IN REPOSITORY | supabase/migrations/0001 through 0016; PR DB integration passed through 0016 |
| Production migration application | NOT VERIFIED | Owner must link the production ref and apply 0001→0016 with supabase db push |
| Anonymous Sign-Ins | UNKNOWN | Owner must enable and verify in the production Supabase Auth settings |
| Supabase Auth Site URL/redirects | UNKNOWN | Owner must set the final HTTPS served origin |
| Production RLS/RPC/rate-limit/purge schedule | UNKNOWN | Local DB scenarios pass; production verification remains owner-controlled |
| Analytics provider configuration | NOT ENABLED | Consent-gated implementation is present; provider keys/legal retention decision remain external |
| AdSense approval/configuration | NOT ENABLED | Ads remain inert without the approved client value; no ads.txt was added |
| GitHub Pages environment protection | PRESENT | API reported environment github-pages with one protection rule; owner should confirm approval semantics |
| main branch protection | NOT PRESENT | GitHub API reported “Branch not protected”; owner should apply the intended review/status policy |
| Search Console/domain verification | UNKNOWN | Post-deploy owner action |
| Human real-device/screen-reader/Safari/CWV evidence | PENDING | Automated evidence is green; human evidence is post-deploy validation |

## Read-only hosted evidence

The API-confirmed Pages URL passed the route, SEO, canonical, HTML language,
JavaScript, and static dictation audio checks: 37 passed, 0 failed. This is a
demo-host validation only because the published revision is main, not PR #4,
and the Pages demo has no production Supabase configuration.

## Fail-closed configuration evidence

Running the production readiness script without production values returned the
expected block for:

- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

This confirms the deployment workflow will not silently publish a
production-target build without its canonical origin and shared backend.
