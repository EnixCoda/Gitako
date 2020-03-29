import { raiseError } from 'analytics'
import { GITEE_OAUTH } from 'env'
import { errors } from 'platforms'

function apiRateLimitExceeded(content: any /* safe any */) {
  return content?.['documentation_url'] === 'https://developer.github.com/v3/#rate-limiting'
}

function isEmptyProject(content: any /* safe any */) {
  return content?.['message'] === 'Git Repository is empty.'
}

function isBlockedProject(content: any /* safe any */) {
  return content?.['message'] === 'Repository access blocked'
}

async function request(
  url: string,
  {
    accessToken,
  }: {
    accessToken?: string
  } = {},
) {
  const headers = {} as HeadersInit & {
    Authorization?: string
  }
  if (accessToken) {
    headers.Authorization = `token ${accessToken}`
  }
  const res = await fetch(url, { headers })
  const contentType = res.headers.get('Content-Type') || res.headers.get('content-type')
  if (!contentType) {
    throw new Error(`Response has no content type`)
  } else if (!contentType.includes('application/json')) {
    throw new Error(`Response content type is ${contentType}`)
  }
  // About res.ok:
  // True if res.status between 200~299
  // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
  if (res.ok) {
    return res.json()
  } else {
    debugger
    if (res.status === 404 || res.status === 401) throw new Error(errors.NOT_FOUND)
    else if (res.status === 500) throw new Error(errors.SERVER_FAULT)
    else {
      const content = await res.json()
      if (apiRateLimitExceeded(content)) throw new Error(errors.API_RATE_LIMIT)
      if (isEmptyProject(content)) throw new Error(errors.EMPTY_PROJECT)
      if (isBlockedProject(content)) throw new Error(errors.BLOCKED_PROJECT)
      // Unknown type of error, report it!
      raiseError(new Error(res.statusText))
      throw new Error(content && content.message)
    }
  }
}

export async function getRepoMeta(
  userName: string,
  repoName: string,
  accessToken?: string,
): Promise<GiteeAPI.MetaData> {
  const url = `https://gitee.com/api/v5/repos/${encodeURIComponent(userName)}/${encodeURIComponent(
    repoName,
  )}`
  return await request(url, { accessToken })
}

export async function getTreeData(
  userName: string,
  repoName: string,
  branchName: string,
  accessToken?: string,
): Promise<GiteeAPI.TreeData> {
  const url = `https://gitee.com/api/v5/repos/${encodeURIComponent(userName)}/${encodeURIComponent(
    repoName,
  )}/git/trees/${encodeURIComponent(branchName)}?recursive=1`
  return await request(url, { accessToken })
}

export async function getBlobData(
  userName: string,
  repoName: string,
  sha: string,
  accessToken?: string,
): Promise<GiteeAPI.BlobData> {
  const url = `https://gitee.com/api/v5/repos/${encodeURIComponent(userName)}/${encodeURIComponent(
    repoName,
  )}/git/blobs/${encodeURIComponent(sha)}`
  return await request(url, { accessToken })
}

export async function OAuth(code: string): Promise<GiteeAPI.OAuth> {
  if (!GITEE_OAUTH.clientId || !GITEE_OAUTH.clientSecret)
    throw new Error(`No Gitee OAuth credientials`)
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: GITEE_OAUTH.clientId,
    client_secret: GITEE_OAUTH.clientSecret,
  })

  const res = await fetch('https://gitee.com/oauth/token?' + params.toString(), {
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    method: 'post',
  })
  return res.json()
}
