import { raiseError } from 'analytics'

export function parse(): Partial<MetaData> & { path: string[] } {
  const { pathname } = window.location
  let [
    ,
    // ignore content before the first '/'
    userName,
    repoName,
    type,
    ...path // should be [...branchName.split('/'), ...filePath.split('/')]
  ] = unescape(decodeURIComponent(pathname)).split('/')
  return {
    userName,
    repoName,
    branchName: undefined,
    type,
    path,
  }
}

export function parseSHA() {
  const { type, path } = parse()
  return type === 'blob' || type === 'tree' ? path[0] : undefined
}

export function isInPullPage() {
  const { type, path } = parse()
  return type === 'pull' ? path[0] : false
}

function isCommitPath(path: string[]) {
  return isCompleteCommitSHA(path[0])
}

function isCompleteCommitSHA(sha?: string) {
  return typeof sha === 'string' && /^[abcdef0-9]{40}$/i.test(sha)
}

export function getCurrentPath(branchName = '') {
  const { path, type } = parse()
  if (type === 'blob' || type === 'tree') {
    if (isCommitPath(path)) {
      // path = commit-SHA/path/to/item
      path.shift()
    } else {
      // path = branch/name/path/to/item or HEAD/path/to/item
      // HEAD is not a valid branch name. Getting HEAD means being detached.
      if (path[0] === 'HEAD') path.shift()
      else {
        const splitBranchName = branchName.split('/')
        while (splitBranchName.length) {
          if (
            splitBranchName[0] === path[0] ||
            // Keep consuming as their heads are same
            (splitBranchName.length === 1 && splitBranchName[0].startsWith(path[0]))
            // This happens when visiting URLs like /blob/{commitSHA}/path/to/file
            // and {commitSHA} is shorter than we got from DOM
          ) {
            splitBranchName.shift()
            path.shift()
          } else {
            raiseError(new Error(`branch name and path prefix not match`), {
              branchName,
              path: parse().path,
            })
            return []
          }
        }
      }
    }
    return path.map(decodeURIComponent)
  }
  return []
}
