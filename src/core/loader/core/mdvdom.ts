import { readFileSyncUtf8 } from '../../io/file'
import { Context } from '../../../@types/context'
import { escapeCurlyBracketsAndBackticks, transpileTSX } from '../../transform/transpile'
import { LoaderFn, LoaderRegisterFn, LoaderRegistration } from '../interface'
const marked = require('marked')

/** transforms markdown to VDOM */
export const markdownToVdom = (md: string, context: Context) => {
  const code = escapeCurlyBracketsAndBackticks(marked.parse(md))

  // transpiles the SVG content as TSX to functional calls
  // and evaluates them down to a JSX JSON tree representation
  // that can be rendered at runtime
  // TODO: vm -> run()
  return eval(transpileTSX(`const { Code, Debug, Trans } = Vanil;(<>${code}</>)`, context))
}

/** resolves a given target path to an absolute path on disk and returns its UTF8 contents */
export const mdVdomLoader: LoaderFn = (targetPath: string, context: Context) =>
  markdownToVdom(readFileSyncUtf8(targetPath), context)

export const registerMdVdomLoader: LoaderRegisterFn = (): LoaderRegistration => ({
  name: 'md-vdom',
  match: /\.md$/i,
  cb: mdVdomLoader,
})
