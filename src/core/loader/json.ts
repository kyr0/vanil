import { readFileContent } from "../io"
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from "../loader"

/** returns JSON contents as JSON */
export const jsonLoader: LoaderFn = async(targetPath: string) => JSON.parse(await readFileContent(targetPath))

export const registerJsonLoader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: 'json',
  match: /\.json$/i,
  cb: jsonLoader,
})
