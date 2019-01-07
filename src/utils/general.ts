export function pick<T extends any>(source: T, keys: string[]): T {
  if (keys && typeof keys === 'object') {
    return (Array.isArray(keys) ? keys : Object.keys(keys)).reduce(
      (copy, key) => {
        copy[key] = source[key]
        return copy
      },
      {} as T
    )
  }
  return {} as T
}
