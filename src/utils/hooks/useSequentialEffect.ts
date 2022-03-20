import { useEffect, useRef } from 'react'

/**
 * This effect addresses such a problem:
 * the later effect ends earlier than the previous one, and the previous effect overlaps later effect's result.
 */
export function useSequentialEffect(
  effect: (checker: () => boolean) => (() => void | undefined) | void,
  deps: React.DependencyList = [],
) {
  const sequenceCounter = useRef(0)
  useEffect(() => {
    // The counter is incremented every time a new effect is added.
    // And the previous effect should stop going forward by finding checker returning false.
    const counter = ++sequenceCounter.current
    const checker = () => counter === sequenceCounter.current
    return effect(checker)
  }, deps)
}
