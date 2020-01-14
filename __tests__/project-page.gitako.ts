describe(`in Gitako project page`, () => {
  beforeAll(() => page.goto('https://github.com/EnixCoda/Gitako'))

  it('should render Gitako', async () => {
    await page.waitForSelector('.gitako-side-bar .gitako-position-wrapper', { visible: true })
  })
})
