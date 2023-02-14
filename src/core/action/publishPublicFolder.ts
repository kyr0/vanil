import { copyFiles, getDistFolder, getPublicFolder, toProjectRootRelativePath } from '../io/folder'
import * as colors from 'kleur/colors'
import { Context } from '../context'
import { sep } from 'path'

/** copy files and directories recursively from public to dist */
export const publishPublicFolder = async (context: Context) => {
  console.log(
    colors.bold(colors.dim('action (publishPublicFolder):')),
    colors.gray(
      `Copying ${toProjectRootRelativePath(
        getPublicFolder(context.config),
        context.config,
      )}${sep}**${sep}* files to ${toProjectRootRelativePath(getDistFolder(context.config), context.config)} folder...`,
    ),
  )

  const publicFolder = getPublicFolder(context.config)
  const distFolder = getDistFolder(context.config)

  copyFiles(publicFolder, distFolder)
}
