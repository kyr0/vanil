import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { Context } from '../@types'
import * as inquirer from 'inquirer'
import * as colors from 'kleur/colors'
import { printFooter } from './printFooter'
import { execSync } from 'child_process'
import { createProjectFolder } from './createProjectFolder'
import { cloneRepository } from './cloneRepository'
import { validateProjectDirectoryInput } from './validateProjectDirectoryInput'
import { installModules } from './installModules'
import { copyTemplate } from './copyTemplate'

/** creates a new project from a template named (default: examples/init), given a projectName */
export const createProject = async (context: Context, tplName: string = 'init', projectName?: string) => {
  if (!tplName) {
    console.log('[!!] Error: No template argument provided. Make sure you provide -t $templateFolderOrGitUrl. Exiting.')
    process.exit(1)
  }

  const isGitRepo = tplName.startsWith('http')

  if (isGitRepo) {
    tplName = await cloneRepository(tplName)
  } else if (!existsSync(tplName)) {
    console.log(`[!!] Error: The template ${tplName} doesn't exist. Exiting.`)
    process.exit(1)
  }

  if (!projectName) {
    // get project directory name
    const choiceProjectName = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: `Please specify the project name (e.g. ${colors.cyan('MyProject')}):`,
        validate: validateProjectDirectoryInput,
      },
    ])
    projectName = choiceProjectName.projectName
  }

  const projectPathName = projectName!.toLowerCase()
  const root = resolve(projectPathName)
  const folderAlreadyExist = existsSync(root)

  if (folderAlreadyExist) {
    const shouldOverride = await inquirer.prompt([
      {
        type: 'confirm',
        default: false,
        name: 'answer',
        message: 'The chosen directory already exists. Are you sure that you want to override it?',
      },
    ])

    if (!shouldOverride.answer) {
      return false
    }
  }

  const projectPath = join(process.cwd(), projectPathName)

  if (!createProjectFolder(projectPath, projectPathName, folderAlreadyExist)) {
    return false
  }
  const packageJSON: { dependencies: any; devDependencies: any } = JSON.parse(
    readFileSync(join(tplName, 'package.json'), { encoding: 'utf8' }),
  )

  const dependenciesAsString: Array<string> = transformPackageDependenciesToStrings(packageJSON, 'dependencies')
  const devDependenciesAsString: Array<string> = transformPackageDependenciesToStrings(packageJSON, 'devDependencies')

  if (!copyTemplate(projectPath, tplName, projectName!)) {
    return false
  }

  if (isGitRepo) {
    execSync(`rm -rf ${tplName}`, {
      stdio: 'inherit',
    })
  }

  if (!(await installModules(projectPath, dependenciesAsString, devDependenciesAsString))) {
    return false
  }

  const packageJson: { homepage: string; bugs: { url: string } } = JSON.parse(
    readFileSync(resolve(__dirname, '../../package.json'), { encoding: 'utf8' }),
  )
  printFooter(packageJson.homepage, projectPath, packageJson.bugs.url)
}

const transformPackageDependenciesToStrings = (packageJson: any, key: string): Array<string> => {
  const dependencies: Array<string> = []
  for (const dependencyName in packageJson[key]) {
    dependencies.push(`${dependencyName}@${packageJson[key][dependencyName]}`)
  }
  return dependencies
}
