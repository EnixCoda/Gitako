function parse() {
  const { pathname } = window.location
  const [
    ,
    // ignore content before the first '/'
    userName,
    repoName,
    type,
    branchName,
  ] = pathname.split('/')
  return {
    userName,
    repoName,
    type,
    branchName,
  }
}

const RESERVED_NAME = ['blog']
function isInCodePage() {
  const { userName, repoName, type, branchName } = parse()
  return !!(
    userName &&
    !RESERVED_NAME.find(_ => _ === userName) &&
    repoName &&
    (!type || type === 'tree' || type === 'blob') &&
    ((type && branchName) || !(type || branchName))
  )
}

function detectShouldShow(metaData) {
  return isInCodePage() && (!metaData || metaData.repoName)
}

export default {
  detectShouldShow,
  isInCodePage,
  parse,
}
