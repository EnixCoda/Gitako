import { storageHelper } from 'utils/storageHelper'
import { Migration } from '.'
import { Storage } from '../../storageHelper'
import { VersionedConfig } from '../helper'

export const migration: Migration = {
  version: '2.6.0',
  async migrate(version) {
    type ConfigBeforeMigrate = {
      access_token?: string
    }
    type ConfigAfterMigrate = {
      accessToken?: string
    }

    const config = await storageHelper.get<VersionedConfig<ConfigBeforeMigrate> & Storage>()
    if (config && config.configVersion < version) {
      const { configVersion, ...restConfig } = config
      for (const key of Object.keys(restConfig)) {
        if (
          typeof restConfig[key] === 'object' &&
          restConfig[key] &&
          'access_token' in restConfig[key]
        ) {
          const config: ConfigBeforeMigrate = restConfig[key]
          const { access_token: accessToken, ...legacy } = config
          const migrated: ConfigAfterMigrate = {
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
}
