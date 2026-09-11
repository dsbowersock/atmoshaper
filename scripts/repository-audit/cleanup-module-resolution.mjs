import { builtinModules } from "node:module"
import { extname, posix } from "node:path"

const BUILTIN_MODULES = new Set(builtinModules.map((name) => name.replace(/^node:/, "")))
const PACKAGE_SEGMENT = /^[A-Za-z0-9._~-]+$/
const TYPE_RESOLUTION_EXTENSIONS = [".ts", ".tsx", ".d.ts", ".js", ".jsx"]
const EXPLICIT_TYPE_FAMILIES = new Map([
  [".js", [".ts", ".tsx", ".d.ts", ".js"]],
  [".jsx", [".tsx", ".ts", ".d.ts", ".jsx"]],
  [".mjs", [".mts", ".d.mts", ".mjs"]],
  [".cjs", [".cts", ".d.cts", ".cjs"]],
])

function packageOwner(specifier) {
  const unprefixed = specifier.replace(/^node:/, "")
  if (BUILTIN_MODULES.has(unprefixed)) return null
  if (specifier.startsWith("node:")) return undefined
  const parts = specifier.split("/")
  if (parts.some((part) => !part || part === "." || part === "..")) return undefined
  if (specifier.startsWith("@")) {
    if (parts.length < 2 || !PACKAGE_SEGMENT.test(parts[0].slice(1)) || !parts.slice(1).every((part) => PACKAGE_SEGMENT.test(part))) {
      return undefined
    }
    return parts.slice(0, 2).join("/")
  }
  return parts.every((part) => PACKAGE_SEGMENT.test(part)) ? parts[0] : undefined
}

function referenceBase(fromPath, specifier) {
  let base
  if (specifier.startsWith("@/")) base = specifier.slice(2)
  else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    base = posix.normalize(posix.join(posix.dirname(fromPath), specifier))
  } else return null
  return base === ".." || base.startsWith("../") || base.startsWith("/") ? null : base
}

function moduleCandidatePaths(fromPath, specifier, policy) {
  const base = referenceBase(fromPath, specifier)
  if (!base) return []
  const candidates = [base]
  const extension = extname(base).toLowerCase()
  const hasSupportedExtension = policy.sourceExtensions.includes(extension) || [".css", ".json"].includes(extension)
  if (!hasSupportedExtension) {
    for (const supported of policy.sourceExtensions) candidates.push(`${base}${supported}`)
    candidates.push(`${base}.json`, `${base}.css`)
    for (const supported of policy.sourceExtensions) candidates.push(`${base}/index${supported}`)
    candidates.push(`${base}/index.json`, `${base}/index.css`, `${base}.d.ts`, `${base}/index.d.ts`)
  } else if (EXPLICIT_TYPE_FAMILIES.has(extension)) {
    const stem = base.slice(0, -extension.length)
    for (const candidateExtension of EXPLICIT_TYPE_FAMILIES.get(extension).slice(0, -1)) {
      candidates.push(`${stem}${candidateExtension}`)
    }
  }
  return [...new Set(candidates)]
}

function typeTargetPath(fromPath, specifier, trackedPathSet) {
  const base = referenceBase(fromPath, specifier)
  if (!base) return undefined
  const extension = extname(base).toLowerCase()
  const family = EXPLICIT_TYPE_FAMILIES.get(extension)
  if (extension && !family) return undefined
  const stem = extension ? base.slice(0, -extension.length) : base
  const extensions = family ?? TYPE_RESOLUTION_EXTENSIONS
  const candidates = extensions.map((candidateExtension) => `${stem}${candidateExtension}`)
  if (!extension) candidates.push(...extensions.map((candidateExtension) => `${stem}/index${candidateExtension}`))
  return candidates.find((path) => trackedPathSet.has(path)) ?? null
}

function declarationForImplementation(path) {
  const extension = extname(path).toLowerCase()
  if ([".js", ".jsx"].includes(extension)) return `${path.slice(0, -extension.length)}.d.ts`
  if (extension === ".mjs" || extension === ".mts") return `${path.slice(0, -extension.length)}.d.mts`
  if (extension === ".cjs" || extension === ".cts") return `${path.slice(0, -extension.length)}.d.cts`
  return null
}

const isDeclarationPath = (path) => path.endsWith(".d.ts") || path.endsWith(".d.mts") || path.endsWith(".d.cts")

/** Resolve runtime ownership first, then attach a distinct TypeScript source or declaration target when proven. */
export function resolveModuleReference(fromPath, specifier, trackedPathSet, policy, resolveTypeDeclaration = false) {
  const candidates = moduleCandidatePaths(fromPath, specifier, policy)
  if (candidates.length > 0) {
    const path = candidates.find((candidate) => trackedPathSet.has(candidate))
    if (!path) return { targetKind: "unresolved" }
    const pairedDeclarationPath = declarationForImplementation(path)
    const base = referenceBase(fromPath, specifier)
    const explicitTypeFamily = base && EXPLICIT_TYPE_FAMILIES.has(extname(base).toLowerCase())
    const independentTypeTargetPath = resolveTypeDeclaration || explicitTypeFamily
      ? typeTargetPath(fromPath, specifier, trackedPathSet) : undefined
    const declarationTargetPath = independentTypeTargetPath !== undefined
      ? (independentTypeTargetPath && isDeclarationPath(independentTypeTargetPath) ? independentTypeTargetPath : null)
      : (pairedDeclarationPath && trackedPathSet.has(pairedDeclarationPath) ? pairedDeclarationPath : null)
    const typescriptTargetPath = independentTypeTargetPath && !isDeclarationPath(independentTypeTargetPath) &&
      independentTypeTargetPath !== path ? independentTypeTargetPath : null
    return {
      targetKind: "tracked-module", targetPath: path,
      ...(declarationTargetPath && declarationTargetPath !== path ? { declarationTargetPath } : {}),
      ...(typescriptTargetPath ? { typescriptTargetPath } : {}),
    }
  }
  if (specifier.startsWith("/") || specifier === "@" || specifier.startsWith("@/") || specifier === "." || specifier === "..") {
    return { targetKind: "unresolved" }
  }
  const dependency = packageOwner(specifier)
  if (dependency) return { dependency, targetKind: "package" }
  return dependency === null ? { targetKind: "builtin" } : { targetKind: "unresolved" }
}
