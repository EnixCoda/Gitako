import * as React from 'react'

type Props = {
  onSearchKeyChange: React.FormEventHandler
  onFocus: React.FocusEventHandler
  searchKey: string
}

export default function SearchBar({ onSearchKeyChange, onFocus, searchKey }: Props) {
  return (
    <div className={'search-input-wrapper'}>
      <input
        onFocus={onFocus}
        tabIndex={0}
        className="form-control search-input"
        aria-label="search files"
        placeholder="Search files (RegEx)"
        type="text"
        onChange={onSearchKeyChange}
        value={searchKey}
      />
    </div>
  )
}
