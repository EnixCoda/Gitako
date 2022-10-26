import { useEffect } from 'react'

/**
 * This effect addresses such a problem:
 * the later effect ends earlier than the previous one, and the previous effect overlaps later effect's result.
 */
export function useAbortableEffect(
  effect: (shouldAbort: AbortSignal) => (() => void | undefined) | void,
) {
  useEffect(() => {
    const abortController = new AbortController()
    // The previous effect should stop running if the signal indicates should abort
    const defect = effect(abortController.signal)
    return () => {
      abortController.abort()
      defect?.()
    }
  }, [effect])
}
