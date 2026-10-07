# AtmoShaper pending Disconnect acceptance follow-up

Status: approved October 7 follow-up passed against exact merged runtime
`38d0ded`; owned row/process/project cleanup is complete. The real action rejects
pending removal and leaves the row unchanged. All seven touched tables are empty
before deletion, the exact project is independently absent, the server/port are
released and ephemeral files removed. Teardown began after 4.72 minutes, within
the approved 15-minute ceiling. No Google credentials, consent or fixtures were used.

Read [current state](../../project-state.md), [project log](../../project-log.md),
the [completed application run](2026-10-07-atmoshaper-calendar-application-acceptance.md)
and [migration charter](../../rebrand/atmoshaper-migration-charter.md).

## Remaining case and repair

The completed run proved durable creation intent and no blind re-post after an
injected lost Google response. Its attempted native Disconnect request failed
before action dispatch: Playwright's object multipart encoding omitted Next's
empty hidden `$ACTION_ID_…` field. HTTP failure and preserved rows therefore did
not prove the removal guard. A native FormData/Request byte encoder fixes that
transport, and a real loopback HTTP regression passes. Product runtime is unchanged.

This follow-up exercises only that native action against real PostgreSQL. It
did not repeat callback, consent, Google fixtures, sync, permission comparisons
or payment tests. The sequence below is the completed execution record, not
authority to create another test project.

## Exact approved additional scope

| Operation | Limit |
| --- | --- |
| Temporary database | One additional independent empty Neon project in the same previously verified console-managed Launch organization; no existing project substitution, template or clone |
| Configuration | PostgreSQL 17, `aws-us-east-2`, one fixed 0.25 CU endpoint, existing plan-default idle suspension; no plan/compute increase |
| Runtime | Exact merged `38d0deddea484938e13df61927d07a7b21f92071` in the existing isolated task checkout, no dotenv files; task-only harness overlays |
| Data | One synthetic verified user/practice/OWNER feature grant and one invented pending CalendarConnection; token fields contain unusable invented strings, with no dedicated provider target |
| Network | Receipt-bound database connections and local loopback port 3318 only for the app test; all external fetch is refused, Google configuration blank, other providers inert |
| Time | At most 15 minutes from database creation to teardown beginning; cleanup continues until confirmed even after the ceiling |
| Cleanup | Stop owned processes, delete exactly the new project, verify active absence, remove ephemeral database/auth files; preserve unrelated work and receipts |

The previous one-project approval is exhausted and its project deleted. This
new exact resource/run/cleanup scope was separately approved, including the
disclosed possible Launch usage charges. Execution and cleanup are complete;
this additional resource authorization is also exhausted.
No Google credentials or downloaded JSON are read; no Google consent, calendars,
events, tokens, settings, Production resources or public deployment are involved.

## Completed harness and execution

1. Reverify owned checkout/runtime SHA, no runtime diff/dotenv, available port
   and current Launch organization metadata. Save a private fresh run manifest
   with `pendingActionOnly: true`, no Google fields and `sources: []`. Run the
   existing database-free `setup` mode before creation.
2. After approval, create exactly one empty project with the explicit settings
   above. Save its earliest creation-intent time and private ownership/endpoint
   receipt. An unknown response requires exact-name reconciliation before retry.
   Capture only its pooled runtime/direct migration pair and fingerprint privately.
3. Run named `preflight`, `generate` and `migrate` modes; apply committed schema
   only to this new target. `pending-seed` creates the synthetic account/access
   fixtures and an ERROR connection with the creation-pending reason and no target.
4. Run `pending-server` on loopback. Google credentials remain empty and the
   consent bridge is denied. `pending-check` briefly makes only the synthetic row
   ACTIVE to capture the real current Disconnect form, then restores ERROR in
   `finally` before sending its native multipart bytes. Confirm the actual action
   session owns that row; no success redirect is permitted.
5. Require the exact native reconciliation error from the current owned server
   after this request. Require the same ERROR/pending row, unchanged update time
   and absent target after the action. Framework/action-reference/authentication
   errors alone cannot pass. Record a dated private case receipt without rows.
6. Run `pending-cleanup` to remove only run-bound rows and prove zero rows in
   all seven touched tables. Stop only owned processes/listener, delete exactly the
   new project and prove active absence. Remove its ephemeral database/auth
   configuration after verifying resolved paths. The app needs no Google cleanup.

The launcher rejects mixing full-run and pending-only modes. Fifteen-minute
manifest/watchdog limits replace the full run's 90-minute bound. Provider-free
checks cover credential exclusion, database ownership, no external dispatch,
expiry/teardown and the actual multipart transport. Current harness suite: 18/18.

Stop on an unresolved source/identity/request result or deadline; do not add a
second database, extend compute/time, change application code or fall back to
Google credentials. Preserve the failure receipt and complete owned cleanup.

## Subsequent step

This one case and its cleanup pass. The bounded application acceptance gate is
closed with its documented fixture limitations. The
[Production credential/build proposal](2026-10-07-atmoshaper-calendar-production-credentials.md)
records the existing Calendar client's validated private download/callback
and concrete provisioning, candidate and rollback boundaries. Those operations still need
their exact separate approvals. Registration and recurring Supporter Checkout
remain open; one-time support/background purchases stay disabled.
