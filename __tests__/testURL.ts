// string template function, take input URL string and add a search param
// example: url`http://g.com` => `http://g.com?k1=v1`
export function testURL(strings: TemplateStringsArray, ...values: unknown[]) {
  const raw = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
  const url = new URL(raw, 'http://localhost')
  url.searchParams.append(
    'gitako-config-accessToken',
    JSON.stringify(process.env.GITAKO_ACCESS_TOKEN ?? 'fallback_token'),
  )
  return url.href
}
