import { Config } from '../@types/config'
import * as colors from 'kleur/colors'
import express, { Response } from 'express'
import { getDistFolder, getProjectRootFolder, toProjectRootRelativePath } from '../core/io/folders'
import { setupContext } from '../core/orchestrate'
import { getExecutionMode } from '../core/config'
import { runHooks } from '../core/hook/hook'
import { createServer } from 'http'
import { createServer as createSecureServer } from 'https'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { readFileSyncUtf8 } from '../core/io/file'
import { SecureContextOptions } from 'tls'

/** preview HTTP server that exactly mimics a static webserver */
export const preview = async (config: Config, autoListen = true) => {
  const app = express()
  const distFolder = getDistFolder(config)

  const context = await setupContext({
    config,
    command: 'preview',
    mode: getExecutionMode(),
  })

  app.use('/*', (req, res, next) => {
    if (res.statusCode >= 400) {
      console.log(`${req.method} ${colors.red(res.statusCode)} ${req.path}`)
    }
    next()
  })

  // serve all files from the dist folder
  app.use(
    '/',
    express.static(distFolder, {
      etag: false,
      setHeaders: (res: Response, path: string, stat: any) => {
        const targetDir = resolve(getDistFolder(config), path)

        // it's not a directory (directory requests never end up here),
        // but also has no file extension; default to text/html
        if (!targetDir.match(/\.[0-9a-z]+$/i)) {
          // this is necessary for config.buildOptions?.pageUrlFormat === 'directory'
          // because express.static doesn't support the no-file-extension "serve as HTML"
          // case by default
          res.setHeader('Content-Type', 'text/html; charset=UTF-8')
        }
      },
      index: config.buildOptions?.pageUrlFormat === 'directory' ? 'index' : 'index.html',
    }),
  )

  // custom 404 page handler support
  app.get('/*', (req, res, next) => {
    const page404 = config.buildOptions?.pageUrlFormat === 'directory' ? '404' : '404.html'
    const target404PageHtml = resolve(getDistFolder(config), page404)

    if (existsSync(target404PageHtml)) {
      res.status(404).send(readFileSyncUtf8(target404PageHtml))
      next()
    } else {
      const notFoundError = `ERROR 404: ${req.path} not found! 
      You can implement a custom 404 page by creating a 404.astro page template. 
      Resources can be placed in the ./public folder for static file serving.`

      res.status(404).send(notFoundError)
      next()
    }
  })

  let tlsOptions: SecureContextOptions = {}

  if (config.devOptions?.useTls) {
    tlsOptions = { ...config.devOptions!.tlsOptions }

    const projectRootFolder = getProjectRootFolder(config)

    console.log(
      '[config.devOptions] TLS enabled (devOptions.useTls). Trying to read key/cert relative to',
      projectRootFolder,
      tlsOptions,
    )

    try {
      tlsOptions.cert = readFileSyncUtf8(resolve(projectRootFolder, tlsOptions.cert as string))
      tlsOptions.key = readFileSyncUtf8(resolve(projectRootFolder, tlsOptions.key as string))
    } catch (err) {
      console.error(colors.red('Error reading TLS certificate files:'))
      console.error(colors.red(String(err)))

      console.error(colors.yellow('Did you miss creating (self-signed) TLS key files?'))

      console.log()

      console.error(
        colors.yellow(
          "e.g.> openssl req -x509 -new -nodes -keyout key.pem -out cert.pem -days 365 -subj '/CN=localhost'",
        ),
      )

      console.log()

      console.error(colors.yellow('NEVER GIT COMMIT CRYPTOGRAPHIC KEY FILES!'))

      console.error(colors.white('e.g. see: https://www.sitepoint.com/how-to-use-ssltls-with-node-js'))

      process.exit(1)
    }
  }

  const server = config.devOptions?.useTls ? createSecureServer(tlsOptions, app) : createServer(app)

  // automatically start to listen on port
  // is deactivated when dev CLI command hooks into this
  if (autoListen) {
    // register in context for onDevServerStart hooks to apply
    context.devServer = server

    await runHooks('onDevServerStart', context)

    server.listen(config.devOptions?.port, () => printServerRunning('PreviewServer', config))
  }
  return {
    app,
    server,
  }
}

export const printServerRunning = (tag: string, config: Config) => {
  console.log(colors.magenta(colors.bold(`${tag} online`)), colors.gray('@'), colors.cyan(config.buildOptions?.site!))

  console.log(
    colors.dim('Serving files from dist folder: '),
    colors.dim(toProjectRootRelativePath(getDistFolder(config), config)),
  )
}
