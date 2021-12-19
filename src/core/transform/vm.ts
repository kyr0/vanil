import { Context } from '../../@types/context'

const vm = require('vm')

// === IMPORTS NEEDED FOR RUNTIME EVALUATION ===

// need to import the tsx() transform code for later evaluation
import './tsx'

// SSG runtime
import './runtime'
import fetch from 'cross-fetch'
import { getPagesFolder } from '../io/folders'
import { getPageUrl } from './routing'
import { preprocessVanilComponentPropsAndSlots } from './runtime'
import { SSGRuntime } from '../../@types/runtime'
import { addFeatureFlags } from './context'
import { detectRuntimeLibraryFeatures } from './bundle'

// === END IMPORTS NEEDED FOR RUNTIME EVALUATION ===

export interface ScriptExecutionError {
  errorType: string
  errorMessage: string
  linesOfError?: Array<string>
  // used for server-side console error
  original?: any
}

export interface ExecutionResult<D, S = any> {
  data?: D
  state?: S
  error?: ScriptExecutionError
}

export const run = async <D, S>(scriptCode: string, context: Context): Promise<ExecutionResult<D, S>> => {
  let state: any

  // Vanil execution context
  const VanilLocal: Partial<SSGRuntime> = {
    mode: context.mode,

    restartOnFileChange: (path: string) => globalThis.restartOnFileChange(path, context),

    // export methods publicly available
    fetch,
    fetchContent: (path: string) => globalThis.vanilFetchContent(path, context),
    resolve: (path: string) => globalThis.resolvePathRelative(path, context.path!),

    setPropsState: (_state: any) => {
      // map result state
      state = _state
    },
    // Vanil.props (dynamically set here and extended in generated runtime code)
    props: {
      context,
      state: {},
      // from dynamic routing props
      ...(context.pageParamsAndProps?.props || {}),
    },
    // Vanil.request (dynamically set, passing path based routing params)
    request: {
      url: getPageUrl(context.materializedPath!, context),
      // from dynamic routing path params
      params: context.pageParamsAndProps?.params || {},
    },
    // Vanil.slots (dynamically used when importing .astro components for passing children)
    slots: {},
    // Vanil.site
    site: context.config.buildOptions!.site!,
    isPage: context.path!.indexOf(getPagesFolder(context.config)) > -1 ? true : false,
  }

  let data: any
  try {
    const script = new vm.Script(`${scriptCode};exports.default ? exports.default({}) : exports`)

    const runContext = new vm.createContext({
      globalThis: globalThis, // pass globals by reference
      exports: {}, // don't share exports
      process: process, // process global exposed
      console: console, // pipe console
      require: require, // allow SSG code to require()
      context: context, // passing the compilation context for cross-stage transforms
      React: {}, // provided for <fragment> <> support

      importVanilComponent: (props: any) => preprocessVanilComponentPropsAndSlots(props, VanilLocal),
      // Vanil.fetchContent() and Vanil.resolve() with path-relative support
      Vanil: {
        ...Vanil,
        ...VanilLocal,
      },
      // general TSX/JSX processing function with hoisting support
      tsx: (type: any, attributes: any, ...children: Array<any>) =>
        globalThis._tsx(type, attributes, context, VanilLocal, ...children),
    })

    // const dt = Date.now()

    data = await script.runInContext(runContext, {
      lineOffset: 0,
      displayErrors: true,
    })

    // accumulate detected interactive runtime feature use
    addFeatureFlags(detectRuntimeLibraryFeatures(data, context.mode), context)

    // console.log('vm elapsed', context.path, Date.now() - dt)
  } catch (e: any) {
    const errorStackTraceSplits = (e as Error).stack?.split('\n')
    const linesOfError = [errorStackTraceSplits![1], errorStackTraceSplits![2]]

    const errorTrace = {
      error: {
        original: e,
        errorType: (e as Error).name,
        errorMessage: (e as Error).message.split('\n')[0],
        linesOfError,
      },
    }
    return errorTrace
  }

  return {
    data,
    state,
  }
}
