import { SecureContextOptions } from 'tls'
import { BuildOptions as EsbuildOptions, build } from "esbuild"
import { getSiteUrl } from './routing'
import { makeTempDir, readFileContent } from './io'
import { run } from './vm'
import { join } from 'path'
import { esbuildConfigBaseSsr } from './build'
import { getExecutionMode } from './mode'
import { Context } from './context'
import { ucfirst } from './lang'
import { Command } from './commands'

export interface Config {
  /**
   * Where to resolve all URLs relative to. Useful if you have a monorepo project.
   * Default: '.' (current working directory)
   */
  projectRoot?: string

  /**
   * Path to the build output.
   * Default: './dist'
   */
  dist?: string

  /**
   * Path to all of your components, pages, and data.
   * Default: './src'
   */
  src?: string

  /**
   * Path to your page templates. Each file in this directory
   * becomes a page in your final build.
   * Default: './src/pages'
   */
  pages?: string

  /**
   * Path to your public files. These are copied over into your build directory, untouched.
   * Useful for favicons, images, and other files that don't need processing.
   * Default: './public'
   */
  public?: string

  /** Page generation, building and bundling options */
  buildOptions?: BuildOptions

  /** DevServer options */
  devOptions?: DevOptions

  /** prefix for environment variables to become public and exported to the client */
  envPrefix?: string

  /** hook functions can be implemented to fully customize the generator logic */
  hooks?: HookOptions
}

/** a hook function is called instead of the actual implementation 
 * so that the pipeline can be implemented in userland */
export type BuildHookFn = (partialContext: Partial<Context>) => Promise<void> | void

export interface HookOptions {

  /** custom build hook for cleaning; 
   * may call the default implementation: await clean(partialContext) */
  onClean?: BuildHookFn

  /** custom build hook for building pages; 
   * may call the default implementation: await build(partialContext) */
  onBuild?: BuildHookFn

  /** custom dev hook for starting the dev server and to build pages ongoingly; 
   * may call the default implementation: await dev(partialContext) */
  onDev?: BuildHookFn

  /** custom preview hook for starting the preview server and mocking a production environment; 
   * may call the default implementation: await preview(partialContext) */
  onPreview?: BuildHookFn
}

export type PageUrlFormat = 'file' | 'directory'

export interface BuildOptions {
  /**
   * You can specify the target language level here
   * esbuild target, see: https://esbuild.github.io/api/#target
   * Default: 'esnext'
   */
  target?: string

  /**
   * Your public domain, e.g.: https://my-site.dev/. Used to generate sitemaps and canonical URLs.
   * Default: Evaluated as http://devOptions.hostname:devOptions.port and its default values
   */
  site?: string

  /**
   * Overrides the default logic to enable code optimization (JS, CSS treeshaking, compression, etc.)
   * Default: true when execution mode is 'production', false in 'development'
   */
  optimize?: boolean

  // TODO: callback function to filter sitemap entries
  /**
   * Automatically generates a sitemap for your page
   * Default: true
   */
  sitemap?: boolean

  // TODO: callback function to define robots.txt entries
  /**
   * Automatically generates a robots.txt for your page
   *
   * Default: {
   *   enabled: true
   * }
   */
  robotsTxt?: RobotsTxtOptions | Array<RobotsTxtOptions>

  /**
   * Control the output file URL format of each page.
   *   If 'file', Vanil will generate a matching HTML file (ex: "/foo.html") instead of a directory.
   *   If 'directory', Vanil will generate a directory with a nested index.html (ex: "/foo/index.html") for each page.
   * Default: 'directory'
   */
  pageUrlFormat?: PageUrlFormat

  /**
   * Defines the browser compatibility matrix, which has influence on the
   * JavaScript and CSS build artifacts. More modern settings lead to smaller code sizes
   * and faster execution.
   * The default has >96% browser coverage and disables Internet Explorer support.
   * Default: ['> 0.05%', 'not ie > 0']
   * https://browserslist.dev/?q=PiAwLjA1JSwgbm90IGllID4gMA%3D%3D
   */
  browserslist?: Array<string>

  /**
   * Allows to override internal build options of esbuild 
   * modules for _document, pages and components
   */
  // TODO: make callback functions and use them
  esbuildOptions?: {
    serverSide?: EsbuildOptions,
    clientSide?: EsbuildOptions
  }
}

export interface DevOptions {
  /**
   * The hostname to run the server on (listening).
   * Default: localhost
   */
  hostname?: string

  /**
   * The port to run the dev server on.
   * Default: 3000
   */
  port?: number

  /**
   * Enabled the TLS transport layer (leads to https:// protocol usage)
   * For local `preview` and `dev` CLI commands, pls. set the tlsOptions as well.
   * Default: false
   */
  useTls?: boolean

  /**
   * TLS keychain options.
   * Default: {
   *   key: 'key.pem',
   *   cert: 'cert.pem',
   * }
   */
  tlsOptions?: SecureContextOptions

  /**
   * Activates/disables a code size optimizer
   * Default: true in production, false in development
   */
  useOptimizer?: boolean

  /**
   * Change detection is disabled for these folders
   * Next to these folders, any /node_modules/ path is ignored too
   * Default: ['dist']
   */
  excludedFolders?: Array<string>
}

export interface RobotsTxtOptions {
  enabled: boolean

  /**
   * The hostname the crawler bot shall match this robots.txt definition with
   * Default: auto-generated based on the site value (which is based on devOptions)
   */
  host?: string

  /**
   * Setting this limits the validity of a definition to a specific crawler bot,
   * depending on the UserAgent(s)
   */
  userAgent?: Array<string> | string

  /**
   * Usually sets the delay / rate a crawler hits the site (in seconds)
   */
  crawlDelay?: string

  /**
   * URL path to the sitemap
   * Default: auto-generated, points to dist folder sitemap.xml
   */
  sitemap?: string

  /**
   * An array of relative paths that are disallowed to visit (glob patterns)
   */
  disallow?: Array<string>
}

export const configDefaults: Config = {
    dist: './dist',
    projectRoot: '.',
    src: './src',
    pages: './src/pages',
    public: './public',
    devOptions: {
        hostname: 'localhost',
        port: 3000,
        useTls: false,
        useOptimizer: false,
        excludedFolders: ['dist']
    },
    buildOptions: {
        target: 'esnext',
        sitemap: true,
        pageUrlFormat: 'file',
        robotsTxt: {
            enabled: true
        },
        browserslist: ['> 0.05%', 'not ie > 0']
    },
    envPrefix: 'PUBLIC'
}

export const validateConfig = (config: Config): Config => {

    // to make sure the object is accessible
    if (!config.hooks) config.hooks = {}

    if (!config.buildOptions.optimize) {
      // enable code optimizations dynamically when in production
      config.buildOptions.optimize = getExecutionMode() === 'production'
    }

    if (!config.buildOptions!.site) {
        // generate a valid site url we serve on (also available in render mode SSG)
        config.buildOptions!.site = getSiteUrl(config)
    }

    if (!config.devOptions?.tlsOptions) {
      // pre-defined places to find the keys for TLS
        config.devOptions!.tlsOptions = {
            cert: 'cert.pem',
            key: 'key.pem',
        }
    }

    if (config.buildOptions!.sitemap) {
        // default, predefined sitemap URL on robots.txt generation when its activated
        ;(config.buildOptions!.robotsTxt as RobotsTxtOptions).sitemap = config.buildOptions!.site + '/sitemap.xml'
    }
    return config
}

/** creates a valid config object from defaults and partials */
export const createConfig = (configOverrides: Partial<Config> = {}) => validateConfig({
    ...configDefaults,
    ...configOverrides
})

/** transforms the TypeScript config file config.ts in project root directory */
export const readConfigFile = async(configFilePath: string): Promise<Config> => {

  const tmpDir = makeTempDir()
  const outfile = join(tmpDir, 'config.js')

  // TODO: code cache to improve startup time
  await build({
    ...esbuildConfigBaseSsr,
    bundle: false,
    external: undefined,
    sourcemap: 'both',
    entryPoints: [configFilePath],
    outfile
  })

  const jsCode = await readFileContent(outfile)

  // by evaluating, the config is returned including optional 
  // hook function references. code can be executed "as is" to
  // pre/post default pipelines such as "build" or to fully customize
  return (await run<typeof global, { default: Config }>
    (jsCode, global)).exports.default
}

export type HookBaseName = Command

/** checks if the respective hook has been implemented via the config */
export const isHookImplemented = (hookBaseName: HookBaseName, config: Config) => 
  typeof config.hooks[`on${ucfirst(hookBaseName)}`] === 'function'
