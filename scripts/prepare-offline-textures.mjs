import { mkdir, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"

/** Exact existing public images, pinned bytes; no site/provider mutation. */
const assets = [
  ["earth-blue-marble.jpg", "228deba2e4b600146bdcb6cfa359b8ead6aacc2b1c13550a29cd82824cfa1c01"],
  ["earth-topology.png", "839b12da2e4dd346b256cebae72e10c479a102c8980a22084c41275e4b9a0e12"],
]
const directory = new URL("../output/offline-textures/", import.meta.url)
await mkdir(directory, { recursive: true })
for (const [name, expected] of assets) {
  const response = await fetch("https://unpkg.com/three-globe@2.31.0/example/img/" + name, { redirect: "error" })
  if (!response.ok) throw new Error("Globe texture download failed.")
  const payload = Buffer.from(await response.arrayBuffer())
  if (createHash("sha256").update(payload).digest("hex") !== expected) throw new Error("Globe texture checksum mismatch.")
  await writeFile(new URL(name, directory), payload)
}
