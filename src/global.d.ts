type MetaData = {
  userName: string
  repoName: string
  branchName: string
  defaultBranchName?: string
  repoUrl?: string
  userUrl?: string
  type?: 'tree' | 'blob' | 'pull' | string
}

type TreeNode = {
  name: string
  contents?: TreeNode[]
  path: string
  type: 'tree' | 'blob' | 'commit'
  url?: string
  rawUrl?: string
  sha?: string
  accessDenied?: boolean
}
