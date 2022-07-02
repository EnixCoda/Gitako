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

async function get<
  T extends {
    [key: string]: any
  },
>(mapping: string | string[] | null = null): Promise<T | undefined> {
  try {
    return (await localStorage.get(mapping || undefined)) as T
  } catch (err) {}
}

function set(value: any): Promise<void> | void {
  try {
    return localStorage.set(value)
  } catch (err) {}
}

export const storageHelper = { get, set }
