// create shallow object
Vanil = Astro = {
  fetch,
  props: {},
} as any

Vanil.isBrowser = typeof window !== 'undefined'

// initializes the CJS exports object if necessary
// intentionally allows for global exports objects shared between <script>s
// (unified window-local exports scope)
exports = typeof exports === 'undefined' ? (exports = {}) : exports
