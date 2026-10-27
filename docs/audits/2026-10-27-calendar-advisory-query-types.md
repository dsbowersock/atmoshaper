# Calendar advisory-query type compatibility

The practice-creation and public booking/waitlist advisory queries now return a
Prisma-supported text result. Practice creation also explicitly casts its two
lock keys to integers. The source regression and the later source-matched local
build and all seven ordinary Calendar UI/persistence cases pass. Hosted behavior,
concurrent contention and literal public-artifact acceptance remain separate.

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

## Runtime validation and limits

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
passed, with zero denied provider traffic. This incomplete attempt is historical.

After the separately reviewed test-locator correction, the later source-matched
local run completed its full build and all seven serial Calendar cases: practice,
catalog, policy and availability creation; a staff appointment retained across a
catalog edit and a fifteen-minute drag; personal, class and reminder events;
client request confirmation/decline; and final queue/access presentation. All
three scalar inspections and exact owned cleanup passed. There were zero failed
or skipped cases, retries or denied provider requests.

Those positive practice/client-request paths execute the corrected query owners
against local PostgreSQL. They do not reconstruct the original unretained error
or prove simultaneous lock contention, every Calendar/provider journey, the
literal public artifact or hosted behavior. The seven-case local acceptance and
these remaining limits are separate from the inert compiler/decoder proof.
