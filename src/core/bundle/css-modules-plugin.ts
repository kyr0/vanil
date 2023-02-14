import { readFile } from 'fs/promises'
import type { OnLoadArgs, OnLoadResult, Plugin, PluginBuild } from 'esbuild'
import postcss, { AcceptedPlugin } from 'postcss'
import postcssModules from 'postcss-modules'
import { hashContent } from '../cache';
import { Context } from '../context';
import { getDefaultPostcssOptimizationPlugins, getDefaultPostcssPlugins } from './postcss';

export interface CSSModulesPluginOptions {
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

function generateScopedName(name: string, filename: string, css: string) {
  const classNamePositionIndex = css.indexOf(`.${name}`);
  const lineNumber = css.substring(0, classNamePositionIndex).split(/[\r\n]/).length;
  return `${name}_${hashContent(css)}_${lineNumber}`;
}

async function compileCss(
  code: string,
  filename: string,
  context: Context,
  cssFilePath: string,
  config?: CompileCssConfiguration
): Promise<CompileCssResult> {
  let exportedTokens = {};
  const plugins: AcceptedPlugin[] = [
    ...(getDefaultPostcssPlugins(cssFilePath, context)),
    postcssModules({
      generateScopedName: generateScopedName,
      getJSON: (cssFileName, json, outputFileName) => {
        exportedTokens = json;
      },
    }),
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

  // TODO: option to save a d.ts file next to the .css file (in src)
  return {
    js: `export default JSON.parse('${JSON.stringify(
      exportedTokens
    )}');`,
    css: baseCssResult.css,
  };
}

export const cssModulesPlugin = (opts?: CSSModulesPluginOptions): Plugin => {
  return {
    name: 'css-modules',
    setup: (build: PluginBuild) => {
      build.onLoad({ filter: /\.css$/, },
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