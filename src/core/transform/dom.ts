import { parseHTML } from 'linkedom'
import { getAbstractDOM } from '../runtime/vdom'
import { getRuntimeLibraryFeatureActivationMap, injectInteractiveRuntimeLibrary } from './bundle'
import { Context } from '../../@types/context'
import { replaceStyleReplacements, uncapeCurlyBracketsAndBackticks } from './transpile'
import { ExecutionResult } from './vm'

/** creates a <script> element with code */
export const createVirtualDomScriptElement = (
  document: Document,
  scriptCode: string,
  attributes?: { [name: string]: string },
) => {
  const scriptEl = document.createElement('script')
  scriptEl.setAttribute('type', 'text/javascript')

  if (attributes) {
    // e.g. role="state"
    Object.keys(attributes).forEach((attrName) => {
      scriptEl.setAttribute(attrName, attributes[attrName])
    })
  }
  scriptEl.appendChild(document.createTextNode(scriptCode))
  return scriptEl
}

/**
 * inserts as first child of the root element (usually <head>) if child nodes are
 * available, else appends to root element
 */
export const injectVirtualDomElement = (rootElement: Element, scriptElement: Element) => {
  // e.g. <head> has child nodes, insert as first element
  if (rootElement.children.length > 0) {
    rootElement.insertBefore(scriptElement, rootElement.children.item(0))
  } else {
    // no childNodes, lets append
    rootElement.appendChild(scriptElement)
  }
}

/** materializes the virtual DOM into a DOM string, ergo "HTML" */
export const materializeDOM = async (executionResult: ExecutionResult<VDOMNode, any>, context: Context) => {
  const virtualDOM = executionResult.data
  const { document } = parseHTML('')

  // create synthetic <html> top-level element
  const htmlElement = document.createElement('html')
  document.appendChild(htmlElement)

  // mark root element
  virtualDOM['attributes'] = { root: 'root' }

  // TODO: mid-term goal: perf: linkedom can be probably constructed directly in tsx()
  // transform VDOM into linkedom
  getAbstractDOM(document, context)(virtualDOM, htmlElement)

  // actual virtualDOM top-level element (no matter what type it is),
  // which was marked as root element above
  const actualTopLevelElement = document.querySelector(`${virtualDOM.type}[root=root]`)

  // cleanup; remove attribute form resulting DOM
  actualTopLevelElement?.removeAttribute('root')

  // replace synthetic top-level <html> by marked root element
  // whereas <html> is always available, because parseHTML('')
  // internally constructs a shallow <html> element
  // which is to be replaced by the actualTopLevelElement
  document.querySelector('html')?.replaceWith(actualTopLevelElement as Node)

  // top-level element is an <html> element,
  // means we're dealing with a page, not a component
  if (actualTopLevelElement?.localName === 'html') {
    // TODO: perf: target: extreme performance
    // TODO: instead of hoisting, generate variants of .js runtime bundles,
    //       store in ./dist, src ref them and also add to serviceWorker.js
    //       onFinish

    const runtimeLibraryFeatureFlags = getRuntimeLibraryFeatureActivationMap(JSON.stringify(virtualDOM), context.mode)

    // hoise top-level interactive runtime in pages
    await injectInteractiveRuntimeLibrary(
      document,
      document.head,
      context,
      runtimeLibraryFeatureFlags,
      executionResult.state,
    )
  }
  return replaceStyleReplacements(uncapeCurlyBracketsAndBackticks(document.toString()), context)
}
