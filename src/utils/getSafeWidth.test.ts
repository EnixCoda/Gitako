import { getSafeWidth, MINIMAL_CONTENT_VIEWPORT_WIDTH, MINIMAL_WIDTH } from './getSafeWidth'

it(`should shrink when window is being resized smaller`, () => {
  const randomGrow = 100 * Math.random()
  expect(
    getSafeWidth(
      MINIMAL_WIDTH + MINIMAL_CONTENT_VIEWPORT_WIDTH + randomGrow * 2,
      MINIMAL_WIDTH + MINIMAL_CONTENT_VIEWPORT_WIDTH + randomGrow,
    ),
  ).toBe(MINIMAL_WIDTH + randomGrow)
})

it(`should not shrink when window is being resized smaller than minimal size`, () => {
  const randomGrow = 100 * Math.random()
  expect(getSafeWidth(0, MINIMAL_WIDTH + MINIMAL_CONTENT_VIEWPORT_WIDTH - randomGrow)).toBe(
    MINIMAL_WIDTH,
  )
})

it(`should return user-preferred size if not reaching bounds`, () => {
  const randomGrow = 100 * Math.random()
  expect(
    getSafeWidth(
      MINIMAL_WIDTH + randomGrow,
      MINIMAL_WIDTH + MINIMAL_CONTENT_VIEWPORT_WIDTH + randomGrow * 2,
    ),
  ).toBe(MINIMAL_WIDTH + randomGrow)
})
