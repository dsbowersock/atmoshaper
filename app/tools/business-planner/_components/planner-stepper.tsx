"use client"

import Link from "next/link"
import { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react"
import { ArrowLeft, ArrowRight, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import styles from "./business-planner.module.css"

type PlannerStepProps = {
  id: string
  title: string
  shortTitle?: string
  description?: string
  children: ReactNode
  active?: boolean
  ownerId?: string
  keepMounted?: boolean
}

const StepNavigationContext = createContext<((stepId: string, focusId?: string) => void) | null>(null)

/** Revisits an input from a result panel using the same step state and focus
 * lifecycle as Back/Continue, without resetting the worksheet or changing routes. */
export function PlannerStepJump({ stepId, focusId, children }: { stepId: string; focusId?: string; children: ReactNode }) {
  const navigate = useContext(StepNavigationContext)
  return <Button type="button" variant="ctaBlue" onClick={() => navigate?.(stepId, focusId)}>{children}</Button>
}

/** Input sections retain their drafts. Result-only panels may defer charts until visible. */
export function PlannerStep({ id, title, description, children, active = false, ownerId = "planner", keepMounted = true }: PlannerStepProps) {
  return (
    <section hidden={!active} className={styles.stepPanel} data-planner-step={id} aria-labelledby={`${ownerId}-${id}-heading`}>
      <div className={styles.stepHeading}>
        <h2 id={`${ownerId}-${id}-heading`} tabIndex={-1}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {active || keepMounted ? children : null}
    </section>
  )
}

/** Guides one worksheet without treating visited stages as completed work.
 * Children must be PlannerStep elements; they remain mounted across navigation.
 * Section jumps are unrestricted so an estimate can be reviewed and revised. */
export function PlannerStepper({ label, children }: { label: string; children: ReactNode }) {
  const steps = Children.toArray(children).filter((child): child is ReactElement<PlannerStepProps> => isValidElement<PlannerStepProps>(child) && child.type === PlannerStep)
  const [activeStep, setActiveStep] = useState(0)
  const ownerId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const focusRequested = useRef(false)
  const requestedFocusId = useRef<string | undefined>(undefined)
  const current = steps[activeStep]

  useEffect(() => {
    if (!focusRequested.current) return
    focusRequested.current = false
    const field = requestedFocusId.current ? document.getElementById(requestedFocusId.current) : null
    requestedFocusId.current = undefined
    if (field && rootRef.current?.contains(field)) {
      field.scrollIntoView({ block: "center" })
      field.focus({ preventScroll: true })
      return
    }
    rootRef.current?.scrollIntoView({ block: "start" })
    rootRef.current?.querySelector<HTMLElement>("[data-planner-step]:not([hidden]) h2")?.focus({ preventScroll: true })
  }, [activeStep])

  function goToStep(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= steps.length || index === activeStep) return
    focusRequested.current = true
    setActiveStep(index)
  }

  if (!current) return null

  return (
    <StepNavigationContext.Provider value={(stepId, focusId) => {
      requestedFocusId.current = focusId
      goToStep(steps.findIndex((step) => step.props.id === stepId))
    }}>
    <div ref={rootRef} className={styles.stepper} data-planner-stepper>
      <nav aria-label={label} className={styles.stepNavigation}>
        <div className={styles.stepProgress}>
          <span>Step {activeStep + 1} of {steps.length}</span>
          <span>Your entries stay in place between steps.</span>
        </div>
        <label className={styles.stepSelect}>
          <span className="sr-only">Go to planning step</span>
          <select value={activeStep} onChange={(event) => goToStep(Number(event.target.value))}>
            {steps.map((step, index) => <option key={step.props.id} value={index}>{index + 1}. {step.props.shortTitle ?? step.props.title}</option>)}
          </select>
        </label>
        <ol className={styles.stepList}>
          {steps.map((step, index) => (
            <li key={step.props.id}>
              <Button type="button" variant={index === activeStep ? "ctaBlue" : "ghost"} className={styles.stepButton} aria-current={index === activeStep ? "step" : undefined} onClick={() => goToStep(index)}>
                <span aria-hidden="true" className={styles.stepNumber}>{index + 1}</span>
                <span>{step.props.shortTitle ?? step.props.title}</span>
              </Button>
            </li>
          ))}
        </ol>
      </nav>
      {steps.map((step, index) => cloneElement(step, { active: index === activeStep, ownerId }))}
      <div className={styles.stepActions}>
        <Button type="button" variant="ghost" disabled={activeStep === 0} onClick={() => goToStep(activeStep - 1)}><ArrowLeft aria-hidden="true" />Back</Button>
        {activeStep < steps.length - 1 ? (
          <Button type="button" variant="ctaBlue" onClick={() => goToStep(activeStep + 1)}>Continue<ArrowRight aria-hidden="true" /></Button>
        ) : (
          <Button asChild variant="ctaBlue"><Link href="/tools/business-planner"><LayoutGrid aria-hidden="true" />All business tools</Link></Button>
        )}
      </div>
    </div>
    </StepNavigationContext.Provider>
  )
}
