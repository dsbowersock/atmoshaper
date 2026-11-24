# Native Home and in-place update

[Issue #83](https://github.com/dsbowersock/atmoshaper/issues/83) begins Stage 1
of the [native Android specification](https://github.com/dsbowersock/atmoshaper/issues/82).
Use the published shared-preview source as the implementation base.

1. Assert that Android's launcher opens a native Home. Exercise its six
   categories, one unavailable destination and both system Back and the visible
   return control through installed-app instrumentation.
2. Add a Kotlin/Compose launcher to the existing Android app module. Use the
   website's Home hierarchy, launcher labels, wordmark, Inter and color
   treatments. Respect safe drawing insets and allow the grid to reflow for
   narrow windows and large text. Keep the current Java Activity for the
   existing tool links, offline background returns and an explicit previous
   tools entry. Keep native destinations in Compose as they become available.
3. Keep the application IDs and debug signing contract. Advance the APK version
   and retain the existing app-content origin, data directories, WebView
   settings, browser-owned session and authorization boundaries. Home needs no
   access to those stores. Defer data conversion until a native destination
   requires it and a separate verified transfer is specified.
4. Extend the guarded earlier-APK test to open Home offline after install-replace,
   then exercise the previous tools and verify settings, a planner draft, the
   timer deadline and downloaded packs. Include an isolated native build/lint
   and installed-app test job in CI. Keep physical phone acceptance separate.
5. Review the exact application candidate using Codex and CodeRabbit. Record
   what ran and any outstanding review or acceptance gates before release work.
