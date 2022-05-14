import { useEffect } from 'react'

/**
 * This effect addresses such a problem:
 * the later effect ends earlier than the previous one, and the previous effect overlaps later effect's result.
 */
export function useSequentialEffect(
  effect: (checker: () => boolean) => (() => void | undefined) | void,
) {
  useEffect(() => {
    // The previous effect should stop running when finding checker returning false.
    let valid = true
    const checker = () => valid
    const defect = effect(checker)
    return () => {
      valid = false
      defect?.()
    }
  }, [effect])
}
