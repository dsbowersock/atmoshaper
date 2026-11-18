# Personal blocked-time cancellation

The approved live Google Calendar test created its one synthetic Personal event
and verified the generic, correctly timed Google mirror without attendees.
The deployed app offers no way to cancel personal blocked time: workspace clicks
have no event action, and Upcoming blocks is read-only. This is a beta blocker,
not a failed Google insert. Preserve the one test fixture while preparing a fix;
do not create another event or disconnect before its mirror is cancelled.

## Focused implementation

Add a Cancel block form to existing Availability > Blocks rows. Owners may
cancel practice blocks; therapists only their own. Keep appointment/class/
reminder behavior and calendar geometry unchanged. The server action checks the
authenticated actor and exact Personal event, takes the existing schedule/event
locks, then rechecks current membership, owner and event snapshot in the
transaction. Mark the event CANCELLED and stop blocking availability, retaining
the event and child record as history. Hide cancelled blocks from Upcoming.
Record the existing sanitized audit/internal-notification shape, and call the
existing best-effort Google cancellation after commit. Never send invitations.

## Verification and live boundary

Use provider-free production-action tests for authorization, forged event kinds,
stale ownership/time/role, idempotence, mutation/Google ordering and exact update
scope. Run existing Calendar regressions, typecheck and lint. A deployment needs
its concrete approval after the fix is reviewable and checks pass. No schema,
OAuth-scope, credential or billing change is required. Only the already approved
synthetic event may be used for the subsequent live cancellation check.

If publication cannot occur within the bounded test window, preserve the failed
UI result and perform only the approved fixture cancellation/cleanup through
scoped provider tooling; do not describe that cleanup as a passing app journey.
The code fix and subsequent exact-build live acceptance remain open until proved.
