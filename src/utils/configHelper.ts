import { getPlatformName } from 'platforms'
import * as storageHelper from 'utils/storageHelper'

export type Config = {
  sideBarWidth: number
  shortcut: string | undefined
  access_token: string | undefined
  compressSingletonFolder: boolean
  copyFileButton: boolean
  copySnippetButton: boolean
  intelligentToggle: boolean | null // `null` stands for intelligent, boolean for sidebar open status
  icons: 'rich' | 'dim' | 'native'
}

export enum configKeys {
  sideBarWidth = 'sideBarWidth',
  shortcut = 'shortcut',
  accessToken = 'access_token',
  compressSingletonFolder = 'compressSingletonFolder',
  copyFileButton = 'copyFileButton',
  copySnippetButton = 'copySnippetButton',
  intelligentToggle = 'intelligentToggle',
  icons = 'icons',
}

const defaultConfigs: Config = {
  sideBarWidth: 260,
  shortcut: undefined,
  access_token: undefined,
  compressSingletonFolder: true,
  copyFileButton: true,
  copySnippetButton: true,
  intelligentToggle: null,
  icons: 'rich',
}

const configKeyArray = Object.values(configKeys)

function applyDefaultConfigs(configs: Partial<Config>) {
  return configKeyArray.reduce((applied, configKey) => {
    const key = configKey as keyof Config
    Object.assign(applied, { [key]: key in configs ? configs[key] : defaultConfigs[key] })
    return applied
  }, {} as Config)
}

type Storage = {
  // save root level `configVersion` for easier future migrating
  [key in 'configVersion' | string]: string

  // separate different platform configs to simplify interactions with browser storage API
  // e.g.
  // platform_GitHub?: Config
}

async function migrateConfig() {
  const config = await storageHelper.get<Config | Storage>(configKeyArray)
  if (!config || !('configVersion' in config) || config.configVersion < '1.0.1') {
    await storageHelper.set({ platform_GitHub: config, configVersion: '1.0.1' })
  }
}

let platformName: string
const prepareConfig = new Promise(async resolve => {
  await migrateConfig()
  platformName = `platform_` + (await getPlatformName())
  resolve()
})

export async function get(): Promise<Config> {
  await prepareConfig
  const config = await storageHelper.get<Record<string, Config>>([platformName])
  return applyDefaultConfigs((config && config[platformName]) || {})
}

export async function set(partialConfig: Partial<Config>) {
  return await storageHelper.set({ [platformName]: partialConfig })
}
