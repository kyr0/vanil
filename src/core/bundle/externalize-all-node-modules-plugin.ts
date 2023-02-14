import { Plugin } from "esbuild"
import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve'

export const externalizeAllNodeModulesPlugin = (): Plugin => NodeResolvePlugin({
    extensions: ['.ts', '.js'],
    onResolved: (resolved) => {
        if (resolved.includes('node_modules')) {
            return {
                external: true,
            }
        }
        return resolved
    },
})
