function parseRaw() {
  const { pathname } = window.location
  let [
    , // ignore content before the first '/'
    userName,
    repoName,
    type,
    branchName,
    ...path
  ] = pathname.split('/')
  return {
    userName,
    repoName,
    type,
    branchName,
    path,
  }
}
function parse() {
  const parsedData = parseRaw()
  if (!isInCodePage()) {
    delete parsedData.branchName
  }
  return parsedData
}

const RESERVED_NAME = ['blog']
// route types related to determining if sidebar should show
const TYPES = {
  TREE: 'tree',
  BLOB: 'blob',
  COMMIT: 'commit',
  // known but not related types: issues, pulls, wiki, insight,
  // TODO: record more types
}

function isInRepoPage(metaData) {
  const { userName, repoName } = metaData || parseRaw()
  return Boolean(
    userName &&
    !RESERVED_NAME.find(_ => _ === userName) &&
    repoName
  )
}

function isInCodePage(metaData = {}) {
  const mergedRepo = { ...parseRaw(), ...metaData }
  const { type, branchName } = mergedRepo
  return Boolean(
    isInRepoPage(mergedRepo) &&
    (!type || type === TYPES.TREE || type === TYPES.BLOB) &&
    type !== TYPES.COMMIT &&
    (branchName || (!type && !branchName))
  )
}

function getCurrentPath(decode = false) {
  const { path } = parseRaw()
  return decode ? path.map(decodeURIComponent) : path
}

export default {
  getCurrentPath,
  isInRepoPage,
  isInCodePage,
  parse,
}
