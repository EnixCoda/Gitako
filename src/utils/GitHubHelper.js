import { raiseError } from 'analytics'
export const NOT_FOUND = 'Repo Not Found'
export const BAD_CREDENTIALS = 'Bad credentials'

async function request(url, { accessToken } = {}) {
  const headers = {}
  if (accessToken) {
    headers.Authorization = `token ${accessToken}`
  }
  const res = await fetch(url, { headers })
  if (!res.ok) raiseError(new Error(`Got ${res.statusText} when requesting ${url}`))
  if (res.status === 200) return res.json()
  // for private repo, GitHub api also responses with 404 when unauthorized
  if (res.status === 404) throw new Error(NOT_FOUND)
  const content = await res.json()
  throw new Error(content.message)
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
