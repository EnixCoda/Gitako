export const gitakoServiceHost = 'gitako.enix.one'

export const responseBodyResolvers = {
  asIs: (response: Response) => response,
  json(response: Response) {
    const contentType = response.headers.get('Content-Type') || response.headers.get('content-type')
    if (contentType?.includes('application/json')) return response.json()
    throw new Error(`Response content type is "${contentType}"`)
  },
}

export function transformURLSearchParam(source: Record<string, unknown>) {
  return Object.entries(source).reduce((param, [key, value]) => {
    if (Array.isArray(value))
      for (const i of value) param.append(key, stringifyValueForURLSearchParam(i))
    else param.append(key, stringifyValueForURLSearchParam(value))

    return param
  }, new URLSearchParams())
}

export function stringifyValueForURLSearchParam(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'boolean') return `${value}`
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return ''
    return `${value}`
  }
  if (typeof value === null) return 'null'

  return ''
}
