import storageHelper from 'utils/storageHelper'
import { pick } from 'utils/general'

type Config = {
  shortcut: string
  accessToken: string | null
  compressSingletonFolder: boolean
  copyFileButton: boolean
  copySnippetButton: boolean
}

export enum config {
  shortcut = 'shortcut',
  accessToken = 'access_token',
  compressSingletonFolder = 'compressSingletonFolder',
  copyFileButton = 'copyFileButton',
  copySnippetButton = 'copySnippetButton',
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

function setOne(key: config, value: any) {
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
