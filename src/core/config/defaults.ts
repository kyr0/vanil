import ts from 'typescript'
import { RobotsTxtOptions } from '../../@types'

// meaningful defaults
export const CONFIG_DIST_FOLDER = './dist'
export const CONFIG_SRC_FOLDER = './src'
export const CONFIG_PAGES_FOLDER = './src/pages'
export const CONFIG_PUBLIC_FOLDER = './public'
export const CONFIG_HOOKS_FOLDER = './src/hooks'

// buildOptions.sitemap
export const CONFIG_BUILD_SITEMAP = true

// buildOptions.robotsTxt
export const CONFIG_BUILD_ROBOTS_TXT: RobotsTxtOptions = {
  enabled: true,
}

// buildOptions.target
export const CONFIG_BUILD_TARGET = ts.ScriptTarget.ES2018

// buildOptions.pageUrlFormat
export const CONFIG_BUILD_PAGE_URL_FORMAT = 'directory'

// devOptions.hostname
export const CONFIG_DEVOPTIONS_HOSTNAME = 'localhost'

// devOptions.port
export const CONFIG_DEVOPTIONS_PORT = 3000

// devOptions.useTls
export const CONFIG_DEVOPTIONS_USETLS = false

// devOptions.useOptimizer
export const CONFIG_DEVOPTIONS_USEOPTIMIZER = true
