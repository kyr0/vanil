import { readFileSyncUtf8 } from '../../io/file'
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from '../interface'
import JSON5 from 'json5'

/** returns JSON5 contents as JSON */
export const json5Loader: LoaderFn = (targetPath: string) => JSON5.parse(readFileSyncUtf8(targetPath))

export const registerJson5Loader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: 'json5',
  match: /\.json5$/i,
  cb: json5Loader,
})
