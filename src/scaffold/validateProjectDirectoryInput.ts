import { basename, resolve, sep } from 'path'
import { concatErrors } from './concatErrors'
import { validateClassName } from './validateClassName'
import * as colors from 'kleur/colors'
const validateProjectName = require('validate-npm-package-name')

export const validateProjectDirectoryInput = async (projectDirectory: string): Promise<boolean | string> => {
  if (!projectDirectory) {
    return colors.red(
      `[!!] ERROR: Could not create a project called ${colors.red(`"${projectDirectory}"`)}:${concatErrors([
        'Project name is empty!',
      ])}`,
    )
  }

  if (projectDirectory.startsWith(sep)) {
    return colors.red(
      `[!!] ERROR: Could not create a project called ${colors.red(`"${projectDirectory}"`)}:${concatErrors([
        'Setting a path is not allowed',
      ])}`,
    )
  }

  const root = resolve(projectDirectory)
  const projectName = basename(root)
  const validationResult = validateProjectName(projectName.toLowerCase())
  const componentValidationResult = validateClassName(projectName)

  if (projectName.indexOf('.') > -1) {
    validationResult.validForNewPackages = false
  }

  if (!validationResult.validForNewPackages || typeof componentValidationResult === 'string') {
    return `Could not create a project called ${colors.red(
      `"${projectName}"`,
    )} because of npm naming restrictions: ${concatErrors(validationResult.errors)}${concatErrors(
      validationResult.warnings,
    )}${componentValidationResult}`
  }
  return true
}
