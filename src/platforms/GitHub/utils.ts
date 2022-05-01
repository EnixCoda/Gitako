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
