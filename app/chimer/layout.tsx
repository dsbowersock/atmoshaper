import { createPublicPageMetadata } from "@/lib/seo"

export const metadata = createPublicPageMetadata("/chimer")

/** Keeps Chimer's route metadata and neutral layout inside the shared main landmark. */
export default function ChimerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div>{children}</div>
}

