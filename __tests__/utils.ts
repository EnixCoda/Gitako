export async function expectToFind(selector: string) {
  await expect(page.waitForSelector(selector)).resolves.not.toBeNull()
}

export async function expectToNotFind(selector: string) {
  await expect(page.waitForSelector(selector, { timeout: 1000 })).rejects.toThrow()
}

export function sleep(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

export async function scroll({
  totalDistance,
  step = 1,
  duration = 500,
}: {
  totalDistance: number
  step?: number
  duration?: number
}) {
  let distance = 0
  while ((distance += step) < totalDistance) {
    await (page.mouse as any).wheel({ deltaY: step })
    await sleep((duration * step) / totalDistance)
  }
}
