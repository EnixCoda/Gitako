const keyCodeArray = [
  ...'1234567890abcdefghijklmnopqrstuvwxyz'.split(''),
  ...'`[]\\;\',./'.split(''),
  'alt',
  'shift',
  'ctrl',
  'meta',
]
const validKeyCodes = new Set(keyCodeArray)

function isValidKey(key) {
  return validKeyCodes.has(key)
}

/**
 * parse a string representation of key combination
 *
 * @param {string} keysString
 * @returns {string}
 */
function parse(keysString) {
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

function parseKeyCode(code) {
  return code
    .toLowerCase()
    .replace(/(left|right)$/, '')
    .replace(/^control$/, 'ctrl')
    .replace(/^digit/, '')
    .replace(/^key/, '')
}

function parseEvent(e) {
  const { altKey: alt, shiftKey: shift, metaKey: meta, ctrlKey: ctrl } = e
  const code = parseKeyCode(e.code)
  const keys = { meta, ctrl, shift, alt, [code]: true }
  const combination = parse(
    Object.entries(keys)
      .filter(([key, pressed]) => pressed)
      .map(([key, pressed]) => key)
      .join('+')
  )
  return combination
}

export default {
  parseEvent,
}
