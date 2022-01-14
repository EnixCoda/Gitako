const path = require('path')
const { promises: fs, existsSync } = require('fs')
const puppeteer = require('puppeteer')
const generateFileIconIndex = require('./generate-file-icon-index')
const generateFolderIconIndex = require('./generate-folder-icon-index')
const { emitDirPath, checkEmitDir } = require('./check-emit-dir')

let browser
async function getPage() {
  const headless = process.env.HEADLESS !== 'false'
  browser = browser || (await puppeteer.launch({ headless }))
  return await browser.newPage()
}

async function generateCSV() {
  await checkEmitDir()

  await Promise.all(
    [generateFileIconIndex, generateFolderIconIndex].map(
      async ({ fileName, link, parsePageContent, prepareCSV }) => {
        let records
        const emitJSONPath = path.resolve(emitDirPath, fileName + '.json')
        if (!existsSync(emitJSONPath)) {
          const page = await getPage()
          await page.goto(link)
          records = await page.evaluate(parsePageContent)
          await page.close()
          await fs.writeFile(emitJSONPath, JSON.stringify(records))
        } else {
          records = require(emitJSONPath)
        }

        const rowSeparator = '\n'
        const columnSeparator = ','
        const csv = records.map(prepareCSV)

        const emitPath = path.resolve(__dirname, '..', 'src/assets/icons')
        await fs.writeFile(
          path.resolve(emitPath, fileName + '.csv'),
          csv.map(cols => cols.join(columnSeparator)).join(rowSeparator),
        )
      },
    ),
  )

  if (browser) await browser.close()
}

generateCSV()
