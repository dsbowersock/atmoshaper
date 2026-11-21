# Sidebar organization and private combined Calendar

Status: local implementation, not published. The owner authorizes the navigation
reorganization and a single calendar workspace with personal/practice layers.

## Product scope

- Atmosphere: Music, one Clock & timer entry, Breathing guide.
- My Wellness: Wellness and My Calendar.
- My Practice: Business Planner, Practice Calendar, Notes.
- Learn & Play: Flashcards and Anatomime. About/account/help stay discoverable.
- Keep legacy URLs and route IDs; remove duplicate sidebar launchers only.
- My Calendar and Practice Calendar open the same calendar component with different
  initial layer selections. Personal, Practice and Together switch in place.
- Preserve the practice scheduler, provider filtering, appointments and existing
  membership checks. Private personal records never become practice events.

## Privacy and ownership

The existing privacy architecture separates owner-scoped self-tracking from
practice scheduling and local professional records. The owner supplied the
[individual/workspace note](../specs/2026-11-20-individual-accounts-practice-workspaces.md).
This branch does not
change memberships, invitations, ownership, sharing grants or the database schema.

The personal layer uses the existing session-authenticated, bounded, paginated
read action. No browser-provided user identity selects records. Bind successful
responses to the verified server actor; remount on actor/practice changes and
discard stale requests, disabled layers and mismatched actors before display.
Clear private snapshots when the layer is off. Read failures remain visible and
partial pages cannot masquerade as complete schedules.

Only generic read-only personal display events enter FullCalendar. Keep full
record details in a private component-owned lookup for the owner's detail dialog.
Do not pass private records to preference writes, booking/reschedule actions,
availability calculations, calendar-event storage, audit logs, analytics, emails
or Google sync. Private items cannot be dragged or resized. A combined view does
not create free/busy blocks, share data with coworkers or broaden practice access.
Keep split-provider layout available for practice-only viewing; personal events
must not be duplicated across provider columns.

## Implementation and verification

Update the central navigation model, icons and practice-calendar special launcher;
preserve active-route behavior for legacy Chimer and nested calendar routes.
Reuse the authenticated practice page for the personal calendar entry point,
including people with no practice. Add a bounded private-layer controller and
read-only event projection to the shared calendar. A full month grid may span
42 days, so bound private reads to at most 45 days with the existing 200-row pages.

Test navigation across guest/client/therapist/staff/admin contexts, legacy routes
and exclusive personal/practice highlighting. Test forged actor IDs, invalid
ranges, pagination, actor mismatch/change, stale responses, toggling off, failed
reads, deduplication and zero private scheduling writes. Use invented records in
isolated UI tests; exercise desktop/phone layer selection and detail readback.
Run relevant domain/controller/source guards, lint and the inert TypeScript build.
Update canonical state/log with actual local results and provide a local preview.
No live provider, database, email, payment or deployment action is included.

## Local handoff

Implementation and privacy/controller checks are recorded in the
[November 21 local verification receipt](../../audits/2026-11-21-sidebar-calendar-workspace.md).
The current combined view includes one selectable authorized practice alongside
the individual's private layer. Practice creation links, forms and return paths
preserve that selection. A simultaneous overlay of every practice and the
separate billing/workspace design remain future work.
