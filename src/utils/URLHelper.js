import { raiseError } from 'analytics'

function parse() {
  const { pathname } = window.location
  let [
    ,
    // ignore content before the first '/'
    userName,
    repoName,
    type,
    ...path // should be [...branchName.split('/'), ...filePath.split('/')]
  ] = pathname.split('/')
  return {
    userName,
    repoName,
    type,
    path,
  }
}

function parseSHA() {
  const { type, path } = parse()
  return (type === 'blob' || type === 'tree') ? path[0] : false
}

function isInRepoPage() {
  const repoHeaderSelector = '.repohead'
  return Boolean(document.querySelector(repoHeaderSelector))
}

// route types related to determining if sidebar should show
const TYPES = {
  TREE: 'tree',
  BLOB: 'blob',
  COMMIT: 'commit',
  // known but not related types: issues, pulls, wiki, insight,
  // TODO: record more types
}

function isInCodePage(metaData = {}) {
  const mergedRepo = { ...parse(), ...metaData }
  const { type, branchName } = mergedRepo
  return Boolean(
    isInRepoPage(mergedRepo) &&
      (!type || type === TYPES.TREE || type === TYPES.BLOB) &&
      type !== TYPES.COMMIT &&
      (branchName || (!type && !branchName))
  )
}

function isCommitPath(path) {
  return /^[a-z0-9]{40}$/.test(path[0])
}

function getCurrentPath(branchName = '') {
  const { path, type } = parse()
  if (type === 'blob' || type === 'tree') {
    if (isCommitPath(path)) {
      // path = commit-SHA/path/to/item
      path.shift()
    } else {
      // path = branch/name/path/to/item
      const slicedBranchName = branchName.split('/')
      while (slicedBranchName.length) {
        if (slicedBranchName[0] === path[0]) {
          slicedBranchName.shift()
          path.shift()
        } else {
          raiseError(new Error(`branch name and path prefix not match`))
          return []
        }
      }
    }
    return path.map(decodeURIComponent)
  }
  return []
}

export default {
  getCurrentPath,
  isInRepoPage,
  isInCodePage,
  parse,
  parseSHA,
}
