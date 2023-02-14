import * as colors from 'kleur/colors'
import { preview } from "./preview";
import { notifyPageStatusChanged, publishPage, publishPages } from "../page";
import { publishPublicFolder } from "../action";
import { Context, validateContext} from "../context";
import { startLiveReloadServer } from "../live-reload";
import { watchForCodeChanges } from "../change-detection";
import { toProjectRootRelativePath } from '../io';

/**
 * dev HTTP server that watches for src folder changes and
 * informs connected webrowsers for when rebuilds of pages have happened
 */
export const dev = async (partialContext: Partial<Context>) => {

  const context = validateContext({
    ...partialContext,
    command: 'dev'
  })

  // publish public artifacts
  await publishPublicFolder(context)

  // start preview HTTP server
  const previewServer = await preview(context, { autoListen: false })

  // create the /live-reload endpoint accepting connections via ws://
  startLiveReloadServer(previewServer, context)

  // initial, full transform
  await publishPages(context)

  watchForCodeChanges({
    
    onDependencyToRestartOnChanged: async(pagePath) => {
      console.log(colors.yellow(`> Re-publish all pages: ${toProjectRootRelativePath(pagePath, context.config)} changed...`))

      const publishResult = await publishPages(context)

      //notifyPageStatusChanged(pagePath, 'publish', context)
    },

    onPagesChanged: async(pagesThatChanged) => {
      
      console.log('> Re-publish sigle page (code changed)', pagesThatChanged)

      // walk thru all page templates that depend on the files changed
      // and publish them
      for (let i = 0; i < pagesThatChanged.length; i++) {
        // incrementally compile with file changed hint
        await publishPage(pagesThatChanged[i], context)

        // [hmr] notify on change
        //notifyPageStatusChanged(pagesThatChanged[i], 'publish', context)
      }
    },
  }, context)

  return context
}
