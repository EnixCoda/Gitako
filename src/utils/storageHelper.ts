const localStorage = browser.storage.local

const keys = {
  configVersion: 'configVersion',
  raiseErrorCache: 'raiseErrorCache',
} as const

export const storageKeys = keys

export type Storage = {
  // save root level keys for easier future migrating
  [key in EnumString<keyof typeof keys>]: string

  // separate different platform configs to simplify interactions with browser storage API
  // e.g.
  // ['platform_github.com']?: Config
}

async function get<T extends JSONObject>(mapping: string | string[] | null = null) {
  return (await localStorage.get(mapping || undefined)) as T | undefined
}

function set<T extends Record<string, unknown>>(value: T): Promise<void> | void {
  return localStorage.set(value)
}

export const storageHelper = { get, set }
