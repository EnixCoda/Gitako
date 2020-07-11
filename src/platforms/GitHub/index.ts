import { raiseError } from 'analytics'
import { GITHUB_OAUTH } from 'env'
import { Base64 } from 'js-base64'
import { platform } from 'platforms'
import * as React from 'react'
import { useEvent } from 'react-use'
import { resolveGitModules } from 'utils/gitSubmodule'
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
  return `https://${window.location.host}/${userName}/${repoName}/${type}/${branchName}/${path}`
}

export function isEnterprise() {
  return !window.location.host.endsWith('github.com')
}

export const GitHub: Platform = {
  isEnterprise,
  resolveMeta() {
    if (!URLHelper.isInRepoPage()) {
      return null
    }

    let detectedBranchName
    if (URLHelper.isInPullPage()) {
      detectedBranchName = DOMHelper.getIssueTitle()
    } else if (DOMHelper.isInCodePage()) {
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

    const pullId = URLHelper.isInPullPage()
    if (pullId) {
      const treeData = await API.getPullTreeData(userName, repoName, pullId, accessToken)

      const creator = await createPullFileResolver(userName, repoName, pullId)

      const nodes: TreeNode[] = treeData.map(item => {
        const id = creator(item.filename)
        return {
          path: item.filename || '',
          type: 'blob',
          name: item.filename?.replace(/^.*\//, '') || '',
          url: id
            ? `https://${window.location.host}/${metaData.userName}/${metaData.repoName}/pull/${pullId}/files${window.location.search}#${id}`
            : `#`,
          rawUrl: item.raw_url,
          contents: undefined,
          sha: item.sha,
        }
      })

      const missingFolders = findMissingFolders(nodes)
      nodes.push(
        ...missingFolders.map(
          folder =>
            ({
              name: folder.replace(/^.*\//, ''),
              path: folder,
              type: 'tree',
            } as TreeNode),
        ),
      )

      const tree = processTree(nodes)
      return tree
    }

    const treeData = await API.getTreeData(userName, repoName, branchName, accessToken)
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
        rawUrl:
          item.url && item.type && item.path
            ? getUrlForRedirect(
                metaData.userName,
                metaData.repoName,
                metaData.branchName,
                'raw',
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
  shouldShow() {
    return Boolean(DOMHelper.isInCodePage() || URLHelper.isInPullPage())
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

async function createPullFileResolver(userName: string, repoName: string, pullId: string) {
  let doc: Document
  if (URLHelper.parse().path[1] === 'files') {
    doc = document
  } else {
    const shas = DOMHelper.getPullSHA()
    if (!shas) {
      raiseError(new Error(`Cannot resolve sha from DOM`))
      doc = document
      // fallback, at least not throw error
    } else {
      doc = await API.getPullPageDocument(userName, repoName, pullId, shas.baseSHA, shas.headSHA)
    }
  }

  return (path: string) => {
    const id = doc.querySelector(`*[data-path^="${path}"]`)?.parentElement?.id
    return id
  }
}

function findMissingFolders(nodes: TreeNode[]) {
  const folders = new Set<string>()
  const foundFolders = new Set<string>()
  for (const node of nodes) {
    let path = node.path
    if (node.type === 'tree') foundFolders.add(path)
    else {
      while (true) {
        // 'a/b' -> 'a'
        // 'a' -> ''
        path = path.substring(0, path.lastIndexOf('/'))
        if (path === '') break
        folders.add(path)
      }
    }
  }

  const missingFolders: string[] = []
  for (const folder of folders) {
    if (!foundFolders.has(folder)) {
      missingFolders.push(folder)
    }
  }

  return missingFolders
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
  useEvent('pjax:ready', attachCopySnippetButton, document)
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
  useEvent('pjax:ready', attachCopyFileButton, document)
}
