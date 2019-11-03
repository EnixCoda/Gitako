const localStorage = browser.storage.local

function get(mapping: string[] | null): Promise<any> {
  return localStorage.get(mapping || undefined)
}

function set(value: any): Promise<void> {
  return localStorage.set(value)
}

export default {
  get,
  set,
}
