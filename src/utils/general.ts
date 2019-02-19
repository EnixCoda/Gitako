export function pick<T>(source: T, keys: string[]): Partial<T> {
  if (keys && typeof keys === 'object') {
    return (Array.isArray(keys) ? keys : Object.keys(keys)).reduce(
      (copy, key) => {
        copy[key as keyof T] = source[key as keyof T]
        return copy
      },
      {} as Partial<T>
    )
  }
  return {} as Partial<T>
}
