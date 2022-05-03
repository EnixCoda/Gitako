import { formatHash } from 'utils/general'
import * as API from './API'
import { isInPullFilesPage } from './DOMHelper'
import { processTree } from './index'
import { getCommentsMap } from './utils'

export async function getPullRequestTreeData(
  metaData: Pick<MetaData, 'userName' | 'repoName' | 'branchName'>,
  pullId: string,
  accessToken?: string,
  useSafeRequest = true,
) {
  const { userName, repoName } = metaData
  const [treeData, commentData] = await Promise.all([
    useSafeRequest
      ? safeGetPullRequestTreeData(metaData, pullId, accessToken)
      : fastGetPullRequestTreeData(metaData, pullId, accessToken),
    API.getPullComments(userName, repoName, pullId, accessToken),
  ])

  const docs = await API.getPullPageDocuments(userName, repoName, pullId, isInPullFilesPage() ? document : undefined)
  // query all elements at once to make getFileElementHash run faster
  const elementsHavePath = docs.map(doc => doc.querySelectorAll(`[data-path]`))
  const getFileElementHash = (path: string) => {
    let e
    for (const group of elementsHavePath) {
      for (let i = 0; i < group.length; i++) {
        const element = group[i]
        if (element.getAttribute('data-path')?.startsWith(path)) {
          e = element
          break
        }
      }
      if (e) break
    }
    return e?.parentElement?.id
  }

  const urlMainPart = `https://${window.location.host}/${userName}/${repoName}/pull/${pullId}/files${window.location.search}`
  const commentsMap = getCommentsMap(commentData)
  const nodes: TreeNode[] = treeData.map(
    ({ filename, sha, additions, deletions, changes, status }) => ({
      path: filename || '',
      type: 'blob',
      name: filename?.split('/').pop() || '',
      url: `${urlMainPart}${formatHash(getFileElementHash(filename))}`,
      sha: sha,
      comments: commentsMap.get(filename),
      diff: {
        status,
        additions,
        deletions,
        changes,
      },
    }),
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
  const [pullData, treeData] = await Promise.all([
    API.getPullData(userName, repoName, pullId, accessToken),
    API.getPullTreeData(
      userName,
      repoName,
      pullId,
      1,
      GITHUB_API_RESPONSE_MAX_SIZE_PER_PAGE,
      accessToken,
    ),
  ])

  const count = pullData.changed_files
  if (treeData.length < count) {
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
