# AtmoShaper morning review

Prepared October 9, 2026 after the owner asked for uninterrupted work within
existing authority and one consolidated morning review. Read
[project state](../../project-state.md) and the
[independent launch plan](2026-10-08-atmoshaper-independent-launch-readiness.md)
first. This page is a decision queue, not provider-write authorization.

## Already approved: completed access and DNS staging

### Completed: Ably read-only access

The owner completed the replacement encrypted capture, and the approved inventory
is verified at October 9, 14:13 UTC. The thirty-day token has exactly **Read App**,
**Read Rule (channel rules)** and **Read Stats**: `read:app`, `read:namespace` and
`read:stats`. No further token creation, entry or CLI login is needed.

Complete metadata identifies one enabled app named `atmoshaper`, with TLS required
and no channel rules. Two completed hourly statistics windows return no rows;
this does not establish historical usage, plan limits or a working remote game.
The cumulative read operation uses eleven of twelve reserved GETs, including
unsuccessful attempts. Keys, game traffic and provider writes remain untouched.
Thirty-six native offline helper cases pass without credentials or network.

The [Ably binding plan](2026-10-09-atmoshaper-ably-binding.md) prepares a dedicated
server key, an isolated verification app and the existing room-token boundary.
Administration/billing/quotas and separately approved binding/live acceptance
remain required. Agent dashboard policy remains unresolved.

### Completed: DNS import, readback and protected export

The owner imported the already-approved eight-row file. All eight displayed
records are DNS-only with TTL five minutes; both assigned Cloudflare authorities
return the complete preserved values at TTL 300, including MX priority 10.
Current-authority values remain unchanged and direct/recursive NS checks retain
Namecheap. The explicit per-record proxy tags overrode the selected import
checkbox. No correction, duplicate import or new token is needed.

The owner supplied the downloaded export. October 9, 16:20 UTC local verification
matches all eight complete values, MX priority, TTL 300 and four eligible
DNS-only tags against the approved file and frozen preservation values. Generated
NS/SOA entries match the assigned zone. A byte-identical owner/SYSTEM-protected
backup is verified, and the original is preserved. No further import, export or
token entry is needed for this completed staging step.

This staging proof covers the known eight rows. Complete old-zone inventory,
fresh parent NS/DS proof, exact propagation/rollback and separate activation
approval remain required. Leave Continue to activation and Namecheap nameservers
unchanged. Agent dashboard policy and the record-list API denial remain
unresolved; no broader grant follows from export verification. See the
[compatible media plan](2026-10-08-atmoshaper-compatible-media-cutover.md).

## Approved publication: draft PR #43 and review follow-up

The user approved the prepared source publication, ordinary CI/automatic Preview,
fresh Codex/full CodeRabbit reviews and valid owned fixes. The exact initial
snapshot was published as [draft PR #43](https://github.com/dsbowersock/atmoshaper/pull/43)
on October 9. At `fd50482`, Preview is READY, Browser build passes and fresh Codex
reports no major issues. Full CodeRabbit finished all 26 changed files and found
two valid documentation summaries; touched-function docstrings were 77.42%,
below the configured 80% gate. The follow-up corrects those summaries and adds
focused helper comments. Initial receipts become historical when the head changes.

Finish the approved source/review loop and bind readiness to the final head's
complete CI, READY Preview, fresh Codex and full CodeRabbit coverage with no
actionable threads and passing applicable pre-merge gates. Completed PRs #41/#42
and their historical checks remain closed. Exact final receipts stay in the
protected operation packet; keep the draft unmerged until separate approval.

The change adds bounded public media-index inventory, disables separate Sentry
vendor build telemetry, reconciles current documentation and the review-date
assertion, prepares opt-in Generative.fm index/nested-sample rebinding, adds a metadata-only Signature catalog candidate command, and checks both Chimer delivery bases through actual resolvers, and records the aggregate-only anatomy inspection boundary.
Legacy delivery remains the default. The new runtime switch has focused checks
with invented responses and substituted network/audio dependencies; no hosted
binding, media payload, schema/migration or provider activation is changed.
The Signature command prepares all 1,800 rendition references with a new revision and exact rollback; its candidate is private and the runtime catalog is unchanged. The Chimer plan covers the 84-entry published release and 83-entry fallback without runtime-data or hosted-setting changes. Its 45 focused cases, lint and typecheck pass. Current validation and the final exact head are in the protected packet.

A later media configuration packet must distinguish rebinding fallback from
activating a previously unconfigured published Chimer catalog. The published
base includes its release revision. Current hosted values, exact domain/object
availability and real playback must be checked before that separate operation;
the approved source publication does not approve activation.

The publication approval includes ordinary draft CI/Preview behavior and valid
owned review fixes. Merge, Production build/promotion, DNS/media/Sentry
configuration, events/source maps/notifications, database writes and live
payments remain separate operations requiring their exact approval.

## Inputs needed before later exact change packets

These are decisions or missing read-only evidence. They are not requests to
approve unspecified provider changes.

| Area | Owner input or read-only check | What it unlocks |
| --- | --- | --- |
| Ably ownership and limits | Confirm administration/billing ownership, current plan, connection/channel/message allowance and paid overage policy for the existing app; no token or key is needed in chat | A costed isolated-verification/server-key/binding packet and bounded host/phone acceptance. The read-only inventory is complete; no live activation is approved |
| Sentry | Confirm the current organization's plan, monthly error allowance, retained-error duration and any pay-as-you-go allowance from Subscription/Billing. Choose the owner alert destination; using the existing Sentry account's email is the proposed first option | A concrete project-only limit, release/source-map and owner-alert packet. Existing privacy setup is complete; collection, uploads and notifications remain unapproved |
| Calendar | Choose an existing eligible AtmoShaper provider account and its Google account, without sending credentials. Decide whether the resulting connection should remain for normal use or all newly created synthetic test state should be removed | A bounded normal public-app Connect/sync/change/Disconnect packet with named owned fixtures, database effects, consent and exact cleanup |
| Database and recovery | Confirm administration/billing accountability and the acceptable recovery downtime/data-loss targets | A costed recovery/restore proposal for the already-identified independent resource. Current metadata has a six-hour history window; it does not prove deployed branch/credential binding or restore acceptance |
| Anatomy media | Confirm the exact candidate database target and the deployed branch binding; review the [count-only inspection scope](2026-10-09-atmoshaper-anatomy-media-inspection.md) before its separate read authorization. Proposed SQL is protected and unexecuted | Counts for both study-loader and broader catalog consumers, then a concrete URL cutover/rollback choice. No raw rows, clinical data, uploads or writes are included |
| Additional purchases | Locate any existing independent classification confirmation for one-time support and backgrounds; confirm the intended customer offering | The remaining prerequisite and bounded new-flow test packets. Active Stripe Tax metadata does not establish every attestation or authorize switching either purchase path on |
| Mail/support and social identity | Choose whether branded support should continue using the advertised inbox or use an inbound domain address, and which existing social accounts should represent AtmoShaper | Exact routing/ownership and later delivery/profile-change packets, preserving existing sender and legacy access |

Calendar source inspection distinguishes normal disconnection from full teardown.
The current normal Disconnect removes the owned resolved application connection;
it does not call Google token revocation or delete the Google dedicated calendar.
Any provider cleanup must therefore be separately identified and approved, and
must preserve pre-existing grants/calendars/events. The selected test account
also needs an Owner/Therapist practice role and the external-calendar-sync feature
entitlement. No role/entitlement grant, real appointment or user-row audit is
included in source preparation.

Do not request another recurring Supporter payment or repeat the completed
Calendar permission/application/database comparison and cleanup. New acceptance
must concern only the remaining offered user journeys.

## Next order after the inputs

1. Ably inventory and eight-record DNS staging/import/readback/export are complete; preserve the protected receipts and current authority.
2. Finish the approved draft PR #43 review loop at its final head; preserve completed staging and provider boundaries.
3. Prepare independent Ably resource/key/binding and bounded host/phone/reconnect
   scopes from the actual inventory.
4. Complete Sentry, database/recovery and mail ownership prerequisites; submit
   concrete configuration/acceptance packets after their limits and targets exist.
5. Complete DNS onboarding and compatible branded media delivery with explicit
   activation/binding approval, preserving all old URLs and legacy tools.
6. Complete the approved normal Calendar journey and additional purchase gates,
   then review the final public claims and exact-artifact rollout.
7. Verify the offered features and legacy continuity on the final approved release.

The independent marketing-readiness goal remains active. Current website and
legacy tools are preserved; no further provider change is inferred from the
owner's request to continue overnight.
