# Dependency advisory triage

Status: read-only classification and maintenance backlog; no dependency update.
This is separate from the fixed CodeRabbit source-review cohorts. The frozen
shipped lockfile and the current sidebar candidate have identical dependencies.

The setup installer reported advisories. A fresh November 21 registry snapshot
reports 42 total (one critical, 18 high, 23 moderate). Omitting development
dependencies reports 15 (three high, 12 moderate), with no critical advisory.
Package counts include transitive impact and do not measure distinct exposed
application vulnerabilities. Keep the snapshot date and dependency paths when
reassessing these results.

| Advisory | Observed dependency path | Exposure assessment |
| --- | --- | --- |
| [proxy-addr IP trust-subnet spoofing](https://github.com/advisories/GHSA-jqcg-44mw-7w3h), critical, installed 2.0.7; patched 2.0.8 | Development-only shadcn → MCP SDK → Express → proxy-addr | The critical advisory disappears when development dependencies are omitted. No application import or server build-trace entry was found. The advisory requires affected proxy trust-subnet configuration; no public application exposure is established here. |
| [Effect template-literal regex denial of service](https://github.com/advisories/GHSA-7589-6fvf-x4pw), high, installed 3.20.0; patched 3.22.1 | Prisma → Prisma configuration package → Effect | Prisma is installed as a production dependency, so npm attributes three high package entries to this chain. Repository usage imports configuration from `prisma.config.ts`; no request-handler import, affected template-literal schema use or server build-trace entry was found. This is a tooling-path inference, not a completed exploitability audit. |

Retain these advisory items for a focused dependency-maintenance branch. Recheck
the complete moderate-advisory list and select compatible patched versions,
then validate generated Prisma client behavior, migration/readiness checks and
the normal application tests. The current source-review task changes no package
versions or lockfile. No claim that every dependency advisory is resolved is made.
