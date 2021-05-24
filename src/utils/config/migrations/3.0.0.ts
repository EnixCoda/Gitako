import { storageHelper } from 'utils/storageHelper'
import { Migration, onConfigOutdated } from '.'

export const migration: Migration = {
  version: '3.0.0',
  async migrate(version) {
    // disable copy snippet button for github.com
    type ConfigBeforeMigrate = {
      copySnippetButton: boolean
    }
    type ConfigAfterMigrate = {
      copySnippetButton: boolean
    }

    onConfigOutdated(version, async configs => {
      const key = 'platform_github.com'
      const config = configs[key]
      if (typeof config === 'object' && config !== null && 'copySnippetButton' in config) {
        const configBeforeMigrate: ConfigBeforeMigrate = config
        const { copySnippetButton, ...rest } = configBeforeMigrate
        if (copySnippetButton) {
          const configAfterMigrate: ConfigAfterMigrate = {
            ...rest,
            copySnippetButton: false,
          }
          await storageHelper.set({
            [key]: configAfterMigrate,
          })
        }
      }
    })
  },
}
