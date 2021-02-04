import { Label, TextInput, TextInputProps } from '@primer/components'
import { SearchIcon } from '@primer/octicons-react'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { cx } from 'utils/cx'
import { isValidRegexpSource } from 'utils/general'

type Props = {
  value: string
  onSearch: (searchKey: string) => void
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
        placeholder={`Search files (${searchMode === 'regex' ? 'use RegExp' : 'match path'})`}
        onChange={({ target: { value } }) => onSearch(value)}
        value={value}
      />
      <div className={`actions`}>
        <Label
          className={`toggle-mode`}
          variant="small"
          outline
          title="Toggle search mode"
          onClick={() => {
            configs.onChange({
              searchMode: searchMode === 'regex' ? 'fuzzy' : 'regex',
            })
            onSearch(value)
          }}
          aria-label="Toggle search mode"
        >
          {searchMode === 'regex' ? '.*?' : 'path'}
        </Label>
      </div>
    </div>
  )
}
