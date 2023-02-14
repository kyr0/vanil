import { Context } from './context'
import { registerBase64Loader, registerBinaryLoader, registerJson5Loader, registerJsonLoader, registerRawLoader } from './loader/index'

/**
 * An implementation of a loader function like this
 * returns the loaded/transformed result of Vanil.fetchContent()
 * @param targetPath Is the path to be loaded (after glob has been interpolated)
 */
export type LoaderFn<Result = string, Options = unknown> = (targetPath: string, options?: Options) => Promise<Result>

export type LoaderRegisterFn = () => LoaderRegistration

export interface LoaderRegistration {
  // unique loader name (e.g. 'raw')
  // ...also used for prefixing a path like: raw!../some/file.txt)
  name: string

  // tests against files if this loader would be a good candidate to use
  // e.g. /\.txt$/i
  match?: RegExp

  // loader implementation function reference
  cb: LoaderFn
}

export interface LoaderMap {
  [loaderName: string]: LoaderRegistration
}

/** checks if a specific loader is registered */
export const isLoaderRegistered = (loaderName: string, context: Context) =>
  !!Object.keys(context.loaderMap!).find((candidate) => candidate === loaderName)

/** returns the loaderMap as a list for quick lookup */
export const getLoaderList = (context: Context) => {
  const loaderNames = Object.keys(context.loaderMap!)
  const loaders: Array<LoaderRegistration> = []

  loaderNames.forEach((loaderName) => loaders.push(context.loaderMap![loaderName]))
  return loaders
}

/** selects a specific loader if required by the user.
 * alternatively, an automatic file extension matching happens */
export const getMatchingLoader = (context: Context, fetchPath: string, loaderName?: string) => {
  const loaders = getLoaderList(context)

  return loaderName
    ? context.loaderMap![loaderName]
    : loaders.filter((loaderRegistration) =>
        loaderRegistration.match ? loaderRegistration.match.test(fetchPath) : false,
      )[0]
}

/** registers a loader so that it can be used via loadFile('$name:../path') and loadFiles('$name:../path') */
export const registerLoader = (loaderRegistration: LoaderRegistration, context: Context) => {
  // applies a nay-sayer matcher that will never match
  if (!loaderRegistration.match) loaderRegistration.match = /\s^\s\S^\S/

  // register the loader by reference
  context.loaderMap[loaderRegistration.name] = loaderRegistration
}

/** decides on the default loaders */
export const getDefaultLoaderMap = (): LoaderMap => {
  const rawLoader = registerRawLoader()
  const json5Loader = registerJson5Loader()
  const jsonLoader = registerJsonLoader()
  const base64Loader = registerBase64Loader()
  const binaryLoader = registerBinaryLoader()

  return {
    [rawLoader.name]: rawLoader,
    [json5Loader.name]: json5Loader,
    [jsonLoader.name]: jsonLoader,
    [base64Loader.name]: base64Loader,
    [binaryLoader.name]: binaryLoader,
  }
}