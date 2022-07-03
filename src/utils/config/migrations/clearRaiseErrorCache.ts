import { storageHelper } from 'utils/storageHelper'
import { Migration, onConfigOutdated } from '.'
import { version } from '../../../../package.json'

// Run every time a new version is released.
export const migration: Migration = {
  version,
  async migrate(version) {
    await onConfigOutdated(version, async () => {
      await storageHelper.set({ raiseErrorCache: [] })
    })
  },
}
