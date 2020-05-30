import { NowRequest, NowResponse } from '@now/node'

export function createCodeHandler(oauthHandler: (code: string) => string | Promise<string>) {
  return async function handleCode(request: NowRequest, response: NowResponse) {
    const { code } = request.query
    try {
      setCORSHeaders(response)
      if (!request.method || request.method.toLowerCase() !== 'post') {
        return sendRejection(response, 405)
      }
      if (!code || typeof code !== 'string') {
        return sendRejection(response, 403)
      }
      const accessToken = await oauthHandler(code)
      writeJSON(response, { accessToken })
      response.end()
    } catch (err) {
      return sendRejection(response, 400, err instanceof Error ? err.message : '')
    }
  }
}

function setCORSHeaders(response: NowResponse) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'POST')
}

export function sendRejection(response: NowResponse, status = 400, content?: string) {
  response.writeHead(status)
  response.end(content)
}

function writeJSON(response: NowResponse, data: unknown) {
  response.setHeader('Content-Type', 'application/json')
  response.write(JSON.stringify(data))
}
