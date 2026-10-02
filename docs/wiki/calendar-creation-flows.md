# Calendar Creation Flows

AtmoShaper calendar creation uses a shared `CalendarEvent` index with specialized detail records for appointments, personal blocks, classes, and reminders.

## Flow Rules

| Flow | Route | Roles | Blocks availability | Detail record |
| --- | --- | --- | --- | --- |
| Staff appointment | `/calendar/new/appointment` | Owner, staff, or therapist creating on their own schedule | Yes | `Appointment` |
| Client request | `/book/[practiceSlug]` | Signed-in client for their own request | Yes while requested or confirmed | `Appointment` |
| Personal event | `/calendar/new/personal` | Owner for any therapist, therapist for self | Yes | `CalendarBlock` |
| Class | `/calendar/new/class` | Owner or staff | Yes | `CalendarClass` |
| Reminder | `/calendar/new/reminder` | Owner, staff, or therapist for self | No | `CalendarReminder` |
| Services | `/calendar/services` | Owner, staff, or therapist provider | N/A | `ServiceType`, `ServiceVariant`, resources |

Appointment requests are reviewed at `/calendar/requests`. Confirming or declining a request updates both `CalendarEvent.status` and the linked `Appointment.status`.

## Data Model

- `CalendarEvent` is the agenda and conflict source of truth: kind, title, owner, start/end, timezone, visibility, status, blocking behavior, creator, and practice.
- `Appointment`, `CalendarBlock`, `CalendarClass`, and `CalendarReminder` store flow-specific details through required one-to-one `eventId` links.
- `ServiceType` is the provider-managed service template. `ServiceVariant` stores bookable duration, processing time, before/after buffers, displayed price/currency, client visibility, and sort order.
- Appointments and classes store service snapshots from the selected variant so later service edits do not rewrite existing bookings.
- `CalendarResource`, `ServiceVariantResource`, and `CalendarResourceBooking` model rooms/equipment required by service variants and prevent overlapping active bookings for those resources.
- Active blocking statuses are `REQUESTED`, `CONFIRMED`, and `ACTIVE`; cancelled, completed, and no-show records do not block availability.
- Reminders are operational only and do not block availability.

## Service Catalog

- Service management lives at `/calendar/services`, `/calendar/services/new`, and `/calendar/services/[serviceId]`.
- Provider-editable attributes include category, description, modality, body-region focus, service color, provider eligibility, client visibility, class eligibility, up to three v1 variants, required resources, reusable documentation/intake template references, contraindication prompts, supplies/setup fields, intake requirements, contraindication notices, cancellation/no-show/deposit/tax/package policy text, and active state.
- Scheduling enforces service variant duration, processing time, buffers, provider availability, provider event conflicts, and resource conflicts.
- Multi-service staff appointments store one appointment plus `AppointmentServiceItem` snapshot rows so combined bookings keep their original service names, durations, buffers, prices, and resources after later service edits.
- Payment/policy fields are stored for future operations, but v1 calendar creation does not collect payments, charge deposits, calculate taxes, redeem packages, or enforce cancellation fees.
- Public booking stays path-first at `/book/[practiceSlug]`; subdomains and custom domains are deferred.

## Operator Workspace

- `/calendar` is the provider scheduling workspace. It uses FullCalendar open-source plugins for day, week, 5-day, and month views, date navigation, click-to-create, drag/drop, and resize.
- Provider view modes are per-user preferences: only me, combined, and split provider panels. Service color is the default event color mode; status coloring remains available as a user preference.
- Drag/drop and resize call server-side reschedule checks before saving. Permissions, provider availability, event conflicts, resource conflicts, and blocking status are revalidated; reminders remain non-resizable.
- Calendar display preferences live in `UserPreference.calendarPreferences`, not browser-only state.

## Advanced Availability

- `TherapistAvailabilityRule` remains the weekly fallback model.
- Named schedules and one-time overrides add provider-specific date-ranged availability without deleting fallback rules.
- Resolution order is: closed/blackout/holiday override, one-time open override, active named schedule, weekly fallback.
- Public booking and staff scheduling both use the resolved availability model.

## Audit And Notifications

- Calendar mutations create `CalendarAuditLog` rows with sanitized metadata.
- Notification behavior is v1 intent-only. `CalendarNotificationIntent` records internal pending notification intent rows; no email, SMS, or push delivery is sent by these flows.
- Audit and notification payloads must not include SOAP notes, pain maps, transcripts, client email/phone/address, diagnosis, treatment notes, or other clinical/identifying detail.

## Entitlements And Labels

- Code checks feature keys, not plan names. Free users receive `calendar_basic_scheduling`; Therapist and Practice receive full service/scheduling access; Practice additionally receives team scheduling.
- Frontend copy uses `Team/Practice` for the paid team tier while the internal Prisma enum remains `PRACTICE`.
- Google Calendar provider sync is implemented as provider-side availability sync. Providers connect Google from `/calendar/sync`, select calendars to read as busy blocks, and AtmoShaper writes generic appointment, class, and personal block events to its own dedicated Google calendar. The repository preparation uses the selected `AtmoShaper` name, validates account identity and project ownership, and preserves a verified stored target after renames. The old project's calendar is not adopted, renamed, or copied. This preparation is not deployed; provider setup, isolated acceptance, and activation remain pending in the [Calendar plan](../superpowers/plans/2026-10-01-atmoshaper-google-calendar-preparation.md).
- Unexpected stored targets, ambiguous discovery, and changed accounts fail closed. Account changes require explicit disconnect; target or permission failures direct users to support. Do not manually replace saved IDs, edit markers to adopt an unrelated calendar, or broaden OAuth grants as a workaround. Existing connections need authorized evidence before any migration is proposed.
- Inactive connection history for another account does not block a new connection and is preserved. Reconnecting the same account still validates its saved target. Discovery and creation stay under the user-row lock, with eight-second requests and a shared 30-second deadline inside the 45-second transaction; provider interruption may leave a marked calendar to rediscover, rather than delete automatically.
- New event inserts retain their existing wait behavior: a local timeout could discard the provider-generated ID of an accepted POST and cause a duplicate on retry. Reads and updates to known event IDs remain bounded. This preserves the existing reconciliation contract; it does not prove end-to-end insert idempotency, which remains an isolated-provider acceptance gate.
- Ordinary sync uses separate aggregate provider read budgets outside the callback: 60 seconds for inbound refresh/target validation and all selected event pages, and 30 seconds for outbound refresh/target validation. Both cached and refreshed credentials pass the signal through account, inventory, and metadata checks. Aborted event pagination records failure without advancing that source's cursor and stops later sources. The budgets do not bound database commit time or discard an already-dispatched new-event POST's returned ID.
- Before creating a calendar, the callback commits a verified-account intent with encrypted credentials, `ERROR` status, and `GOOGLE_CALENDAR_CREATION_PENDING` reason in existing fields. It cannot sync while inactive. A retry can reconcile a discovered validated target, but an empty listing cannot authorize another POST for a pending attempt. The final target/source transaction rolls back independently of that durable intent. The disconnect action also excludes pending intents in its atomic, user/provider-scoped deletion; a direct request cannot erase them or report success. Ordinary resolved connections remain removable. Unresolved or ambiguous outcomes require scoped operator evidence; do not clear the reason, delete rows, or create again solely because time passed.
- This invocation may release its own saved intent after a proven pre-POST failure. The adapter marks dispatch immediately before fetch; no attempted POST or resolved target may be forgotten. Cleanup reacquires the user lock and matches the saved row/version, provider/account, pending state, and absent target before clearing only the reason. Failed cleanup or changed state stays conservative. This positive boundary evidence does not authorize an operator or later callback to infer non-creation from a generic error or empty listing.
- A failed transaction cancels its outstanding discovery before cleanup. Its callback can outlive the database transaction, but cannot dispatch a later POST after this cancellation. Provider-free regression uses the real service/adapter with a controlled late read; live database and provider behavior remain isolated acceptance gates.
- Client calendar connection, Outlook, Apple/iCloud, CalDAV, ICS, and full two-way personal event mirroring remain deferred.
- Stripe Connect marketplace payouts and booking payment collection are deferred; existing Stripe Billing memberships only gate access.

## Privacy Boundary

Calendar sync stores scheduling metadata only. PHI-bearing documentation, intake, journal, transcript, pain-map, ROM, and SOAP content remain local-first unless future hosted clinical storage passes the compliance gates documented in the privacy wiki.

Imported Google events are stored and displayed as generic busy windows only. AtmoShaper does not persist Google event summaries, descriptions, locations, attendees, organizer data, reminders, attachments, or recurrence text, and practice-wide views display the blocks as `Google busy`. Outbound generic titles use AtmoShaper; the private `massagelabEventId` reconciliation key remains unchanged.

Reusable clinical template references on services are allowed only as non-PHI IDs/labels and generic prompts. Client-specific clinical content must stay in local-first documentation, not calendar events, appointment notes, reminders, service records, audit payloads, or notification payloads.
