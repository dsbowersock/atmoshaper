# CI Chromium installation headroom

The authorized PR review/fix loop encountered repeated total-job cancellations
without reported assertion failures. Repeating otherwise identical jobs has not
made their existing setup budget reliable, so this is a focused CI budget repair.
It changes no application code, test coverage, individual test timeout or retry.

## Actual failure evidence

GitHub annotations identify the job limits, and logs identify the preceding
Chromium OS-package installation phase. This is not an application-root-cause
claim or a claim about why the package mirror was slow.

| PR/head | Job | Chromium setup | Remaining test time before cancellation |
| --- | --- | --- | --- |
| #53 / 627c47c | browser lane 3, 121510460342 | 10:05:37–10:18:56 UTC, about 13m19s | about 11m18s; job cap 25m |
| #54 / cf1f57c | browser lane 3, 121510336632 | 10:05:28–10:21:38 UTC, about 16m10s | about 8m19s; job cap 25m |
| #55 / 43e6361 | Code quality, 121509579419 | 10:05:29–10:20:11 UTC, about 14m42s | about 3m06s; job cap 20m |

The logs show slow apt font/dependency fetching with repeated package attempts;
one fetch summary reports 20.7 MB in 12m56s. The Chromium binaries themselves
downloaded in seconds afterward. An extra browser-binary cache would not address
that observed OS-package delay, so none is introduced. No package source,
transport, system dependency or runner image is changed on an unsupported guess.

## Bounded correction

1. Update Code quality's total job cap from 20 to 30 minutes.
2. Update each browser lane's total cap from 25 to 40 minutes, including its
   already-supported rerun-only build fallback and diagnostic upload.
3. Preserve the build's 12-minute cap, aggregate's two-minute cap, four lanes,
   fail-closed aggregate, read-only token permissions, inert provider environment,
   exact-sha/attempt artifacts, test commands, assertions and retry policy.
4. Update the existing workflow contract and run the named CI-harness checks,
   scoped lint and diff checks. These are source/inert checks, not an app build,
   protected browser case or database operation.
5. Publish within the existing review/CI-fix grant, synchronize dependencies,
   then follow the new actual-head CI and included review. Prior green jobs and
   local policy checks cannot establish hosted completion of the new budgets.

The repository metadata was rechecked as public on October 26. The workflow
continues to use standard `ubuntu-latest` runners. [GitHub's runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
states that standard hosted runners are free for public repositories. No larger
runner, paid review, new artifact/cache retention or Production change is added.

## Validation

The corrected budget contract reproduced 161 passes and one failure against the
old caps. After the workflow correction all 162 CI-harness checks pass, including
inert cached-browser fixtures. Scoped lint and diff checks pass. The existing
contract still checks every upstream aggregate, four-lane coverage, isolated
build/runtime environment and exact artifact binding. No app build or database
ran locally. Hosted results and applicable current-head review remain pending;
this source proof cannot establish that future package setup finishes in time.
