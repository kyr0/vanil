import { resolve, dirname } from 'path'
import fg from 'fast-glob'
import { addFileDependency } from './context'
import { Context } from '../../@types/context'
import { existsSync, lstatSync } from 'fs'
const nodeResolve = require('node-resolve')

/**
 * import(path), import ... from path, Vanil.fetchContent(path)
 * relative import resolve logic (e.g. ../components or )
 */
export const resolvePathRelative = (targetPath: string, path: string) =>
  resolve(isDir(path) ? path : dirname(path), targetPath)

export const isDir = (path: string) => existsSync(path) && lstatSync(path).isDirectory()

/** decides if a path is a relative import (relative to a path) */
export const isRelativePathImport = (path: string) => path.startsWith('../') || path.startsWith('./')

/** returns an absolute import path or a :// protocol import path based on a relative import */
export const resolveImportForRuntimeInteractiveCode = (importPath: string, path: string = '.') => {
  if (isRelativePathImport(importPath)) {
    return resolvePathRelative(importPath, path)
  } else {
    return importPath
  }
}

/** uses the node resolve algorithm to discover and rewrite paths to absolute paths */
export const resolveNodeAbsolute = (importPath: string, relImportPath: string) => {
  const resolvedPath = nodeResolve.resolve(
    relImportPath,
    importPath,
    isDir(relImportPath) ? relImportPath : dirname(relImportPath),
  )

  if (resolvedPath) {
    return resolvedPath
  }
  return resolvedPath
}

/** resolves a Node.js module imports (for SSG Node.js top level code) */
export const resolveNodeImport = (importPath: string, context: Context, relImportPath?: string) => {
  const path = relImportPath ? relImportPath : context.path!
  const moduleResolved = resolveNodeAbsolute(importPath, isDir(path) ? path : dirname(path))

  if (moduleResolved) {
    return resolve(relImportPath ? relImportPath : dirname(context.path!), moduleResolved)
  }

  // we can't support "localFile.*" cases, because these
  // cannot be separated from Node.js node_module imports
  let resolvedImportPath = resolveImportForRuntimeInteractiveCode(importPath)

  // use .astro component-relative import path resolving
  if (context.isProcessingComponent) {
    resolvedImportPath = resolveImportForRuntimeInteractiveCode(importPath, context.path)
  }

  // import of a relative/absolute module, maybe inside of .astro component
  if (relImportPath) {
    resolvedImportPath = resolveImportForRuntimeInteractiveCode(importPath, relImportPath)
  }

  // register in dependency linked list
  addFileDependency(resolvedImportPath, context)

  return resolvedImportPath
}

/** materializes a module import selecting a file by extension, priority */
export const materializePathSelectFile = (path: string) => fg.sync(`${path}*.{tsx,jsx,ts,js}`)[0]

/** decides if the file is a (valid) absolute source file path import (file exists and extension supported) */
export const isAbsoluteFileImportTarget = (path: string) => !!materializePathSelectFile(path)

/** decides if an import/require target path looks like //foo/bar or https://, etc. */
export const isRemoteImportTarget = (path: string) => path.indexOf('//') > -1 && !isAbsoluteFileImportTarget(path)

/**
 * used for processing inside of tsx() where {} TSX expressions can happen
 * in <* href={} and <* src={} scanarios
 */
export const isRelativeSrcTarget = (srcTarget: string) => {
  if (!srcTarget) {
    return false
  }

  let isRelative = true

  // remote source without protocol
  if (srcTarget.startsWith('/') && !srcTarget.startsWith('//')) isRelative = false

  // remore source with protocol
  if (srcTarget.indexOf('://') > -1) isRelative = false

  // dyanmic TSX evaluation
  if (srcTarget.trim()[0] === '{' && srcTarget.trim()[srcTarget.length - 1] === '}') isRelative = false

  return isRelative
}
