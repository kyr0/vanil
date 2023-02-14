import { readFileContent } from "../io"
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from "../loader"

export const BINARY_LOADER_NAME = 'binary'

/** returns a file content encoded as binary (uin8) buffer */
export const binaryLoader: LoaderFn = (targetPath: string) => readFileContent(targetPath, 'binary')

export const registerBinaryLoader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: BINARY_LOADER_NAME,
  cb: binaryLoader,
})
