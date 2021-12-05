import { readFileSyncUtf8 } from '../../io/file'
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from '../interface'

/** returns JSON contents as JSON */
export const jsonLoader: LoaderFn = (targetPath: string) => JSON.parse(readFileSyncUtf8(targetPath))

export const registerJsonLoader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: 'json',
  match: /\.json$/i,
  cb: jsonLoader,
})
