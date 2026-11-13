import * as API from './API'
import { resolveEmbeddedCommitDiffData } from './DOMHelper'
import { processTree } from './index'
import { resolveFileAnchors } from './resolveCommitFileAnchors'
import { normalizeGitHubPath } from './utils'

export async function getCommitTreeData(
  { userName, repoName }: Pick<MetaData, 'userName' | 'repoName' | 'branchName'>,
  commitSHA: string,
  accessToken: string | undefined,
) {
  const treeData = (
    await API.getPaginatedData<GitHubAPI.CommitResponseData>(page =>
      API.requestCommitTreeData(userName, repoName, commitSHA, page, accessToken),
    )
  )
    .map(({ files }) => files)
    .flat()

  const [, documents] = await API.getCommitPageDocuments(/* userName, repoName, commitSHA */)

  const fileAnchors = resolveFileAnchors(documents, resolveEmbeddedCommitDiffData)
  const getItemURL = (path: string) => {
    const anchor = fileAnchors.get(normalizeGitHubPath(path))
    // Hash-only href: the commit page stays loaded and the browser scrolls to
    // the file's diff block (GitHub handles the scroll and the sticky header).
    return anchor ? `#${anchor}` : undefined
  }

  const root = processTree(
    treeData.map(item => ({
      type: 'blob',
      path: item.filename,
      name: item.filename.split('/').pop() || '',
      url: getItemURL(item.filename) || item.blob_url,
      sha: item.patch,
      diff: {
        status: item.status,
        additions: item.additions,
        deletions: item.deletions,
        changes: item.changes,
      },
    })),
  )

  return { root }
}
