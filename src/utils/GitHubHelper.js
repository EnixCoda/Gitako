export const NOT_FOUND = 'Repo Not Found'

async function getRepoMeta({ userName, repoName, accessToken }) {
  const headers = {}
  if (accessToken) {
    headers.Authorization = `token ${accessToken}`
  }
  const res = await fetch(`https://api.github.com/repos/${userName}/${repoName}`, { headers })
  if (res.status === 200) return res.json()
  // for private repo, GitHub api also responses with 404 when unauthorized
  throw new Error(NOT_FOUND)
}

async function getTreeData({ userName, repoName, branchName, accessToken }) {
  const headers = {}
  if (accessToken) {
    headers.Authorization = `token ${accessToken}`
  }
  return (await fetch(
    `https://api.github.com/repos/${userName}/${repoName}/git/trees/${branchName}?recursive=1`,
    { headers }
  )).json()
}

function getUrlForRedirect({ userName, repoName, branchName }, path) {
  return `https://github.com/${userName}/${repoName}/tree/${branchName}/${path}`
}

export default {
  getRepoMeta,
  getTreeData,
  getUrlForRedirect,
}
