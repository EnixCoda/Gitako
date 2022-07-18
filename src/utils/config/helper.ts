import { SearchMode } from 'components/searchModes'
import { platformName } from 'platforms'
import { Storage, storageHelper } from 'utils/storageHelper'
import { migrateConfig } from './migrations'

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
  recursiveToggleFolder: 'shift' | 'alt'
  searchMode: SearchMode
  sidebarToggleMode: 'persistent' | 'float'
  commentToggle: boolean
  codeFolding: boolean
  compactFileTree: boolean
  restoreExpandedFolders: boolean
  pjaxMode: 'native' | 'pjax-api'
  showDiffInText: boolean
}

export type ConfigKeys = keyof Config

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
  recursiveToggleFolder = 'recursiveToggleFolder',
  searchMode = 'searchMode',
  sidebarToggleMode = 'sidebarToggleMode',
  commentToggle = 'commentToggle',
  codeFolding = 'codeFolding',
  compactFileTree = 'compactFileTree',
  restoreExpandedFolders = 'restoreExpandedFolders',
  pjaxMode = 'pjaxMode',
  showDiffInText = 'showDiffInText',
}

// NOT use platform name to distinguish GHE from github.com
const platformStorageKey = `platform_` + window.location.host.toLowerCase()
const isInGitHub = platformStorageKey === 'platform_github.com'

export const getDefaultConfigs: () => Config = () => ({
  sideBarWidth: 260,
  shortcut: undefined,
  accessToken: '',
  compressSingletonFolder: true,
  copyFileButton: !isInGitHub, // disable on github.com
  copySnippetButton: !isInGitHub, // disable on github.com
  intelligentToggle: null,
  icons: 'rich',
  toggleButtonVerticalDistance: 124, // align with GitHub's navbar items
  recursiveToggleFolder: 'shift',
  searchMode: 'fuzzy',
  sidebarToggleMode: 'float',
  commentToggle: true,
  codeFolding: true,
  compactFileTree: false,
  restoreExpandedFolders: true,
  pjaxMode: platformName === 'GitHub' ? 'native' : 'pjax-api', // use native on GitHub
  showDiffInText: false,
})

const configKeyArray = Object.values(configKeys)

function applyDefaultConfigs(configs: Partial<Config>) {
  const defaultConfigs = getDefaultConfigs()
  return configKeyArray.reduce((applied, key) => {
    Object.assign(applied, { [key]: key in configs ? configs[key] : defaultConfigs[key] })
    return applied
  }, {} as Config)
}

export type VersionedConfig<SiteConfig> = Record<string, SiteConfig> & Storage

export const configRef: Partial<Config> = {}
const updateConfigRef = async (config: Partial<Config>) => {
  Object.assign(configRef, config)
}

const configMigration = migrateConfig()
configMigration.then(async () => updateConfigRef(await get()))

async function get(): Promise<Config> {
  await configMigration
  const config = await storageHelper.get<Record<string, Config>>([platformStorageKey])
  return applyDefaultConfigs(config?.[platformStorageKey] || {})
}

async function set(config: Config) {
  updateConfigRef(config)
  return await storageHelper.set({ [platformStorageKey]: config })
}

export const configHelper = { get, set }
