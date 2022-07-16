import { useEffect } from 'react'

/**
 * This effect addresses such a problem:
 * the later effect ends earlier than the previous one, and the previous effect overlaps later effect's result.
 */
export function useSequentialEffect(
  effect: (shouldAbort: () => boolean) => (() => void | undefined) | void,
) {
  useEffect(() => {
    // The previous effect should stop running if shouldAbort returns true.
    let end = false
    const shouldAbort = () => end
    const defect = effect(shouldAbort)
    return () => {
      end = true
      defect?.()
    }
  }, [effect])
}
