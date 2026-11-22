import assert from "node:assert/strict"
import test from "node:test"
import { resolveHomeDashboard } from "../lib/home-dashboard.js"
import { resolveNavigation } from "../lib/navigation.js"
import { FEATURE_KEYS } from "../lib/membership.js"

const groups = (context={}) => resolveNavigation(context).primaryNavigationGroups

test("balanced defaults remain independent of inferred role and preserve canonical destinations", () => {
  for (const onboarding of [{},{primaryRole:"therapist"},{homeShortcuts:["unknown"]}]) {
    const result=resolveHomeDashboard(onboarding,groups())
    assert.deepEqual(result.shortcuts.map((tool)=>tool.title),["Music","Clock & timer","Wellness","My Calendar","Study & play","Practice tools"])
    assert.equal(result.shortcuts[1].href,"/clock")
    assert.equal(result.shortcuts[3].href,"/calendar/personal")
    assert.deepEqual(result.groups.map((group)=>group.id),["atmosphere","wellness","practice","education"])
    assert.equal(result.groups.flatMap((group)=>group.routes).some((route)=>route.href==="/chimer"),false)
  }
})

test("explicit saved order is deduplicated, bounded and retains original destinations", () => {
  const result=resolveHomeDashboard({homeShortcuts:["anatomime","chimer","anatomime","business_income_planner","calendar_booking","atmosphere","account_memberships","roadmap_support"]},groups({authState:"signed-in"}))
  assert.deepEqual(result.shortcuts.map((tool)=>tool.key),["anatomime","chimer","business_income_planner","calendar_booking","atmosphere","account_memberships"])
  assert.equal(result.shortcuts[1].href,"/chimer")
  assert.equal(result.shortcuts[2].href,"/tools/business-planner/income")
  assert.equal(result.shortcuts[3].href,"/calendar")
})

test("client Notes visibility follows canonical feature keys in both launcher and directory", () => {
  for (const [featureKeys,expected] of [[[],false],[[FEATURE_KEYS.therapistDocumentationTools],true]]) {
    const result=resolveHomeDashboard({homeShortcuts:["local_notes","atmosphere"]},groups({authState:"signed-in",accountRoles:["CLIENT"],featureKeys}))
    assert.equal(result.shortcuts.some((tool)=>tool.href==="/notes"),expected)
    assert.equal(result.groups.flatMap((group)=>group.routes).some((route)=>route.href==="/notes"),expected)
  }
})
