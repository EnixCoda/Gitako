import { SearchIcon } from '@primer/octicons-react'
import { TextInput, TextInputProps } from '@primer/react'
import { useConfigs } from 'containers/ConfigsContext'
import * as React from 'react'
import { formatWithShortcut, isValidRegexpSource } from 'utils/general'
import { useFocusOnPendingTarget } from './FocusTarget'
import { SearchMode } from './searchModes'

type Props = {
  value: string
  onSearch: (searchKey: string, searchMode: SearchMode) => void
} & Required<Pick<TextInputProps, 'onFocus'>>

export function SearchBar({ onSearch, onFocus, value }: Props) {
  const ref = React.useRef<HTMLInputElement | null>(null)
  useFocusOnPendingTarget(
    'search',
    React.useCallback(() => ref.current?.focus(), []),
  )

  const configs = useConfigs()
  const { searchMode, focusSearchInputShortcut } = configs.value

  const toggleButtonDescription =
    searchMode === 'regex'
      ? 'Match file name with regular expression.'
      : `Match file path sequence with plain input.`

  const validationStatus = React.useMemo(
    () => (searchMode === 'regex' && !isValidRegexpSource(value) ? 'error' : undefined),
    [value, searchMode],
  )

  return (
    <TextInput
      ref={ref}
      leadingVisual={SearchIcon}
      onFocus={e => {
        onFocus(e)
        e.target.select()
      }}
      block
      sx={{ borderRadius: 0 }}
      className={'search-input'}
      aria-label="search files"
      placeholder={formatWithShortcut(`Search files`, focusSearchInputShortcut)}
      onChange={({ target: { value } }) => onSearch(value, searchMode)}
      value={value}
      validationStatus={validationStatus}
      trailingAction={
        <TextInput.Action
          aria-label={toggleButtonDescription}
          sx={{ color: 'fg.subtle' }}
          onClick={() => {
            const newMode = searchMode === 'regex' ? 'fuzzy' : 'regex'
            configs.onChange({
              searchMode: newMode,
            })
            // Skip search if no input to prevent resetting folder expansions
            if (value) onSearch(value, newMode)
          }}
        >
          {searchMode === 'regex' ? '.*$' : 'a/b'}
        </TextInput.Action>
      }
    />
  )
}
