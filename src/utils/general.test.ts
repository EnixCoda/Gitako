import { atomicAsyncFunction, resolveDiffGraphMeta } from './general'

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

it(`should schedule atomic promises properly`, async () => {
  const sleep = (duration: number) => new Promise(resolve => setTimeout(resolve, duration))

  const recorder: string[] = []
  const sleepWithNoise = async (duration: number, noise: string) => {
    await sleep(duration)
    recorder.push(noise)
    return noise
  }

  const atomicSleep = atomicAsyncFunction(sleepWithNoise)

  recorder.length = 0
  const atomicReturns = await Promise.all([atomicSleep(200, 'a'), atomicSleep(100, 'b')])
  // Expected time sheet
  // 0        100      200      300
  // [a                ]
  //                   [b       ]
  // Recorder: [a, b]
  //
  expect(recorder).toEqual(['a', 'b'])
  expect(atomicReturns).toEqual(['a', 'b'])

  recorder.length = 0
  const normalReturns = await Promise.all([sleepWithNoise(200, 'a'), sleepWithNoise(100, 'b')])
  // Time sheet if not atomic
  // 0        100      200
  // [a                ]
  // [b       ]
  // Recorder: [b, a]
  expect(recorder).toEqual(['b', 'a'])
  expect(normalReturns).toEqual(['a', 'b'])
})
