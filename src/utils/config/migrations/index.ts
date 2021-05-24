import { storageHelper } from 'utils/storageHelper'
import { Storage } from '../../storageHelper'
import { migration as v1v0v1 } from './1.0.1'
import { migration as v1v3v4 } from './1.3.4'
import { migration as v2v6v0 } from './2.6.0'

export type Migration = {
  version: string
  migrate(version: Migration['version']): Async<void>
}

export async function migrateConfig() {
  const migrations: Migration[] = [v1v0v1, v1v3v4, v2v6v0]

  for (const { version, migrate } of migrations) {
    await migrate(version)
  }
}
