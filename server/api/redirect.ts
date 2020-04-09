import { NowRequest, NowResponse } from '@now/node'
import { sendRejection } from './index'

export default async function handleRedirect(request: NowRequest, response: NowResponse) {
  const { redirect, ...params } = request.query
  if (typeof redirect !== 'string' || !redirect) {
    return sendRejection(response)
  }

  const url = new URL(redirect)

  for (const key of Object.keys(params)) {
    const value = params[key]
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, v)
    } else url.searchParams.append(key, value)
  }

  response.writeHead(307, { Location: url.href })
  response.end()
}
