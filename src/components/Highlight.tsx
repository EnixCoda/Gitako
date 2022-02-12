import * as React from 'react'

export function Highlight(props: { text: string; match?: RegExp | string }) {
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

  if (!$match) return <>{text}</>

  const matchedPieces = Array.from(text.matchAll($match)).map(
    ([text, highlightText = text]) => highlightText,
  )
  const preservedPieces = text.split($match)
  const content = []

  let i = 0
  while (matchedPieces.length || preservedPieces.length) {
    if (preservedPieces.length) {
      content.push(<span key={i++}>{preservedPieces.shift()}</span>)
    }
    if (matchedPieces.length) {
      content.push(<mark key={i++}>{matchedPieces.shift()}</mark>)
    }
  }

  return <>{content}</>
}
