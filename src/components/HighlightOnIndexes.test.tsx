import { render } from '@testing-library/react'
import React from 'react'
import { is } from 'utils/is'
import { HighlightOnIndexes } from './HighlightOnIndexes'

function test(title: string, text: string, indexes?: number[]) {
  it(title, () => {
    expect(render(<HighlightOnIndexes text={text} indexes={indexes} />).container.textContent).toBe(
      text,
    )
  })
}

const text = 'abcdef'
for (let i = 0; i < Math.pow(2, text.length); i++) {
  const bitwise = i.toString(2)
  const indexes = bitwise
    .split('')
    .reverse()
    .map((bit, index) => (bit === '1' ? index : false))
    .filter(is.not.false)
  test(
    `renders properly when highlight ${bitwise.padStart(text.length, '0')}, indexes [${indexes}]`,
    text,
    indexes,
  )
}
