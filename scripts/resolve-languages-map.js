const path = require('path')
const fs = require('fs').promises
const typescript = require('typescript')
const { emitDirPath, checkEmitDir } = require('./check-emit-dir')

const files = [path.resolve(__dirname, '..', 'vscode-icons/src/iconsManifest/languages.ts')]

const options = {
  module: typescript.ModuleKind.CommonJS,
  target: typescript.ScriptTarget.ES2015,
  strict: true,
  suppressOutputPathCheck: false,
}

async function main() {
  await checkEmitDir()

  const compilerHost = typescript.createCompilerHost(options)
  compilerHost.writeFile = async (fileName, data, writeByteOrderMark, onError, sourceFiles) => {
    if (sourceFiles.some(file => files.includes(file.fileName))) {
      await fs.writeFile(path.resolve(emitDirPath, path.basename(fileName)), data)
      console.log(`Emitted`, fileName)
    } else {
      console.log(`Skipped`, fileName)
    }
  }

  const program = typescript.createProgram(files, options, compilerHost)
  program.emit()
}

main()
