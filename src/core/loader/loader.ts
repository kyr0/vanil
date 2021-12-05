import { Context } from '../../@types/context'
import { LoaderRegistration } from './interface'

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
