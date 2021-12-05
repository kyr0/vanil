import * as colors from 'kleur/colors'
import { createProject } from '../scaffold/createProject'

export interface InitOptions {
  /** name of the new project (output folder name and inline code replacement) */
  name: string

  /** template name (folder name) as examples/$folderName */
  tpl: string
}

/** allows to scaffold new projects from examples */
export const init = async (options: InitOptions) => {
  console.log(
    'Scaffolding project: ',
    colors.green(options.name),
    'from template',
    colors.green(`examples/${options.tpl}`),
    '...',
  )

  await createProject(options.tpl, options.name)

  return 0
}
