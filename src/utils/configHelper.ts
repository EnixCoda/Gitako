import storageHelper from 'utils/storageHelper'
import { pick } from 'utils/general'

type Config = {
  shortcut: string | undefined
  access_token: string | undefined
  compressSingletonFolder: boolean
  copyFileButton: boolean
  copySnippetButton: boolean
}

export enum configKeys {
  shortcut = 'shortcut',
  accessToken = 'access_token',
  compressSingletonFolder = 'compressSingletonFolder',
  copyFileButton = 'copyFileButton',
  copySnippetButton = 'copySnippetButton',
}

const defaultConfigs = {
  shortcut: undefined,
  access_token: undefined,
  compressSingletonFolder: true,
  copyFileButton: true,
  copySnippetButton: true,
}

function applyDefaultConfigs(configs: Config) {
  return Object.keys(configs).reduce(
    (applied, configKey) => {
      const key = configKey as keyof Config
      if (configs[key] === undefined) {
        applied[key] = defaultConfigs[key]
      } else {
        applied[key] = configs[key]
      }
      return applied
    },
    {} as Config,
  )
}

const configKeyArray = Object.values(configKeys)

async function getAll(): Promise<Config> {
  return applyDefaultConfigs(await storageHelper.get(configKeyArray))
}

async function getOne(key: keyof Config) {
  return (await getAll())[key]
}

async function set(partialConfig: Partial<Config>) {
  return await storageHelper.set(pick(partialConfig, configKeyArray))
}

async function setOne(key: configKeys, value: any) {
  return await set({
    [key]: value,
  })
}

export default {
  getAll,
  getOne,
  set,
  setOne,
}
