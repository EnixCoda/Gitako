const localStorage = browser.storage.local

export async function get<
  T extends {
    [key: string]: any
  }
>(mapping: string | string[] | null = null): Promise<T | void> {
  try {
    return (await localStorage.get(mapping || undefined)) as T
  } catch (err) {}
}

export function set(value: any): Promise<void> | void {
  try {
    return localStorage.set(value)
  } catch (err) {}
}
