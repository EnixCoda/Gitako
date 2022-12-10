import { storageHelper } from 'utils/storageHelper'
import { Migration, onConfigOutdated } from '.'

export const migration: Migration = {
  version: '3.5.0',
  async migrate(version) {
    // disable copy snippet button for github.com
    type ConfigBeforeMigrate = {
      copyFileButton: boolean
    }
    type ConfigAfterMigrate = {
      copyFileButton: false
    }

    await onConfigOutdated(version, async configs => {
      const key = 'platform_github.com'
      const config = configs[key]
      if (typeof config === 'object' && config !== null && 'copyFileButton' in config) {
        const configBeforeMigrate = config as ConfigBeforeMigrate
        const { copyFileButton, ...rest } = configBeforeMigrate
        if (copyFileButton) {
          const configAfterMigrate: ConfigAfterMigrate = {
            ...rest,
            copyFileButton: false,
          }
          await storageHelper.set({
            [key]: configAfterMigrate,
          })
        }
      }
    })
  },
}
