import { storageHelper } from 'utils/storageHelper'
import { Migration } from '.'
import { Storage } from '../../storageHelper'

export const migration: Migration = {
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
    ])
    if (
      config &&
      (!('configVersion' in config) ||
        config.configVersion === null ||
        config.configVersion < version)
    ) {
      await storageHelper.set({ platform_GitHub: config, configVersion: version })
    }
  },
}
