import * as React from 'react'

export function Highlight(props: { text: string; match?: RegExp }) {
  const { text, match } = props
  const $match = React.useMemo(() => {
    if (match instanceof RegExp) {
      if (match.flags.includes('g')) return match
      return new RegExp(match.source, 'g' + match.flags)
    }
    return null
  }, [match])

  if (!($match instanceof RegExp) || typeof text !== 'string') return <>{text}</>

  const matchedPieces = Array.from(text.matchAll($match)).map(([text]) => text)
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
