import { raiseError } from "analytics";

function parse() {
  const { pathname } = window.location
  let [
    , // ignore content before the first '/'
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

function getCurrentPath(branchName = '') {
  const { path, type } = parse()
  const slicedBranchName = branchName.split('/')
  if (type === 'blob' || type === 'tree') {
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

export default {
  getCurrentPath,
  isInRepoPage,
  isInCodePage,
  parse,
}
