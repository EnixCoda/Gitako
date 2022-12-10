export function assert(condition: boolean, errorMessage?: string): asserts condition {
  if (!condition) throw new Error(errorMessage)
}
