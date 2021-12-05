export interface ElementRefs {
  [refName: string]: Element
}

export type RenderFn = (
  virtualNode: VDOMNode,
  parentDomElement: Element,
) => Array<Element | Text | undefined> | Element | Text | undefined

export interface RenderApi {
  // runtime DOM refs
  refs: ElementRefs
  render: RenderFn
}
