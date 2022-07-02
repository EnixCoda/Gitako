import { storageHelper, storageKeys } from 'utils/storageHelper'
import { version } from '../../../../package.json'
import { Storage } from '../../storageHelper'
import { migration as v1v0v1 } from './1.0.1'
import { migration as v1v3v4 } from './1.3.4'
import { migration as v2v6v0 } from './2.6.0'
import { migration as v3v0v0 } from './3.0.0'
import { migration as v3v5v0 } from './3.5.0'
import { migration as clearRaiseErrorCache } from './clearRaiseErrorCache'

export type Migration = {
  version: string
  migrate(version: Migration['version']): Async<void>
}

export async function migrateConfig() {
  const migrations: Migration[] = [v1v0v1, v1v3v4, v2v6v0, v3v0v0, v3v5v0]
  migrations.push(clearRaiseErrorCache) // Make sure this is run after other version-specific migrations

  for (const { version, migrate } of migrations) {
    await migrate(version)
  }

  await storageHelper.set({ [storageKeys.configVersion]: version })
}

export async function onConfigOutdated<T extends { [key: string]: any }>(
  migrationConfigVersion: string,
  runIfOutdated: (config: T) => Async<void>,
) {
  const config = await storageHelper.get<Storage>()

  if (config) {
    const {
      [storageKeys.configVersion]: savedConfigVersion,
      [storageKeys.raiseErrorCache]: __,
      ...restConfig
    } = config
    if (savedConfigVersion < migrationConfigVersion) {
      await runIfOutdated(restConfig as T)
    }
  }
}
