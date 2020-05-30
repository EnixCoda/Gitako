import { NowRequest, NowResponse } from '@now/node'

export default function (request: NowRequest, response: NowResponse) {
  response.writeHead(302, {
    Location: 'https://github.com/EnixCoda/Gitako',
  })
  response.end()
}
