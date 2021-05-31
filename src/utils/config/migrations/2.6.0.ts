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
        if (
          typeof configs[key] === 'object' &&
          configs[key] !== null &&
          'access_token' in configs[key]
        ) {
          const configBeforeMigrate: ConfigBeforeMigrate = configs[key]
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
