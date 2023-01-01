import { errors } from 'platforms'
import { is } from 'utils/is'
import {
  gitakoServiceHost,
  responseBodyResolvers,
  transformURLSearchParam,
} from 'utils/networkService'
import { resolveHeaderLink } from './utils'

const API_ENDPOINT = `${window.location.origin}/api/v4`

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

export async function getRepoMeta(
  userName: string,
  repoName: string,
  accessToken?: string,
): Promise<GitLabAPI.Response.MetaData> {
  const url = `${API_ENDPOINT}/projects/${encodeURIComponent(`${userName}/${repoName}`)}`
  return await request(url, { accessToken })
}

export async function getTreeData(
  userName: string,
  repoName: string,
  searchParams?: URLSearchParams | NewType,
  accessToken?: string,
): Promise<GitLabAPI.Response.TreeData> {
  return (await requestTreeData(userName, repoName, searchParams, accessToken)).json()
}

type NewType = {
  ref?: string
  path?: string
  recursive?: boolean
  id?: string
  page?: number
  per_page?: number
  pagination?: 'legacy'
}

export function requestTreeData(
  userName: string,
  repoName: string,
  searchParams?: URLSearchParams | NewType,
  accessToken?: string,
) {
  const url = `${API_ENDPOINT}/projects/${encodeURIComponent(
    `${userName}/${repoName}`,
  )}/repository/tree/?${
    searchParams instanceof URLSearchParams
      ? searchParams
      : searchParams
      ? transformURLSearchParam(searchParams)
      : ''
  }`
  return request(url, { accessToken }, responseBodyResolvers.asIs)
}

export async function getBlobData(
  userName: string,
  repoName: string,
  sha: string,
  accessToken?: string,
): Promise<GitLabAPI.Response.BlobData> {
  const url = `${API_ENDPOINT}/projects/${encodeURIComponent(
    `${userName}/${repoName}`,
  )}/repository/files/?${new URLSearchParams({})}`
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

export async function getPaginatedData<T>(
  initialParams: URLSearchParams,
  sendRequest: (params: URLSearchParams) => Promise<Response>,
) {
  const responses: Response[] = []

  const run = async (params: URLSearchParams) => {
    const response = await sendRequest(params)
    responses.push(response)

    const headerLink = response.headers.get('link')
    if (headerLink) {
      const rels = resolveHeaderLink(headerLink)
      if (rels?.next) await run(new URL(rels.next).searchParams)
    }
  }

  await run(initialParams)

  return Promise.all(responses.map(responseBodyResolvers.json) as T[])
}
