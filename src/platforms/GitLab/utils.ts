/**
 * Resolved from response header `link`
 *
 * Example:
 * <https://gitlab.com/api/v4/projects/gitlab-com%2Fwww-gitlab-com/repository/tree?id=gitlab-com%2Fwww-gitlab-com&page=2&pagination=legacy&path=&per_page=100&recursive=true&ref=master>; rel="next",\
 * <https://gitlab.com/api/v4/projects/gitlab-com%2Fwww-gitlab-com/repository/tree?id=gitlab-com%2Fwww-gitlab-com&page=1&pagination=legacy&path=&per_page=100&recursive=true&ref=master>; rel="first",\
 * <https://gitlab.com/api/v4/projects/gitlab-com%2Fwww-gitlab-com/repository/tree?id=gitlab-com%2Fwww-gitlab-com&page=308&pagination=legacy&path=&per_page=100&recursive=true&ref=master>; rel="last"
 *
 * `rel` existence
 *
 * rel  | first page | middle page | last page
 * first|     ✔      |      ✔      |     ✔
 * last |     ✔      |      ✔      |     ✔
 * next |     ✔      |      ✔      |
 * prev |            |      ✔      |     ✔
 *
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

  if (rels.next && rels.last && !rels.prev && rels.first) {
    // first page
    return {
      first: rels.first,
      last: rels.last,
      next: rels.next,
      position: 'first' as const,
    }
  } else if (rels.next && rels.last && rels.prev && rels.first) {
    // middle page
    return {
      first: rels.first,
      last: rels.last,
      next: rels.next,
      prev: rels.prev,
      position: 'middle' as const,
    }
  } else if (!rels.next && !rels.last && rels.prev && rels.first) {
    // last page
    return {
      first: rels.first,
      last: rels.last,
      prev: rels.prev,
      position: 'last' as const,
    }
  } else {
    // unexpected link header content
    return
  }
}
