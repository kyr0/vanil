import * as colors from 'kleur/colors'
import express, { Response, Express } from 'express'
import compression from "compression"
import { createServer, Server as HttpServer } from 'http'
import { createServer as createSecureServer, Server as HttpsServer } from 'https'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { SecureContextOptions } from 'tls'
import { Config } from '../config'
import { getDistFolder, getProjectRootFolder, readFileContent, toProjectRootRelativePath } from '../io'
import { Context, createContext, validateContext } from '../context'


export interface PreviewOptions {
    autoListen: boolean
    onDevServerStart?: (context: Context) => void
}

export const previewOptionsDefaults: PreviewOptions = {
    autoListen: true,
}

export interface PreviewServer {
  app: Express
  server: HttpServer | HttpsServer
}

/** preview HTTP server that exactly mimics a static webserver */
export const preview = async (partialContext: Partial<Context>, options: PreviewOptions = previewOptionsDefaults): Promise<PreviewServer> => {

  const context = validateContext({
    ...partialContext,
    command: 'preview'
  })

  options = {
    ...previewOptionsDefaults,
    ...options
  }

  const app = express()
  const distFolder = getDistFolder(context.config)

  // gzip, deflate compression, just as a webserver/CDN would serve
  app.use(compression())

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
        const targetDir = resolve(getDistFolder(context.config), path)

        // it's not a directory (directory requests never end up here),
        // but also has no file extension; default to text/html
        if (!targetDir.match(/\.[0-9a-z]+$/i)) {
          // this is necessary for config.buildOptions?.pageUrlFormat === 'directory'
          // because express.static doesn't support the no-file-extension "serve as HTML"
          // case by default
          res.setHeader('Content-Type', 'text/html; charset=UTF-8')
        }
      },
      index: context.config.buildOptions?.pageUrlFormat === 'directory' ? 'index' : 'index.html',
    }),
  )

  // custom 404 page handler support
  app.get('/*', async(req, res, next) => {
    const page404 = context.config.buildOptions?.pageUrlFormat === 'directory' ? '404' : '404.html'
    const target404PageHtml = resolve(getDistFolder(context.config), page404)
    if (existsSync(target404PageHtml)) {
      res.status(404).send(await readFileContent(target404PageHtml))
      next()
    } else {
      // TODO: Remove this because it will always be generated using 404.tsx
      // TODO: make default 404 page a bit nicer
      const notFoundError = `ERROR 404: ${req.path} not found! 
      You can implement a custom 404 "page not found" page by creating a ./src/pages/404.tsx page template. 
      Resources such as images should be placed in the ./public folder for static file serving.`

      res.status(404).send(notFoundError)
      next()
    }
  })

  // register express app reference
  context.expressApp = app

  let tlsOptions: SecureContextOptions = {}

  if (context.config.devOptions?.useTls) {
    tlsOptions = { ...context.config.devOptions!.tlsOptions }

    const projectRootFolder = getProjectRootFolder(context.config)

    console.log(
      '[config.devOptions] TLS enabled (devOptions.useTls). Trying to read key/cert relative to',
      projectRootFolder,
      tlsOptions,
    )

    try {
      tlsOptions.cert = await readFileContent(resolve(projectRootFolder, tlsOptions.cert as string))
      tlsOptions.key = await readFileContent(resolve(projectRootFolder, tlsOptions.key as string))
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

  const server = context.config.devOptions?.useTls ? createSecureServer(tlsOptions, app) : createServer(app)

  // register in context
  context.devServer = server

  // automatically start to listen on port
  // is deactivated when dev CLI command hooks into this
  if (options.autoListen) {

    server.listen(context.config.devOptions?.port, () => {
        
        if (typeof options.onDevServerStart === 'function') {
            options.onDevServerStart(context)
        }
        printServerRunning('PreviewServer', context.config)
    })
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
