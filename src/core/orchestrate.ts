import { getPagesFolder, isDynamicRoutingPath } from "./io/folders"
import { addMaterializedHtmlFilePath, validateContext } from "./transform/context"
import { Context } from "../@types/context"
import { transformAndPersistSingle } from "./transform/transform"
import fg from "fast-glob"
import { registerHooks, runHooks } from "./hook/hook"
import { materializeDynamicRoutingPaths } from "./transform/routing"

export const setupContext = async(context: Context) => {
    validateContext(context)
    registerHooks(context)
    await runHooks('onContext', context)
    return context
}

/** organizes the flow of transformation for a full *.astro transform request including hooks */
export const orchestrateTransformAll = async(context: Context): Promise<Context> => {

    await setupContext(context)

    await runHooks('onDevServerStart', context)
    await runHooks('onStart', context)

    const astroFiles = await fg(`${getPagesFolder(context.config)}/**/*.astro`)

    console.log('Reflush all .astro templates...', astroFiles)

    for (let i=0; i<astroFiles.length; i++) {
        context = await orchestrateTransformSingle({
            ...context,
            path: astroFiles[i]
        })   
    }

    await runHooks('onFinish', context)

    return context
}

/** organizes the flow of transformation for a single .astro transform request including hooks */
export const orchestrateTransformSingle = async(context: Context): Promise<Context> => {

    await setupContext(context)

    await runHooks('onBeforePage', context)

    // makes sure, initial recognition of dynamic paths is happening, including processing
    // then recursively transform each permutation
    if (isDynamicRoutingPath(context.path!) && !context.materializedPath) {

        const materializedPages = await materializeDynamicRoutingPaths(context)

        for (let i=0; i<materializedPages.length; i++) {

            const dynamicPageContext = await orchestrateTransformSingle({
                ...context,
                ...materializedPages[i]
            })

            // create an entry for the dynamic page materialized, 
            // so that HMR can trigger well for those pages,
            // dependencies are the same for each page, so there is
            // potential to save on memory here (mark as dynamic page and ref 
            // instead of duplicate the same object over and over again)
            
            // remember code cached
            context.codeCache = {
                ...dynamicPageContext.codeCache
            }

            // remember materializedHtmlFilePaths
            if (dynamicPageContext.materializedHtmlFilePaths![context.path!]) {
                dynamicPageContext.materializedHtmlFilePaths![context.path!].forEach(path => 
                    addMaterializedHtmlFilePath(path, context))
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