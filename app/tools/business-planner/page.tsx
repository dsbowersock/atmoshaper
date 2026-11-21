import Link from "next/link"
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Calculator,
  ClipboardList,
  ListChecks,
  NotebookPen,
  PackagePlus,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BUSINESS_PLAN_TOOL_ROUTES } from "@/lib/business-plan-template-tools"
import { createPublicPageMetadata } from "@/lib/seo"
import { PlannerHeader } from "./_components/planner-header"
import styles from "./_components/business-planner.module.css"

export const metadata = createPublicPageMetadata("/tools/business-planner")

const toolIcons = {
  BadgeDollarSign,
  Calculator,
  ClipboardList,
  ListChecks,
  NotebookPen,
  PackagePlus,
} satisfies Record<string, LucideIcon>

// Short launcher hints complement the unchanged route names and descriptions.
const toolHints: Record<string, string> = {
  "/tools/business-planner/income": "Income, hours and session prices",
  "/tools/business-planner/break-even": "Opening costs and ongoing bills",
  "/tools/business-planner/launch-checklist": "Work through your launch tasks",
  "/tools/business-planner/service-menu": "Services, prices and client policies",
  "/tools/business-planner/plan-outline": "Write and review your business plan",
  "/tools/business-planner/add-on-profit": "Compare costs, sales and profit",
}

export default function BusinessPlannerHubPage() {
  return (
    <div className={styles.page} data-business-planner-hub>
      <div className={`${styles.workspace} ${styles.hubWorkspace}`}>
        <PlannerHeader title="Business planner tools" description="Plan your income, services and next steps for your massage practice." icon={BriefcaseBusiness} backHref={null} />
        <nav aria-label="Business planner tools" className={styles.hubGrid}>
          {BUSINESS_PLAN_TOOL_ROUTES.map((tool) => {
            const Icon = toolIcons[tool.icon as keyof typeof toolIcons] ?? BriefcaseBusiness
            return (
              <Button asChild key={tool.href} variant="glow" className={styles.hubTool}>
                <Link href={tool.href} aria-label={tool.title}>
                  <Icon aria-hidden="true" /><strong>{tool.title}</strong><small>{toolHints[tool.href]}</small>
                </Link>
              </Button>
            )
          })}
        </nav>
        <details className={styles.hubNote}>
          <summary>Use these numbers as planning estimates</summary>
          <p>The planner is for education and business planning. It does not replace tax, accounting, employment, or legal advice.</p>
          <Link className="inline-block font-medium text-primary underline-offset-4 hover:underline" href="/about">Learn why AtmoShaper is building tools from inside massage practice</Link>
        </details>
      </div>
    </div>
  )
}
