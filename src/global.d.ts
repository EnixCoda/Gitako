type MetaData = {
  userName: string
  repoName: string
  branchName: string
  defaultBranchName?: string
  repoUrl?: string
  userUrl?: string
  type?: 'tree' | 'blob' | string
}

type TreeNode = {
  name: string
  contents?: TreeNode[]
  path: string
  type: 'tree' | 'blob' | 'commit'
  url?: string
  sha?: string
  accessDenied?: boolean
}
