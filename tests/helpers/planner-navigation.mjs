/** Uses the visible phone selector or desktop step buttons, without changing app state directly.
 * @param {import("playwright").Page} page
 * @param {number} index
 */
export async function selectPlannerStep(page, index) {
  const selector = page.getByRole("combobox", { name: "Go to planning step", exact: true })
  if (await selector.isVisible()) await selector.selectOption(String(index))
  else await page.locator("[data-planner-stepper] nav ol button").nth(index).click()
  await page.locator("[data-planner-step]").nth(index).waitFor({ state: "visible" })
}

/** Reveals a retained control before editing it in a storage or account-sync regression.
 * @param {import("playwright").Page} page
 * @param {import("playwright").Locator} control
 */
export async function revealPlannerControl(page, control) {
  if (await control.isVisible()) return
  const index = await control.evaluate((element) => {
    const panel = element.closest("[data-planner-step]")
    return panel ? [...panel.parentElement.querySelectorAll(":scope > [data-planner-step]")].indexOf(panel) : -1
  })
  if (index < 0) throw new Error("Retained planner control has no step")
  await selectPlannerStep(page, index)
}
