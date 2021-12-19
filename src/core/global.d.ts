export declare global {
  type Query = Query
  type VDOMNode = VDOMNode
  type IVirtualNode = IVirtualNode
  type IVirtualChildren = IVirtualChildren
  type IVirtualNodeAttributes = IVirtualNodeAttributes

  // --- NOT EXPOSED IN BROWSER // ONLY FOR SSG EVALUATION:

  // node inline evaluation runtime lib
  var _tsx: (type: any, attributes: any, context: Context, Vanil: Partial<VanilSSGRuntime>, ...children: any) => any

  var React: any
  var filePath: string
  var isRelativeSrcTarget: (srcTarget: string) => boolean
  var resolvePathRelative: (targetPath: string, path: string) => string
  var getStyleSheetHoisted: (
    href: string,
    type: ResultLanguageType,
    lang: SourceLanguageType,
    context: Context,
  ) => string
  var getScriptHoisted: (src: string, type: ResultLanguageType, lang: SourceLanguageType, context: Context) => string
  var getStaticPaths: () => Promise<Array<any>>
  var fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  var vanilFetchContent: (targetPath: string, context: Context) => Array<any>
  var restartOnFileChange: (targetPath: string, context: Context) => void
  var vanilResolve: (targetPath: string, context: Context) => string
  var paginate: (data: Array<any>, paginationParams: PaginationParams) => Array<any>

  // --- EXPOSED IN BROWSER:
  // browser-interactive runtime lib
  var Vanil: InteractiveRuntime
  var Astro: InteractiveRuntime

  // development mode variables
  var __VANIL_LIVE_RELOAD_URL: string
}
