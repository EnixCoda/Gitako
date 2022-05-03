import { formatID } from 'utils/DOMHelper'
import * as API from './API'
import { processTree } from './index'

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

  const documents = await API.getCommitPageDocuments(userName, repoName, commitSHA)

  const getItemURL = (path: string) => {
    for (const doc of documents) {
      const id = doc.querySelector(`[data-path="${path}"]`)?.parentElement?.id
      if (id) return formatID(id)
    }
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
