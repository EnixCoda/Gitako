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
  sha?: string
  accessDenied?: boolean
}

type IO<T> = {
  value: T
  onChange(value: T): void
}

// do not use with generics
type Override<Original, Incoming> = Omit<Original, keyof Incoming> & Incoming
