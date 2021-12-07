import { readdirSync, statSync } from 'fs'
import { sep } from 'path'
import { copyAndMaterializeFile } from './copyAndMaterializeFile'

const ignoredDirs = ['.git', 'node_modules', 'dist']

const getFiles = (dir: string, tplBaseDir: string, fileDiscoveredCb: (filePath: string) => void) => {
  for (let i = 0; i < ignoredDirs.length; i++) {
    const ignoredDirectoryCandiate = ignoredDirs[i]
    if (dir.replace(`${tplBaseDir}${sep}`, '').startsWith(ignoredDirectoryCandiate) || dir.indexOf('.DS_Store') > -1) {
      return
    }
  }

  const files = readdirSync(dir)
  for (const i in files) {
    const path = dir + sep + files[i]
    if (statSync(path).isDirectory()) {
      getFiles(path, tplBaseDir, fileDiscoveredCb)
    } else {
      fileDiscoveredCb(path)
    }
  }
}

export const copyTemplate = (projectPath: string, templateFolderPath: string, concreteName: string): boolean => {
  console.log()
  console.log('Creating files:')
  getFiles(templateFolderPath, templateFolderPath, (filePath: string) =>
    copyAndMaterializeFile({
      filePath,
      templateFolderPath,
      projectPath,
      concreteName,
    }),
  )
  return true
}
