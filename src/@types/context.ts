import { Config } from './config'
import { HookRegistrations } from '../core/hook/hook'
import { TranspileOptions } from 'typescript'
import * as WebSocket from 'ws'
import * as http from 'http'
import { LoaderMap } from '../core/loader/loader'
import { StyleReplacement } from './context/stylerepl'
import { FileDependencyLinkList } from './context/filedeps'
import { CodeCache } from './context/codecache'
import { MaterializedHtmlFilePaths } from './context/htmlfilepaths'
import { Command } from './context/command'
import { Mode } from './context/mode'
import { PageParamsAndProps } from './routing'
import { Application } from 'express'
import { ElementRefs } from './runtime/render'
import { Paths } from './context/paths'
import { FeatureFlagActivationMap } from './context/featureflags'

export interface Context {
  /** holds the project config read (default, read from package.json and maybe overridden by CLI flags) */
  config: Config

  /** usually NODE_ENV, such as 'development' or 'production'; default: 'development'  */
  mode: Mode

  /** command executed to start the process */
  command: Command

  /** absolute path to the .astro file to be processed */
  path?: string

  /** materialized path can differ from path for dynamic routes and is used for actual page generation then */
  materializedPath?: string

  /** style replacements, constructed and carried over multiple stages */
  styleReplacements?: Array<StyleReplacement>

  /** loaders registered, can be used to register custom loaders */
  loaderMap?: LoaderMap

  /** hooks registered, will be called per stage entered/passed */
  hooks?: HookRegistrations

  /** TypeScript transpile options */
  transpileOptions?: TranspileOptions

  /** PostCSS plugins to use */
  postCssPlugins?: Array<Function>

  /** when in development, this is a ref to hook into the preview server */
  devServer?: http.Server

  /** express App reference */
  expressApp?: Application

  /** when in development, this is a ref to hook into the wss server */
  devWebSocketServer?: WebSocket.Server

  /** maps elements by name */
  refs?: ElementRefs

  /** maps from the .astro file path to the actual .html file paths in dist folder */
  materializedHtmlFilePaths?: MaterializedHtmlFilePaths

  /** tracks relative file dependencies as a 2d linked list */
  fileDependencies?: FileDependencyLinkList

  /** files to restart on */
  fileDependenciesToRestartOn?: Array<string>

  /** props, pre-defined for the current .vanil page, e.g. dynamic routing */
  pageParamsAndProps?: PageParamsAndProps

  /** maps context.path to an array of materialized dynamic route file paths */
  //materializedPaths?: MaterializedPaths
  /** maps the hash of untranspiled code -> transpiled code */
  codeCache?: CodeCache

  /** remembers <script> and <link> resources injected for runtime to prevent double-injection */
  pageRuntimeScriptsAndLinks?: Array<string>

  /** indicates that the compiler is currently processing a component */
  isProcessingComponent?: boolean

  /** always tells the active .astro page template path name, also when processing .astro components  */
  astroPageTemplatePath?: string

  /** materialized paths of the configuration (cache) */
  paths?: Paths

  /** incrementally aggregated feature flag map */
  runtimeLibraryFeatureFlags?: FeatureFlagActivationMap
}
