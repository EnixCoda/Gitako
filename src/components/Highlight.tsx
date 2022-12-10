import * as React from 'react'

export const Highlight = function Highlight({ text, match }: { text: string; match?: RegExp }) {
  const $match = React.useMemo(
    () =>
      match instanceof RegExp
        ? match.flags.includes('g')
          ? match
          : new RegExp(match.source, 'g' + match.flags)
        : null,
    [match],
  )

  const chunks = React.useMemo(() => getChunks(text, $match), [text, $match])

  return <>{chunks.map(([type, text], key) => React.createElement(type, { key }, text))}</>
}

type ElementMeta = [tag: string, content: string]
function getChunks(text: string, match: RegExp | null): ElementMeta[] {
  const contents: ElementMeta[] = []

  if (match === null) {
    contents.push(['span', text])
    return contents
  }

  const matchedPieces = Array.from(text.matchAll(match)).map(
    ([text, highlightText = text]) => highlightText,
  )
  const preservedPieces = text.split(match)

  const push = (type: string, text: string) => {
    const last = contents[contents.length - 1]
    if (last && last[0] === type) last[1] += text
    else contents.push([type, text])
  }

  const max = Math.max(matchedPieces.length, preservedPieces.length)
  for (let i = 0; i < max; ++i) {
    preservedPieces[i] && push('span', preservedPieces[i])
    matchedPieces[i] && push('mark', matchedPieces[i])
  }
  return contents
}
