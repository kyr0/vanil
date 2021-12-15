import { Config, RobotsTxtOptions } from '../../@types/config'
import { Mode } from '../../@types/context/mode'
import {
  CONFIG_BUILD_PAGE_URL_FORMAT,
  CONFIG_BUILD_ROBOTS_TXT,
  CONFIG_BUILD_SITEMAP,
  CONFIG_DEVOPTIONS_HOSTNAME,
  CONFIG_DEVOPTIONS_PORT,
  CONFIG_DEVOPTIONS_USETLS,
  CONFIG_DIST_FOLDER,
  CONFIG_HOOKS_FOLDER,
  CONFIG_PAGES_FOLDER,
  CONFIG_PUBLIC_FOLDER,
  CONFIG_SRC_FOLDER,
  CONFIG_DEVOPTIONS_USEOPTIMIZER,
} from './defaults'

export const getExecutionMode = (): Mode => (process.env.NODE_ENV || 'development') as Mode

/** returns the default project config */
export const getDefaultConfig = (): Config => ({
  projectRoot: process.cwd(),
  dist: CONFIG_DIST_FOLDER,
  src: CONFIG_SRC_FOLDER,
  pages: CONFIG_PAGES_FOLDER,
  public: CONFIG_PUBLIC_FOLDER,
  hooks: CONFIG_HOOKS_FOLDER,

  buildOptions: {
    site: undefined, // evaluated
    sitemap: CONFIG_BUILD_SITEMAP,
    robotsTxt: CONFIG_BUILD_ROBOTS_TXT,
    pageUrlFormat: CONFIG_BUILD_PAGE_URL_FORMAT,
  },

  devOptions: {
    useTls: CONFIG_DEVOPTIONS_USETLS,
    hostname: CONFIG_DEVOPTIONS_HOSTNAME,
    port: CONFIG_DEVOPTIONS_PORT,
    useOptimizer: CONFIG_DEVOPTIONS_USEOPTIMIZER,
  },
})

export const finalizeConfig = (config: Config) => {
  const protocolAndHostname = `${config.devOptions?.useTls ? 'https' : 'http'}://${config.devOptions?.hostname}`
  if (!config.buildOptions!.site) {
    config.buildOptions!.site = protocolAndHostname
  }

  if (config.devOptions!.port !== 80 && config.devOptions?.port !== 443) {
    config.buildOptions!.site = `${protocolAndHostname}:${config.devOptions?.port}`
  }

  if (!config.devOptions?.tlsOptions) {
    config.devOptions!.tlsOptions = {
      cert: 'cert.pem',
      key: 'key.pem',
    }
  }

  if (config.buildOptions!.sitemap) {
    ;(config.buildOptions!.robotsTxt as RobotsTxtOptions).sitemap = config.buildOptions!.site + '/sitemap.xml'
  }
}
