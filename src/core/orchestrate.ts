import { getPagesFolder, isDynamicRoutingPath, toProjectRootRelativePath } from './io/folders'
import { addMaterializedHtmlFilePath, validateContext } from './transform/context'
import { Context } from '../@types/context'
import { renderError, transformAndPersistSingle } from './transform/transform'
import fg from 'fast-glob'
import * as colors from 'kleur/colors'
import { registerHooks, runHooks } from './hook/hook'
import { MaterializedPage, materializeDynamicRoutingPaths } from './transform/routing'
import { persistVanilPage } from './transform/persist'
import { resolve } from 'path'
import { resetVanilPageIsolatedRuntimeState } from './runtime/reset'

export const setupContext = async (context: Context, doRegisterHooks = false) => {
  validateContext(context)
  if (doRegisterHooks) {
    await registerHooks(context)
  }
  resetVanilPageIsolatedRuntimeState()
  await runHooks('onContext', context)
  return context
}

/** organizes the flow of transformation for a full *.astro transform request including hooks */
export const orchestrateTransformAll = async (context: Context): Promise<Context> => {
  await setupContext(context, true)

  await runHooks('onDevServerStart', context)
  await runHooks('onStart', context)

  const astroFiles = fg.sync(`${getPagesFolder(context.config)}/**/*.astro`)

  console.log(
    colors.white('Render all .astro templates...'),
    astroFiles.map((file) => toProjectRootRelativePath(file, context.config)),
  )

  for (let i = 0; i < astroFiles.length; i++) {
    context = await orchestrateTransformSingle({
      ...context,
      path: astroFiles[i],
    })
  }

  await runHooks('onFinish', context)

  return context
}

/** organizes the flow of transformation for a single .astro transform request including hooks */
export const orchestrateTransformSingle = async (context: Context): Promise<Context> => {
  await setupContext(context)

  await runHooks('onBeforePage', context)

  console.log(
    colors.white(context.materializedPath ? '>' : 'Rendering'),
    colors.green(
      context.materializedPath
        ? toProjectRootRelativePath(context.materializedPath, context.config)
        : toProjectRootRelativePath(context.path!, context.config),
    ),
    colors.grey('...'),
  )

  // makes sure, initial recognition of dynamic paths is happening, including processing
  // then recursively transform each permutation
  if (isDynamicRoutingPath(context.path!) && !context.materializedPath) {
    let materializedPages: Array<MaterializedPage> = []

    try {
      materializedPages = await materializeDynamicRoutingPaths(context)
    } catch (e) {
      console.error('ERROR: SSG Node.js execution error', (e as any).original)

      // persist custom 404 page with error message
      context.materializedPath = resolve(getPagesFolder(context.config), '404.astro')
      persistVanilPage(context, await renderError(context, e as any))

      throw new Error('Failed to get static paths for rendering (see above)')
    }

    for (let i = 0; i < materializedPages.length; i++) {
      const dynamicPageContext = await orchestrateTransformSingle({
        ...context,
        ...materializedPages[i],
      })

      // create an entry for the dynamic page materialized,
      // so that HMR can trigger well for those pages,
      // dependencies are the same for each page, so there is
      // potential to save on memory here (mark as dynamic page and ref
      // instead of duplicate the same object over and over again)

      // remember code cached
      context.codeCache = {
        ...dynamicPageContext.codeCache,
      }

      // remember materializedHtmlFilePaths
      if (dynamicPageContext.materializedHtmlFilePaths![context.path!]) {
        dynamicPageContext.materializedHtmlFilePaths![context.path!].forEach((path) =>
          addMaterializedHtmlFilePath(path, context),
        )
      }

      // adding the materialized path
      //addMaterializedPath(materializedPages[i].materializedPath, context)
    }
    return context
  }

  await transformAndPersistSingle(context)

  await runHooks('onAfterPage', context)

  return context
}
