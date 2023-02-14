import { readFile } from 'fs/promises'
import type { OnLoadArgs, OnLoadResult, OnResolveArgs, Plugin, PluginBuild } from 'esbuild'
import postcss, { AcceptedPlugin } from 'postcss'
import { Context } from '../context';
import { getDefaultPostcssOptimizationPlugins, getDefaultPostcssPlugins } from './postcss';
import { transformSolidJsx } from './transform-solid-jsx';
import { dirname, resolve } from "path"

export interface CSSMGlobalPluginOptions {
  onCSSGenerated?: (css: string) => void;
  cssConfig?: CompileCssConfiguration;
  context: Context
  cssFilePath: string
}

export interface CompileCssResult {
  css: string;
  js: string;
}

export interface CompileCssConfiguration {
  plugins?: Array<AcceptedPlugin>;
  generateScopedName?: string;
}

async function compileCss(
  code: string,
  filename: string,
  context: Context,
  cssFilePath: string,
  config?: CompileCssConfiguration
): Promise<CompileCssResult> {
  const plugins: AcceptedPlugin[] = [
    ...(getDefaultPostcssPlugins(cssFilePath, context))
  ]

  if (context.config.buildOptions.optimize) {
    plugins.push(...getDefaultPostcssOptimizationPlugins(context))
  }

  let baseCssResult = postcss(plugins).process(code, { from: filename })

  await baseCssResult

  // apply other postcss magic after class names have been mapped
  if (config?.plugins && config.plugins.length > 0) {
    baseCssResult = postcss(config.plugins).process(baseCssResult.css, { from: filename })
    await baseCssResult
  }

  return {
    js: await transformSolidJsx(`
        export default () => 
          <style textContent={\`${baseCssResult.css}\`}></style>
      `, cssFilePath, {
      generate: 'ssr',
      hydratable: true
    }),
    css: baseCssResult.css,
  };
}

export const cssGlobalPlugin = (opts?: CSSMGlobalPluginOptions): Plugin => {
  return {
    name: 'css-global',
    setup: (build: PluginBuild) => {

      // import syntax for global css files is 
      build.onResolve({ filter: /global\!.*\.css$/, }, async(args: OnResolveArgs) => {
        const path = args.path.substring('global!'.length, args.path.length)
        return { path: resolve(dirname(args.importer), path), namespace: 'global' }
      })

      // matches **/global.css and **/*.global.css 
      build.onLoad({ filter: /\.css$/, namespace: 'global' },
        async (args: OnLoadArgs): Promise<OnLoadResult> => {
          const cssSourceCode = await readFile(args.path, 'utf8');
          const compiledCss = await compileCss(cssSourceCode, args.path, opts?.context, opts?.cssFilePath, opts?.cssConfig);

          if (opts?.onCSSGenerated) {
            opts.onCSSGenerated(compiledCss.css);
          }

          return {
            contents: compiledCss.js,
            loader: 'js',
          };
        }
      );
    },
  }
}