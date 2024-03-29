type AnyArray = any[] // eslint-disable-line @typescript-eslint/no-explicit-any

type MetaData = {
  userName: string
  repoName: string
  branchName: string
  type?: EnumString<'tree' | 'blob' | 'pull' | 'commit'>
}

type PartialMetaData = MakeOptional<MetaData, 'repoName' | 'userName' | 'branchName'>

type TreeNode = {
  name: string
  contents?: TreeNode[]
  path: string
  type: 'tree' | 'blob' | 'commit'
  url?: string
  permalink?: string
  rawLink?: string
  sha?: string
  accessDenied?: boolean
  comments?: {
    active: number
    resolved: number
  }
  diff?: {
    status: 'modified' | 'added' | 'removed' | 'renamed'
    additions: number
    deletions: number
    changes: number
  }
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

// eslint-disable-next-line @typescript-eslint/ban-types
type EnumString<S extends string> = S | (string & {})

type JSONPrimitive = string | number | boolean | null | undefined
type JSONObject = {
  [key: string]: JSONValue
}
type JSONArray = JSONValue[]
type JSONValue = JSONPrimitive | JSONObject | JSONArray
