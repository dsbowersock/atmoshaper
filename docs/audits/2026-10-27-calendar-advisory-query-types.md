# Calendar advisory-query type compatibility

The practice-creation and public booking/waitlist advisory queries now return a
Prisma-supported text result. Practice creation also explicitly casts its two
lock keys to integers. The source regression and real private browser practice
creation pass; the complete Calendar browser journey remains open.

## Change and preserved behavior

- `app/calendar/actions/setup.ts` uses
  `pg_advisory_xact_lock(...::int, ...::int)::text`. Its keys remain `8520` and
  `1`. The owner-row lock, slug lock, quota check, slug lookup and nested create
  remain ordered inside the same transaction.
- `lib/public-booking-idempotency.ts` adds only `::text` to the result of
  `pg_advisory_xact_lock(hashtextextended(..., 0))`. The bigint hash expression,
  seed, versioned UUID prefix and booking/waitlist namespaces remain unchanged.
  Changed selections sharing a request UUID still use the same prefix lock.

There is no fallback, retry, schema change or reduction in locking. Request
ownership, replay-selection checks and caller transaction boundaries are
unchanged.

## Evidence

`tests/calendar-advisory-lock.test.mjs` executes the actual source helpers with
the installed Prisma client and Neon adapter against an injected fake pool.
Socket, TLS and fetch entrypoints are blocked. The production private helper is
exposed only in the in-memory test module.

The installed query compiler reports the numeric parameters as `decimal`.
Supplying the native PostgreSQL `void` field type, OID `2278`, makes the actual
decoder reject both original helpers with `P2010`. Explicit integer arguments
alone do not fix that result-decoding failure. Supplying text OID `25` for the
cast result succeeds. This is actual client/decoder evidence with invented wire
responses; it does not establish a real PostgreSQL overload error, `42883`, or
bigint parameter inference.

Before the source edits, the corrected focused regression had three passing
tests and two failures in the actual helper calls. Afterward, all five passed,
including negative controls that retain the unsupported-void failures. The
public candidate's named `test:calendar-advisory-lock` command also runs the
existing Calendar creation and public-request ownership contracts: **38 passed,
zero failed or skipped**. Scoped `lint:calendar-advisory-lock` passed. Existing
checks cover lock ordering, UUID namespaces and exact replay selection.

## Runtime limit

The earlier local Calendar journey failed during practice creation with a
retained `P2010`; its underlying SQL error was not retained. A subsequent private
candidate build failed before browser execution with `ENOMEM` during a webpack
cache write and a native-process failure. Its owned cleanup was verified.
Neither failed attempt proves the original failure's exact cause. After a
separately reviewed QA-only build-memory adjustment, the full build passed and
the next private journey created the practice through the real form and passed
its persisted-state readback. The second case stopped at the test helper's
checkbox-label assertion before another completed mutation: one case passed,
one failed and five were unrun. All three scalar inspections and owned cleanup
passed, with zero denied provider traffic.

That positive practice result exercises the corrected query against the local
PostgreSQL service. It does not reconstruct the original unretained error,
exercise the later public booking/waitlist lock or prove concurrent lock
contention, the complete Calendar journey, the literal public artifact or hosted
behavior. Those limits are separate from the inert compiler/decoder proof. No
deployment or publication result is claimed.
