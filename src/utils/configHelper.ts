import * as storageHelper from 'utils/storageHelper'

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

export const defaultConfigs: Config = {
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

export async function getAll(): Promise<Config> {
  return applyDefaultConfigs(await storageHelper.get(configKeyArray))
}

export async function getOne(key: configKeys) {
  return (await getAll())[key]
}

export async function setAll(partialConfig: Partial<Config>) {
  return await storageHelper.set(partialConfig)
}

export async function setOne(key: configKeys, value: any) {
  return await setAll({
    [key]: value,
  })
}
