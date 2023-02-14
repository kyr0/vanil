import { join, parse, resolve } from "path"
import { Context } from "./context"
import { getPagesFolder, toProjectRootRelativePath } from "./io/folder"
import { Config } from "./config"
import { RenderContext } from "./render"

export const RE_PARAM_WRAPPERS = /[\[\]]/g

export type DynamicParameterType = 'rest' | 'named'

export interface DynamicRoutingParameterMap {
  [parameterName: string]: DynamicParameterType
}

export interface PaginationParams {
  pageSize: number
}

/** analyzes a path for being a dynamic routing path or no */
export const isDynamicRoutingPath = (path: string) => path.indexOf('[') > -1 && path.indexOf(']') > -1

/** encodes the components of an URI */
export const encodeUri = (uri: string) => uri.split('/')
    .map((pathPartName) => encodeURIComponent(pathPartName)).join('/')
    
// framework pages are stored in core/pages
const defaultFrameworkPagesPath = join('core', 'pages')

/** generates the path URI relative to the dist folder and depending on the URI format */
export const getRelativeWebPathUri = (pagePath: string, context: Context) => {

  let relativePathNoFileExt: string

  // built-in generic error report page
  if (pagePath.endsWith(join(defaultFrameworkPagesPath, '_error_report.tsx'))) {
    relativePathNoFileExt = '_error_report'
  // build-in generic error page
  } else if (pagePath.endsWith(join(defaultFrameworkPagesPath, '_error.tsx'))) {
    relativePathNoFileExt = '_error'
  // built-in 404 not found page
  } else if (pagePath.endsWith(join(defaultFrameworkPagesPath, '404.tsx'))) {
    relativePathNoFileExt = '404'
  } else {

    // removes absolute path till pages folder
    const relativePath = resolve(pagePath).replace(getPagesFolder(context.config) + '/', '')
    const parsedRelativeUri = parse(relativePath)
    relativePathNoFileExt = join(parsedRelativeUri.dir, parsedRelativeUri.name)
  }

  // encode each part of the path for use as URI
  const relativePathUriEncoded = encodeUri(relativePathNoFileExt)

  // append .html based on format or for the index.html page 
  // which is always served when / is requested
  if (context.config.buildOptions?.pageUrlFormat === 'file') {
    return relativePathUriEncoded + '.html'
  }
  return relativePathUriEncoded
}

/** generates the effective page URL based on the site and materialized path */
export const getPageUrl = (pagePath: string, context: Context) => {
  
  let relativePathUri = getRelativeWebPathUri(pagePath, context)
  if (relativePathUri.endsWith('index.html')) {
    relativePathUri = relativePathUri.replace('index.html', '')
  }
  return `${context.config.buildOptions?.site}${relativePathUri ? `/${relativePathUri}` : ''}`
}

/** parses a path (page template .tsx on disk) for its dynamic parts */
export const parseDynamicRoutingPath = (pagePath: string, context: Context): DynamicRoutingParameterMap => {
  const relativePath = toProjectRootRelativePath(pagePath, context.config!)
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

/** replaces the dynamic path parts of a route like [...foo] or [bar] by their static props per static path */
export const materializeDynamicRoute = (pagePath: string, renderContext: RenderContext, context: Context) => {
  const parsedParams = parseDynamicRoutingPath(pagePath, context)
  const paramNames = Object.keys(parsedParams)

  paramNames.forEach((paramName, index) => {
    const paramType = parsedParams[paramName]
    const paramValue = renderContext.pageParams[paramName]

    if (!paramValue) {
      throw new Error(
        `getStaticPaths() returned the following params: ${JSON.stringify(
          renderContext.pageParams,
          null,
          2,
        )} for data index ${index}, but param [${paramName}] is missing!`,
      )
    }

    pagePath = pagePath.replace(
      paramType === 'named' ? `[${paramName}]` : `[...${paramName}]`,
      paramType === 'rest' && paramValue == '1' ? '' : paramValue,
    )
  })
  return pagePath
}

/** builds and returns the baseUrl of the site such as: http://localhost:3000 */
export const getSiteUrl = (config: Config) => {
  const site = `${config.devOptions?.useTls ? 'https' : 'http'}://${config.devOptions?.hostname}`

  if (config.devOptions!.port !== 80 && config.devOptions?.port !== 443) {
    return `${site}:${config.devOptions?.port}`
  }
  return site
}

/** materializes a pagePath (path to .tsx) to a .html file path on disk */
export const materializePagePathToOutFilePath = (pagePath: string, renderContext: RenderContext, context: Context) => {
  const materializedPath = materializeDynamicRoute(pagePath, renderContext, context)
  return getRelativeWebPathUri(materializedPath, context)
}