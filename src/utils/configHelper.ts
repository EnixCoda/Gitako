import { SearchMode } from 'components/searchModes'
import * as storageHelper from 'utils/storageHelper'

export type Config = {
  sideBarWidth: number
  shortcut: string | undefined
  accessToken: string | undefined
  compressSingletonFolder: boolean
  copyFileButton: boolean
  copySnippetButton: boolean
  intelligentToggle: boolean | null // `null` stands for intelligent, boolean for sidebar open state
  icons: 'rich' | 'dim' | 'native'
  toggleButtonVerticalDistance: number
  toggleButtonContent: 'logo' | 'octoface'
  recursiveToggleFolder: 'shift' | 'alt'
  searchMode: SearchMode
  commentToggle: boolean
}

enum configKeys {
  sideBarWidth = 'sideBarWidth',
  shortcut = 'shortcut',
  accessToken = 'accessToken',
  compressSingletonFolder = 'compressSingletonFolder',
  copyFileButton = 'copyFileButton',
  copySnippetButton = 'copySnippetButton',
  intelligentToggle = 'intelligentToggle',
  icons = 'icons',
  toggleButtonVerticalDistance = 'toggleButtonVerticalDistance',
  toggleButtonContent = 'toggleButtonContent',
  recursiveToggleFolder = 'recursiveToggleFolder',
  searchMode = 'searchMode',
  commentToggle = 'commentToggle',
}

const defaultConfigs: Config = {
  sideBarWidth: 260,
  shortcut: undefined,
  accessToken: '',
  compressSingletonFolder: true,
  copyFileButton: true,
  copySnippetButton: true,
  intelligentToggle: null,
  icons: 'rich',
  toggleButtonVerticalDistance: 124, // align with GitHub's navbar items
  toggleButtonContent: 'logo',
  recursiveToggleFolder: 'shift',
  searchMode: 'fuzzy',
  commentToggle: true,
}

const configKeyArray = Object.values(configKeys)

function applyDefaultConfigs(configs: Partial<Config>) {
  return configKeyArray.reduce((applied, key) => {
    Object.assign(applied, { [key]: key in configs ? configs[key] : defaultConfigs[key] })
    return applied
  }, {} as Config)
}

type VersionedConfig<SiteConfig> = Record<string, SiteConfig> & { configVersion: string }

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
        const config: any | void = await storageHelper.get<Storage>([
          'configVersion',
          'sideBarWidth',
          'shortcut',
          'access_token',
          'compressSingletonFolder',
          'copyFileButton',
          'copySnippetButton',
          'intelligentToggle',
          'icons',
          'commentToggle',
        ])
        if (config && (!('configVersion' in config) || config.configVersion < version)) {
          await storageHelper.set({ platform_GitHub: config, configVersion: version })
        }
      },
    },
    {
      version: '1.3.4',
      async migrate(version) {
        const config: any | void = await storageHelper.get<VersionedConfig<Config> & Storage>([
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
    {
      version: '2.6.0',
      async migrate(version) {
        type LegacySiteConfig = {
          access_token?: string
        }
        type MigratedSiteConfig = {
          accessToken?: string
        }

        const config = await storageHelper.get<VersionedConfig<LegacySiteConfig> & Storage>()
        if (config && config.configVersion < version) {
          const { configVersion, ...restConfig } = config
          for (const key of Object.keys(restConfig)) {
            if (
              typeof restConfig[key] === 'object' &&
              restConfig[key] &&
              'access_token' in restConfig[key]
            ) {
              const config: LegacySiteConfig = restConfig[key]
              const { access_token: accessToken, ...legacy } = config
              const migrated: MigratedSiteConfig = {
                ...legacy,
                accessToken,
              }
              await storageHelper.set({
                [key]: migrated,
              })
            }
          }
          await storageHelper.set({
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
  return applyDefaultConfigs(config?.[platformStorageKey] || {})
}

export async function set(config: Config) {
  return await storageHelper.set({ [platformStorageKey]: config })
}
