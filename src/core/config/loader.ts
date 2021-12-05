import { registerBinaryLoader } from '../loader/core/binary'
import { registerJsonLoader } from '../loader/core/json'
import { registerJson5Loader } from '../loader/core/json5'
import { registerRawLoader } from '../loader/core/raw'
import { registerResolveLoader } from '../loader/core/resolve'
import { registerSvgVdomLoader } from '../loader/core/svgvdom'
import { registerMdVdomLoader } from '../loader/core/mdvdom'
import { LoaderMap } from '../loader/loader'

/** decides on the default loaders */
export const getDefaultLoaderMap = (): LoaderMap => {
  const rawLoader = registerRawLoader()
  const resolveLoader = registerResolveLoader()
  const json5Loader = registerJson5Loader()
  const binaryLoader = registerBinaryLoader()
  const svgVdomLoader = registerSvgVdomLoader()
  const jsonLoader = registerJsonLoader()
  const mdVdomLoader = registerMdVdomLoader()

  return {
    [rawLoader.name]: rawLoader,
    [resolveLoader.name]: resolveLoader,
    [json5Loader.name]: json5Loader,
    [binaryLoader.name]: binaryLoader,
    [svgVdomLoader.name]: svgVdomLoader,
    [jsonLoader.name]: jsonLoader,
    [mdVdomLoader.name]: mdVdomLoader,
  }
}
