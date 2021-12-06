import { readPackageJson } from '../io/file'
import { Context } from '../../@types/context'
import { addFileDependency } from '../transform/context'
import { dirname, resolve } from 'path'

// https://github.com/postcss/autoprefixer
const autoprefixer = require('autoprefixer')

// https://github.com/postcss/postcss-nested
const postcssNested = require('postcss-nested')

// https://github.com/postcss/postcss-import
const postcssImport = require('postcss-import-sync2')

// 96% browser coverage
// https://browserslist.dev/?q=PiAwLjA1JSwgbm90IGllID4gMA%3D%3D
const DEFAULT_BROWSERSLIST = ['> 0.05%', 'not ie > 0']

/** determines the default PostCSS plugins to use */
export const getPostCSSPlugins = (context: Context) => {
  const projectPackageJson = readPackageJson(context)

  const defaultPlugins = [
    /** allows to @import stylesheets */
    postcssImport({
      resolve: (importPath: string) => {
        const path = resolve(dirname(context.path!), importPath)
        // add @import("$importPath") to file dependencies for HMR
        addFileDependency(path, context)
        return path
      },
    }),

    /** allows prefixing for older browsers [compatibility] */
    autoprefixer({
      overrideBrowserslist: projectPackageJson.browserslist || DEFAULT_BROWSERSLIST,
    }),

    /** allow nested rule definition to be exflated */
    postcssNested(),
  ]
  return defaultPlugins
}
