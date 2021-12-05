import ts, { TranspileOptions } from 'typescript'
import { Context } from '../../@types/context'
import { CONFIG_BUILD_TARGET } from './defaults'

/** decides on the default TypeScript compiler options to use */
export const geTranspileOptions = (context: Context): TranspileOptions => {
  return {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: (context.config.buildOptions?.target as unknown as ts.ScriptTarget) || CONFIG_BUILD_TARGET,
      allowJs: true,
      jsx: ts.JsxEmit.React,
      jsxFragmentFactory: 'Vanil.tsx',
      jsxFactory: 'Vanil.tsx', // see runtime.ts (SSG)
      skipLibCheck: true,
      checkJs: false,
      skipDefaultLibCheck: true,
    },
  }
}
