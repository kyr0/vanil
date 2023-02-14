import { readFileContent } from "../io"
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from "../loader"

export const BASE64_LOADER_NAME = 'base64'

/** returns a file content encoded as base64 string (e.g. binary images or other object files) */
export const base64Loader: LoaderFn = async(targetPath: string) => await readFileContent(targetPath, 'base64')

export const registerBase64Loader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: BASE64_LOADER_NAME,
  cb: base64Loader,
})
