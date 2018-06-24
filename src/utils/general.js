
/**
 * @param {Object} source
 * @param {Object|Array} keys
 * @returns
 */
export function pick(source, keys) {
  if (keys && typeof keys === 'object') {
    return (
      Array.isArray(keys) ? keys : Object.keys(keys)
    ).reduce((copy, key) => {
      copy[key] = source[key]
      return copy
    }, {})
  }
  return {}
}
