const octicons = require('octicons')
const fs = require('fs')
const path = require('path')

const pathToIconsFolder = path.resolve(__dirname, `../src/assets/icons/octicons`)

function generateIconSVGFiles() {
  Object.values(octicons).forEach(icon => {
    fs.writeFile(
      `${pathToIconsFolder}/${icon.symbol}.svg`,
      icon.toSVG({ xmlns: 'http://www.w3.org/2000/svg' }),
      err => {
        if (err) throw err
      }
    )
  })
}

fs.exists(pathToIconsFolder, exists => {
  if (exists) {
    fs.lstat(pathToIconsFolder, (err, stats) => {
      if (err) throw err
      if (!stats.isDirectory()) {
        throw new Error(`${pathToIconsFolder} is not a folder!`)
      }
      generateIconSVGFiles()
    })
  } else {
    fs.mkdir(pathToIconsFolder, err => {
      if (err) throw err
      generateIconSVGFiles()
    })
  }
})
