import { sanitizedLocation } from 'utils/URLHelper'
import * as API from './API'
import { getPRDiffTotalStat, getPullRequestFilesCount, isInPullFilesPage } from './DOMHelper'
import { processTree } from './index'
import { getCommentsMap } from './utils'

function checkShouldSafeGet() {
  const FAST_GET_DIFF_THRESHOLD = 10000
  const FAST_GET_FILES_THRESHOLD = 200
  const { added, removed } = getPRDiffTotalStat()
  const filesCount = getPullRequestFilesCount()
  return (
    added === null ||
    removed === null ||
    filesCount === null ||
    (added + removed < FAST_GET_DIFF_THRESHOLD && filesCount < FAST_GET_FILES_THRESHOLD)
  )
}

export async function getPullRequestTreeData(
  metaData: Pick<MetaData, 'userName' | 'repoName' | 'branchName'>,
  pullId: string,
  accessToken?: string,
  shouldSafeGet = checkShouldSafeGet(),
) {
  const { userName, repoName } = metaData
  const [treeData, commentData] = await Promise.all([
    shouldSafeGet
      ? safeGetPullRequestTreeData(metaData, pullId, accessToken)
      : fastGetPullRequestTreeData(metaData, pullId, accessToken),
    API.getPullComments(userName, repoName, pullId, accessToken),
  ])

  const docs = await API.getPullPageDocuments(
    userName,
    repoName,
    pullId,
    isInPullFilesPage() ? document : undefined,
  )
  // query all elements at once to make getFileElementHash run faster
  const elementsHavePath = docs.map(doc => doc.querySelectorAll(`[data-path]`))
  const map = new Map<string, string>()
  for (const group of elementsHavePath) {
    for (let i = 0; i < group.length; i++) {
      const element = group[i]
      const id = element.parentElement?.id
      if (id) {
        const path = element.getAttribute('data-path')
        if (path) map.set(path, id)
      }
    }
  }

  const url = new URL(sanitizedLocation.href)
  url.pathname = `/${userName}/${repoName}/pull/${pullId}/files`
  const commentsMap = getCommentsMap(commentData)
  const nodes: TreeNode[] = treeData.map(
    ({ filename, sha, additions, deletions, changes, status }) => {
      url.hash = map.get(filename) || ''
      return {
        path: filename || '',
        type: 'blob',
        name: filename?.split('/').pop() || '',
        url: `${url}`,
        sha,
        comments: commentsMap.get(filename),
        diff: {
          status,
          additions,
          deletions,
          changes,
        },
      }
    },
  )

  const root = processTree(nodes)
  return { root }
}

const GITHUB_API_RESPONSE_LENGTH_LIMIT = 3000
const GITHUB_API_RESPONSE_MAX_SIZE_PER_PAGE = 100
const MAX_PAGE = Math.ceil(GITHUB_API_RESPONSE_LENGTH_LIMIT / GITHUB_API_RESPONSE_MAX_SIZE_PER_PAGE)

async function safeGetPullRequestTreeData(
  { userName, repoName }: Pick<MetaData, 'userName' | 'repoName' | 'branchName'>,
  pullId: string,
  accessToken?: string,
) {
  return (
    await API.getPaginatedData<GitHubAPI.PullTreeData>(page =>
      API.requestPullTreeData(
        userName,
        repoName,
        pullId,
        page,
        GITHUB_API_RESPONSE_MAX_SIZE_PER_PAGE,
        accessToken,
      ),
    )
  ).flat()
}

async function fastGetPullRequestTreeData(
  { userName, repoName }: Pick<MetaData, 'userName' | 'repoName' | 'branchName'>,
  pullId: string,
  accessToken?: string,
) {
  const treeData = await API.getPullTreeData(
    userName,
    repoName,
    pullId,
    1,
    GITHUB_API_RESPONSE_MAX_SIZE_PER_PAGE,
    accessToken,
  )

  const count = getPullRequestFilesCount()
  if (count !== null && treeData.length < count) {
    let page = 1
    const restPages = []
    while (page * GITHUB_API_RESPONSE_MAX_SIZE_PER_PAGE < count) {
      restPages.push(++page)
    }
    if (page > MAX_PAGE) {
      // TODO: hint
    }
    const moreFiles = await Promise.all(
      restPages.map(page =>
        API.getPullTreeData(
          userName,
          repoName,
          pullId,
          page,
          GITHUB_API_RESPONSE_MAX_SIZE_PER_PAGE,
          accessToken,
        ),
      ),
    )
    treeData.push(...moreFiles.flat())
  }

  return treeData
}
