import type { RuntimeContextAccessor } from './runtime'
import type { Context } from './core'
import type { _loadFiles as __loadFiles } from "./runtime-server"
import type { _publishFile as __publishFile } from "./runtime-server"
import type { _publishAsFile as __publishAsFile } from "./runtime-server"
import type { JSX } from "solid-js/jsx-runtime"
import type { _MDXProps } from "@types/mdx"

declare global {

  // public
  var _$CTX: RuntimeContextAccessor

  // flag for dead code elimination (applied for production builds only)
  var isServer: boolean

  // private

  // users use getContext() instead
  var _context: Context

  // users use getContext() to get the raw data built-in
  var _renderContext: RuntimeContextAccessor

  // users use loadFiles() and loadFile() to resolve content relative to a base path (_renderContext.pageSrc)
  var _loadFiles: typeof __loadFiles

  // users use publishFile() to publish files to dist
  var _publishFile: typeof __publishFile

  // users use publishAsFile() to publish content as a file to dist
  var _publishAsFile: typeof __publishAsFile
  
  var JSXElement: JSX.Element

  var MDXProps: _MDXProps

  interface ImportMeta {
    readonly env: {
      [key: string]: string
    }
  }
}