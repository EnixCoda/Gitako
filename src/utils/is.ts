type Primitive = string | number | boolean | null | undefined

const equal = {
  type: (a: unknown, b: unknown) => getType(a) === getType(b),
  unknown(a: unknown, b: unknown) {
    const type = getType(a)
    if (!equal.primitive(type, getType(b))) return false
    switch (type) {
      case 'array':
        if (!equal.array(a as unknown[], b as unknown[])) return false
        break
      case 'object':
        if (!equal.object(a as Record<string, unknown>, b as Record<string, unknown>)) return false
        break
      case 'date':
      case 'function':
      case 'regexp':
      case 'symbol':
        if (!equal.primitive(`${a}`, `${b}`)) return false
        break
      default:
        if (!equal.primitive(a as Primitive, b as Primitive)) return false
    }
    return true
  },
  primitive: <T extends Primitive>(a: T, b: T) => a === b,
  array(a: unknown[], b: unknown[]) {
    if (a.length !== b.length) return false
    const length = a.length
    for (let i = 0; i < length; i++) if (!equal.unknown(a[i], b[i])) return false
    return true
  },
  object(a: Record<string, unknown>, b: Record<string, unknown>) {
    if (Object.keys(a).length !== Object.keys(b).length) return false
  },
}

const shallowEqual = {
  array(a: unknown[], b: unknown[]) {
    if (a.length !== b.length) return false
    const length = a.length
    for (let i = 0; i < length; i++) if (a[i] !== b[i]) return false
    return true
  },
}

function getType(a: unknown) {
  switch (typeof a) {
    case 'boolean':
      return 'boolean'
    case 'function':
      return 'function'
    case 'number':
      return 'number'
    case 'string':
      return 'string'
    case 'symbol':
      return 'symbol'
    case 'undefined':
      return 'undefined'
    case 'object':
      if (a === null) return 'null'
      if (Array.isArray(a)) return 'array'
      if (a instanceof Date) return 'date'
      if (a instanceof RegExp) return 'regexp'
      return 'object'
    default:
      return 'unknown'
  }
}

export const is = {
  equal,
  shallowEqual,
  boolean: (d: unknown): d is boolean => typeof d === 'boolean',
  number: (d: unknown): d is number => typeof d === 'number',
  string: (d: unknown): d is string => typeof d === 'string',
  not: {
    undefined: <T>(d: T | undefined): d is T => d !== undefined,
    null: <T>(d: T | null): d is T => d !== null,
    true: <T>(d: T | true): d is T => d !== true,
    false: <T>(d: T | false): d is T => d !== false,
    number: <T>(d: T | number): d is T => typeof d !== 'number',
    string: <T>(d: T | string): d is T => typeof d !== 'string',
  },
  JSON: {
    object(d: unknown): d is JSONObject {
      return (typeof d === 'object' && d && !Array.isArray(d)) || false
    },
    array(d: unknown): d is JSONArray {
      return Array.isArray(d)
    },
    plain(d: unknown): d is JSONPrimitive {
      return d === null || d === 'undefined' || is.boolean(d) || is.number(d) || is.string(d)
    },
  },
}
