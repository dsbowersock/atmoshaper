# Offered Google Calendar connection acceptance

Status: **completed at the approved scope; app left connected**. Connection,
generic mirror/cancellation, two explicit refreshes, one Disconnect and one
equivalent reconnect pass. The same dedicated target and all original calendars
are preserved. See the [live receipt](../../audits/2026-11-18-google-calendar-live-test.md).
The original packet below is retained as the consumed operation scope.
The owner's current explicit reply approves the displayed Google account and
the connection, generic event/cancellation and refresh/disconnect/reconnect
scope below. The prepared pre-approval OAuth state expired before execution;
the live page reports Not connected and the callback rejects invalid state
before exchanging credentials or creating a calendar. Start a fresh approved
connection rather than reuse that expired request.
The November 18 daily-backup activation is complete at its recorded scope.
The owner asked to continue the remaining beta work; that permits preparation
of this separately consequential Google permission grant, not automatic consent.

## Existing source and live baseline

The public signed-in Calendar sync page reports configured and Not connected,
and offers Connect Google Calendar. The existing test practice is retained as
AtmoShaper Studio; the intended future working name remains Massage Lab.
The normal Google account picker and subsequent returning-account review load
for the owner. The Continue step is waiting, with no new access granted.

The reviewed offered source requests OpenID/email, calendar-list read access,
free/busy access and writes restricted to app-created calendars. The callback
lists calendar names, validates the Google subject and dedicated app-marked
secondary calendar, and creates that target only after durable creation intent
if no valid target exists. Its public title is AtmoShaper, distinct from the
practice name. The primary calendar is selected for busy import automatically
on initial connection, covering the previous 30 and next 180 days. This copies
availability into the hosted application database; it is not merely sign-in.
The agent must compare actual Google consent with the reviewed scopes before
submission and stop rather than accept broader permissions.

## Proposed bounded owner test

Approval is requested for the displayed owner Google account, existing test
practice and this finite 45-minute workflow. No source deployment or new OAuth
client is part of this packet.

1. Complete one normal connection, storing the account-bound encrypted refresh
   credential through the application's callback. Reuse a verified existing
   dedicated calendar or create at most one through the app's guarded path.
2. Confirm active status and a successful busy refresh without opening existing
   appointment details or recording calendar names, IDs or availability in Git.
3. Create one synthetic Personal entry in the existing test practice for
   November 20, 12:00-12:15 America/New_York, named AtmoShaper beta sync check.
   No attendees, clients, clinical information, invitation or email is included.
   Verify only this entry's generic mirror in the dedicated app calendar.
4. Cancel that owned test entry and confirm its Google mirror is removed through
   the normal recoverable event workflow. Do not permanently delete a calendar,
   existing event or application record.
5. Check one Disconnect and one equivalent reconnect to the same account and
   dedicated target, plus at most two explicit busy refreshes total. Preserve
   the dedicated calendar and finish connected if accepted. Disconnect removes
   the app's stored connection/cache; it is not a claim that Google permissions
   or a previously created Google calendar are revoked/deleted.

Creation ambiguities, missing scopes, account/target mismatch or unexpected
consent stop this test without another calendar creation or widened grant.
The existing reconnect guards and local tests remain evidence; do not replay
an old completed campaign. Keep private references/receipts outside Git and
report exact observed passes versus unresolved inbound/outbound behavior.
