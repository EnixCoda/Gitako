import { useConfigs } from 'containers/ConfigsContext'
import { GITHUB_OAUTH } from 'env'
import { Base64 } from 'js-base64'
import { configRef } from 'utils/config/helper'
import { run } from 'utils/general'
import { resolveGitModules } from 'utils/gitSubmodule'
import { sortFoldersToFront } from 'utils/treeParser'
import * as API from './API'
import * as DOMHelper from './DOMHelper'
import { useEnterpriseStatBarStyleFix } from './hooks/useEnterpriseStatBarStyleFix'
import { useGitHubAttachCopyFileButton } from './hooks/useGitHubAttachCopyFileButton'
import { useGitHubAttachCopySnippetButton } from './hooks/useGitHubAttachCopySnippetButton'
import { useGitHubCodeFold } from './hooks/useGitHubCodeFold'
import * as URLHelper from './URLHelper'
export { useGitHubCodeFold } from './hooks/useGitHubCodeFold'

function processTree(tree: TreeNode[]): TreeNode {
  // nodes are created from items and put onto tree
  const pathToItem = new Map<string, TreeNode>()
  tree.forEach(item => pathToItem.set(item.path, item))

  const pathToCreated = new Map<string, TreeNode>()
  const root: TreeNode = { name: '', path: '', contents: [], type: 'tree' }
  pathToCreated.set('', root)
  tree.forEach(item => {
    // bottom-up search for the deepest node created
    let path = item.path
    const itemsToCreateTreeNode: TreeNode[] = []
    while (path !== '' && !pathToCreated.has(path)) {
      const item = pathToItem.get(path)
      if (item) {
        itemsToCreateTreeNode.push(item)
      } else {
        const $item: TreeNode = {
          name: path.split('/').pop() || '',
          path,
          type: 'tree',
          contents: [],
        }
        pathToItem.set(path, $item)
        itemsToCreateTreeNode.push($item)
      }
      // 'a/b' -> 'a'
      // 'a' -> ''
      path = path.substring(0, path.lastIndexOf('/'))
    }

    // top-down create nodes
    while (itemsToCreateTreeNode.length) {
      const item = itemsToCreateTreeNode.pop()
      if (!item) continue
      const node: TreeNode = item
      const parentNode = pathToCreated.get(path)
      if (parentNode) {
        if (!parentNode.contents) parentNode.contents = []
        parentNode.contents.push(node)
      }
      pathToCreated.set(node.path, node)
      path = node.path
    }
  })

  sortFoldersToFront(root)

  return root
}

function getUrlForRedirect(
  userName: string,
  repoName: string,
  branchName: string,
  type = 'blob',
  path = '',
) {
  // Modern browsers have great support for handling unsafe URL,
  // It may be possible to sanitize path with
  // `path => path.includes('#') ? path.replace(/#/g, '%23') : '...'
  return `https://${window.location.host}/${userName}/${repoName}/${type}/${branchName}/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`
}

export function isEnterprise() {
  return !window.location.host.endsWith('github.com')
}

function resolvePageScope(defaultBranchName?: string) {
  const parsed = URLHelper.parse()
  switch (parsed.type) {
    case 'blob':
    case 'tree': {
      // handle URLs like {user}/{repo}/{'tree'|'blob'}/{sha|branch}, issue #131
      const branchName = DOMHelper.getCurrentBranch()
      if (branchName && branchName !== defaultBranchName) return `branch-${branchName}`
      break
    }
    case 'tags':
      return 'tags'
    case 'releases':
      return 'releases'
    case 'pull':
      const pullId = URLHelper.isInPullPage()
      if (pullId) return `pull-${pullId}`
  }
  return 'general'
}

const pathSHAMap = new Map<string, string>()

// Try lookup PJAX containers, #js-repo-pjax-container could exist while #repo-content-pjax-container does not.
const pjaxContainerSelector = ['#repo-content-pjax-container', '#js-repo-pjax-container'].find(
  selector => document.querySelector(selector),
)

export const GitHub: Platform = {
  isEnterprise,
  resolvePartialMetaData() {
    if (!DOMHelper.isInRepoPage()) {
      return null
    }

    const metaFromDOM = DOMHelper.resolveMeta()
    const metaFromURL = URLHelper.parse()
    const userName: MetaData['userName'] | undefined = metaFromDOM.userName || metaFromURL.userName
    const repoName: MetaData['repoName'] | undefined = metaFromDOM.repoName || metaFromURL.repoName
    if (!userName || !repoName) {
      return null
    }

    const { type } = metaFromURL
    let branchName
    if (URLHelper.isInPullPage()) {
      branchName = DOMHelper.getIssueTitle()
    } else if (
      DOMHelper.isInCodePage() &&
      !['releases', 'tags'].includes(type || '') // resolve sentry issue #-CK
    ) {
      branchName = DOMHelper.getCurrentBranch() || URLHelper.parseSHA()
    }

    const metaData = {
      userName,
      repoName,
      type,
      branchName,
    }
    return metaData
  },
  async getDefaultBranchName({ userName, repoName }, accessToken) {
    return (await API.getRepoMeta(userName, repoName, accessToken)).default_branch
  },
  resolveUrlFromMetaData({ userName, repoName, branchName }) {
    const repoUrl = `https://${window.location.host}/${userName}/${repoName}`
    const userUrl = `https://${window.location.host}/${userName}`
    const pullId = URLHelper.isInPullPage()
    const branchUrl = pullId ? `${repoUrl}/pull/${pullId}` : `${repoUrl}/tree/${branchName}`
    return {
      repoUrl,
      userUrl,
      branchUrl,
    }
  },
  async getTreeData(metaData, path = '/', recursive, accessToken) {
    const pullId = URLHelper.isInPullPage()
    if (pullId) {
      return await getPullRequestTreeData(metaData, pullId, accessToken)
    }

    return await getRepositoryTreeData(metaData, path, recursive, accessToken)
  },
  shouldShow() {
    return Boolean(
      DOMHelper.isInCodePage() ||
        (URLHelper.isInPullPage() && !DOMHelper.isNativePRFileTreeShown()),
    )
  },
  shouldExpandAll() {
    return Boolean(URLHelper.isInPullPage())
  },
  getCurrentPath(branchName) {
    const pathFromURL = URLHelper.parse().path.join('/')
    if (pathFromURL.length) {
      if (branchName && pathFromURL.startsWith(branchName + '/')) {
        return pathFromURL.replace(branchName + '/', '').split('/')
      } else {
        // This would fail before PJAX replace, but works well when no branchName, e.g. first load
        return DOMHelper.getPath()
      }
    } else {
      return []
    }
  },
  setOAuth(code) {
    return API.OAuth(code)
  },
  getOAuthLink() {
    const params = new URLSearchParams({
      client_id: GITHUB_OAUTH.clientId,
      scope: 'repo',
      redirect_uri: window.location.href,
    })
    return `https://github.com/login/oauth/authorize?` + params.toString()
  },
  usePlatformHooks() {
    const { copyFileButton, copySnippetButton, codeFolding } = useConfigs().value
    useGitHubAttachCopyFileButton(copyFileButton)
    useGitHubAttachCopySnippetButton(copySnippetButton)
    useGitHubCodeFold(codeFolding)
    useEnterpriseStatBarStyleFix()
  },
  delegatePJAXProps: options => {
    if (configRef.pjaxMode === 'native' && (!options?.node || options.node.type === 'blob'))
      return {
        'data-pjax': pjaxContainerSelector,
        onClick() {
          /* Overwriting default onClick */
        },
      }
  },
  loadWithPJAX: (url, element) => {
    if (configRef.pjaxMode === 'native') {
      element.click()
      return true
    }
  },
}

function sanitizePath(path: string) {
  return path.replace(/\/\/+/g, '/').replace(/^\/|\/$/g, '') || '/'
}

async function getRepositoryTreeData(
  { userName, repoName, branchName }: Pick<MetaData, 'userName' | 'repoName' | 'branchName'>,
  path: string,
  recursive: boolean | undefined,
  accessToken: string | undefined,
) {
  const sha = path === '/' ? branchName : pathSHAMap.get(path)
  if (!sha) throw new Error(`No sha for path "${path}"`)
  const treeData = await API.getTreeData(userName, repoName, sha, recursive, accessToken)

  // remove deep items
  if (treeData.truncated) {
    if (treeData.tree.some(item => item.path.includes('/')))
      treeData.tree = treeData.tree.filter(item => !item.path.includes('/'))
  }

  // update map
  if (path !== '/' || treeData.truncated) {
    if (path !== '/') {
      treeData.tree.forEach(item => {
        item.path = sanitizePath(`${path}/${item.path}`)
      })
    }
    treeData.tree.forEach(item => {
      pathSHAMap.set(item.path, item.sha)
    })
  }

  const root = processTree(
    treeData.tree.map(item => ({
      path: item.path || '',
      type: item.type || 'blob',
      name: item.path?.replace(/^.*\//, '') || '',
      url:
        item.url && item.type && item.path
          ? getUrlForRedirect(userName, repoName, branchName, item.type, item.path)
          : undefined,
      contents: item.type === 'tree' ? [] : undefined,
      sha: item.sha,
    })),
  )

  const gitModules = root.contents?.find(
    item => item.type === 'blob' && item.name === '.gitmodules',
  )
  if (gitModules?.sha) {
    const blobData = await API.getBlobData(userName, repoName, gitModules.sha, accessToken)

    if (blobData && blobData.encoding === 'base64' && blobData.content) {
      await resolveGitModules(root, Base64.decode(blobData.content))
    }
  }

  return { root, defer: treeData.truncated }
}

async function getPullRequestTreeData(
  { userName, repoName }: Pick<MetaData, 'userName' | 'repoName' | 'branchName'>,
  pullId: string,
  accessToken?: string,
) {
  // https://developer.github.com/v3/pulls/#list-pull-requests-files
  const GITHUB_API_RESPONSE_LENGTH_LIMIT = 3000
  const GITHUB_API_PAGED_RESPONSE_LENGTH_LIMIT = 30
  const MAX_PAGE = Math.ceil(
    GITHUB_API_RESPONSE_LENGTH_LIMIT / GITHUB_API_PAGED_RESPONSE_LENGTH_LIMIT,
  )
  let page = 1
  const [pullData, treeData, commentData] = await Promise.all([
    API.getPullData(userName, repoName, pullId, accessToken),
    API.getPullTreeData(userName, repoName, pullId, page, accessToken),
    API.getPullComments(userName, repoName, pullId, accessToken),
  ])

  const count = pullData.changed_files
  if (treeData.length < count) {
    const restPages = []
    while (page * GITHUB_API_PAGED_RESPONSE_LENGTH_LIMIT < count) {
      restPages.push(++page)
    }
    if (page > MAX_PAGE) {
      // TODO: hint
    }
    const moreFiles = await Promise.all(
      restPages.map(page => API.getPullTreeData(userName, repoName, pullId, page, accessToken)),
    )
    treeData.push(...([] as GitHubAPI.PullTreeData).concat(...moreFiles))
  }

  const docs = await API.getPullPageDocuments(userName, repoName, pullId)
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
  const nodes: TreeNode[] = treeData.map(
    ({ filename, sha, additions, deletions, changes, status }) => ({
      path: filename || '',
      type: 'blob',
      name: filename?.replace(/^.*\//, '') || '',
      url: `${urlMainPart}${formatHash(getFileElementHash(filename))}`,
      sha: sha,
      comments: run(() => {
        const comments = commentData?.filter(comment => filename === comment.path)
        if (comments?.length)
          return {
            active: comments.filter(comment => comment.position !== null).length,
            resolved: comments.filter(comment => comment.position === null).length,
          }
      }),
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

function formatHash(hash?: string) {
  if (hash) return '#' + hash
  return ''
}
