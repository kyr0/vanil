import { buildSync } from 'esbuild'
import { resolve } from 'path'
import { Config } from '../../@types/config'
import { Context } from '../../@types/context'

const fs = require('fs-extra')

// TODO: perf: can be cached
/** return absolutely resolved paths for the specific project folders */
export const getProjectRootFolder = (config: Config) => config.projectRoot!
export const getPagesFolder = (config: Config) => resolve(getProjectRootFolder(config), config.pages!)
export const getDistFolder = (config: Config) => resolve(getProjectRootFolder(config), config.dist!)
export const getPublicFolder = (config: Config) => resolve(getProjectRootFolder(config), config.public!)
export const getHooksFolder = (config: Config) => resolve(getProjectRootFolder(config), config.hooks!)

export const toProjectRootRelativePath = (path: string, config: Config) =>
  path.replace(getProjectRootFolder(config), '.')

export const toDistFolderRelativePath = (path: string, config: Config) => path.replace(getDistFolder(config), '')

export const isGlobPath = (path: string) => path.indexOf('*') > -1 || path.indexOf('{') > -1

export const isDynamicRoutingPath = (path: string) => path.indexOf('[') > -1 && path.indexOf(']') > -1

export const copyModuleToDistAndBundleForBrowser = async (
  context: Context,
  moduleName: string,
  entryPointPath: string,
) =>
  new Promise((resolveCb: Function) => {
    const bundlePath = `${entryPointPath}.bundle.js`
    const distFolder = getDistFolder(context.config)
    const moduleDistPath = resolve(distFolder, 'node_modules', moduleName)
    const projectRootFolder = getProjectRootFolder(context.config)
    const modulePath = resolve(projectRootFolder, 'node_modules', moduleName)

    // copy over node_modules/$moduleName to dist/node_modules/$moduleName
    // so that it can be fetch()ed and evaluated
    copyFiles(modulePath, moduleDistPath)

    // bundle js dependency using esbuild (inline all require() calls)
    buildSync({
      entryPoints: [entryPointPath],
      bundle: true,
      write: true,
      format: 'cjs',
      platform: 'neutral',
      allowOverwrite: true,
      minify: context.mode === 'production',
      metafile: context.mode === 'development',
      outfile: bundlePath,
    })

    resolveCb()
  })

export const copyModuleToDist = (context: Context, moduleName: string) => {
  const distFolder = getDistFolder(context.config)
  const projectRootFolder = getProjectRootFolder(context.config)
  const modulePath = resolve(projectRootFolder, 'node_modules', moduleName)
  const moduleDistPath = resolve(distFolder, 'node_modules', moduleName)

  copyFiles(modulePath, moduleDistPath)
}

export const copyFiles = (fromPath: string, toPath: string) => {
  try {
    fs.copySync(fromPath, toPath, {
      dereference: true,
    })
  } catch (e) {
    if (e) {
      throw new Error(`Error copying ${fromPath} to: ${toPath}: ${e}`)
    }
  }
}

/** verfies if a .astro template is stored in the pages folder */
export const isAstroPageTemplate = (astroFileCandidate: string, config: Config) =>
  astroFileCandidate.indexOf(getPagesFolder(config)) > -1 && astroFileCandidate.endsWith('.astro')
