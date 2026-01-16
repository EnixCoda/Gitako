// string template function, take input URL string and add a search param
// example: url`http://g.com` => `http://g.com?k1="json-value"`
export function testURL(strings: TemplateStringsArray, ...values: unknown[]) {
  const raw = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
  const GITAKO_ACCESS_TOKEN = process.env.GITAKO_ACCESS_TOKEN
  if (!GITAKO_ACCESS_TOKEN) return raw

  const url = new URL(raw, 'http://localhost')
  url.searchParams.set('gitako-config-accessToken', JSON.stringify(GITAKO_ACCESS_TOKEN))
  return url.href
}
