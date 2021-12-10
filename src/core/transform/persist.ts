import { dirname, join } from 'path'
import shelljs from 'shelljs'
import { existsSync, writeFileSync } from 'fs'
import { getDistFolder } from '../io/folders'
import { addMaterializedHtmlFilePath } from './context'
import { Context } from '../../@types/context'

/** writes out the generated content as a file in dist folder */
export const persistVanilPage = async (context: Context, content: string) => {
  // uses (pre-)materialized path in case of dynamic routing (see routing.ts),
  // else the static template path to the .astro file
  const path = context.materializedPath ? context.materializedPath! : context.path!

  let relativeTargetPath = path.split(context.config.pages!.replace('.', ''))[1]

  // encode as URI component so that it can be routed well
  relativeTargetPath = relativeTargetPath
    .split('/')
    .map((pathPartName) => encodeURIComponent(pathPartName))
    .join('/')

  let destPath = join(getDistFolder(context.config), relativeTargetPath)

  if (context.config.buildOptions?.pageUrlFormat === 'directory') {
    destPath = destPath.replace('.astro', '')
  } else {
    destPath = destPath.replace('.astro', '.html')
  }

  // assign for HMR update event filtering
  addMaterializedHtmlFilePath(destPath, context)

  return persistFileAbsolute(destPath, content)
}

/**
 * persists an arbitrary file, resolving its absolute destination path by
 * only having a path relative to the dist folder
 */
export const persistFileDist = async (relativeTargetPath: string, content: string, context: Context) =>
  persistFileAbsolute(join(getDistFolder(context.config), relativeTargetPath), content)

/** persists a file and recursively creates the path if necessary */
export const persistFileAbsolute = (destPath: string, content: string) => {
  // create shallow directory structure
  shelljs.mkdir('-p', dirname(destPath))

  // remove file first
  if (existsSync(destPath)) {
    shelljs.rm(destPath)
  }

  // write file contents
  return writeFileSync(destPath, content, { encoding: 'utf8' })
}
