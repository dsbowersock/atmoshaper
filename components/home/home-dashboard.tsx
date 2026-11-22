"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef, useState, useSyncExternalStore } from "react"
import { BookOpen, Brain, BriefcaseBusiness, CalendarDays, Calculator, ChevronRight, ClipboardList, Clock, Compass, FileText, HeartPulse, Music, Radio, Timer, UserRound, Wind } from "lucide-react"
import { AppPageShell } from "@/components/ui/app-surface"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { HomeShortcut, HomeToolGroup } from "@/lib/home-dashboard"
import { PUBLIC_PRODUCT_IDENTITY } from "@/lib/public-product-identity"

const icons = {BookOpen,Brain,BriefcaseBusiness,CalendarDays,Calculator,ClipboardList,Clock,Compass,FileText,HeartPulse,Music,Radio,Timer,UserRound,Wind}
export const HOME_VISITED_KEY = "atmoshaper.home.visited.v1"
const changedEvent = "atmoshaper-home-visited"
const subscribeHydration = () => () => {}

function readVisited() {
  try { return localStorage.getItem(HOME_VISITED_KEY) === "1" } catch { return false }
}
function subscribeVisited(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(changedEvent, onChange)
  return () => {window.removeEventListener("storage", onChange);window.removeEventListener(changedEvent, onChange)}
}

/** Compact launcher. Its only browser preference is a dismissible introduction;
 * no account identity, activity history or private records enter this state. */
export function HomeDashboard({signedIn,shortcuts,groups,setupReminder}: {
  signedIn:boolean
  shortcuts:HomeShortcut[]
  groups:HomeToolGroup[]
  setupReminder?:React.ReactNode
}) {
  const visited = useSyncExternalStore(subscribeVisited, readVisited, () => false)
  // A server-rendered sheet button must not accept an inert first tap while
  // Next is still attaching its client handlers on a cold connection.
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false)
  const [visitedThisMount, setVisitedThisMount] = useState(false)
  const [panel,setPanel] = useState("all")
  const [panelOpen,setPanelOpen] = useState(false)
  const panelTrigger = useRef<HTMLButtonElement | null>(null)
  const toolsHeading = useRef<HTMLHeadingElement | null>(null)
  const returning = signedIn || visited || visitedThisMount
  const selectedGroups = panel === "all" ? groups : groups.filter((group) => group.id === panel)
  const panelTitle = panel === "about" ? "About AtmoShaper" : panel === "all" ? "All tools" : panel === "education" ? "Study & play" : "Practice tools"

  function dismissIntroduction() {
    setVisitedThisMount(true)
    try { localStorage.setItem(HOME_VISITED_KEY,"1");window.dispatchEvent(new Event(changedEvent)) } catch { /* Storage may be disabled; this visit still works. */ }
  }

  // Several launchers share one sheet, so restore keyboard focus to the exact
  // opener instead of relying on a single Radix SheetTrigger.
  function openPanel(name:string, trigger:HTMLButtonElement) {
    panelTrigger.current = trigger
    setPanel(name)
    setPanelOpen(true)
  }

  return (
    <AppPageShell width="standard" className="min-h-0 py-5 sm:py-8" contentClassName="gap-6 sm:gap-8">
      <header className="flex min-w-0 items-center justify-between gap-2">
        <h1 data-testid="home-brand-wordmark" className="w-56 min-w-0 sm:w-72">
          <span className="sr-only">{PUBLIC_PRODUCT_IDENTITY.name}</span>
          <Image
            src={PUBLIC_PRODUCT_IDENTITY.assets.appBarWordmark}
            alt=""
            width={512}
            height={147}
            priority
            unoptimized
            data-testid="home-brand-wordmark-image"
            className="block h-auto w-full"
          />
        </h1>
        <Button asChild variant="ghost" className="min-h-11 shrink-0 px-2">
          <Link href={signedIn ? "/account" : "/login"}><UserRound aria-hidden="true" />{signedIn ? "Account" : "Sign in"}</Link>
        </Button>
      </header>
      <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        {returning ? "Welcome back." : "Everyday tools for wellbeing, learning and massage practice."}
      </p>
      {setupReminder}
      <section aria-labelledby="home-tools-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 ref={toolsHeading} tabIndex={-1} id="home-tools-heading" className="text-xl font-semibold sm:text-2xl">{returning ? "Your tools" : "Start here"}</h2>
          <Button variant="ghost" disabled={!hydrated} className="min-h-11 px-2" onClick={(event) => openPanel("all",event.currentTarget)}>All tools <ChevronRight aria-hidden="true" /></Button>
        </div>
        <div data-testid="home-launcher" className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {shortcuts.map((tool) => {
            const Icon = icons[tool.icon as keyof typeof icons] ?? BriefcaseBusiness
            const content = <><Icon aria-hidden="true" /><span className="max-w-full break-words leading-snug">{tool.title}</span></>
            const className = "h-auto min-h-[112px] min-w-0 flex-col gap-3 whitespace-normal px-3 py-5 text-center text-base font-semibold [&_svg]:size-7 sm:min-h-[148px] sm:py-7"
            return tool.href ? (
              <Button key={tool.key} asChild variant={tool.variant} tone={tool.tone} className={className}>
                <Link href={tool.href} onClick={dismissIntroduction}>{content}</Link>
              </Button>
            ) : (
              <Button key={tool.key} disabled={!hydrated} variant={tool.variant} tone={tool.tone} className={className} aria-haspopup="dialog" onClick={(event) => {dismissIntroduction();openPanel(tool.group ?? "all",event.currentTarget)}}>{content}</Button>
            )
          })}
        </div>
      </section>
      <footer className="flex flex-col items-center gap-2 text-sm">
        <div className="flex flex-wrap items-center justify-center gap-x-3">
          <Button variant="link" disabled={!hydrated} className="min-h-11 px-1 text-foreground" onClick={(event) => openPanel("about",event.currentTarget)}>About AtmoShaper</Button>
          <span aria-hidden="true" className="text-muted-foreground">·</span>
          <Button asChild variant="link" className="min-h-11 px-1 text-foreground"><Link href={signedIn ? "/account?tab=app-settings" : "/register"}>{signedIn ? "Account settings" : "Create an account"}</Link></Button>
        </div>
        {!returning && <><p className="text-center text-xs text-muted-foreground">Use public tools without an account.</p><Button variant="link" disabled={!hydrated} className="min-h-11 text-muted-foreground" onClick={() => {dismissIntroduction();toolsHeading.current?.focus()}}>Use dashboard</Button></>}
      </footer>
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-2xl overflow-y-auto rounded-t-2xl pb-8 pt-6 motion-reduce:animate-none [&>button]:right-2 [&>button]:top-2 [&>button]:grid [&>button]:size-11 [&>button]:place-items-center" onCloseAutoFocus={(event) => {event.preventDefault();panelTrigger.current?.focus()}}>
          <SheetHeader className="pr-8 text-left">
            <SheetTitle className="text-2xl">{panelTitle}</SheetTitle>
            <SheetDescription>{panel === "about" ? "A space for wellbeing, learning and massage practice." : "Choose a tool to get started."}</SheetDescription>
          </SheetHeader>
          {panel === "about" ? (
            <div className="mt-5 space-y-4 text-sm leading-relaxed">
              <p>Set the atmosphere with music and timers, check in with yourself, study anatomy, or plan your practice. Start with what is useful to you today.</p>
              <p className="text-muted-foreground">Public tools are open to explore. An account remembers settings and supports features such as scheduling and saved study progress. Some features require membership.</p>
              <p className="text-muted-foreground">Wellness recordings and clinical notes stay on your device. These tools support reflection and planning; they do not replace medical, legal or financial advice.</p>
              <nav aria-label="About AtmoShaper" className="flex flex-wrap gap-2">
                {[{href:"/pricing",title:"Memberships"},{href:"/roadmap",title:"Roadmap"},{href:"/legal/privacy",title:"Privacy"}].map((item) => <SheetClose asChild key={item.href}><Button asChild variant="glow"><Link href={item.href}>{item.title}</Link></Button></SheetClose>)}
              </nav>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {selectedGroups.map((group) => <section key={group.id} aria-labelledby={`home-group-${group.id}`}>
                <h3 id={`home-group-${group.id}`} className="mb-2 font-semibold">{group.label}</h3>
                <div className="space-y-1">{group.routes.map((route) => {
                  const Icon = icons[route.icon as keyof typeof icons] ?? BriefcaseBusiness
                  return <SheetClose asChild key={route.id}><Button asChild variant="ghost" className="h-auto min-h-11 w-full justify-start whitespace-normal px-2 py-3 text-left"><Link href={route.href} onClick={dismissIntroduction}><Icon aria-hidden="true" /><span className="min-w-0 flex-1">{route.label}</span><ChevronRight aria-hidden="true" /></Link></Button></SheetClose>
                })}</div>
              </section>)}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppPageShell>
  )
}
