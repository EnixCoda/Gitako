import storageHelper from 'utils/storageHelper'
import { pick } from 'utils/general'

type Config = {
  shortcut: string
  accessToken: string | null
  compressSingletonFolder: boolean
  copyFileButton: boolean
  copySnippetButton: boolean
}

export const config = {
  shortcut: 'shortcut',
  accessToken: 'access_token',
  compressSingletonFolder: 'compressSingletonFolder',
  copyFileButton: 'copyFileButton',
  copySnippetButton: 'copySnippetButton',
}

const configKeys = Object.values(config)

function get(): any {
  return storageHelper.get(configKeys) || {}
}

function getOne(key: keyof Config) {
  return get()[key]
}

function set(partialConfig: Partial<Config>) {
  return storageHelper.set(pick(partialConfig, configKeys))
}

function setOne<K extends keyof Config>(key: K, value: Config[K]) {
  return set({
    [key]: value,
  })
}

export default {
  get,
  getOne,
  set,
  setOne,
}
