import { useConfigs } from 'containers/ConfigsContext'
import { GITHUB_OAUTH } from 'env'
import { Base64 } from 'js-base64'
import { $ } from 'utils/$'
import { configRef } from 'utils/config/helper'
import { resolveGitModules } from 'utils/gitSubmodule'
import { sortFoldersToFront } from 'utils/treeParser'
import * as API from './API'
import * as DOMHelper from './DOMHelper'
import * as URLHelper from './URLHelper'
import { getCommitTreeData } from './getCommitTreeData'
import { getPullRequestTreeData } from './getPullRequestTreeData'
import { useEnterpriseStatBarStyleFix } from './hooks/useEnterpriseStatBarStyleFix'
import { useGitHubAttachCopySnippetButton } from './hooks/useGitHubAttachCopySnippetButton'
import { useGitHubCodeFold } from './hooks/useGitHubCodeFold'

export function processTree(tree: TreeNode[]): TreeNode {
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

export function isEnterprise() {
  return (
    (window.location.host !== 'github.com' &&
      /**
       * <a class="Header-link " href="https://host.com/" data-hotkey="g d" aria-label="Homepage Enterprise">
       *   <span>Enterprise</span>
       * </a>
       */
      $(
        [
          'a.Header-link[aria-label="Homepage Enterprise"]',
          'a.Header-link[aria-label="Homepage"]', // legacy support
        ].join(),
        e => e.textContent?.trim() === 'Enterprise',
      )) ||
    false
  )
}

const pathSHAMap = new Map<string, string>()

export const GitHub: Platform = {
  shouldActivate() {
    return (
      window.location.host === 'github.com' ||
      // <link rel="fluid-icon" href="https://host.com/fluidicon.png" title="GitHub">
      !!document.querySelector('link[rel="fluid-icon"][title="GitHub"]')
    )
  },
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
    let branchName = metaFromDOM.branchName
    if (URLHelper.isInPullPage()) {
      branchName = DOMHelper.getIssueTitle()
    } else if (URLHelper.isInCommitPage()) {
      branchName = DOMHelper.getCommitTitle() || metaFromURL.path[0]
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
    const dataFromJSON = DOMHelper.resolveEmbeddedData()
    if (dataFromJSON?.defaultBranch) return dataFromJSON.defaultBranch

    return (await API.getRepoMeta(userName, repoName, accessToken)).default_branch
  },
  resolveUrlFromMetaData({ userName, repoName, branchName }) {
    const repoUrl = `${window.location.origin}/${userName}/${repoName}`
    const userUrl = `${window.location.origin}/${userName}`
    const pullId = URLHelper.isInPullPage()
    const commitId = URLHelper.isInCommitPage()
    const branchUrl = pullId
      ? `${repoUrl}/pull/${pullId}`
      : commitId && URLHelper.isPossiblyCommitSHA(commitId)
      ? `${repoUrl}/tree/${commitId}`
      : `${repoUrl}/tree/${branchName}`
    return {
      repoUrl,
      userUrl,
      branchUrl,
    }
  },
  getTreeData(metaData, path = '/', recursive, accessToken) {
    const pullId = URLHelper.isInPullPage()
    if (pullId) return getPullRequestTreeData(metaData, pullId, accessToken)

    const commitId = URLHelper.isInCommitPage()
    if (commitId) return getCommitTreeData(metaData, commitId, accessToken)

    return getRepositoryTreeData(metaData, path, recursive, accessToken)
  },
  shouldExpandSideBar() {
    return Boolean(
      (DOMHelper.isInCodePage() && !DOMHelper.isNativePRFileTreeShown()) ||
        URLHelper.isInCommitPage() ||
        (URLHelper.isInPullPage() && !DOMHelper.isNativePRFileTreeShown()),
    )
  },
  shouldExpandAll() {
    return Boolean(URLHelper.isInPullPage() || URLHelper.isInCommitPage())
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
    return `https://github.com/login/oauth/authorize?${params}`
  },
  usePlatformHooks() {
    const { copySnippetButton, codeFolding } = useConfigs().value
    useGitHubAttachCopySnippetButton(copySnippetButton)
    useGitHubCodeFold(codeFolding)
    useEnterpriseStatBarStyleFix()
  },
  delegateFastRedirectAnchorProps() {
    if (configRef.pjaxMode !== 'native') return

    const pjaxContainerSelector = 'main'
    const turboContainerId = 'repo-content-turbo-frame'

    return {
      'data-pjax': pjaxContainerSelector,
      'data-turbo-frame':
        URLHelper.isInPullPage() || URLHelper.isInCommitPage() ? undefined : turboContainerId,
      onClick() {
        /* Overwriting default onClick */
      },
    }
  },
  loadWithFastRedirect: (url, element) => {
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
      name: item.path?.split('/').pop() || '',
      url:
        item.url && item.type && item.path
          ? URLHelper.getItemUrl(userName, repoName, branchName, item.type, item.path)
          : undefined,
      permalink: URLHelper.getItemUrl(userName, repoName, treeData.sha, item.type, item.path),
      rawLink:
        item.url && item.type === 'blob' && item.path
          ? URLHelper.getItemUrl(userName, repoName, branchName, 'raw', item.path)
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
