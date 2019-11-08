import * as React from 'react'
import { cx } from 'utils/cx'

type Props = {
  onSearch: (searchKey: string) => void
  onFocus: React.FocusEventHandler
  searchKey: string
}

export function SearchBar({ onSearch, onFocus, searchKey }: Props) {
  return (
    <div className={'search-input-wrapper'}>
      <input
        onFocus={onFocus}
        tabIndex={0}
        className={cx('form-control search-input', {
          error: !isValidRegexpSource(searchKey),
        })}
        aria-label="search files"
        placeholder="Search files (use RegExp)"
        type="text"
        onChange={({ target: { value } }) => onSearch(value)}
        value={searchKey}
      />
    </div>
  )
}

function isValidRegexpSource(source: string) {
  try {
    new RegExp(source)
    return true
  } catch (err) {
    return false
  }
}
