// @ts-check

export const BUSINESS_INCOME_APP_SETTINGS_KEY = "businessIncomePlannerIncome"
export const BUSINESS_INCOME_LOCAL_STORAGE_KEY = "massagelab-business-income-planner-income-v1"
export const BUSINESS_INCOME_MAX_ITEMS = 100

export const BUSINESS_INCOME_RESERVE_IDEAS = Object.freeze([
  "Retirement savings", "Health insurance", "Medical out-of-pocket costs", "Dental and vision care",
  "Life insurance", "Disability or income protection", "Emergency savings",
])

export const BUSINESS_INCOME_SESSION_MINUTES = Object.freeze([30, 60, 90, 120])
export const BUSINESS_INCOME_WORKLOAD_CAPACITIES = Object.freeze([0.5, 0.7, 0.9, 1])

export const BUSINESS_INCOME_WEEKDAY_KEYS = Object.freeze([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
])

const DEFAULT_WEEKDAY_CLIENT_HOURS = Object.freeze({
  monday: 0,
  tuesday: 0,
  wednesday: 0,
  thursday: 0,
  friday: 0,
  saturday: 0,
  sunday: 0,
})

const FORBIDDEN_PERSISTENCE_KEYS = new Set([
  "client",
  "clientdob",
  "clientemail",
  "clientid",
  "clientname",
  "clientphone",
  "clientpronouns",
  "intakeanswers",
  "journalentries",
  "painjournal",
  "rommeasurements",
  "sessionnotes",
  "soapdraft",
  "treatmentdetails",
  "wellnessentries",
])

/**
 * @typedef {"starting_part_time" | "growing_solo_practice" | "full_schedule" | "custom"} BusinessIncomePresetKey
 */

/**
 * Named assumption sets for common student and therapist planning scenarios.
 * The values are safe business assumptions only; no client or clinical data is
 * stored in these presets or in persisted planner payloads.
 */
export const BUSINESS_INCOME_PRESETS = Object.freeze({
  starting_part_time: Object.freeze({
    key: "starting_part_time",
    label: "Starting part-time",
    description: "A smaller schedule for students, new therapists, or a side practice.",
    values: Object.freeze({
      desiredTakeHomeIncome: 30_000,
      monthlyFixedExpenses: 500,
      perSessionVariableCost: 5,
      taxSetAsideRate: 0.2,
      vacationDays: 10,
      holidayDays: 6,
      personalDays: 5,
      weeklyAdminHours: 3,
      averageSessionMinutes: 60,
      employeeHourlyWage: 0,
      weekdayClientHours: Object.freeze({
        monday: 0,
        tuesday: 4,
        wednesday: 0,
        thursday: 4,
        friday: 0,
        saturday: 4,
        sunday: 0,
      }),
    }),
  }),
  growing_solo_practice: Object.freeze({
    key: "growing_solo_practice",
    label: "Growing solo practice",
    description: "A balanced independent-practice target with room for admin time.",
    values: Object.freeze({
      desiredTakeHomeIncome: 60_000,
      monthlyFixedExpenses: 1_000,
      perSessionVariableCost: 6,
      taxSetAsideRate: 0.25,
      vacationDays: 10,
      holidayDays: 6,
      personalDays: 5,
      weeklyAdminHours: 4,
      averageSessionMinutes: 60,
      employeeHourlyWage: 0,
      weekdayClientHours: Object.freeze({
        monday: 4,
        tuesday: 4,
        wednesday: 4,
        thursday: 4,
        friday: 4,
        saturday: 0,
        sunday: 0,
      }),
    }),
  }),
  full_schedule: Object.freeze({
    key: "full_schedule",
    label: "Full schedule",
    description: "A higher-capacity solo schedule for testing realistic limits.",
    values: Object.freeze({
      desiredTakeHomeIncome: 85_000,
      monthlyFixedExpenses: 1_500,
      perSessionVariableCost: 8,
      taxSetAsideRate: 0.28,
      vacationDays: 15,
      holidayDays: 8,
      personalDays: 5,
      weeklyAdminHours: 6,
      averageSessionMinutes: 60,
      employeeHourlyWage: 0,
      weekdayClientHours: Object.freeze({
        monday: 6,
        tuesday: 6,
        wednesday: 6,
        thursday: 6,
        friday: 6,
        saturday: 4,
        sunday: 0,
      }),
    }),
  }),
  custom: Object.freeze({
    key: "custom",
    label: "Custom",
    description: "Use your own income, cost, time-off, and schedule assumptions.",
    values: Object.freeze({
      desiredTakeHomeIncome: 0,
      monthlyFixedExpenses: 0,
      perSessionVariableCost: 0,
      taxSetAsideRate: 0.25,
      vacationDays: 0,
      holidayDays: 0,
      personalDays: 0,
      weeklyAdminHours: 0,
      averageSessionMinutes: 60,
      employeeHourlyWage: 0,
      weekdayClientHours: DEFAULT_WEEKDAY_CLIENT_HOURS,
    }),
  }),
})

/**
 * @typedef {Object} BusinessIncomePlannerInput
 * @property {string} presetKey
 * @property {number} desiredTakeHomeIncome
 * @property {number} monthlyFixedExpenses
 * @property {number} perSessionVariableCost
 * @property {number} yearlyFixedExpenses
 * @property {BusinessIncomeExpenseItem[]} monthlyExpenseItems
 * @property {BusinessIncomeExpenseItem[]} yearlyExpenseItems
 * @property {BusinessIncomeExpenseItem[]} sessionExpenseItems
 * @property {BusinessIncomeExpenseItem[]} personalReserveItems
 * @property {number} taxSetAsideRate
 * @property {number} vacationDays
 * @property {number} holidayDays
 * @property {number} personalDays
 * @property {number} weeklyAdminHours
 * @property {number} averageSessionMinutes
 * @property {number} employeeHourlyWage
 * @property {number} sessionSupportMinutes
 * @property {Record<string, number>} weekdayClientHours
 */

/** @typedef {{ id: string, name: string, amount: number, frequency: "month" | "year" | "session" }} BusinessIncomeExpenseItem */

/**
 * Normalizes user-entered business assumptions into the safe persisted shape.
 * Values are intentionally limited to business planning fields so account sync
 * cannot collect clinical, client, or wellness records by accident.
 *
 * @param {unknown} value
 * @returns {BusinessIncomePlannerInput}
 */
export function normalizeBusinessIncomePlannerInput(value) {
  const cleanedValue = isRecord(value) ? stripForbiddenKeys(value) : {}
  const source = isRecord(cleanedValue) ? cleanedValue : {}
  const requestedPresetKey = stringValue(source.presetKey)
  const presetKey = isBusinessIncomePresetKey(requestedPresetKey) ? requestedPresetKey : "custom"
  const preset = BUSINESS_INCOME_PRESETS[presetKey] ?? BUSINESS_INCOME_PRESETS.custom
  const base = preset.values
  const sourceWeekdayHours = isRecord(source.weekdayClientHours) ? source.weekdayClientHours : {}
  // An explicit empty list means zero. Only absent legacy lists inherit their
  // old scalar total; repeated hydration must never resurrect a removed cost.
  const monthlyExpenseItems = normalizeExpenseItems(source.monthlyExpenseItems, "month", ["month"],
    nonNegativeNumber(source.monthlyFixedExpenses, base.monthlyFixedExpenses), "Monthly expense estimate")
  const yearlyExpenseItems = normalizeExpenseItems(source.yearlyExpenseItems, "year", ["year"],
    nonNegativeNumber(source.yearlyFixedExpenses), "Yearly expense estimate")
  const sessionExpenseItems = normalizeExpenseItems(source.sessionExpenseItems, "session", ["session", "month", "year"],
    nonNegativeNumber(source.perSessionVariableCost, base.perSessionVariableCost), "Session cost estimate")
  const personalReserveItems = normalizeExpenseItems(source.personalReserveItems, "month", ["month", "year"])

  return {
    presetKey,
    desiredTakeHomeIncome: nonNegativeNumber(source.desiredTakeHomeIncome, base.desiredTakeHomeIncome),
    monthlyExpenseItems,
    yearlyExpenseItems,
    sessionExpenseItems,
    personalReserveItems,
    // Retain the existing scalar contracts as derived totals, never extra costs.
    monthlyFixedExpenses: sumExpenseItems(monthlyExpenseItems),
    yearlyFixedExpenses: sumExpenseItems(yearlyExpenseItems),
    perSessionVariableCost: sumExpenseItems(sessionExpenseItems.filter((item) => item.frequency === "session")),
    taxSetAsideRate: clampRate(source.taxSetAsideRate, base.taxSetAsideRate),
    vacationDays: nonNegativeNumber(source.vacationDays, base.vacationDays),
    holidayDays: nonNegativeNumber(source.holidayDays, base.holidayDays),
    personalDays: nonNegativeNumber(source.personalDays, base.personalDays),
    weeklyAdminHours: nonNegativeNumber(source.weeklyAdminHours, base.weeklyAdminHours),
    averageSessionMinutes: nonNegativeNumber(source.averageSessionMinutes, base.averageSessionMinutes),
    employeeHourlyWage: nonNegativeNumber(source.employeeHourlyWage, base.employeeHourlyWage),
    sessionSupportMinutes: nonNegativeNumber(source.sessionSupportMinutes),
    weekdayClientHours: normalizeWeekdayHours(sourceWeekdayHours, base.weekdayClientHours),
  }
}

/**
 * Sanitizes the account-preferences payload for the planner. This returns the
 * same one-current-worksheet shape used by the UI and strips all unknown keys.
 *
 * @param {unknown} value
 * @returns {BusinessIncomePlannerInput}
 */
export function sanitizeBusinessIncomePlannerPreference(value) {
  return normalizeBusinessIncomePlannerInput(stripForbiddenKeys(value))
}

/**
 * Calculates annual time, revenue targets, session prices, workload scenarios,
 * and optional wage comparison from massage business planning assumptions.
 *
 * @param {unknown} value
 */
export function calculateBusinessIncomePlan(value) {
  const input = normalizeBusinessIncomePlannerInput(value)
  const weeklyClientHours = roundCurrency(sumValues(input.weekdayClientHours))
  const totalDaysOff = roundCurrency(input.vacationDays + input.holidayDays + input.personalDays)
  const availableDays = Math.max(0, 365 - totalDaysOff)
  const availableWeeks = Math.round(availableDays / 7)
  const averageSessionHours = input.averageSessionMinutes > 0 ? input.averageSessionMinutes / 60 : 0
  const annualClientHours = roundCurrency(weeklyClientHours * availableWeeks)
  const sessionsPerWeek = averageSessionHours > 0 ? roundCurrency(weeklyClientHours / averageSessionHours) : 0
  const annualSessions = averageSessionHours > 0 ? roundCurrency(annualClientHours / averageSessionHours) : 0
  const weeklySessionSupportHours = roundCurrency(sessionsPerWeek * input.sessionSupportMinutes / 60)
  const weeklyTotalWorkHours = roundCurrency(weeklyClientHours + weeklySessionSupportHours + input.weeklyAdminHours)
  const annualBudgetedSessionCosts = annualizeExpenseItems(input.sessionExpenseItems)
  const annualFixedExpenses = roundCurrency(input.monthlyFixedExpenses * 12 + input.yearlyFixedExpenses + annualBudgetedSessionCosts)
  const annualPersonalReserves = annualizeExpenseItems(input.personalReserveItems)
  const annualPersonalTarget = roundCurrency(input.desiredTakeHomeIncome + annualPersonalReserves)
  const annualVariableSessionCosts = roundCurrency(input.perSessionVariableCost * annualSessions)
  const targetBeforeTax = input.taxSetAsideRate < 1
    ? roundCurrency(annualPersonalTarget / (1 - input.taxSetAsideRate))
    : 0
  const baseRevenueNeeded = roundCurrency(targetBeforeTax + annualFixedExpenses)
  const requiredGrossRevenue = roundCurrency(baseRevenueNeeded + annualVariableSessionCosts)
  const baseHourlyRevenueTarget = annualClientHours > 0 ? roundCurrency(baseRevenueNeeded / annualClientHours) : null
  const hourlyRevenueTarget = annualClientHours > 0 ? roundCurrency(requiredGrossRevenue / annualClientHours) : null
  const sessionPrices = buildSessionPrices(baseHourlyRevenueTarget, input.perSessionVariableCost)
  const warnings = buildWarnings({ annualClientHours, averageSessionHours })

  return {
    input,
    warnings,
    totalDaysOff,
    availableDays,
    availableWeeks,
    weeklyClientHours,
    weeklyAdminHours: input.weeklyAdminHours,
    weeklySessionSupportHours,
    weeklyTotalWorkHours,
    averageSessionHours,
    annualClientHours,
    sessionsPerWeek,
    annualSessions,
    annualFixedExpenses,
    annualBudgetedSessionCosts,
    annualPersonalReserves,
    annualPersonalTarget,
    annualBusinessCosts: roundCurrency(annualFixedExpenses + annualVariableSessionCosts),
    annualVariableSessionCosts,
    targetBeforeTax,
    baseRevenueNeeded,
    requiredGrossRevenue,
    baseHourlyRevenueTarget,
    hourlyRevenueTarget,
    sessionPrices,
    workloadScenarios: buildWorkloadScenarios(input, {
      availableWeeks,
      weeklyClientHours,
      averageSessionHours,
      targetBeforeTax,
      annualFixedExpenses,
    }),
    employeeComparison: buildEmployeeComparison(input, { availableWeeks, weeklyClientHours }),
  }
}

/** Annualizes budgeted costs only. Per-session costs are multiplied by actual
 * appointments elsewhere, including each capacity scenario, so they count once.
 * @param {BusinessIncomeExpenseItem[]} items
 */
function annualizeExpenseItems(items) {
  return roundCurrency(items.reduce((total, item) => total + (item.frequency === "month" ? item.amount * 12 : item.frequency === "year" ? item.amount : 0), 0))
}

/** @param {BusinessIncomeExpenseItem[]} items */
function sumExpenseItems(items) {
  // Keep fractional per-appointment assumptions from legacy drafts. Annual
  // money/results are rounded downstream, rather than rounding each unit cost.
  return items.reduce((total, item) => total + item.amount, 0)
}

/** Whitelists bounded business labels and stable row IDs; legacy totals become
 * one editable row. Unknown/clinical-shaped properties never enter a row.
 * @param {unknown} value
 * @param {BusinessIncomeExpenseItem["frequency"]} frequency
 * @param {BusinessIncomeExpenseItem["frequency"][]} allowed
 * @param {number} [legacyAmount]
 * @param {string} [legacyName]
 * @returns {BusinessIncomeExpenseItem[]}
 */
function normalizeExpenseItems(value, frequency, allowed, legacyAmount = 0, legacyName = "Expense estimate") {
  if (!Array.isArray(value)) return legacyAmount > 0 ? [{ id: `legacy-${frequency}`, name: legacyName, amount: legacyAmount, frequency }] : []
  const usedIds = new Set()
  return value.filter(isRecord).slice(0, BUSINESS_INCOME_MAX_ITEMS).map((item, index) => {
    const requestedId = stringValue(item.id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80)
    let id = requestedId || `item-${index}`
    let suffix = 0
    while (usedIds.has(id)) id = `${(requestedId || "item").slice(0, 65)}-${index}-${suffix++}`
    usedIds.add(id)
    const requestedFrequency = /** @type {BusinessIncomeExpenseItem["frequency"]} */ (item.frequency)
    return { id, name: stringValue(item.name).slice(0, 120), amount: nonNegativeNumber(item.amount),
      frequency: allowed.includes(requestedFrequency) ? requestedFrequency : frequency }
  })
}

/**
 * @param {number | null} hourlyRevenueTarget
 * @param {number} perSessionVariableCost
 * @returns {Record<string, number | null>}
 */
function buildSessionPrices(hourlyRevenueTarget, perSessionVariableCost) {
  return Object.fromEntries(BUSINESS_INCOME_SESSION_MINUTES.map((minutes) => [
    minutes,
    hourlyRevenueTarget === null
      ? null
      : roundCurrency(hourlyRevenueTarget * (minutes / 60) + perSessionVariableCost),
  ]))
}

/**
 * @param {BusinessIncomePlannerInput} input
 * @param {{
 *   availableWeeks: number,
 *   weeklyClientHours: number,
 *   averageSessionHours: number,
 *   targetBeforeTax: number,
 *   annualFixedExpenses: number,
 * }} context
 */
function buildWorkloadScenarios(input, context) {
  const baseRevenueNeeded = roundCurrency(context.targetBeforeTax + context.annualFixedExpenses)

  return BUSINESS_INCOME_WORKLOAD_CAPACITIES.map((capacity) => {
    const weeklyClientHours = roundCurrency(context.weeklyClientHours * capacity)
    const annualClientHours = roundCurrency(weeklyClientHours * context.availableWeeks)
    const sessionsPerWeek = context.averageSessionHours > 0
      ? roundCurrency(weeklyClientHours / context.averageSessionHours)
      : 0
    const annualSessions = context.averageSessionHours > 0
      ? roundCurrency(annualClientHours / context.averageSessionHours)
      : 0
    const annualVariableSessionCosts = roundCurrency(input.perSessionVariableCost * annualSessions)
    const requiredGrossRevenue = roundCurrency(baseRevenueNeeded + annualVariableSessionCosts)
    const baseHourlyRevenueTarget = annualClientHours > 0 ? roundCurrency(baseRevenueNeeded / annualClientHours) : null
    const hourlyRevenueTarget = annualClientHours > 0 ? roundCurrency(requiredGrossRevenue / annualClientHours) : null

    return {
      capacityPercent: Math.round(capacity * 100),
      weeklyClientHours,
      annualClientHours,
      sessionsPerWeek,
      annualSessions,
      annualVariableSessionCosts,
      requiredGrossRevenue,
      baseHourlyRevenueTarget,
      hourlyRevenueTarget,
      sessionPrice60: baseHourlyRevenueTarget === null
        ? null
        : roundCurrency(baseHourlyRevenueTarget + input.perSessionVariableCost),
    }
  })
}

/**
 * @param {BusinessIncomePlannerInput} input
 * @param {{ availableWeeks: number, weeklyClientHours: number }} context
 */
function buildEmployeeComparison(input, context) {
  if (input.employeeHourlyWage <= 0 || context.weeklyClientHours <= 0 || context.availableWeeks <= 0) {
    return null
  }

  const annualGross = roundCurrency(input.employeeHourlyWage * context.weeklyClientHours * context.availableWeeks)

  return {
    annualGross,
    estimatedTakeHome: roundCurrency(annualGross * (1 - input.taxSetAsideRate)),
  }
}

/**
 * @param {{ annualClientHours: number, averageSessionHours: number }} value
 */
function buildWarnings({ annualClientHours, averageSessionHours }) {
  const warnings = []

  if (annualClientHours <= 0) {
    warnings.push("Add weekly client hours to calculate income and pricing targets.")
  }

  if (averageSessionHours <= 0) {
    warnings.push("Add an average session length to calculate sessions per week.")
  }

  return warnings
}

/**
 * @param {Record<string, unknown>} value
 * @param {Record<string, number>} [base]
 */
function normalizeWeekdayHours(value, base = DEFAULT_WEEKDAY_CLIENT_HOURS) {
  const baseHours = /** @type {Record<string, number>} */ (base)

  return Object.fromEntries(BUSINESS_INCOME_WEEKDAY_KEYS.map((key) => [
    key,
    nonNegativeNumber(value[key], baseHours[key] ?? 0),
  ]))
}

/**
 * @param {unknown} value
 * @param {number} [fallback]
 */
function nonNegativeNumber(value, fallback = 0) {
  const number = parsePlannerNumber(value)
  if (number === null) return Math.max(0, fallback)

  return Math.max(0, number)
}

/**
 * @param {unknown} value
 * @param {number} [fallback]
 */
function clampRate(value, fallback = 0) {
  const parsed = parsePlannerNumber(value)
  const number = parsed === null ? fallback : parsed
  const decimal = number > 1 ? number / 100 : number

  return Math.min(0.8, Math.max(0, decimal))
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function parsePlannerNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string") return null

  const cleaned = value.replace(/[$,%\s,]/g, "")
  if (!cleaned) return null

  const number = Number(cleaned)
  return Number.isFinite(number) ? number : null
}

/**
 * @param {Record<string, number>} value
 */
function sumValues(value) {
  return Object.values(value).reduce((total, item) => total + item, 0)
}

/**
 * @param {number} value
 */
function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * @param {unknown} value
 */
function stringValue(value) {
  return typeof value === "string" ? value : ""
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function stripForbiddenKeys(value) {
  if (Array.isArray(value)) return value.map(stripForbiddenKeys)
  if (!isRecord(value)) return value

  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !FORBIDDEN_PERSISTENCE_KEYS.has(key.toLowerCase()))
    .map(([key, item]) => [key, stripForbiddenKeys(item)]))
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * @param {string} value
 * @returns {value is BusinessIncomePresetKey}
 */
function isBusinessIncomePresetKey(value) {
  return Object.hasOwn(BUSINESS_INCOME_PRESETS, value)
}
