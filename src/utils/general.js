function shallowEqual(a, b) {
  if (a === b) return true
  if (typeof a === 'object' && typeof a === typeof b) {
    if (a === null || b === null) return false
    for (const key in a) {
      if (a[key] !== b[key]) return false
    }
    for (const key in b) {
      if (!Object.prototype.hasOwnProperty.call(a, key)) return false
    }
    return true
  }
  return false
}

export default {
  shallowEqual,
}
