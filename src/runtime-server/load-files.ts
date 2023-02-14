import { getMatchingLoader, isLoaderRegistered, LoaderRegistration } from "../core/loader"
import { Context } from "../core/context"
import { resolvePath } from "../core/resolve"
import { glob, hasGlobPattern } from "../core/io"
import { accessSync, constants, existsSync } from "fs"
import { RAW_LOADER_NAME } from "../core/loader/raw"
import { addFileDependency } from "../core/change-detection"

export const loadFiles = async<T = string>(path: string, basePath: string, context: Context): Promise<Array<T>> => {
  const targetPathSplits = path.split(':')
  let requiredLoaderName: string

  if (isLoaderRegistered(targetPathSplits[0], context)) {
    // is the 'raw' in 'raw:../foo/bar.txt'
    requiredLoaderName = targetPathSplits[0]
    // is the '../foo/bar.txt'
    path = targetPathSplits[1]
  }

  const resolvedPath = resolvePath(path, basePath)
  const contents: Array<T> = []

  // throw error and trigger panic report
  if (!hasGlobPattern(resolvedPath) && !existsSync(resolvedPath)) {
    try {
      accessSync(resolvedPath, constants.R_OK)
    } catch (e) {
      const err = new Error(`loadFiles('${path}'): File isn't readable!`)
      err.stack = e.stack
      throw err
    }
  }

  const paths = glob(resolvedPath)

  for (let i=0; i<paths.length; i++) {
    const path = paths[i]

    // all files fetched are also dependencies to the page, should HMR
    addFileDependency(path, context, basePath)

    // selects a specific loader if required by the user
    // alternatively, an automatic file extension matching
    // process is run
    const loaderRegistration: LoaderRegistration = getMatchingLoader(context, path, requiredLoaderName)

    contents.push(
      (loaderRegistration
        ? // some loader matched
          await loaderRegistration.cb(path, context)
        : // in case neither the user decided for a loader
          // nor we could fine a matching loader for the file extension,
          // we'd fall back to the raw loader
          await context.loaderMap![RAW_LOADER_NAME].cb(path, context)
        ) as T,
    )
  }
  return contents
}