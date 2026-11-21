"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { ROM_AREAS, romBoneName, type RomMovement, type RomPose } from "@/lib/rom-movements"
import { fitBodyViewBounds } from "@/lib/body-view-framing"
import { BODY_PARTS, BODY_SURFACES, SURFACE_VIEW_DIRECTIONS, bodySurfaceFacesCamera, type SurfaceLocation } from "@/lib/body-surface-regions"

export type BodyView = "front" | "back" | "side" | "angled" | "left" | "right" | "front-left" | "front-right" | "back-left" | "back-right" | "top" | "bottom"

export type BodySceneProps = {
  area: string | null; side: string; movement?: RomMovement; playing: boolean; endPose: boolean
  view: BodyView; rotate: boolean; resetKey: number
  onPick: (area: string, side: string) => void
  onReady: (state: "ready" | "failed") => void
  onPlaybackEnd: () => void
  regionMode?: boolean; selectedRegions?: string[]; disabled?: boolean
  focusPart?: string
  onRegionPick?: (region: string) => void
}

/** One local surface model and explicit joint mappings, shared by selection and
 * demonstrations. The rig is illustration only; it never supplies a ROM value. */
export default function BodyJointScene(props: BodySceneProps) {
  const host = useRef<HTMLDivElement>(null)
  const latest = useRef(props)
  const invalidate = useRef<() => void>(() => {})
  useEffect(() => { latest.current = props; invalidate.current() }, [props])

  useEffect(() => {
    if (!host.current) return
    const container = host.current
    let disposed = false
    let frame = 0
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }) }
    catch { latest.current.onReady("failed"); return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.35
    renderer.localClippingEnabled = true
    renderer.domElement.setAttribute("aria-label", latest.current.regionMode ? "Interactive body regions. Tap a lit region or use the named region buttons." : "Interactive human body. Drag to rotate; tap a joint, or use the body area buttons below.")
    renderer.domElement.setAttribute("role", "img")
    container.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(33, 1, 0.01, 30)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableZoom = true
    controls.minDistance = latest.current.regionMode ? 0.18 : 0.45
    controls.maxDistance = 5
    controls.minPolarAngle = latest.current.regionMode ? 0.02 : 0.3
    controls.maxPolarAngle = Math.PI - controls.minPolarAngle
    const ambient = new THREE.HemisphereLight(0xcdefff, 0x102442, 2.3)
    scene.add(ambient)
    // New underside/medial views need readable surface contours as well as dots.
    // Keep the established movement-guide lighting unchanged.
    const cameraFill = latest.current.regionMode ? new THREE.DirectionalLight(0xb7eaff, 1.5) : null
    if (cameraFill) { scene.add(cameraFill); scene.add(cameraFill.target) }
    for (const [position, color, intensity] of [
      [[2, 3, 3], 0x8fdfff, 5], [[-2, 1, -2], 0x219fff, 6], [[0, 3, -2], 0x9fffff, 5],
    ] as const) {
      const light = new THREE.DirectionalLight(color, intensity)
      light.position.set(position[0], position[1], position[2]); scene.add(light)
    }
    const bones = new Map<string, THREE.Bone>()
    const neutral = new Map<string, THREE.Quaternion>()
    const skinnedMeshes: THREE.SkinnedMesh[] = []
    const framingVertices = new Map<string, { mesh: THREE.SkinnedMesh; indices: number[] }[]>()
    const targets: { area: string; side: string; bone: THREE.Bone; region?: SurfaceLocation; surfacePoints: THREE.Vector3[]; marker: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> }[] = []
    const partBounds = new Map<string, THREE.Box3>()
    const raycaster = new THREE.Raycaster()
    let previousFocus: string | undefined
    let focusBounds: THREE.Box3 | undefined
    let model: THREE.Group | null = null
    let previousView = ""
    let previousReset = -1
    let previousPlaying = false
    let playbackStart = 0
    let playedMilliseconds = 0
    let heldProgress = 0
    let previousEndPose = false
    let completed = false
    const position = new THREE.Vector3()
    const parentRotation = new THREE.Quaternion()
    const worldRotation = new THREE.Quaternion()
    const axis = new THREE.Vector3()
    const surfaceDirection = new THREE.Vector3()

    /** Apply a world-space direction around the selected joint, rather than
     * assuming the asset's local bone axes match anatomical planes. */
    function turn(bone: THREE.Bone | undefined, plane: "x" | "y" | "z", radians: number) {
      if (!bone?.parent) return
      axis.set(plane === "x" ? 1 : 0, plane === "y" ? 1 : 0, plane === "z" ? 1 : 0)
      bone.parent.getWorldQuaternion(parentRotation)
      worldRotation.setFromAxisAngle(axis, radians)
      const delta = parentRotation.clone().invert().multiply(worldRotation).multiply(parentRotation)
      bone.quaternion.premultiply(delta)
      bone.updateMatrixWorld(true)
    }

    /** Poses name actual paired bones; amplitude is an illustration parameter.
     * Starting poses are applied before camera framing and the animated delta. */
    function applyPoses(poses: RomPose[] | undefined, side: string, progress = 1) {
      for (const pose of poses ?? []) turn(bones.get(`${pose.bone}${side === "Right" ? "_r" : "_l"}`), pose.plane, pose.radians * progress * (pose.mirror && side === "Right" ? -1 : 1))
    }

    /** Reapply a catalog pose from the saved neutral rig; sampling camera bounds
     * cannot accumulate rotations or change the playback's held progress. */
    function poseModel(movement: RomMovement | undefined, side: string, progress: number) {
      for (const [name, quaternion] of neutral) bones.get(name)?.quaternion.copy(quaternion)
      model?.updateMatrixWorld(true)
      if (!movement) return
      const suffix = side === "Right" ? "_r" : "_l"
      if (movement.setup === "elbow-bent") turn(bones.get(`lowerarm${suffix}`), "x", -Math.PI / 2)
      if (movement.setup === "knee-bent") turn(bones.get(`calf${suffix}`), "x", Math.PI / 2)
      if (movement.setup === "bent-start") turn(bones.get(romBoneName(movement.area, side) ?? ""), "x", -movement.radians)
      applyPoses(movement.startingPose, side)
      if (movement.demo !== false) {
        if (movement.poses) applyPoses(movement.poses, side, progress)
        else turn(bones.get(romBoneName(movement.area, side) ?? ""), movement.plane, movement.radians * progress * (movement.mirror && side === "Right" ? -1 : 1))
      }
      model?.updateMatrixWorld(true)
    }

    /** Frame the selected limb's actual skinned surface across five authored
     * poses. Cache vertex membership per side; resample only for explicit view
     * resets/resizes, never every animation frame. Whole hands/feet supply the
     * context for digit guides. Neck/trunk retain their established overview. */
    function frameLimb(movement: RomMovement, side: string, direction: THREE.Vector3) {
      if (["neck", "back"].includes(movement.area)) return false
      const suffix = side === "Right" ? "_r" : "_l"
      const rootName = movement.area === "hand" ? `hand${suffix}` : movement.area === "toes" ? `foot${suffix}` : romBoneName(movement.area, side) ?? ""
      const root = bones.get(rootName)
      if (!root) return false
      let selected = framingVertices.get(rootName)
      if (!selected) {
        const region = new Set<THREE.Bone>()
        root.traverse((node) => { if (node instanceof THREE.Bone) region.add(node) })
        selected = skinnedMeshes.map((mesh) => {
          const indices: number[] = [], skinIndex = mesh.geometry.getAttribute("skinIndex"), skinWeight = mesh.geometry.getAttribute("skinWeight")
          for (let index = 0; index < skinIndex.count; index++) {
            let influence = 0
            for (let component = 0; component < 4; component++) if (region.has(mesh.skeleton.bones[skinIndex.getComponent(index, component)])) influence += skinWeight.getComponent(index, component)
            if (influence >= 0.2) indices.push(index)
          }
          return { mesh, indices }
        })
        framingVertices.set(rootName, selected)
      }
      if (!selected.some((item) => item.indices.length)) return false
      const right = new THREE.Vector3(0, 1, 0).cross(direction).normalize()
      const up = direction.clone().cross(right).normalize()
      const bounds = new THREE.Box3(), vertex = new THREE.Vector3(), projected = new THREE.Vector3()
      const include = (point: THREE.Vector3) => bounds.expandByPoint(projected.set(point.dot(right), point.dot(up), point.dot(direction)))
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        poseModel(movement, side, progress)
        root.getWorldPosition(vertex); include(vertex)
        for (const { mesh, indices } of selected) for (const index of indices) {
          mesh.getVertexPosition(index, vertex).applyMatrix4(mesh.matrixWorld); include(vertex)
        }
      }
      const fit = fitBodyViewBounds({ min: bounds.min.toArray(), max: bounds.max.toArray() }, camera.fov, camera.aspect)
      if (!fit) return false
      const target = right.multiplyScalar(fit.center[0]).addScaledVector(up, fit.center[1]).addScaledVector(direction, fit.center[2])
      camera.position.copy(target).addScaledVector(direction, Math.max(0.45, fit.distance))
      controls.target.copy(target); controls.update()
      return true
    }

    function render(now: number) {
      frame = 0
      if (disposed) return
      const config = latest.current
      controls.enableRotate = config.rotate
      controls.enableZoom = config.rotate
      renderer.domElement.style.touchAction = config.rotate ? "none" : "pan-y"
      // Front/back/side are explicit reset actions. Selection does not erase a
      // person's chosen camera orbit on every sensor or parent render.
      const resetting = previousView !== config.view || previousReset !== config.resetKey || previousFocus !== config.focusPart
      if (resetting) {
        previousFocus = config.focusPart
        focusBounds = config.regionMode && config.focusPart ? partBounds.get(config.focusPart) : undefined
        const planes = focusBounds ? [new THREE.Plane(new THREE.Vector3(1,0,0), -focusBounds.min.x), new THREE.Plane(new THREE.Vector3(-1,0,0), focusBounds.max.x), new THREE.Plane(new THREE.Vector3(0,1,0), -focusBounds.min.y), new THREE.Plane(new THREE.Vector3(0,-1,0), focusBounds.max.y), new THREE.Plane(new THREE.Vector3(0,0,1), -focusBounds.min.z), new THREE.Plane(new THREE.Vector3(0,0,-1), focusBounds.max.z)] : []
        for (const mesh of skinnedMeshes) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          if ((material.clippingPlanes?.length ?? 0) !== planes.length) material.needsUpdate = true
          material.clippingPlanes = planes
        }
        previousView = config.view
        previousReset = config.resetKey
        heldProgress = config.endPose ? 1 : 0; playedMilliseconds = 0; previousPlaying = false; completed = false
      }
      if (config.endPose !== previousEndPose) { heldProgress = config.endPose ? 1 : 0; playedMilliseconds = 0 }
      previousEndPose = config.endPose
      if (config.playing && !previousPlaying) { playbackStart = now; completed = false }
      if (!config.playing && previousPlaying && !completed) playedMilliseconds += now - playbackStart
      previousPlaying = config.playing
      const elapsed = Math.min(1, (playedMilliseconds + now - playbackStart) / 5000)
      if (config.playing) heldProgress = (1 - Math.cos(elapsed * Math.PI * 2)) / 2
      const progress = heldProgress
      const movement = config.movement
      if (resetting) {
        poseModel(movement, config.side, 0)
        const target = new THREE.Vector3(0, 0.85, 0)
        const distances: Record<string, number> = { neck: 1.1, shoulder: 1.8, elbow: 1.5, wrist: 0.85, hand: 0.65, back: 2.8, hip: 2.2, knee: 1.7, ankle: 0.9, toes: 0.65 }
        const distance = movement ? distances[movement.area] : 3.1
        const focusName = movement?.focusBone ? `${movement.focusBone}${config.side === "Right" ? "_r" : "_l"}` : romBoneName(movement?.area ?? "", config.side)
        const focus = movement ? bones.get(focusName ?? "") : null
        if (focus) {
          focus.getWorldPosition(target)
          if (["shoulder", "elbow", "hip"].includes(movement!.area)) target.y -= 0.15
          if (movement!.area === "ankle") target.y += 0.05
        }
        const sideDirection = config.side === "Right" ? -1 : 1
        const profile = config.view === "side" || config.view === "left" || config.view === "right"
        const authored = config.regionMode ? SURFACE_VIEW_DIRECTIONS[config.view as keyof typeof SURFACE_VIEW_DIRECTIONS] : undefined
        const direction = authored ? new THREE.Vector3(authored[0], authored[1], authored[2]).normalize() : new THREE.Vector3(config.view === "left" ? 1 : config.view === "right" ? -1 : config.view === "side" ? sideDirection : config.view === "angled" ? 0.65 * sideDirection : 0, 0, config.view === "back" ? -1 : profile ? 0.02 : config.view === "angled" ? 0.76 : 1).normalize()
        if (focusBounds) {
          // Fit the clipped part's camera-aligned bounds, including depth, so
          // medial/sole/top close-ups cannot be obscured by the rest of the body.
          const right = new THREE.Vector3(0,1,0).cross(direction).normalize(), up = direction.clone().cross(right).normalize(), bounds = new THREE.Box3()
          for (const x of [focusBounds.min.x, focusBounds.max.x]) for (const y of [focusBounds.min.y, focusBounds.max.y]) for (const z of [focusBounds.min.z, focusBounds.max.z]) {
            const point = new THREE.Vector3(x,y,z); bounds.expandByPoint(new THREE.Vector3(point.dot(right), point.dot(up), point.dot(direction)))
          }
          const fit = fitBodyViewBounds({ min: bounds.min.toArray(), max: bounds.max.toArray() }, camera.fov, camera.aspect)!
          const center = focusBounds.getCenter(new THREE.Vector3())
          camera.position.copy(center).addScaledVector(direction, Math.max(0.18, fit.distance)); controls.target.copy(center); controls.update()
        } else if (!movement || !frameLimb(movement, config.side, direction)) {
          camera.position.copy(target).addScaledVector(direction, distance); camera.position.y += 0.03
          controls.target.copy(target); controls.update()
        }
      }
      poseModel(movement, config.side, progress)
      if (cameraFill) { cameraFill.position.copy(camera.position); cameraFill.target.position.copy(controls.target) }
      surfaceDirection.copy(camera.position).sub(controls.target).normalize()
      for (const target of targets) {
        const selected = config.regionMode ? config.selectedRegions?.includes(target.area) === true : target.area === config.area && (target.side === "Center" || target.side === config.side)
        const focusBone = selected && movement?.focusBone ? bones.get(`${movement.focusBone}${config.side === "Right" ? "_r" : "_l"}`) : null
        const markerBone = focusBone ?? target.bone
        markerBone.getWorldPosition(target.marker.position)
        if (target.region) {
          const region = target.region
          const toward = region.toward ? bones.get(region.toward) : null
          if (toward) target.marker.position.lerp(toward.getWorldPosition(position), region.fraction ?? 0.5)
          target.marker.position.x += region.offset[0]
          target.marker.position.y += region.offset[1]
          target.marker.position.z += region.offset[2]
          // Broad paired areas sit on the visible surface. Side-aware visibility
          // below prevents the opposite limb's dot being shown through the body.
          target.marker.position.addScaledVector(new THREE.Vector3(...region.normal), region.radius)
          // Snap authored locations to the neutral skin rather than displaying
          // rig offsets in empty space beside the silhouette. Candidate clouds
          // are prepared once; orbit updates search only a small local patch.
          let nearest: THREE.Vector3 | undefined, nearestDistance = Infinity
          for (const point of target.surfacePoints) {
            const distance = point.distanceToSquared(target.marker.position)
            if (distance < nearestDistance) { nearest = point; nearestDistance = distance }
          }
          if (nearest) target.marker.position.copy(nearest).addScaledVector(new THREE.Vector3(...region.normal), 0.003)
        }
        // A whole-body-size dot would hide an entire finger in a close-up.
        const closeUpScale = config.regionMode && config.focusPart ? 0.5 : movement && ["hand", "toes"].includes(movement.area) ? 0.25 : 1
        target.marker.scale.setScalar((selected ? 1.4 : 1) * closeUpScale)
        target.marker.material.color.setHex(selected ? 0xffa43b : 0x94efff)
        target.marker.visible = target.region ? bodySurfaceFacesCamera(target.region, surfaceDirection) && (config.focusPart ? target.region.partId === config.focusPart && target.region.detail : !target.region.detail && !target.region.focusOnly) : !movement || selected && movement.demo !== false
      }
      renderer.render(scene, camera)
      if (config.playing && elapsed < 1) schedule()
      else if (config.playing) { completed = true; playedMilliseconds = 0; latest.current.onPlaybackEnd() }
    }
    function schedule() { if (!disposed && !frame) frame = requestAnimationFrame(render) }
    invalidate.current = schedule
    controls.addEventListener("change", schedule)
    const observer = new ResizeObserver(() => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height; camera.updateProjectionMatrix(); previousView = ""; schedule()
    })
    observer.observe(container)
    const abort = new AbortController()
    fetch("/body-models/human-base-rigged.glb", { signal: abort.signal, cache: "force-cache" })
      .then((response) => { if (!response.ok) throw new Error("BODY_ASSET_UNAVAILABLE"); return response.arrayBuffer() })
      .then((bytes) => new GLTFLoader().parseAsync(bytes, ""))
      .then((gltf) => {
        if (disposed) { disposeObject(gltf.scene); return }
        model = gltf.scene
        model.traverse((node) => {
          if (node instanceof THREE.Bone) bones.set(node.name, node)
          if (node instanceof THREE.SkinnedMesh) skinnedMeshes.push(node)
          if (node instanceof THREE.Mesh) {
            const originals = Array.isArray(node.material) ? node.material : [node.material]
            originals.forEach((material) => material.dispose())
            node.material = new THREE.MeshPhysicalMaterial({ color: 0x0868c0, emissive: 0x032952, emissiveIntensity: 0.3, metalness: 0.28, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 })
          }
        })
        // Relax the bind pose into a clear standing reference before saving
        // neutral rotations. No limits or "normal ROM" come from the asset.
        model.updateMatrixWorld(true)
        for (const suffix of ["_l", "_r"]) {
          alignBone(bones.get(`upperarm${suffix}`), bones.get(`lowerarm${suffix}`), new THREE.Vector3(suffix === "_l" ? 0.3 : -0.3, -1, 0))
          alignBone(bones.get(`lowerarm${suffix}`), bones.get(`hand${suffix}`), new THREE.Vector3(suffix === "_l" ? 0.25 : -0.25, -1, 0))
          alignBone(bones.get(`hand${suffix}`), bones.get(`middle_01${suffix}`), new THREE.Vector3(0, -1, 0))
          const thumb = bones.get(`thumb_01${suffix}`)
          const middle = bones.get(`middle_01${suffix}`)
          if (thumb && middle) {
            // Palms-forward reference: thumb-side wrist motion must follow the
            // actual thumb, not a mirrored local axis from the imported rig.
            const radial = thumb.getWorldPosition(new THREE.Vector3()).sub(middle.getWorldPosition(new THREE.Vector3()))
            turn(bones.get(`hand${suffix}`), "y", Math.atan2(radial.z, radial.x) - (suffix === "_l" ? 0 : Math.PI))
          }
        }
        for (const [name, bone] of bones) neutral.set(name, bone.quaternion.clone())
        scene.add(model)
        const selectionTargets = latest.current.regionMode
          ? BODY_SURFACES.map((region) => ({ area: region.id, side: "Center", name: region.bone, region }))
          : ROM_AREAS.flatMap((area) => (area.paired ? ["Left", "Right"] : ["Center"]).map((side) => ({ area: area.id, side, name: romBoneName(area.id, side) ?? "", region: undefined })))
        for (const target of selectionTargets) {
          const bone = bones.get(target.name)
          if (!bone) throw new Error("BODY_JOINT_MAPPING_MISSING")
          const marker = new THREE.Mesh(new THREE.SphereGeometry(target.region ? 0.012 : 0.018, 12, 8), new THREE.MeshBasicMaterial({ color: 0x94efff, depthTest: !!target.region, transparent: true, opacity: 0.9 }))
          marker.renderOrder = 2; scene.add(marker); targets.push({ area: target.area, side: target.side, bone, region: target.region, surfacePoints: [], marker })
        }
        if (latest.current.regionMode) {
          // Regions use the static neutral surface; movement demonstrations
          // keep their bone-driven markers and never allocate these patches.
          const vertices: THREE.Vector3[] = []
          for (const mesh of skinnedMeshes) for (let index = 0; index < mesh.geometry.getAttribute("position").count; index++) vertices.push(mesh.getVertexPosition(index, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld))
          for (const part of BODY_PARTS) {
            const center = bones.get(part.bone)!.getWorldPosition(new THREE.Vector3())
            if (part.toward) center.lerp(bones.get(part.toward)!.getWorldPosition(new THREE.Vector3()), part.fraction ?? 0.5)
            center.add(new THREE.Vector3(...part.offset))
            const half = new THREE.Vector3(...part.half)
            partBounds.set(part.id, new THREE.Box3(center.clone().sub(half), center.clone().add(half)))
          }
          for (const target of targets) {
            const region = target.region!
            const center = target.bone.getWorldPosition(new THREE.Vector3())
            if (region.toward) center.lerp(bones.get(region.toward)!.getWorldPosition(new THREE.Vector3()), region.fraction ?? 0.5)
            center.add(new THREE.Vector3(...region.offset))
            const radiusSquared = Math.max(0.09, (region.radius ?? 0) + 0.06) ** 2
            target.surfacePoints = vertices.filter((point) => point.distanceToSquared(center) <= radiusSquared)
            if (!target.surfacePoints.length) throw new Error("BODY_REGION_SURFACE_MAPPING_MISSING")
          }
        }
        previousView = ""; latest.current.onReady("ready"); schedule()
      }).catch(() => { if (!disposed) latest.current.onReady("failed") })
    let down = { x: 0, y: 0 }
    function pointerDown(event: PointerEvent) { down = { x: event.clientX, y: event.clientY } }
    function pointerUp(event: PointerEvent) {
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 8 || latest.current.movement || latest.current.disabled) return
      const box = renderer.domElement.getBoundingClientRect()
      let closest: typeof targets[number] | undefined
      const candidates: { target: typeof targets[number]; distance: number }[] = []
      let distance = 28
      for (const target of targets) {
        if (!target.marker.visible) continue
        position.copy(target.marker.position).project(camera)
        const candidate = Math.hypot((position.x + 1) * box.width / 2 + box.left - event.clientX, (1 - position.y) * box.height / 2 + box.top - event.clientY)
        if (candidate < 28) candidates.push({ target, distance: candidate })
        if (candidate < distance) { closest = target; distance = candidate }
      }
      if (closest) {
        if (latest.current.regionMode) {
          // Depth-tested markers are not selectable through another limb. The
          // CPU hit test respects the same close-up clipping box as the shader.
          for (const { target } of candidates.sort((a, b) => a.distance - b.distance)) {
            const direction = target.marker.position.clone().sub(camera.position).normalize()
            raycaster.set(camera.position, direction)
            const hit = model ? raycaster.intersectObject(model, true).find((item) => !focusBounds || focusBounds.containsPoint(item.point)) : undefined
            if (!hit || hit.distance + 0.025 >= camera.position.distanceTo(target.marker.position)) { latest.current.onRegionPick?.(target.area); break }
          }
        }
        else latest.current.onPick(closest.area, closest.side)
      }
    }
    function contextLost(event: Event) { event.preventDefault(); latest.current.onReady("failed") }
    function visibilityChange() { if (document.hidden && latest.current.playing) latest.current.onPlaybackEnd() }
    renderer.domElement.addEventListener("pointerdown", pointerDown)
    renderer.domElement.addEventListener("pointerup", pointerUp)
    renderer.domElement.addEventListener("webglcontextlost", contextLost)
    document.addEventListener("visibilitychange", visibilityChange)
    schedule()
    return () => {
      disposed = true; abort.abort(); cancelAnimationFrame(frame); observer.disconnect()
      controls.removeEventListener("change", schedule); controls.dispose()
      document.removeEventListener("visibilitychange", visibilityChange)
      renderer.domElement.removeEventListener("pointerdown", pointerDown)
      renderer.domElement.removeEventListener("pointerup", pointerUp)
      renderer.domElement.removeEventListener("webglcontextlost", contextLost)
      disposeObject(scene); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove()
      invalidate.current = () => {}
    }
  }, [])
  return <div ref={host} className="absolute inset-0" data-body-scene />
}

/** World-space neutral alignment keeps both sides consistent despite mirrored
 * local bone bases in the imported rig. */
function alignBone(bone: THREE.Bone | undefined, child: THREE.Bone | undefined, direction: THREE.Vector3) {
  if (!bone?.parent || !child) return
  const current = child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize()
  const parent = bone.parent.getWorldQuaternion(new THREE.Quaternion())
  const delta = new THREE.Quaternion().setFromUnitVectors(current, direction.normalize())
  bone.quaternion.premultiply(parent.clone().invert().multiply(delta).multiply(parent))
  bone.updateMatrixWorld(true)
}

/** Dispose each shared GPU resource once, including failed/late model loads. */
function disposeObject(root: THREE.Object3D) {
  const resources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Skeleton>()
  root.traverse((node) => { if (node instanceof THREE.SkinnedMesh) resources.add(node.skeleton); if (node instanceof THREE.Mesh) { resources.add(node.geometry); for (const material of Array.isArray(node.material) ? node.material : [node.material]) resources.add(material) } })
  resources.forEach((resource) => resource.dispose())
}
