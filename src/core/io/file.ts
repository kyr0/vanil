import { dirname, join, resolve } from "path"
import { ensureDir, getDistFolder, getProjectRootFolder, removeRecursiveForce, toProjectRootRelativePath } from "./folder"
import type { Context } from "../context"
import { readFile, writeFile } from "fs/promises"
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { resolveAsync } from '@esbuild-plugins/node-resolve'
import { Stream } from "stream"

export type Content = string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | Stream

/** persists a file and recursively creates the path if necessary */
export const persistFileAbsolute = async(destPath: string, content: Content, encoding: BufferEncoding = 'utf-8') => {

  // create shallow directory structure
  await ensureDir(destPath)

  // remove first
  if (existsSync(destPath)) {
    await removeRecursiveForce(destPath)
  }

  // write file contents
  return writeFile(destPath, content, { encoding })
}

/**
 * persists an arbitrary file, resolving its absolute destination path by
 * only having a path relative to the dist folder
 */
export const writeFileToDistFolder = async (relativeTargetPath: string, content: Content, context: Context, encoding: BufferEncoding = 'utf-8') => {
  const outfile = join(getDistFolder(context.config), relativeTargetPath)
  await persistFileAbsolute(outfile, content, encoding)
  return toProjectRootRelativePath(outfile, context.config)
}

/** reads file contents as a UTF8 encoded string */
export const readFileContent = async(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> => 
  readFile(filePath, { encoding })

/** writes contents to a file, UTF8 encoded */
export const writeFileContent = async(filePath: string, contents: string, encoding: BufferEncoding = 'utf-8'): Promise<void> =>
  writeFile(filePath, contents, { encoding })

/** returns the package.json object from the user project */
export const readPackageJson = async(context: Context) =>
  JSON.parse(await readFileContent(resolve(getProjectRootFolder(context.config), 'package.json')))

/** returns the package.json object of the framework */
export const getFrameworkPackageJson = async() => {
  const packageJsonPath = (await resolveAsync('./package.json', { 
    basedir: dirname(fileURLToPath(import.meta.url)) })) as string
  return JSON.parse(await readFileContent(packageJsonPath))
}