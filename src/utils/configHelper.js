import storageHelper from './storageHelper'
import { pick } from './general'

export const config = {
  shortcut: 'shortcut',
  accessToken: 'access_token',
  compressSingletonFolder: 'compressSingletonFolder',
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
