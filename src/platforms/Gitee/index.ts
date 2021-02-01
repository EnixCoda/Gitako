import { GITEE_OAUTH } from 'env'
import { platform } from 'platforms'
import * as React from 'react'
import { resolveGitModules } from 'utils/gitSubmodule'
import { useOnPJAXDone } from 'utils/hooks/usePJAX'
import { sortFoldersToFront } from 'utils/treeParser'
import * as API from './API'
import * as DOMHelper from './DOMHelper'
import * as URLHelper from './URLHelper'

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
  return `https://gitee.com/${userName}/${repoName}/${type}/${branchName}/${path}`
}

export const Gitee: Platform = {
  isEnterprise() {
    return !window.location.host.endsWith('gitee.com')
  },
  resolveMeta() {
    if (!DOMHelper.isInRepoPage()) {
      return null
    }

    let branchName
    if (DOMHelper.isInCodePage()) {
      // not working well with non-branch blob
      // cannot handle '/' split branch name, should not use when possibly on branch page
      branchName = DOMHelper.getCurrentBranch() || URLHelper.parseSHA()
    }

    const { userName, repoName, type } = URLHelper.parse()
    if (!userName || !repoName) {
      return null
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
    const data = await API.getRepoMeta(userName, repoName, accessToken)
    return data.default_branch
  },
  resolveUrlFromMetaData({ userName, repoName }) {
    return {
      repoUrl: `https://${window.location.host}/${userName}/${repoName}`,
      userUrl: `https://${window.location.host}/${userName}`,
    }
  },
  async getTreeData(metaData, path, recursive, accessToken) {
    const { userName, repoName, branchName } = metaData
    const treeData = await API.getTreeData(userName, repoName, branchName)

    const root = processTree(
      treeData.tree.map(item => ({
        path: item.path || '',
        type: item.type || 'blob',
        name: item.path?.replace(/^.*\//, '') || '',
        url:
          item.url && item.type && item.path
            ? getUrlForRedirect(
                metaData.userName,
                metaData.repoName,
                metaData.branchName,
                item.type,
                item.path,
              )
            : undefined,
        contents: item.type === 'tree' ? [] : undefined,
        sha: item.sha,
      })),
    )

    const gitModules = root.contents?.find(item => item.name === '.gitmodules')
    if (gitModules) {
      if (metaData.userName && metaData.repoName && gitModules.sha) {
        const blobData = await API.getBlobData(
          metaData.repoName,
          metaData.userName,
          gitModules.sha,
          accessToken,
        )

        if (blobData && blobData.encoding === 'base64' && blobData.content) {
          await resolveGitModules(root, Base64.decode(blobData.content))
        }
      }
    }

    return { root }
  },
  shouldShow() {
    return DOMHelper.isInCodePage()
  },
  getCurrentPath(branchName) {
    return URLHelper.getCurrentPath(branchName)
  },
  getOAuthLink() {
    const params = new URLSearchParams({
      client_id: GITEE_OAUTH.clientId,
      scope: 'projects',
      response_type: 'code',
      redirect_uri:
        'https://gitako.now.sh/redirect/?' +
        new URLSearchParams({ redirect: window.location.href }).toString(),
    })
    return `https://gitee.com/oauth/authorize?` + params.toString()
  },
  setOAuth(code) {
    return API.OAuth(code)
  },
}

export function useGiteeAttachCopySnippetButton(copySnippetButton: boolean) {
  const attachCopySnippetButton = React.useCallback(
    function attachCopySnippetButton() {
      if (platform !== Gitee) return
      if (copySnippetButton) return DOMHelper.attachCopySnippet() || undefined // for the sake of react effect
    },
    [copySnippetButton],
  )
  React.useEffect(attachCopySnippetButton, [copySnippetButton])
  useOnPJAXDone(attachCopySnippetButton)
}
