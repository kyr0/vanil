import { basename, dirname } from 'path'
import { chunk } from '../io/array'
import { getPagesFolder, isDynamicRoutingPath, toProjectRootRelativePath } from '../io/folders'
import { Context } from '../../@types/context'
import { parseImportStatements, parseTemplate, processGSPFunctionDeclaration } from './parse'
import { transpileSSGCode, TS_IMPORT_POLYFILL_SCRIPT } from './transpile'
import { ExecutionResult, run } from './vm'
import { DynamicRoutingParameterMap, PaginationParams, PageParamsAndProps } from '../../@types/routing'
import { renderError } from './transform'

export const RE_PARAM_WRAPPERS = /[\[\]]/g

export const parseDynamicRoutingPath = (context: Context) => {
  const relativePath = toProjectRootRelativePath(context.path!, context.config!)
  const pathSplits = relativePath.split('/')
  const params: DynamicRoutingParameterMap = {}

  pathSplits.forEach((pathSplit) => {
    if (isDynamicRoutingPath(pathSplit)) {
      const paramName = pathSplit.split(']')[0].replace(RE_PARAM_WRAPPERS, '')
      if (paramName.startsWith('...')) {
        params[paramName] = 'rest'
      } else {
        params[paramName] = 'named'
      }
    }
  })
  return params
}

/** implements parsing for getStaticPaths() function declarations and extracts the code */
export const parseForGetStaticPathsFn = async (wholeSsgCode: string) =>
  new Promise((resolve) => {
    processGSPFunctionDeclaration(wholeSsgCode, (fnCode?: string) => {
      resolve(fnCode)
    })
  })

/**
 * chunks the data in slices of paginationParams.pageSize and
 * generates a page prop to be passed to each page */
export const paginate = (data: Array<any>, paginationParams: PaginationParams) => {
  // mid-term goal:
  // TODO: implement pagination with typical page objects just as described in
  //       https://docs.astro.build/reference/api-reference/#getstaticpaths paginate()
  console.log(chunk(2, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]))

  return data
}

export interface MaterializedPage {
  // URL encoded, materialized path
  materializedPath: string

  // holds the props and params of a page (to be passed via context)
  pageParamsAndProps: PageParamsAndProps
}

/**
 * parses the given .astro page files path for dynamic routing parts
 * (e.g. [foo] or [...foo]), isolates the getStaticPaths function and
 * generates a list of materialized paths that represent all possible
 * permutations; returns these, together with the corresponding props
 */
export const materializeDynamicRoutingPaths = async (context: Context) => {
  const parsedParams = parseDynamicRoutingPath(context)
  const paramNames = Object.keys(parsedParams)
  const codeBundle = parseTemplate(context.path!, context)

  let isolatedGetStaticPathsFnCode = await parseForGetStaticPathsFn(codeBundle.typeScriptCode)

  ;(context as any).isolatedGetStaticPathsFnCode = isolatedGetStaticPathsFnCode

  if (!isolatedGetStaticPathsFnCode) {
    // throwing meaningful errors is important;
    // how can newbies know what to do? Let's give them a good hint
    throw new Error(`The following path is dynamic: ${toProjectRootRelativePath(
      context.path!,
      context.config,
    )}, but no export async getStaticPaths() function could be found in ${basename(context.path!)}! 
        
        Please implement it e.g. like this:

        // in ${basename(context.path!)}, first section for SSG code:
        export const getStaticPaths = async() => {

            // your code to fetch / load data necessary to determine all 
            // possible page variants/permutations goes here

            return [{
                ${Object.keys(parsedParams)[0]}: "someData",
                ...
            }, ...]
        }
        `)
  }

  // transform into an iife; yielding the result
  // TODO: mid-term goal: inject rss() as well
  isolatedGetStaticPathsFnCode = `

    ${parseImportStatements(codeBundle.typeScriptCode)
      .filter((importStmt) => !importStmt.includes('.astro'))
      .join('\n')}
  
    export default (() => (${isolatedGetStaticPathsFnCode})({ 
        paginate: globalThis.paginate 
    })})`

  const currentCwd = process.cwd()
  process.chdir(dirname(context.path!))

  const transpiledCode = (await transpileSSGCode(isolatedGetStaticPathsFnCode as string, context)).replace(
    TS_IMPORT_POLYFILL_SCRIPT,
    '',
  )

  const result: ExecutionResult<Array<PageParamsAndProps>> = await run(transpiledCode, context)

  process.chdir(currentCwd)
  const materializedPages: Array<MaterializedPage> = []

  if (result.error) {
    throw result.error
  }

  try {
    result.data?.forEach((pageParamsAndProps, index) => {
      let materializedPath = context.path!

      paramNames.forEach((paramName) => {
        const paramType = parsedParams[paramName]
        const paramValue = pageParamsAndProps.params![paramName]

        if (!paramValue) {
          throw new Error(
            `getStaticPaths() returned the following params: ${JSON.stringify(
              pageParamsAndProps.params,
              null,
              2,
            )} for data index ${index}, but param [${paramName}] is missing!`,
          )
        }

        materializedPath = materializedPath.replace(
          paramType === 'named' ? `[${paramName}]` : `[...${paramName}]`,
          paramType === 'rest' && paramValue == '1' ? '' : paramValue,
        )
      })

      materializedPages.push({
        materializedPath,
        pageParamsAndProps,
      })
    })
  } catch (e) {
    throw new Error(`getStaticPaths() should return an Array of PageParamsAndProps objects, just like this: [
            { params: { ${Object.keys(parsedParams)[0]}: "someData", ... }, props: { /* optional */ ... } },
            ...
        ]`)
  }
  return materializedPages
}

/** generates the path URI relative to the dist folder and depending on the URI format */
export const getPathUri = (materializedPath: string, context: Context) => {
  // uses (pre-)materialized path in case of dynamic routing (see routing.ts),
  // else the static template path to the .astro file
  const path = materializedPath ? materializedPath : context.path!

  // removes absolute path till pages folder
  let relativePath = path.replace(getPagesFolder(context.config), '')

  // /index or /index.html should just fallback to the root URL
  if (relativePath === '/index' || relativePath === '/index.html') {
    relativePath = ''
  }

  // removes .astro
  const relativePathNoFileExt = relativePath.split('.')[0]

  // encode each part of the path for use as URI
  let relativePathUriEncoded = relativePathNoFileExt
    .split('/')
    .map((pathPartName) => encodeURIComponent(pathPartName))
    .join('/')

  // append .html based on format
  if (context.config.buildOptions?.pageUrlFormat === 'file') {
    relativePathUriEncoded += '.html'
  }
  return relativePathUriEncoded
}

/** generates the effective page URL based on the site and materialized path */
export const getPageUrl = (materializedPath: string, context: Context) =>
  `${context.config.buildOptions?.site}${getPathUri(materializedPath, context)}`
