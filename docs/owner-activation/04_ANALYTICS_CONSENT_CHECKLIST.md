# Analytics Consent Checklist

## Prerequisites

- Owner decision on PostHog, GA4, or no analytics at launch.
- Provider key, retention, region, DPA/privacy review, and an approved consent
  position. No key belongs in this repository.

## Repository contract

Providers are disabled when keys are absent. `ConsentBanner` gates loading and
capture. The analytics adapter accepts scalar, coarse metadata only and strips
emails, auth IDs, resource IDs, typed text/characters, answers, tokens, invite
codes, nested objects, and other secret-like fields.

## Operator test

1. Build with provider keys absent. Confirm no provider script/request and that
   local practice still works.
2. Clear the consent choice, load a route, choose **Do not allow**, and inspect
   the browser network panel: no provider request should be sent.
3. Choose **Allow**, start/complete a disposable local practice task, and
   inspect a redacted event. It may include event name, coarse mode/language,
   numeric outcome, and path; it must not include email, UUID, typed text,
   answers, tokens, invite codes, or browser-secret state.
4. Revoke/change consent from the Privacy surface and confirm future capture is
   disabled as intended by the provider integration.

## Expected evidence

Consent-off/on network exports or screenshots with values redacted, provider
configuration/retention record, and the dated event schema review. Do not claim
retention or user funnels before real traffic exists.

## Failure and rollback

If a payload contains sensitive data, disable the provider keys, preserve the
redacted evidence, assess provider deletion/retention obligations, and fix the
event schema before re-enabling. If consent is ambiguous, leave analytics
disabled.

## Mutation and approval

Adding provider keys, changing consent/legal copy, or changing provider
retention mutates external systems and requires owner/legal approval.
