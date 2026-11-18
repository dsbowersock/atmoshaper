# Beta dependency security follow-up

Status: isolated preparation; no deployment or new service operation authorized.
Base: `2ab17b7`, containing the approved Calendar fix and supported CI runner.
The public site remains the separately approved `cdea4a6` artifact.

## Evidence and scope

The current production dependency audit reports 17 affected package entries,
including two critical-labelled entries. Counts are package metadata, not proof
that every advisory is exploitable. The installed Next.js 16.2.12 is affected by
the vendor's [Server Actions denial-of-service advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r),
and this application uses App Router Server Actions. The
[image-processing advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw)
also requires a fixed Sharp; the existing direct pin and Next-specific override
otherwise retain the vulnerable 0.35.3 version across fresh installs.

The [Sentry tunnel advisory](https://github.com/getsentry/sentry-javascript/security/advisories/GHSA-mchm-gjx6-7h55)
requires a tunnel, webpack and middleware-only authorization beneath the tunnel.
This application has no tunnel configured and its public build uses Turbopack.
The vendor describes that advisory as moderate, unlike the audit's aggregate
critical label. Update within Sentry major 10 as maintenance; do not claim an
observed application bypass or repeat the completed mapped-error/email campaign.

## Targeted changes

1. Pin Next.js and its ESLint config to 16.4.6, a current patched major-16 release.
2. Pin direct Sharp and its Next override to 0.35.5; preserve tracing includes.
3. Raise the Sentry major-10 minimum to 10.75.2 and resolve a patched lockfile.
4. Preserve the historical Nodemailer import alias while updating its underlying
   runtime to 10.6.0. The vendor's major-10 minimum is Node 20; this app requires
   Node 24. Its fixed-field SMTP API remains covered by the actual stream-delivery
   contract test and bounded transport tests. No SMTP setting or live mail replay.
5. Remove the unused direct Zod 3 dependency: repository app/lib/scripts have no
   import and dependency explanation shows that copy belongs only to the root.
   Leave development tools' own compatible Zod dependencies in their own trees.
6. Raise existing brace-expansion overrides and source-map-js to patched versions;
   require all resolved copies to meet the updated security floors.
7. Align Prisma CLI, client and Neon adapter on patched major-7 release 7.10.1.
   Its config uses fixed deepmerge-ts 8.0.2, resolving the remaining shared high
   advisory without forcing an incompatible override into the older config.
   Generate/validate only; never run a migration or connect to a database here.
8. Preserve schema/migrations, identity, entitlements, mail settings,
   provider settings, and all unrelated overrides. Triage remaining audit entries
   explicitly; do not apply an unrestricted `npm audit fix --force`.

## Validation and release boundary

Install/update the lockfile in this environment-free isolated checkout. Generate
and validate Prisma without a connection, then run lint, typecheck, existing
Sentry/privacy, auth and image-artwork checks, CI harness and optimized build.
Run wider provider-free regression/browser checks when the dependency changes
or failures justify them; record actual failures and setup prerequisites. Rerun
the production audit to distinguish removed findings from residual work.

Keep the approved public build and rollback intact. Prepare a reviewable source
change and exact candidate before requesting any further Production build,
source-map upload or publication authority. No real email, payment, token grant,
database mutation, fixture replay or media mutation belongs to these checks.
