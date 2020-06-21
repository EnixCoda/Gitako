import { TextInput } from '@primer/components'
import { SearchIcon } from '@primer/octicons-react'
import * as React from 'react'
import { cx } from 'utils/cx'
import { isValidRegexpSource } from 'utils/general'

type Props = {
  onSearch: (searchKey: string) => void
  onFocus: React.FocusEventHandler
  searchKey: string
}

export function SearchBar({ onSearch, onFocus, searchKey }: Props) {
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
          error: !isValidRegexpSource(searchKey),
        })}
        aria-label="search files"
        placeholder="Search files (use RegExp)"
        onChange={({ target: { value } }) => onSearch(value)}
        value={searchKey}
      />
    </div>
  )
}
