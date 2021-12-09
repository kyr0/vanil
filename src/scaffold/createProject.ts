import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
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
export const createProject = async (tplDir: string, destDir: string, projectName?: string) => {
  if (!tplDir) {
    console.log(
      colors.yellow(
        '[??] WARN: No template path/git repo specified. You can set it easily by adding --tpl $pathToTplOrGitRepo',
      ),
    )
    // fall-back to bundled "init" template
    tplDir = resolve(__dirname, '../../examples/init')
  }

  const isGitRepo = tplDir.startsWith('http')

  if (isGitRepo) {
    tplDir = await cloneRepository(tplDir)
  } else if (!existsSync(tplDir)) {
    console.log(colors.red(`[!!] Error: The template ${tplDir} doesn't exist. Exiting.`))
    process.exit(1)
  }

  if (!projectName) {
    // get project directory name
    const choiceProjectName = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        default: 'MyVanilProject',
        message: `Please specify the project name (e.g. ${colors.cyan('MyVanilProject')}):`,
        validate: validateProjectDirectoryInput,
      },
    ])
    projectName = choiceProjectName.projectName
  }

  const projectPathName = projectName!.toLowerCase()
  const projectPath = resolve(destDir, projectPathName)
  const folderAlreadyExist = existsSync(projectPath)

  if (folderAlreadyExist) {
    const shouldOverride = await inquirer.prompt([
      {
        type: 'confirm',
        default: false,
        name: 'answer',
        message: colors.yellow('[??] WARN: The chosen directory already exists. Do you want to override it?'),
      },
    ])

    if (!shouldOverride.answer) {
      return false
    }
  }

  if (!createProjectFolder(projectPath, projectPathName, folderAlreadyExist)) {
    return false
  }

  const packageJSON: { dependencies: any; devDependencies: any } = JSON.parse(
    readFileSync(join(tplDir, 'package.json'), { encoding: 'utf8' }),
  )

  const dependenciesAsString: Array<string> = transformPackageDependenciesToStrings(packageJSON, 'dependencies')
  const devDependenciesAsString: Array<string> = transformPackageDependenciesToStrings(packageJSON, 'devDependencies')

  if (!copyTemplate(projectPath, tplDir, projectName!)) {
    return false
  }

  if (isGitRepo) {
    execSync(`rm -rf ${tplDir}`, {
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
