
import { Context } from '../context'
import { addFileDependency } from '../change-detection'
import { dirname, resolve } from 'path'

import cssnano from "cssnano"

// https://github.com/postcss/autoprefixer
import autoprefixer from 'autoprefixer'

// https://github.com/postcss/postcss-nested
import postcssNested from 'postcss-nested'

// https://github.com/postcss/postcss-import
import postcssImport from 'postcss-import-sync2'

/** determines the default PostCSS plugins to use */
export const getDefaultPostcssPlugins = (cssFilePath: string, context: Context) => {
    
    return [

        /** allows to @import stylesheets */
        postcssImport({
        resolve: (importPath: string) => {
            const path = resolve(dirname(cssFilePath), importPath)
            // add @import("$importPath") to file dependencies for HMR
            addFileDependency(path, context, cssFilePath)
            return path
        },
        }),

        /** allows prefixing for older browsers [compatibility] */
        autoprefixer({
            overrideBrowserslist: context.config.buildOptions.browserslist,
        }),

        /** allow nested rule definition to be exflated */
        postcssNested(),
    ]
}

/** determines the default PostCSS plugins to use for code optimization */
export const getDefaultPostcssOptimizationPlugins = (context: Context) => {
    return [
        cssnano({ preset: 'default' })
    ]
}