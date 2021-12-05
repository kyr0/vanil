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
export const filterComments = (children: any) => children.filter((child: any) => !isJSXComment(child))

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
    getScriptHoisted(attributes.src, 'js', attributes.lang, context),
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
    getStyleSheetHoisted(attributes.href, 'css', attributes.lang, context),
  ]

  // <link> had rel and href set; remove it
  delete attributes.href
  delete attributes.rel

  return {
    type,
    children,
  }
}

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
        type = 'fragment'
        children = []
        attributes = {}
      }
    }
  }

  // React fragment where type is { }
  if (typeof type === 'object') {
    children = type.children
    type = 'fragment'
  }

  // support for <slot>
  if (type === 'slot' && Vanil.slots && (Vanil.slots[attributes.name] || Vanil.slots!['default'])) {
    let targetSlotNode: IVirtualNode = Vanil.slots[attributes.name] || Vanil.slots['default']

    // innerText case
    if (typeof targetSlotNode === 'string') {
      targetSlotNode = {
        type: 'fragment',
        attributes: {},
        children: [targetSlotNode],
      }
    }

    // replace the <slot> VDOM node by the actual slot node (can be fragmented)
    type = targetSlotNode.type
    attributes = targetSlotNode.attributes || {}
    children = targetSlotNode.children || []
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

  // support <></>
  if (typeof type === 'undefined') {
    type = 'fragment'
  }

  // effectively unwrap by directly returning the children
  if (type === 'fragment') {
    return filterComments(children)
  }

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
