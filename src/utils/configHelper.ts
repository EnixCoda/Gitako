import { pick } from 'utils/general'
import storageHelper from 'utils/storageHelper'

export type Config = {
  sideBarWidth: number
  shortcut: string | undefined
  access_token: string | undefined
  compressSingletonFolder: boolean
  copyFileButton: boolean
  copySnippetButton: boolean
  intelligentToggle: boolean | null // `null` stands for intelligent, boolean for sidebar open status
}

export enum configKeys {
  sideBarWidth = 'sideBarWidth',
  shortcut = 'shortcut',
  accessToken = 'access_token',
  compressSingletonFolder = 'compressSingletonFolder',
  copyFileButton = 'copyFileButton',
  copySnippetButton = 'copySnippetButton',
  intelligentToggle = 'intelligentToggle',
}

const defaultConfigs: Config = {
  sideBarWidth: 260,
  shortcut: undefined,
  access_token: undefined,
  compressSingletonFolder: true,
  copyFileButton: true,
  copySnippetButton: true,
  intelligentToggle: null,
}

const configKeyArray = Object.values(configKeys)

function applyDefaultConfigs(configs: Config) {
  return configKeyArray.reduce(
    (applied, configKey) => {
      const key = configKey as keyof Config
      Object.assign(applied, { [key]: key in configs ? configs[key] : defaultConfigs[key] })
      return applied
    },
    {} as Config,
  )
}

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
