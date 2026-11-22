// @ts-check
import { homeToolCatalog, resolveExplicitOnboardingHomeToolKeys } from "./onboarding-preferences.js"

/** @typedef {{key:string,title:string,icon:string,variant:"glow"|"ctaBlue"|"cta"|"calendar"|"secondary"|"default",tone?:"setup",href?:string,group?:string}} HomeShortcut */
/** @typedef {{id:string,label:string,routes:Array<{id:string,label:string,href:string,icon:string,visibleInSidebar:boolean}>}} HomeToolGroup */

/** Balanced public defaults are separate from durable onboarding keys. */
export const defaultHomeShortcuts = /** @type {ReadonlyArray<HomeShortcut>} */ (Object.freeze([
  {key:"music",title:"Music",icon:"Music",variant:"glow",href:"/music"},
  {key:"clock",title:"Clock & timer",icon:"Clock",variant:"ctaBlue",href:"/clock"},
  {key:"wellness",title:"Wellness",icon:"HeartPulse",variant:"cta",href:"/wellness"},
  {key:"personal-calendar",title:"My Calendar",icon:"CalendarDays",variant:"calendar",href:"/calendar/personal"},
  {key:"study",title:"Study & play",icon:"BookOpen",variant:"secondary",group:"education"},
  {key:"practice",title:"Practice tools",icon:"BriefcaseBusiness",variant:"default",group:"practice"},
]))

const groupIds = new Set(["atmosphere","wellness","practice","education"])

/**
 * Preserve explicitly saved shortcut order and destinations, while omitting
 * navigation-hidden tools. Role-derived legacy defaults are not explicit picks;
 * accounts without picks receive the same balanced launcher as visitors.
 * Receives canonical permission-filtered navigation; grants no access.
 * @param {{homeShortcuts?:unknown}} onboarding
 * @param {HomeToolGroup[]} navigationGroups
 * @returns {{shortcuts:HomeShortcut[],groups:HomeToolGroup[]}}
 */
export function resolveHomeDashboard(onboarding, navigationGroups) {
  const groups = navigationGroups.filter((group) => groupIds.has(group.id))
    .map((group) => ({...group,routes:group.routes.filter((route) => route.visibleInSidebar)}))
  const allowedHrefs = new Set(groups.flatMap((group) => group.routes.map((route) => route.href)))
  const custom = resolveExplicitOnboardingHomeToolKeys(onboarding).flatMap((key) => {
    const tool = homeToolCatalog.find((entry) => entry.key === key)
    if (!tool || (key === "local_notes" && !allowedHrefs.has("/notes"))) return []
    const variant = key === "atmosphere" ? "glow" : key === "calendar_booking" ? "calendar" : "ctaBlue"
    return [{key:tool.key,title:tool.title,icon:tool.icon,href:tool.href,variant}]
  })
  return {shortcuts:custom.length ? /** @type {HomeShortcut[]} */ (custom) : [...defaultHomeShortcuts],groups}
}
