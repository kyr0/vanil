export type QueryFn = (selector: string | Element, rootElement?: Element) => Query

export interface Query {
  $: QueryFn
  attr(name: string, value?: string): string | null | Query
  val(value?: string | boolean): string | boolean | Query
  empty(): Query
  update(vdom: VDOMNode): Query
  html(html?: string): Query | string
  text(text?: string): Query | string
  remove(): Query
  replaceWith(vdom: VDOMNode): Query
  addClass(className: Array<string> | string): Query
  removeClass(className: Array<string> | string): Query
  hasClass(className: string): boolean
  toggleClass(className: string): Query
  on(eventName: string, handler: EventListener): Query
  off(eventName: string, handler: EventListener): Query
  el: Element | Text | (Element | Text | undefined)[] | undefined
}

export interface QueryApi {
  $: QueryFn
}
