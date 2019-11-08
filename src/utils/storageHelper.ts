const localStorage = browser.storage.local

export function get(mapping: string[] | null): Promise<any> {
  return localStorage.get(mapping || undefined)
}

export function set(value: any): Promise<void> {
  return localStorage.set(value)
}
