import { errors } from 'platforms'
import { isEnterprise } from '.'

function apiRateLimitExceeded(content: any /* safe any */) {
  return content?.['documentation_url'] === 'https://developer.github.com/v3/#rate-limiting'
}

function isEmptyProject(content: any /* safe any */) {
  return content?.['message'] === 'Git Repository is empty.'
}

function isBlockedProject(content: any /* safe any */) {
  return content?.['message'] === 'Repository access blocked'
}

async function request(
  url: string,
  {
    accessToken,
    resolveMode = 'body-json',
  }: {
    resolveMode?: 'body-json' | 'response'
    accessToken?: string
  } = {},
) {
  const headers = {} as HeadersInit & {
    Authorization?: string
  }
  if (accessToken) {
    headers.Authorization = `token ${accessToken}`
  }

  let res: Response
  try {
    res = await fetch(url, { headers })
  } catch (err) {
    throw new Error(errors.CONNECTION_BLOCKED)
  }

  const contentType = res.headers.get('Content-Type') || res.headers.get('content-type')
  const isJson = contentType?.includes('application/json')
  // About res.ok:
  // True if res.status between 200~299
  // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
  if (res.ok) {
    switch (resolveMode) {
      case 'body-json': {
        if (isJson) return res.json()
        throw new Error(`Response content type is "${contentType}"`)
      }
      case 'response':
        return res
    }
    throw new Error(`Unknown resolve mode: ${resolveMode}`)
  }

  if (res.status === 404 || res.status === 401) throw new Error(errors.NOT_FOUND)
  else if (res.status === 403) throw new Error(errors.API_RATE_LIMIT)
  else if (res.status === 500) throw new Error(errors.SERVER_FAULT)
  else if (resolveMode && isJson) {
    const content = await res.json()
    if (apiRateLimitExceeded(content)) throw new Error(errors.API_RATE_LIMIT)
    if (isEmptyProject(content)) throw new Error(errors.EMPTY_PROJECT)
    if (isBlockedProject(content)) throw new Error(errors.BLOCKED_PROJECT)
    throw new Error(`Unknown message content "${content?.message}"`)
  } else {
    throw new Error(`Response content type is "${contentType}"`)
  }
}

const API_ENDPOINT = isEnterprise() ? `${window.location.host}/api/v3` : 'api.github.com'

export async function getRepoMeta(
  userName: string,
  repoName: string,
  accessToken?: string,
): Promise<GitHubAPI.MetaData> {
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}`
  return await request(url, { accessToken })
}

export async function getTreeData(
  userName: string,
  repoName: string,
  branchName: string,
  recursive?: boolean,
  accessToken?: string,
): Promise<GitHubAPI.TreeData> {
  const search = new URLSearchParams()
  if (recursive) search.set('recursive', '1')
  const url =
    `https://${API_ENDPOINT}/repos/${userName}/${repoName}/git/trees/${branchName}?` + search
  return await request(url, { accessToken })
}

export async function getPullData(
  userName: string,
  repoName: string,
  pullId: string,
  accessToken?: string,
): Promise<GitHubAPI.PullData> {
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}/pulls/${pullId}`
  return await request(url, { accessToken })
}

export async function getPullTreeData(
  userName: string,
  repoName: string,
  pullId: string,
  page: number,
  accessToken?: string,
): Promise<GitHubAPI.PullTreeData> {
  const search = new URLSearchParams({ page: page.toString() })
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}/pulls/${pullId}/files?${search}`
  return await request(url, { accessToken })
}

export async function getPullComments(
  userName: string,
  repoName: string,
  pullId: string,
  accessToken?: string,
): Promise<GitHubAPI.PullComments> {
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}/pulls/${pullId}/comments`
  return await request(url, { accessToken })
}

export async function getPullPageDocuments(
  userName: string,
  repoName: string,
  pullId: string,
): Promise<Document[]> {
  // Response of this API contains view of few files but is not complete.
  const filesDOM = await getDOM(
    `https://${window.location.host}/${userName}/${repoName}/pull/${pullId}/files?_pjax=%23js-repo-pjax-container`,
  )
  const hookElement: HTMLDivElement | null = filesDOM.querySelector('div.js-pull-refresh-on-pjax')
  const hookSearchParams = new URLSearchParams(hookElement?.dataset.url)
  const [baseSHA, headSHA] = [
    hookSearchParams.get('start_commit_oid'),
    hookSearchParams.get('end_commit_oid'),
  ]
  if (!baseSHA || !headSHA) throw new Error(`Cannot fetch SHA for comparison`)

  // The SHA used to be retrieved from DOM of the pull page, but they can be unreliable if the PR has conflicts
  const search = new URLSearchParams(window.location.search)
  search.set('sha1', baseSHA)
  search.set('sha2', headSHA)
  let lines = 0
  const diffsDOMs: Document[] = []
  while (true) {
    search.set('lines', lines.toString())
    const diffsDOM = await getDOM(
      `https://${window.location.host}/${userName}/${repoName}/diffs?${search}`,
    )
    diffsDOMs.push(diffsDOM)

    if (diffsDOM.querySelector('.js-diff-progressive-container')) {
      lines += 3000
    } else {
      break
    }
  }
  return diffsDOMs
}

export async function getCommitPageDocuments(
  userName: string,
  repoName: string,
  commitId: string,
): Promise<Document[]> {
  /**
   *  <include-fragment
   *    src="/EnixCoda/Gitako/diffs?bytes=444&amp;commentable=true&amp;commit=7de4488d7f00630512e0d494bab209004f2d4a58&amp;lines=202&amp;responsive=true&amp;sha1=022dd1736146a350f1564c40d28234973d47bafc&amp;sha2=7de4488d7f00630512e0d494bab209004f2d4a58&amp;start_entry=1&amp;sticky=false&amp;w=false"
   *    class="diff-progressive-loader js-diff-progressive-loader mb-4 d-flex flex-items-center flex-justify-center"
   *    data-targets="diff-file-filter.progressiveLoaders"
   *    data-action="include-fragment-replace:diff-file-filter#refilterAfterAsyncLoad"
   *  >
   */
  const fragmentSelector = 'include-fragment[data-targets="diff-file-filter.progressiveLoaders"]'

  let doc = document
  const documents: Document[] = [doc]
  while (true) {
    const fragment = doc.querySelector(fragmentSelector) as HTMLElement
    if (!fragment) break
    const src = fragment.getAttribute('src')
    if (!src) break
    const nextDoc = await getDOM(src)
    documents.push(nextDoc)
    doc = nextDoc
  }

  return documents
}

async function getDOM(url: string) {
  return new DOMParser().parseFromString(await (await fetch(url)).text(), 'text/html')
}

export async function getBlobData(
  userName: string,
  repoName: string,
  sha: string,
  accessToken?: string,
): Promise<GitHubAPI.BlobData> {
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}/git/blobs/${sha}`
  return await request(url, { accessToken })
}

export async function OAuth(code: string): Promise<string | null> {
  try {
    const endpoint = `https://gitako.enix.one/oauth/github?`
    const res = await fetch(endpoint + new URLSearchParams({ code }).toString(), {
      method: 'post',
    })
    if (res.ok) {
      const body = await res.json()
      const accessToken = body?.accessToken
      if (typeof accessToken === 'string') return accessToken
    }
    return null
  } catch (err) {
    return null
  }
}

export async function getCommitTreeData(
  userName: string,
  repoName: string,
  sha: string,
  page: number = 1,
  accessToken?: string,
): Promise<Response> {
  const search = new URLSearchParams({
    per_page: '100',
    page: `${page}`,
  })
  const url = `https://${API_ENDPOINT}/repos/${userName}/${repoName}/commits/${sha}?` + search
  return await request(url, { accessToken, resolveMode: 'response' })
}
