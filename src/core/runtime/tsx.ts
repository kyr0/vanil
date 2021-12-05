/** turns into: {}, which is detected here */
// @ts-ignore
const isJSXComment = (node: VDOMNode): boolean =>
  node && typeof node === 'object' && !node.attributes && !node.type && !node.children

/** filters comments and undefines like: ['a', 'b', false, {}] to: ['a', 'b', false] */
// @ts-ignore
const filterComments = (children: any) => children.filter((child: any) => !isJSXComment(child))

/** generates code to attach name-assigned events to the Vanil.event runtime */
// @ts-ignore
const runtimeAttachEventHandlers = (attributes: any) => {
  Object.keys(attributes).forEach((arributeName) => {
    if (!arributeName) return
    if (!arributeName.startsWith('on')) return

    // generating runtime interactive code to assign each event handler
    // registered a wrapper handler function for loosely/late binding
    attributes[arributeName] = `((e) => Vanil.e('${attributes[arributeName]}', e))(arguments[0])`
  })
}

/**
 * tsx(React-like fn call structure) transform function
 * to return a JSON tree for actual DOM creation and string transformation
 * BEWARE: This code will be called by ts-node on imports and as well in inline transpile runs
 */
Vanil.tsx = (
  type: string | Function | undefined,
  attributes: IVirtualNodeAttributes,
  ...children: IVirtualChildren
): VDOMNode => {
  children = filterComments(
    // implementation to flatten virtual node children structures like:
    // [<p>1</p>, [<p>2</p>,<p>3</p>]] to: [<p>1</p>,<p>2</p>,<p>3</p>]
    [].concat.apply([], children),
  )

  // clone attributes as well
  attributes = { ...attributes }

  // React fragment where type is { }
  if (typeof type === 'object') {
    children = (type as any).children
    type = 'fragment'
  }

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
