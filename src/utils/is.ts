export const is = {
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
