import preact from 'preact'
/** @jsx preact.h */

export default function SearchBar({ onSearchKeyChange }) {
  return (
    <div className={'search-input-wrapper'}>
      <input
        tabIndex={0}
        className="form-control search-input"
        aria-label="search files"
        placeholder="Search files (regexp)"
        type="text"
        onInput={onSearchKeyChange}
      />
    </div>
  )
}
