import * as ini from 'ini'
import { findNode } from 'utils/general'

const subModuleURLRegex = {
  HTTP: /^https?:\/\/.*?$/,
  HTTPGit: /^https:.*?\.git$/,
  git: /^git@.*?:(.*?)\.git$/,
}

function transformModuleGitURL(node: TreeNode, URL: string) {
  const matched = URL.match(subModuleURLRegex.git)
  if (!matched) return
  const [_, userName, repoName] = matched
  return appendCommitPath(`https://${window.location.host}/${userName}/${repoName}`, node)
}

function cutDotGit(URL: string) {
  return URL.replace(/\.git$/, '')
}

function appendCommitPath(URL: string, node: TreeNode) {
  return URL.replace(/\/?$/, `/tree/${node.sha}`)
}

function transformModuleHTTPDotGitURL(node: TreeNode, URL: string) {
  return appendCommitPath(cutDotGit(URL), node)
}

function transformModuleHTTPURL(node: TreeNode, URL: string) {
  return appendCommitPath(URL, node)
}

type ParsedINI = {
  [key: string]: ParsedModule | ParsedINI | undefined
}

type ParsedModule = {
  [key: string]: string | undefined
}

function handleParsed(root: TreeNode, parsed: ParsedINI) {
  Object.values(parsed).forEach(value => {
    if (typeof value === 'string') return
    const url = value?.url
    const path = value?.path
    if (typeof url === 'string' && typeof path === 'string') {
      const node = findNode(root, path.split('/'))
      if (node) {
        if (subModuleURLRegex.HTTPGit.test(url)) {
          node.url = transformModuleHTTPDotGitURL(node, url)
        } else if (subModuleURLRegex.git.test(url)) {
          node.url = transformModuleGitURL(node, url)
        } else if (subModuleURLRegex.HTTP.test(url)) {
          node.url = transformModuleHTTPURL(node, url)
        } else {
          node.accessDenied = true
        }
      } else {
        // It turns out that we did not miss any submodule after a lot of tests.
        // Commenting this.
        // raiseError(new Error(`Submodule node not found`), { path })
      }
    } else {
      handleParsed(root, value as ParsedINI)
    }
  })
}

export function resolveGitModules(root: TreeNode, content: string) {
  try {
    if (Array.isArray(root.contents)) {
      const parsed: ParsedINI = ini.parse(content)
      handleParsed(root, parsed)
    }
  } catch (err) {
    throw new Error(`Error resolving git modules`)
  }
}
