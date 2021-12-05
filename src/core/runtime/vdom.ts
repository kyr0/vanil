// BEWARE: ISOMORPHIC IMPLEMENTATION :: ALSO USED IN SSG TRANSFORM STEP
const CLASS_ATTRIBUTE_NAME = 'class'
const XLINK_ATTRIBUTE_NAME = 'xlink'
const REF_ATTRIBUTE_NAME = 'ref'
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

export const getAbstractDOM = (document: Document, context: any) => {
  // DOM abstraction layer for manipulation
  const AbstractDOM = {
    hasElNamespace: (domElement: Element): boolean => domElement.namespaceURI === SVG_NAMESPACE,

    hasSvgNamespace: (parentElement: Element, type: string): boolean =>
      AbstractDOM.hasElNamespace(parentElement) && type !== 'STYLE' && type !== 'SCRIPT',

    createElementOrElements: (
      virtualNode: IVirtualNode | undefined | Array<IVirtualNode | undefined | string>,
      parentDomElement?: Element,
    ): Array<Element | Text | undefined> | Element | Text | undefined => {
      if (Array.isArray(virtualNode)) {
        return AbstractDOM.createChildElements(virtualNode, parentDomElement)
      }
      if (typeof virtualNode !== 'undefined') {
        return AbstractDOM.createElement(virtualNode as IVirtualNode, parentDomElement)
      }
      // undefined virtualNode -> e.g. when a tsx variable is used in markup which is undefined
      return AbstractDOM.createTextNode('', parentDomElement)
    },

    createElement: (virtualNode: IVirtualNode, parentDomElement?: Element): Element | undefined => {
      let newEl

      if (
        virtualNode.type.toUpperCase() === 'SVG' ||
        (parentDomElement && AbstractDOM.hasSvgNamespace(parentDomElement, virtualNode.type.toUpperCase()))
      ) {
        newEl = document.createElementNS(SVG_NAMESPACE, virtualNode.type as string, {})
      } else {
        newEl = document.createElement(virtualNode.type as string)
      }

      // istanbul ignore else
      if (virtualNode.attributes) {
        AbstractDOM.setAttributes(virtualNode.attributes, newEl as any)
      }

      // istanbul ignore else
      if (virtualNode.children) {
        AbstractDOM.createChildElements(virtualNode.children, newEl as any)
      }

      // istanbul ignore else
      if (parentDomElement) {
        parentDomElement.appendChild(newEl as any)
      }
      return newEl as any
    },

    createTextNode: (text: string, domElement?: Element): Text => {
      const node = document.createTextNode(text.toString())

      // istanbul ignore else
      if (domElement) {
        domElement.appendChild(node as any)
      }
      return node
    },

    createChildElements: (
      virtualChildren: IVirtualChildren,
      domElement?: Element,
    ): Array<Element | Text | undefined> => {
      const children: Array<Element | Text | undefined> = []

      for (let i = 0; i < virtualChildren.length; i++) {
        const virtualChild = virtualChildren[i]

        if (virtualChild === null || (typeof virtualChild !== 'object' && typeof virtualChild !== 'function')) {
          children.push(
            AbstractDOM.createTextNode(
              (typeof virtualChild === 'undefined' || virtualChild === null ? '' : virtualChild!).toString(),
              domElement,
            ),
          )
        } else {
          children.push(AbstractDOM.createElement(virtualChild as IVirtualNode, domElement))
        }
      }
      return children
    },

    setAttribute: (name: string, value: any, domElement: Element) => {
      // attributes not set (undefined) are ignored; use null value to reset an attributes state
      if (typeof value === 'undefined') return

      // to reference elements by name and map the to Vanil.refs['$refName']
      if (name === REF_ATTRIBUTE_NAME && typeof value !== 'function') {
        if (typeof window === 'undefined') {
          // SSG generates the DOM selector query, runtime assigns reference
          context.refs[value] = `${domElement.tagName}[${REF_ATTRIBUTE_NAME}=${value}]`
        } else {
          Vanil.refs[value] = domElement
        }
      }

      // support simple innerHTML set via attribute
      if (name === 'innerHTML') {
        domElement.innerHTML = value
        return
      }

      // support React variant for setting innerHTML
      if (name === 'dangerouslySetInnerHTML') {
        domElement.innerHTML = value.__html
        return
      }

      // support React htmlFor/for
      if (name === 'htmlFor') {
        name = 'for'
      }

      // transforms className="..." -> class="..."
      // allows for React TSX to work seamlessly
      if (name === 'className') {
        name = CLASS_ATTRIBUTE_NAME
      }

      // transforms class={['a', 'b']} into class="a b"
      if (name === CLASS_ATTRIBUTE_NAME && Array.isArray(value)) {
        value = value.join(' ')
      }

      if (AbstractDOM.hasElNamespace(domElement) && name.startsWith(XLINK_ATTRIBUTE_NAME)) {
        // allows for <svg><use xlinkHref ...></svg>
        domElement.setAttributeNS(
          'http://www.w3.org/1999/xlink',
          `${XLINK_ATTRIBUTE_NAME}:${name.replace(XLINK_ATTRIBUTE_NAME, '')}`.toLowerCase(),
          value,
        )
      } else if (name === 'style' && typeof value !== 'string') {
        const propNames = Object.keys(value)

        for (let i = 0; i < propNames.length; i++) {
          ;(domElement as any).style[propNames[i] as any] = value[propNames[i]]
        }
      } else if (typeof value === 'boolean') {
        // for cases like <button checked={false} />
        ;(domElement as any)[name] = value
      } else {
        // for any other case
        domElement.setAttribute(name, value)
      }
    },

    setAttributes: (attributes: IVirtualNodeAttributes, domElement: Element) => {
      const attrNames = Object.keys(attributes)
      for (let i = 0; i < attrNames.length; i++) {
        AbstractDOM.setAttribute(attrNames[i], attributes[attrNames[i]], domElement)
      }
    },
  }

  return function (
    virtualNode: VDOMNode,
    parentDomElement: Element,
  ): Array<Element | Text | undefined> | Element | Text | undefined {
    if (typeof virtualNode === 'string') {
      return AbstractDOM.createTextNode(virtualNode, parentDomElement)
    }
    return AbstractDOM.createElementOrElements(virtualNode, parentDomElement)
  }
}

// browser runtime-interactive render function assignment
if (typeof Vanil !== 'undefined' && typeof document !== 'undefined') {
  Vanil.render = getAbstractDOM(document, Vanil.props.context)
}
