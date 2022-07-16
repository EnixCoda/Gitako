import { raiseError } from 'analytics'
import { errors } from 'platforms'
import { is } from 'utils/is'
import { gitakoServiceHost } from 'utils/networkService'

function isEmptyProject(content: JSONValue) {
  return is.JSON.object(content) && content?.['message'] === 'Git Repository is empty.'
}

function isBlockedProject(content: JSONValue) {
  return is.JSON.object(content) && content?.['message'] === 'Repository access blocked'
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
  try {
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
      if (res.status === 404 || res.status === 401) throw new Error(errors.NOT_FOUND)
      else if (res.status === 500) throw new Error(errors.SERVER_FAULT)
      else {
        const content = await res.json()
        if (isEmptyProject(content)) throw new Error(errors.EMPTY_PROJECT)
        if (isBlockedProject(content)) throw new Error(errors.BLOCKED_PROJECT)
        // Unknown type of error, report it!
        raiseError(new Error(res.statusText))
        throw new Error(content && content.message)
      }
    }
  } catch (err) {
    throw new Error(errors.CONNECTION_BLOCKED)
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

export async function OAuth(code: string): Promise<string | null> {
  const endpoint = `https://${gitakoServiceHost}/oauth/gitee?${new URLSearchParams({ code })}`
  const res = await fetch(endpoint, {
    method: 'post',
  })

  if (res.ok) {
    const body = await res.json()
    const accessToken = body?.accessToken
    if (typeof accessToken === 'string') return accessToken
  }
  return null
}
