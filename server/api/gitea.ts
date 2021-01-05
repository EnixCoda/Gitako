import fetch from 'node-fetch'
import { createCodeHandler } from './utils'

const { GITEA_OAUTH_CLIENT_ID = '', GITEA_OAUTH_CLIENT_SECRET = '' } = process.env

async function oauth(code: string) {
  const res = await fetch('https://gitea.com/login/oauth/access_token', {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    redirect: 'follow',
    method: 'post',
    body: JSON.stringify({
      code,
      client_id: GITEA_OAUTH_CLIENT_ID,
      client_secret: GITEA_OAUTH_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: encodeURIComponent('https://gitako.now.sh'),
    }),
  })

  const body = await res.json()
  const {
    access_token: accessToken,
    token_type: tokenType,
    expires_in: expiresIn,
    refresh_token: refreshToken,
  } = body
  if (!accessToken || !(typeof accessToken === 'string')) {
    throw new Error(`Cannot resolve response: '${JSON.stringify(res)}'`)
  }
  return accessToken
}

export default createCodeHandler(oauth)
