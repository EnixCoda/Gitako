import fetch from 'node-fetch'
import { createCodeHandler } from '.'

const { GITEE_OAUTH_CLIENT_ID, GITEE_OAUTH_CLIENT_SECRET } = process.env

async function oauth(code: string) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: GITEE_OAUTH_CLIENT_ID,
    client_secret: GITEE_OAUTH_CLIENT_SECRET,
    redirect_uri: 'https://gitako.now.sh/redirect/',
  })

  const res = await fetch('https://gitee.com/oauth/token?' + params.toString(), {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    redirect: 'follow',
    method: 'post',
  })
  return res.json()
}

export default createCodeHandler(oauth)
