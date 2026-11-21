import { createCalendarWorkspaceBrowserBundle, startCalendarWorkspaceBrowserFixture } from "../tests/fixtures/calendar-workspace-browser-harness.mjs"

// This separate loopback preview is synthetic and has no live service actions.
const fixture=await startCalendarWorkspaceBrowserFixture(await createCalendarWorkspaceBrowserBundle(),3024)
console.log(`Fictional Calendar preview: ${fixture.origin}`)
