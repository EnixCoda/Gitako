import { useEffect } from 'react'

/**
 * This effect addresses such a problem:
 * the later effect ends earlier than the previous one, and the previous effect overlaps later effect's result.
 */
export function useAbortableEffect<T, TReturn, TNext>(
  effect: () => {
    getAsyncGenerator: () => AsyncGenerator<T, TReturn, TNext>
    cancel?: () => void
  },
) {
  useEffect(() => {
    const abortController = new AbortController()
    // The previous effect should stop running if the signal indicates should abort
    const { getAsyncGenerator, cancel } = effect()
    runAbortableAsyncGenerator(getAsyncGenerator(), abortController.signal)
    return () => {
      cancel?.()
      abortController.abort()
    }
  }, [effect])
}

async function runAbortableAsyncGenerator<T>(
  generator: AsyncGenerator<unknown, T, unknown>,
  signal?: AbortSignal,
) {
  let latestResult: IteratorResult<unknown> | undefined
  do {
    if (signal?.aborted) return
    latestResult = await generator.next(await latestResult?.value)
  } while (!latestResult.done)
  return latestResult.value
}
