# Offered account, playback and recovery observations

Date: November 18, 2026. Runtime source remains reviewed main `012952b`; fresh
remote main and local HEAD agree. The Vercel dashboard still identifies the
previously verified Sentry-enabled public artifact. No rebuild or promotion ran.

## Account and setup

The owner signed in privately using the existing Google method in regular Chrome.
No password, code, token or private identity value belongs in this receipt.

| Surface | Observed result | Limit |
| --- | --- | --- |
| Signed-in shell | Account and owner navigation load | Not new-account or recovery-mail acceptance |
| Onboarding | Optional setup and Skip for now link render | Used the link; no answers saved |
| Security | Linked sign-in method and applicable security controls load | No method, password or 2FA change |
| App layout | Existing layout, theme, motion and haptic controls render | No setting changed |
| Data & sync | Preference-only sync explanation and local-first clinical boundary render | No sync button used or clinical content opened |
| Calendar availability | First-practice setup prerequisite renders | No practice membership exists in this offered context |
| Google Calendar sync | Not connected; provider-access prerequisite renders | No OAuth, reconnect, event, sync or disconnect attempted |

The first-practice form is prepared but unsaved as `AtmoShaper Studio`. Source
review of `createPractice` confirms one practice, its owner membership, and the
default 60-minute service/variant. Exact creation approval or another name is
pending. No account preference, scheduling row, membership or Google grant was
changed during these reads.

## Representative live music controls

| Station | Observed sequence |
| --- | --- |
| Drone | Ready, loading, Playing, Paused, Stopped |
| Observable Streams | Ready, loading, Playing, Paused, Playing after resume, Stopped |

Both reached the application's Playing state with enabled player controls and
no visible failure/retry surface. Saved screenshots of each Playing state.
Playback was stopped and the owned test tab closed. This checks browser playback
state and controls; it does not establish physical speaker output, complete
catalog coverage, forced network fallback or long-session behavior. No favorite,
media object, catalog or provider configuration was changed.

## Exact attachment and backup eligibility

The normal Vercel project Storage page and resource connected-projects table
identify this application's Production attachment. Its displayed provider ID
matches the explicitly scoped Neon project read. This closes the earlier fresh
store-link metadata gap without reading secrets or database rows.

Current metadata: Vercel-managed Free plan; one ready root/default main branch;
six hours of restore history; empty snapshot schedule and snapshot list. The
separate legacy resource was not substituted for this project's recovery proof.

Current [Neon backup documentation](https://neon.com/docs/guides/backup-restore)
allows one manual snapshot on Free and automated schedules on paid plans.
Snapshot storage is listed at $0.09/GB-month. The
[pricing page](https://neon.com/pricing) describes Launch as usage-based, not a
fixed-price $15 subscription. Those public prices are not a spending approval.

The actual Vercel billing-plan preview says the selected plan applies to all
products in the installation; two products are connected. The preview was
cancelled, with no plan/payment/schedule change. A backup approach preference is
pending: separate encrypted backups while retaining Free, or a paid-plan
comparison that includes both products and an explicit budget.

The accepted one-day loss/next-day restoration target still lacks adequate
backup coverage and isolated restore proof. No database export, snapshot, branch,
restore, row/schema read, credential export, mail or payment ran. Any export
destination, runner, key custody, permissions, retention, alerting, recovery drill
and owned cleanup require a concrete plan before the corresponding authorization.
