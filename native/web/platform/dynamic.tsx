import { lazy, Suspense, type ComponentType } from "react"

/** Native has no server render. Shared lazy components retain their loading
 * states and are resolved from checksum-inventoried packaged chunks. */
export default function dynamic<P extends object>(load: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>, options?: { ssr?: boolean; loading?: ComponentType }) {
  const Component = lazy(async () => { const value = await load(); return { default: "default" in value ? value.default : value } })
  const Loading = options?.loading
  return function NativeDynamic(props: P) { return <Suspense fallback={Loading ? <Loading /> : null}><Component {...props} /></Suspense> }
}

