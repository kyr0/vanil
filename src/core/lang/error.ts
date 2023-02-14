import * as colors from 'kleur/colors'
import { strip } from "ansicolor"
import { BuildFailure, Message, Location, Note } from "esbuild"
import { highlight } from "chroma-highlight"
import { toProjectRootRelativePath } from '../io'
import { Context } from '../context'
import { MissingDependencyError } from '../bundle/missing-dependency-plugin'

/** sets the stack of an original error so that userland can track back better */
export const applyOriginalStack = (currentError: Error, originalError: Error) => {
    currentError.stack = originalError.stack
} 

/** formats a parsed esbuild error nicely, so that it gives a good hint on whats wrong */
export const printBuildError = (pageId: string, context: Context) => {

    const error = context.latestPagePublishStatus[pageId].publishError.error

    const details = error.details ? `

${error.detailsAnsiColored || error.details}

` : ' '

    console.error(`${colors.bold(`${colors.white('[')}${colors.red(error.code)}${colors.white(']')} `)}${colors.bgRed(colors.white(error.errorMessage))}${details}${colors.white('in:')} ${colors.dim(error.location.filePath)}`)
}

export const esbuildLineAndColumnNumberRegExp = /\([0-9]+:[0-9]+\)/

export type PublishErrorType = 'PAGE_BUILD_ERROR' | 'PAGE_LINK_ERROR' | 'PAGE_RENDER_ERROR'

export interface PagePublishErrorLocation {
    line?: number
    column?: number
    filePath: string
}

export interface PagePublishError {
    code: string
    reasonCode: string
    errorMessage: string
    location: PagePublishErrorLocation
    details?: string
    detailsAnsiColored?: string
    detailsHtml?: string
}

export interface PublishError {
    type: PublishErrorType
    error?: PagePublishError
}

export interface BabelErrorPosition {
    line: number
    column: number
    index: number
}

export interface BabelErrorDetail extends String {
    code: string
    reasonCode: string
    loc: BabelErrorPosition
    pos: () => unknown
}

export interface EsbuildMessageWithBabel extends Message {
    detail: BabelErrorDetail
    id: string
    location: Location
    notes: Array<Note>
    pluginName: string
    text: string
}

export interface EsbuildError<E extends Message = Message> extends BuildFailure {
    errors: Array<E>
}

export const parsePagePublishError = (err: EsbuildError, context: Context): PagePublishError => {
    
    // it's a parsing/syntax error catched by Solid's Babel transform
    if (err.errors && 
        err.errors[0].pluginName === 'solid-jsx-transform' && 
        err.errors[0].detail.code.startsWith('BABEL')) {
    
        const errorMessageLines = err.errors[0].detail.toString().split('\n')
        const completeErrorMessageLine = errorMessageLines[0]
        const errorMessageTokens = completeErrorMessageLine.split(':')
        const filePath = errorMessageTokens[1].trim()
        const errorMessageWithLineAndColumnInfo = errorMessageTokens.splice(2).join(':')

        const lineAndColumnText = errorMessageWithLineAndColumnInfo
            .match(esbuildLineAndColumnNumberRegExp)[0]

        const errorMessage = errorMessageWithLineAndColumnInfo
            .replace(lineAndColumnText, '').trim()
        
        const detailsAnsiColored = errorMessageLines.splice(2).join('\n')
        const details = strip(detailsAnsiColored)

        return {
            code: err.errors[0].detail.code.replace('BABEL_', ''),
            reasonCode: err.errors[0].detail.reasonCode,
            errorMessage: errorMessage,
            location: {
                column: err.errors[0].detail.loc.column,
                line: err.errors[0].detail.loc.line,
                filePath: toProjectRootRelativePath(filePath, context.config)
            },
            details,
            detailsHtml: highlight(details, `--formatter html --html-only --html-inline-styles --lexer typescript --style base16-snazzy`),
            detailsAnsiColored: highlight(details, `--formatter terminal --lexer typescript --style base16-snazzy`)
        }
    } else if (err.errors && 
        err.errors[0].pluginName === 'missing-dependency-plugin' && 
        err.errors[0].detail instanceof MissingDependencyError) {

        const cause = err.errors[0].detail.cause

        return {
            code: 'MISSING_IMPORT',
            reasonCode: 'WRONG_PATH',
            errorMessage: err.errors[0].detail.message,
            location: {
                column: cause.column,
                line: cause.line,
                filePath: toProjectRootRelativePath(cause.filePath, context.config)
            },
            details: cause.snippet,
            detailsHtml: highlight(cause.snippet, `--formatter html --html-only --html-inline-styles --lexer typescript --style base16-snazzy`),
            detailsAnsiColored: highlight(cause.snippet, `--formatter terminal --lexer typescript --style base16-snazzy`)
        }
    } else if (!err.errors) {

        let reasonCode: string
        let location: PagePublishErrorLocation
        if (err.stack) {
            const stackTraceEntryOne = err.stack.split('\n').splice(1)[0]
                            // at $methodName ($filePath:$line:$column)
            const matched = stackTraceEntryOne.match(/^.*at\W+(.*)\W+\((.*)\).*$/)
            
            if (matched) {
                reasonCode = matched[1]
                const locationText = matched[2].match(/(.*):([0-9]+):([0-9]+)/)
            
                location = {
                    filePath: toProjectRootRelativePath(locationText[1], context.config),
                    //line: parseInt(locationText[2], 10),
                    //column: parseInt(locationText[3], 10),
                }
            } else {

                                // at $filePath:$line:$column
                const matched = stackTraceEntryOne.match(/^.*at\W(.*).*$/)
                const locationText = matched[1].match(/(.*):([0-9]+):([0-9]+)/)
            
                location = {
                    filePath: toProjectRootRelativePath(locationText[1], context.config),
                    //line: parseInt(locationText[2], 10),
                    //column: parseInt(locationText[3], 10),
                }
            }
        }

        return {
            code: err.name,
            reasonCode: '',
            errorMessage: err.message,
            location
        }
    } else {
        console.error('UNHANDLED ERROR. REPORT A BUG.')
        console.error(err)
    }
}

/** prints a last fatal error message line and quits */
export const fatalError = (message: string) => {
    console.error(`${colors.bgRed(colors.white('[FATAL ERROR]'))} ${colors.red(message)}`)
    process.exit(1)
}

/** prints a non-fatal error */
export const nonFatalError = (message: string) => {
    console.error(`${colors.bold(`${colors.white("[")}${colors.red('!!')}${colors.white("]")}`)} ${colors.red(message)}`)
}
