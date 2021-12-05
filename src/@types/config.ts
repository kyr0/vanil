import { SecureContextOptions } from 'tls'

/**
 * The Vanil User Config Format
 */
export interface Config {
  /**
   * Where to resolve all URLs relative to. Useful if you have a monorepo project.
   * Default: '.' (current working directory)
   */
  projectRoot?: string

  /**
   * Path to the `vanil build` output.
   * Default: './dist'
   */
  dist?: string

  /**
   * Path to all of your Vanil components, pages, and data.
   * Default: './src'
   */
  src?: string

  /**
   * Path to your Vanil template pages. Each file in this directory
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

  /**
   * Path to your hooks files. Only the following files will be processed:
   * onContext.ts | onStart.ts | onBeforePage.ts | onAfterPage.ts | onFinish.ts
   * File extensions .js, and .jsm are supported as well.
   * Every hook file must export one function with the exact hook name, such as:
   * export const onContext = (context: Context) => { your code to change the context }
   *
   * Default: './src/hooks'
   */
  hooks?: string

  /** Options specific to `vanil build` */
  buildOptions?: BuildOptions

  /** Options for the development server run with `vanil dev`. */
  devOptions?: DevOptions
}

export interface BuildOptions {
  /**
   * You can specify the target language level here
   * Default: ES2018
   */
  target?: string

  /**
   * Your public domain, e.g.: https://my-vanil-site.dev/. Used to generate sitemaps and canonical URLs.
   * Default: Evaluated as http://devOptions.hostname:devOptions.port and its default values
   */
  site?: string

  /**
   * Automatically generates a sitemap for your page
   * Default: true
   */
  sitemap?: boolean

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
  pageUrlFormat?: 'file' | 'directory'
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
   * Activates/disables Prettier as an optimizer
   * for code readability (compile output might be more readable)
   * but it's a drawback on processing time of course.
   * Default: true
   */
  useOptimizer?: boolean
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
