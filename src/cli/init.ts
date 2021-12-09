import * as colors from 'kleur/colors'
import { resolve } from 'path'
import { createProject } from '../scaffold/createProject'

export interface InitOptions {
  /** name of the new project (output folder name and inline code replacement) */
  name: string

  /** template name (folder name) as examples/$folderName */
  tpl: string
}

/** allows to scaffold new projects from examples */
export const init = async (options: InitOptions, destFolder: string = '.') => {
  console.log(
    colors.yellow('[VA]'),
    colors.bgMagenta(colors.bold(`Scaffolding project`)),
    'in',
    colors.green(resolve(destFolder)),
    colors.gray('...'),
  )

  await createProject(options.tpl, destFolder, options.name)

  return 0
}
