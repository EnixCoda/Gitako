type MetaData = {
  userName: string
  repoName: string
  branchName: string
  defaultBranchName?: string
  type?: EnumString<'tree' | 'blob' | 'pull'>
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

type IO<T, ChangeT = T> = {
  value: T
  onChange(value: ChangeT): void
}

type Override<Original, Incoming> = Omit<Original, keyof Incoming> & Incoming
type MakeOptional<Original, keys extends keyof Original> = Override<
  Original,
  Partial<Pick<Original, keys>>
>

type VoidFN<T> = (payload: T) => void

type Async<T> = T | Promise<T>
type EnumString<S extends string> = S | (string & {})
