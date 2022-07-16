import { storageHelper } from 'utils/storageHelper'
import { Migration, onConfigOutdated } from '.'

export const migration: Migration = {
  version: '2.6.0',
  async migrate(version) {
    type ConfigBeforeMigrate = {
      access_token?: string
    }
    type ConfigAfterMigrate = {
      accessToken?: string
    }

    await onConfigOutdated(version, async configs => {
      for (const key of Object.keys(configs)) {
        const target = configs[key]
        if (typeof target === 'object' && target !== null && 'access_token' in target) {
          const configBeforeMigrate: ConfigBeforeMigrate = target
          const { access_token: accessToken, ...rest } = configBeforeMigrate
          const configAfterMigrate: ConfigAfterMigrate = {
            ...rest,
            accessToken,
          }
          await storageHelper.set({
            [key]: configAfterMigrate,
          })
        }
      }
    })
  },
}
