import { Config, createConfig } from "./config"
import { getExecutionMode, Mode } from "./mode"
import type * as WebSocket from 'ws'
import type * as http from 'http'
import type { Application } from 'express'
import { getDistFolder, getPagesFolder, getProjectRootFolder, getPublicFolder, makeTempDir } from "./io/folder"
import { PublicAndPrivateEnvVariables, readDotEnv } from "./env"
import { LoaderMap, getDefaultLoaderMap } from "./loader"
import { CodeCache } from "./cache"
import { PublishError } from "./lang"
import { LatestPagePublishStatus } from "./page"
import { Command } from "./commands"

/** maps the page path (pages/.../*.tsx) to an array of rendered page paths that result from it  */
export interface RenderedPagePaths {
  [pagePath: string]: Array<string>
}

export interface Paths {
  dist: string
  projectRoot: string
  pages: string
  public: string
}

// relevant for task: dev() only
export interface FileDependencyLinkList {
  // file path (absolute) linked to list of .astro template files associated
  // can be n-depth nested, but is represented here as a 2d list
  [filePath: string]: Array<string>
}

export interface Context<Store = unknown> {

    /** currently running command */
    command: Command,

    /** a store that can hold arbitrary, serializable application data */
    store: Store

    /** environment values, public and private ones, filtered for infosec reasons */
    env: PublicAndPrivateEnvVariables

    /** temporary folder that is used for this execution */
    tmpDir: string
    
    /** holds the project config read (default, read from package.json and maybe overridden by CLI flags) */
    config: Config

    /** usually NODE_ENV, such as 'development' or 'production'; default: 'development'  */
    mode: Mode

    /** contains the loader registrations of all loadFile() and loadFiles() loaders */
    loaderMap: LoaderMap

    /** materialized paths of the configuration (cache) */
    paths?: Paths
    
    /** maps the hash of untranspiled code -> transpiled code */
    codeCache?: CodeCache

    /** maps from the .tsx file path to the actual, relative .html file paths in dist folder */
    renderedPagePaths?: RenderedPagePaths

    /** when in development, this is a ref to hook into the preview server */
    devServer?: http.Server

    /** express App reference */
    expressApp?: Application

    /** when in development, this is a ref to hook into the wss server */
    devWebSocketServer?: WebSocket.Server

    /** files to restart on */
    fileDependenciesToRestartOn?: Array<string>

    /** tracks relative file dependencies as a 2d linked list */
    fileDependencies?: FileDependencyLinkList

    /** reference to the latest page publishing error */
    publishError?: PublishError
    
    /** reference to the status of just the latest status per page publish */
    latestPagePublishStatus?: LatestPagePublishStatus
}

/** initializes all the values that are necessary for a context to be valid to work with */
export const validateContext = (partialContext: Partial<Context>): Context => {

  // validate config in context
  partialContext.config = createConfig(partialContext.config)

  // read in environment variables
  partialContext.env = readDotEnv(partialContext)

  if (!partialContext.mode) partialContext.mode = getExecutionMode()
  if (!partialContext.tmpDir) partialContext.tmpDir = makeTempDir()

  console.log('tmp build dir', partialContext.tmpDir)

  // extensible fetchContent() loader map initialization
  if (!partialContext.loaderMap) {
    partialContext.loaderMap = getDefaultLoaderMap()
  }

  // maps from the file path to the actual .html file paths in dist folder
  if (!partialContext.renderedPagePaths) {
    partialContext.renderedPagePaths = {}
  }

  // === only relevant for command: dev

  // file dependencies, used for tracing / triggering specific HMR
  // when dependencies of page templates change
  if (!partialContext.fileDependencies) {
    partialContext.fileDependencies = {}
  }

  if (!partialContext.fileDependenciesToRestartOn) {
    partialContext.fileDependenciesToRestartOn = []
  }

  if (!partialContext.latestPagePublishStatus) {
    partialContext.latestPagePublishStatus = {}
  }

  // materialized paths
  partialContext.paths = {
    dist: getDistFolder(partialContext.config),
    public: getPublicFolder(partialContext.config),
    projectRoot: getProjectRootFolder(partialContext.config),
    pages: getPagesFolder(partialContext.config),
  }

  const context = partialContext as Context

  // initialize the store with an empty object
  if (!context.store) context.store = {}

  return context
}

/** creates a validated context object from partial values */
export const createContext = (partialContext: Partial<Context> = {}) => validateContext(partialContext)