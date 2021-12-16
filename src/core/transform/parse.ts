import * as colors from 'kleur/colors'
import { basename, normalize } from 'path'
import { Context } from '../../@types'
import { readFileSyncUtf8 } from '../io/file'
import { stripHtmlComments } from './transform'

const RE_GSP_DECL_ARROW_FN = /getStaticPaths[\s]*?=[\s]*?async[\s]*?\([\s\S]*?\{/
const RE_GSP_DECL_FN = /async[\s]*?function[\s]*?getStaticPaths[\s\S]*?\{/
const CHAR_CURLY_BRACKET_OPEN = '{'.charCodeAt(0)
const CHAR_CURLY_BRACKET_CLOSE = '}'.charCodeAt(0)
const CHAR_SLASH = '/'.charCodeAt(0)
const CHAR_BACKSLASH = '\\'.charCodeAt(0)
const CHAR_ASTERISK = '*'.charCodeAt(0)
const CHAR_SINGLE_QUOTE = "'".charCodeAt(0)
const CHAR_DOUBLE_QUOTE = '"'.charCodeAt(0)
const CHAR_BACKTICK = '`'.charCodeAt(0)
const CHAR_NEWLINE = '\n'.charCodeAt(0)
const CHAR_PARANTHESES_OPEN = '('.charCodeAt(0)
const CHAR_PARANTHESES_CLOSE = ')'.charCodeAt(0)

// === Vanil template parsing

export interface CodeBundle {
  typeScriptCode: string
  htmlCode: string
}

const ASTRO_SPLIT_REGEXP = /---\s+</

/** Splits the --- typeScriptCode --- htmlCode sections */
export const parseTemplate = (templatePath: string, context: Context): CodeBundle => {
  const templateCode = readFileSyncUtf8(templatePath)

  if (!ASTRO_SPLIT_REGEXP.test(templateCode)) {
    console.error(
      colors.red(
        `[ERROR] The following Vanil template doesn't have the correct syntax:\n${colors.bold(
          normalize(templatePath),
        )}`,
      ),
    )
    console.error(`\nVanil templates should look like this: 

---
// code for preparing static rendering
const somePageTitle = 'Test Page'
---
<!-- HTML/TSX template code goes here -->
<html>
    <head>
        <title>{ somePageTitle }</title>
    </head>
    ...
</html>

        `)
    console.error(
      `However, ${colors.bold(basename(templatePath))} looks like that: \n`,
      colors.strikethrough(templateCode || '<empty file>'),
      '\n',
    )
    process.exit(1)
  }

  // split by --- followed by a newline
  const codeSplits = templateCode.split(ASTRO_SPLIT_REGEXP)

  return {
    // remove the first line --- (not all of course)
    typeScriptCode: codeSplits[0].replace('---', '') + ';',

    // restore opening <
    htmlCode: stripHtmlComments(`<${codeSplits[1]}`),
  }
}

// === import(), import { ... } parsing

interface ImportAndCodeStatements {
  importStatements: string
  codeStatements: string
}

/**
 * parses code for single or multiline synchonous import statements,
 * but ignores comments and dynamic imports
 */
export const parseImportStatements = (typeScriptCode: string, onlySync = true): Array<string> => {
  const locs = typeScriptCode.split(/[\n]/gm)

  let importStartLine = -1
  let quoteCount = 0
  let importStatements: Array<string> = []

  // run through each line of code, to find the import keyword
  // as a starting point; but rule out dynamic imports
  locs.forEach((loc, index) => {
    // mark beginning of an synchronous import
    if (loc.indexOf('import') > -1) {
      if (onlySync && /await[\s]*?import/.test(loc)) {
        return
      }
      // store initial parse state
      importStartLine = index
      quoteCount = 0
    }

    // " and ' is a valid syntax - count until we've got 2 of them
    // (end of sync import stmt); update parse state
    quoteCount += (loc.match(/["']/g) || []).length

    // in case we've found the end of a (seemingly) valid sync import
    if (quoteCount === 2 && importStartLine !== -1) {
      const importLine = locs.slice(importStartLine, index + 1).join(' ')

      // rule out single line comments
      if (/[\s]+?\/\//.test(importLine) || importLine.startsWith('//')) {
        // reset parse state
        quoteCount = 0
        importStartLine = -1
        return
      }

      // TODO: rule out imports written as content of strings
      // TODO: rule out multiline comments

      // collect
      importStatements.push(locs.slice(importStartLine, index + 1).join('\n'))

      // reset parse state
      quoteCount = 0
      importStartLine = -1
    }
  })
  return importStatements
}

/** rewrites imports from the "vanil" package and dynamically link to runtime loaded */
export const rewriteVanilImports = (importStmts: Array<string>) =>
  importStmts.map((importStmt) =>
    // support for sync imports (ES6) on "vanil"
    // e.g. const { listen, emit, Code, Script, Debug } from "vanil"
    importStmt
      .replace(
        /import[\s+]\{([\s\S]+?)\}[\s+]from[\s+]["']vanil["']/m,
        (waste, importDecls) => `const { ${importDecls} } = Vanil;`,
      )
      // support for dynamic imports on "vanil"
      // e.g. const { get, set } = await import('vanil')
      .replace(
        /\{([\s\S]+?)\}[\s]*?=[\s]*?await[\s]*?import[\s]*?\([\s]*?["']vanil["'][\s]*?\)/m,
        (waste, importDecls) => `const { ${importDecls} } = Vanil;`,
      ),
  )

/** strips import statements from code (e.g. to place them in the output code re-ordered) */
export const stripSyncImportStatements = (typeScriptCode: string, importStmts: Array<string>) => {
  importStmts.forEach((importStmt) => {
    typeScriptCode = typeScriptCode.replace(importStmt, '')
  })
  return typeScriptCode
}

/**
 * typeScriptCode can contain top-level import statements,
 * these need to be idenfied and stripped from the rest of the code
 */
export const splitTopLevelImports = (typeScriptCode: string): ImportAndCodeStatements => {
  const importStatements = parseImportStatements(typeScriptCode)

  return {
    // only the import statements
    importStatements: rewriteVanilImports(importStatements).join('\n'),

    // only the non-import statements
    codeStatements: stripSyncImportStatements(typeScriptCode, importStatements),
  }
}

// === <script> and <style> and <$tag> parsing

const RE_OPEN_SCRIPT_TAG = /<script([\s]*?)(type[\s\S]*?)?>/
const RE_CLOSE_SCRIPT_TAG = /<\/script>/

const RE_OPEN_STYLE_TAG = /<style[\s\S]*?>/
const RE_CLOSE_STYLE_TAG = /<\/style>/

export const ParsingRegexp = {
  script: [RE_OPEN_SCRIPT_TAG, RE_CLOSE_SCRIPT_TAG],
  style: [RE_OPEN_STYLE_TAG, RE_CLOSE_STYLE_TAG],
}

export interface Attrs {
  [attributeName: string]: string
}

export interface TagMatch {
  index: number
  pos: number
  attrs: Attrs
}

export type ProcessTagFn = (tagContent: string, attrs: Attrs) => string

export const processTags = (
  tagName: string,
  tagMatchers: Array<RegExp>,
  tsxCode: string,
  processTagFn: ProcessTagFn,
): string => {
  let tagBlockCount = 0
  let matchIndex = 0
  let matches: Array<TagMatch> = []

  const findTag = (code: string, tokenMatchers: Array<RegExp>, tag: string, open: boolean, offset: number) => {
    const match = tokenMatchers[open ? 0 : 1].exec(code)

    if (match && match[0] && match[0].length && match.index) {
      if (open) tagBlockCount++
      if (!open) tagBlockCount--

      const attrs: Attrs = {}

      if (open) {
        const attibutesString = code.substring(
          offset + match.index + 1 + tag.length,
          offset + match.index + match[0].length - 1,
        )
        let attributeAssocs = attibutesString.split(' ')
        attributeAssocs.shift()

        attributeAssocs.forEach((attrAssoc) => {
          const attrAssocAssignment = attrAssoc.split('=')
          attrs[attrAssocAssignment[0].trim()] = attrAssocAssignment[1].replace(/["']/g, '').trim()
        })
      }

      matchIndex = match.index + (open ? match[0].length : 0) + offset

      matches.push({
        index: tagBlockCount,
        pos: matchIndex,
        attrs,
      })
      findTag(code.substring(matchIndex, code.length), tokenMatchers, tag, !open, matchIndex)
    }
  }

  const tokenize = (code: string, tokenMatchers: Array<RegExp>, tag: string) => {
    findTag(code, tokenMatchers, tag, true /* open */, 0 /* char offset */)
    if (tagBlockCount > 0) {
      throw new Error(`One <${tag}> as no closing tag!`)
    }
    matchIndex = 0
  }

  const processCode = (tsxCode: string, tupleMatches: Array<TagMatch>) => {
    for (let i = 0; i < tupleMatches.length; i += 2) {
      const codeSegment = tsxCode.substring(tupleMatches[i].pos, tupleMatches[i + 1].pos)

      if (tagMatchers[0].test(codeSegment)) {
        console.warn(colors.yellow(codeSegment))
        console.error(
          colors.red(
            `ParseError: Yes, you can have runtime generated <script> code in Vanil TSX, but please like this:

    <Script>...</Script> 

Therefore change your code to: 

import { Script } from "vanil"

return (
    <Script>console.log('This runtime generated code works!')</Script>
)
`,
          ),
        )
        process.exit(1)
      }

      tsxCode = tsxCode.replace(codeSegment, processTagFn(codeSegment, tupleMatches[i].attrs))
    }
    return tsxCode
  }

  tokenize(tsxCode, tagMatchers, tagName)

  if (matches && matches.length > 0) {
    tsxCode = processCode(tsxCode, matches)
  }
  return tsxCode
}

export const processScriptTags = (tsxCode: string, processTagFn: ProcessTagFn) =>
  processTags('script', ParsingRegexp.script, tsxCode, processTagFn)
export const processStyleTags = (tsxCode: string, processTagFn: ProcessTagFn) =>
  processTags('style', ParsingRegexp.style, tsxCode, processTagFn)

// === parse require()s

export const RE_REQUIRE_STMT_FN = /require(\s+)?\(/g
const RE_REQUIRE_ALLOWED_QUOTES = /[\"']/g

/**
 * matches calls for require() and replaces them by callback function returned replacement code.
 * This code works safely because it runs on transpiled code; therefore comments are stripped away
 * already and "matching commented out code" cannot happen
 */
export const processRequireFunctionCalls = (
  code: string,
  processFn: (importPath: string) => string,
  filterForFileEnding?: string,
) => {
  // local re-declaration of RegExp because we're facing
  // .exec object instance mutating .lastIndex operations
  // which need to execute in local context to prevent
  // clashes in quasi-parallel execution (recursion, async)
  const RE = /require(\s+)?\(/g
  const matchCount = code.match(RE_REQUIRE_STMT_FN)?.length

  if (!matchCount) return code

  let match
  let count = 0

  const matches: Array<any> = []

  while ((match = RE.exec(code))) {
    if (count === matchCount) break

    // mark ( after "require"
    const afterRequireIndex = match.index + match[0].length - 1
    let endRequireIndex = -1
    let blocks = 0

    // seek last closing )
    for (let i = afterRequireIndex; i < code.length; i++) {
      const c = code[i].charCodeAt(0)

      if (c == CHAR_PARANTHESES_OPEN) blocks++
      if (c == CHAR_PARANTHESES_CLOSE) blocks--

      // found it
      if (blocks === 0) {
        endRequireIndex = i
        break
      }
    }

    const requiredPath = code
      .substring(
        // excluding the opening (
        afterRequireIndex + 1,
        endRequireIndex,
      )
      .replace(RE_REQUIRE_ALLOWED_QUOTES, '')

    if (filterForFileEnding && !requiredPath.endsWith(filterForFileEnding)) {
      continue
    }
    const codeStatementToReplace = code.substring(match.index, endRequireIndex + 1)

    matches.push({
      codeStatementToReplace,
      requiredPath,
    })
    count++
  }

  for (let i = 0; i < matches.length; i++) {
    code = code.replace(matches[i].codeStatementToReplace, processFn(matches[i].requiredPath))
  }
  return code
}

// === parse getStaticPaths function declarations

/** ECMAScript parser to correctly detect blocks { and } to extract function declarations by RegExp */
export const processGSPFunctionDeclaration = (code: string, cb: (fnCode?: string) => void) => {
  const findGSPFunctionDeclaration = (code: string, matcher: RegExp): string | undefined => {
    let match
    if ((match = matcher.exec(code))) {
      // scope flags
      let startIndex = match.index + match[0].length - 1
      let endIndex = -1
      let blocks = 0
      let inDoubleQuoteString = false
      let inSingleQuoteString = false
      let inTemplateLiteral = false
      let inMultiLineComment = false
      let inSingleLineComment = false
      let inRegExpLiteral = false

      // charcter parser
      for (let i = startIndex; i < code.length; i++) {
        // numeric comparison for perf
        const c = code[i].charCodeAt(0)

        // lookahead, if possible
        const nextC = code[i + 1] ? code[i + 1].charCodeAt(0) : undefined
        // look behind, if possible
        const prevC = code[i - 1] ? code[i - 1].charCodeAt(0) : undefined

        // character is escaped
        const cIsEscaped = prevC == CHAR_BACKSLASH

        // multiline comment context
        const cIsStartMultiLineComment = c == CHAR_SLASH && nextC == CHAR_ASTERISK

        if (cIsStartMultiLineComment && !inMultiLineComment) {
          inMultiLineComment = true
          continue
        } else {
          const cIsEndMultiLineComment = c == CHAR_ASTERISK && nextC == CHAR_SLASH

          if (cIsEndMultiLineComment && inMultiLineComment) {
            inMultiLineComment = false
          }
        }

        if (!inMultiLineComment) {
          // single line comment context
          const cIsStartSingleLineComment = c == CHAR_SLASH && nextC == CHAR_SLASH

          if (cIsStartSingleLineComment && !inSingleLineComment) {
            inSingleLineComment = true
            continue
          } else {
            const cIsEndSingleLineComment = c == CHAR_NEWLINE

            if (cIsEndSingleLineComment && inSingleLineComment) {
              inSingleLineComment = false
            }
          }
        }

        if (!inMultiLineComment && !inSingleLineComment) {
          // regexp context
          const isRegExpLiteralStartOrEnd = c == CHAR_SLASH

          if (isRegExpLiteralStartOrEnd && !inRegExpLiteral && !(prevC == CHAR_ASTERISK)) {
            inRegExpLiteral = true
            continue
          } else if (isRegExpLiteralStartOrEnd && !cIsEscaped && inRegExpLiteral) {
            inRegExpLiteral = false
          }

          if (!inRegExpLiteral) {
            // double quote string context
            const cIsDoubleQuoteStringStartOrEnd = c == CHAR_DOUBLE_QUOTE

            if (cIsDoubleQuoteStringStartOrEnd && !inDoubleQuoteString && !inSingleQuoteString && !inTemplateLiteral) {
              inDoubleQuoteString = true
              continue
            } else if (cIsDoubleQuoteStringStartOrEnd && !cIsEscaped && inDoubleQuoteString) {
              inDoubleQuoteString = false
            }

            // single quote string context
            const cIsSingleQuoteStringStartOrEnd = c == CHAR_SINGLE_QUOTE

            if (cIsSingleQuoteStringStartOrEnd && !inSingleQuoteString && !inTemplateLiteral && !inDoubleQuoteString) {
              inSingleQuoteString = true
              continue
            } else if (cIsSingleQuoteStringStartOrEnd && !cIsEscaped && inSingleQuoteString) {
              inSingleQuoteString = false
            }

            // template literal context
            const cIsTemplateLiteralStartOrEnd = c == CHAR_BACKTICK

            if (cIsTemplateLiteralStartOrEnd && !inTemplateLiteral && !inDoubleQuoteString && !inSingleQuoteString) {
              inTemplateLiteral = true
              continue
            } else if (cIsTemplateLiteralStartOrEnd && !cIsEscaped && inTemplateLiteral) {
              inTemplateLiteral = false
            }
          }
        }

        if (
          inDoubleQuoteString ||
          inSingleQuoteString ||
          inTemplateLiteral ||
          inRegExpLiteral ||
          inMultiLineComment ||
          inSingleLineComment
        )
          continue

        // can only count blocks whenever we're not in a numbing context
        // such as a string, comment, regexp; simple equals op is fine here
        // there is no risk of any type mismatch bc the input is defined
        if (c == CHAR_CURLY_BRACKET_OPEN) blocks++
        if (c == CHAR_CURLY_BRACKET_CLOSE) blocks--

        // end of blocks reached
        if (blocks === 0) {
          endIndex = i
          break
        }
      }
      return code.substring(match.index, endIndex + 1)
    }
    return undefined
  }

  const arrowFnCode = findGSPFunctionDeclaration(code, RE_GSP_DECL_ARROW_FN)

  if (arrowFnCode) {
    cb(arrowFnCode)
    return
  }

  const fnCode = findGSPFunctionDeclaration(code, RE_GSP_DECL_FN)

  if (fnCode) {
    cb(fnCode)
    return
  }
  cb(undefined)
}
