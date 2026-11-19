"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { isBreathingShortcut } from "@/lib/breathing-guide"
import styles from "./breathing-guide.module.css"

const QuickGuide = dynamic(() => import("./breathing-guide").then((module) => module.AtmosphereBreathingGuide), {
  ssr: false,
  loading: () => <p role="status">Opening breathing guide…</p>,
})

/** Keeps the current route, timers, backgrounds and shared music mounted. */
export function BreathingQuickAccess({ onBreathingPage }: { onBreathingPage: boolean }) {
  const [open, setOpen] = useState(false)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (!isBreathingShortcut(event)) return
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [role='textbox'], [role='searchbox'], [role='combobox']"))) return
      // Do not pull focus out of another modal or unsaved-work confirmation.
      if (document.querySelector("[role='dialog'][data-state='open']:not([data-breathing-dialog]), [role='alertdialog']")) return
      event.preventDefault()
      if (onBreathingPage) {
        document.querySelector<HTMLElement>("[data-breathing-primary]")?.focus({ preventScroll: true })
        return
      }
      if (!open) previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setOpen((current) => !current)
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [onBreathingPage, open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={styles.dialog}
        overlayClassName="bg-background/35 backdrop-blur-[2px]"
        data-breathing-dialog
        onCloseAutoFocus={(event) => {
          // A keyboard-opened dialog has no Radix Trigger to restore focus to.
          event.preventDefault()
          if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true })
        }}
      >
        <header className={styles.dialogHeader}>
          <DialogTitle>Breathing guide</DialogTitle>
          <DialogDescription>Your music and current view stay in place.</DialogDescription>
        </header>
        <QuickGuide focusOnMount />
      </DialogContent>
    </Dialog>
  )
}
