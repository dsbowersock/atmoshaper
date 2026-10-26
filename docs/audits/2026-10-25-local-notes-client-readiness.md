# Local Notes client readiness - October 25, 2026

## Result

Runtime source `f85c10b3a081f3218680292bed43867ae9fa6a92` closes three
reproduced local client defects and passes the full cached application build.
Earlier source commits are `5f93571` (SOAP date) and `113ebbd` (backup layout).
The final closeout commit changes documentation only. This branch is local;
Chimer `58a34e9`, anatomy `cc56763` and the older anatomy `75d599a` refs remain.

## Actual findings and repairs

1. The real SOAP client changed an entered October 1 session date to October 25
   after Next then Previous. `IdentifyingInfo` assigned today's date whenever
   its effect ran. It now initializes only an empty date, preserving the current
   date policy and therapist-default precedence. Existing saved dates, step
   remounts and settings updates have real-editor regression coverage; all five
   corrected cases pass.
2. At a 320-pixel viewport, the shared encrypted transfer grid expanded to a
   no-wrap button. Document width measured 321 pixels and the import button's
   right bound 321.17 pixels. A single minmax-zero track and bounded wrapping
   labels fit narrow cards; the desktop two-column layout remains.
3. One real denied vault write left ciphertext intact in all four tools, but
   Journal, ROM and SOAP showed no failure status. Intake reported the failure
   and was the control. The three affected consumers now handle the existing
   null save result in their visible message and expose it as a status. No
   private exception content is displayed. No vault API, crypto, storage,
   merge/retry policy or successful-save contract changes.

## Checks and environment

| Check | Final evidence |
| --- | --- |
| Same settled date regression on original snapshot | Five cases: two pass, three fail |
| Corrected actual-editor regression | Five pass; new-empty, existing, remount, settings update and explicit cleared-date initialization |
| Existing clinical contracts | 62 pass, no fail/skip |
| Scoped lint and TypeScript | Both pass |
| Full cached Next.js webpack build | Pass on `f85c10b`; six guards, no networking or unrelated executables |
| Source integrity | All 2,186 archived inputs match the frozen tree and checkout before documentation closeout |
| Font/build isolation | Actual DSEG7 Modern bytes present; existing local external-Inter fixture; no install/client generation/provider use |
| Actual browser workflow matrix | 23 cases pass; 12 tool/viewport widths fit |
| Final independent denied-save comparison | Four clients each show failure, retain ciphertext, and attempt exactly one write |
| Browser health | Zero page/console errors, unexpected/failed requests or overlays in final runs |
| Cleanup | Owned profiles and generated sources/builds removed; returned encrypted backup paths absent |

Browser plugin/browser skill is absent; cached Playwright uses proxy isolation,
content-free Node network/executable guards and fresh disposable storage.
`http://127.0.0.1:43930/notes/{journal,rom,intake,soap}` is an in-memory route
fixture, not a server or a real protected application origin. Actual production
React clients, their real vault/settings/bootstrap providers, cryptography and
compiled global CSS run unchanged. The only route transport is a fixture; no
authenticated account/session or application database is created. Client
acceptance starts after the server entitlement boundary and does not test it.

The five date regressions use the actual identity editor and real anonymous
no-sync settings providers. Controlled parent/step changes settle through React
`act` in its development testing build. The separate real-client workflow uses
production React and ordinary visible controls. It reproduces the original date
failure and verifies the fixed Next/Previous behavior and persisted readback.

| Browser viewport | Journal | ROM | Intake | SOAP |
| --- | --- | --- | --- | --- |
| 1440 x 1000 | Pass | Pass | Pass | Pass |
| 390 x 844 | Pass | Pass | Pass | Pass |
| 320 x 740 | Pass | Pass | Pass | Pass |

The 23 workflow cases comprise twelve tool saves, three all-tool lock/reload
recoveries, four denied-save paths, three explicit output-boundary checks and
one encrypted import into isolated browser storage. The actual intake enforces
its two required consents before saving. Its local client/response seeds SOAP;
manual ROM readback verifies the invented 20-to-65-degree difference of 45.

All stored values omit the invented clinical markers in plaintext and use no
legacy plaintext-draft keys. Wrong passwords leave ciphertext unchanged; correct
unlock restores the saved records/date. A simulated quota error produces one
write attempt and visible feedback in each tool, with the original data retained.
DOC/PDF warnings are canceled without a plaintext download. Three real encrypted
`.mlab` bundles contain no plaintext marker; the last restores all four tools in
separate context storage. The returned temporary download paths are absent after
closure. This does not establish a physical-device or cross-browser recovery SLA.

Manual screenshot review confirms the wrapped narrow backup controls, the
restored SOAP date and the visible failed-save message beside the Save control.
Screenshots, content-free receipts and original failures remain in the owner-only
local acceptance packet outside Git; no real client record or private identifier
is committed.

## Preserved failures and method limits

Original app failures are retained separately from fixture/setup errors. Early
local setup corrections cover Windows file-URL preloading, Next browser process
support, the real SOAP settings-provider ancestry and the exact cached Chromium
binary. The first cleared-date assertion ran before effects settled; React act
now settles them. Its development export and immediate awaiting, plus a fixture
syntax correction, are recorded without rewriting prior receipts.

An incomplete invented intake correctly failed required-consent validation. An
alert-dialog check initially counted its closing animation; it now awaits the
hidden state and still requires zero downloads. A new custom download directory
produced one canceled local download for an unresolved reason; no application
cause was inferred. The unchanged source passed with standard temporary browser
artifacts, whose exact returned paths were recorded and checked absent afterward.
No request was retried against an external provider. All original logs remain.

The first preservation snapshot's trimmed status prefix omitted one dirty-file
hash in each of two unrelated worktrees. Supplemental checks match both files to
the preceding complete preservation receipt; all 98 canonical-worktree and 13
shared-cache-worktree dirty paths are verified. No previous receipt was edited.

## Cleanup and migration boundary

Twenty-one owned profiles, five exact dependency junctions, four source
snapshots/archives, six generated fixture bundles and newly owned compiler/build
caches are removed after their workers stop. Junctions are unlinked without
traversing shared targets. Shared dependencies/generated Prisma schema, unrelated
worktrees, original branches, publisher evidence, screenshots and receipts remain.
The canonical handoff receives only its four owned record updates.

This phase uses invented browser-local data only. No credentials, real account,
application database, hosted clinical rows, provider operation, payment/email,
cloud media, publication, merge, routing, Production or Sentry action ran.
The $15 media proposal remains declined; cloud media requests remain capped at
$0 and the separate storage budget is unchanged.

Server membership/role authorization, real account/recovery and privileged admin
journeys, final protected/public origins, installed-device PWA upgrades, actual
sensors/printing, Calendar/provider flows, media delivery/binding, all-purchase
activation and launch/rollback decisions remain separately open. Closed Ably,
Sentry and purchase grants are not replayed. Wider future-tool/content work is
not substituted for these remaining migration requirements.
