// === CSS

export const addSingleClass = (ref: Element, className: string) => {
  if (!ref.classList.contains(className)) {
    ref.classList.add(className)
  }
}

export const addClass = (ref: Element, impl: Query) => (className: Array<string> | string) => {
  if (className instanceof Array) {
    for (let i = 0; i < className.length; i++) {
      addSingleClass(ref, className[i])
    }
  } else {
    addSingleClass(ref, className)
  }
  return impl
}

export const removeSingleClass = (ref: Element, className: string) => {
  if (ref.classList.contains(className)) {
    ref.classList.remove(className)
  }
}

export const removeClass = (ref: Element, impl: Query) => (className: Array<string> | string) => {
  if (className instanceof Array) {
    for (let i = 0; i < className.length; i++) {
      removeSingleClass(ref, className[i])
    }
  } else {
    removeSingleClass(ref, className)
  }
  return impl
}

export const toggleClass = (ref: Element, impl: Query) => (className: string) => {
  ref.classList.toggle(className)
  return impl
}

export const hasClass = (ref: Element) => (className: string) => ref.classList.contains(className)

// === DOM HIERARCHY

export const attr = (ref: Element, impl: Query) => (name: string, value?: any) => {
  if (typeof value === 'undefined') return ref.getAttribute(name)
  ref.setAttribute(name, value)
  return impl
}

export const val = (ref: Element, impl: Query) => (value?: any) => {
  const isCheckbox = (ref as any).type === 'checkbox'
  if (typeof value === 'undefined') {
    return isCheckbox ? (ref as any).checked : (ref as any).value
  }
  if (isCheckbox) {
    ;(ref as any).checked = value
  } else {
    ;(ref as any).value = value
  }
  return impl
}

export const empty = (ref: Element, impl: Query) => () => {
  ref.innerHTML = ''
  return impl
}

export const html = (ref: Element, impl: Query) => (html?: string) => {
  if (html) {
    ref.innerHTML = html
    return impl
  } else {
    return ref.innerHTML
  }
}

export const text = (ref: Element, impl: Query) => (text?: string) => {
  if (text) {
    // @ts-ignore
    ref.innerText = text
    return impl
  } else {
    // @ts-ignore
    return ref.innerText
  }
}

export const update = (ref: Element, impl: Query) => (vdom: VDOMNode) => {
  empty(ref, impl)()
  ref.appendChild(Vanil.render(vdom, ref) as Node)
  return impl
}

export const remove = (ref: Element, impl: Query) => () => {
  if (ref.parentNode) ref.parentNode.removeChild(ref)
  return impl
}

export const replaceWith = (ref: Element, impl: Query) => (vdom: VDOMNode) => {
  const el = Vanil.render(vdom, ref)
  if (ref.parentNode) {
    ref.parentNode.replaceChild(el as Node, ref)
  }
  return impl
}

// === DOM EVENTS

export const off = (ref: Element | Window, impl: Query) => (eventName: string, handler: EventListener) => {
  ref.removeEventListener(eventName, handler)
  return impl
}

export const on = (ref: Element | Window, impl: Query) => (eventName: string, handler: EventListener) => {
  ref.addEventListener(eventName, handler)
  return impl
}

/** $(...), Vanil.query(...), Vanil.$(...) or even recursively down the tree  */
Vanil.$ = function (selector: string | Element, root?: Element) {
  const el =
    selector instanceof Element ? selector : root ? root.querySelector(selector) : document.querySelector(selector)

  if (!el) {
    throw new Error(`Element for selector ${selector} not found!`)
  }

  const queryFn = (selector: string) => Vanil.$(selector, el)

  const getImpl = (el: Element) => {
    let impl: Query = {
      el,
    }
    impl.$ = queryFn
    impl.attr = attr(el, impl)
    impl.val = val(el, impl)
    impl.empty = empty(el, impl)
    impl.update = update(el, impl)
    impl.html = html(el, impl)
    impl.text = text(el, impl)
    impl.remove = remove(el, impl)
    impl.replaceWith = replaceWith(el, impl)
    impl.addClass = addClass(el, impl)
    impl.removeClass = removeClass(el, impl)
    impl.toggleClass = toggleClass(el, impl)
    impl.hasClass = hasClass(el)
    impl.on = on(el, impl)
    impl.off = off(el, impl)
    return impl
  }
  return getImpl(el) as Query
}
