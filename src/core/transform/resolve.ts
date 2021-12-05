import { resolve, dirname } from 'path'
import fg from 'fast-glob'
import { addFileDependency } from './context'
import { Context } from '../../@types/context'
const nodeResolve = require('node-resolve')

/**
 * import(path), import ... from path, Vanil.fetchContent(path)
 * relative import resolve logic (e.g. ../components or )
 */
export const resolvePathRelative = (targetPath: string, path: string) => {
  console.log('resolvePathRelative', targetPath)
  return resolve(dirname(path), targetPath)
}

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
export const resolveNodeAbsolute = (context: Context, importPath: string) =>
  nodeResolve.resolve(context.path!, importPath, dirname(context.path!))

/** resolves a Node.js module imports (for SSG Node.js top level code) */
export const resolveNodeImport = (importPath: string, context: Context) => {
  const moduleResolved = resolveNodeAbsolute(context, importPath)

  if (moduleResolved) {
    return resolve(dirname(context.path!), moduleResolved)
  }

  // we can't support "localFile.*" cases, because these
  // cannot be separated from Node.js node_module imports
  const resolvedImportPath = resolveImportForRuntimeInteractiveCode(importPath)

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
