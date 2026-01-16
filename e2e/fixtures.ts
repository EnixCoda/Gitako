import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test'
import path from 'path'

const EXTENSION_PATH = path.resolve(__dirname, '..', 'dist')

export const test = base.extend<{
  context: BrowserContext
  extensionPage: Page
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--no-sandbox`,
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    })
    await use(context)
    await context.close()
  },
  extensionPage: async ({ context }, use) => {
    const page = await context.newPage()
    await use(page)
  },
})

export const expect = test.expect
