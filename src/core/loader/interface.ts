import { Context } from '../../@types/context'

/**
 * An implementation of a loader function like this
 * returns the loaded/transformed result of Vanil.fetchContent()
 * @param targetPath Is the path to be loaded (after glob has been interpolated)
 */
export type LoaderFn = (targetPath: string, context: Context) => string

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
