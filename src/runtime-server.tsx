import type { StaticPathParamMap } from "./core/page";
import type { JSX } from "solid-js/jsx-runtime";
import { PublishFileFn, PageComponent, RuntimeContextAccessor, RenderPageFn, GlobFn, ClientScriptProps, PublishAsFileFn, Base64EncodeFn, Base64DecodeFn, JSXHtmlHTMLAttributes, MetaProvider, JSXHeadHTMLAttributes, JSXBodyHTMLAttributes } from "./runtime";
import type { RenderContext } from "./core/render";
import type { Context } from "./core/context";
import { For, HydrationScript as _HydrationScript, NoHydration } from "solid-js/web"
import { Content, glob as _glob } from "./core/io";
import { dirname, resolve } from "path";
import { base64Decode, base64Encode } from "./core/coding";
import { mergeProps, ParentComponent, splitProps } from "solid-js";

export type { loadFiles as _loadFiles } from "./runtime-server/load-files"
export type { publishFile as _publishFile } from "./core/action/publishFile"
export type { publishAsFile as _publishAsFile } from "./core/action/publishAsFile"

export const renderPage: RenderPageFn = (Component: PageComponent): (renderContext: RenderContext) => JSX.Element => Component as () => JSX.Element

// export abstract/isomorphic implementations

/** returns the context object that is available at render time (server and client side) */
export function getRuntimeContextAccessor<Props = unknown, Params = StaticPathParamMap>(renderContext: RenderContext<Props, Params>): RuntimeContextAccessor<Props, Params> {
    return {
        id: renderContext.pageId,
        url: renderContext.url,
        urlFormat: renderContext.urlFormat,
        site: renderContext.site,
        mode: renderContext.mode,
        type: renderContext.renderMode,
        src: renderContext.clientScriptSrc,
        params: renderContext.pageParams,
        props: renderContext.pageProps,
        env: renderContext.envPublic,
        styles: renderContext.pageStyles,
        pageSrc: renderContext.pageSrc,
        nonInteractive: renderContext.nonInteractive,
        revalidate: renderContext.revalidate,
        isServer: true
    }
}

/** returns the render context provided globally, top-level via vm's runContext */
export function getContext<Props = unknown, Params = StaticPathParamMap>(): RuntimeContextAccessor<Props, Params> {
    return _renderContext as RuntimeContextAccessor<Props, Params>
}

/** returns the server context including all private environment variables and the store */
export function getServerContext<S = unknown>(): Context<S> {
    return _context as Context<S>
}

/** renders the JavaScript for the page and its static render state, filtering server-side only props */
export const ClientScript = ({ liveReload }: ClientScriptProps = { liveReload: getContext().mode === 'development' }) => {
    const renderContext = getContext()

    // nonInteractive mode, no <script> will be injected
    // all rendered DOM nodes remain non-interactive
    // but userland code can render <script> tags anyways
    if (renderContext.nonInteractive) {
        // liveReload might still be enabled
        return <>
           {() => liveReload && <>
            <script>{`var _$CTX = ${JSON.stringify(renderContext, null, 0)};_$CTX.url = typeof document === 'undefined' ? new URL(_$CTX.url) : new URL(location.href)`}</script>
            <LiveReload />
           </>}
        </>
    }

    // hard-pin isServer to false
    renderContext.isServer = false

    // remove server-side only properties
    delete renderContext.pageSrc
    delete renderContext.revalidate

    // @ts-ignore just in transit
    renderContext.url = renderContext.url.href

    return <>
        <script>{`var _$CTX = ${JSON.stringify(renderContext, null, 0)};_$CTX.url = typeof document === 'undefined' ? new URL(_$CTX.url) : new URL(location.href)`}</script>
        <script src={getContext().src}></script>
        {() => liveReload && <LiveReload />}
    </>
}

export const HydrationScript = () => {
    if (getContext().nonInteractive) {
        return <></>
    }
    return <_HydrationScript />
}

/** renders the page JavaScript <script> tag for live reloading */
export const LiveReload = () => <script src={`${getContext().site}/js/__live-reload.js`}></script>

/** renders the styles (CSS) imported via CSS-in-JS */
export const ClientStyle = () => <>
    <For each={getContext().styles}>{
        style => <style>{style}</style>
    }</For>
</>

/** allows to load many files content using a glob pattern */
export async function loadFiles<T>(pathPattern: string): Promise<Array<T>> {
    return _loadFiles(pathPattern, getContext().pageSrc, getServerContext())
}

/** allows to load a single file using a glob pattern */
export async function loadFile<T>(pathPattern: string): Promise<T> {
   return (await _loadFiles(pathPattern, getContext().pageSrc, getServerContext()))[0] as T
}

/** copies the file in sourcePath to the dist folder or a sub directory. Returns a routable public path */
export const publishFile: PublishFileFn = (sourcePath: string, distSubDir?: string): string => {
    return _publishFile(sourcePath, getContext().pageSrc, getServerContext(), distSubDir)
}

/** copies the file in sourcePath to the dist folder or a sub directory. Returns a routable public path */
export const publishAsFile: PublishAsFileFn = (content: Content, subDirFilePath: string, encoding?: BufferEncoding): Promise<string> => {
    return _publishAsFile(content, subDirFilePath, getServerContext(), encoding)
}

/** returns the absolute paths of all files on disk that match the sourcePathPattern */
export const glob: GlobFn = (sourcePathPattern: string): Array<string> => {
    const currentPageDir = dirname(getContext().pageSrc)
    return _glob(resolve(currentPageDir, sourcePathPattern))
}

/** UTF8 compatible encoding to a base64 string */
export const encode: Base64EncodeFn = base64Encode

/** UTF8 compatible decoding from a base64 encoded string */
export const decode: Base64DecodeFn = base64Decode

// === <head>, <meta> <title> and <link> management
export const Html: ParentComponent<JSXHtmlHTMLAttributes<HTMLHtmlElement>> = (props) => {
    const [fromParent, implicitProps] = splitProps(props, ["children"])
    const tags = [];
    const m = <MetaProvider tags={tags}>
        <html {...implicitProps}>
            {fromParent.children}
        </html>
    </MetaProvider>
    getServerContext().store['tags'] = tags
    return m
}

export const Head: ParentComponent<JSXHeadHTMLAttributes<HTMLHeadElement>> = (props) => {
    const [fromParent, implicitProps] = splitProps(props, ["children"])
    return <head {...implicitProps}>
        <NoHydration>
          {`__$META_TAGS_of_${getContext().id}__`}
          {fromParent.children}
          <ClientStyle /> 
          <HydrationScript />
        </NoHydration>
    </head>
}

export const Body: ParentComponent<JSXBodyHTMLAttributes<HTMLBodyElement>> = (props) => {
    props = mergeProps({ liveReload: true }, props)
    const [fromParent, implicitProps] = splitProps(props, ["children"])
    return <body {...implicitProps}>
        {fromParent.children}
        <ClientScript liveReload={props.liveReload} />
    </body>
}

export * from "./runtime/head"