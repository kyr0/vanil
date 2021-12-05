import { basename, resolve, sep } from 'path'
import { concatErrors } from './concatErrors'
import { validateClassName } from './validateClassName'

const validateProjectName = require('validate-npm-package-name')
const chalk = require('chalk')

export const validateProjectDirectoryInput = async (projectDirectory: string): Promise<boolean | string> => {
  if (!projectDirectory) {
    return `Could not create a project called ${chalk.red(`"${projectDirectory}"`)}:${concatErrors([
      'empty project name',
    ])}`
  }

  if (projectDirectory.startsWith(sep)) {
    return `Could not create a project called ${chalk.red(`"${projectDirectory}"`)}:${concatErrors([
      'use relative path',
    ])}`
  }

  const root = resolve(projectDirectory)
  const appName = basename(root)
  const validationResult = validateProjectName(appName.toLowerCase())
  const componentValidationResult = validateClassName(appName)

  if (appName.indexOf('.') > -1) {
    validationResult.validForNewPackages = false
  }

  if (!validationResult.validForNewPackages || typeof componentValidationResult === 'string') {
    return `Could not create a project called ${chalk.red(
      `"${appName}"`,
    )} because of npm naming restrictions: ${concatErrors(validationResult.errors)}${concatErrors(
      validationResult.warnings,
    )}${componentValidationResult}`
  }
  return true
}
