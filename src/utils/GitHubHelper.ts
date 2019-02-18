import { raiseError } from 'analytics'
export const NOT_FOUND = 'Repo Not Found'
export const BAD_CREDENTIALS = 'Bad credentials'
export const API_RATE_LIMIT = `API rate limit`
export const EMPTY_PROJECT = `Empty project`

function apiRateLimitExceeded(content: any) {
  return (
    content && content['documentation_url'] === 'https://developer.github.com/v3/#rate-limiting'
  )
}

function isEmptyProject(content: any) {
  return content && content['message'] === 'Git Repository is empty.'
}

type Options = {
  accessToken?: string
}

async function request(url: string, { accessToken }: Options = {}) {
  const headers = {} as {
    Authorization?: string
  }
  if (accessToken) {
    headers.Authorization = `token ${accessToken}`
  }
  const res = await fetch(url, { headers })
  if (res.status === 200) return res.json()
  // for private repo, GitHub api also responses with 404 when unauthorized
  else if (res.status === 404) throw new Error(NOT_FOUND)
  else {
    const content = await res.json()
    if (apiRateLimitExceeded(content)) throw new Error(API_RATE_LIMIT)
    else if (isEmptyProject(content)) throw new Error(EMPTY_PROJECT)
    else if (!res.ok) raiseError(new Error(`Got ${res.statusText} when requesting ${url}`))
    throw new Error(content && content.message)
  }
}

type PageType = 'blob' | 'tree' | string

export type MetaData = {
  userName?: string
  repoName?: string
  branchName?: string
  accessToken?: string
  type?: PageType
  api?: any
}

async function getRepoMeta({ userName, repoName, accessToken }: MetaData) {
  const url = `https://api.github.com/repos/${userName}/${repoName}`
  return await request(url, { accessToken })
}

export type TreeItem = {
  path: string
}

export type TreeData = {
  userName: string
  repoName: string
  branchName: string
  accessToken: string
  tree: TreeItem[]
}

async function getTreeData({ userName, repoName, branchName, accessToken }: MetaData) {
  const url = `https://api.github.com/repos/${userName}/${repoName}/git/trees/${branchName}?recursive=1`
  return await request(url, { accessToken })
}

export type ItemData = {
  userName: string
  repoName: string
  accessToken: string
}

export type BlobData = {
  encoding: 'base64' | string
  fileSHA: string
  content?: string
}

async function getBlobData({
  userName,
  repoName,
  accessToken,
  fileSHA,
}: Pick<ItemData & BlobData, 'userName' | 'repoName' | 'accessToken' | 'fileSHA'>) {
  const url = `https://api.github.com/repos/${userName}/${repoName}/git/blobs/${fileSHA}`
  return await request(url, { accessToken })
}

function getUrlForRedirect(
  { userName, repoName, branchName }: MetaData,
  type = 'blob',
  path?: string
) {
  return `https://github.com/${userName}/${repoName}/${type}/${branchName}/${path}`
}

export default {
  getRepoMeta,
  getTreeData,
  getBlobData,
  getUrlForRedirect,
}
