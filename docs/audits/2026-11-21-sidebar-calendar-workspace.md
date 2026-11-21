# Sidebar and private combined Calendar local verification

This work is local on `codex/sidebar-calendar-workspace`, based on the previous
publication receipt `f9f7d17`. The previous public release remains `0976d7d`.
No publication, provider, billing, membership, database, email or payment operation
is performed by this branch.

## Result

The sidebar separates Atmosphere, My Wellness, My Practice and Learn & Play.
Business Planner and Clock & timer each have one visible launcher. Hidden legacy
route definitions, direct URLs, account/help navigation and role gates remain.

My Calendar and Practice Calendar open the same calendar workspace with different
initial sources. Personal, Practice and Together switch in place. Together shows
the individual's private items alongside one selected, authorized practice.
Multiple existing memberships are selectable; this is not yet a simultaneous
overlay of every practice. Creation links, role checks, forms and return paths
retain the selected practice. Existing practice read windows and row limits are
unchanged.

The personal action reads only the session owner's records, appointments as a
client and reminder settings. Requests cannot choose another owner. Responses
carry their authenticated actor, and the controller rejects wrong-owner, stale,
disabled and old-range results. A page reporting a changed/expired session clears
the previous snapshot. Personal-only controls do not overwrite practice
preferences. Failed or incomplete reads have visible recovery/pagination states.

FullCalendar receives read-only generic labels, times and private lookup keys.
Full record details stay in the owner-bound dialog. Personal items do not enter
scheduling writes, practice availability/free-busy, Google sync, notifications or
preference payloads. Their drag callback is also guarded before any server action.
Split-provider viewing remains available in Practice view; Together renders the
personal layer once. Appointment IDs prevent displaying the same visit twice.

## Verification

- 97 focused navigation, ownership, range, controller, pagination, practice-read,
  creation-route, sidebar and scheduling projection tests pass.
- 84 Calendar sync/isolation checks and 45 scheduling/cancellation checks pass.
- The actual React/FullCalendar browser fixture passes phone (390 × 844), desktop
  (1280 × 900) and no-practice journeys. Source switching, private detail readback,
  disabled unauthorized sources, month weekday labels and viewport containment
  pass, with no unexpected external requests, page errors or action writes.
  Its source CSS is compiled independently of `.next`, so clean-checkout unit CI
  can run it before the application build.
- Whole-repository lint and the focused changed-source lint pass.
- The final inert Next build passes compilation, TypeScript and all 116 generated
  pages. No live account or clinical records are needed for these checks.
- Both full-app anonymous sidebar journeys pass against that artifact on desktop
  and phone, including consolidated launchers and the separate Calendar entries.

Local command receipts and synthetic screenshots are under the ignored
`output/sidebar-calendar-workspace/` directory. The loopback-only sample Calendar
can be restarted with `npm run preview:calendar-workspace` at port 3024. Its server
actions and navigation terminate in test doubles; all sample data is fictional.

## Product direction and next boundary

The owner's [individual accounts and practice/group note](../superpowers/specs/2026-11-20-individual-accounts-practice-workspaces.md)
is retained: individual identities, multiple workspaces, and possible sponsored or
consensually split practice fees. Subscription structure, invitations, charging,
departures, record custody and migration need a separate design. This branch
does not implement or activate that billing model.

Publication requires the separately authorized release workflow. Source rollback
requires no data migration because the ownership model, durable storage and
provider configuration are unchanged.
