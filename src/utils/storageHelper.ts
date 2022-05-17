const localStorage = browser.storage.local

export type Storage = {
  // save root level `configVersion` for easier future migrating
  [key in EnumString<'configVersion'>]: string

  // separate different platform configs to simplify interactions with browser storage API
  // e.g.
  // ['platform_github.com']?: Config
}

async function get<T extends JSONObject>(mapping: string | string[] | null = null) {
  return (await localStorage.get(mapping || undefined)) as T | undefined
}

function set<T>(value: T): Promise<void> | void {
  return localStorage.set(value)
}

export const storageHelper = { get, set }
