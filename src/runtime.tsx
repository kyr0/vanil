import type { Mode } from "./core/mode"
import type { JSX } from "solid-js/jsx-runtime"
import type { PageRenderMode, StaticPathParamMap, StaticPathParams as _StaticPathParams, StaticProps as _StaticProps } from "./core/page"
import type { RenderContext } from "./core/render"
import type { HydrationScript as _HydrationScript } from "solid-js/web"
import type { EnvironmentVariables } from "./core/env";
import type { PageStyles } from "./core/build";
import type { Context } from "./core/context"
import type { Content } from "./core/io/file"
import type { Component, ParentComponent } from "solid-js";
import type { PageUrlFormat } from "./core";

export type { Content as ContentType } from "./core/io/file"

export type Base64EncodeFn = (content: string) => string
export type Base64DecodeFn = (content: string) => string

export type PageComponent<P = unknown> = (renderContext: P) => JSX.Element
export type StaticPathParams<P = StaticPathParamMap> = _StaticPathParams<P>
export type StaticProps<P = {}> = _StaticProps<P> | Promise<_StaticProps<P>>

export type PropsWithChildren<P = {}> = P & { children?: JSX.Element };
export type ComponentWithChildren<P = {}> = Component<PropsWithChildren<P>>;
export type GetStaticPropsFn<P> = () => StaticProps<P>

export type RenderPageFn = (Component: PageComponent) => ((renderContext: RenderContext) => JSX.Element) | (() => void)
export type LoadFilesFn = <T = string>(pathPattern: string) => Promise<Array<T>>
export type LoadFileFn = <T = string>(pathPattern: string) => Promise<T>
export type PublishFileFn = (sourcePath: string, distSubDir?: string) => string
export type PublishAsFileFn = (content: Content, subDirFilePath: string, encoding?: BufferEncoding) => Promise<string>
export type GlobFn = (sourcePathPattern: string) => Array<string>
export type GetServerContextFn = <S = unknown>() => Context<S>

export const ERR_RUNTIME_INVARIANT = "esbuild plugin didn't select a proper client or server runtime invariant"

export const throwInvariantError = () => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

// never actually used; the implementation is selected in bundle.ts
// via a esbuild plugin to resolve the correct runtime invariant
// which is either `runtime-client` or `runtime-server`
export const renderPage: RenderPageFn = throwInvariantError as any

/** encodes the components of an URI */
/*
export const encodeUri = (uri: string) => uri.split('/')
    .map((pathPartName) => encodeURIComponent(pathPartName)).join('/')
*/

export interface RuntimeContextAccessor<Props = unknown, Params = StaticPathParamMap> {

    /** path-consistent, unique, short hash (unicode) for change detection */
    id: string

    /** url of the current page */
    url?: URL

    /** html or file url with training slash */
    urlFormat: PageUrlFormat

    /** site/base url of where the site is hosted on publicly (primarily as configured) */
    site: string

    /** usually NODE_ENV, such as 'development' or 'production'; default: 'development'  */
    mode: Mode

    /** isr, ssr or ssg */
    type: PageRenderMode

    /** materialized path to the client JS */
    src: string

    /** static path param map returned by getStaticPaths() */
    params: Params

    /** static props returned by getStaticProps() */
    props: Props

    /** public environment variables for client runtime (e.g. PULBIC_foo) @see config.envPrefix server runtime knows all env variables */
    env: EnvironmentVariables

    /** styles imported into the page via CSS-in-JS / postcss processing */
    styles: PageStyles

    /** determines wether the code currently runs on server or client side  */
    isServer: boolean

    // server-runtime only:

    /** ISR revalidation setting (server runtime only) */
    revalidate?: number

    /** path to the page source code, e.g. ./src/pages/index.tsx (server runtime only) */
    pageSrc?: string

    /** marks the page as non-interactive and wouldn't inject <script> tags at all (except the LiveReload in vanil dev mode) */
    nonInteractive?: boolean
}

export function getContext<Props = unknown, Params = StaticPathParamMap>(): RuntimeContextAccessor<Props, Params> {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export interface ClientScriptProps {
    /** overrides the default behaviour of liveReload being disabled in production */
    liveReload: boolean
}

export const ClientScript = (props: ClientScriptProps): () => JSX.Element => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export const LiveReload = (): () => JSX.Element => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export const ClientStyle = (): () => JSX.Element => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export const loadFiles: LoadFilesFn = () => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export const loadFile: LoadFileFn = () => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export const publishFile: PublishFileFn = () => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export const publishAsFile: PublishAsFileFn = () => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export const glob: GlobFn = () => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export const getServerContext: GetServerContextFn = () => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

// === <head>, <meta> <title> and <link> management
export interface JSXHtmlHTMLAttributes<T> extends JSX.HTMLAttributes<T> {}
export interface JSXHeadHTMLAttributes<T> extends JSX.HTMLAttributes<T> {}
export interface JSXBodyHTMLAttributes<T> extends JSX.HTMLAttributes<T> {
    liveReload?: boolean
}

export const Html: ParentComponent<JSXHtmlHTMLAttributes<HTMLHtmlElement>> = () => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export const Head: ParentComponent<JSXHeadHTMLAttributes<HTMLHeadElement>> = () => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export const Body: ParentComponent<JSXBodyHTMLAttributes<HTMLBodyElement>> = () => {
    throw new Error(ERR_RUNTIME_INVARIANT)
}

export type HydrationScript = typeof _HydrationScript

export * from "./runtime/head"