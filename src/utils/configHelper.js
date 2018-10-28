import storageHelper from 'utils/storageHelper'
import { pick } from 'utils/general'

export const config = {
  shortcut: 'shortcut',
  accessToken: 'access_token',
  compressSingletonFolder: 'compressSingletonFolder',
  copyFileButton: 'copyFileButton',
  copySnippetButton: 'copySnippetButton',
}

const configKeys = Object.values(config)

function get() {
  return storageHelper.get(configKeys)
}

function getOne(key) {
  return get()[key]
}

function set(partialConfig) {
  return storageHelper.set(pick(partialConfig, configKeys))
}

function setOne(key, value) {
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
