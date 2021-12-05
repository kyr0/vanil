export interface IAttributes {
  // array-local unique key to identify element items in a NodeList
  key?: string
}

export interface IVirtualNodeAttributes extends IAttributes {
  [attributeName: string]: any
}

export interface IVirtualNode<A = IVirtualNodeAttributes> {
  type: IVirtualNodeType
  attributes: A
  children: IVirtualChildren
}

export type IVirtualNodeType = string | any
export type IVirtualKey = string | number | any
export type IVirtualChild = IVirtualNode<any> | object | string | number | boolean | null | undefined
export type IVirtualChildren = IVirtualChild[]
export type VDOMNode = IVirtualNode | undefined | string | Array<IVirtualNode | undefined | string>

export interface VDOM {
  hasElNamespace: (domElement: Element) => boolean
  hasSvgNamespace: (parentElement: Element, type: string) => boolean
  createElementOrElements: (
    virtualNode: IVirtualNode | undefined | Array<IVirtualNode | undefined | string>,
    parentDomElement?: Element,
  ) => Array<Element | Text | undefined> | Element | Text | undefined
  createElement: (virtualNode: IVirtualNode, parentDomElement?: Element) => Element | undefined
  createTextNode: (text: string, domElement?: Element) => Text
  createChildElements: (virtualChildren: IVirtualChildren, domElement?: Element) => Array<Element | Text | undefined>
  setAttribute: (name: string, value: any, domElement: Element) => void
  setAttributes: (attributes: IVirtualNodeAttributes, domElement: Element) => void
}

export type TsxFn = (type: any, attributes: any, ...children: any) => any

export interface VDomApi {
  // runtime VDOM functional transform -> VDOM JSON
  tsx: TsxFn
}
