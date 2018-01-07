function parseRaw() {
  const { pathname } = window.location
  let [
    /* ignore content before the first '/' */,
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
function parse() {
  const parsedData = parseRaw()
  if (!isInCodePage(parsedData)) {
    delete parsedData.type
    delete parsedData.branchName
  }
  return parsedData
}

const RESERVED_NAME = ['blog']
function isInCodePage(metaData = {}) {
  const { userName, repoName, type, branchName } = {...parseRaw(), ...metaData}
  return (
    userName &&
    !RESERVED_NAME.find(_ => _ === userName) &&
    repoName &&
    (!type || type === 'tree' || type === 'blob') &&
    (branchName || !type && !branchName)
  )
}

export default {
  isInCodePage,
  parse,
}
