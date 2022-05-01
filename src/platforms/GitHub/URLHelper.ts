import { raiseError } from 'analytics'

export function parse(): Partial<Pick<MetaData, 'userName' | 'repoName' | 'type'>> & {
  path: string[]
} {
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
    type,
    path,
  }
}

// not working well with non-branch blob
// cannot handle '/' split branch name, should not use when possibly in branch page
export function parseSHA() {
  const { type, path } = parse()
  return type === 'blob' || type === 'tree' || type === 'commit' ? path[0] : undefined
}

export function isInPullPage() {
  const { type, path } = parse()
  return type === 'pull' ? path[0] : false
}

export function isInCommitPage() {
  const { type, path } = parse()
  return type === 'commit' ? path[0] : false
}

export function isCommitPath(path: string[]) {
  return path[0] ? isCompleteCommitSHA(path[0]) : false
}

export function isCompleteCommitSHA(sha: string) {
  return /^[abcdef0-9]{40}$/i.test(sha)
}

export function isPossiblyCommitSHA(sha: string) {
  return /^[abcdef0-9]+$/i.test(sha)
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
        if (
          splitBranchName.length === 1 &&
          path.length > 0 &&
          isPossiblyCommitSHA(splitBranchName[0]) &&
          isPossiblyCommitSHA(path[0]) &&
          (splitBranchName[0].startsWith(path[0]) || path[0].startsWith(splitBranchName[0]))
          // This happens when visiting URLs like /blob/{commitSHA}/path/to/file
          // and {commitSHA} does not match the one got from DOM
        ) {
          splitBranchName.shift()
          path.shift()
        } else {
          while (splitBranchName.length) {
            if (splitBranchName[0] === path[0]) {
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
    }
    return path.map(decodeURIComponent)
  }
  return []
}
