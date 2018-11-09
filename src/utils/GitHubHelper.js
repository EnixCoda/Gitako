import { raiseError } from 'analytics'
export const NOT_FOUND = 'Repo Not Found'
export const BAD_CREDENTIALS = 'Bad credentials'
export const API_RATE_LIMIT = `API rate limit`
export const EMPTY_PROJECT = `Empty project`

function apiRateLimitExceeded(content) {
  return content && content['documentation_url'] === 'https://developer.github.com/v3/#rate-limiting'
}

function isEmptyProject(content) {
  return content && content['message'] === 'Git Repository is empty.'
}

async function request(url, { accessToken } = {}) {
  const headers = {}
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

async function getRepoMeta({ userName, repoName, accessToken }) {
  const url = `https://api.github.com/repos/${userName}/${repoName}`
  return await request(url, { accessToken })
}

async function getTreeData({ userName, repoName, branchName, accessToken }) {
  const url = `https://api.github.com/repos/${userName}/${repoName}/git/trees/${branchName}?recursive=1`
  return await request(url, { accessToken })
}

async function getBlobData({ userName, repoName, accessToken, fileSHA }) {
  const url = `https://api.github.com/repos/${userName}/${repoName}/git/blobs/${fileSHA}`
  return await request(url, { accessToken })
}

function getUrlForRedirect({ userName, repoName, branchName }, type = 'blob', path) {
  return `https://github.com/${userName}/${repoName}/${type}/${branchName}/${path}`
}

export default {
  getRepoMeta,
  getTreeData,
  getBlobData,
  getUrlForRedirect,
}
