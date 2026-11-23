// @ts-check

/** Client-safe empty projection. No database loader belongs in the shared UI. */
export const emptySidebarCalendarContext = Object.freeze({
  practice: /** @type {{id:string,name:string}|null} */ (null),
  therapists: /** @type {Array<{id:string,label:string}>} */ (/** @type {unknown} */ (Object.freeze([]))),
  canManageAvailability: false,
  pendingAppointmentRequestCount: 0,
  openWaitlistEntryCount: 0,
})
