import { resolve } from "path"
import { getLiveReloadUrl } from "../../cli/dev"
import { Context } from "../../@types/context"
import { loadAndTranspileCode } from "../transform/transpile"
import { ScriptExecutionError } from "../transform/vm"

/** renders a static HTML page with livereload and panic-overlay integration */
export const renderSSGErrorReport = (relativePath: string, ssgError: ScriptExecutionError, context: Context) => {

    // connect to dev server for HMR on code changes
    const liveReloadRuntime = loadAndTranspileCode(
        resolve(__dirname, '../runtime/development/livereload.ts'), 'js', 'scss', 'import', context)
            .replace('__VANIL_LIVE_RELOAD_URL', `"${getLiveReloadUrl(context.config)}"`)

    if (!ssgError.linesOfError) ssgError.linesOfError = []
    // TODO: this works, but it's rather hacky

    // error reporting panic-overlay 
    return `<html>
    <head>
        <title>Error / SSG</title>
        <script>
            ${liveReloadRuntime}
        </script>

        <script src="https://unpkg.com/panic-overlay"></script>

        <style>
             .panic-overlay__line-number {
                display: none !important
            }
        </style>


        <script>
            

\`

${relativePath}:
${ssgError.linesOfError.join("\n")}
\`
throw new ${ssgError.errorType}(\`${ssgError.errorMessage.trim()}\`)
// This error happened in Node.js (SSG) - *not* in the browser!
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