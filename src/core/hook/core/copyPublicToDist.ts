import { copyFiles, getDistFolder, getPublicFolder, toProjectRootRelativePath } from '../../io/folders'
import { Context } from '../../../@types/context'
import { HookFn } from '../hook'
import * as colors from 'kleur/colors'

/** copy files and directories recursively from public to dist */
export const copyPublicToDist: HookFn = async (context: Context) => {
  console.log(
    colors.bold(colors.dim('hook (copyPublicToDist):')),
    colors.gray(
      `Copying ${toProjectRootRelativePath(
        getPublicFolder(context.config),
        context.config,
      )}/**/* files to ${toProjectRootRelativePath(getDistFolder(context.config), context.config)} folder...`,
    ),
  )

  const publicFolder = getPublicFolder(context.config)
  const distFolder = getDistFolder(context.config)

  copyFiles(publicFolder, distFolder)
}
