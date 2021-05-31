const localStorage = browser.storage.local

export type Storage = {
  // save root level `configVersion` for easier future migrating
  [key in EnumString<'configVersion'>]: string

  // separate different platform configs to simplify interactions with browser storage API
  // e.g.
  // ['platform_github.com']?: Config
}

async function get<
  T extends {
    [key: string]: any
  }
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
