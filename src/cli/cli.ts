import * as colors from 'kleur/colors'
import yargs from 'yargs-parser'
import { resolve } from 'path'
import { Config } from '../@types/config'
import { dev } from './dev'
import { build } from './build'
import { check } from './check'
import { preview } from './preview'
import { finalizeConfig, getDefaultConfig, getExecutionMode } from '../core/config'
import { readFileSyncUtf8 } from '../core/io/file'
import { clean } from './clean'
import { Command } from '../@types/context/command'
import { init, InitOptions } from './init'

const dotenv = require('dotenv')

type Arguments = yargs.Arguments

interface CLIState {
  cmd: Command
  options: {
    projectRoot?: string
    site?: string
    sitemap?: boolean
    hostname?: string
    port?: number
    config?: string
    dist?: string
    hooks?: string
    useTls?: boolean
    name?: string
    tpl?: string
  }
}

/** Determine which action the user requested */
const resolveArgs = (flags: Arguments): CLIState => {
  const options: CLIState['options'] = {
    projectRoot: typeof flags.projectRoot === 'string' ? flags.projectRoot : undefined,
    site: typeof flags.site === 'string' ? flags.site : undefined,
    sitemap: typeof flags.sitemap === 'boolean' ? flags.sitemap : undefined,
    port: typeof flags.port === 'number' ? flags.port : undefined,
    hostname: typeof flags.hostname === 'string' ? flags.hostname : undefined,
    config: typeof flags.config === 'string' ? flags.config : undefined,
    dist: typeof flags.dist === 'string' ? flags.dist : undefined,
    useTls: typeof flags.useTls === 'boolean' ? flags.useTls : undefined,
    name: typeof flags.name === 'string' ? flags.name : undefined,
    tpl: typeof flags.tpl === 'string' ? flags.tpl : undefined,
  }

  if (flags.version) {
    return { cmd: 'version', options }
  } else if (flags.help) {
    return { cmd: 'help', options }
  }

  const cmd = flags._[2]
  switch (cmd) {
    case 'init':
      return { cmd: 'init', options }
    case 'dev':
      return { cmd: 'dev', options }
    case 'build':
      return { cmd: 'build', options }
    case 'preview':
      return { cmd: 'preview', options }
    case 'check':
      return { cmd: 'check', options }
    case 'config':
      return { cmd: 'config', options }
    case 'clean':
      return { cmd: 'clean', options }
    default:
      return { cmd: 'help', options }
  }
}

/** Display --help flag */
const printHelp = () => {
  console.error(`  ${colors.bold('vanil')} - less is enlightening
  ${colors.bold('Commands:')}
  vanil dev             Run Vanil in development mode.
  vanil build           Build a pre-compiled production version of your site.
  vanil preview         Preview your build locally before deploying.
  vanil config          Prints the final config and explains how to customize it.
  vanil clean           Removes the dist folder of your site; this cleans the cache.
  vanil check           Check your project for errors.
  vanil init <dir>      Scaffolds a new project in <dir>.
  ${colors.bold('Flags:')}
  --project-root <path> Specify the path to the project root folder, relative to CWD.
  --site <uri>          Specify site to use as site location.
  --use-tls             Enables https:// for all URIs.
  --dist                Specify the distribution folder (build result).
  --port <number>       Specify port to serve on (dev, preview only).
  --hostname <string>   Specify hostname to serve on (dev, preview only).
  --no-sitemap          Disable sitemap generation (build only).
  --version             Show the version number and exit.
  --help                Show this help message.
  --name <project-name> Name of the project (only useful with "init").
  --tpl <dir-or-repo>   Path to a template folder or git repository.
`)
}

/** get vanil config from package.json */
const getProjectPackageJson = (projectRoot: string) =>
  JSON.parse(readFileSyncUtf8(resolve(projectRoot, 'package.json')))

/** display --version flag */
const printVersion = async () => {
  console.error(getProjectPackageJson(resolve(__dirname, '..', '..')).version)
}

/** print the final config and explains how to customize it */
const printConfig = (config: Config) => {
  console.log('')
  console.log('Raw config after finalizing:')
  console.log('')
  console.log(JSON.stringify(config, null, 2))
  console.log('')
  console.log('You can customize the project configuration by ')
  console.log('setting/changing the value of the property "vanil"')
  console.log('in the package.json file like this:')
  console.log('')
  console.log('// in package.json:')
  console.log(
    JSON.stringify(
      {
        name: 'your_project_name',
        vanil: {},
      },
      null,
      2,
    ),
  )
  console.log('')
  console.log('In case you need to change the config by environment, ')
  console.log('set VANIL_CONFIG as an environment variable and assign ')
  console.log('the stringified value of your vanil config JSON.')
}

/** merge CLI flags & config options (CLI flags take priority) */
const mergeCLIFlags = (config: Config, flags: CLIState['options']) => {
  if (typeof flags.dist === 'string') config.dist = flags.dist

  if (typeof flags.sitemap === 'boolean') config.buildOptions!.sitemap = flags.sitemap
  if (typeof flags.site === 'string') config.buildOptions!.site = flags.site

  if (typeof flags.port === 'number') config.devOptions!.port = flags.port
  if (typeof flags.hostname === 'string') config.devOptions!.hostname = flags.hostname
  if (typeof flags.useTls === 'boolean') config.devOptions!.useTls = flags.useTls
}

/** The primary CLI action */
export const cli = async (args: string[]) => {
  const flags = yargs(args)
  const state = resolveArgs(flags)
  const options = { ...state.options }
  const projectRootOverride = options.projectRoot || flags._[3]

  let userConfig: Config = {
    buildOptions: {},
    devOptions: {},
  }

  const defaultConfig = getDefaultConfig()

  if (projectRootOverride) {
    // if a custom projectRoot was set by a flag like --project-root,
    // relatively resolve it to current process.cwd()
    // current cwd can be futher modified by using npm --prefix $dir $command
    defaultConfig.projectRoot = resolve(defaultConfig.projectRoot!, projectRootOverride)
  }

  // support for package.json provided vanil config
  try {
    const userConfigCandidate = getProjectPackageJson(defaultConfig.projectRoot!).vanil

    if (userConfigCandidate) {
      userConfig = userConfigCandidate
    }
  } catch (e) {
    // it's fine, this can happen e.g. on vanil init or when running the CLI
    // in a directory where there is no package.json at all
  }

  // read project .env files
  dotenv.config({ path: resolve(defaultConfig.projectRoot!, '.env') })

  // support for ENV provided VANIL_CONFIG
  if (process.env.VANIL_CONFIG) {
    try {
      userConfig = JSON.parse(process.env.VANIL_CONFIG)
    } catch (e) {
      throwAndExit(e)
    }
  }

  const config: Config = {
    // apply defaults
    ...defaultConfig,
    ...userConfig,
    // override by vanil config options set in package.json (maybe)
    buildOptions: {
      ...defaultConfig.buildOptions,
      ...userConfig.buildOptions,
    },
    devOptions: {
      ...defaultConfig.devOptions,
      ...userConfig.devOptions,
    },
  }

  try {
    // override config options by CLI parameters
    mergeCLIFlags(config, options)

    // e.g. evaluate site from hostname + port if not set
    finalizeConfig(config)
  } catch (err) {
    console.error(colors.red((err as any).toString() || err))
    process.exit(1)
  }

  // reset console
  console.clear()

  console.log(
    colors.dim('>'),
    `${colors.bold(colors.yellow('vanil'))} ${colors.magenta(colors.bold(state.cmd))}`,
    colors.cyan(`(${getExecutionMode()})`),
    colors.gray('...'),
  )

  const runDev = async (config: Config) => {
    try {
      await dev(config)
    } catch (err: any) {
      printError(err)
    }
  }

  switch (state.cmd) {
    case 'help': {
      printHelp()
      process.exit(0)
    }
    case 'version': {
      await printVersion()
      process.exit(0)
    }
    case 'config': {
      await printConfig(config)
      process.exit(0)
    }
    case 'dev': {
      runDev(config)
      return
    }
    case 'build': {
      try {
        await build(config)
        process.exit(0)
      } catch (err) {
        throwAndExit(err)
      }
      return
    }
    case 'check': {
      process.exit(await check(config))
    }
    case 'preview': {
      try {
        // run forever
        await preview(config)
      } catch (err) {
        throwAndExit(err)
      }
      return
    }
    case 'clean': {
      process.exit(clean(config))
    }
    case 'init': {
      try {
        await init(options as InitOptions, flags._[3])
      } catch (err) {
        throwAndExit(err)
      }
      process.exit(0)
    }
    default: {
      throw new Error(`Error running ${state.cmd}`)
    }
  }
}

const printError = (err: any) => console.error(colors.red(err.toString() || err))

/** Display error and exit */
const throwAndExit = (err: any) => {
  printError(err)
  process.exit(1)
}
