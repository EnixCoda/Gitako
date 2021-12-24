declare namespace GitHubAPI {
  type TreeItem = {
    path: string
    mode: string
    sha: string
    size: number
    url: string
    type: 'blob' | 'commit' | 'tree'
  }

  type TreeData = {
    sha: string
    truncated: boolean
    tree: TreeItem[]
    url: string
  }

  type PullTreeItem = {
    additions: number
    blob_url: string
    changes: number
    contents_url: string
    deletions: number
    filename: string
    patch: string
    raw_url: string
    sha: string
    status: 'modified' | 'added' | 'removed' | 'renamed'
  }

  type PullData = {
    state: 'open' | 'closed'
    title: string
    body: string
    changed_files: number
  }

  type PullComment = {
    path: string
    position: number | null
    pull_request_review_id: number
    id: number
    node_id: string
    diff_hunk: string
    body: string
    html_url: string
    author_association: string
  }

  type PullTreeData = PullTreeItem[]
  type PullComments = PullComment[]

  type MetaData = {
    name: string
    default_branch: string
    html_url: string
    owner: {
      login: string
      html_url: string
    }
  }

  type BlobData = {
    encoding: 'base64' | string
    sha: string
    content?: string
    size: number
    url: string
  }

  type OAuth = {
    access_token?: string
    scope?: string
    token_type?: string
    error_description?: string
  }
}
