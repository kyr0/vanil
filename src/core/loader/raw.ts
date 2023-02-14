import { readFileContent } from "../io"
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from "../loader"

export const RAW_LOADER_NAME = 'raw'

export interface RawLoaderOptions {
  encoding: BufferEncoding
}

export const rawLoaderOptionsDefaults: RawLoaderOptions = {
  encoding: 'utf-8'
}

/** returns a files UTF8 contents */
export const rawLoader: LoaderFn = (targetPath: string, options: RawLoaderOptions = rawLoaderOptionsDefaults) => readFileContent(targetPath, options.encoding)

export const registerRawLoader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: RAW_LOADER_NAME,
  cb: rawLoader,
})
