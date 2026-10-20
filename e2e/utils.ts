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
  const promise = page
    .evaluate(() => {
      return new Promise<void>(resolve => {
        const onEvent = () => {
          document.removeEventListener('pjax:end', onEvent)
          resolve()
        }
        document.addEventListener('pjax:end', onEvent)
      })
    })
    .catch(() => page.waitForLoadState('load').catch(() => {}))
  await action?.()
  return promise
}

export async function waitForTurboRedirect(page: Page, action?: () => void | Promise<void>) {
  const promise = page
    .evaluate(() => {
      return new Promise<void>(resolve => {
        const onEvent = () => {
          document.removeEventListener('turbo:load', onEvent)
          resolve()
        }
        document.addEventListener('turbo:load', onEvent)
      })
    })
    .catch(() => page.waitForLoadState('load').catch(() => {}))
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

/**
 * Switch branch the way a user does — open GitHub's branch/ref picker, filter
 * to the branch, and choose it. This is deliberately NOT `Turbo.visit(...)`:
 * the specs must drive the real control a person uses so they work whether
 * GitHub soft-navigates (Turbo present) or does a full page load (modern
 * Feature-Preview cohort OFF). Assumes we're on a repo code page, where
 * `#ref-picker-repos-header-ref-selector` is the current-branch selector.
 * Callers assert the resulting URL/ref themselves.
 */
export async function switchBranchViaPicker(page: Page, branchName: string) {
  await page.locator('#ref-picker-repos-header-ref-selector').first().click()
  // The dialog's filter field; wait for it before typing (loads lazily).
  // GitHub ships the placeholder as "Find a branch..." on the legacy floor and
  // "Find or create a branch..." on the modern floor — match both.
  const filter = page.getByPlaceholder(/^Find( or create)? a branch/)
  await filter.waitFor({ timeout: 10000 })
  await filter.fill(branchName)
  const match = page.getByRole('menuitemradio', {
    name: new RegExp(`^${branchName}$`),
  })
  await match.waitFor({ timeout: 10000 })
  await match.click()
}

/**
 * Click the repo-level Issues / "Pull requests" nav tab the way a user does.
 * Floor-agnostic: GitHub only puts `data-turbo-frame` on these links when
 * soft-navigation (Turbo) is enabled, so match by the visible label instead of
 * the turbo-frame attribute — the link is present at both the modern (all-ON)
 * and legacy (all-OFF) floors.
 */
export async function clickRepoNavTab(page: Page, label: 'Issues' | 'Pull requests') {
  await page
    .getByRole('link', { name: new RegExp(`^${label}`) })
    .first()
    .click()
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
