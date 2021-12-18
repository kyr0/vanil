/** turns into: {}, which is detected here */
import { dirname, resolve } from 'path'
import { getPublicFolder } from '../io/folders'
import { addFileDependency } from './context'
import { Context } from '../../@types/context'
import { SSGRuntime } from '../../@types/runtime'
import { transpileRuntimeInteractiveScriptCode, uncapeCurlyBracketsAndBackticks } from './transpile'

// @ts-ignore
export const isJSXComment = (node: any): boolean =>
  node && typeof node === 'object' && !node.attributes && !node.type && !node.children

/** filters comments and undefines like: ['a', 'b', false, {}] to: ['a', 'b', false] */
// @ts-ignore
export const filterComments = (children: any) => children.filter((node: any) => !isJSXComment(node))

/** generates code to attach name-assigned events to the Vanil.event runtime */
// @ts-ignore
export const runtimeAttachEventHandlers = (attributes: any) => {
  Object.keys(attributes).forEach((arributeName) => {
    if (!arributeName) return
    if (!arributeName.startsWith('on')) return

    // generating runtime interactive code to assign each event handler
    // registered a wrapper handler function for loosely/late binding
    attributes[arributeName] = `((e) => Vanil.e('${attributes[arributeName]}', e))(arguments[0])`
  })
}

/** transform <script> into <script type="text/javascript">code</script> */
export const hoistRelativeLocalImportScript = (type: any, attributes: any, context: Context, ...children: any) => {
  if (!isRelativeSrcTarget(attributes.src) || type !== 'script') return children

  attributes.src = resolvePathRelative(attributes.src, context.path!)
  attributes.type = 'text/javascript'

  children = [
    // makes sure to load and transpile the code (ts -> js)
    getScriptHoisted(attributes.src, 'js', attributes, context),
  ]

  // hoised; doesn't need src="..."
  delete attributes.src

  return children
}

export const transpileInlineScript = (type: any, attributes: any, context: Context, ...children: any) => {
  if (type === 'script' && !attributes.src && children.length) {
    const scriptCode = transpileRuntimeInteractiveScriptCode(
      uncapeCurlyBracketsAndBackticks(children[0]),
      /* split and reorder import statements */ true,
      context.path!,
      'hoist',
      context,
    )

    delete attributes.src

    children[0] = scriptCode
  }
  return children
}

/** transform <style> into <style type="text/css">code</style> */
export const hoistRelativeLocalImportStyle = (type: any, attributes: any, context: Context, ...children: any) => {
  if (!isRelativeSrcTarget(attributes.href) || type !== 'link')
    return {
      type,
      children,
    }

  attributes.href = resolvePathRelative(attributes.href, context.path!)
  attributes.type = 'text/css'

  type = 'style'

  children = [
    // makes sure to load and transpile the code (scss, autoprfixer -> postcss -> css)
    getStyleSheetHoisted(attributes.href, 'css', attributes, context),
  ]

  // <link> had rel and href set; remove it
  delete attributes.href
  delete attributes.rel

  return {
    type,
    children,
  }
}

const stripFragments = (node: IVirtualNode) => {
  const stripFragment = (currentNode: IVirtualNode) => {
    if (!currentNode || !currentNode.children) return currentNode

    let children: Array<IVirtualNode> = []
    for (let i = 0; i < currentNode.children.length; i++) {
      let child = currentNode.children[i]

      if (child && child.type === 'fragment') {
        children = [...children, ...(stripFragment(child).children || [])]
      } else {
        children.push(stripFragment(child))
      }
    }
    currentNode.children = children
    return currentNode
  }
  return stripFragment(node)
}

export const SLOT_DEFAULT_NAME = 'default'

/**
 * tsx(React-like fn call structure) transform function
 * to return a JSON tree for actual DOM creation and string transformation
 * BEWARE: This code will be called by ts-node on imports and as well in inline transpile runs
 */
globalThis._tsx = (type: any, attributes: any, context: Context, Vanil: Partial<SSGRuntime>, ...children: any): any => {
  children = filterComments(
    // implementation to flatten virtual node children structures like:
    // [<p>1</p>, [<p>2</p>,<p>3</p>]] to: [<p>1</p>,<p>2</p>,<p>3</p>]
    [].concat.apply([], children),
  )

  // clone attributes as well
  attributes = { ...attributes }

  if (type === 'script' || type === 'link') {
    const refUri = attributes.src || attributes.href

    if (refUri) {
      // page runtime injection cache for scripts and stylesheets
      // it's invalidated per page
      if (context.pageRuntimeScriptsAndLinks!.indexOf(refUri) === -1) {
        context.pageRuntimeScriptsAndLinks!.push(refUri)
      } else {
        // double-injection, turn into fragement
        type = undefined
        children = []
        attributes = {}
      }
    }
  }

  // <slot /> becomes <slot name="default" />
  if (type === 'slot' && !attributes.name) {
    attributes.name = SLOT_DEFAULT_NAME
  }

  // support for named <slot name="???">
  if (type === 'slot' && Vanil.slots && Vanil.slots[attributes.name]) {
    return stripFragments(Vanil.slots[attributes.name]).children
  }

  // React fragment where type is { }
  if (typeof type === 'object') {
    children = type.children
    type = undefined
  }

  // support <></> and support <fragment></fragment>
  // effectively unwrap by directly returning the children
  if (type === 'fragment' || typeof type === 'undefined') {
    return filterComments(children)
  }

  // adding files to fileDependencies for specific HMR reload
  if (context.mode === 'development' && (attributes.src || attributes.href)) {
    const targetSrc = attributes.src || attributes.href
    if (isRelativeSrcTarget(targetSrc)) {
      if (type !== 'script' && type !== 'link') {
        addFileDependency(resolve(getPublicFolder(context.config), targetSrc), context)
      } else {
        addFileDependency(resolve(dirname(context.path!), targetSrc), context)
      }
    }
  }

  // mid-term goal
  // TODO: target: extreme performance
  // TODO: support download attribute with target path,
  //       download resource and ref from dist folder,
  //       add to serviceWorker.js onFinish

  children = transpileInlineScript(type, attributes, context, ...children)

  // hoist <script>'s that are imported like: ../*.(ts|js|tsx|jsx) or ./*.(ts|js|tsx|jsx) or just *.(ts|js|tsx|jsx)
  children = hoistRelativeLocalImportScript(type, attributes, context, ...children)

  // hoist <style>'s that are imported like: ../*.(css|scss) or ./*.(css|scss) or just *.(css|scss)
  const hoistedStyle = hoistRelativeLocalImportStyle(type, attributes, context, ...children)
  type = hoistedStyle.type
  children = hoistedStyle.children

  // attach event handlers via Vanil.event runtime
  runtimeAttachEventHandlers(attributes)

  // it's a component;
  // call it to continue with tree transformation
  if (typeof type === 'function') {
    return type({
      children,
      ...attributes,
    })
  }

  return {
    type,
    attributes,
    children,
  }
}
