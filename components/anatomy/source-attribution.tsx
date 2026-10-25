import type { AnatomyStudyMedia, AnatomyStudySource } from "@/lib/anatomy-study"

/** Public credit metadata may omit a link; never turn other schemes or credentials into navigation. */
function attributionLicenseHref(value: string | undefined) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return undefined
    return url.href
  } catch {
    return undefined
  }
}

/** Link the supplied per-source/per-asset license, preserving readable text when no safe link exists. */
export function AnatomyLicenseLabel({ license, licenseUrl }: { license?: string; licenseUrl?: string }) {
  if (!license) return null
  const href = attributionLicenseHref(licenseUrl)
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{license}</a>
  ) : <span>{license}</span>
}

/** Keep full supplied credits available on the study page without crowding the card's source-name links. */
export function AnatomySourceCredits({ sources }: { sources: readonly AnatomyStudySource[] }) {
  if (sources.length === 0) return null
  return (
    <details className="text-xs leading-relaxed text-muted-foreground">
      <summary className="cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Credits and licenses</summary>
      <ul className="mt-2 space-y-2">
        {sources.map((source) => (
          <li key={source.id}>
            <p className="font-medium">
              {source.label}
              {source.license ? <> · <AnatomyLicenseLabel license={source.license} licenseUrl={source.licenseUrl} /></> : null}
            </p>
            {source.attribution ? <p className="break-words">{source.attribution}</p> : null}
          </li>
        ))}
      </ul>
    </details>
  )
}

/** Attribute the selected image itself; its source or license may differ from the answer's references. */
export function AnatomyMediaCredit({ media }: { media: AnatomyStudyMedia }) {
  return (
    <figcaption className="border-t border-border/80 px-3 py-1 text-[11px] leading-tight text-muted-foreground">
      <p className="break-words">
        {media.attribution || "Anatomy image"}
        {media.license ? <> · <AnatomyLicenseLabel license={media.license} licenseUrl={media.licenseUrl} /></> : null}
      </p>
    </figcaption>
  )
}
