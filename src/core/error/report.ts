import { resolve } from 'path'
import { getLiveReloadUrl } from '../../cli/dev'
import { Context } from '../../@types/context'
import { loadAndTranspileCode } from '../transform/transpile'
import { ScriptExecutionError } from '../transform/vm'

/** renders a static HTML page with livereload and panic-overlay integration */
export const renderSSGErrorReport = (relativePath: string, ssgError: ScriptExecutionError, context: Context) => {
  // connect to dev server for HMR on code changes
  const liveReloadRuntime = loadAndTranspileCode(
    resolve(__dirname, '../runtime/livereload.ts'),
    'js',
    'scss',
    'import',
    context,
  ).replace(/__VANIL_LIVE_RELOAD_URL/g, `"${getLiveReloadUrl(context.config)}"`)

  if (!ssgError.linesOfError) ssgError.linesOfError = []

  // error reporting panic-overlay
  return `<html>
    <head>
        <title>Error / SSG</title>
        <script>
            ${liveReloadRuntime}
        </script>

        <style>
            .panic-overlay__modal h1 {
                color: #f3e5ab !important;
            }

            .panic-overlay__error-type {
                color: #fff !important;
            }

            .panic-overlay__error-message {
                color: #999 !important;
            }

            .panic-overlay__line-hili {
                background: transparent !important;
                color: #f3e5ab !important;
            }

            .panic-overlay__close {
                color: #fff !important;
                opacity: 0.4 !important;
            }

             .panic-overlay__modal {
                background-color: #000 !important;
             }
             .panic-overlay__line-number {
                display: none !important;
            }
        </style>


        <script>
            

\`

${relativePath} (or an included .astro component):
${ssgError.linesOfError.join('\n')}
\`
throw new ${ssgError.errorType}(\`${ssgError.errorMessage.trim()}\`)
// this happened in Node.js while rendering server-side!
//



        </script>


        <script>

            setTimeout(() => {
                
                let selectedLine = document.querySelector('.panic-overlay__line-hili')

                if (selectedLine) {
                    selectedLine.parentNode.removeChild(selectedLine)

                    document.querySelectorAll('.panic-overlay__line')[1].className = 'panic-overlay__line panic-overlay__line-hili'
                }
            }, 10)
        </script>
    </head>
</html>`
}
