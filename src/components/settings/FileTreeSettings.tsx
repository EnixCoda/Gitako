import { wikiLinks } from 'components/settings/SettingsBar'
import { SimpleConfigFieldCheckbox } from 'components/settings/SimpleConfigField/Checkbox'
import * as React from 'react'
import { Config } from 'utils/config/helper'
import { Option } from '../Inputs/SelectInput'
import { SettingsSection } from './SettingsSection'
import { SimpleConfigFieldSelect } from './SimpleConfigField/SelectInput'

const iconOptions: Option<Config['icons']>[] = [
  {
    key: 'rich',
    value: 'rich',
    label: `VSCode icons`,
  },
  {
    key: 'dim',
    value: 'dim',
    label: `VSCode icons (single color)`,
  },
  {
    key: 'native',
    value: 'native',
    label: `GitHub icons`,
  },
]

const recursiveToggleFolderOptions: Option<Config['recursiveToggleFolder']>[] = [
  {
    key: 'shift',
    value: 'shift',
    label: `⇧(shift)`,
  },
  {
    key: 'alt',
    value: 'alt',
    label: `⌥(alt)`,
  },
]

export function FileTreeSettings() {
  return (
    <SettingsSection title={'File Tree'}>
      <SimpleConfigFieldSelect
        field={{
          key: 'recursiveToggleFolder',
          label: 'Toggle folders recursively while holding',
        }}
        options={recursiveToggleFolderOptions}
      />
      <SimpleConfigFieldSelect
        field={{
          key: 'icons',
          label: 'Icons',
        }}
        options={iconOptions}
      />
      <SimpleConfigFieldCheckbox
        field={{
          key: 'compressSingletonFolder',
          label: 'Compress singleton folder',
          wikiLink: wikiLinks.compressSingletonFolder,
          tooltip: 'Merge folders and their only child folder to make UI more compact.',
        }}
      />
      <SimpleConfigFieldCheckbox
        field={{
          key: 'restoreExpandedFolders',
          label: 'Restore expanded folders',
          tooltip: 'Folders will be expanded again when clear search input',
        }}
      />
      <SimpleConfigFieldCheckbox
        field={{
          key: 'commentToggle',
          label: 'Show PR file comments',
          tooltip: 'Show number of comments next to file names in Pull Requests.',
        }}
      />
      <SimpleConfigFieldCheckbox
        field={{
          key: 'compactFileTree',
          label: 'Compact file tree layout',
          tooltip: 'View file tree structures more effectively.',
        }}
      />
    </SettingsSection>
  )
}
