import { Context } from './context'
import { PageParamsAndProps } from './routing'
import { ChangeLanguageFn, i18nApi, Language, SetTranslationsFn, TranslationFn, Translations } from './runtime/i18n'
import { LoadFn, LoadForSessionFn, SaveFn, SaveForSessionFn, Store, StoreApi } from './runtime/store'
import { IVirtualChild, VDomApi } from './runtime/vdom'
import { AddEventHandlerFn, EventApi, EventRegistryMap, GenericEventHandlerFn } from './runtime/event'
import { ElementRefs, RenderApi, RenderFn } from './runtime/render'
import { BusApi, EmitFn, ListenFn, MuteFn, Subscribers } from './runtime/bus'
import { QueryApi, QueryFn } from './runtime/query'
import { TsxFn } from './runtime/vdom'
import { GetFn, SetFn } from './runtime/store'
import { DebugFn } from './runtime/components/Debug'
import { CodeFn } from './runtime/components/Code'
import { LinkFn } from './runtime/components/Link'
import { ScriptFn } from './runtime/components/Script'
import { TransFn } from './runtime/components/Trans'
import { MarkdownFn } from './runtime/components/Markdown'
import { TranslationFnNs } from '.'

// all runtime types
export * from './runtime/index'

export interface SSGRuntime extends StoreApi, i18nApi {
  mode: 'development' | 'production'

  slots: {
    [slotName: string]: IVirtualChild
  }
  request: {
    url: string
  } & PageParamsAndProps
  props: {
    context: Context
    state: any
    [propName: string]: any
  }
  fetch: FetchFn
  resolve: ResolveFn
  fetchContent: FetchContentFn
  restartOnFileChange: RestartOnFileChangeFn
  setPropsState: SetPropsStateFn
  isPage: boolean
  isBrowser: boolean
  site: string

  // isomorphic components
  Debug: typeof Debug
  Script: typeof Script
  Link: typeof Link
  Code: typeof Code
  Trans: typeof Trans
  Markdown: typeof Markdown
}

export interface InteractiveRuntime extends SSGRuntime, BusApi, QueryApi, EventApi, VDomApi, RenderApi {
  /**
   * checks the exports type (called with typeof exports) and
   * returns an empty object or the exisiting one in scope
   */
  exports: (exportsType: string) => { [exportName: string]: any }
}

// runtime state
export type JSONSerializable = string | number | object | Array<JSONSerializable> | boolean | null

export type RuntimeState = { [key: string]: JSONSerializable }

// (Astro/Vanil).props
export declare const props: {
  [key: string]: any
  context: Context
}

// (Astro/Vanil).request
export declare const request: {
  params: {
    [key: string]: any
  }
  url: string
}

// (Astro/Vanil).fetch
export type FetchFn = (input: RequestInfo, init?: RequestInit) => Promise<Response>
export declare const fetch: FetchFn

// (Astro/Vanil).fetchContent
export type FetchContentFn = (pathGlob: string) => Array<any>
export declare const fetchContent: FetchContentFn

// (Astro/Vanil).resolve
export type ResolveFn = (path: string) => string
export declare const resolve: ResolveFn

// (Astro/Vanil).restartOnFileChangeFn
export type RestartOnFileChangeFn = (path: string) => void
export declare const restartOnFileChange: RestartOnFileChangeFn

// (Astro/Vanil).isPage
export declare const isPage: boolean

// built-in Components
export declare const Debug: DebugFn
export declare const Code: CodeFn
export declare const Link: LinkFn
export declare const Script: ScriptFn
export declare const Trans: TransFn
export declare const Markdown: MarkdownFn

// VdomApi
export declare const tsx: TsxFn

// QueryApi
export declare const $: QueryFn

// RenderApi
export declare const render: RenderFn
export declare const refs: ElementRefs

// EventApi
export declare const e: GenericEventHandlerFn
export declare const events: EventRegistryMap
export declare const on: AddEventHandlerFn

// i18nApi
export declare const language: Language
export declare const translations: Translations
export declare const changeLanguage: ChangeLanguageFn
export declare const t: TranslationFn
export declare const tNs: TranslationFnNs
export declare const setTranslations: SetTranslationsFn

// BusApi
export declare const emit: EmitFn
export declare const mute: MuteFn
export declare const listen: ListenFn
export declare const subscribers: Subscribers

// StoreApi
export declare const store: Store
export declare const get: GetFn
export declare const set: SetFn
export declare const load: LoadFn
export declare const save: SaveFn
export declare const loadForSession: LoadForSessionFn
export declare const saveForSession: SaveForSessionFn

// runtime state API
export type SetPropsStateFn = (state: RuntimeState) => void
export declare const setPropsState: SetPropsStateFn
