import { errors } from 'platforms'
import { isEnterprise } from '.'
import { is } from '../../utils/is'
import { gitakoServiceHost } from '../../utils/networkService'
import { continuousLoadPages, getDOM, resolveHeaderLink } from './utils'

function isAPIRateLimitExceeded(content: JSONValue) {
  return (
    is.JSON.object(content) &&
    content?.['documentation_url'] === 'https://developer.github.com/v3/#rate-limiting'
  )
}

function isEmptyProject(content: JSONValue) {
  return is.JSON.object(content) && content?.['message'] === 'Git Repository is empty.'
}

function isBlockedProject(content: JSONValue) {
  return is.JSON.object(content) && content?.['message'] === 'Repository access blocked'
}

export const responseBodyResolvers = {
  asIs: (response: Response) => response,
  json(response: Response) {
    const contentType = response.headers.get('Content-Type') || response.headers.get('content-type')
    if (contentType?.includes('application/json')) return response.json()
    throw new Error(`Response content type is "${contentType}"`)
  },
}

async function request<T>(
  url: string,
  {
    accessToken,
  }: {
    accessToken?: string
  } = {},
  bodyResolver: (response: Response) => Async<T> = responseBodyResolvers.json,
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

  // About res.ok:
  // True if res.status between 200~299
  // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
  if (res.ok) return bodyResolver(res)

  if (res.status === 404 || res.status === 401) throw new Error(errors.NOT_FOUND)
  if (res.status === 403) throw new Error(errors.API_RATE_LIMIT)
  if (res.status === 500) throw new Error(errors.SERVER_FAULT)

  const content = await responseBodyResolvers.json(res)
  if (isAPIRateLimitExceeded(content)) throw new Error(errors.API_RATE_LIMIT)
  if (isEmptyProject(content)) throw new Error(errors.EMPTY_PROJECT)
  if (isBlockedProject(content)) throw new Error(errors.BLOCKED_PROJECT)

  const message =
    typeof content === 'object'
      ? (content as Record<string, unknown> | null)?.message
      : `${content}`
  throw new Error(`Unknown message content "${message}"`)
}

const API_ENDPOINT = isEnterprise() ? `${window.location.origin}/api/v3` : 'https://api.github.com'

export async function getRepoMeta(
  userName: string,
  repoName: string,
  accessToken?: string,
): Promise<GitHubAPI.MetaData> {
  const url = `${API_ENDPOINT}/repos/${userName}/${repoName}`
  return await request(url, { accessToken })
}

export async function getTreeData(
  userName: string,
  repoName: string,
  branchName: string,
  recursive?: boolean,
  accessToken?: string,
): Promise<GitHubAPI.TreeData> {
  const search = new URLSearchParams()
  if (recursive) search.set('recursive', '1')
  const url = `${API_ENDPOINT}/repos/${userName}/${repoName}/git/trees/${branchName}?${search}`
  return await request(url, { accessToken })
}

export async function getPullRequest(
  userName: string,
  repoName: string,
  pullId: string,
  accessToken?: string,
): Promise<GitHubAPI.PullData> {
  const url = `${API_ENDPOINT}/repos/${userName}/${repoName}/pulls/${pullId}`
  return await request(url, { accessToken })
}

export async function requestPullTreeData(
  userName: string,
  repoName: string,
  pullId: string,
  page: number,
  pageSize?: number,
  accessToken?: string,
) {
  const search = new URLSearchParams({ page: page.toString(), per_page: `${pageSize}` })
  const url = `${API_ENDPOINT}/repos/${userName}/${repoName}/pulls/${pullId}/files?${search}`
  return await request(url, { accessToken }, responseBodyResolvers.asIs)
}

export async function getPullTreeData(
  userName: string,
  repoName: string,
  pullId: string,
  page: number,
  pageSize?: number,
  accessToken?: string,
): Promise<GitHubAPI.PullTreeData> {
  return (await requestPullTreeData(userName, repoName, pullId, page, pageSize, accessToken)).json()
}

export async function getPullComments(
  userName: string,
  repoName: string,
  pullId: string,
  accessToken?: string,
): Promise<GitHubAPI.PullComments> {
  const url = `${API_ENDPOINT}/repos/${userName}/${repoName}/pulls/${pullId}/comments`
  return await request(url, { accessToken })
}

export async function getPullPageDocuments(
  userName: string,
  repoName: string,
  pullId: string,
  document?: Document,
): Promise<Document[]> {
  // Response of this API contains view of few files but is not complete.
  return continuousLoadPages(
    document ||
      (await getDOM(`${window.location.origin}/${userName}/${repoName}/pull/${pullId}/files`)),
  )
}

export async function getCommitPageDocuments(): Promise<Document[]> {
  /* userName: string,
  repoName: string,
  commitId: string, */
  // arguments are not used because info are collected from DOM directly
  return continuousLoadPages(document)
}

export async function getBlobData(
  userName: string,
  repoName: string,
  sha: string,
  accessToken?: string,
): Promise<GitHubAPI.BlobData> {
  const url = `${API_ENDPOINT}/repos/${userName}/${repoName}/git/blobs/${sha}`
  return await request(url, { accessToken })
}

export async function OAuth(code: string): Promise<string | null> {
  try {
    const endpoint = `https://${gitakoServiceHost}/oauth/github?${new URLSearchParams({ code })}`
    const res = await fetch(endpoint, {
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

export async function requestCommitTreeData(
  userName: string,
  repoName: string,
  sha: string,
  page = 1,
  accessToken?: string,
): Promise<Response> {
  const search = new URLSearchParams({
    per_page: '100',
    page: `${page}`,
  })
  const url = `${API_ENDPOINT}/repos/${userName}/${repoName}/commits/${sha}?${search}`
  return await request(url, { accessToken }, responseBodyResolvers.asIs)
}

export async function getPaginatedData<T>(sendRequest: (page: number) => Promise<Response>) {
  const responses: Response[] = []
  let page = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await sendRequest(page)
    responses.push(response)

    const headerLink = response.headers.get('link')
    if (headerLink) {
      const rels = resolveHeaderLink(headerLink)
      if (rels) {
        if (rels.position === 'first') {
          page++
        } else if (rels.position === 'middle') {
          const searchOfLast = new URL(rels.last).searchParams
          if (`${page}` === searchOfLast.get('page')) {
            // this should not actually happen because GitHub responds `prev` and `first` for the first page
            break
          }
          page++
        } else {
          // i.e. rels.position === 'last'
          break
        }
      } else {
        // unexpected link header content
        break
      }
    } else {
      // no link headers if there is <100 files
      break
    }
  }
  return Promise.all(responses.map(responseBodyResolvers.json)) as Promise<T[]>
}
