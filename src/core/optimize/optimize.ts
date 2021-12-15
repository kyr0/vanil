import { Context } from '../../@types/context'
import * as colors from 'kleur/colors'
import { prettify } from './development/prettify'
import { panicOverlayFilename } from '../hook/core/copyPanicOverlayToDist'
const { minify } = require('html-minifier-terser')

/** takes HTML, parses it, and optimizes holistically */
export const optimize = async (html: string, context: Context) => {
  let optimizedHtml
  const optimizeStartTime = Date.now()

  // run optimizations
  if (context.mode === 'development') {
    // add panic-overlay
    html = `<script role="panic-overlay-devonly" src="/js/${panicOverlayFilename}"></script>${html}`
    html = `<link role="panic-overlay-devonly" rel="stylesheet" href="/js/${panicOverlayFilename}.css" />${html}`

    if (context.config.devOptions!.useOptimizer) {
      // format HTML nicely
      optimizedHtml = prettify(html)

      console.log(colors.dim(`perf (ms):`), colors.green(Date.now() - optimizeStartTime), colors.dim(`(optimizer)`))
    } else {
      optimizedHtml = html
    }
  } else {
    // optimize for size (performance) -> minify
    optimizedHtml = await minify(html, {
      caseSensitive: true,
      collapseInlineTagWhitespace: true,
      collapseWhitespace: true,
      conservativeCollapse: true,
      continueOnParseError: true,
      keepClosingSlash: true,
      minifyCSS: true,
      minifyJS: true,
      minifyURLs: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
    })
    console.log(colors.dim(`perf (ms):`), colors.green(Date.now() - optimizeStartTime), colors.dim(`(optimizer)`))
  }
  return optimizedHtml
}
