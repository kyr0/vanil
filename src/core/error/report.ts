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
        <title>Node.js Error</title>
        <script>
            ${liveReloadRuntime}
        </script>

        <script>
            

\`

${relativePath} (or imported .astro component):
${ssgError.linesOfError.join('\n')}
\`
throw new ${ssgError.errorType}(\`${ssgError.errorMessage ? ssgError.errorMessage.trim() : ssgError}\`)
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
