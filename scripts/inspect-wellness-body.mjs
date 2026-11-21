import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { Box3, Vector3 } from "three"

// The pinned GLB contains only embedded geometry and a rig, never executable
// content or external textures. Inspect the same asset served by the app.
const bytes = await readFile(new URL("../public/body-models/human-base-rigged.glb", import.meta.url))
const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
if (json.buffers.some((buffer) => buffer.uri) || json.images?.length) throw new Error("Body model must be self-contained and texture-free")
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "")
gltf.scene.updateMatrixWorld(true)
const bones = []
gltf.scene.traverse((node) => { if (node.isBone && !/index|middle|pinky|ring|thumb/.test(node.name)) bones.push({ name: node.name, position: node.getWorldPosition(new Vector3()).toArray().map((value) => +value.toFixed(3)) }) })
console.log(JSON.stringify({ bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), bounds: new Box3().setFromObject(gltf.scene).getSize(new Vector3()).toArray(), bones }, null, 2))
