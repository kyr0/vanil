import { readdirSync } from 'fs'
import * as colors from 'kleur/colors'
import { join } from 'path'
import shelljs from 'shelljs'

export const ignoredPaths = [
  '.DS_Store',
  'Thumbs.db',
  '.git',
  '.gitignore',
  '.idea',
  'README.md',
  'LICENSE',
  '.hg',
  '.hgignore',
  '.hgcheck',
  '.npmignore',
  'mkdocs.yml',
  '.travis.yml',
  '.gitlab-ci.yml',
  '.gitattributes',
]

export const logFiles = ['npm-debug.log', 'yarn-error.log', 'yarn-debug.log']

export const createProjectFolder = (
  projectPath: string,
  projectName: string,
  folderAlreadyExist: boolean = false,
): boolean => {
  if (!folderAlreadyExist) {
    // create shallow directory structure
    shelljs.mkdir('-p', projectPath)
  }

  if (!isSafeToCreateAppIn(projectPath, projectName)) {
    return false
  }

  console.log(`Creating a new Vanil project in ${colors.green(projectPath)}.`)

  return true
}

export const isSafeToCreateAppIn = async (rootPath: string, name: string) => {
  console.log()
  const conflicts = readdirSync(rootPath)
    .filter((file: string) => !ignoredPaths.includes(file))
    // IntelliJ IDEA creates module files before CRA is launched
    .filter((file: string) => !/\.iml$/.test(file))
    // Don't treat log files from previous installation as conflicts
    .filter((file: string) => !logFiles.some((pattern) => file.indexOf(pattern) === 0))

  if (conflicts.length > 0) {
    console.log(`The directory ${colors.green(name)} contains files that could conflict:`)
    console.log()
    for (const file of conflicts) {
      console.log(colors.red(`  ${file}`))
    }
    console.log()
    console.log('Either try using a new directory name, or remove the files listed above.')

    process.exit(1)
  }

  // Remove any remnant files from a previous installation
  const currentFiles = readdirSync(join(rootPath))
  for (let i = 0; i < currentFiles.length; i++) {
    const file = currentFiles[i]
    if (logFiles.find((errorLogFilePattern: string) => file.indexOf(errorLogFilePattern) === 0)) {
      shelljs.rm('-rf', join(rootPath, file))
    }
  }
  return true
}
