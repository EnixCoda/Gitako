import * as React from 'react'

export function HighlightOnIndexes({ text, indexes = [] }: { text: string; indexes?: number[] }) {
  return (
    <>
      {[-1]
        .concat(indexes)
        .map((index, i, arr) => [
          index === -1 ? '' : text.slice(index, index + 1),
          text.slice(index + 1, arr[i + 1]),
        ])
        .reduce((arr, pair) => {
          const last = arr[arr.length - 1]
          if (last && !last[1]) {
            last[0] += pair[0]
            last[1] += pair[1]
          } else {
            arr.push(pair)
          }
          return arr
        }, [] as string[][])
        .map(([chunk, nextChunk], i) => [
          chunk && <mark key={i * 2}>{chunk}</mark>,
          nextChunk && <span key={i * 2 + 1}>{nextChunk}</span>,
        ])}
    </>
  )
}
