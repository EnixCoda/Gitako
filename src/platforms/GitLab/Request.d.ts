declare namespace GitLabAPI {
  namespace Request {}

  namespace Response {
    type TreeItem = {
      id: string
      name: string
      path: string
      mode: string
      type: 'blob' | 'commit' | 'tree'
    }

    type TreeData = TreeItem[]

    type MetaData = {
      id: number
      description: string
      name: string
      name_with_namespace: string
      path: string
      path_with_namespace: string
      created_at: string
      default_branch: string
      tag_list: string[]
      topics: string[]
      ssh_url_to_repo: string
      http_url_to_repo: string
      web_url: string
      readme_url: string
      avatar_url: string
      forks_count: number
      star_count: number
      last_activity_at: string
      namespace: {
        id: number
        name: string
        path: string
        kind: string // 'group' or other enum
        full_path: string
        parent_id: string | null
        avatar_url: string
        web_url: string
      }
    }

    type BlobData = {
      file_name: string
      file_path: string
      size: number
      encoding: string
      content: string
      content_sha256: string
      ref: string
      blob_id: string
      commit_id: string
      last_commit_id: string
      execute_filemode: boolean
    }

    type OAuth = {
      // TODO
    }
  }
}
