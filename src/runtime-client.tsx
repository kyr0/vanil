import type { StaticPathParamMap } from "./core/page";
import type { JSX } from "solid-js/jsx-runtime";
import { PublishFileFn, LoadFileFn, LoadFilesFn, PageComponent, RuntimeContextAccessor, RenderPageFn, GlobFn, GetServerContextFn, ClientScriptProps, PublishAsFileFn, Base64EncodeFn, Base64DecodeFn, JSXHtmlHTMLAttributes, MetaProvider, JSXHeadHTMLAttributes, JSXBodyHTMLAttributes } from "./runtime";
import { For, hydrate, HydrationScript as _HydrationScript, NoHydration, render } from "solid-js/web"
import { getOwner, mergeProps, ParentComponent, splitProps } from "solid-js";

/** hydrates the server-side rendered (SSR) content, state and registers interactive DOM event listeners where necessary */
export const renderPage: RenderPageFn = (Component: PageComponent): () => void => {
    if (getContext().nonInteractive) {
        console.log('no hydration')
        return render(Component as () => JSX.Element, document)
    }
    return hydrate(Component as () => JSX.Element, document, { owner: getOwner() })
} 

/** returns the client-side only render context as rendered by server-side <ClientScript> implementation */
export function getContext<Props = unknown, Params = StaticPathParamMap>(): RuntimeContextAccessor {
    return {
        ...globalThis._$CTX,
        env: process.env
    }
}

export const HydrationScript = () => {
    if (getContext().nonInteractive) {
        return <></>
    }
    return <_HydrationScript />
}

/** renders the styles (CSS) imported via CSS-in-JS (required for hydration consistency) */
export const ClientStyle = () => <>
    <For each={getContext().styles}>{
        style => <style>{style}</style>
    }</For>
</>

/** renders the page JavaScript <script> tag for live reloading */
export const LiveReload = () => <script async src={`${getContext().site}/js/__live-reload.js`}></script>

/** renders the page JavaScript <script> tag (required for hydration consistency) */
export const ClientScript = ({ liveReload }: ClientScriptProps = { liveReload: getContext().mode === 'development' }) => <>
    <script>{`var _$CTX = "${JSON.stringify(getContext(), null, 0)}";_$CTX.url = typeof document === 'undefined' ? new URL(_$CTX.url) : new URL(location.href)`}</script>
    <script src={getContext().src}></script>
    {() => liveReload && <LiveReload />}
</>

/** UTF8 compatible encoding to a base64 string */
export const encode: Base64EncodeFn = (content: string) => btoa(
    encodeURIComponent(content).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))))

/** UTF8 compatible decoding from a base64 encoded string */
export const decode: Base64DecodeFn = (content: string) => 
    decodeURIComponent(Array.prototype.map.call(
        atob(content), (c: string) => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''))

let _loadFiles: LoadFilesFn
let _loadFile: LoadFileFn
let _publishFile: PublishFileFn
let _publishAsFile: PublishAsFileFn
let _glob: GlobFn
let _getServerContext: GetServerContextFn

// only export/declare it in development mode, 
// in production it's going to be dead-code eliminated for the client-runtime
if (getContext().mode === 'development') {
    const getErrorMessage = (fnSignature: string) => `Using ${fnSignature} is not allowed here. Wrap this code like this: if (isServer) { ...the code... }`
    _loadFiles = () => {
        throw new Error(getErrorMessage('loadFiles(pathPattern)'))
    }
    _loadFile = () => {
        throw new Error(getErrorMessage('loadFile(pathPattern)'))
    }
    _publishFile = () => {
        throw new Error(getErrorMessage('publishFile(sourcePath, distSubDir?)'))
    }
    _publishAsFile = () => {
        throw new Error(getErrorMessage('publishAsFile(content, subDirFilePath, encoding?)'))
    }
    _glob = () => {
        throw new Error(getErrorMessage('glob(sourcePathPattern)'))
    }
    _getServerContext = () => {
        throw new Error(getErrorMessage('getServerContext()'))
    }
}

export const loadFiles = _loadFiles
export const loadFile = _loadFile
export const publishFile = _publishFile
export const publishAsFile = _publishAsFile
export const glob = _glob
export const getServerContext = _getServerContext

// === <head>, <meta> <title> and <link> management
export const Html: ParentComponent<JSXHtmlHTMLAttributes<HTMLHtmlElement>> = (props) => {
    const [fromParent, implicitProps] = splitProps(props, ["children"])
    return <MetaProvider>
        <html {...implicitProps}>
            {fromParent.children}
        </html>
    </MetaProvider>
}

export const Head: ParentComponent<JSXHeadHTMLAttributes<HTMLHeadElement>> = (props) => {
    const [fromParent, implicitProps] = splitProps(props, ["children"])
    return <head {...implicitProps}>
        <NoHydration>
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

export * from "solid-js/web"
export * from "./runtime/head"