import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { createCompiledModuleLoader, createElement, elementText, findElement, renderFunctionComponents } from "./helpers/compiled-module.mjs"

const load = createCompiledModuleLoader(import.meta.url)
const userId = "fictional-actor"
const memberships = ["a", "b"].map(practiceId => ({ practiceId, role: "OWNER", practice: { name: `Practice ${practiceId.toUpperCase()}` } }))
const pass = props => createElement("div", props)

/** Runs actual server pages against two authorized practices. No live reads or writes. */
async function fixture(file, { practice, anonymous = false, deny = false } = {}) {
  const reads = []
  const service = { id: "fictional-service", name: "Example service", variants: [], bodyRegions: [] }
  const prisma = {
    practiceMembership: {
      findFirst: async args => {
        reads.push({ kind: "membership", where: args.where })
        assert.equal(args.where.userId, userId)
        if (deny) return null
        return memberships.find(item => !args.where.practiceId || item.practiceId === args.where.practiceId) ?? null
      },
      findMany: async args => { reads.push({ kind: "providers", where: args.where }); return [] },
    },
    serviceType: {
      findMany: async args => { reads.push({ kind: "services", where: args.where }); return [service] },
      findFirst: async args => { reads.push({ kind: "service", where: args.where }); return service },
    },
  }
  const page = load(await readFile(file, "utf8"), file, {
    "react/jsx-runtime": { jsx: createElement, jsxs: createElement, Fragment: "fragment" },
    "next/link": { __esModule: true, default: props => createElement("a", props) },
    "next/navigation": { notFound: () => { throw new Error("NOT_FOUND") } },
    "lucide-react": { Settings2: pass, UsersRound: pass, CalendarOff: pass },
    "@/app/calendar/actions": { createClassAction: () => { throw new Error("NO_WRITES") }, createPersonalEventAction: () => { throw new Error("NO_WRITES") } },
    "@/lib/rsc-session": { getCurrentRscSession: async () => anonymous ? null : { user: { id: userId } } },
    "@/lib/calendar-readiness": { isCalendarDatabaseReady: async () => true },
    "@/lib/prisma": { prisma },
    "@/components/ui/app-surface": { AppInset: pass, AppSurface: props => createElement("section", { children: [props.title, props.description] }), appSurfaceClassName: "" },
    "@/components/ui/button": { Button: pass },
    "@/components/ui/input": { Input: pass },
    "@/components/ui/label": { Label: pass },
    "@/components/ui/checkbox": { Checkbox: pass },
    "@/components/ui/select": { Select: pass, SelectContent: pass, SelectItem: pass, SelectTrigger: pass, SelectValue: pass },
    "@/components/ui/card": { Card: pass, CardContent: pass, CardDescription: pass, CardHeader: pass, CardTitle: pass },
    "../calendar-operator-shell": { CalendarOperatorShell: pass },
    "../../calendar-operator-shell": { CalendarOperatorShell: pass },
    "../service-form": { ServiceForm: props => createElement("service-form", props) },
  }).default
  const tree = renderFunctionComponents(await page({ searchParams: Promise.resolve({ practice }), params: Promise.resolve({ serviceId: service.id }) }))
  return { tree, text: elementText(tree), reads }
}

for (const file of ["app/calendar/new/class/page.tsx", "app/calendar/new/personal/page.tsx"]) {
  test(`${file} keeps the requested practice on a role-denied return link without catalog reads`, async () => {
    const { reads, tree } = await fixture(file, { practice: "b", deny: true })
    assert.deepEqual(reads.map(read => read.kind), ["membership"])
    assert.equal(findElement(tree, node => node.type === "a").props.href, "/calendar/new?practice=b")
  })
}

for (const file of ["app/calendar/services/page.tsx", "app/calendar/services/new/page.tsx", "app/calendar/services/[serviceId]/page.tsx"]) {
  test(`${file} keeps practice B rather than choosing the older practice A`, async () => {
    const { reads, tree, text } = await fixture(file, { practice: "b" })
    assert.ok(reads.length > 1)
    assert.ok(reads.every(read => read.where.practiceId === "b"))
    assert.match(text, /Practice B/)
    const link = findElement(tree, node => node.type === "a" && node.props.href?.includes("practice=b"))
    assert.ok(link)
    if (file !== "app/calendar/services/page.tsx") {
      assert.equal(findElement(tree, node => node.type === "service-form").props.practiceId, "b")
    }
  })
  test(`${file} rejects an unowned practice without falling back or reading its catalog`, async () => {
    const { reads, tree } = await fixture(file, { practice: "unowned" })
    assert.deepEqual(reads.map(read => read.kind), ["membership"])
    assert.equal(findElement(tree, node => node.type === "service-form"), null)
  })
  test(`${file} retains the oldest eligible fallback only when no practice is requested`, async () => {
    const { reads } = await fixture(file)
    assert.ok(reads.filter(read => read.kind !== "membership").every(read => read.where.practiceId === "a"))
  })
  test(`${file} reads no catalog for anonymous visitors`, async () => {
    assert.deepEqual((await fixture(file, { practice: "b", anonymous: true })).reads, [])
  })
}
