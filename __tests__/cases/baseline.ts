/**
 * Make sure some basic behaviors of puppeteer assertions
 */

import { expectToFind, expectToNotFind } from '../utils'

describe(`in random page`, () => {
  beforeAll(() => page.goto('https://google.com'))

  it('wait for hidden non-exist element should resolve null', async () => {
    expect(
      await page.waitForSelector('.non-exist-element', { hidden: true, timeout: 1000 }),
    ).toBeNull()
  })

  it('wait for exist element', async () => {
    expectToFind('*')
  })

  it('wait for exist element', async () => {
    expectToNotFind('.non-exist-element')
  })

  it('wait for non-exist element reject should throw', async () => {
    await expect(page.waitForSelector('.non-exist-element', { timeout: 1000 })).rejects.toThrow()
  })

  // Cases below are expected to fail to show how async test works

  // // This is expected to fail!
  // it('wait for non-exist element reject should not throw', async () => {
  //   await expect(
  //     page.waitForSelector('.non-exist-element', { timeout: 1000 }),
  //   ).rejects.not.toThrow()
  // })

  // // This is expected to fail!
  // it('wait for non-exist element should resolve throw', async () => {
  //   await expect(page.waitForSelector('.non-exist-element', { timeout: 1000 })).resolves.toThrow()
  // })

  // // This is expected to fail!
  // it('wait for non-exist element should resolve not throw', async () => {
  //   await expect(
  //     page.waitForSelector('.non-exist-element', { timeout: 1000 }),
  //   ).resolves.not.toThrow()
  // })
})
