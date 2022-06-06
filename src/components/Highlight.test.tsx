import { render } from '@testing-library/react'
import React, { ComponentProps } from 'react'
import { Highlight } from './Highlight'

function test(title: string, text: string, match?: ComponentProps<typeof Highlight>['match']) {
  it(title, () => {
    expect(render(<Highlight text={text} match={match} />).container.textContent).toBe(text)
  })
}

test('sample', 'abc', undefined)
test('sample', 'abc', /./)
test('sample', 'abc', /../)
test('sample', 'abc', /.../)
test('sample', 'abc', /..../)
