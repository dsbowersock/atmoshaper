"use client"

import { useEffect, useRef, useState } from "react"

type BusinessPlannerDraftOptions<T> = {
  storageKey: string
  initialValue: () => T
  normalize: (value: unknown) => T
  preferInitialValue?: boolean
  serialize?: (value: T) => unknown
}

/**
 * Hydrates one existing planner key before autosaving its normalized value.
 *
 * A failed read keeps the draft in memory and disables automatic writes for that
 * hydration, protecting stored work we could not inspect. Failed writes can be
 * retried by a later edit. The caller can prefer its initial server value over a
 * local draft. This choice belongs to one mounted form: refreshed props must not
 * reset edits. `hydratedValue` anchors the caller's existing account sync.
 */
export function useBusinessPlannerDraft<T>({
  storageKey,
  initialValue,
  normalize,
  preferInitialValue = false,
  serialize,
}: BusinessPlannerDraftOptions<T>) {
  const [value, setValue] = useState<T>(initialValue)
  const initialValueRef = useRef(value)
  const preferInitialValueRef = useRef(preferInitialValue)
  const [storageUnavailable, setStorageUnavailable] = useState(false)
  const [hydration, setHydration] = useState({
    ready: false,
    storageKey,
    value,
    mayWrite: false,
  })

  useEffect(() => {
    let nextValue = initialValueRef.current
    let unavailable = false
    let mayWrite = false

    if (preferInitialValueRef.current) {
      mayWrite = true
    } else {
      try {
        const storage = window.localStorage
        const stored = storage.getItem(storageKey)
        if (stored) {
          try {
            nextValue = normalize(JSON.parse(stored))
          } catch {
            // Preserve the existing corrupt-draft reset, confined to this key.
            storage.removeItem(storageKey)
          }
        }
        mayWrite = true
      } catch {
        unavailable = true
      }
    }

    setValue(nextValue)
    setStorageUnavailable(unavailable)
    setHydration({ ready: true, storageKey, value: nextValue, mayWrite })
  }, [normalize, storageKey])

  const storageReady = hydration.ready
    && hydration.storageKey === storageKey

  useEffect(() => {
    if (!storageReady || !hydration.mayWrite) return

    try {
      const storedValue = serialize ? serialize(value) : value
      window.localStorage.setItem(storageKey, JSON.stringify(storedValue))
      setStorageUnavailable(false)
    } catch {
      setStorageUnavailable(true)
    }
  }, [hydration.mayWrite, serialize, storageKey, storageReady, value])

  return {
    value,
    setValue,
    storageReady,
    storageUnavailable,
    unreadDraft: storageReady && !hydration.mayWrite,
    hydratedValue: hydration.value,
  }
}
