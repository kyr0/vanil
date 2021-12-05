import { readFileSyncUtf8 } from '../../io/file'
import { Context } from '../../../@types/context'
import { transpileTSX } from '../../transform/transpile'
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from '../interface'

/** resolves a given target path to an absolute path on disk and returns its UTF8 contents */
export const svgVdomLoader: LoaderFn = (targetPath: string, context: Context) => {
  let svgContent = readFileSyncUtf8(targetPath)

  // let's get rid of xml tag and doctype -- that's non parsable
  // in terms of support by JSX/TSX
  svgContent = svgContent.replace(/<\?xml [\s\S]*?\?>/, '')
  svgContent = svgContent.replace(/<!DOCTYPE svg[\s\S]*?>/, '')

  // transpiles the SVG content as TSX to functional calls
  // and evaluates them down to a JSX JSON tree representation
  // that can be rendered at runtime
  return eval(transpileTSX(svgContent, context))
}

export const registerSvgVdomLoader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: 'svg-vdom',
  match: /\.svg$/i,
  cb: svgVdomLoader,
})
