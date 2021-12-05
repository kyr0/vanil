import { Context } from './context'
import { PageParamsAndProps } from './routing'
import { ChangeLanguageFn, i18nApi, Language, SetTranslationsFn, TranslationFn, Translations } from './runtime/i18n'
import { LoadFn, LoadForSessionFn, SaveFn, SaveForSessionFn, Store, StoreApi } from './runtime/store'
import { IVirtualChild, VDomApi } from './runtime/vdom'

import { Debug } from '../core/runtime/components/Debug'
import { Script } from '../core/runtime/components/Script'
import { Link } from '../core/runtime/components/Link'
import { Code } from '../core/runtime/components/Code'
import { Trans } from '../core/runtime/components/Trans'
import { AddEventHandlerFn, EventApi, EventRegistryMap, GenericEventHandlerFn } from './runtime/event'
import { ElementRefs, RenderApi, RenderFn } from './runtime/render'
import { BusApi, EmitFn, ListenFn, MuteFn, Subscribers } from './runtime/bus'
import { QueryApi, QueryFn } from './runtime/query'
import { TsxFn } from './runtime/vdom'
import { GetFn, SetFn } from './runtime/store'
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
  resolve: (filePath: string) => string
  fetchContent: (fileGlob: string) => Array<any>
  isPage: boolean
  isBrowser: boolean
  site: string

  // isomorphic components
  Debug: typeof Debug
  Script: typeof Script
  Link: typeof Link
  Code: typeof Code
  Trans: typeof Trans
}

export interface InteractiveRuntime extends SSGRuntime, BusApi, QueryApi, EventApi, VDomApi, RenderApi {
  /**
   * checks the exports type (called with typeof exports) and
   * returns an empty object or the exisiting one in scope
   */
  exports: (exportsType: string) => { [exportName: string]: any }
}

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
