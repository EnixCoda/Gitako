import { GITHUB_OAUTH } from 'env'
import { Base64 } from 'js-base64'
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
  // Modern browsers have great support for handling unsafe URL,
  // It may be possible to sanitize path with
  // `path => path.includes('#') ? path.replace(/#/g, '%23') : '...'
  return `https://${
    window.location.host
  }/${userName}/${repoName}/${type}/${branchName}/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`
}

export function isEnterprise() {
  return !window.location.host.endsWith('github.com')
}

const pathSHAMap = new Map<string, string>()

export const GitHub: Platform = {
  isEnterprise,
  resolveMeta() {
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
    const data = await API.getRepoMeta(userName, repoName, accessToken)
    return data.default_branch
  },
  resolveUrlFromMetaData({ userName, repoName }) {
    return {
      repoUrl: `https://${window.location.host}/${userName}/${repoName}`,
      userUrl: `https://${window.location.host}/${userName}`,
    }
  },
  async getTreeData(metaData, path = '/', recursive, accessToken) {
    const { userName, repoName, branchName } = metaData

    const pullId = URLHelper.isInPullPage()
    if (pullId) {
      // https://developer.github.com/v3/pulls/#list-pull-requests-files
      const GITHUB_API_RESPONSE_LENGTH_LIMIT = 3000
      const GITHUB_API_PAGED_RESPONSE_LENGTH_LIMIT = 30
      const MAX_PAGE = Math.ceil(
        GITHUB_API_RESPONSE_LENGTH_LIMIT / GITHUB_API_PAGED_RESPONSE_LENGTH_LIMIT,
      )
      let page = 1
      const [pullData, treeData] = await Promise.all([
        API.getPullData(userName, repoName, pullId, accessToken),
        API.getPullTreeData(userName, repoName, pullId, page, accessToken),
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

      const creator = await createPullFileResolver(userName, repoName, pullId)

      const nodes: TreeNode[] = treeData.map(item => ({
        path: item.filename || '',
        type: 'blob',
        name: item.filename?.replace(/^.*\//, '') || '',
        url: `https://${window.location.host}/${userName}/${repoName}/pull/${pullId}/files${
          window.location.search
        }#${creator(item.filename) || ''}`,
        sha: item.sha,
      }))

      const root = processTree(nodes)
      return { root }
    }

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
        function sanitizePath(path: string) {
          return path.replace(/\/\/+/g, '/').replace(/^\/|\/$/g, '') || '/'
        }
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
  },
  shouldShow() {
    return Boolean(DOMHelper.isInCodePage() || URLHelper.isInPullPage())
  },
  shouldExpandAll() {
    return Boolean(URLHelper.isInPullPage())
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
  const doc = await API.getPullPageDocument(userName, repoName, pullId)

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
  useOnPJAXDone(attachCopySnippetButton)
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
  useOnPJAXDone(attachCopyFileButton)
}
