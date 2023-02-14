import { Plugin } from "esbuild"
import { resolve } from "path"
import { fileURLToPath } from "url";

export interface RuntimeResolveOptions {
  isServer?: boolean;
  dedup?: boolean
}

export function runtimeResolvePlugin({ isServer, dedup }: RuntimeResolveOptions): Plugin {
    return {
        name: 'runtime-resolve-plugin',
        setup(build) {
            const skipResolve = {}

            // chooses the correct implementation invariant depending on isServer or no
            build.onResolve({ filter: /runtime/ }, args => {
                if (args.path.startsWith('solid-jsx')) return
                return ({ 
                    path: resolve(args.resolveDir, `${args.path}-${isServer ? 'server' : 'client'}.js`) 
                })
            })

            if (dedup) {
                // de-duplicates solid-js and solid-js/web imports by
                // resolving exactly to the same file all the time
                // also makes sure the correct implementation invariant is chosen
                build.onResolve({ filter: /solid-js/ }, async args => {

                    /* original, working
                    if (args.path.startsWith('solid-jsx')) return

                    const solidJsPath = await import.meta.resolve(args.path)
                    const clientImplFileName = solidJsPath.indexOf('solid-js/web') > -1 ? 'web.js' : 'solid.js'
                    const consolidatedSolidJsPath = !isServer ? solidJsPath.replace('server.js', clientImplFileName) : solidJsPath
                    */

                    if (args.path.startsWith('solid-jsx')) return   
                    if (args.pluginData === skipResolve) return
                    const internalReolve = await build.resolve(args.path, { kind: 'import-statement', resolveDir: args.resolveDir, namespace: args.namespace,  pluginData: skipResolve, importer: args.importer })
                    
                    const solidJsPath = await import.meta.resolve(args.path)
                    const clientImplFileName = solidJsPath.indexOf('solid-js/web') > -1 ? 'web.js' : 'solid.js'

                    let consolidatedSolidJsPath = solidJsPath
                    if (solidJsPath.indexOf('solid-js/store') > -1) {
                        console.log('Looking for store impl', consolidatedSolidJsPath)
                        if (isServer) {
                            consolidatedSolidJsPath = solidJsPath.replace('solid.js', 'server.js')
                        } else {
                            consolidatedSolidJsPath = solidJsPath.replace('solid.js', 'store.js')
                        }
                    } else if (!isServer) {
                        consolidatedSolidJsPath = solidJsPath.replace('server.js', clientImplFileName)
                    }
                    
                    return { path: fileURLToPath(consolidatedSolidJsPath) }
                })
            }
        },
    }
}

