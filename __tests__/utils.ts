export async function expectToFind(selector: string) {
  await expect(await page.waitForSelector(selector)).not.toBeNull()
}

export async function expectToNotFind(selector: string) {
  await expect(page.waitForSelector(selector, { timeout: 1000 })).rejects.toThrow()
}
