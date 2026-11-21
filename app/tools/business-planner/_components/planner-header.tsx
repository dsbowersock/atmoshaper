import Link from "next/link"
import { type ComponentProps, type ReactNode } from "react"
import { ArrowLeft, Save, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import styles from "./business-planner.module.css"
import { BUSINESS_PLANNER_NOTICE, BUSINESS_PLANNER_SHORT_NOTICE } from "@/lib/business-planner-guidance"

/** Keeps every worksheet's title, real save state and optional help compact. */
export function PlannerHeader({
  title, description, icon: Icon, saveLabel, guide, children, className,
  backHref = "/tools/business-planner", ...props
}: Omit<ComponentProps<"header">, "title"> & {
  title: string
  description: string
  icon: LucideIcon
  saveLabel?: string
  guide?: ReactNode
  backHref?: string | null
}) {
  return (
    <header {...props} className={cn(styles.header, className)}>
      <div className={styles.titleRow}>
        <Icon className={styles.titleIcon} aria-hidden="true" />
        <h1>{title}</h1>
        {backHref ? <Button asChild variant="ghost" className={styles.backLink}>
          <Link href={backHref} aria-label="Back to business tools" title="Back to business tools"><ArrowLeft aria-hidden="true" /></Link>
        </Button> : null}
      </div>
      <p className={styles.subtitle}>{description}</p>
      <details className={styles.plannerGuidance}><summary>{BUSINESS_PLANNER_SHORT_NOTICE}</summary><p>{BUSINESS_PLANNER_NOTICE}</p></details>
      {saveLabel || guide ? <div className={styles.meta}>
        {saveLabel ? <p className={styles.saveStatus} aria-live="polite" aria-atomic="true"><Save aria-hidden="true" /><span>{saveLabel}</span></p> : null}
        {guide ? <details className={styles.help}><summary>How this planner works</summary>{guide}</details> : null}
      </div> : null}
      {children ? <div className={styles.headerTools}>{children}</div> : null}
    </header>
  )
}
