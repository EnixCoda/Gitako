/**
 * Resolved from response header `link`
 *
 * Example:
 * <https://api.github.com/repositories/112069171/commits/7de4488d7f00630512e0d494bab209004f2d4a58?per_page=100&page=2>; rel="next", <https://api.github.com/repositories/112069171/commits/7de4488d7f00630512e0d494bab209004f2d4a58?per_page=100&page=2>; rel="last"
 *
 * `rel` existence
 *
 * rel  | first page | middle page | last page
 * next |     ✔      |      ✔      |
 * last |     ✔      |      ✔      |
 * prev |            |      ✔      |     ✔
 * first|            |      ✔      |     ✔
 *
 * If there is only 1 page, no `link` header is returned.
 */
type Rels = {
  next?: string
  last?: string
  prev?: string
  first?: string
}

export function resolveHeaderLink(raw: string) {
  const rels: Rels = {}
  raw
    .split(',')
    .map(part => part.match(/<(.*?)>; *rel="(.*?)"/))
    .filter((link: RegExpMatchArray | null): link is RegExpMatchArray => !!link)
    .forEach(([, url, rel]) => {
      // It's 2022, is there a smarter way to do this in TS?
      switch (rel) {
        case 'next':
          rels.next = url
          break
        case 'last':
          rels.last = url
          break
        case 'prev':
          rels.prev = url
          break
        case 'first':
          rels.first = url
          break
      }
    })

  if (rels.next && rels.last && !rels.prev && !rels.first) {
    // first page
    return {
      next: rels.next,
      last: rels.last,
      position: 'first' as const,
    }
  } else if (rels.next && rels.last && rels.prev && rels.first) {
    // middle page
    return {
      next: rels.next,
      last: rels.last,
      prev: rels.prev,
      first: rels.first,
      position: 'middle' as const,
    }
  } else if (!rels.next && !rels.last && rels.prev && rels.first) {
    // last page
    return {
      prev: rels.prev,
      first: rels.first,
      position: 'last' as const,
    }
  } else {
    // unexpected link header content
    return
  }
}

export async function getDOM(url: string) {
  return new DOMParser().parseFromString(await (await fetch(url)).text(), 'text/html')
}

export async function continuousLoadPages(doc: Document, onReceivePage?: (doc: Document) => void) {
  /**
   *  <include-fragment
   *    src="..."
   *    class="diff-progressive-loader js-diff-progressive-loader mb-4 d-flex flex-items-center flex-justify-center"
   *    data-targets="diff-file-filter.progressiveLoaders"
   *    data-action="include-fragment-replace:diff-file-filter#refilterAfterAsyncLoad"
   *  >
   */
  const fragmentSelector = 'include-fragment[data-targets="diff-file-filter.progressiveLoaders"]'
  const documents: Document[] = [doc]
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const fragment = doc.querySelector(fragmentSelector) as HTMLElement
    if (!fragment) break
    const src = fragment.getAttribute('src')
    if (!src) break
    doc = await getDOM(src)
    documents.push(doc)
    onReceivePage?.(doc)
  }
  return documents
}

export function getCommentsMap(commentData: GitHubAPI.PullComments) {
  const commentsMap = new Map<
    string,
    {
      active: number
      resolved: number
    }
  >()
  commentData.forEach(comment => {
    let stat = commentsMap.get(comment.path)
    if (!stat) {
      stat = {
        active: 0,
        resolved: 0,
      }
      commentsMap.set(comment.path, stat)
    }

    if (comment.position === null) stat.active++
    else stat.resolved++
  })
  return commentsMap
}
