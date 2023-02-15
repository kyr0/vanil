import { glob, readFileContent } from '../io'
import { Plugin } from 'esbuild'
import { resolve } from 'path'

// TODO: support ~ paths using tsconfig-paths // https://www.npmjs.com/package/tsconfig-paths#createMatchPath

export class MissingDependencyError extends Error {
  cause: {
    line: number
    column: number
    filePath: string
    snippet: string
  }
  constructor(message: string, line: number, column: number, filePath: string, snippet: string, options?: any) {
    super(message, options)
    this.name = 'ImportError'
    this.cause = {
      line,
      column,
      filePath,
      snippet,
    }
  }
}

/** renders an ASCII code snippet with error line/column highlighting */
const formatCodeSnippet = (codeLines: Array<string>, line: number, column: number, mistakeLength: number = 1) => {
  const snippetLength = 5
  const maxLineNumber = line + snippetLength
  const maxLineNumberCharLength = maxLineNumber.toString().length
  const frame = codeLines.slice(line, maxLineNumber)

  const snippetLines = frame.map((lineText, lineNo) => {
    const relativeLineNo = line + lineNo + 1
    const relativeLineNoLength = relativeLineNo.toString().length
    return `${relativeLineNo === line + 1 ? '>' : ' '} ${line + lineNo + 1}${' '.repeat(
      maxLineNumberCharLength - relativeLineNoLength,
    )} |    ${lineText}`
  })
  const maxIndentionLength = maxLineNumber.toString().length + 6
  snippetLines.splice(1, 0, `${' '.repeat(maxIndentionLength + column + 2)}${'^'.repeat(mistakeLength)}`)
  return snippetLines.join('\n')
}

/** checks for missing dependencies and reports them via an error */
export const missingDependencyPlugin = (): Plugin => {
  return {
    name: 'missing-dependency-plugin',
    setup(build) {
      // TODO: support global!./foobar.css etc.
      build.onResolve({ filter: /^(\.|\~).*/ }, async (args) => {
        if (!args.importer) return null

        // ./ or ../ or ~ it's a relative or tsconfig path
        const resolvePath = resolve(args.resolveDir, args.path)

        // matches all imports with an arbitrary file ext (that may not be stated by the import)
        const candidates = glob(`${resolvePath}*`)

        if (!candidates.length) {
          const lines = (await readFileContent(args.importer)).split('\n')

          lines.forEach((line, lineNo) => {
            const column = line.indexOf(args.path)
            if (column > -1) {
              throw new MissingDependencyError(
                `File not found: ${args.path}`,
                lineNo + 1,
                column,
                args.importer,
                formatCodeSnippet(lines, lineNo, column, args.path.length),
              )
            }
          })
        }
        return null
      })
    },
  }
}
