import { TextInput, TextInputProps } from '@primer/components'
import { SearchIcon } from '@primer/octicons-react'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { cx } from 'utils/cx'
import { isValidRegexpSource } from 'utils/general'
import { SearchMode } from './searchModes'

type Props = {
  value: string
  onSearch: (searchKey: string, searchMode: SearchMode) => void
} & Required<Pick<TextInputProps, 'onFocus'>>

export function SearchBar({ onSearch, onFocus, value }: Props) {
  const configs = useConfigs()
  const { searchMode } = configs.value

  return (
    <div className={'search-input-wrapper'}>
      <TextInput
        backgroundColor="white"
        icon={SearchIcon as any}
        onFocus={e => {
          onFocus(e)
          e.target.select()
        }}
        tabIndex={0}
        className={cx('search-input', {
          error: searchMode === 'regex' && !isValidRegexpSource(value),
        })}
        aria-label="search files"
        placeholder={`Search files`}
        onChange={({ target: { value } }) => onSearch(value, searchMode)}
        value={value}
      />
      <div className={`actions`}>
        <button
          className={`toggle-mode`}
          title="Toggle search mode"
          onClick={() => {
            const newMode = searchMode === 'regex' ? 'fuzzy' : 'regex'
            configs.onChange({
              searchMode: newMode,
            })
            onSearch(value, newMode)
          }}
          aria-label="Toggle search mode"
        >
          {searchMode === 'regex' ? '.*' : 'path'}
        </button>
      </div>
    </div>
  )
}
