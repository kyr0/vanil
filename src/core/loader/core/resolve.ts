import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from '../interface'

/** resolves a given target path to an absolute path on disk */
export const resolveLoader: LoaderFn = (targetPath: string) => targetPath

export const registerResolveLoader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: 'resolve',
  cb: resolveLoader,
})
