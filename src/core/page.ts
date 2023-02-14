import * as colors from 'kleur/colors'
import { RunContext, runPage } from "./vm"
import { buildPage, PageBundle } from "./build"
import { getSiteUrl, isDynamicRoutingPath, materializePagePathToOutFilePath } from "./routing"
import { getPages, getPagesFolder, getProjectRootFolder, readFileContent, toPagesRelativePath, toProjectRootRelativePath, writeFileToDistFolder, __dirnameESM } from "./io"
import { getRenderContext, renderHtml } from "./render"
import { getFileSizeStats, FileSizeStats, printFileSizeStats } from "./stats"
import type { RenderContext } from "./render"
import { getRuntimeContextAccessor } from "../runtime-server"
import { RuntimeContextAccessor } from "../runtime"
import { Config } from "./config"
import { Context } from "./context"
import { join, resolve } from "path"
import { parsePagePublishError, fatalError, printBuildError, nonFatalError, EsbuildError } from "./lang"
import { ChangeOperation, notifyPageChange } from './live-reload'
import { PublishError } from "./lang"
import { hashContent } from './cache'
import { publishAsFile } from './action'
import { Message } from 'esbuild'

export interface PagePublishStatus {
  operation: ChangeOperation
  publishError?: PublishError
}

export interface LatestPagePublishStatus {
  [pageId: string]: PagePublishStatus
}

export interface StaticPathParamMap {
  [paramName: string]: string
}

export interface StaticPathParams<P = StaticPathParamMap> {
  params: P
}

export interface StaticPaths {
  paths: Array<StaticPathParams>,
  fallback: boolean | 'blocking'
}

export interface Props {
  [key: string]: unknown
}

export interface StaticProps<P = Props> {
  props: P
  revalidate?: number
  nonInteractive?: boolean
}

export type PageRenderMode = 'undetermined' | 'ssg' | 'ssr' | 'isr'

export interface PageRenderOptions {
    mode: PageRenderMode
}

export type PageComponent = (renderContext: RuntimeContextAccessor) => unknown

export type PageParamsAndProps = StaticPathParams & StaticProps & PageRenderOptions

export type GetServerSidePropsFn = (staticParams: StaticPathParams) => Promise<StaticProps>

export interface PageLinked {
  pagePath: string
  isDynamic: boolean
  perPath: Array<RenderContext>
  runContext: RunContext
  PageComponent: PageComponent
  getServerSideProps: GetServerSidePropsFn
}

export interface PageExecutionResult {
    default: PageComponent
    getStaticPaths: () => Promise<StaticPaths>
    getStaticProps: (staticParams: StaticPathParamMap) => Promise<StaticProps> 
    getServerSideProps: GetServerSidePropsFn
}


/** executed one-time at build time per materialized path */
export const evaluateStaticProps = async(
    executionResult: PageExecutionResult,
    staticPathParams: StaticPathParams = { params: {} },
    pageBundle: PageBundle,
    context: Context
): Promise<StaticProps> => {

  const defaultReturn = {
    props: {}
  }

  if (typeof executionResult.getStaticProps === 'function') {

        const staticProps = await executionResult.getStaticProps(staticPathParams.params)

        if (typeof staticProps.props !== 'object') {

          setLatestPagePublishStatus(pageBundle.pagePath, {
            operation: 'error',
            publishError: {
              type: 'PAGE_LINK_ERROR',
              error: {
                code: 'PAGE_LINK_ERROR_WRONG_IMPL',
                details: `When getStaticPaths() is implemented, it must return an object with a property named "props" which needs to be an Object that holds the values to be passed the the Pages component for rendering:
  // e.g. when props.foo should evaluate as 'bar' in the component
  { 
    props: {
      foo: 'bar'
    }
  }`,
                reasonCode: 'getStaticPropsReturnValueIsWrong',
                location: {
                  filePath: toProjectRootRelativePath(pageBundle.pagePath, context.config),
                  column: 0,
                  line: 0
                },
                errorMessage: `Page ${toProjectRootRelativePath(pageBundle.pagePath, context.config)} should return StaticProps in getStaticProps()`
              }
            }
          }, context)

          await publishErrorReportAndPage(pageBundle.pagePath, context)

          printBuildError(pageBundle.pageId, context)
          
          return defaultReturn
        }
        return staticProps
    } else {
        // it's okay that a page has no getStaticProps() implemented at all
        return defaultReturn
    }
}

/** automatically determines the renderMode based on what features are implemented per page */
export const getPageRenderMode = (executionResult: PageExecutionResult, staticProps: StaticProps): PageRenderMode => {
    if (typeof executionResult.getServerSideProps === 'function') return 'ssr'
    if (staticProps.revalidate) return 'isr'
    return 'ssg' 
}

/** runs a pages server side JS and returns it's materialized paths, props and component  */
export const linkPage = async(pageBundle: PageBundle, context: Context, renderContextOverrides: Partial<RenderContext> = {}): Promise<PageLinked> => {

  const perPath: Array<RenderContext> = []
  const isDynamic = isDynamicRoutingPath(pageBundle.pagePath)
  const renderContext = {
    // default renderContext logic
    ...getRenderContext(
      context.mode, pageBundle.client.distSrc, {}, {}, 
      context.env.public, pageBundle.client.styles, 
      getSiteUrl(context.config), pageBundle.pageId, pageBundle.pagePath, 'undetermined', 
      context.config.buildOptions.pageUrlFormat
    ),
    // provide overrides for the renderContext
    ...renderContextOverrides
  }

  const executionResult = (await runPage<PageExecutionResult>(
    pageBundle.server.code, getRuntimeContextAccessor(renderContext), context
  ))

  // used to render the hydratable SSR output function
  const PageComponent = executionResult.exports.default

  const errorReturn = {
    runContext: executionResult.global,
    pagePath: pageBundle.pagePath,
    getServerSideProps: executionResult.exports.getServerSideProps,
    isDynamic,
    PageComponent,
    perPath
  }

  const overridePageProps = renderContextOverrides.pageProps ?? {}

  if (!isDynamic) {
    const staticPathParams: StaticPathParams = { params: {} }

    const staticProps = await evaluateStaticProps(executionResult.exports, staticPathParams, pageBundle, context)

    return {
        runContext: executionResult.global,
        pagePath: pageBundle.pagePath,
        isDynamic,
        PageComponent,
        getServerSideProps: executionResult.exports.getServerSideProps,
        perPath: [{
          ...renderContext,
          pageProps: {
            ...staticProps.props,
            ...overridePageProps
          },
          pageParams: staticPathParams.params,
          nonInteractive: staticProps.nonInteractive,
          renderMode: getPageRenderMode(executionResult.exports, staticProps)
        }]
    }
  } else {

    let staticPaths: StaticPaths

    // executed one-time at build time to get input for materializing paths
    // for dynamic routes. Not executed for static pages
    if (typeof executionResult.exports.getStaticPaths === 'function') {
        staticPaths = await executionResult.exports.getStaticPaths()

        if (!Array.isArray(staticPaths.paths)) {

          setLatestPagePublishStatus(pageBundle.pagePath, {
            operation: 'error',
            publishError: {
              type: 'PAGE_LINK_ERROR',
              error: {
                code: 'PAGE_LINK_ERROR_WRONG_IMPL',
                details: `When getStaticPaths() is implemented, it must return an object with a property named "paths" which needs to be an Array where each member is an Object that maps between the path variable name and its action value to materialize that path:
  // when a page would be called ./pages/[foo].tsx, a /bar.html would be generated
  return {
    paths: [{
      foo: 'bar'
    }]
  }`,
                reasonCode: 'getStaticPathsReturnValueIsWrong',
                location: {
                  filePath: toProjectRootRelativePath(pageBundle.pagePath, context.config),
                  column: 0,
                  line: 0
                },
                errorMessage: `Page ${toProjectRootRelativePath(pageBundle.pagePath, context.config)} should return Array<StaticPathParams<StaticPathParamMap>> in getStaticPaths()`
              }
            }
          }, context)

          await publishErrorReportAndPage(pageBundle.pagePath, context)

          printBuildError(pageBundle.pageId, context)

          return errorReturn
      }
    } else {

          setLatestPagePublishStatus(pageBundle.pagePath, {
            operation: 'error',
            publishError: {
              type: 'PAGE_LINK_ERROR',
              error: {
              code: 'PAGE_LINK_ERROR_MISSING_IMPL',
              details: 'When the route of the page has dynamic components such as [variable] or ...rest operators, the page needs to implement the export function getStaticPaths(), otherwise the framework could not know which values to use for the variables and no actual page paths could be materialized.',
              reasonCode: 'getStaticPathsNotImplemented',
              location: {
                filePath: toProjectRootRelativePath(pageBundle.pagePath, context.config),
                column: 0,
                line: 0
              },
              errorMessage: `Page "${toProjectRootRelativePath(pageBundle.pagePath, context.config)}" should implement getStaticPaths() because it is dynamic`
            }
            }
          }, context)

          await publishErrorReportAndPage(pageBundle.pagePath, context)

          printBuildError(pageBundle.pagePath, context)

          return errorReturn
    }

    if (staticPaths.paths.length === 0) {
      console.warn(`Page "${toProjectRootRelativePath(pageBundle.pagePath, context.config)}" evaluateStaticProps() does not return at single path, so effectively, no actual page materialized here.`)
    }

    if (Array.isArray(staticPaths.paths)) {

        for (let i=0; i<staticPaths.paths.length; i++) {
      
            const staticProps = await evaluateStaticProps(executionResult.exports, staticPaths.paths[i], pageBundle, context)

            perPath.push({
              ...renderContext,
              pageParams: staticPaths.paths[i].params,
              pageProps: {
                ...staticProps.props,
                ...overridePageProps
              },
              renderMode: getPageRenderMode(executionResult.exports, staticProps),
              revalidate: staticProps.revalidate,
              nonInteractive: staticProps.nonInteractive
            })
        }
    }
  }
  return {
    runContext: executionResult.global,
    pagePath: pageBundle.pagePath,
    getServerSideProps: executionResult.exports.getServerSideProps,
    isDynamic,
    PageComponent,
    perPath
  }
}

export interface PageRenderResult {
    relativePath: string
    code: string
    outfile: string
    size: FileSizeStats
}

export type RenderContextWithResult = RenderContext & PageRenderResult

export interface PageRendered extends PageLinked {
  perPath: Array<RenderContextWithResult>
}

/** renders a page and all its materializable paths statically to disk */
export const renderPage = async(pageLinked: PageLinked, context: Context): Promise<PageRendered> => {
    const pageRendered: PageRendered = {
        ...pageLinked,
        perPath: []
    }

    for (let i=0; i<pageLinked.perPath.length; i++) {
        const renderContext = pageLinked.perPath[i]

        switch (renderContext.renderMode) {
            // default mode, may see getStaticPaths and getStaticProps implemented
            case 'ssg':
                const relativeWebPath = materializePagePathToOutFilePath(pageLinked.pagePath, renderContext, context)

                // assign url to renderContext so that it's available at render time
                renderContext.url = new URL(relativeWebPath, getSiteUrl(context.config))

                const code = await renderHtml(pageLinked.PageComponent, renderContext, pageLinked.runContext)
                const outfile = await writeFileToDistFolder(relativeWebPath, code, context)
              
                pageRendered.perPath.push({
                    ...renderContext,
                    relativePath: relativeWebPath,
                    code,
                    outfile,
                    size: await getFileSizeStats(code)
                })  
                
                // add materialized path to the map so that it can be used, e.g. for sitemap or live-reload/change detection
                addRenderedPagePath(relativeWebPath, pageLinked.pagePath, context)

                break;
            case 'isr':
                // when 'revalidate' is returned by getStaticProps
                throw new Error('isr page render mode is not implemented yet')
            case 'ssr':
                // when getServerSideProps is implemented
                throw new Error('ssr page render mode is not implemented yet')
        }   
    }
    return pageRendered
}

export interface PagePublished {
  pageBundle: PageBundle,
  pageLinked: PageLinked,
  pageRendered: PageRendered
}

export interface PagePublishOptions {

  /** prints the build stats to the console */
  printStats?: boolean

  /** allows to override specific values of the renderContext; use wisely */
  renderContextOverrides?: Partial<RenderContext>
}

/** publishes the generic _error_report page to display a build/link/render error */
export const publishErrorReportAndPage = async(pagePath: string, context: Context) => {

  let publishedErrorPage: PagePublished

  const errorReportPagePath = join(__dirnameESM(), 'core', 'pages', '_error_report.tsx')

  // generate in parallel (intentionally, because this is loaded async)
  writeStaticPageErrorReport(pagePath, context)

  publishedErrorPage = await publishPage(errorReportPagePath, context, { printStats: false })

  //notifyPageStatusChanged(pagePath, 'error', context)

  return publishedErrorPage
}

// TODO: publicGeneralErrorPage (_error) with logic to check for custom one
// TODO: publicNotFoundErrorPage (404) with logic to check for custom one
// TODO: publicInternalServerErrorPage (505) with logic to check for custom one

export const pagePublishOptionsDefaults: PagePublishOptions = { printStats: true }

/** consistent, short and fast page id for reload tracking */
export const getPageId = (pagePath: string, config: Config) =>
   hashContent(toPagesRelativePath(pagePath, config))

/** materializes page file paths of a source pagePath that errored while rendering */
export const getErrorPageFilePaths = (pagePath: string, errorPageRenderContext: RenderContext, context: Context, pageLinked?: PageLinked) => {

  const errorPagePaths: Array<string> = pageLinked ? pageLinked.perPath.map(renderContextPerPath => 
      materializePagePathToOutFilePath(pagePath, renderContextPerPath, context)) : []

  if (errorPagePaths.length === 0) {
    errorPagePaths.push(materializePagePathToOutFilePath(pagePath, errorPageRenderContext, context))
  }
  return errorPagePaths
}

/** renders the _error page in place of the pagePath to render (if possible), generates an error report, renders it to console and JSON as well as _error_report.html */
export const handlePagePublishingError = async(err: EsbuildError<Message>, pagePath: string, context: Context, pageLinked?: PageLinked) => {

  // publish the _error page
  if (pageLinked || !isDynamicRoutingPath(pagePath)) {

    // TODO: support userland _error.tsx
    const errorPagePath = join(__dirnameESM(), 'core', 'pages', '_error.tsx')
    
    // we cause an impagination for an error page
    const pagePublished = await publishPage(errorPagePath, context, { 
      printStats: true, renderContextOverrides: { 
        // pageId of the page that originally errored out,
        // so that the general error 
        pageId: getPageId(pagePath, context.config),

        pageProps: {
          // provide the vanil command to check
          command: context.command
        }
      } 
    })

    // get materialized file paths (.html) that would have been rendered if the page didn't error out while rendering
    const errorPageFilePaths = getErrorPageFilePaths(pagePath, pagePublished.pageRendered.perPath[0], context, pageLinked)

    // copy the error page to all original page files that could be resolved (overwise leads to 404)
    for (let i=0; i<errorPageFilePaths.length; i++) {
      const srcFile = resolve(getProjectRootFolder(context.config), pagePublished.pageRendered.perPath[0].outfile)
      await publishAsFile(await readFileContent(srcFile), errorPageFilePaths[i], context) 
    }
  }

  try { 
    const pagePublishError = parsePagePublishError(err, context)

    if (!pagePublishError || pagePath.endsWith('_error_report.tsx')) {
      console.error(err)
      fatalError('An error happend while handling a previous error. Circuit breaker. Exiting.')
    }

    setLatestPagePublishStatus(pagePath, {
      operation: 'error',
      publishError: {
        type: 'PAGE_BUILD_ERROR',
        error: pagePublishError
      }
    }, context)

    if (context.command === 'dev') {
      await publishErrorReportAndPage(pagePath, context)
    }

    printBuildError(getPageId(pagePath, context.config), context)

  } catch(recoveryError) {
    console.error(recoveryError)
    fatalError('An error happend while parsing an error to recover from a previous error. Exiting.')
  }
  nonFatalError(`Publishing of page ${colors.white(toProjectRootRelativePath(pagePath, context.config))} stopped because of the above error.`)
}

/** publishes a page by building, linking and rendering it statically or via SSR code generation */
export const publishPage = async(
  pagePath: string, context: Context, options: PagePublishOptions = pagePublishOptionsDefaults
): Promise<PagePublished> => {

    // might be re-used in catch clause when execution only errored in renderPage()
    // in this case, the page paths are materialized and _error pages can be in-place rendered
    let pageLinked: PageLinked
    try { 
      if (options.printStats) {
        console.time('Page built in')
      }

      console.log(`${colors.bold(`${colors.white("[")}${colors.dim('=>')}${colors.white("]")}`)} ${colors.dim("Publishing page")} ${colors.white(toProjectRootRelativePath(pagePath, context.config))} ${colors.dim("...")}`)
      const pageBundle = await buildPage(pagePath, context)
      pageLinked = await linkPage(pageBundle, context, options.renderContextOverrides)
      const pageRendered = await renderPage(pageLinked, context)

      const pagePublished: PagePublished = {
        pageBundle,
        pageLinked,
        pageRendered
      }

      if (options.printStats) {
        console.timeEnd('Page built in')
      }
      
      notifyPageStatusChanged(pagePath, 'publish', context)

      printPageFileSizeStats(pagePublished)

      return pagePublished
    } catch (err) {
        await handlePagePublishingError(err, pagePath, context, pageLinked)
    }   
}

/** publishes all pages that are found in config.pages folder */
export const publishPages = async(
  context: Context, options: PagePublishOptions = pagePublishOptionsDefaults
): Promise<Array<PagePublished>> => {

  console.time('All pages build in')
  const pagePaths = getPages(context.config)
  const publishedPages = []

  for (let i=0; i<pagePaths.length; i++) {
      publishedPages.push(
        await publishPage(pagePaths[i], context, {
          ...options,
          printStats: false
        })
      )
  }
  console.timeEnd('All pages build in')
  return publishedPages
}

/** prints the file size stats (gzipped) for a page and all its materialized paths (in case it implements getStaticPaths()) */
export const printPageFileSizeStats = (page: PagePublished) => {
    printFileSizeStats(
        page.pageBundle.client.outfile, 
        page.pageBundle.client.size
    )

    for (let j=0; j<page.pageRendered.perPath.length; j++) {
        printFileSizeStats(
            page.pageRendered.perPath[j].outfile, 
            page.pageRendered.perPath[j].size
        )
    }
}

/** verfies if a .tsx page template is stored in the pages folder */
export const isPage = (pageFileCandidatePath: string, config: Config) =>
  pageFileCandidatePath.indexOf(getPagesFolder(config)) > -1 && 
  pageFileCandidatePath.endsWith('.tsx')

/** distinctively adds a rendered page path (routable in browser) to the map */
export const addRenderedPagePath = (renderedPath: string, pagePath: string, context: Context) => {
  if (!context.renderedPagePaths![pagePath]) context.renderedPagePaths![pagePath] = []

  if (context.renderedPagePaths![pagePath].indexOf(renderedPath) === -1) {
    context.renderedPagePaths![pagePath].push(renderedPath)
  }
}

/** sets the latest publish status of a page in context, so that error tracking can work correctly across all state transitions */
export const setLatestPagePublishStatus = (pagePath: string, pagePublishStatus: PagePublishStatus, context: Context) => {
  const pageId = getPageId(pagePath, context.config)

  context.latestPagePublishStatus[pageId] = pagePublishStatus

  // notify via live-reload
  notifyPageStatusChanged(pagePath, pagePublishStatus.operation, context)
}

/** sends a publish notification for a specific page and all its materialized paths */
export const notifyPageStatusChanged = (pagePath: string, operation: ChangeOperation, context: Context) => {
    notifyPageChange(getPageId(pagePath, context.config), 'html', operation, context)
}

/** writes a JSON error report to dist: _static-error-reports/$pageId.json */
export const writeStaticPageErrorReport = async(pagePath: string, context: Context): Promise<string> => {
    const pageId = getPageId(pagePath, context.config)

    if (!context.latestPagePublishStatus[pageId] || 
        context.latestPagePublishStatus[pageId].operation !== 'error' ||
        !context.latestPagePublishStatus[pageId].publishError ||
        !context.latestPagePublishStatus[pageId].publishError.error) {
      throw new Error(`Cannot write an error report for page with id ${pageId} that has no error.`)
    }

    return publishAsFile(
      JSON.stringify(context.latestPagePublishStatus[pageId].publishError.error, null, 2), 
      `_static-error-reports/${pageId}.json`,
      context,
      'utf-8'
    )
}

/** reads a JSON error report that has been written to disk */
export const readStaticErrorReport = async(pagePath: string, context: Context): Promise<PagePublishStatus> => {
  const pageId = getPageId(pagePath, context.config)
  return JSON.parse(await readFileContent(`_static-error-reports/${pageId}.json`))
}