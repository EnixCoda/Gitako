import { Box, Button, FormControl, TextInput } from '@primer/react'
import * as React from 'react'
import { useUpdateEffect } from 'react-use'
import { cancelEvent } from 'utils/DOMHelper'
import { friendlyFormatShortcut, noop } from 'utils/general'
import { useStateIO } from 'utils/hooks/useStateIO'
import * as keyHelper from 'utils/keyHelper'

type Props = IO<string | undefined> & {
  label: React.ReactNode
}

export function KeyboardShortcutSetting({ label, value, onChange }: Props) {
  const $focused = useStateIO(false)
  const $shortcut = useStateIO(value)
  useUpdateEffect(() => $shortcut.onChange(value), [value])

  const id = React.useMemo(() => Math.random() + '', [])

  return (
    <FormControl>
      <FormControl.Label htmlFor={id}>{label}</FormControl.Label>
      <Box display="inline-flex" width="100%">
        <TextInput
          id={id}
          sx={{ marginRight: 1, flex: 1 }}
          onFocus={() => $focused.onChange(true)}
          onBlur={() => $focused.onChange(false)}
          placeholder={$focused.value ? 'Press key combination' : 'Click here to set'}
          value={friendlyFormatShortcut($shortcut.value)}
          onChange={noop}
          onKeyDown={e => {
            switch (e.key) {
              case 'Esc':
              case 'Tab':
                return
              case 'Delete':
              case 'Backspace':
                // Clear shortcut with backspace
                $shortcut.onChange(undefined)
                return
              default:
                cancelEvent(e)
            }
            $shortcut.onChange(keyHelper.parseEvent(e))
          }}
        />
        <Button
          disabled={!value && !$shortcut.value}
          onClick={() => onChange(value === $shortcut.value ? undefined : $shortcut.value)}
        >
          {/* Show clear when shortcut equal to input value */}
          {value === $shortcut.value ? 'Clear' : 'Save'}
        </Button>
      </Box>
    </FormControl>
  )
}
