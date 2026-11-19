import Link from "next/link"
import { ArrowLeft, Music2 } from "lucide-react"
import { AtmosphereBreathingGuide } from "@/components/atmosphere/breathing-guide"
import styles from "@/components/atmosphere/breathing-guide.module.css"
import { Button } from "@/components/ui/button"
import { createPublicPageMetadata } from "@/lib/seo"

export const metadata = createPublicPageMetadata("/wellness/breathing")

/** The shell supplies the viewport remaining above navigation and active audio. */
export default function WellnessBreathingPage() {
  return (
    <div className={styles.page} data-breathing-page>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div><h1>Breathing guide</h1><p>One calm breath at a time.</p></div>
          <nav aria-label="Breathing guide navigation" className={styles.links}>
            <Button asChild variant="ghost" title="Wellness hub">
              <Link href="/wellness" aria-label="Wellness hub"><ArrowLeft aria-hidden="true" /><span>Wellness</span></Link>
            </Button>
            <Button asChild variant="ghost" title="Music stations">
              <Link href="/music" aria-label="Music stations"><Music2 aria-hidden="true" /><span>Music</span></Link>
            </Button>
          </nav>
        </header>
        <AtmosphereBreathingGuide />
        <p className={styles.shortcut}>Quick access anywhere <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd></p>
      </div>
    </div>
  )
}
