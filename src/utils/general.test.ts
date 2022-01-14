import { resolveDiffGraphMeta } from './general'

it(`should resolve diff stat graph meta properly`, () => {
  const example = `
    2 10 0 4
    3 10 1 3
    3 17 0 4
    4 17 0 4
    4 26 0 4
    5 17 1 3
    6 17 1 3
   12  0 5 0
    0 12 0 5
   17 74 0 4
   11 23 1 3
   18 28 1 3
   34 24 2 2
  `

  example
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length)
    .map(line => line.split(/\s+/).map(_ => parseInt(_)))
    .forEach(([additions, deletions, g, r]) => {
      const meta = resolveDiffGraphMeta(additions, deletions, additions + deletions)
      expect([meta.g, meta.r]).toEqual([g, r])
    })
})
