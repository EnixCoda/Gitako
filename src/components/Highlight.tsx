import * as React from 'react'

export const Highlight = React.memo(function Highlight(props: {
  text: string
  match?: RegExp | string
}) {
  const { text, match } = props
  const $match = React.useMemo(() => {
    if (match) {
      if (match instanceof RegExp) {
        if (match.flags.includes('g')) return match
        return new RegExp(match.source, 'g' + match.flags)
      }
      return new RegExp(match, 'g')
    }
    return null
  }, [match])

  const chunks = useChunks(text, $match)

  return <>{chunks.map(([type, text], key) => React.createElement(type, { key }, text))}</>
})

function useChunks(text: string, $match: RegExp | null) {
  const contents: [string, string][] = []
  if ($match === null) return [['span', text]]

  const matchedPieces = Array.from(text.matchAll($match)).map(
    ([text, highlightText = text]) => highlightText,
  )
  const preservedPieces = text.split($match)

  const push = (type: string, text: string) => {
    if (!text) return
    const last = contents[contents.length - 1]
    if (last && last[0] === type) last[1] += text
    else contents.push([type, text])
  }

  let i = 0
  while (i < Math.max(matchedPieces.length, preservedPieces.length)) {
    push('span', preservedPieces[i])
    push('mark', matchedPieces[i])
    ++i
  }
  return contents
}
