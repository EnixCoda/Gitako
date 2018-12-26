import React from 'react'

export default function SearchBar({ onSearchKeyChange, onFocus }) {
  return (
    <div className={'search-input-wrapper'}>
      <input
        onFocus={onFocus}
        tabIndex={0}
        className="form-control search-input"
        aria-label="search files"
        placeholder="Search files (RegEx)"
        type="text"
        onInput={onSearchKeyChange}
      />
    </div>
  )
}
