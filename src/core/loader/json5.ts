import { readFileContent } from '../io'
import JSON5 from 'json5'
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from '../loader'

/** returns JSON5 contents as JSON */
export const json5Loader: LoaderFn = async(targetPath: string) => JSON5.parse(await readFileContent(targetPath))

export const registerJson5Loader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: 'json5',
  match: /\.json5$/i,
  cb: json5Loader,
})
