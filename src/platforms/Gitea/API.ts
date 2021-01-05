import { raiseError } from 'analytics'
import { errors } from 'platforms'

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
}

export const API_ENDPOINT = `${window.location.host}/api/v1`

export async function getRepoMeta(
  userName: string,
  repoName: string,
  accessToken?: string,
): Promise<GiteaAPI.MetaData> {
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}`
  return await request(url, { accessToken })
}

export async function getTreeData(
  userName: string,
  repoName: string,
  branchName: string,
  recursive?: boolean,
  accessToken?: string,
): Promise<GiteaAPI.TreeData> {
  const search = new URLSearchParams()
  if (recursive) search.set('recursive', '1')
  const url =
    `https://${API_ENDPOINT}/repos/${userName}/${repoName}/git/trees/${branchName}?` + search
  return await request(url, { accessToken })
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
    const endpoint = `https://gitako.now.sh/oauth/gitea?`
    const res = await fetch(endpoint + new URLSearchParams({ code }).toString(), {
      method: 'post',
    })
    if (res.ok) {
      const body = await res.json()
      const accessToken = body?.accessToken
      if (typeof accessToken === 'string') return accessToken
    }
  } catch (err) {}
  return null
}
