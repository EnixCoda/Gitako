import { raiseError } from 'analytics'
export const NOT_FOUND = 'Repo Not Found'
export const BAD_CREDENTIALS = 'Bad credentials'
export const API_RATE_LIMIT = `API rate limit`
export const EMPTY_PROJECT = `Empty project`
export const BLOCKED_PROJECT = `Blocked project`

function apiRateLimitExceeded(content: any /* examined any */) {
  return (
    content && content['documentation_url'] === 'https://developer.github.com/v3/#rate-limiting'
  )
}

function isEmptyProject(content: any /* examined any */) {
  return content && content['message'] === 'Git Repository is empty.'
}

function isBlockedProject(content: any /* examined any */) {
  return content && content['message'] === 'Repository access blocked'
}

type Options = {
  accessToken?: string
}

async function request(url: string, { accessToken }: Options = {}) {
  const headers = {} as HeadersInit & {
    Authorization?: string
  }
  if (accessToken) {
    headers.Authorization = `token ${accessToken}`
  }
  const res = await fetch(url, { headers })
  // About res.ok:
  // True if res.status between 200~299
  // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
  if (res.ok) {
    return res.json()
  } else {
    // for private repo, GitHub api also responses with 404 when unauthorized
    if (res.status === 404) throw new Error(NOT_FOUND)
    else {
      const content = await res.json()
      if (apiRateLimitExceeded(content)) throw new Error(API_RATE_LIMIT)
      if (isEmptyProject(content)) throw new Error(EMPTY_PROJECT)
      if (isBlockedProject(content)) throw new Error(BLOCKED_PROJECT)
      // Unknown type of error, report it!
      raiseError(new Error(res.statusText))
      throw new Error(content && content.message)
    }
  }
}

type PageType = 'blob' | 'tree' | string

export type MetaData = {
  userName?: string
  repoName?: string
  branchName?: string
  accessToken?: string
  type?: PageType
  api?: RepoMetaData
}

type RepoMetaData = {
  default_branch: string
  html_url: string
  owner: {
    html_url: string
  }
}

async function getRepoMeta({ userName, repoName, accessToken }: MetaData): Promise<RepoMetaData> {
  const url = `https://api.github.com/repos/${userName}/${repoName}`
  return await request(url, { accessToken })
}

export type TreeItem = {
  path: string
  mode: string
  sha: string
  size: number
  url: string
  type: 'blob' | 'commit' | 'tree'
}

export type TreeData = {
  sha: string
  truncated: boolean
  tree: TreeItem[]
  url: string
}

async function getTreeData({
  userName,
  repoName,
  branchName,
  accessToken,
}: MetaData): Promise<TreeData> {
  const url = `https://api.github.com/repos/${userName}/${repoName}/git/trees/${branchName}?recursive=1`
  return await request(url, { accessToken })
}

export type BlobData = {
  encoding: 'base64' | string
  sha: string
  content?: string
  size: number
  url: string
}

async function getBlobData({
  userName,
  repoName,
  accessToken,
  sha,
}: Pick<MetaData, 'userName' | 'repoName' | 'accessToken'> & {
  sha: string
}): Promise<BlobData> {
  const url = `https://api.github.com/repos/${userName}/${repoName}/git/blobs/${sha}`
  return await request(url, { accessToken })
}

function getUrlForRedirect(
  { userName, repoName, branchName }: MetaData,
  type = 'blob',
  path?: string,
) {
  return `https://github.com/${userName}/${repoName}/${type}/${branchName}/${path}`
}

export default {
  getRepoMeta,
  getTreeData,
  getBlobData,
  getUrlForRedirect,
}
