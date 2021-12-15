import { copyFiles, getDistFolder, toProjectRootRelativePath } from '../../io/folders'
import { Context } from '../../../@types/context'
import { HookFn } from '../hook'
import * as colors from 'kleur/colors'
import { basename, resolve } from 'path'
import { existsSync } from 'fs'
import fg from 'fast-glob'

export const panicOverlayFilename = 'panic-overlay.browser.js'

/** copy files and directories recursively from public to dist */
export const copyPanicOverlayToDist: HookFn = async (context: Context) => {
  const distFolder = getDistFolder(context.config)
  const distPath = resolve(distFolder, 'js', panicOverlayFilename)

  if (!existsSync(distPath)) {
    console.log(
      colors.bold(colors.dim('hook (copyPanicOverlayToDist):')),
      colors.gray(
        `Copying ${panicOverlayFilename} to ${toProjectRootRelativePath(
          getDistFolder(context.config),
          context.config,
        )}/js folder...`,
      ),
    )

    fg.sync(resolve(__dirname, '../../error/panic-overlay*')).forEach((path) => {
      copyFiles(path, resolve(getDistFolder(context.config), 'js', basename(path)))
    })
  }
}
