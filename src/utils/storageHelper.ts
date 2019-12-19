const localStorage = browser.storage.local

export function get(mapping: string[] | null): Promise<any> | any {
  try {
    return localStorage.get(mapping || undefined)
  } catch (err) {}
}

export function set(value: any): Promise<void> | void {
  try {
    return localStorage.set(value)
  } catch (err) {}
}
