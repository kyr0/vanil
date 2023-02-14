import { runtimeResolvePlugin } from "./bundle/runtime-resolve-plugin"
import { build, BuildOptions } from "esbuild"
import { dirname, join, parse, resolve } from "path"
import { solidPlugin } from "./bundle/solid-plugin"
import { Context } from "./context"
import { copyFiles, getDistFolder, getPagesFolder, readFileContent, writeFileToDistFolder, __dirnameESM } from "./io"
import { hashContent } from "./cache"
import mdx from "@mdx-js/esbuild"
import { FileSizeStats, getFileSizeStats } from "./stats"
import { cssModulesPlugin, missingDependencyPlugin } from "./bundle"
import { dependencyTrackerPlugin } from "./bundle/dependency-tracker-plugin"
import { cssGlobalPlugin } from "./bundle/global-css-plugin"
import { externalizeAllNodeModulesPlugin } from "./bundle/externalize-all-node-modules-plugin"
import { getPageId } from "./page"

export type PageStyles = Array<string>

export interface PageBuild {
    distSrc?: string
    outfile: string
    styles: PageStyles
    code: string
    size: FileSizeStats
}

export interface PageBundle {
    pageId: string
    pagePath: string
    client: PageBuild
    server: PageBuild
}

/** determines the Node.js runtime version and emits matching code */
export const getEsbuildNodeTargetVersion = () => {
    if (process.version.startsWith('v16.')) {
        return 'node16'
    }
    return 'node18'
}

export const esbuildConfigBaseSsr: BuildOptions = {
  platform: "node",
  format: "esm",
  bundle: true,
  incremental: true,
  jsx: 'preserve',
  jsxImportSource: 'solid-js',
  target: 'es2020',
  logLevel: 'silent',
  sourcemap: 'external',
  minifySyntax: true,
  treeShaking: true
}

/** builds the JavaScript bundles for server and client execution */
export const buildPage = async(pagePath: string, context: Context): Promise<PageBundle> => {

    const parsedPagePath = parse(pagePath)
    const pageBaseName = parsedPagePath.name
    
    return {
        pageId: getPageId(pagePath, context.config),
        pagePath: pagePath,
        server: await buildPageServerScript(pagePath, pageBaseName, context),
        client: await buildPageClientScript(pagePath, pageBaseName, context),
    }
}

/** builds the JS of the page that is only loaded and executed on server-side */
export const buildPageServerScript = async(pagePath: string, pageBaseName: string, context: Context): Promise<PageBuild> => {

    let styles: Array<string> = []

    const outFileBaseName = `${pageBaseName}-server.js`
    const pageSubDirInDist = getPageSubPath(pagePath, context)
    const outfileTmp = join(context.tmpDir, pageSubDirInDist, outFileBaseName)

    await build({
        entryPoints: [pagePath],
        ...esbuildConfigBaseSsr,
        sourcemap: 'both',
        outfile: outfileTmp,
        define: {
            "isServer": JSON.stringify(true),
            "process.env": JSON.stringify(context.env.private)
        },
        plugins: [
            missingDependencyPlugin(),
            cssGlobalPlugin({
                cssFilePath: pagePath,
                context
            }),
            cssModulesPlugin({
                cssFilePath: pagePath,
                context,
                onCSSGenerated: (css: string) => styles.push(css),
            }),
            solidPlugin({ generate: 'ssr', hydratable: true }),
            runtimeResolvePlugin({ isServer: true }),
            mdx({
                jsxImportSource: 'solid-jsx',
                baseUrl: dirname(pagePath),
            }),
            dependencyTrackerPlugin({ context }),
            externalizeAllNodeModulesPlugin(),
        ]
    })

    const code = await readFileContent(outfileTmp)

    return {
        outfile: outfileTmp,
        code,
        styles,
        size: await getFileSizeStats(code)
    }
}

/** returns the subpath between the pages folder and the target page template (if in subdir) */
export const getPageSubPath = (pagePath: string, context: Context) => {
    const parsedPath = parse(pagePath).dir
    let subPath = parsedPath.replace(getPagesFolder(context.config), '')

    if (subPath.startsWith('/')) {
        subPath = subPath.substring(1)
    }
    return subPath
}

/** builds the JS of the page that is only loaded and executed in-browser */
export const buildPageClientScript = async(pagePath: string, pageBaseName: string, context: Context): Promise<PageBuild> => {
    const outFileBaseName = `${pageBaseName}.js`
    let pageSubDirInDist = getPageSubPath(pagePath, context)

    // framework-interal page (_error_report.tsx or 404.tsx), reset to no subDir
    if (pageSubDirInDist.endsWith('core/pages')) {
        pageSubDirInDist = ''
    }

    const outfileTmp = join(context.tmpDir, pageSubDirInDist, outFileBaseName)
    let styles: Array<string> = []

    await build({
        entryPoints: [pagePath],
        bundle: true,
        incremental: true,
        jsx: 'preserve',
        loader: {
            '.js': 'jsx'
        },
        jsxImportSource: 'solid-js',
        define: {
            "isServer": JSON.stringify(false),
            "process.env": JSON.stringify(context.env.public)
        },
        format: 'iife',
        minifySyntax: true,
        platform: 'browser',
        minify: context.mode === 'production',
        sourcemap: context.mode === 'production' ? false : 'linked',
        outfile: outfileTmp,
        target: 'es2020',
        plugins: [
            cssGlobalPlugin({
                cssFilePath: pagePath,
                context
            }),
            cssModulesPlugin({
                cssFilePath: pagePath,
                context,
                onCSSGenerated: (css: string) => styles.push(css),
            }),
            solidPlugin({ generate: 'dom', hydratable: true }),
            runtimeResolvePlugin({ isServer: false, dedup: true }),
            mdx({
                jsxImportSource: 'solid-jsx',
                baseUrl: dirname(pagePath),
            }),
        ]
    })
    const code = await readFileContent(outfileTmp)
    const scriptHashedBaseName = `js/${pageBaseName}.${hashContent(code)}.js`
    const outfile = await writeFileToDistFolder(join(pageSubDirInDist, scriptHashedBaseName), code, context)

    // copy over .map file
    if (context.mode !== 'production') {

        // copy the built sourcemap of the page to the dist folder
        copyFiles(`${outfileTmp}.map`, `${join(getDistFolder(context.config), pageSubDirInDist, 'js', pageBaseName)}.js.map`)

        // copy runtime-client.js.map to dist folder for better debugging experience
        copyFiles(resolve(__dirnameESM(), 'runtime-client.js.map'), 
            join(getDistFolder(context.config), 'runtime-client.js.map')
        )
    }

    return {
        // to allow for correct <script src={scriptHashedBaseName}> reference
        // when server-runtime's <ClientScript /> is evaluated
        distSrc: scriptHashedBaseName,
        outfile,
        code,
        styles,
        size: await getFileSizeStats(code)
    }
}