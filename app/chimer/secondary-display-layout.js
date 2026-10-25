const GAP_PX = 8
const EDGE_PX = 16
const positive = (value) => Number.isFinite(value) ? Math.max(0, value) : 0
const coordinate = (value) => Number.isFinite(value) ? value : 0

/**
 * Keep the accessory display centered in the visible viewport; move it below
 * actual intersecting chrome rather than guessing a device-width breakpoint.
 * Rectangles use layout-viewport coordinates and ignore animated text effects.
 * @param {{viewport: {left: number, top: number, width: number}, width: number, height: number, topInset: number, controls: Array<{left:number,right:number,top:number,bottom:number}>}} input
 */
export function resolveSecondaryDisplayLayout({ viewport, width, height, topInset, controls }) {
  const availableWidth = Math.max(1, positive(viewport.width) - EDGE_PX * 2)
  const naturalWidth = positive(width)
  const scale = naturalWidth > availableWidth ? Math.max(1, availableWidth - 1) / naturalWidth : 1
  const fittedWidth = naturalWidth * scale
  const fittedHeight = positive(height) * scale
  const center = coordinate(viewport.left) + positive(viewport.width) / 2
  const left = center - fittedWidth / 2
  const baseTop = coordinate(viewport.top) + positive(topInset)
  let top = baseTop
  const obstacles = controls.filter((box) => Object.values(box).every(Number.isFinite))
    .sort((a, b) => a.bottom - b.bottom)
  for (const box of obstacles) {
    if (box.right > left - GAP_PX && box.left < left + fittedWidth + GAP_PX
      && box.bottom > top - GAP_PX && box.top < top + fittedHeight + GAP_PX) {
      top = Math.max(top, box.bottom + GAP_PX)
    }
  }
  return {
    top, center, scale, availableWidth,
    safeTop: top > baseTop + 0.5 ? top + fittedHeight + GAP_PX : 0,
  }
}

const DISPLAY_PROPERTIES = ["--chimer-secondary-top", "--chimer-secondary-center", "--chimer-secondary-max-width", "--chimer-secondary-scale"]
const clearDisplay = (node) => DISPLAY_PROPERTIES.forEach((name) => node?.style.removeProperty(name))
const setProperty = (node, name, value) => {
  if (node.style.getPropertyValue(name) !== value) node.style.setProperty(name, value)
}

/**
 * The immersive shell owns one accessory layout subscription for its stage.
 * A returned disposer releases every observer and inline reservation. This
 * controller reads public DOM geometry only and never changes saved settings.
 * @param {{stage: HTMLElement, toolbar: HTMLElement, insetProbe: HTMLElement}} elements
 * @returns {() => void}
 */
export function observeSecondaryDisplayLayout({ stage, toolbar, insetProbe }) {
  let frame = 0
  let disposed = false
  let secondary = null
  let lastScale = 1
  const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule)

  function measure() {
    frame = 0
    if (disposed) return
    const next = stage.querySelector('[data-immersive-secondary-display="true"]')
    if (next !== secondary) {
      if (secondary) resizeObserver?.unobserve(secondary)
      clearDisplay(secondary)
      secondary = next
      lastScale = 1
      if (secondary) resizeObserver?.observe(secondary)
    }
    if (!secondary) {
      stage.style.removeProperty("--chimer-secondary-safe-top")
      return
    }
    const viewport = window.visualViewport
    const controls = [toolbar, ...stage.querySelectorAll('button[data-chimer-control="true"]')]
      .map((node) => {
        const box = node.getBoundingClientRect()
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom }
      })
    const layout = resolveSecondaryDisplayLayout({
      viewport: { left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0, width: viewport?.width ?? window.innerWidth },
      // Layout sizes exclude swap/glow transforms. Undo only this owner's scale.
      width: Math.max(secondary.offsetWidth, secondary.scrollWidth) / lastScale,
      height: secondary.offsetHeight / lastScale,
      topInset: Number.parseFloat(getComputedStyle(insetProbe).paddingTop) || 0,
      controls,
    })
    setProperty(secondary, "--chimer-secondary-top", `${layout.top}px`)
    setProperty(secondary, "--chimer-secondary-center", `${layout.center}px`)
    setProperty(secondary, "--chimer-secondary-max-width", `${layout.availableWidth}px`)
    // Rounding in scrollWidth must not trigger an endless resize/scale loop.
    if (Math.abs(layout.scale - lastScale) > 0.005) {
      lastScale = layout.scale
      setProperty(secondary, "--chimer-secondary-scale", String(layout.scale))
    }
    setProperty(stage, "--chimer-secondary-safe-top", `${layout.safeTop}px`)
  }
  function schedule() {
    if (!disposed && !frame) frame = window.requestAnimationFrame(measure)
  }
  const mutationObserver = new MutationObserver(schedule)
  mutationObserver.observe(stage, { attributes: true, attributeFilter: ["data-immersive-secondary-display"], childList: true, subtree: true })
  const bodyObserver = new MutationObserver(schedule)
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] })
  resizeObserver?.observe(toolbar)
  resizeObserver?.observe(insetProbe)
  window.addEventListener("resize", schedule)
  window.addEventListener("orientationchange", schedule)
  window.visualViewport?.addEventListener("resize", schedule)
  window.visualViewport?.addEventListener("scroll", schedule)
  document.fonts?.addEventListener("loadingdone", schedule)
  void document.fonts?.ready.then(schedule)
  schedule()
  return () => {
    disposed = true
    window.cancelAnimationFrame(frame)
    resizeObserver?.disconnect()
    mutationObserver.disconnect()
    bodyObserver.disconnect()
    window.removeEventListener("resize", schedule)
    window.removeEventListener("orientationchange", schedule)
    window.visualViewport?.removeEventListener("resize", schedule)
    window.visualViewport?.removeEventListener("scroll", schedule)
    document.fonts?.removeEventListener("loadingdone", schedule)
    clearDisplay(secondary)
    stage.style.removeProperty("--chimer-secondary-safe-top")
  }
}
