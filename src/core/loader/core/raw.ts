import { readFileSyncUtf8 } from '../../io/file'
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from '../interface'

export const RAW_LOADER_NAME = 'raw'

/** returns a files UTF8 contents */
export const rawLoader: LoaderFn = (targetPath: string) => readFileSyncUtf8(targetPath)

export const registerRawLoader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: RAW_LOADER_NAME,
  cb: rawLoader,
})
