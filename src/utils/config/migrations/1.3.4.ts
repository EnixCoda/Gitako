import { is } from 'utils/is'
import { storageHelper } from 'utils/storageHelper'
import { Migration } from '.'
import { Storage } from '../../storageHelper'
import { Config, VersionedConfig } from '../helper'

export const migration: Migration = {
  version: '1.3.4',
  async migrate(version) {
    const config: JSONObject | void = await storageHelper.get<VersionedConfig<Config> & Storage>([
      'configVersion',
      'platform_undefined',
      'platform_GitHub',
      'platform_github.com',
    ])
    if (
      config &&
      'configVersion' in config &&
      is.string(config.configVersion) &&
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
}
