const keyCodeArray = [
  ...'1234567890abcdefghijklmnopqrstuvwxyz'.split(''),
  /* the key that's located left to the 1 key in Mac
     keybords in multiple Engligh laybouts (Backquote) */
  ...'`§'.split(''),
  ..."[]\\;',./".split(''),
  'alt',
  'shift',
  'ctrl',
  'meta',
]
const validKeyCodes = new Set(keyCodeArray)

function isValidKey(key: string) {
  return validKeyCodes.has(key)
}

/**
 * parse a string representation of key combination
 *
 * @param {string} keysString
 * @returns {string}
 */
function parse(keysString: string) {
  return (
    keysString
      .split('+')
      /* when trying to set a combination includes '+',
    input should be 'shift + =' instead of 'shift + +',
    thus a valid key string won't contain '++' */
      .map(_ => _.trim().toLowerCase())
      .filter(isValidKey)
      .sort((a, b) => keyCodeArray.indexOf(b) - keyCodeArray.indexOf(a))
      .join('+')
  )
}

function parseKeyCode(code: string) {
  return code.toLowerCase().replace(/^control$/, 'ctrl')
}

export function parseEvent(e: KeyboardEvent | React.KeyboardEvent) {
  const { altKey: alt, shiftKey: shift, metaKey: meta, ctrlKey: ctrl } = e
  try {
    const code = parseKeyCode(e.key)
    const keys = { meta, ctrl, shift, alt, [code]: true }
    const combination = parse(
      Object.entries(keys)
        .filter(([key, pressed]) => pressed)
        .map(([key, pressed]) => key)
        .join('+'),
    )
    return combination
  } catch (err) {
    const serializedKeyData = JSON.stringify({
      keyCode: e.keyCode,
      key: e.key,
      charCode: e.charCode,
    })
    throw new Error(`Error parse keyboard event: ${serializedKeyData}`)
  }
}
