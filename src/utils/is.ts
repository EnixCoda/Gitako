export const is = {
  boolean: (d: unknown): d is boolean => typeof d === 'boolean',
  number: (d: unknown): d is number => typeof d === 'number',
  string: (d: unknown): d is string => typeof d === 'string',
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
