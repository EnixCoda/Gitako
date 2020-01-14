describe(`in GitHub homepage`, () => {
  beforeAll(() => page.goto('https://github.com'))

  it('should not render Gitako', async () => {
    await page.waitForSelector('.gitako-side-bar .gitako-position-wrapper', { hidden: true })
  })
})
