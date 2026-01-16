import type { Page } from '@playwright/test'

export function sleep(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

export async function scroll(
  page: Page,
  {
    totalDistance,
    stepDistance = 100,
  }: {
    totalDistance: number
    stepDistance?: number
  },
) {
  let distance = 0
  while ((distance += stepDistance) < totalDistance) {
    await page.mouse.wheel(0, stepDistance)
  }
}

export function assert(condition: boolean, err?: Error | string): asserts condition {
  if (!condition) throw typeof err === 'string' ? new Error(err) : err
}

export async function waitForLegacyPJAXRedirect(page: Page, action?: () => void | Promise<void>) {
  const promise = page.evaluate(() => {
    return new Promise<void>(resolve => {
      const onEvent = () => {
        document.removeEventListener('pjax:end', onEvent)
        resolve()
      }
      document.addEventListener('pjax:end', onEvent)
    })
  })
  await action?.()
  return promise
}

export async function waitForTurboRedirect(page: Page, action?: () => void | Promise<void>) {
  const promise = page.evaluate(() => {
    return new Promise<void>(resolve => {
      const onEvent = () => {
        document.removeEventListener('turbo:load', onEvent)
        resolve()
      }
      document.addEventListener('turbo:load', onEvent)
    })
  })
  await action?.()
  return promise
}

export async function waitForRedirect(page: Page, action?: () => void | Promise<void>) {
  let fired = false
  const $action =
    action &&
    (() => {
      if (fired) return
      fired = true
      return action()
    })

  return Promise.race([
    waitForLegacyPJAXRedirect(page, $action),
    waitForTurboRedirect(page, $action),
    sleep(3 * 1000),
  ])
}

export async function patientClick(page: Page, selector: string) {
  await page.waitForSelector(selector)
  await page.click(selector)
}

export async function expandFloatModeSidebar(page: Page) {
  const button = page.locator('.gitako-toggle-show-button')
  const rect = await button.boundingBox()
  if (rect) {
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
    await sleep(500)
  }
}

export async function collapseFloatModeSidebar(page: Page) {
  await page.mouse.move(600, 600, {
    steps: 100,
  })
  await sleep(500)
}

export async function getTextContent(
  page: Page,
  query: string,
): Promise<string | null | undefined> {
  return page.evaluate((query: string) => document.querySelector(query)?.textContent, query)
}
