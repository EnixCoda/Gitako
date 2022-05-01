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

  type User = {
    login: string
    id: number
    node_id: string
    avatar_url: string
    gravatar_id: string
    url: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    type: 'User' | string
    site_admin: boolean
  }

  type Commit = {
    url: string
    author: {
      name: string
      email: string
      date: string
    }
    committer: {
      name: string
      email: string
      date: string
    }
    message: string
    tree: {
      url: string
      sha: string
    }
    comment_count: number
    verification: {
      verified: boolean
      reason: 'unsigned' | string
      signature: null
      payload: null
    }
  }

  type CommitResponseData = {
    url: string
    sha: string
    node_id: string
    html_url: string
    comments_url: string
    commit: Commit
    author: User
    committer: User
    parents: {
      url: string
      sha: string
    }[]
    stats: {
      additions: number
      deletions: number
      total: number
    }
    files: CommitTreeItem[]
  }

  type CommitTreeItem = {
    additions: number
    blob_url: string
    changes: number
    deletions: number
    filename: string
    patch: string
    raw_url: string
    status: 'modified' | 'added' | 'removed' | 'renamed'
  }

  type PullTreeItem = {
    additions: number
    blob_url: string
    changes: number
    deletions: number
    filename: string
    patch: string
    raw_url: string
    status: 'modified' | 'added' | 'removed' | 'renamed'
    sha: string
    contents_url: string
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
