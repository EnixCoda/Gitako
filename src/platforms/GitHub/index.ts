import { GITHUB_OAUTH } from 'env'
import { platform } from 'platforms'
import * as React from 'react'
import { useEvent } from 'react-use'
import { resolveGitModules } from 'utils/gitSubmodule'
import { sortFoldersToFront } from 'utils/treeParser'
import * as API from './API'
import * as DOMHelper from './DOMHelper'
import * as URLHelper from './URLHelper'

function parseTreeData(treeData: GitHubAPI.TreeData, metaData: MetaData) {
  const { tree } = treeData

  // nodes are created from items and put onto tree
  const pathToNode = new Map<string, TreeNode>()
  const pathToItem = new Map<string, GitHubAPI.TreeItem>()

  const root: TreeNode = { name: '', path: '', contents: [], type: 'tree' }
  pathToNode.set('', root)

  tree.forEach(item => pathToItem.set(item.path, item))
  tree.forEach(item => {
    // bottom-up search for the deepest node created
    let path = item.path
    const itemsToCreateTreeNode: GitHubAPI.TreeItem[] = []
    while (path !== '' && !pathToNode.has(path)) {
      const item = pathToItem.get(path)
      if (item) {
        itemsToCreateTreeNode.push(item)
      }
      // 'a/b' -> 'a'
      // 'a' -> ''
      path = path.substring(0, path.lastIndexOf('/'))
    }

    // top-down create nodes
    while (itemsToCreateTreeNode.length) {
      const item = itemsToCreateTreeNode.pop()
      if (!item) continue
      const node: TreeNode = {
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
      }
      const parentNode = pathToNode.get(path)
      if (parentNode && parentNode.contents) {
        parentNode.contents.push(node)
      }
      pathToNode.set(node.path, node)
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
  return `https://github.com/${userName}/${repoName}/${type}/${branchName}/${path}`
}

export const GitHub: Platform = {
  resolveMeta() {
    if (!URLHelper.isInRepoPage()) {
      return null
    }

    let detectedBranchName
    if (DOMHelper.isInCodePage()) {
      // not working well with non-branch blob
      // cannot handle '/' split branch name, should not use when possibly on branch page
      detectedBranchName = DOMHelper.getCurrentBranch() || URLHelper.parseSHA()
    }

    const metaData = {
      ...URLHelper.parse(),
      branchName: detectedBranchName,
    } as MetaData
    return metaData
  },
  async getMetaData(partialMetaData, accessToken) {
    const { userName, repoName } = partialMetaData
    const data = await API.getRepoMeta(userName, repoName, accessToken)
    return {
      userUrl: data?.owner?.html_url,
      repoUrl: data?.html_url,
      defaultBranchName: data.default_branch,
    }
  },
  async getTreeData(metaData, accessToken) {
    const { userName, repoName, branchName } = metaData
    const treeData = await API.getTreeData(userName, repoName, branchName, accessToken)
    const root = parseTreeData(treeData, metaData)

    const gitModules = root.contents?.find(item => item.name === '.gitmodules')
    if (gitModules) {
      if (metaData.userName && metaData.repoName && gitModules.sha) {
        const blobData = await API.getBlobData(
          metaData.userName,
          metaData.repoName,
          gitModules.sha,
          accessToken,
        )

        if (blobData && blobData.encoding === 'base64' && blobData.content) {
          resolveGitModules(root, Base64.decode(blobData.content))
        }
      }
    }

    return root
  },
  shouldShow(metaData) {
    return URLHelper.isInCodePage(metaData)
  },
  getCurrentPath(branchName) {
    return URLHelper.getCurrentPath(branchName)
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
}

export function useGitHubAttachCopySnippetButton(copySnippetButton: boolean) {
  const attachCopySnippetButton = React.useCallback(
    function attachCopySnippetButton() {
      if (platform !== GitHub) return
      if (copySnippetButton) return DOMHelper.attachCopySnippet() || undefined // for the sake of react effect
    },
    [copySnippetButton],
  )
  React.useEffect(attachCopySnippetButton, [copySnippetButton])
  useEvent('pjax:complete', attachCopySnippetButton, window)
}

export function useGitHubAttachCopyFileButton(copyFileButton: boolean) {
  const attachCopyFileButton = React.useCallback(
    function attachCopyFileButton() {
      if (platform !== GitHub) return
      if (copyFileButton) return DOMHelper.attachCopyFileBtn() || undefined // for the sake of react effect
    },
    [copyFileButton],
  )
  React.useEffect(attachCopyFileButton, [copyFileButton])
  useEvent('pjax:complete', attachCopyFileButton, window)
}
