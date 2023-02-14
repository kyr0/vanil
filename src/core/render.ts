import { renderToString } from "solid-js/web"
import { PageComponent, PageRenderMode, StaticPathParamMap } from "./page"
import type { Mode } from "./mode"
import type { RunContext } from "./vm"
import type { EnvironmentVariables } from "./env"
import { getRuntimeContextAccessor } from "../runtime-server"
import { PageStyles } from "./build"
import { renderTags } from "../runtime/head"
import { PageUrlFormat } from "./config"
import { createRoot, getOwner } from "solid-js"

/** context information object that is accessible at render time */
export interface RenderContext<Props = object, Params = StaticPathParamMap> {

    /** url of the current page */
    url?: URL

    /** base url of where the site is hosted on publicly (primarily as configured) */
    site: string

    /** url format file ending with training slash / or html as in .html */
    urlFormat: PageUrlFormat

    /** usually NODE_ENV, such as 'development' or 'production'; default: 'development'  */
    mode: Mode

    /** isr, ssr or ssg */
    renderMode: PageRenderMode

    /** materialized path to the client JS */
    clientScriptSrc: string

    /** static path param map returned by getStaticPaths() */
    pageParams: Params

    /** static props returned by getStaticProps() */
    pageProps: Props

    /** PUBLIC_ environment variables */
    envPublic: EnvironmentVariables

    /** styles imported into the page via CSS-in-JS / postcss processing */
    pageStyles: PageStyles

    /** path-consistent, unique, short hash (unicode) for change detection */
    pageId: string

    // server-runtime only:

    /** path to the page source code, e.g. ./src/pages/index.tsx */
    pageSrc: string

    /** ISR revalidation setting */
    revalidate?: number

    /** marks the page as non-interactive and wouldn't inject <script> tags at all (except the LiveReload in vanil dev mode) */
    nonInteractive?: boolean
}

/** returns the context object that is available at render time */
export function getRenderContext<Props = unknown, Params = StaticPathParamMap>(
    mode: Mode, clientScriptSrc: string, pageParams: Params, 
    pageProps: Props, publicEnv: EnvironmentVariables, pageStyles: PageStyles, 
    site: string, pageId: string, pageSrc: string, 
    renderMode: PageRenderMode = 'ssg', pageUrlFormat: PageUrlFormat): RenderContext<Props, Params> {
    return {
        urlFormat: pageUrlFormat,
        mode: mode,
        renderMode,
        clientScriptSrc: clientScriptSrc,
        pageParams: pageParams,
        pageProps: pageProps,
        envPublic: publicEnv,
        pageStyles,
        pageId,
        pageSrc,
        site,
    }
}

/** SSG renders a component into an HTML string and returns it */
export const renderHtml = async(Component: PageComponent, renderContext: RenderContext, runContext: RunContext): Promise<string> => {

    const renderedHtml = renderToString(() => {
        // set vm execution context renderContext object reference
        return createRoot(() => Component(
            runContext._renderContext = getRuntimeContextAccessor(renderContext)
        ), getOwner())
    })
    const renderedTags = renderTags(runContext._context.store['tags'] || [])

    return renderedHtml.replace(`__$META_TAGS_of_${renderContext.pageId}__`, renderedTags)
}