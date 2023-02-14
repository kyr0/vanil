import { glob, isExcludedByBasePath, isNodeModulesPath } from "../io"
import { Plugin } from "esbuild"
import { resolve } from "path"
import { Context } from "../context"
import { addFileDependency } from "../change-detection"

export interface DependencyTrackerPluginOptions {
    context: Context
}

export const dependencyTrackerPlugin = (options: DependencyTrackerPluginOptions): Plugin => {

    const excludedPaths = options.context.config.devOptions.excludedFolders
        .map(path => resolve(path))

    return {
        name: 'dependency-tracker-plugin',
        setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {

                if (!args.importer) return null
                const resolvePath = resolve(args.resolveDir, args.path)
                if (isNodeModulesPath(resolvePath)) return null

                // matches all imports with an arbitrary file ext (that may not be stated by the import)
                const candidates = glob(`${resolvePath}*`)

                if (candidates.length) {
                    candidates.forEach((fileDependencyPath) => {

                        // TODO: limit filetypes: exclude .map and .d.ts

                        if (
                            !isExcludedByBasePath(excludedPaths, fileDependencyPath)) {
                            addFileDependency(fileDependencyPath, options.context, args.importer)
                        }
                    })
                }
                return null
            })
        },
    }
}
