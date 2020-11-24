import { Page } from 'puppeteer'

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

export function assert(condition: boolean, err?: Error | string) {
  if (!condition) throw typeof err === 'string' ? new Error(err) : err
}

let counter = 0
export async function listenTo<Args extends any[] = any[]>(
  event: string,
  target: 'document' | 'window',
  callback: (...args: Args) => void,
  oneTime?: boolean,
) {
  const callbackName = 'onEvent' + ++counter
  await page.exposeFunction(callbackName, callback)
  await page.evaluate(
    (event, target, callbackName, oneTime) => {
      const t = target === 'document' ? document : window
      const onEvent = (...args: any[]): void => {
        ;((window[callbackName as any] as any) as (...args: any[]) => void)(...args)
        if (oneTime) t.removeEventListener(event, onEvent)
      }
      t.addEventListener(event, onEvent)
    },
    event,
    target,
    callbackName,
    oneTime || false,
  )
}

export function once(event: string, target: 'document' | 'window') {
  return new Promise(resolve => {
    listenTo(
      event,
      target,
      (...args) => {
        resolve(args)
      },
      true,
    )
  })
}

export function waitForLegacyPJAXRedirect() {
  return once('pjax:end', 'document')
}

export function waitForPJAXAPIRedirect() {
  return once('pjax:ready', 'document')
}

export function selectFileTreeItem(path: string): string {
  return `.gitako-side-bar .files a[title="${path}"]`
}

export async function patientClick(page: Page, selector: string) {
  await page.waitForSelector(selector)
  await page.click(selector)
}
