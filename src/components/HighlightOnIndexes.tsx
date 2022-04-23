import * as React from 'react'

export function HighlightOnIndexes(props: { text: string; indexes?: number[] }) {
  const { text, indexes } = props

  if (!indexes?.length) return <>{text}</>

  return (
    <>
      {text
        .split('')
        .map((char, i) =>
          indexes.includes(i) ? <mark key={i}>{char}</mark> : <span key={i}>{char}</span>,
        )}
    </>
  )
}
