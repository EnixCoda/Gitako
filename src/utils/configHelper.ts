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
  toggleButtonVerticalDistance: number
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
  toggleButtonVerticalDistance = 'toggleButtonVerticalDistance',
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
  toggleButtonVerticalDistance: 80,
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
  // platform_github.com?: Config
}

async function migrateConfig() {
  // not referencing to enum above to prevent migrate future configs
  const migrations: {
    version: string
    migrate(version: string): Promise<void>
  }[] = [
    {
      version: '1.0.1',
      async migrate(version) {
        const config: any | void = await storageHelper.get<Config | Storage>([
          'configVersion',
          'sideBarWidth',
          'shortcut',
          'access_token',
          'compressSingletonFolder',
          'copyFileButton',
          'copySnippetButton',
          'intelligentToggle',
          'icons',
        ])
        if (config && (!('configVersion' in config) || config.configVersion < version)) {
          await storageHelper.set({ platform_GitHub: config, configVersion: version })
        }
      },
    },
    {
      version: '1.3.4',
      async migrate(version) {
        const config: any | void = await storageHelper.get<Config | Storage>([
          'configVersion',
          'platform_undefined', // this was a mistake :(
          'platform_GitHub',
          'platform_github.com',
        ])
        if (
          config &&
          'configVersion' in config &&
          config.configVersion < version &&
          (config.platform_GitHub || config.platform_undefined) &&
          !config['platform_github.com']
        ) {
          await storageHelper.set({
            ['platform_github.com']: config.platform_GitHub || config.platform_undefined,
            configVersion: version,
          })
        }
      },
    },
  ]

  for (const { version, migrate } of migrations) {
    await migrate(version)
  }
}

// do NOT use platform name
const platformStorageKey = `platform_` + window.location.host.toLowerCase()
const prepareConfig = new Promise(async resolve => {
  await migrateConfig()
  resolve()
})

export async function get(): Promise<Config> {
  await prepareConfig
  const config = await storageHelper.get<Record<string, Config>>([platformStorageKey])
  return applyDefaultConfigs((config && config[platformStorageKey]) || {})
}

export async function set(config: Config) {
  return await storageHelper.set({ [platformStorageKey]: config })
}
