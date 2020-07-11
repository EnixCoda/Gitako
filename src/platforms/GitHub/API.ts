import { errors } from 'platforms'
import { isEnterprise } from '.'

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

  let res: Response
  try {
    res = await fetch(url, { headers })
  } catch (err) {
    throw new Error(errors.CONNECTION_BLOCKED)
  }

  const contentType = res.headers.get('Content-Type') || res.headers.get('content-type')
  const isJson = contentType?.includes('application/json')
  // About res.ok:
  // True if res.status between 200~299
  // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
  if (res.ok) {
    if (isJson) return res.json()
    throw new Error(`Response content type is "${contentType}"`)
  } else {
    if (res.status === 404 || res.status === 401) throw new Error(errors.NOT_FOUND)
    else if (res.status === 403) throw new Error(errors.API_RATE_LIMIT)
    else if (res.status === 500) throw new Error(errors.SERVER_FAULT)
    else if (isJson) {
      const content = await res.json()
      if (apiRateLimitExceeded(content)) throw new Error(errors.API_RATE_LIMIT)
      if (isEmptyProject(content)) throw new Error(errors.EMPTY_PROJECT)
      if (isBlockedProject(content)) throw new Error(errors.BLOCKED_PROJECT)
      throw new Error(`Unknown message content "${content?.message}"`)
    } else {
      throw new Error(`Response content type is "${contentType}"`)
    }
  }
}

const API_ENDPOINT = isEnterprise() ? `${window.location.host}/api/v3` : 'api.github.com'

export async function getRepoMeta(
  userName: string,
  repoName: string,
  accessToken?: string,
): Promise<GitHubAPI.MetaData> {
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}`
  return await request(url, { accessToken })
}

export async function getTreeData(
  userName: string,
  repoName: string,
  branchName: string,
  accessToken?: string,
): Promise<GitHubAPI.TreeData> {
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}/git/trees/${branchName}?recursive=1`
  return await request(url, { accessToken })
}

export async function getPullData(
  userName: string,
  repoName: string,
  pullId: string,
  accessToken?: string,
): Promise<GitHubAPI.PullData> {
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}/pulls/${pullId}`
  return await request(url, { accessToken })
}

export async function getPullTreeData(
  userName: string,
  repoName: string,
  pullId: string,
  page: number,
  accessToken?: string,
): Promise<GitHubAPI.PullTreeData> {
  const search = new URLSearchParams({ page: page.toString() })
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}/pulls/${pullId}/files?${search}`
  return await request(url, { accessToken })
}

export async function getPullPageDocument(
  userName: string,
  repoName: string,
  pullId: string, // not used
  baseSHA: string,
  headSHA: string,
): Promise<Document> {
  const search = new URLSearchParams(window.location.search)
  search.set('sha1', baseSHA)
  search.set('sha2', headSHA)
  const url = `https://${window.location.host}/${userName}/${repoName}/diffs?${search}`
  return new DOMParser().parseFromString(await (await fetch(url)).text(), 'text/html')
}

export async function getBlobData(
  userName: string,
  repoName: string,
  sha: string,
  accessToken?: string,
): Promise<GitHubAPI.BlobData> {
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}/git/blobs/${sha}`
  return await request(url, { accessToken })
}

export async function OAuth(code: string): Promise<string | null> {
  try {
    const endpoint = `https://gitako.now.sh/oauth/github?`
    const res = await fetch(endpoint + new URLSearchParams({ code }).toString(), {
      method: 'post',
    })
    if (res.ok) {
      const body = await res.json()
      const accessToken = body?.accessToken
      if (typeof accessToken === 'string') return accessToken
    }
    return null
  } catch (err) {
    return null
  }
}
