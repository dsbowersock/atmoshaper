# AtmoShaper branded media bindings

The two independently owned Cloudflare custom domains passed the November 4 delivery check. The check covered six objects with HEAD, CORS preflight and ranged GET. The owner reported revoking the temporary R9 token after the run. Legacy assets remain available for existing consumers.

## Candidate source and public build settings

The local candidate builds from main at `34344f0`. The Signature audio manifest now uses `https://media.atmoshaper.com`. Its new revision is `4afb728dcdc5ed0cdef4d8256a0d187a4e4f585e6feeee1a9a66775e21cc3c45`. Rebinding the candidate back to the legacy origin reproduced the original complete manifest, including all asset keys, hashes, playback policies and rights fields.

| Public setting | Candidate value |
| --- | --- |
| `NEXT_PUBLIC_GENERATIVE_FM_MEDIA_ORIGIN` | `https://media.atmoshaper.com` |
| `NEXT_PUBLIC_CHIMER_PREVIEW_CATALOG_BASE_URL` | `https://media.atmoshaper.com/chimer/background-preview-catalog/catalog-approved-1` |
| `NEXT_PUBLIC_CHIMER_PREVIEW_MEDIA_BASE_URL` | `https://media.atmoshaper.com/chimer/background-previews` |
| `NEXT_PUBLIC_ANATOMY_MEDIA_ORIGIN` | `https://anatomy-media.atmoshaper.com` |

These four settings are scoped to the candidate build. Capture effective Vercel values and scopes before changing them. If the published Chimer catalog is currently absent, enabling it also changes the preview catalog path and requires its own candidate playback evidence. Public build settings take effect with a new artifact. [Vercel environment variable behavior](https://vercel.com/docs/environment-variables)

## Acceptance

- Play and stop one Signature preview. Observe media bytes from the new host and the player's playing state.
- Play and stop one Generative.fm station. Observe the actual index and sample reads from the new host and the player's playing state.
- Open the Clock/Chimer background selector and observe a real preview decode. Verify the published and fallback namespaces separately.
- Start an image flashcard and verify browser image decode. The local case can supply an invented reviewed row via the real projection. Hosted acceptance must use a real eligible image that the hosted app offers. Verify the Anatomime deck remains usable with its seed-only path.
- Keep request counts bounded within Standard R2's included usage. Verify legacy app continuity, the exact artifact and public routing before and after any later promotion. [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)

## Live artifact decision and rollback

The live AtmoShaper alias resolved to `38d0ded` on November 4. Main was 207 commits ahead. Promoting a build of main would release other product changes as well as these media bindings. The media task's local candidate and public-routing decisions are separate. A production change must explicitly select the intended source and protect the currently mapped artifact for rollback. Record exact environment scopes and verified effective values, use the existing build/readiness gates, and evaluate the protected candidate before any public alias move. If acceptance fails, restore the saved artifact and the exact approved prior settings. Preserve original buckets, URLs, routes and assets.
