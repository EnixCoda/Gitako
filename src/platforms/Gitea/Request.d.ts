declare namespace GiteaAPI {
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
