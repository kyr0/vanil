import ts from 'typescript'
import { resolve, dirname } from 'path'
import { TransformFnOptions } from './interface'

/** rewrites a relative import to absolute import or trigger rewrite callback */
const rewritePath = (
  importPath: string,
  sf: ts.SourceFile,
  opts: TransformFnOptions,
  regexps: Record<string, RegExp>,
  localName: string,
) => {
  const aliases = Object.keys(regexps)
  for (const alias of aliases) {
    const regex = regexps[alias]
    if (regexps[alias].test(importPath)) {
      return importPath.replace(regex, opts.alias![alias])
    }
  }

  if (typeof opts.rewrite === 'function') {
    const newImportPath = opts.rewrite(importPath, sf.fileName, localName)
    if (newImportPath) {
      return newImportPath
    }
  }

  if (opts.project && opts.projectBaseDir && importPath.startsWith('.')) {
    const path = resolve(dirname(sf.fileName), importPath).split(opts.projectBaseDir)[1]
    return `${opts.project}${path}`
  }

  return importPath
}

const isRequire = (node: ts.Node): node is ts.CallExpression =>
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.text === 'require' &&
  ts.isStringLiteral(node.arguments[0]) &&
  node.arguments.length === 1

const isDynamicImport = (node: ts.Node): node is ts.CallExpression =>
  ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword

const importExportVisitor = (
  ctx: ts.TransformationContext,
  sf: ts.SourceFile,
  opts: TransformFnOptions = { projectBaseDir: '' },
  regexps: Record<string, RegExp>,
) => {
  const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
    let importPath: string = ''
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      const importPathWithQuotes = node.moduleSpecifier.getText(sf)
      importPath = importPathWithQuotes.substr(1, importPathWithQuotes.length - 2)
    } else if (isDynamicImport(node) || isRequire(node)) {
      const importPathWithQuotes = node.arguments[0].getText(sf)
      importPath = importPathWithQuotes.substr(1, importPathWithQuotes.length - 2)
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      importPath = node.argument.literal.text // `.text` instead of `getText` bc this node doesn't map to sf (it's generated d.ts)
    }

    if (importPath) {
      const rewrittenPath = rewritePath(
        importPath,
        sf,
        opts,
        regexps,
        (node.parent as any).locals ? (node.parent as any).locals.keys().next().value : null,
      )

      // Only rewrite relative path
      if (rewrittenPath !== importPath) {
        if (ts.isImportDeclaration(node)) {
          // @ts-ignore
          return ctx.factory.updateImportDeclaration(
            node,
            node.decorators,
            node.modifiers,
            node.importClause,
            ctx.factory.createStringLiteral(rewrittenPath),
          )
        } else if (ts.isExportDeclaration(node)) {
          // @ts-ignore
          return ctx.factory.updateExportDeclaration(
            node,
            node.decorators,
            node.modifiers,
            node.isTypeOnly,
            node.exportClause,
            ctx.factory.createStringLiteral(rewrittenPath),
          )
        } else if (isDynamicImport(node) || isRequire(node)) {
          return ctx.factory.updateCallExpression(
            node,
            node.expression,
            node.typeArguments,
            ctx.factory.createNodeArray([ctx.factory.createStringLiteral(rewrittenPath)]),
          )
        } else if (ts.isImportTypeNode(node)) {
          return ctx.factory.updateImportTypeNode(
            node,
            ctx.factory.createLiteralTypeNode(ctx.factory.createStringLiteral(rewrittenPath)),
            node.qualifier,
            node.typeArguments,
            node.isTypeOf,
          )
        }
      }
      return node
    }
    return ts.visitEachChild(node, visitor, ctx)
  }
  return visitor
}

export const transformImportPaths = (opts: TransformFnOptions): ts.TransformerFactory<ts.SourceFile> => {
  const { alias = {} } = opts
  const regexps: Record<string, RegExp> = Object.keys(alias).reduce((all, regexString) => {
    all[regexString] = new RegExp(regexString, 'gi')
    return all
  }, {} as Record<string, RegExp>)
  return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    return (sf: ts.SourceFile) => ts.visitNode(sf, importExportVisitor(ctx, sf, opts, regexps))
  }
}
