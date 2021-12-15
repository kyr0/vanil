;(function () {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = 'function' == typeof require && require
          if (!f && c) return c(i, !0)
          if (u) return u(i, !0)
          var a = new Error("Cannot find module '" + i + "'")
          throw ((a.code = 'MODULE_NOT_FOUND'), a)
        }
        var p = (n[i] = { exports: {} })
        e[i][0].call(
          p.exports,
          function (r) {
            var n = e[i][1][r]
            return o(n || r)
          },
          p,
          p.exports,
          r,
          e,
          n,
          t,
        )
      }
      return n[i].exports
    }
    for (var u = 'function' == typeof require && require, i = 0; i < t.length; i++) o(t[i])
    return o
  }
  return r
})()(
  {
    1: [
      function (require, module, exports) {
        'use strict'

        function _toConsumableArray(arr) {
          if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]
            return arr2
          } else {
            return Array.from(arr)
          }
        }

        const O = Object

        var _require = require('printable-characters')

        const first = _require.first,
          strlen = _require.strlen,
          limit = (s, n) => first(s, n - 1) + '…'

        const asColumns = (rows, cfg_) => {
          const zip = (arrs, f) =>
              arrs
                .reduce((a, b) => b.map((b, i) => [].concat(_toConsumableArray(a[i] || []), [b])), [])
                .map((args) => f.apply(undefined, _toConsumableArray(args))),
            /*  Convert cell data to string (converting multiline text to singleline) */

            cells = rows.map((r) => r.map((c) => c.replace(/\n/g, '\\n'))),
            /*  Compute column widths (per row) and max widths (per column)     */

            cellWidths = cells.map((r) => r.map(strlen)),
            maxWidths = zip(cellWidths, Math.max),
            /*  Default config     */

            cfg = O.assign(
              {
                delimiter: '  ',
                minColumnWidths: maxWidths.map((x) => 0),
                maxTotalWidth: 0,
              },
              cfg_,
            ),
            delimiterLength = strlen(cfg.delimiter),
            /*  Project desired column widths, taking maxTotalWidth and minColumnWidths in account.     */

            totalWidth = maxWidths.reduce((a, b) => a + b, 0),
            relativeWidths = maxWidths.map((w) => w / totalWidth),
            maxTotalWidth = cfg.maxTotalWidth - delimiterLength * (maxWidths.length - 1),
            excessWidth = Math.max(0, totalWidth - maxTotalWidth),
            computedWidths = zip([cfg.minColumnWidths, maxWidths, relativeWidths], (min, max, relative) =>
              Math.max(min, Math.floor(max - excessWidth * relative)),
            ),
            /*  This is how many symbols we should pad or cut (per column).  */

            restCellWidths = cellWidths.map((widths) => zip([computedWidths, widths], (a, b) => a - b))

          /*  Perform final composition.   */

          return zip([cells, restCellWidths], (a, b) =>
            zip([a, b], (str, w) =>
              w >= 0 ? (cfg.right ? ' '.repeat(w) + str : str + ' '.repeat(w)) : limit(str, strlen(str) + w),
            ).join(cfg.delimiter),
          )
        }

        const asTable = (cfg) =>
          O.assign(
            (arr) => {
              var _ref

              /*  Print arrays  */

              if (arr[0] && Array.isArray(arr[0])) {
                return asColumns(
                  arr.map((r) => r.map((c, i) => (c === undefined ? '' : cfg.print(c, i)))),
                  cfg,
                ).join('\n')
              }

              /*  Print objects   */

              const colNames = [].concat(
                  _toConsumableArray(new Set((_ref = []).concat.apply(_ref, _toConsumableArray(arr.map(O.keys))))),
                ),
                columns = [colNames.map(cfg.title)].concat(
                  _toConsumableArray(
                    arr.map((o) => colNames.map((key) => (o[key] === undefined ? '' : cfg.print(o[key], key)))),
                  ),
                ),
                lines = asColumns(columns, cfg)

              return (
                cfg.dash
                  ? [lines[0], cfg.dash.repeat(strlen(lines[0]))].concat(_toConsumableArray(lines.slice(1)))
                  : lines
              ).join('\n')
            },
            cfg,
            {
              configure: (newConfig) => asTable(O.assign({}, cfg, newConfig)),
            },
          )

        module.exports = asTable({
          maxTotalWidth: Number.MAX_SAFE_INTEGER,
          print: String,
          title: String,
          dash: '-',
          right: false,
        })
      },
      { 'printable-characters': 9 },
    ],
    2: [
      function (require, module, exports) {
        'use strict'

        exports.byteLength = byteLength
        exports.toByteArray = toByteArray
        exports.fromByteArray = fromByteArray

        var lookup = []
        var revLookup = []
        var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

        var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
        for (var i = 0, len = code.length; i < len; ++i) {
          lookup[i] = code[i]
          revLookup[code.charCodeAt(i)] = i
        }

        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        revLookup['-'.charCodeAt(0)] = 62
        revLookup['_'.charCodeAt(0)] = 63

        function getLens(b64) {
          var len = b64.length

          if (len % 4 > 0) {
            throw new Error('Invalid string. Length must be a multiple of 4')
          }

          // Trim off extra bytes after placeholder bytes are found
          // See: https://github.com/beatgammit/base64-js/issues/42
          var validLen = b64.indexOf('=')
          if (validLen === -1) validLen = len

          var placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4)

          return [validLen, placeHoldersLen]
        }

        // base64 is 4/3 + up to two characters of the original data
        function byteLength(b64) {
          var lens = getLens(b64)
          var validLen = lens[0]
          var placeHoldersLen = lens[1]
          return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen
        }

        function _byteLength(b64, validLen, placeHoldersLen) {
          return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen
        }

        function toByteArray(b64) {
          var tmp
          var lens = getLens(b64)
          var validLen = lens[0]
          var placeHoldersLen = lens[1]

          var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

          var curByte = 0

          // if there are placeholders, only get up to the last complete 4 chars
          var len = placeHoldersLen > 0 ? validLen - 4 : validLen

          for (var i = 0; i < len; i += 4) {
            tmp =
              (revLookup[b64.charCodeAt(i)] << 18) |
              (revLookup[b64.charCodeAt(i + 1)] << 12) |
              (revLookup[b64.charCodeAt(i + 2)] << 6) |
              revLookup[b64.charCodeAt(i + 3)]
            arr[curByte++] = (tmp >> 16) & 0xff
            arr[curByte++] = (tmp >> 8) & 0xff
            arr[curByte++] = tmp & 0xff
          }

          if (placeHoldersLen === 2) {
            tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
            arr[curByte++] = tmp & 0xff
          }

          if (placeHoldersLen === 1) {
            tmp =
              (revLookup[b64.charCodeAt(i)] << 10) |
              (revLookup[b64.charCodeAt(i + 1)] << 4) |
              (revLookup[b64.charCodeAt(i + 2)] >> 2)
            arr[curByte++] = (tmp >> 8) & 0xff
            arr[curByte++] = tmp & 0xff
          }

          return arr
        }

        function tripletToBase64(num) {
          return (
            lookup[(num >> 18) & 0x3f] + lookup[(num >> 12) & 0x3f] + lookup[(num >> 6) & 0x3f] + lookup[num & 0x3f]
          )
        }

        function encodeChunk(uint8, start, end) {
          var tmp
          var output = []
          for (var i = start; i < end; i += 3) {
            tmp = ((uint8[i] << 16) & 0xff0000) + ((uint8[i + 1] << 8) & 0xff00) + (uint8[i + 2] & 0xff)
            output.push(tripletToBase64(tmp))
          }
          return output.join('')
        }

        function fromByteArray(uint8) {
          var tmp
          var len = uint8.length
          var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
          var parts = []
          var maxChunkLength = 16383 // must be multiple of 3

          // go through the array every three bytes, we'll deal with trailing stuff later
          for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength))
          }

          // pad the end with zeros, but make sure to not forget the extra bytes
          if (extraBytes === 1) {
            tmp = uint8[len - 1]
            parts.push(lookup[tmp >> 2] + lookup[(tmp << 4) & 0x3f] + '==')
          } else if (extraBytes === 2) {
            tmp = (uint8[len - 2] << 8) + uint8[len - 1]
            parts.push(lookup[tmp >> 10] + lookup[(tmp >> 4) & 0x3f] + lookup[(tmp << 2) & 0x3f] + '=')
          }

          return parts.join('')
        }
      },
      {},
    ],
    3: [
      function (require, module, exports) {
        ;(function (Buffer) {
          /*!
           * The buffer module from node.js, for the browser.
           *
           * @author   Feross Aboukhadijeh <https://feross.org>
           * @license  MIT
           */
          /* eslint-disable no-proto */

          'use strict'

          var base64 = require('base64-js')
          var ieee754 = require('ieee754')

          exports.Buffer = Buffer
          exports.SlowBuffer = SlowBuffer
          exports.INSPECT_MAX_BYTES = 50

          var K_MAX_LENGTH = 0x7fffffff
          exports.kMaxLength = K_MAX_LENGTH

          /**
           * If `Buffer.TYPED_ARRAY_SUPPORT`:
           *   === true    Use Uint8Array implementation (fastest)
           *   === false   Print warning and recommend using `buffer` v4.x which has an Object
           *               implementation (most compatible, even IE6)
           *
           * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
           * Opera 11.6+, iOS 4.2+.
           *
           * We report that the browser does not support typed arrays if the are not subclassable
           * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
           * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
           * for __proto__ and has a buggy typed array implementation.
           */
          Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

          if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error(
              'This browser lacks typed array (Uint8Array) support which is required by ' +
                '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.',
            )
          }

          function typedArraySupport() {
            // Can typed array instances can be augmented?
            try {
              var arr = new Uint8Array(1)
              arr.__proto__ = {
                __proto__: Uint8Array.prototype,
                foo: function () {
                  return 42
                },
              }
              return arr.foo() === 42
            } catch (e) {
              return false
            }
          }

          Object.defineProperty(Buffer.prototype, 'parent', {
            enumerable: true,
            get: function () {
              if (!Buffer.isBuffer(this)) return undefined
              return this.buffer
            },
          })

          Object.defineProperty(Buffer.prototype, 'offset', {
            enumerable: true,
            get: function () {
              if (!Buffer.isBuffer(this)) return undefined
              return this.byteOffset
            },
          })

          function createBuffer(length) {
            if (length > K_MAX_LENGTH) {
              throw new RangeError('The value "' + length + '" is invalid for option "size"')
            }
            // Return an augmented `Uint8Array` instance
            var buf = new Uint8Array(length)
            buf.__proto__ = Buffer.prototype
            return buf
          }

          /**
           * The Buffer constructor returns instances of `Uint8Array` that have their
           * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
           * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
           * and the `Uint8Array` methods. Square bracket notation works as expected -- it
           * returns a single octet.
           *
           * The `Uint8Array` prototype remains unmodified.
           */

          function Buffer(arg, encodingOrOffset, length) {
            // Common case.
            if (typeof arg === 'number') {
              if (typeof encodingOrOffset === 'string') {
                throw new TypeError('The "string" argument must be of type string. Received type number')
              }
              return allocUnsafe(arg)
            }
            return from(arg, encodingOrOffset, length)
          }

          // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
          if (typeof Symbol !== 'undefined' && Symbol.species != null && Buffer[Symbol.species] === Buffer) {
            Object.defineProperty(Buffer, Symbol.species, {
              value: null,
              configurable: true,
              enumerable: false,
              writable: false,
            })
          }

          Buffer.poolSize = 8192 // not used by this implementation

          function from(value, encodingOrOffset, length) {
            if (typeof value === 'string') {
              return fromString(value, encodingOrOffset)
            }

            if (ArrayBuffer.isView(value)) {
              return fromArrayLike(value)
            }

            if (value == null) {
              throw TypeError(
                'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
                  'or Array-like Object. Received type ' +
                  typeof value,
              )
            }

            if (isInstance(value, ArrayBuffer) || (value && isInstance(value.buffer, ArrayBuffer))) {
              return fromArrayBuffer(value, encodingOrOffset, length)
            }

            if (typeof value === 'number') {
              throw new TypeError('The "value" argument must not be of type number. Received type number')
            }

            var valueOf = value.valueOf && value.valueOf()
            if (valueOf != null && valueOf !== value) {
              return Buffer.from(valueOf, encodingOrOffset, length)
            }

            var b = fromObject(value)
            if (b) return b

            if (
              typeof Symbol !== 'undefined' &&
              Symbol.toPrimitive != null &&
              typeof value[Symbol.toPrimitive] === 'function'
            ) {
              return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length)
            }

            throw new TypeError(
              'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
                'or Array-like Object. Received type ' +
                typeof value,
            )
          }

          /**
           * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
           * if value is a number.
           * Buffer.from(str[, encoding])
           * Buffer.from(array)
           * Buffer.from(buffer)
           * Buffer.from(arrayBuffer[, byteOffset[, length]])
           **/
          Buffer.from = function (value, encodingOrOffset, length) {
            return from(value, encodingOrOffset, length)
          }

          // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
          // https://github.com/feross/buffer/pull/148
          Buffer.prototype.__proto__ = Uint8Array.prototype
          Buffer.__proto__ = Uint8Array

          function assertSize(size) {
            if (typeof size !== 'number') {
              throw new TypeError('"size" argument must be of type number')
            } else if (size < 0) {
              throw new RangeError('The value "' + size + '" is invalid for option "size"')
            }
          }

          function alloc(size, fill, encoding) {
            assertSize(size)
            if (size <= 0) {
              return createBuffer(size)
            }
            if (fill !== undefined) {
              // Only pay attention to encoding if it's a string. This
              // prevents accidentally sending in a number that would
              // be interpretted as a start offset.
              return typeof encoding === 'string'
                ? createBuffer(size).fill(fill, encoding)
                : createBuffer(size).fill(fill)
            }
            return createBuffer(size)
          }

          /**
           * Creates a new filled Buffer instance.
           * alloc(size[, fill[, encoding]])
           **/
          Buffer.alloc = function (size, fill, encoding) {
            return alloc(size, fill, encoding)
          }

          function allocUnsafe(size) {
            assertSize(size)
            return createBuffer(size < 0 ? 0 : checked(size) | 0)
          }

          /**
           * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
           * */
          Buffer.allocUnsafe = function (size) {
            return allocUnsafe(size)
          }
          /**
           * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
           */
          Buffer.allocUnsafeSlow = function (size) {
            return allocUnsafe(size)
          }

          function fromString(string, encoding) {
            if (typeof encoding !== 'string' || encoding === '') {
              encoding = 'utf8'
            }

            if (!Buffer.isEncoding(encoding)) {
              throw new TypeError('Unknown encoding: ' + encoding)
            }

            var length = byteLength(string, encoding) | 0
            var buf = createBuffer(length)

            var actual = buf.write(string, encoding)

            if (actual !== length) {
              // Writing a hex string, for example, that contains invalid characters will
              // cause everything after the first invalid character to be ignored. (e.g.
              // 'abxxcd' will be treated as 'ab')
              buf = buf.slice(0, actual)
            }

            return buf
          }

          function fromArrayLike(array) {
            var length = array.length < 0 ? 0 : checked(array.length) | 0
            var buf = createBuffer(length)
            for (var i = 0; i < length; i += 1) {
              buf[i] = array[i] & 255
            }
            return buf
          }

          function fromArrayBuffer(array, byteOffset, length) {
            if (byteOffset < 0 || array.byteLength < byteOffset) {
              throw new RangeError('"offset" is outside of buffer bounds')
            }

            if (array.byteLength < byteOffset + (length || 0)) {
              throw new RangeError('"length" is outside of buffer bounds')
            }

            var buf
            if (byteOffset === undefined && length === undefined) {
              buf = new Uint8Array(array)
            } else if (length === undefined) {
              buf = new Uint8Array(array, byteOffset)
            } else {
              buf = new Uint8Array(array, byteOffset, length)
            }

            // Return an augmented `Uint8Array` instance
            buf.__proto__ = Buffer.prototype
            return buf
          }

          function fromObject(obj) {
            if (Buffer.isBuffer(obj)) {
              var len = checked(obj.length) | 0
              var buf = createBuffer(len)

              if (buf.length === 0) {
                return buf
              }

              obj.copy(buf, 0, 0, len)
              return buf
            }

            if (obj.length !== undefined) {
              if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
                return createBuffer(0)
              }
              return fromArrayLike(obj)
            }

            if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
              return fromArrayLike(obj.data)
            }
          }

          function checked(length) {
            // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
            // length is NaN (which is otherwise coerced to zero.)
            if (length >= K_MAX_LENGTH) {
              throw new RangeError(
                'Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes',
              )
            }
            return length | 0
          }

          function SlowBuffer(length) {
            if (+length != length) {
              // eslint-disable-line eqeqeq
              length = 0
            }
            return Buffer.alloc(+length)
          }

          Buffer.isBuffer = function isBuffer(b) {
            return b != null && b._isBuffer === true && b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
          }

          Buffer.compare = function compare(a, b) {
            if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
            if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
            if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
              throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array')
            }

            if (a === b) return 0

            var x = a.length
            var y = b.length

            for (var i = 0, len = Math.min(x, y); i < len; ++i) {
              if (a[i] !== b[i]) {
                x = a[i]
                y = b[i]
                break
              }
            }

            if (x < y) return -1
            if (y < x) return 1
            return 0
          }

          Buffer.isEncoding = function isEncoding(encoding) {
            switch (String(encoding).toLowerCase()) {
              case 'hex':
              case 'utf8':
              case 'utf-8':
              case 'ascii':
              case 'latin1':
              case 'binary':
              case 'base64':
              case 'ucs2':
              case 'ucs-2':
              case 'utf16le':
              case 'utf-16le':
                return true
              default:
                return false
            }
          }

          Buffer.concat = function concat(list, length) {
            if (!Array.isArray(list)) {
              throw new TypeError('"list" argument must be an Array of Buffers')
            }

            if (list.length === 0) {
              return Buffer.alloc(0)
            }

            var i
            if (length === undefined) {
              length = 0
              for (i = 0; i < list.length; ++i) {
                length += list[i].length
              }
            }

            var buffer = Buffer.allocUnsafe(length)
            var pos = 0
            for (i = 0; i < list.length; ++i) {
              var buf = list[i]
              if (isInstance(buf, Uint8Array)) {
                buf = Buffer.from(buf)
              }
              if (!Buffer.isBuffer(buf)) {
                throw new TypeError('"list" argument must be an Array of Buffers')
              }
              buf.copy(buffer, pos)
              pos += buf.length
            }
            return buffer
          }

          function byteLength(string, encoding) {
            if (Buffer.isBuffer(string)) {
              return string.length
            }
            if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
              return string.byteLength
            }
            if (typeof string !== 'string') {
              throw new TypeError(
                'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
                  'Received type ' +
                  typeof string,
              )
            }

            var len = string.length
            var mustMatch = arguments.length > 2 && arguments[2] === true
            if (!mustMatch && len === 0) return 0

            // Use a for loop to avoid recursion
            var loweredCase = false
            for (;;) {
              switch (encoding) {
                case 'ascii':
                case 'latin1':
                case 'binary':
                  return len
                case 'utf8':
                case 'utf-8':
                  return utf8ToBytes(string).length
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return len * 2
                case 'hex':
                  return len >>> 1
                case 'base64':
                  return base64ToBytes(string).length
                default:
                  if (loweredCase) {
                    return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
                  }
                  encoding = ('' + encoding).toLowerCase()
                  loweredCase = true
              }
            }
          }
          Buffer.byteLength = byteLength

          function slowToString(encoding, start, end) {
            var loweredCase = false

            // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
            // property of a typed array.

            // This behaves neither like String nor Uint8Array in that we set start/end
            // to their upper/lower bounds if the value passed is out of range.
            // undefined is handled specially as per ECMA-262 6th Edition,
            // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
            if (start === undefined || start < 0) {
              start = 0
            }
            // Return early if start > this.length. Done here to prevent potential uint32
            // coercion fail below.
            if (start > this.length) {
              return ''
            }

            if (end === undefined || end > this.length) {
              end = this.length
            }

            if (end <= 0) {
              return ''
            }

            // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
            end >>>= 0
            start >>>= 0

            if (end <= start) {
              return ''
            }

            if (!encoding) encoding = 'utf8'

            while (true) {
              switch (encoding) {
                case 'hex':
                  return hexSlice(this, start, end)

                case 'utf8':
                case 'utf-8':
                  return utf8Slice(this, start, end)

                case 'ascii':
                  return asciiSlice(this, start, end)

                case 'latin1':
                case 'binary':
                  return latin1Slice(this, start, end)

                case 'base64':
                  return base64Slice(this, start, end)

                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return utf16leSlice(this, start, end)

                default:
                  if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                  encoding = (encoding + '').toLowerCase()
                  loweredCase = true
              }
            }
          }

          // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
          // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
          // reliably in a browserify context because there could be multiple different
          // copies of the 'buffer' package in use. This method works even for Buffer
          // instances that were created from another copy of the `buffer` package.
          // See: https://github.com/feross/buffer/issues/154
          Buffer.prototype._isBuffer = true

          function swap(b, n, m) {
            var i = b[n]
            b[n] = b[m]
            b[m] = i
          }

          Buffer.prototype.swap16 = function swap16() {
            var len = this.length
            if (len % 2 !== 0) {
              throw new RangeError('Buffer size must be a multiple of 16-bits')
            }
            for (var i = 0; i < len; i += 2) {
              swap(this, i, i + 1)
            }
            return this
          }

          Buffer.prototype.swap32 = function swap32() {
            var len = this.length
            if (len % 4 !== 0) {
              throw new RangeError('Buffer size must be a multiple of 32-bits')
            }
            for (var i = 0; i < len; i += 4) {
              swap(this, i, i + 3)
              swap(this, i + 1, i + 2)
            }
            return this
          }

          Buffer.prototype.swap64 = function swap64() {
            var len = this.length
            if (len % 8 !== 0) {
              throw new RangeError('Buffer size must be a multiple of 64-bits')
            }
            for (var i = 0; i < len; i += 8) {
              swap(this, i, i + 7)
              swap(this, i + 1, i + 6)
              swap(this, i + 2, i + 5)
              swap(this, i + 3, i + 4)
            }
            return this
          }

          Buffer.prototype.toString = function toString() {
            var length = this.length
            if (length === 0) return ''
            if (arguments.length === 0) return utf8Slice(this, 0, length)
            return slowToString.apply(this, arguments)
          }

          Buffer.prototype.toLocaleString = Buffer.prototype.toString

          Buffer.prototype.equals = function equals(b) {
            if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
            if (this === b) return true
            return Buffer.compare(this, b) === 0
          }

          Buffer.prototype.inspect = function inspect() {
            var str = ''
            var max = exports.INSPECT_MAX_BYTES
            str = this.toString('hex', 0, max)
              .replace(/(.{2})/g, '$1 ')
              .trim()
            if (this.length > max) str += ' ... '
            return '<Buffer ' + str + '>'
          }

          Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
            if (isInstance(target, Uint8Array)) {
              target = Buffer.from(target, target.offset, target.byteLength)
            }
            if (!Buffer.isBuffer(target)) {
              throw new TypeError(
                'The "target" argument must be one of type Buffer or Uint8Array. ' + 'Received type ' + typeof target,
              )
            }

            if (start === undefined) {
              start = 0
            }
            if (end === undefined) {
              end = target ? target.length : 0
            }
            if (thisStart === undefined) {
              thisStart = 0
            }
            if (thisEnd === undefined) {
              thisEnd = this.length
            }

            if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
              throw new RangeError('out of range index')
            }

            if (thisStart >= thisEnd && start >= end) {
              return 0
            }
            if (thisStart >= thisEnd) {
              return -1
            }
            if (start >= end) {
              return 1
            }

            start >>>= 0
            end >>>= 0
            thisStart >>>= 0
            thisEnd >>>= 0

            if (this === target) return 0

            var x = thisEnd - thisStart
            var y = end - start
            var len = Math.min(x, y)

            var thisCopy = this.slice(thisStart, thisEnd)
            var targetCopy = target.slice(start, end)

            for (var i = 0; i < len; ++i) {
              if (thisCopy[i] !== targetCopy[i]) {
                x = thisCopy[i]
                y = targetCopy[i]
                break
              }
            }

            if (x < y) return -1
            if (y < x) return 1
            return 0
          }

          // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
          // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
          //
          // Arguments:
          // - buffer - a Buffer to search
          // - val - a string, Buffer, or number
          // - byteOffset - an index into `buffer`; will be clamped to an int32
          // - encoding - an optional encoding, relevant is val is a string
          // - dir - true for indexOf, false for lastIndexOf
          function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
            // Empty buffer means no match
            if (buffer.length === 0) return -1

            // Normalize byteOffset
            if (typeof byteOffset === 'string') {
              encoding = byteOffset
              byteOffset = 0
            } else if (byteOffset > 0x7fffffff) {
              byteOffset = 0x7fffffff
            } else if (byteOffset < -0x80000000) {
              byteOffset = -0x80000000
            }
            byteOffset = +byteOffset // Coerce to Number.
            if (numberIsNaN(byteOffset)) {
              // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
              byteOffset = dir ? 0 : buffer.length - 1
            }

            // Normalize byteOffset: negative offsets start from the end of the buffer
            if (byteOffset < 0) byteOffset = buffer.length + byteOffset
            if (byteOffset >= buffer.length) {
              if (dir) return -1
              else byteOffset = buffer.length - 1
            } else if (byteOffset < 0) {
              if (dir) byteOffset = 0
              else return -1
            }

            // Normalize val
            if (typeof val === 'string') {
              val = Buffer.from(val, encoding)
            }

            // Finally, search either indexOf (if dir is true) or lastIndexOf
            if (Buffer.isBuffer(val)) {
              // Special case: looking for empty string/buffer always fails
              if (val.length === 0) {
                return -1
              }
              return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
            } else if (typeof val === 'number') {
              val = val & 0xff // Search for a byte value [0-255]
              if (typeof Uint8Array.prototype.indexOf === 'function') {
                if (dir) {
                  return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
                } else {
                  return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
                }
              }
              return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
            }

            throw new TypeError('val must be string, number or Buffer')
          }

          function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
            var indexSize = 1
            var arrLength = arr.length
            var valLength = val.length

            if (encoding !== undefined) {
              encoding = String(encoding).toLowerCase()
              if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
                if (arr.length < 2 || val.length < 2) {
                  return -1
                }
                indexSize = 2
                arrLength /= 2
                valLength /= 2
                byteOffset /= 2
              }
            }

            function read(buf, i) {
              if (indexSize === 1) {
                return buf[i]
              } else {
                return buf.readUInt16BE(i * indexSize)
              }
            }

            var i
            if (dir) {
              var foundIndex = -1
              for (i = byteOffset; i < arrLength; i++) {
                if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                  if (foundIndex === -1) foundIndex = i
                  if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
                } else {
                  if (foundIndex !== -1) i -= i - foundIndex
                  foundIndex = -1
                }
              }
            } else {
              if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
              for (i = byteOffset; i >= 0; i--) {
                var found = true
                for (var j = 0; j < valLength; j++) {
                  if (read(arr, i + j) !== read(val, j)) {
                    found = false
                    break
                  }
                }
                if (found) return i
              }
            }

            return -1
          }

          Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
            return this.indexOf(val, byteOffset, encoding) !== -1
          }

          Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
            return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
          }

          Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
            return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
          }

          function hexWrite(buf, string, offset, length) {
            offset = Number(offset) || 0
            var remaining = buf.length - offset
            if (!length) {
              length = remaining
            } else {
              length = Number(length)
              if (length > remaining) {
                length = remaining
              }
            }

            var strLen = string.length

            if (length > strLen / 2) {
              length = strLen / 2
            }
            for (var i = 0; i < length; ++i) {
              var parsed = parseInt(string.substr(i * 2, 2), 16)
              if (numberIsNaN(parsed)) return i
              buf[offset + i] = parsed
            }
            return i
          }

          function utf8Write(buf, string, offset, length) {
            return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
          }

          function asciiWrite(buf, string, offset, length) {
            return blitBuffer(asciiToBytes(string), buf, offset, length)
          }

          function latin1Write(buf, string, offset, length) {
            return asciiWrite(buf, string, offset, length)
          }

          function base64Write(buf, string, offset, length) {
            return blitBuffer(base64ToBytes(string), buf, offset, length)
          }

          function ucs2Write(buf, string, offset, length) {
            return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
          }

          Buffer.prototype.write = function write(string, offset, length, encoding) {
            // Buffer#write(string)
            if (offset === undefined) {
              encoding = 'utf8'
              length = this.length
              offset = 0
              // Buffer#write(string, encoding)
            } else if (length === undefined && typeof offset === 'string') {
              encoding = offset
              length = this.length
              offset = 0
              // Buffer#write(string, offset[, length][, encoding])
            } else if (isFinite(offset)) {
              offset = offset >>> 0
              if (isFinite(length)) {
                length = length >>> 0
                if (encoding === undefined) encoding = 'utf8'
              } else {
                encoding = length
                length = undefined
              }
            } else {
              throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported')
            }

            var remaining = this.length - offset
            if (length === undefined || length > remaining) length = remaining

            if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
              throw new RangeError('Attempt to write outside buffer bounds')
            }

            if (!encoding) encoding = 'utf8'

            var loweredCase = false
            for (;;) {
              switch (encoding) {
                case 'hex':
                  return hexWrite(this, string, offset, length)

                case 'utf8':
                case 'utf-8':
                  return utf8Write(this, string, offset, length)

                case 'ascii':
                  return asciiWrite(this, string, offset, length)

                case 'latin1':
                case 'binary':
                  return latin1Write(this, string, offset, length)

                case 'base64':
                  // Warning: maxLength not taken into account in base64Write
                  return base64Write(this, string, offset, length)

                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return ucs2Write(this, string, offset, length)

                default:
                  if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                  encoding = ('' + encoding).toLowerCase()
                  loweredCase = true
              }
            }
          }

          Buffer.prototype.toJSON = function toJSON() {
            return {
              type: 'Buffer',
              data: Array.prototype.slice.call(this._arr || this, 0),
            }
          }

          function base64Slice(buf, start, end) {
            if (start === 0 && end === buf.length) {
              return base64.fromByteArray(buf)
            } else {
              return base64.fromByteArray(buf.slice(start, end))
            }
          }

          function utf8Slice(buf, start, end) {
            end = Math.min(buf.length, end)
            var res = []

            var i = start
            while (i < end) {
              var firstByte = buf[i]
              var codePoint = null
              var bytesPerSequence = firstByte > 0xef ? 4 : firstByte > 0xdf ? 3 : firstByte > 0xbf ? 2 : 1

              if (i + bytesPerSequence <= end) {
                var secondByte, thirdByte, fourthByte, tempCodePoint

                switch (bytesPerSequence) {
                  case 1:
                    if (firstByte < 0x80) {
                      codePoint = firstByte
                    }
                    break
                  case 2:
                    secondByte = buf[i + 1]
                    if ((secondByte & 0xc0) === 0x80) {
                      tempCodePoint = ((firstByte & 0x1f) << 0x6) | (secondByte & 0x3f)
                      if (tempCodePoint > 0x7f) {
                        codePoint = tempCodePoint
                      }
                    }
                    break
                  case 3:
                    secondByte = buf[i + 1]
                    thirdByte = buf[i + 2]
                    if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80) {
                      tempCodePoint = ((firstByte & 0xf) << 0xc) | ((secondByte & 0x3f) << 0x6) | (thirdByte & 0x3f)
                      if (tempCodePoint > 0x7ff && (tempCodePoint < 0xd800 || tempCodePoint > 0xdfff)) {
                        codePoint = tempCodePoint
                      }
                    }
                    break
                  case 4:
                    secondByte = buf[i + 1]
                    thirdByte = buf[i + 2]
                    fourthByte = buf[i + 3]
                    if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80 && (fourthByte & 0xc0) === 0x80) {
                      tempCodePoint =
                        ((firstByte & 0xf) << 0x12) |
                        ((secondByte & 0x3f) << 0xc) |
                        ((thirdByte & 0x3f) << 0x6) |
                        (fourthByte & 0x3f)
                      if (tempCodePoint > 0xffff && tempCodePoint < 0x110000) {
                        codePoint = tempCodePoint
                      }
                    }
                }
              }

              if (codePoint === null) {
                // we did not generate a valid codePoint so insert a
                // replacement char (U+FFFD) and advance only 1 byte
                codePoint = 0xfffd
                bytesPerSequence = 1
              } else if (codePoint > 0xffff) {
                // encode to utf16 (surrogate pair dance)
                codePoint -= 0x10000
                res.push(((codePoint >>> 10) & 0x3ff) | 0xd800)
                codePoint = 0xdc00 | (codePoint & 0x3ff)
              }

              res.push(codePoint)
              i += bytesPerSequence
            }

            return decodeCodePointsArray(res)
          }

          // Based on http://stackoverflow.com/a/22747272/680742, the browser with
          // the lowest limit is Chrome, with 0x10000 args.
          // We go 1 magnitude less, for safety
          var MAX_ARGUMENTS_LENGTH = 0x1000

          function decodeCodePointsArray(codePoints) {
            var len = codePoints.length
            if (len <= MAX_ARGUMENTS_LENGTH) {
              return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
            }

            // Decode in chunks to avoid "call stack size exceeded".
            var res = ''
            var i = 0
            while (i < len) {
              res += String.fromCharCode.apply(String, codePoints.slice(i, (i += MAX_ARGUMENTS_LENGTH)))
            }
            return res
          }

          function asciiSlice(buf, start, end) {
            var ret = ''
            end = Math.min(buf.length, end)

            for (var i = start; i < end; ++i) {
              ret += String.fromCharCode(buf[i] & 0x7f)
            }
            return ret
          }

          function latin1Slice(buf, start, end) {
            var ret = ''
            end = Math.min(buf.length, end)

            for (var i = start; i < end; ++i) {
              ret += String.fromCharCode(buf[i])
            }
            return ret
          }

          function hexSlice(buf, start, end) {
            var len = buf.length

            if (!start || start < 0) start = 0
            if (!end || end < 0 || end > len) end = len

            var out = ''
            for (var i = start; i < end; ++i) {
              out += toHex(buf[i])
            }
            return out
          }

          function utf16leSlice(buf, start, end) {
            var bytes = buf.slice(start, end)
            var res = ''
            for (var i = 0; i < bytes.length; i += 2) {
              res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
            }
            return res
          }

          Buffer.prototype.slice = function slice(start, end) {
            var len = this.length
            start = ~~start
            end = end === undefined ? len : ~~end

            if (start < 0) {
              start += len
              if (start < 0) start = 0
            } else if (start > len) {
              start = len
            }

            if (end < 0) {
              end += len
              if (end < 0) end = 0
            } else if (end > len) {
              end = len
            }

            if (end < start) end = start

            var newBuf = this.subarray(start, end)
            // Return an augmented `Uint8Array` instance
            newBuf.__proto__ = Buffer.prototype
            return newBuf
          }

          /*
           * Need to make sure that buffer isn't trying to write out of bounds.
           */
          function checkOffset(offset, ext, length) {
            if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint')
            if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
          }

          Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) checkOffset(offset, byteLength, this.length)

            var val = this[offset]
            var mul = 1
            var i = 0
            while (++i < byteLength && (mul *= 0x100)) {
              val += this[offset + i] * mul
            }

            return val
          }

          Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) {
              checkOffset(offset, byteLength, this.length)
            }

            var val = this[offset + --byteLength]
            var mul = 1
            while (byteLength > 0 && (mul *= 0x100)) {
              val += this[offset + --byteLength] * mul
            }

            return val
          }

          Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 1, this.length)
            return this[offset]
          }

          Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            return this[offset] | (this[offset + 1] << 8)
          }

          Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            return (this[offset] << 8) | this[offset + 1]
          }

          Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return (this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16)) + this[offset + 3] * 0x1000000
          }

          Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return this[offset] * 0x1000000 + ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3])
          }

          Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) checkOffset(offset, byteLength, this.length)

            var val = this[offset]
            var mul = 1
            var i = 0
            while (++i < byteLength && (mul *= 0x100)) {
              val += this[offset + i] * mul
            }
            mul *= 0x80

            if (val >= mul) val -= Math.pow(2, 8 * byteLength)

            return val
          }

          Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) checkOffset(offset, byteLength, this.length)

            var i = byteLength
            var mul = 1
            var val = this[offset + --i]
            while (i > 0 && (mul *= 0x100)) {
              val += this[offset + --i] * mul
            }
            mul *= 0x80

            if (val >= mul) val -= Math.pow(2, 8 * byteLength)

            return val
          }

          Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 1, this.length)
            if (!(this[offset] & 0x80)) return this[offset]
            return (0xff - this[offset] + 1) * -1
          }

          Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            var val = this[offset] | (this[offset + 1] << 8)
            return val & 0x8000 ? val | 0xffff0000 : val
          }

          Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            var val = this[offset + 1] | (this[offset] << 8)
            return val & 0x8000 ? val | 0xffff0000 : val
          }

          Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16) | (this[offset + 3] << 24)
          }

          Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return (this[offset] << 24) | (this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]
          }

          Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)
            return ieee754.read(this, offset, true, 23, 4)
          }

          Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)
            return ieee754.read(this, offset, false, 23, 4)
          }

          Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 8, this.length)
            return ieee754.read(this, offset, true, 52, 8)
          }

          Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 8, this.length)
            return ieee754.read(this, offset, false, 52, 8)
          }

          function checkInt(buf, value, offset, ext, max, min) {
            if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
            if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
            if (offset + ext > buf.length) throw new RangeError('Index out of range')
          }

          Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) {
              var maxBytes = Math.pow(2, 8 * byteLength) - 1
              checkInt(this, value, offset, byteLength, maxBytes, 0)
            }

            var mul = 1
            var i = 0
            this[offset] = value & 0xff
            while (++i < byteLength && (mul *= 0x100)) {
              this[offset + i] = (value / mul) & 0xff
            }

            return offset + byteLength
          }

          Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) {
              var maxBytes = Math.pow(2, 8 * byteLength) - 1
              checkInt(this, value, offset, byteLength, maxBytes, 0)
            }

            var i = byteLength - 1
            var mul = 1
            this[offset + i] = value & 0xff
            while (--i >= 0 && (mul *= 0x100)) {
              this[offset + i] = (value / mul) & 0xff
            }

            return offset + byteLength
          }

          Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
            this[offset] = value & 0xff
            return offset + 1
          }

          Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
            this[offset] = value & 0xff
            this[offset + 1] = value >>> 8
            return offset + 2
          }

          Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
            this[offset] = value >>> 8
            this[offset + 1] = value & 0xff
            return offset + 2
          }

          Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
            this[offset + 3] = value >>> 24
            this[offset + 2] = value >>> 16
            this[offset + 1] = value >>> 8
            this[offset] = value & 0xff
            return offset + 4
          }

          Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
            this[offset] = value >>> 24
            this[offset + 1] = value >>> 16
            this[offset + 2] = value >>> 8
            this[offset + 3] = value & 0xff
            return offset + 4
          }

          Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
              var limit = Math.pow(2, 8 * byteLength - 1)

              checkInt(this, value, offset, byteLength, limit - 1, -limit)
            }

            var i = 0
            var mul = 1
            var sub = 0
            this[offset] = value & 0xff
            while (++i < byteLength && (mul *= 0x100)) {
              if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                sub = 1
              }
              this[offset + i] = (((value / mul) >> 0) - sub) & 0xff
            }

            return offset + byteLength
          }

          Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
              var limit = Math.pow(2, 8 * byteLength - 1)

              checkInt(this, value, offset, byteLength, limit - 1, -limit)
            }

            var i = byteLength - 1
            var mul = 1
            var sub = 0
            this[offset + i] = value & 0xff
            while (--i >= 0 && (mul *= 0x100)) {
              if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                sub = 1
              }
              this[offset + i] = (((value / mul) >> 0) - sub) & 0xff
            }

            return offset + byteLength
          }

          Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
            if (value < 0) value = 0xff + value + 1
            this[offset] = value & 0xff
            return offset + 1
          }

          Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
            this[offset] = value & 0xff
            this[offset + 1] = value >>> 8
            return offset + 2
          }

          Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
            this[offset] = value >>> 8
            this[offset + 1] = value & 0xff
            return offset + 2
          }

          Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
            this[offset] = value & 0xff
            this[offset + 1] = value >>> 8
            this[offset + 2] = value >>> 16
            this[offset + 3] = value >>> 24
            return offset + 4
          }

          Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
            if (value < 0) value = 0xffffffff + value + 1
            this[offset] = value >>> 24
            this[offset + 1] = value >>> 16
            this[offset + 2] = value >>> 8
            this[offset + 3] = value & 0xff
            return offset + 4
          }

          function checkIEEE754(buf, value, offset, ext, max, min) {
            if (offset + ext > buf.length) throw new RangeError('Index out of range')
            if (offset < 0) throw new RangeError('Index out of range')
          }

          function writeFloat(buf, value, offset, littleEndian, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
              checkIEEE754(buf, value, offset, 4, 3.4028234663852886e38, -3.4028234663852886e38)
            }
            ieee754.write(buf, value, offset, littleEndian, 23, 4)
            return offset + 4
          }

          Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
            return writeFloat(this, value, offset, true, noAssert)
          }

          Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
            return writeFloat(this, value, offset, false, noAssert)
          }

          function writeDouble(buf, value, offset, littleEndian, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
              checkIEEE754(buf, value, offset, 8, 1.7976931348623157e308, -1.7976931348623157e308)
            }
            ieee754.write(buf, value, offset, littleEndian, 52, 8)
            return offset + 8
          }

          Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
            return writeDouble(this, value, offset, true, noAssert)
          }

          Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
            return writeDouble(this, value, offset, false, noAssert)
          }

          // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
          Buffer.prototype.copy = function copy(target, targetStart, start, end) {
            if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
            if (!start) start = 0
            if (!end && end !== 0) end = this.length
            if (targetStart >= target.length) targetStart = target.length
            if (!targetStart) targetStart = 0
            if (end > 0 && end < start) end = start

            // Copy 0 bytes; we're done
            if (end === start) return 0
            if (target.length === 0 || this.length === 0) return 0

            // Fatal error conditions
            if (targetStart < 0) {
              throw new RangeError('targetStart out of bounds')
            }
            if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
            if (end < 0) throw new RangeError('sourceEnd out of bounds')

            // Are we oob?
            if (end > this.length) end = this.length
            if (target.length - targetStart < end - start) {
              end = target.length - targetStart + start
            }

            var len = end - start

            if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
              // Use built-in when available, missing from IE11
              this.copyWithin(targetStart, start, end)
            } else if (this === target && start < targetStart && targetStart < end) {
              // descending copy from end
              for (var i = len - 1; i >= 0; --i) {
                target[i + targetStart] = this[i + start]
              }
            } else {
              Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart)
            }

            return len
          }

          // Usage:
          //    buffer.fill(number[, offset[, end]])
          //    buffer.fill(buffer[, offset[, end]])
          //    buffer.fill(string[, offset[, end]][, encoding])
          Buffer.prototype.fill = function fill(val, start, end, encoding) {
            // Handle string cases:
            if (typeof val === 'string') {
              if (typeof start === 'string') {
                encoding = start
                start = 0
                end = this.length
              } else if (typeof end === 'string') {
                encoding = end
                end = this.length
              }
              if (encoding !== undefined && typeof encoding !== 'string') {
                throw new TypeError('encoding must be a string')
              }
              if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
                throw new TypeError('Unknown encoding: ' + encoding)
              }
              if (val.length === 1) {
                var code = val.charCodeAt(0)
                if ((encoding === 'utf8' && code < 128) || encoding === 'latin1') {
                  // Fast path: If `val` fits into a single byte, use that numeric value.
                  val = code
                }
              }
            } else if (typeof val === 'number') {
              val = val & 255
            }

            // Invalid ranges are not set to a default, so can range check early.
            if (start < 0 || this.length < start || this.length < end) {
              throw new RangeError('Out of range index')
            }

            if (end <= start) {
              return this
            }

            start = start >>> 0
            end = end === undefined ? this.length : end >>> 0

            if (!val) val = 0

            var i
            if (typeof val === 'number') {
              for (i = start; i < end; ++i) {
                this[i] = val
              }
            } else {
              var bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding)
              var len = bytes.length
              if (len === 0) {
                throw new TypeError('The value "' + val + '" is invalid for argument "value"')
              }
              for (i = 0; i < end - start; ++i) {
                this[i + start] = bytes[i % len]
              }
            }

            return this
          }

          // HELPER FUNCTIONS
          // ================

          var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

          function base64clean(str) {
            // Node takes equal signs as end of the Base64 encoding
            str = str.split('=')[0]
            // Node strips out invalid characters like \n and \t from the string, base64-js does not
            str = str.trim().replace(INVALID_BASE64_RE, '')
            // Node converts strings with length < 2 to ''
            if (str.length < 2) return ''
            // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
            while (str.length % 4 !== 0) {
              str = str + '='
            }
            return str
          }

          function toHex(n) {
            if (n < 16) return '0' + n.toString(16)
            return n.toString(16)
          }

          function utf8ToBytes(string, units) {
            units = units || Infinity
            var codePoint
            var length = string.length
            var leadSurrogate = null
            var bytes = []

            for (var i = 0; i < length; ++i) {
              codePoint = string.charCodeAt(i)

              // is surrogate component
              if (codePoint > 0xd7ff && codePoint < 0xe000) {
                // last char was a lead
                if (!leadSurrogate) {
                  // no lead yet
                  if (codePoint > 0xdbff) {
                    // unexpected trail
                    if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd)
                    continue
                  } else if (i + 1 === length) {
                    // unpaired lead
                    if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd)
                    continue
                  }

                  // valid lead
                  leadSurrogate = codePoint

                  continue
                }

                // 2 leads in a row
                if (codePoint < 0xdc00) {
                  if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd)
                  leadSurrogate = codePoint
                  continue
                }

                // valid surrogate pair
                codePoint = (((leadSurrogate - 0xd800) << 10) | (codePoint - 0xdc00)) + 0x10000
              } else if (leadSurrogate) {
                // valid bmp char, but last char was a lead
                if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd)
              }

              leadSurrogate = null

              // encode utf8
              if (codePoint < 0x80) {
                if ((units -= 1) < 0) break
                bytes.push(codePoint)
              } else if (codePoint < 0x800) {
                if ((units -= 2) < 0) break
                bytes.push((codePoint >> 0x6) | 0xc0, (codePoint & 0x3f) | 0x80)
              } else if (codePoint < 0x10000) {
                if ((units -= 3) < 0) break
                bytes.push((codePoint >> 0xc) | 0xe0, ((codePoint >> 0x6) & 0x3f) | 0x80, (codePoint & 0x3f) | 0x80)
              } else if (codePoint < 0x110000) {
                if ((units -= 4) < 0) break
                bytes.push(
                  (codePoint >> 0x12) | 0xf0,
                  ((codePoint >> 0xc) & 0x3f) | 0x80,
                  ((codePoint >> 0x6) & 0x3f) | 0x80,
                  (codePoint & 0x3f) | 0x80,
                )
              } else {
                throw new Error('Invalid code point')
              }
            }

            return bytes
          }

          function asciiToBytes(str) {
            var byteArray = []
            for (var i = 0; i < str.length; ++i) {
              // Node's code seems to be doing this and not & 0x7F..
              byteArray.push(str.charCodeAt(i) & 0xff)
            }
            return byteArray
          }

          function utf16leToBytes(str, units) {
            var c, hi, lo
            var byteArray = []
            for (var i = 0; i < str.length; ++i) {
              if ((units -= 2) < 0) break

              c = str.charCodeAt(i)
              hi = c >> 8
              lo = c % 256
              byteArray.push(lo)
              byteArray.push(hi)
            }

            return byteArray
          }

          function base64ToBytes(str) {
            return base64.toByteArray(base64clean(str))
          }

          function blitBuffer(src, dst, offset, length) {
            for (var i = 0; i < length; ++i) {
              if (i + offset >= dst.length || i >= src.length) break
              dst[i + offset] = src[i]
            }
            return i
          }

          // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
          // the `instanceof` check but they should be treated as of that type.
          // See: https://github.com/feross/buffer/issues/166
          function isInstance(obj, type) {
            return (
              obj instanceof type ||
              (obj != null &&
                obj.constructor != null &&
                obj.constructor.name != null &&
                obj.constructor.name === type.name)
            )
          }
          function numberIsNaN(obj) {
            // For IE11 support
            return obj !== obj // eslint-disable-line no-self-compare
          }
        }.call(this, require('buffer').Buffer))
      },
      { 'base64-js': 2, buffer: 3, ieee754: 8 },
    ],
    4: [
      function (require, module, exports) {
        ;(function (Buffer) {
          'use strict'

          /**
           * Module exports.
           */

          module.exports = dataUriToBuffer

          /**
           * Returns a `Buffer` instance from the given data URI `uri`.
           *
           * @param {String} uri Data URI to turn into a Buffer instance
           * @return {Buffer} Buffer instance from Data URI
           * @api public
           */

          function dataUriToBuffer(uri) {
            if (!/^data\:/i.test(uri)) {
              throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")')
            }

            // strip newlines
            uri = uri.replace(/\r?\n/g, '')

            // split the URI up into the "metadata" and the "data" portions
            var firstComma = uri.indexOf(',')
            if (-1 === firstComma || firstComma <= 4) {
              throw new TypeError('malformed data: URI')
            }

            // remove the "data:" scheme and parse the metadata
            var meta = uri.substring(5, firstComma).split(';')

            var type = meta[0] || 'text/plain'
            var typeFull = type
            var base64 = false
            var charset = ''
            for (var i = 1; i < meta.length; i++) {
              if ('base64' == meta[i]) {
                base64 = true
              } else {
                typeFull += ';' + meta[i]
                if (0 == meta[i].indexOf('charset=')) {
                  charset = meta[i].substring(8)
                }
              }
            }
            // defaults to US-ASCII only if type is not provided
            if (!meta[0] && !charset.length) {
              typeFull += ';charset=US-ASCII'
              charset = 'US-ASCII'
            }

            // get the encoded data portion and decode URI-encoded chars
            var data = unescape(uri.substring(firstComma + 1))

            var encoding = base64 ? 'base64' : 'ascii'
            var buffer = Buffer.from ? Buffer.from(data, encoding) : new Buffer(data, encoding)

            // set `.type` and `.typeFull` properties to MIME type
            buffer.type = type
            buffer.typeFull = typeFull

            // set the `.charset` property
            buffer.charset = charset

            return buffer
          }
        }.call(this, require('buffer').Buffer))
      },
      { buffer: 3 },
    ],
    5: [
      function (require, module, exports) {
        'use strict'

        /*  ------------------------------------------------------------------------ */

        const { assign } = Object,
          isBrowser = typeof window !== 'undefined' && window.window === window && window.navigator,
          SourceMapConsumer = require('source-map').SourceMapConsumer,
          SyncPromise = require('./impl/SyncPromise'),
          path = require('./impl/path'),
          dataURIToBuffer = require('data-uri-to-buffer'),
          nodeRequire = isBrowser ? null : module.require

        /*  ------------------------------------------------------------------------ */

        const memoize = (f) => {
          const m = (x) => (x in m.cache ? m.cache[x] : (m.cache[x] = f(x)))
          m.forgetEverything = () => {
            m.cache = Object.create(null)
          }
          m.cache = Object.create(null)

          return m
        }

        function impl(fetchFile, sync) {
          const PromiseImpl = sync ? SyncPromise : Promise
          const SourceFileMemoized = memoize((path) => SourceFile(path, fetchFile(path)))

          function SourceFile(srcPath, text) {
            if (text === undefined) return SourceFileMemoized(path.resolve(srcPath))

            return PromiseImpl.resolve(text).then((text) => {
              let file
              let lines
              let resolver
              let _resolve = (loc) => (resolver = resolver || SourceMapResolverFromFetchedFile(file))(loc)

              return (file = {
                path: srcPath,
                text,
                get lines() {
                  return (lines = lines || text.split('\n'))
                },
                resolve(loc) {
                  const result = _resolve(loc)
                  if (sync) {
                    try {
                      return SyncPromise.valueFrom(result)
                    } catch (e) {
                      return assign({}, loc, { error: e })
                    }
                  } else {
                    return Promise.resolve(result)
                  }
                },
                _resolve,
              })
            })
          }

          function SourceMapResolverFromFetchedFile(file) {
            /*  Extract the last sourceMap occurence (TODO: support multiple sourcemaps)   */

            const re = /\u0023 sourceMappingURL=(.+)\n?/g
            let lastMatch = undefined

            while (true) {
              const match = re.exec(file.text)
              if (match) lastMatch = match
              else break
            }

            const url = lastMatch && lastMatch[1]

            const defaultResolver = (loc) =>
              assign({}, loc, {
                sourceFile: file,
                sourceLine: file.lines[loc.line - 1] || '',
              })

            return url ? SourceMapResolver(file.path, url, defaultResolver) : defaultResolver
          }

          function SourceMapResolver(originalFilePath, sourceMapPath, fallbackResolve) {
            const srcFile = sourceMapPath.startsWith('data:')
              ? SourceFile(originalFilePath, dataURIToBuffer(sourceMapPath).toString())
              : SourceFile(path.relativeToFile(originalFilePath, sourceMapPath))

            const parsedMap = srcFile.then((f) => SourceMapConsumer(JSON.parse(f.text)))

            const sourceFor = memoize(function sourceFor(filePath) {
              return srcFile.then((f) => {
                const fullPath = path.relativeToFile(f.path, filePath)
                return parsedMap.then((x) =>
                  SourceFile(fullPath, x.sourceContentFor(filePath, true /* return null on missing */) || undefined),
                )
              })
            })

            return (loc) =>
              parsedMap
                .then((x) => {
                  const originalLoc = x.originalPositionFor(loc)
                  return originalLoc.source
                    ? sourceFor(originalLoc.source).then((x) =>
                        x._resolve(
                          assign({}, loc, {
                            line: originalLoc.line,
                            column: originalLoc.column + 1,
                            name: originalLoc.name,
                          }),
                        ),
                      )
                    : fallbackResolve(loc)
                })
                .catch((e) => assign(fallbackResolve(loc), { sourceMapError: e }))
          }

          return assign(
            function getSource(path) {
              const file = SourceFile(path)
              if (sync) {
                try {
                  return SyncPromise.valueFrom(file)
                } catch (e) {
                  const noFile = {
                    path,
                    text: '',
                    lines: [],
                    error: e,
                    resolve(loc) {
                      return assign({}, loc, { error: e, sourceLine: '', sourceFile: noFile })
                    },
                  }
                  return noFile
                }
              }
              return file
            },
            {
              resetCache: () => SourceFileMemoized.forgetEverything(),
              getCache: () => SourceFileMemoized.cache,
            },
          )
        }

        /*  ------------------------------------------------------------------------ */

        module.exports = impl(function fetchFileSync(path) {
          return new SyncPromise((resolve) => {
            if (isBrowser) {
              let xhr = new XMLHttpRequest()
              xhr.open('GET', path, false /* SYNCHRONOUS XHR FTW :) */)
              xhr.send(null)
              resolve(xhr.responseText)
            } else {
              resolve(nodeRequire('fs').readFileSync(path, { encoding: 'utf8' }))
            }
          })
        }, true)

        /*  ------------------------------------------------------------------------ */

        module.exports.async = impl(function fetchFileAsync(path) {
          return new Promise((resolve, reject) => {
            if (isBrowser) {
              let xhr = new XMLHttpRequest()
              xhr.open('GET', path)
              xhr.onreadystatechange = (event) => {
                if (xhr.readyState === 4) {
                  if (xhr.status === 200) {
                    resolve(xhr.responseText)
                  } else {
                    reject(new Error(xhr.statusText))
                  }
                }
              }
              xhr.send(null)
            } else {
              nodeRequire('fs').readFile(path, { encoding: 'utf8' }, (e, x) => {
                e ? reject(e) : resolve(x)
              })
            }
          })
        })

        /*  ------------------------------------------------------------------------ */
      },
      { './impl/SyncPromise': 6, './impl/path': 7, 'data-uri-to-buffer': 4, 'source-map': 21 },
    ],
    6: [
      function (require, module, exports) {
        'use strict'

        /*  ------------------------------------------------------------------------ */

        module.exports = class SyncPromise {
          constructor(fn) {
            try {
              fn(
                (x) => {
                  this.setValue(x, false)
                }, // resolve
                (x) => {
                  this.setValue(x, true)
                }, // reject
              )
            } catch (e) {
              this.setValue(e, true)
            }
          }

          setValue(x, rejected) {
            this.val = x instanceof SyncPromise ? x.val : x
            this.rejected = rejected || (x instanceof SyncPromise ? x.rejected : false)
          }

          static valueFrom(x) {
            if (x instanceof SyncPromise) {
              if (x.rejected) throw x.val
              else return x.val
            } else {
              return x
            }
          }

          then(fn) {
            try {
              if (!this.rejected) return SyncPromise.resolve(fn(this.val))
            } catch (e) {
              return SyncPromise.reject(e)
            }
            return this
          }

          catch(fn) {
            try {
              if (this.rejected) return SyncPromise.resolve(fn(this.val))
            } catch (e) {
              return SyncPromise.reject(e)
            }
            return this
          }

          static resolve(x) {
            return new SyncPromise((resolve) => {
              resolve(x)
            })
          }

          static reject(x) {
            return new SyncPromise((_, reject) => {
              reject(x)
            })
          }
        }
      },
      {},
    ],
    7: [
      function (require, module, exports) {
        ;(function (process) {
          'use strict'

          /*  ------------------------------------------------------------------------ */

          const isBrowser = typeof window !== 'undefined' && window.window === window && window.navigator
          const cwd = isBrowser ? window.location.href : process.cwd()

          const urlRegexp = new RegExp(
            '^((https|http)://)?[a-z0-9A-Z]{3}.[a-z0-9A-Z][a-z0-9A-Z]{0,61}?[a-z0-9A-Z].com|net|cn|cc (:s[0-9]{1-4})?/$',
          )

          /*  ------------------------------------------------------------------------ */

          const path = (module.exports = {
            concat(a, b) {
              const a_endsWithSlash = a[a.length - 1] === '/',
                b_startsWithSlash = b[0] === '/'

              return (
                a +
                (a_endsWithSlash || b_startsWithSlash ? '' : '/') +
                (a_endsWithSlash && b_startsWithSlash ? b.substring(1) : b)
              )
            },

            resolve(x) {
              if (path.isAbsolute(x)) {
                return path.normalize(x)
              }

              return path.normalize(path.concat(cwd, x))
            },

            normalize(x) {
              let output = [],
                skip = 0

              x.split('/')
                .reverse()
                .filter((x) => x !== '.')
                .forEach((x) => {
                  if (x === '..') {
                    skip++
                  } else if (skip === 0) {
                    output.push(x)
                  } else {
                    skip--
                  }
                })

              const result = output.reverse().join('/')

              return (
                (isBrowser && result[0] === '/'
                  ? result[1] === '/'
                    ? window.location.protocol
                    : window.location.origin
                  : '') + result
              )
            },

            isData: (x) => x.indexOf('data:') === 0,

            isURL: (x) => urlRegexp.test(x),

            isAbsolute: (x) => x[0] === '/' || /^[^\/]*:/.test(x),

            relativeToFile(a, b) {
              return path.isData(a) || path.isAbsolute(b)
                ? path.normalize(b)
                : path.normalize(path.concat(a.split('/').slice(0, -1).join('/'), b))
            },
          })

          /*  ------------------------------------------------------------------------ */
        }.call(this, require('_process')))
      },
      { _process: 10 },
    ],
    8: [
      function (require, module, exports) {
        exports.read = function (buffer, offset, isLE, mLen, nBytes) {
          var e, m
          var eLen = nBytes * 8 - mLen - 1
          var eMax = (1 << eLen) - 1
          var eBias = eMax >> 1
          var nBits = -7
          var i = isLE ? nBytes - 1 : 0
          var d = isLE ? -1 : 1
          var s = buffer[offset + i]

          i += d

          e = s & ((1 << -nBits) - 1)
          s >>= -nBits
          nBits += eLen
          for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

          m = e & ((1 << -nBits) - 1)
          e >>= -nBits
          nBits += mLen
          for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

          if (e === 0) {
            e = 1 - eBias
          } else if (e === eMax) {
            return m ? NaN : (s ? -1 : 1) * Infinity
          } else {
            m = m + Math.pow(2, mLen)
            e = e - eBias
          }
          return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
        }

        exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
          var e, m, c
          var eLen = nBytes * 8 - mLen - 1
          var eMax = (1 << eLen) - 1
          var eBias = eMax >> 1
          var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0
          var i = isLE ? 0 : nBytes - 1
          var d = isLE ? 1 : -1
          var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

          value = Math.abs(value)

          if (isNaN(value) || value === Infinity) {
            m = isNaN(value) ? 1 : 0
            e = eMax
          } else {
            e = Math.floor(Math.log(value) / Math.LN2)
            if (value * (c = Math.pow(2, -e)) < 1) {
              e--
              c *= 2
            }
            if (e + eBias >= 1) {
              value += rt / c
            } else {
              value += rt * Math.pow(2, 1 - eBias)
            }
            if (value * c >= 2) {
              e++
              c /= 2
            }

            if (e + eBias >= eMax) {
              m = 0
              e = eMax
            } else if (e + eBias >= 1) {
              m = (value * c - 1) * Math.pow(2, mLen)
              e = e + eBias
            } else {
              m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
              e = 0
            }
          }

          for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

          e = (e << mLen) | m
          eLen += mLen
          for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

          buffer[offset + i - d] |= s * 128
        }
      },
      {},
    ],
    9: [
      function (require, module, exports) {
        'use strict'

        var _slicedToArray = (function () {
          function sliceIterator(arr, i) {
            var _arr = []
            var _n = true
            var _d = false
            var _e = undefined
            try {
              for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                _arr.push(_s.value)
                if (i && _arr.length === i) break
              }
            } catch (err) {
              _d = true
              _e = err
            } finally {
              try {
                if (!_n && _i['return']) _i['return']()
              } finally {
                if (_d) throw _e
              }
            }
            return _arr
          }
          return function (arr, i) {
            if (Array.isArray(arr)) {
              return arr
            } else if (Symbol.iterator in Object(arr)) {
              return sliceIterator(arr, i)
            } else {
              throw new TypeError('Invalid attempt to destructure non-iterable instance')
            }
          }
        })()

        const ansiEscapeCode = '[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]',
          zeroWidthCharacterExceptNewline =
            '\u0000-\u0008\u000B-\u0019\u001b\u009b\u00ad\u200b\u2028\u2029\ufeff\ufe00-\ufe0f',
          zeroWidthCharacter = '\n' + zeroWidthCharacterExceptNewline,
          zeroWidthCharactersExceptNewline = new RegExp(
            '(?:' + ansiEscapeCode + ')|[' + zeroWidthCharacterExceptNewline + ']',
            'g',
          ),
          zeroWidthCharacters = new RegExp('(?:' + ansiEscapeCode + ')|[' + zeroWidthCharacter + ']', 'g'),
          partition = new RegExp(
            '((?:' + ansiEscapeCode + ')|[\t' + zeroWidthCharacter + '])?([^\t' + zeroWidthCharacter + ']*)',
            'g',
          )

        module.exports = {
          zeroWidthCharacters,

          ansiEscapeCodes: new RegExp(ansiEscapeCode, 'g'),

          strlen: (s) => Array.from(s.replace(zeroWidthCharacters, '')).length, // Array.from solves the emoji problem as described here: http://blog.jonnew.com/posts/poo-dot-length-equals-two

          isBlank: (s) => s.replace(zeroWidthCharacters, '').replace(/\s/g, '').length === 0,

          blank: (s) =>
            Array.from(s.replace(zeroWidthCharactersExceptNewline, '')) // Array.from solves the emoji problem as described here: http://blog.jonnew.com/posts/poo-dot-length-equals-two
              .map((x) => (x === '\t' || x === '\n' ? x : ' '))
              .join(''),

          partition(s) {
            for (var m, spans = []; partition.lastIndex !== s.length && (m = partition.exec(s)); ) {
              spans.push([m[1] || '', m[2]])
            }
            partition.lastIndex = 0 // reset
            return spans
          },

          first(s, n) {
            let result = '',
              length = 0

            for (const _ref of module.exports.partition(s)) {
              var _ref2 = _slicedToArray(_ref, 2)

              const nonPrintable = _ref2[0]
              const printable = _ref2[1]

              const text = Array.from(printable).slice(0, n - length) // Array.from solves the emoji problem as described here: http://blog.jonnew.com/posts/poo-dot-length-equals-two
              result += nonPrintable + text.join('')
              length += text.length
            }

            return result
          },
        }
      },
      {},
    ],
    10: [
      function (require, module, exports) {
        // shim for using process in browser
        var process = (module.exports = {})

        // cached from whatever global is present so that test runners that stub it
        // don't break things.  But we need to wrap it in a try catch in case it is
        // wrapped in strict mode code which doesn't define any globals.  It's inside a
        // function because try/catches deoptimize in certain engines.

        var cachedSetTimeout
        var cachedClearTimeout

        function defaultSetTimout() {
          throw new Error('setTimeout has not been defined')
        }
        function defaultClearTimeout() {
          throw new Error('clearTimeout has not been defined')
        }
        ;(function () {
          try {
            if (typeof setTimeout === 'function') {
              cachedSetTimeout = setTimeout
            } else {
              cachedSetTimeout = defaultSetTimout
            }
          } catch (e) {
            cachedSetTimeout = defaultSetTimout
          }
          try {
            if (typeof clearTimeout === 'function') {
              cachedClearTimeout = clearTimeout
            } else {
              cachedClearTimeout = defaultClearTimeout
            }
          } catch (e) {
            cachedClearTimeout = defaultClearTimeout
          }
        })()
        function runTimeout(fun) {
          if (cachedSetTimeout === setTimeout) {
            //normal enviroments in sane situations
            return setTimeout(fun, 0)
          }
          // if setTimeout wasn't available but was latter defined
          if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout
            return setTimeout(fun, 0)
          }
          try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedSetTimeout(fun, 0)
          } catch (e) {
            try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
              return cachedSetTimeout.call(null, fun, 0)
            } catch (e) {
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
              return cachedSetTimeout.call(this, fun, 0)
            }
          }
        }
        function runClearTimeout(marker) {
          if (cachedClearTimeout === clearTimeout) {
            //normal enviroments in sane situations
            return clearTimeout(marker)
          }
          // if clearTimeout wasn't available but was latter defined
          if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout
            return clearTimeout(marker)
          }
          try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedClearTimeout(marker)
          } catch (e) {
            try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
              return cachedClearTimeout.call(null, marker)
            } catch (e) {
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
              // Some versions of I.E. have different rules for clearTimeout vs setTimeout
              return cachedClearTimeout.call(this, marker)
            }
          }
        }
        var queue = []
        var draining = false
        var currentQueue
        var queueIndex = -1

        function cleanUpNextTick() {
          if (!draining || !currentQueue) {
            return
          }
          draining = false
          if (currentQueue.length) {
            queue = currentQueue.concat(queue)
          } else {
            queueIndex = -1
          }
          if (queue.length) {
            drainQueue()
          }
        }

        function drainQueue() {
          if (draining) {
            return
          }
          var timeout = runTimeout(cleanUpNextTick)
          draining = true

          var len = queue.length
          while (len) {
            currentQueue = queue
            queue = []
            while (++queueIndex < len) {
              if (currentQueue) {
                currentQueue[queueIndex].run()
              }
            }
            queueIndex = -1
            len = queue.length
          }
          currentQueue = null
          draining = false
          runClearTimeout(timeout)
        }

        process.nextTick = function (fun) {
          var args = new Array(arguments.length - 1)
          if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i]
            }
          }
          queue.push(new Item(fun, args))
          if (queue.length === 1 && !draining) {
            runTimeout(drainQueue)
          }
        }

        // v8 likes predictible objects
        function Item(fun, array) {
          this.fun = fun
          this.array = array
        }
        Item.prototype.run = function () {
          this.fun.apply(null, this.array)
        }
        process.title = 'browser'
        process.browser = true
        process.env = {}
        process.argv = []
        process.version = '' // empty string to avoid regexp issues
        process.versions = {}

        function noop() {}

        process.on = noop
        process.addListener = noop
        process.once = noop
        process.off = noop
        process.removeListener = noop
        process.removeAllListeners = noop
        process.emit = noop
        process.prependListener = noop
        process.prependOnceListener = noop

        process.listeners = function (name) {
          return []
        }

        process.binding = function (name) {
          throw new Error('process.binding is not supported')
        }

        process.cwd = function () {
          return '/'
        }
        process.chdir = function (dir) {
          throw new Error('process.chdir is not supported')
        }
        process.umask = function () {
          return 0
        }
      },
      {},
    ],
    11: [
      function (require, module, exports) {
        /* -*- Mode: js; js-indent-level: 2; -*- */
        /*
         * Copyright 2011 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE or:
         * http://opensource.org/licenses/BSD-3-Clause
         */

        var util = require('./util')
        var has = Object.prototype.hasOwnProperty
        var hasNativeMap = typeof Map !== 'undefined'

        /**
         * A data structure which is a combination of an array and a set. Adding a new
         * member is O(1), testing for membership is O(1), and finding the index of an
         * element is O(1). Removing elements from the set is not supported. Only
         * strings are supported for membership.
         */
        function ArraySet() {
          this._array = []
          this._set = hasNativeMap ? new Map() : Object.create(null)
        }

        /**
         * Static method for creating ArraySet instances from an existing array.
         */
        ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
          var set = new ArraySet()
          for (var i = 0, len = aArray.length; i < len; i++) {
            set.add(aArray[i], aAllowDuplicates)
          }
          return set
        }

        /**
         * Return how many unique items are in this ArraySet. If duplicates have been
         * added, than those do not count towards the size.
         *
         * @returns Number
         */
        ArraySet.prototype.size = function ArraySet_size() {
          return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length
        }

        /**
         * Add the given string to this set.
         *
         * @param String aStr
         */
        ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
          var sStr = hasNativeMap ? aStr : util.toSetString(aStr)
          var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr)
          var idx = this._array.length
          if (!isDuplicate || aAllowDuplicates) {
            this._array.push(aStr)
          }
          if (!isDuplicate) {
            if (hasNativeMap) {
              this._set.set(aStr, idx)
            } else {
              this._set[sStr] = idx
            }
          }
        }

        /**
         * Is the given string a member of this set?
         *
         * @param String aStr
         */
        ArraySet.prototype.has = function ArraySet_has(aStr) {
          if (hasNativeMap) {
            return this._set.has(aStr)
          } else {
            var sStr = util.toSetString(aStr)
            return has.call(this._set, sStr)
          }
        }

        /**
         * What is the index of the given string in the array?
         *
         * @param String aStr
         */
        ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
          if (hasNativeMap) {
            var idx = this._set.get(aStr)
            if (idx >= 0) {
              return idx
            }
          } else {
            var sStr = util.toSetString(aStr)
            if (has.call(this._set, sStr)) {
              return this._set[sStr]
            }
          }

          throw new Error('"' + aStr + '" is not in the set.')
        }

        /**
         * What is the element at the given index?
         *
         * @param Number aIdx
         */
        ArraySet.prototype.at = function ArraySet_at(aIdx) {
          if (aIdx >= 0 && aIdx < this._array.length) {
            return this._array[aIdx]
          }
          throw new Error('No element indexed by ' + aIdx)
        }

        /**
         * Returns the array representation of this set (which has the proper indices
         * indicated by indexOf). Note that this is a copy of the internal array used
         * for storing the members so that no one can mess with internal state.
         */
        ArraySet.prototype.toArray = function ArraySet_toArray() {
          return this._array.slice()
        }

        exports.ArraySet = ArraySet
      },
      { './util': 20 },
    ],
    12: [
      function (require, module, exports) {
        /* -*- Mode: js; js-indent-level: 2; -*- */
        /*
         * Copyright 2011 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE or:
         * http://opensource.org/licenses/BSD-3-Clause
         *
         * Based on the Base 64 VLQ implementation in Closure Compiler:
         * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
         *
         * Copyright 2011 The Closure Compiler Authors. All rights reserved.
         * Redistribution and use in source and binary forms, with or without
         * modification, are permitted provided that the following conditions are
         * met:
         *
         *  * Redistributions of source code must retain the above copyright
         *    notice, this list of conditions and the following disclaimer.
         *  * Redistributions in binary form must reproduce the above
         *    copyright notice, this list of conditions and the following
         *    disclaimer in the documentation and/or other materials provided
         *    with the distribution.
         *  * Neither the name of Google Inc. nor the names of its
         *    contributors may be used to endorse or promote products derived
         *    from this software without specific prior written permission.
         *
         * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
         * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
         * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
         * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
         * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
         * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
         * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
         * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
         * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
         * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
         * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
         */

        var base64 = require('./base64')

        // A single base 64 digit can contain 6 bits of data. For the base 64 variable
        // length quantities we use in the source map spec, the first bit is the sign,
        // the next four bits are the actual value, and the 6th bit is the
        // continuation bit. The continuation bit tells us whether there are more
        // digits in this value following this digit.
        //
        //   Continuation
        //   |    Sign
        //   |    |
        //   V    V
        //   101011

        var VLQ_BASE_SHIFT = 5

        // binary: 100000
        var VLQ_BASE = 1 << VLQ_BASE_SHIFT

        // binary: 011111
        var VLQ_BASE_MASK = VLQ_BASE - 1

        // binary: 100000
        var VLQ_CONTINUATION_BIT = VLQ_BASE

        /**
         * Converts from a two-complement value to a value where the sign bit is
         * placed in the least significant bit.  For example, as decimals:
         *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
         *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
         */
        function toVLQSigned(aValue) {
          return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0
        }

        /**
         * Converts to a two-complement value from a value where the sign bit is
         * placed in the least significant bit.  For example, as decimals:
         *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
         *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
         */
        function fromVLQSigned(aValue) {
          var isNegative = (aValue & 1) === 1
          var shifted = aValue >> 1
          return isNegative ? -shifted : shifted
        }

        /**
         * Returns the base 64 VLQ encoded value.
         */
        exports.encode = function base64VLQ_encode(aValue) {
          var encoded = ''
          var digit

          var vlq = toVLQSigned(aValue)

          do {
            digit = vlq & VLQ_BASE_MASK
            vlq >>>= VLQ_BASE_SHIFT
            if (vlq > 0) {
              // There are still more digits in this value, so we must make sure the
              // continuation bit is marked.
              digit |= VLQ_CONTINUATION_BIT
            }
            encoded += base64.encode(digit)
          } while (vlq > 0)

          return encoded
        }

        /**
         * Decodes the next base 64 VLQ value from the given string and returns the
         * value and the rest of the string via the out parameter.
         */
        exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
          var strLen = aStr.length
          var result = 0
          var shift = 0
          var continuation, digit

          do {
            if (aIndex >= strLen) {
              throw new Error('Expected more digits in base 64 VLQ value.')
            }

            digit = base64.decode(aStr.charCodeAt(aIndex++))
            if (digit === -1) {
              throw new Error('Invalid base64 digit: ' + aStr.charAt(aIndex - 1))
            }

            continuation = !!(digit & VLQ_CONTINUATION_BIT)
            digit &= VLQ_BASE_MASK
            result = result + (digit << shift)
            shift += VLQ_BASE_SHIFT
          } while (continuation)

          aOutParam.value = fromVLQSigned(result)
          aOutParam.rest = aIndex
        }
      },
      { './base64': 13 },
    ],
    13: [
      function (require, module, exports) {
        /* -*- Mode: js; js-indent-level: 2; -*- */
        /*
         * Copyright 2011 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE or:
         * http://opensource.org/licenses/BSD-3-Clause
         */

        var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('')

        /**
         * Encode an integer in the range of 0 to 63 to a single base 64 digit.
         */
        exports.encode = function (number) {
          if (0 <= number && number < intToCharMap.length) {
            return intToCharMap[number]
          }
          throw new TypeError('Must be between 0 and 63: ' + number)
        }

        /**
         * Decode a single base 64 character code digit to an integer. Returns -1 on
         * failure.
         */
        exports.decode = function (charCode) {
          var bigA = 65 // 'A'
          var bigZ = 90 // 'Z'

          var littleA = 97 // 'a'
          var littleZ = 122 // 'z'

          var zero = 48 // '0'
          var nine = 57 // '9'

          var plus = 43 // '+'
          var slash = 47 // '/'

          var littleOffset = 26
          var numberOffset = 52

          // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
          if (bigA <= charCode && charCode <= bigZ) {
            return charCode - bigA
          }

          // 26 - 51: abcdefghijklmnopqrstuvwxyz
          if (littleA <= charCode && charCode <= littleZ) {
            return charCode - littleA + littleOffset
          }

          // 52 - 61: 0123456789
          if (zero <= charCode && charCode <= nine) {
            return charCode - zero + numberOffset
          }

          // 62: +
          if (charCode == plus) {
            return 62
          }

          // 63: /
          if (charCode == slash) {
            return 63
          }

          // Invalid base64 digit.
          return -1
        }
      },
      {},
    ],
    14: [
      function (require, module, exports) {
        /* -*- Mode: js; js-indent-level: 2; -*- */
        /*
         * Copyright 2011 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE or:
         * http://opensource.org/licenses/BSD-3-Clause
         */

        exports.GREATEST_LOWER_BOUND = 1
        exports.LEAST_UPPER_BOUND = 2

        /**
         * Recursive implementation of binary search.
         *
         * @param aLow Indices here and lower do not contain the needle.
         * @param aHigh Indices here and higher do not contain the needle.
         * @param aNeedle The element being searched for.
         * @param aHaystack The non-empty array being searched.
         * @param aCompare Function which takes two elements and returns -1, 0, or 1.
         * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
         *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
         *     closest element that is smaller than or greater than the one we are
         *     searching for, respectively, if the exact element cannot be found.
         */
        function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
          // This function terminates when one of the following is true:
          //
          //   1. We find the exact element we are looking for.
          //
          //   2. We did not find the exact element, but we can return the index of
          //      the next-closest element.
          //
          //   3. We did not find the exact element, and there is no next-closest
          //      element than the one we are searching for, so we return -1.
          var mid = Math.floor((aHigh - aLow) / 2) + aLow
          var cmp = aCompare(aNeedle, aHaystack[mid], true)
          if (cmp === 0) {
            // Found the element we are looking for.
            return mid
          } else if (cmp > 0) {
            // Our needle is greater than aHaystack[mid].
            if (aHigh - mid > 1) {
              // The element is in the upper half.
              return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias)
            }

            // The exact needle element was not found in this haystack. Determine if
            // we are in termination case (3) or (2) and return the appropriate thing.
            if (aBias == exports.LEAST_UPPER_BOUND) {
              return aHigh < aHaystack.length ? aHigh : -1
            } else {
              return mid
            }
          } else {
            // Our needle is less than aHaystack[mid].
            if (mid - aLow > 1) {
              // The element is in the lower half.
              return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias)
            }

            // we are in termination case (3) or (2) and return the appropriate thing.
            if (aBias == exports.LEAST_UPPER_BOUND) {
              return mid
            } else {
              return aLow < 0 ? -1 : aLow
            }
          }
        }

        /**
         * This is an implementation of binary search which will always try and return
         * the index of the closest element if there is no exact hit. This is because
         * mappings between original and generated line/col pairs are single points,
         * and there is an implicit region between each of them, so a miss just means
         * that you aren't on the very start of a region.
         *
         * @param aNeedle The element you are looking for.
         * @param aHaystack The array that is being searched.
         * @param aCompare A function which takes the needle and an element in the
         *     array and returns -1, 0, or 1 depending on whether the needle is less
         *     than, equal to, or greater than the element, respectively.
         * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
         *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
         *     closest element that is smaller than or greater than the one we are
         *     searching for, respectively, if the exact element cannot be found.
         *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
         */
        exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
          if (aHaystack.length === 0) {
            return -1
          }

          var index = recursiveSearch(
            -1,
            aHaystack.length,
            aNeedle,
            aHaystack,
            aCompare,
            aBias || exports.GREATEST_LOWER_BOUND,
          )
          if (index < 0) {
            return -1
          }

          // We have found either the exact element, or the next-closest element than
          // the one we are searching for. However, there may be more than one such
          // element. Make sure we always return the smallest of these.
          while (index - 1 >= 0) {
            if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
              break
            }
            --index
          }

          return index
        }
      },
      {},
    ],
    15: [
      function (require, module, exports) {
        /* -*- Mode: js; js-indent-level: 2; -*- */
        /*
         * Copyright 2014 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE or:
         * http://opensource.org/licenses/BSD-3-Clause
         */

        var util = require('./util')

        /**
         * Determine whether mappingB is after mappingA with respect to generated
         * position.
         */
        function generatedPositionAfter(mappingA, mappingB) {
          // Optimized for most common case
          var lineA = mappingA.generatedLine
          var lineB = mappingB.generatedLine
          var columnA = mappingA.generatedColumn
          var columnB = mappingB.generatedColumn
          return (
            lineB > lineA ||
            (lineB == lineA && columnB >= columnA) ||
            util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0
          )
        }

        /**
         * A data structure to provide a sorted view of accumulated mappings in a
         * performance conscious manner. It trades a neglibable overhead in general
         * case for a large speedup in case of mappings being added in order.
         */
        function MappingList() {
          this._array = []
          this._sorted = true
          // Serves as infimum
          this._last = { generatedLine: -1, generatedColumn: 0 }
        }

        /**
         * Iterate through internal items. This method takes the same arguments that
         * `Array.prototype.forEach` takes.
         *
         * NOTE: The order of the mappings is NOT guaranteed.
         */
        MappingList.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
          this._array.forEach(aCallback, aThisArg)
        }

        /**
         * Add the given source mapping.
         *
         * @param Object aMapping
         */
        MappingList.prototype.add = function MappingList_add(aMapping) {
          if (generatedPositionAfter(this._last, aMapping)) {
            this._last = aMapping
            this._array.push(aMapping)
          } else {
            this._sorted = false
            this._array.push(aMapping)
          }
        }

        /**
         * Returns the flat, sorted array of mappings. The mappings are sorted by
         * generated position.
         *
         * WARNING: This method returns internal data without copying, for
         * performance. The return value must NOT be mutated, and should be treated as
         * an immutable borrow. If you want to take ownership, you must make your own
         * copy.
         */
        MappingList.prototype.toArray = function MappingList_toArray() {
          if (!this._sorted) {
            this._array.sort(util.compareByGeneratedPositionsInflated)
            this._sorted = true
          }
          return this._array
        }

        exports.MappingList = MappingList
      },
      { './util': 20 },
    ],
    16: [
      function (require, module, exports) {
        /* -*- Mode: js; js-indent-level: 2; -*- */
        /*
         * Copyright 2011 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE or:
         * http://opensource.org/licenses/BSD-3-Clause
         */

        // It turns out that some (most?) JavaScript engines don't self-host
        // `Array.prototype.sort`. This makes sense because C++ will likely remain
        // faster than JS when doing raw CPU-intensive sorting. However, when using a
        // custom comparator function, calling back and forth between the VM's C++ and
        // JIT'd JS is rather slow *and* loses JIT type information, resulting in
        // worse generated code for the comparator function than would be optimal. In
        // fact, when sorting with a comparator, these costs outweigh the benefits of
        // sorting in C++. By using our own JS-implemented Quick Sort (below), we get
        // a ~3500ms mean speed-up in `bench/bench.html`.

        /**
         * Swap the elements indexed by `x` and `y` in the array `ary`.
         *
         * @param {Array} ary
         *        The array.
         * @param {Number} x
         *        The index of the first item.
         * @param {Number} y
         *        The index of the second item.
         */
        function swap(ary, x, y) {
          var temp = ary[x]
          ary[x] = ary[y]
          ary[y] = temp
        }

        /**
         * Returns a random integer within the range `low .. high` inclusive.
         *
         * @param {Number} low
         *        The lower bound on the range.
         * @param {Number} high
         *        The upper bound on the range.
         */
        function randomIntInRange(low, high) {
          return Math.round(low + Math.random() * (high - low))
        }

        /**
         * The Quick Sort algorithm.
         *
         * @param {Array} ary
         *        An array to sort.
         * @param {function} comparator
         *        Function to use to compare two items.
         * @param {Number} p
         *        Start index of the array
         * @param {Number} r
         *        End index of the array
         */
        function doQuickSort(ary, comparator, p, r) {
          // If our lower bound is less than our upper bound, we (1) partition the
          // array into two pieces and (2) recurse on each half. If it is not, this is
          // the empty array and our base case.

          if (p < r) {
            // (1) Partitioning.
            //
            // The partitioning chooses a pivot between `p` and `r` and moves all
            // elements that are less than or equal to the pivot to the before it, and
            // all the elements that are greater than it after it. The effect is that
            // once partition is done, the pivot is in the exact place it will be when
            // the array is put in sorted order, and it will not need to be moved
            // again. This runs in O(n) time.

            // Always choose a random pivot so that an input array which is reverse
            // sorted does not cause O(n^2) running time.
            var pivotIndex = randomIntInRange(p, r)
            var i = p - 1

            swap(ary, pivotIndex, r)
            var pivot = ary[r]

            // Immediately after `j` is incremented in this loop, the following hold
            // true:
            //
            //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
            //
            //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
            for (var j = p; j < r; j++) {
              if (comparator(ary[j], pivot) <= 0) {
                i += 1
                swap(ary, i, j)
              }
            }

            swap(ary, i + 1, j)
            var q = i + 1

            // (2) Recurse on each half.

            doQuickSort(ary, comparator, p, q - 1)
            doQuickSort(ary, comparator, q + 1, r)
          }
        }

        /**
         * Sort the given array in-place with the given comparator function.
         *
         * @param {Array} ary
         *        An array to sort.
         * @param {function} comparator
         *        Function to use to compare two items.
         */
        exports.quickSort = function (ary, comparator) {
          doQuickSort(ary, comparator, 0, ary.length - 1)
        }
      },
      {},
    ],
    17: [
      function (require, module, exports) {
        /* -*- Mode: js; js-indent-level: 2; -*- */
        /*
         * Copyright 2011 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE or:
         * http://opensource.org/licenses/BSD-3-Clause
         */

        var util = require('./util')
        var binarySearch = require('./binary-search')
        var ArraySet = require('./array-set').ArraySet
        var base64VLQ = require('./base64-vlq')
        var quickSort = require('./quick-sort').quickSort

        function SourceMapConsumer(aSourceMap, aSourceMapURL) {
          var sourceMap = aSourceMap
          if (typeof aSourceMap === 'string') {
            sourceMap = util.parseSourceMapInput(aSourceMap)
          }

          return sourceMap.sections != null
            ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
            : new BasicSourceMapConsumer(sourceMap, aSourceMapURL)
        }

        SourceMapConsumer.fromSourceMap = function (aSourceMap, aSourceMapURL) {
          return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL)
        }

        /**
         * The version of the source mapping spec that we are consuming.
         */
        SourceMapConsumer.prototype._version = 3

        // `__generatedMappings` and `__originalMappings` are arrays that hold the
        // parsed mapping coordinates from the source map's "mappings" attribute. They
        // are lazily instantiated, accessed via the `_generatedMappings` and
        // `_originalMappings` getters respectively, and we only parse the mappings
        // and create these arrays once queried for a source location. We jump through
        // these hoops because there can be many thousands of mappings, and parsing
        // them is expensive, so we only want to do it if we must.
        //
        // Each object in the arrays is of the form:
        //
        //     {
        //       generatedLine: The line number in the generated code,
        //       generatedColumn: The column number in the generated code,
        //       source: The path to the original source file that generated this
        //               chunk of code,
        //       originalLine: The line number in the original source that
        //                     corresponds to this chunk of generated code,
        //       originalColumn: The column number in the original source that
        //                       corresponds to this chunk of generated code,
        //       name: The name of the original symbol which generated this chunk of
        //             code.
        //     }
        //
        // All properties except for `generatedLine` and `generatedColumn` can be
        // `null`.
        //
        // `_generatedMappings` is ordered by the generated positions.
        //
        // `_originalMappings` is ordered by the original positions.

        SourceMapConsumer.prototype.__generatedMappings = null
        Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
          configurable: true,
          enumerable: true,
          get: function () {
            if (!this.__generatedMappings) {
              this._parseMappings(this._mappings, this.sourceRoot)
            }

            return this.__generatedMappings
          },
        })

        SourceMapConsumer.prototype.__originalMappings = null
        Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
          configurable: true,
          enumerable: true,
          get: function () {
            if (!this.__originalMappings) {
              this._parseMappings(this._mappings, this.sourceRoot)
            }

            return this.__originalMappings
          },
        })

        SourceMapConsumer.prototype._charIsMappingSeparator = function SourceMapConsumer_charIsMappingSeparator(
          aStr,
          index,
        ) {
          var c = aStr.charAt(index)
          return c === ';' || c === ','
        }

        /**
         * Parse the mappings in a string in to a data structure which we can easily
         * query (the ordered arrays in the `this.__generatedMappings` and
         * `this.__originalMappings` properties).
         */
        SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
          throw new Error('Subclasses must implement _parseMappings')
        }

        SourceMapConsumer.GENERATED_ORDER = 1
        SourceMapConsumer.ORIGINAL_ORDER = 2

        SourceMapConsumer.GREATEST_LOWER_BOUND = 1
        SourceMapConsumer.LEAST_UPPER_BOUND = 2

        /**
         * Iterate over each mapping between an original source/line/column and a
         * generated line/column in this source map.
         *
         * @param Function aCallback
         *        The function that is called with each mapping.
         * @param Object aContext
         *        Optional. If specified, this object will be the value of `this` every
         *        time that `aCallback` is called.
         * @param aOrder
         *        Either `SourceMapConsumer.GENERATED_ORDER` or
         *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
         *        iterate over the mappings sorted by the generated file's line/column
         *        order or the original's source/line/column order, respectively. Defaults to
         *        `SourceMapConsumer.GENERATED_ORDER`.
         */
        SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
          var context = aContext || null
          var order = aOrder || SourceMapConsumer.GENERATED_ORDER

          var mappings
          switch (order) {
            case SourceMapConsumer.GENERATED_ORDER:
              mappings = this._generatedMappings
              break
            case SourceMapConsumer.ORIGINAL_ORDER:
              mappings = this._originalMappings
              break
            default:
              throw new Error('Unknown order of iteration.')
          }

          var sourceRoot = this.sourceRoot
          mappings
            .map(function (mapping) {
              var source = mapping.source === null ? null : this._sources.at(mapping.source)
              source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL)
              return {
                source: source,
                generatedLine: mapping.generatedLine,
                generatedColumn: mapping.generatedColumn,
                originalLine: mapping.originalLine,
                originalColumn: mapping.originalColumn,
                name: mapping.name === null ? null : this._names.at(mapping.name),
              }
            }, this)
            .forEach(aCallback, context)
        }

        /**
         * Returns all generated line and column information for the original source,
         * line, and column provided. If no column is provided, returns all mappings
         * corresponding to a either the line we are searching for or the next
         * closest line that has any mappings. Otherwise, returns all mappings
         * corresponding to the given line and either the column we are searching for
         * or the next closest column that has any offsets.
         *
         * The only argument is an object with the following properties:
         *
         *   - source: The filename of the original source.
         *   - line: The line number in the original source.  The line number is 1-based.
         *   - column: Optional. the column number in the original source.
         *    The column number is 0-based.
         *
         * and an array of objects is returned, each with the following properties:
         *
         *   - line: The line number in the generated source, or null.  The
         *    line number is 1-based.
         *   - column: The column number in the generated source, or null.
         *    The column number is 0-based.
         */
        SourceMapConsumer.prototype.allGeneratedPositionsFor = function SourceMapConsumer_allGeneratedPositionsFor(
          aArgs,
        ) {
          var line = util.getArg(aArgs, 'line')

          // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
          // returns the index of the closest mapping less than the needle. By
          // setting needle.originalColumn to 0, we thus find the last mapping for
          // the given line, provided such a mapping exists.
          var needle = {
            source: util.getArg(aArgs, 'source'),
            originalLine: line,
            originalColumn: util.getArg(aArgs, 'column', 0),
          }

          needle.source = this._findSourceIndex(needle.source)
          if (needle.source < 0) {
            return []
          }

          var mappings = []

          var index = this._findMapping(
            needle,
            this._originalMappings,
            'originalLine',
            'originalColumn',
            util.compareByOriginalPositions,
            binarySearch.LEAST_UPPER_BOUND,
          )
          if (index >= 0) {
            var mapping = this._originalMappings[index]

            if (aArgs.column === undefined) {
              var originalLine = mapping.originalLine

              // Iterate until either we run out of mappings, or we run into
              // a mapping for a different line than the one we found. Since
              // mappings are sorted, this is guaranteed to find all mappings for
              // the line we found.
              while (mapping && mapping.originalLine === originalLine) {
                mappings.push({
                  line: util.getArg(mapping, 'generatedLine', null),
                  column: util.getArg(mapping, 'generatedColumn', null),
                  lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null),
                })

                mapping = this._originalMappings[++index]
              }
            } else {
              var originalColumn = mapping.originalColumn

              // Iterate until either we run out of mappings, or we run into
              // a mapping for a different line than the one we were searching for.
              // Since mappings are sorted, this is guaranteed to find all mappings for
              // the line we are searching for.
              while (mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn) {
                mappings.push({
                  line: util.getArg(mapping, 'generatedLine', null),
                  column: util.getArg(mapping, 'generatedColumn', null),
                  lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null),
                })

                mapping = this._originalMappings[++index]
              }
            }
          }

          return mappings
        }

        exports.SourceMapConsumer = SourceMapConsumer

        /**
         * A BasicSourceMapConsumer instance represents a parsed source map which we can
         * query for information about the original file positions by giving it a file
         * position in the generated source.
         *
         * The first parameter is the raw source map (either as a JSON string, or
         * already parsed to an object). According to the spec, source maps have the
         * following attributes:
         *
         *   - version: Which version of the source map spec this map is following.
         *   - sources: An array of URLs to the original source files.
         *   - names: An array of identifiers which can be referrenced by individual mappings.
         *   - sourceRoot: Optional. The URL root from which all sources are relative.
         *   - sourcesContent: Optional. An array of contents of the original source files.
         *   - mappings: A string of base64 VLQs which contain the actual mappings.
         *   - file: Optional. The generated file this source map is associated with.
         *
         * Here is an example source map, taken from the source map spec[0]:
         *
         *     {
         *       version : 3,
         *       file: "out.js",
         *       sourceRoot : "",
         *       sources: ["foo.js", "bar.js"],
         *       names: ["src", "maps", "are", "fun"],
         *       mappings: "AA,AB;;ABCDE;"
         *     }
         *
         * The second parameter, if given, is a string whose value is the URL
         * at which the source map was found.  This URL is used to compute the
         * sources array.
         *
         * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
         */
        function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
          var sourceMap = aSourceMap
          if (typeof aSourceMap === 'string') {
            sourceMap = util.parseSourceMapInput(aSourceMap)
          }

          var version = util.getArg(sourceMap, 'version')
          var sources = util.getArg(sourceMap, 'sources')
          // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
          // requires the array) to play nice here.
          var names = util.getArg(sourceMap, 'names', [])
          var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null)
          var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null)
          var mappings = util.getArg(sourceMap, 'mappings')
          var file = util.getArg(sourceMap, 'file', null)

          // Once again, Sass deviates from the spec and supplies the version as a
          // string rather than a number, so we use loose equality checking here.
          if (version != this._version) {
            throw new Error('Unsupported version: ' + version)
          }

          if (sourceRoot) {
            sourceRoot = util.normalize(sourceRoot)
          }

          sources = sources
            .map(String)
            // Some source maps produce relative source paths like "./foo.js" instead of
            // "foo.js".  Normalize these first so that future comparisons will succeed.
            // See bugzil.la/1090768.
            .map(util.normalize)
            // Always ensure that absolute sources are internally stored relative to
            // the source root, if the source root is absolute. Not doing this would
            // be particularly problematic when the source root is a prefix of the
            // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
            .map(function (source) {
              return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
                ? util.relative(sourceRoot, source)
                : source
            })

          // Pass `true` below to allow duplicate names and sources. While source maps
          // are intended to be compressed and deduplicated, the TypeScript compiler
          // sometimes generates source maps with duplicates in them. See Github issue
          // #72 and bugzil.la/889492.
          this._names = ArraySet.fromArray(names.map(String), true)
          this._sources = ArraySet.fromArray(sources, true)

          this._absoluteSources = this._sources.toArray().map(function (s) {
            return util.computeSourceURL(sourceRoot, s, aSourceMapURL)
          })

          this.sourceRoot = sourceRoot
          this.sourcesContent = sourcesContent
          this._mappings = mappings
          this._sourceMapURL = aSourceMapURL
          this.file = file
        }

        BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype)
        BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer

        /**
         * Utility function to find the index of a source.  Returns -1 if not
         * found.
         */
        BasicSourceMapConsumer.prototype._findSourceIndex = function (aSource) {
          var relativeSource = aSource
          if (this.sourceRoot != null) {
            relativeSource = util.relative(this.sourceRoot, relativeSource)
          }

          if (this._sources.has(relativeSource)) {
            return this._sources.indexOf(relativeSource)
          }

          // Maybe aSource is an absolute URL as returned by |sources|.  In
          // this case we can't simply undo the transform.
          var i
          for (i = 0; i < this._absoluteSources.length; ++i) {
            if (this._absoluteSources[i] == aSource) {
              return i
            }
          }

          return -1
        }

        /**
         * Create a BasicSourceMapConsumer from a SourceMapGenerator.
         *
         * @param SourceMapGenerator aSourceMap
         *        The source map that will be consumed.
         * @param String aSourceMapURL
         *        The URL at which the source map can be found (optional)
         * @returns BasicSourceMapConsumer
         */
        BasicSourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
          var smc = Object.create(BasicSourceMapConsumer.prototype)

          var names = (smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true))
          var sources = (smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true))
          smc.sourceRoot = aSourceMap._sourceRoot
          smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(), smc.sourceRoot)
          smc.file = aSourceMap._file
          smc._sourceMapURL = aSourceMapURL
          smc._absoluteSources = smc._sources.toArray().map(function (s) {
            return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL)
          })

          // Because we are modifying the entries (by converting string sources and
          // names to indices into the sources and names ArraySets), we have to make
          // a copy of the entry or else bad things happen. Shared mutable state
          // strikes again! See github issue #191.

          var generatedMappings = aSourceMap._mappings.toArray().slice()
          var destGeneratedMappings = (smc.__generatedMappings = [])
          var destOriginalMappings = (smc.__originalMappings = [])

          for (var i = 0, length = generatedMappings.length; i < length; i++) {
            var srcMapping = generatedMappings[i]
            var destMapping = new Mapping()
            destMapping.generatedLine = srcMapping.generatedLine
            destMapping.generatedColumn = srcMapping.generatedColumn

            if (srcMapping.source) {
              destMapping.source = sources.indexOf(srcMapping.source)
              destMapping.originalLine = srcMapping.originalLine
              destMapping.originalColumn = srcMapping.originalColumn

              if (srcMapping.name) {
                destMapping.name = names.indexOf(srcMapping.name)
              }

              destOriginalMappings.push(destMapping)
            }

            destGeneratedMappings.push(destMapping)
          }

          quickSort(smc.__originalMappings, util.compareByOriginalPositions)

          return smc
        }

        /**
         * The version of the source mapping spec that we are consuming.
         */
        BasicSourceMapConsumer.prototype._version = 3

        /**
         * The list of original sources.
         */
        Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
          get: function () {
            return this._absoluteSources.slice()
          },
        })

        /**
         * Provide the JIT with a nice shape / hidden class.
         */
        function Mapping() {
          this.generatedLine = 0
          this.generatedColumn = 0
          this.source = null
          this.originalLine = null
          this.originalColumn = null
          this.name = null
        }

        /**
         * Parse the mappings in a string in to a data structure which we can easily
         * query (the ordered arrays in the `this.__generatedMappings` and
         * `this.__originalMappings` properties).
         */
        BasicSourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
          var generatedLine = 1
          var previousGeneratedColumn = 0
          var previousOriginalLine = 0
          var previousOriginalColumn = 0
          var previousSource = 0
          var previousName = 0
          var length = aStr.length
          var index = 0
          var cachedSegments = {}
          var temp = {}
          var originalMappings = []
          var generatedMappings = []
          var mapping, str, segment, end, value

          while (index < length) {
            if (aStr.charAt(index) === ';') {
              generatedLine++
              index++
              previousGeneratedColumn = 0
            } else if (aStr.charAt(index) === ',') {
              index++
            } else {
              mapping = new Mapping()
              mapping.generatedLine = generatedLine

              // Because each offset is encoded relative to the previous one,
              // many segments often have the same encoding. We can exploit this
              // fact by caching the parsed variable length fields of each segment,
              // allowing us to avoid a second parse if we encounter the same
              // segment again.
              for (end = index; end < length; end++) {
                if (this._charIsMappingSeparator(aStr, end)) {
                  break
                }
              }
              str = aStr.slice(index, end)

              segment = cachedSegments[str]
              if (segment) {
                index += str.length
              } else {
                segment = []
                while (index < end) {
                  base64VLQ.decode(aStr, index, temp)
                  value = temp.value
                  index = temp.rest
                  segment.push(value)
                }

                if (segment.length === 2) {
                  throw new Error('Found a source, but no line and column')
                }

                if (segment.length === 3) {
                  throw new Error('Found a source and line, but no column')
                }

                cachedSegments[str] = segment
              }

              // Generated column.
              mapping.generatedColumn = previousGeneratedColumn + segment[0]
              previousGeneratedColumn = mapping.generatedColumn

              if (segment.length > 1) {
                // Original source.
                mapping.source = previousSource + segment[1]
                previousSource += segment[1]

                // Original line.
                mapping.originalLine = previousOriginalLine + segment[2]
                previousOriginalLine = mapping.originalLine
                // Lines are stored 0-based
                mapping.originalLine += 1

                // Original column.
                mapping.originalColumn = previousOriginalColumn + segment[3]
                previousOriginalColumn = mapping.originalColumn

                if (segment.length > 4) {
                  // Original name.
                  mapping.name = previousName + segment[4]
                  previousName += segment[4]
                }
              }

              generatedMappings.push(mapping)
              if (typeof mapping.originalLine === 'number') {
                originalMappings.push(mapping)
              }
            }
          }

          quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated)
          this.__generatedMappings = generatedMappings

          quickSort(originalMappings, util.compareByOriginalPositions)
          this.__originalMappings = originalMappings
        }

        /**
         * Find the mapping that best matches the hypothetical "needle" mapping that
         * we are searching for in the given "haystack" of mappings.
         */
        BasicSourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(
          aNeedle,
          aMappings,
          aLineName,
          aColumnName,
          aComparator,
          aBias,
        ) {
          // To return the position we are searching for, we must first find the
          // mapping for the given position and then return the opposite position it
          // points to. Because the mappings are sorted, we can use binary search to
          // find the best mapping.

          if (aNeedle[aLineName] <= 0) {
            throw new TypeError('Line must be greater than or equal to 1, got ' + aNeedle[aLineName])
          }
          if (aNeedle[aColumnName] < 0) {
            throw new TypeError('Column must be greater than or equal to 0, got ' + aNeedle[aColumnName])
          }

          return binarySearch.search(aNeedle, aMappings, aComparator, aBias)
        }

        /**
         * Compute the last column for each generated mapping. The last column is
         * inclusive.
         */
        BasicSourceMapConsumer.prototype.computeColumnSpans = function SourceMapConsumer_computeColumnSpans() {
          for (var index = 0; index < this._generatedMappings.length; ++index) {
            var mapping = this._generatedMappings[index]

            // Mappings do not contain a field for the last generated columnt. We
            // can come up with an optimistic estimate, however, by assuming that
            // mappings are contiguous (i.e. given two consecutive mappings, the
            // first mapping ends where the second one starts).
            if (index + 1 < this._generatedMappings.length) {
              var nextMapping = this._generatedMappings[index + 1]

              if (mapping.generatedLine === nextMapping.generatedLine) {
                mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1
                continue
              }
            }

            // The last mapping for each line spans the entire line.
            mapping.lastGeneratedColumn = Infinity
          }
        }

        /**
         * Returns the original source, line, and column information for the generated
         * source's line and column positions provided. The only argument is an object
         * with the following properties:
         *
         *   - line: The line number in the generated source.  The line number
         *     is 1-based.
         *   - column: The column number in the generated source.  The column
         *     number is 0-based.
         *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
         *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
         *     closest element that is smaller than or greater than the one we are
         *     searching for, respectively, if the exact element cannot be found.
         *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
         *
         * and an object is returned with the following properties:
         *
         *   - source: The original source file, or null.
         *   - line: The line number in the original source, or null.  The
         *     line number is 1-based.
         *   - column: The column number in the original source, or null.  The
         *     column number is 0-based.
         *   - name: The original identifier, or null.
         */
        BasicSourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
          var needle = {
            generatedLine: util.getArg(aArgs, 'line'),
            generatedColumn: util.getArg(aArgs, 'column'),
          }

          var index = this._findMapping(
            needle,
            this._generatedMappings,
            'generatedLine',
            'generatedColumn',
            util.compareByGeneratedPositionsDeflated,
            util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND),
          )

          if (index >= 0) {
            var mapping = this._generatedMappings[index]

            if (mapping.generatedLine === needle.generatedLine) {
              var source = util.getArg(mapping, 'source', null)
              if (source !== null) {
                source = this._sources.at(source)
                source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL)
              }
              var name = util.getArg(mapping, 'name', null)
              if (name !== null) {
                name = this._names.at(name)
              }
              return {
                source: source,
                line: util.getArg(mapping, 'originalLine', null),
                column: util.getArg(mapping, 'originalColumn', null),
                name: name,
              }
            }
          }

          return {
            source: null,
            line: null,
            column: null,
            name: null,
          }
        }

        /**
         * Return true if we have the source content for every source in the source
         * map, false otherwise.
         */
        BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
          function BasicSourceMapConsumer_hasContentsOfAllSources() {
            if (!this.sourcesContent) {
              return false
            }
            return (
              this.sourcesContent.length >= this._sources.size() &&
              !this.sourcesContent.some(function (sc) {
                return sc == null
              })
            )
          }

        /**
         * Returns the original source content. The only argument is the url of the
         * original source file. Returns null if no original source content is
         * available.
         */
        BasicSourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(
          aSource,
          nullOnMissing,
        ) {
          if (!this.sourcesContent) {
            return null
          }

          var index = this._findSourceIndex(aSource)
          if (index >= 0) {
            return this.sourcesContent[index]
          }

          var relativeSource = aSource
          if (this.sourceRoot != null) {
            relativeSource = util.relative(this.sourceRoot, relativeSource)
          }

          var url
          if (this.sourceRoot != null && (url = util.urlParse(this.sourceRoot))) {
            // XXX: file:// URIs and absolute paths lead to unexpected behavior for
            // many users. We can help them out when they expect file:// URIs to
            // behave like it would if they were running a local HTTP server. See
            // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
            var fileUriAbsPath = relativeSource.replace(/^file:\/\//, '')
            if (url.scheme == 'file' && this._sources.has(fileUriAbsPath)) {
              return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
            }

            if ((!url.path || url.path == '/') && this._sources.has('/' + relativeSource)) {
              return this.sourcesContent[this._sources.indexOf('/' + relativeSource)]
            }
          }

          // This function is used recursively from
          // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
          // don't want to throw if we can't find the source - we just want to
          // return null, so we provide a flag to exit gracefully.
          if (nullOnMissing) {
            return null
          } else {
            throw new Error('"' + relativeSource + '" is not in the SourceMap.')
          }
        }

        /**
         * Returns the generated line and column information for the original source,
         * line, and column positions provided. The only argument is an object with
         * the following properties:
         *
         *   - source: The filename of the original source.
         *   - line: The line number in the original source.  The line number
         *     is 1-based.
         *   - column: The column number in the original source.  The column
         *     number is 0-based.
         *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
         *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
         *     closest element that is smaller than or greater than the one we are
         *     searching for, respectively, if the exact element cannot be found.
         *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
         *
         * and an object is returned with the following properties:
         *
         *   - line: The line number in the generated source, or null.  The
         *     line number is 1-based.
         *   - column: The column number in the generated source, or null.
         *     The column number is 0-based.
         */
        BasicSourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
          var source = util.getArg(aArgs, 'source')
          source = this._findSourceIndex(source)
          if (source < 0) {
            return {
              line: null,
              column: null,
              lastColumn: null,
            }
          }

          var needle = {
            source: source,
            originalLine: util.getArg(aArgs, 'line'),
            originalColumn: util.getArg(aArgs, 'column'),
          }

          var index = this._findMapping(
            needle,
            this._originalMappings,
            'originalLine',
            'originalColumn',
            util.compareByOriginalPositions,
            util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND),
          )

          if (index >= 0) {
            var mapping = this._originalMappings[index]

            if (mapping.source === needle.source) {
              return {
                line: util.getArg(mapping, 'generatedLine', null),
                column: util.getArg(mapping, 'generatedColumn', null),
                lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null),
              }
            }
          }

          return {
            line: null,
            column: null,
            lastColumn: null,
          }
        }

        exports.BasicSourceMapConsumer = BasicSourceMapConsumer

        /**
         * An IndexedSourceMapConsumer instance represents a parsed source map which
         * we can query for information. It differs from BasicSourceMapConsumer in
         * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
         * input.
         *
         * The first parameter is a raw source map (either as a JSON string, or already
         * parsed to an object). According to the spec for indexed source maps, they
         * have the following attributes:
         *
         *   - version: Which version of the source map spec this map is following.
         *   - file: Optional. The generated file this source map is associated with.
         *   - sections: A list of section definitions.
         *
         * Each value under the "sections" field has two fields:
         *   - offset: The offset into the original specified at which this section
         *       begins to apply, defined as an object with a "line" and "column"
         *       field.
         *   - map: A source map definition. This source map could also be indexed,
         *       but doesn't have to be.
         *
         * Instead of the "map" field, it's also possible to have a "url" field
         * specifying a URL to retrieve a source map from, but that's currently
         * unsupported.
         *
         * Here's an example source map, taken from the source map spec[0], but
         * modified to omit a section which uses the "url" field.
         *
         *  {
         *    version : 3,
         *    file: "app.js",
         *    sections: [{
         *      offset: {line:100, column:10},
         *      map: {
         *        version : 3,
         *        file: "section.js",
         *        sources: ["foo.js", "bar.js"],
         *        names: ["src", "maps", "are", "fun"],
         *        mappings: "AAAA,E;;ABCDE;"
         *      }
         *    }],
         *  }
         *
         * The second parameter, if given, is a string whose value is the URL
         * at which the source map was found.  This URL is used to compute the
         * sources array.
         *
         * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
         */
        function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
          var sourceMap = aSourceMap
          if (typeof aSourceMap === 'string') {
            sourceMap = util.parseSourceMapInput(aSourceMap)
          }

          var version = util.getArg(sourceMap, 'version')
          var sections = util.getArg(sourceMap, 'sections')

          if (version != this._version) {
            throw new Error('Unsupported version: ' + version)
          }

          this._sources = new ArraySet()
          this._names = new ArraySet()

          var lastOffset = {
            line: -1,
            column: 0,
          }
          this._sections = sections.map(function (s) {
            if (s.url) {
              // The url field will require support for asynchronicity.
              // See https://github.com/mozilla/source-map/issues/16
              throw new Error('Support for url field in sections not implemented.')
            }
            var offset = util.getArg(s, 'offset')
            var offsetLine = util.getArg(offset, 'line')
            var offsetColumn = util.getArg(offset, 'column')

            if (offsetLine < lastOffset.line || (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
              throw new Error('Section offsets must be ordered and non-overlapping.')
            }
            lastOffset = offset

            return {
              generatedOffset: {
                // The offset fields are 0-based, but we use 1-based indices when
                // encoding/decoding from VLQ.
                generatedLine: offsetLine + 1,
                generatedColumn: offsetColumn + 1,
              },
              consumer: new SourceMapConsumer(util.getArg(s, 'map'), aSourceMapURL),
            }
          })
        }

        IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype)
        IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer

        /**
         * The version of the source mapping spec that we are consuming.
         */
        IndexedSourceMapConsumer.prototype._version = 3

        /**
         * The list of original sources.
         */
        Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
          get: function () {
            var sources = []
            for (var i = 0; i < this._sections.length; i++) {
              for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
                sources.push(this._sections[i].consumer.sources[j])
              }
            }
            return sources
          },
        })

        /**
         * Returns the original source, line, and column information for the generated
         * source's line and column positions provided. The only argument is an object
         * with the following properties:
         *
         *   - line: The line number in the generated source.  The line number
         *     is 1-based.
         *   - column: The column number in the generated source.  The column
         *     number is 0-based.
         *
         * and an object is returned with the following properties:
         *
         *   - source: The original source file, or null.
         *   - line: The line number in the original source, or null.  The
         *     line number is 1-based.
         *   - column: The column number in the original source, or null.  The
         *     column number is 0-based.
         *   - name: The original identifier, or null.
         */
        IndexedSourceMapConsumer.prototype.originalPositionFor = function IndexedSourceMapConsumer_originalPositionFor(
          aArgs,
        ) {
          var needle = {
            generatedLine: util.getArg(aArgs, 'line'),
            generatedColumn: util.getArg(aArgs, 'column'),
          }

          // Find the section containing the generated position we're trying to map
          // to an original position.
          var sectionIndex = binarySearch.search(needle, this._sections, function (needle, section) {
            var cmp = needle.generatedLine - section.generatedOffset.generatedLine
            if (cmp) {
              return cmp
            }

            return needle.generatedColumn - section.generatedOffset.generatedColumn
          })
          var section = this._sections[sectionIndex]

          if (!section) {
            return {
              source: null,
              line: null,
              column: null,
              name: null,
            }
          }

          return section.consumer.originalPositionFor({
            line: needle.generatedLine - (section.generatedOffset.generatedLine - 1),
            column:
              needle.generatedColumn -
              (section.generatedOffset.generatedLine === needle.generatedLine
                ? section.generatedOffset.generatedColumn - 1
                : 0),
            bias: aArgs.bias,
          })
        }

        /**
         * Return true if we have the source content for every source in the source
         * map, false otherwise.
         */
        IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
          function IndexedSourceMapConsumer_hasContentsOfAllSources() {
            return this._sections.every(function (s) {
              return s.consumer.hasContentsOfAllSources()
            })
          }

        /**
         * Returns the original source content. The only argument is the url of the
         * original source file. Returns null if no original source content is
         * available.
         */
        IndexedSourceMapConsumer.prototype.sourceContentFor = function IndexedSourceMapConsumer_sourceContentFor(
          aSource,
          nullOnMissing,
        ) {
          for (var i = 0; i < this._sections.length; i++) {
            var section = this._sections[i]

            var content = section.consumer.sourceContentFor(aSource, true)
            if (content) {
              return content
            }
          }
          if (nullOnMissing) {
            return null
          } else {
            throw new Error('"' + aSource + '" is not in the SourceMap.')
          }
        }

        /**
         * Returns the generated line and column information for the original source,
         * line, and column positions provided. The only argument is an object with
         * the following properties:
         *
         *   - source: The filename of the original source.
         *   - line: The line number in the original source.  The line number
         *     is 1-based.
         *   - column: The column number in the original source.  The column
         *     number is 0-based.
         *
         * and an object is returned with the following properties:
         *
         *   - line: The line number in the generated source, or null.  The
         *     line number is 1-based.
         *   - column: The column number in the generated source, or null.
         *     The column number is 0-based.
         */
        IndexedSourceMapConsumer.prototype.generatedPositionFor =
          function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
            for (var i = 0; i < this._sections.length; i++) {
              var section = this._sections[i]

              // Only consider this section if the requested source is in the list of
              // sources of the consumer.
              if (section.consumer._findSourceIndex(util.getArg(aArgs, 'source')) === -1) {
                continue
              }
              var generatedPosition = section.consumer.generatedPositionFor(aArgs)
              if (generatedPosition) {
                var ret = {
                  line: generatedPosition.line + (section.generatedOffset.generatedLine - 1),
                  column:
                    generatedPosition.column +
                    (section.generatedOffset.generatedLine === generatedPosition.line
                      ? section.generatedOffset.generatedColumn - 1
                      : 0),
                }
                return ret
              }
            }

            return {
              line: null,
              column: null,
            }
          }

        /**
         * Parse the mappings in a string in to a data structure which we can easily
         * query (the ordered arrays in the `this.__generatedMappings` and
         * `this.__originalMappings` properties).
         */
        IndexedSourceMapConsumer.prototype._parseMappings = function IndexedSourceMapConsumer_parseMappings(
          aStr,
          aSourceRoot,
        ) {
          this.__generatedMappings = []
          this.__originalMappings = []
          for (var i = 0; i < this._sections.length; i++) {
            var section = this._sections[i]
            var sectionMappings = section.consumer._generatedMappings
            for (var j = 0; j < sectionMappings.length; j++) {
              var mapping = sectionMappings[j]

              var source = section.consumer._sources.at(mapping.source)
              source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL)
              this._sources.add(source)
              source = this._sources.indexOf(source)

              var name = null
              if (mapping.name) {
                name = section.consumer._names.at(mapping.name)
                this._names.add(name)
                name = this._names.indexOf(name)
              }

              // The mappings coming from the consumer for the section have
              // generated positions relative to the start of the section, so we
              // need to offset them to be relative to the start of the concatenated
              // generated file.
              var adjustedMapping = {
                source: source,
                generatedLine: mapping.generatedLine + (section.generatedOffset.generatedLine - 1),
                generatedColumn:
                  mapping.generatedColumn +
                  (section.generatedOffset.generatedLine === mapping.generatedLine
                    ? section.generatedOffset.generatedColumn - 1
                    : 0),
                originalLine: mapping.originalLine,
                originalColumn: mapping.originalColumn,
                name: name,
              }

              this.__generatedMappings.push(adjustedMapping)
              if (typeof adjustedMapping.originalLine === 'number') {
                this.__originalMappings.push(adjustedMapping)
              }
            }
          }

          quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated)
          quickSort(this.__originalMappings, util.compareByOriginalPositions)
        }

        exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer
      },
      { './array-set': 11, './base64-vlq': 12, './binary-search': 14, './quick-sort': 16, './util': 20 },
    ],
    18: [
      function (require, module, exports) {
        /* -*- Mode: js; js-indent-level: 2; -*- */
        /*
         * Copyright 2011 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE or:
         * http://opensource.org/licenses/BSD-3-Clause
         */

        var base64VLQ = require('./base64-vlq')
        var util = require('./util')
        var ArraySet = require('./array-set').ArraySet
        var MappingList = require('./mapping-list').MappingList

        /**
         * An instance of the SourceMapGenerator represents a source map which is
         * being built incrementally. You may pass an object with the following
         * properties:
         *
         *   - file: The filename of the generated source.
         *   - sourceRoot: A root for all relative URLs in this source map.
         */
        function SourceMapGenerator(aArgs) {
          if (!aArgs) {
            aArgs = {}
          }
          this._file = util.getArg(aArgs, 'file', null)
          this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null)
          this._skipValidation = util.getArg(aArgs, 'skipValidation', false)
          this._sources = new ArraySet()
          this._names = new ArraySet()
          this._mappings = new MappingList()
          this._sourcesContents = null
        }

        SourceMapGenerator.prototype._version = 3

        /**
         * Creates a new SourceMapGenerator based on a SourceMapConsumer
         *
         * @param aSourceMapConsumer The SourceMap.
         */
        SourceMapGenerator.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
          var sourceRoot = aSourceMapConsumer.sourceRoot
          var generator = new SourceMapGenerator({
            file: aSourceMapConsumer.file,
            sourceRoot: sourceRoot,
          })
          aSourceMapConsumer.eachMapping(function (mapping) {
            var newMapping = {
              generated: {
                line: mapping.generatedLine,
                column: mapping.generatedColumn,
              },
            }

            if (mapping.source != null) {
              newMapping.source = mapping.source
              if (sourceRoot != null) {
                newMapping.source = util.relative(sourceRoot, newMapping.source)
              }

              newMapping.original = {
                line: mapping.originalLine,
                column: mapping.originalColumn,
              }

              if (mapping.name != null) {
                newMapping.name = mapping.name
              }
            }

            generator.addMapping(newMapping)
          })
          aSourceMapConsumer.sources.forEach(function (sourceFile) {
            var sourceRelative = sourceFile
            if (sourceRoot !== null) {
              sourceRelative = util.relative(sourceRoot, sourceFile)
            }

            if (!generator._sources.has(sourceRelative)) {
              generator._sources.add(sourceRelative)
            }

            var content = aSourceMapConsumer.sourceContentFor(sourceFile)
            if (content != null) {
              generator.setSourceContent(sourceFile, content)
            }
          })
          return generator
        }

        /**
         * Add a single mapping from original source line and column to the generated
         * source's line and column for this source map being created. The mapping
         * object should have the following properties:
         *
         *   - generated: An object with the generated line and column positions.
         *   - original: An object with the original line and column positions.
         *   - source: The original source file (relative to the sourceRoot).
         *   - name: An optional original token name for this mapping.
         */
        SourceMapGenerator.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
          var generated = util.getArg(aArgs, 'generated')
          var original = util.getArg(aArgs, 'original', null)
          var source = util.getArg(aArgs, 'source', null)
          var name = util.getArg(aArgs, 'name', null)

          if (!this._skipValidation) {
            this._validateMapping(generated, original, source, name)
          }

          if (source != null) {
            source = String(source)
            if (!this._sources.has(source)) {
              this._sources.add(source)
            }
          }

          if (name != null) {
            name = String(name)
            if (!this._names.has(name)) {
              this._names.add(name)
            }
          }

          this._mappings.add({
            generatedLine: generated.line,
            generatedColumn: generated.column,
            originalLine: original != null && original.line,
            originalColumn: original != null && original.column,
            source: source,
            name: name,
          })
        }

        /**
         * Set the source content for a source file.
         */
        SourceMapGenerator.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(
          aSourceFile,
          aSourceContent,
        ) {
          var source = aSourceFile
          if (this._sourceRoot != null) {
            source = util.relative(this._sourceRoot, source)
          }

          if (aSourceContent != null) {
            // Add the source content to the _sourcesContents map.
            // Create a new _sourcesContents map if the property is null.
            if (!this._sourcesContents) {
              this._sourcesContents = Object.create(null)
            }
            this._sourcesContents[util.toSetString(source)] = aSourceContent
          } else if (this._sourcesContents) {
            // Remove the source file from the _sourcesContents map.
            // If the _sourcesContents map is empty, set the property to null.
            delete this._sourcesContents[util.toSetString(source)]
            if (Object.keys(this._sourcesContents).length === 0) {
              this._sourcesContents = null
            }
          }
        }

        /**
         * Applies the mappings of a sub-source-map for a specific source file to the
         * source map being generated. Each mapping to the supplied source file is
         * rewritten using the supplied source map. Note: The resolution for the
         * resulting mappings is the minimium of this map and the supplied map.
         *
         * @param aSourceMapConsumer The source map to be applied.
         * @param aSourceFile Optional. The filename of the source file.
         *        If omitted, SourceMapConsumer's file property will be used.
         * @param aSourceMapPath Optional. The dirname of the path to the source map
         *        to be applied. If relative, it is relative to the SourceMapConsumer.
         *        This parameter is needed when the two source maps aren't in the same
         *        directory, and the source map to be applied contains relative source
         *        paths. If so, those relative source paths need to be rewritten
         *        relative to the SourceMapGenerator.
         */
        SourceMapGenerator.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(
          aSourceMapConsumer,
          aSourceFile,
          aSourceMapPath,
        ) {
          var sourceFile = aSourceFile
          // If aSourceFile is omitted, we will use the file property of the SourceMap
          if (aSourceFile == null) {
            if (aSourceMapConsumer.file == null) {
              throw new Error(
                'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
                  'or the source map\'s "file" property. Both were omitted.',
              )
            }
            sourceFile = aSourceMapConsumer.file
          }
          var sourceRoot = this._sourceRoot
          // Make "sourceFile" relative if an absolute Url is passed.
          if (sourceRoot != null) {
            sourceFile = util.relative(sourceRoot, sourceFile)
          }
          // Applying the SourceMap can add and remove items from the sources and
          // the names array.
          var newSources = new ArraySet()
          var newNames = new ArraySet()

          // Find mappings for the "sourceFile"
          this._mappings.unsortedForEach(function (mapping) {
            if (mapping.source === sourceFile && mapping.originalLine != null) {
              // Check if it can be mapped by the source map, then update the mapping.
              var original = aSourceMapConsumer.originalPositionFor({
                line: mapping.originalLine,
                column: mapping.originalColumn,
              })
              if (original.source != null) {
                // Copy mapping
                mapping.source = original.source
                if (aSourceMapPath != null) {
                  mapping.source = util.join(aSourceMapPath, mapping.source)
                }
                if (sourceRoot != null) {
                  mapping.source = util.relative(sourceRoot, mapping.source)
                }
                mapping.originalLine = original.line
                mapping.originalColumn = original.column
                if (original.name != null) {
                  mapping.name = original.name
                }
              }
            }

            var source = mapping.source
            if (source != null && !newSources.has(source)) {
              newSources.add(source)
            }

            var name = mapping.name
            if (name != null && !newNames.has(name)) {
              newNames.add(name)
            }
          }, this)
          this._sources = newSources
          this._names = newNames

          // Copy sourcesContents of applied map.
          aSourceMapConsumer.sources.forEach(function (sourceFile) {
            var content = aSourceMapConsumer.sourceContentFor(sourceFile)
            if (content != null) {
              if (aSourceMapPath != null) {
                sourceFile = util.join(aSourceMapPath, sourceFile)
              }
              if (sourceRoot != null) {
                sourceFile = util.relative(sourceRoot, sourceFile)
              }
              this.setSourceContent(sourceFile, content)
            }
          }, this)
        }

        /**
         * A mapping can have one of the three levels of data:
         *
         *   1. Just the generated position.
         *   2. The Generated position, original position, and original source.
         *   3. Generated and original position, original source, as well as a name
         *      token.
         *
         * To maintain consistency, we validate that any new mapping being added falls
         * in to one of these categories.
         */
        SourceMapGenerator.prototype._validateMapping = function SourceMapGenerator_validateMapping(
          aGenerated,
          aOriginal,
          aSource,
          aName,
        ) {
          // When aOriginal is truthy but has empty values for .line and .column,
          // it is most likely a programmer error. In this case we throw a very
          // specific error message to try to guide them the right way.
          // For example: https://github.com/Polymer/polymer-bundler/pull/519
          if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
            throw new Error(
              'original.line and original.column are not numbers -- you probably meant to omit ' +
                'the original mapping entirely and only map the generated position. If so, pass ' +
                'null for the original mapping instead of an object with empty or null values.',
            )
          }

          if (
            aGenerated &&
            'line' in aGenerated &&
            'column' in aGenerated &&
            aGenerated.line > 0 &&
            aGenerated.column >= 0 &&
            !aOriginal &&
            !aSource &&
            !aName
          ) {
            // Case 1.
            return
          } else if (
            aGenerated &&
            'line' in aGenerated &&
            'column' in aGenerated &&
            aOriginal &&
            'line' in aOriginal &&
            'column' in aOriginal &&
            aGenerated.line > 0 &&
            aGenerated.column >= 0 &&
            aOriginal.line > 0 &&
            aOriginal.column >= 0 &&
            aSource
          ) {
            // Cases 2 and 3.
            return
          } else {
            throw new Error(
              'Invalid mapping: ' +
                JSON.stringify({
                  generated: aGenerated,
                  source: aSource,
                  original: aOriginal,
                  name: aName,
                }),
            )
          }
        }

        /**
         * Serialize the accumulated mappings in to the stream of base 64 VLQs
         * specified by the source map format.
         */
        SourceMapGenerator.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
          var previousGeneratedColumn = 0
          var previousGeneratedLine = 1
          var previousOriginalColumn = 0
          var previousOriginalLine = 0
          var previousName = 0
          var previousSource = 0
          var result = ''
          var next
          var mapping
          var nameIdx
          var sourceIdx

          var mappings = this._mappings.toArray()
          for (var i = 0, len = mappings.length; i < len; i++) {
            mapping = mappings[i]
            next = ''

            if (mapping.generatedLine !== previousGeneratedLine) {
              previousGeneratedColumn = 0
              while (mapping.generatedLine !== previousGeneratedLine) {
                next += ';'
                previousGeneratedLine++
              }
            } else {
              if (i > 0) {
                if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
                  continue
                }
                next += ','
              }
            }

            next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn)
            previousGeneratedColumn = mapping.generatedColumn

            if (mapping.source != null) {
              sourceIdx = this._sources.indexOf(mapping.source)
              next += base64VLQ.encode(sourceIdx - previousSource)
              previousSource = sourceIdx

              // lines are stored 0-based in SourceMap spec version 3
              next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine)
              previousOriginalLine = mapping.originalLine - 1

              next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn)
              previousOriginalColumn = mapping.originalColumn

              if (mapping.name != null) {
                nameIdx = this._names.indexOf(mapping.name)
                next += base64VLQ.encode(nameIdx - previousName)
                previousName = nameIdx
              }
            }

            result += next
          }

          return result
        }

        SourceMapGenerator.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(
          aSources,
          aSourceRoot,
        ) {
          return aSources.map(function (source) {
            if (!this._sourcesContents) {
              return null
            }
            if (aSourceRoot != null) {
              source = util.relative(aSourceRoot, source)
            }
            var key = util.toSetString(source)
            return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null
          }, this)
        }

        /**
         * Externalize the source map.
         */
        SourceMapGenerator.prototype.toJSON = function SourceMapGenerator_toJSON() {
          var map = {
            version: this._version,
            sources: this._sources.toArray(),
            names: this._names.toArray(),
            mappings: this._serializeMappings(),
          }
          if (this._file != null) {
            map.file = this._file
          }
          if (this._sourceRoot != null) {
            map.sourceRoot = this._sourceRoot
          }
          if (this._sourcesContents) {
            map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot)
          }

          return map
        }

        /**
         * Render the source map being generated to a string.
         */
        SourceMapGenerator.prototype.toString = function SourceMapGenerator_toString() {
          return JSON.stringify(this.toJSON())
        }

        exports.SourceMapGenerator = SourceMapGenerator
      },
      { './array-set': 11, './base64-vlq': 12, './mapping-list': 15, './util': 20 },
    ],
    19: [
      function (require, module, exports) {
        /* -*- Mode: js; js-indent-level: 2; -*- */
        /*
         * Copyright 2011 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE or:
         * http://opensource.org/licenses/BSD-3-Clause
         */

        var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator
        var util = require('./util')

        // Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
        // operating systems these days (capturing the result).
        var REGEX_NEWLINE = /(\r?\n)/

        // Newline character code for charCodeAt() comparisons
        var NEWLINE_CODE = 10

        // Private symbol for identifying `SourceNode`s when multiple versions of
        // the source-map library are loaded. This MUST NOT CHANGE across
        // versions!
        var isSourceNode = '$$$isSourceNode$$$'

        /**
         * SourceNodes provide a way to abstract over interpolating/concatenating
         * snippets of generated JavaScript source code while maintaining the line and
         * column information associated with the original source code.
         *
         * @param aLine The original line number.
         * @param aColumn The original column number.
         * @param aSource The original source's filename.
         * @param aChunks Optional. An array of strings which are snippets of
         *        generated JS, or other SourceNodes.
         * @param aName The original identifier.
         */
        function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
          this.children = []
          this.sourceContents = {}
          this.line = aLine == null ? null : aLine
          this.column = aColumn == null ? null : aColumn
          this.source = aSource == null ? null : aSource
          this.name = aName == null ? null : aName
          this[isSourceNode] = true
          if (aChunks != null) this.add(aChunks)
        }

        /**
         * Creates a SourceNode from generated code and a SourceMapConsumer.
         *
         * @param aGeneratedCode The generated code
         * @param aSourceMapConsumer The SourceMap for the generated code
         * @param aRelativePath Optional. The path that relative sources in the
         *        SourceMapConsumer should be relative to.
         */
        SourceNode.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(
          aGeneratedCode,
          aSourceMapConsumer,
          aRelativePath,
        ) {
          // The SourceNode we want to fill with the generated code
          // and the SourceMap
          var node = new SourceNode()

          // All even indices of this array are one line of the generated code,
          // while all odd indices are the newlines between two adjacent lines
          // (since `REGEX_NEWLINE` captures its match).
          // Processed fragments are accessed by calling `shiftNextLine`.
          var remainingLines = aGeneratedCode.split(REGEX_NEWLINE)
          var remainingLinesIndex = 0
          var shiftNextLine = function () {
            var lineContents = getNextLine()
            // The last line of a file might not have a newline.
            var newLine = getNextLine() || ''
            return lineContents + newLine

            function getNextLine() {
              return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : undefined
            }
          }

          // We need to remember the position of "remainingLines"
          var lastGeneratedLine = 1,
            lastGeneratedColumn = 0

          // The generate SourceNodes we need a code range.
          // To extract it current and last mapping is used.
          // Here we store the last mapping.
          var lastMapping = null

          aSourceMapConsumer.eachMapping(function (mapping) {
            if (lastMapping !== null) {
              // We add the code from "lastMapping" to "mapping":
              // First check if there is a new line in between.
              if (lastGeneratedLine < mapping.generatedLine) {
                // Associate first line with "lastMapping"
                addMappingWithCode(lastMapping, shiftNextLine())
                lastGeneratedLine++
                lastGeneratedColumn = 0
                // The remaining code is added without mapping
              } else {
                // There is no new line in between.
                // Associate the code between "lastGeneratedColumn" and
                // "mapping.generatedColumn" with "lastMapping"
                var nextLine = remainingLines[remainingLinesIndex] || ''
                var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn)
                remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn)
                lastGeneratedColumn = mapping.generatedColumn
                addMappingWithCode(lastMapping, code)
                // No more remaining code, continue
                lastMapping = mapping
                return
              }
            }
            // We add the generated code until the first mapping
            // to the SourceNode without any mapping.
            // Each line is added as separate string.
            while (lastGeneratedLine < mapping.generatedLine) {
              node.add(shiftNextLine())
              lastGeneratedLine++
            }
            if (lastGeneratedColumn < mapping.generatedColumn) {
              var nextLine = remainingLines[remainingLinesIndex] || ''
              node.add(nextLine.substr(0, mapping.generatedColumn))
              remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn)
              lastGeneratedColumn = mapping.generatedColumn
            }
            lastMapping = mapping
          }, this)
          // We have processed all mappings.
          if (remainingLinesIndex < remainingLines.length) {
            if (lastMapping) {
              // Associate the remaining code in the current line with "lastMapping"
              addMappingWithCode(lastMapping, shiftNextLine())
            }
            // and add the remaining lines without any mapping
            node.add(remainingLines.splice(remainingLinesIndex).join(''))
          }

          // Copy sourcesContent into SourceNode
          aSourceMapConsumer.sources.forEach(function (sourceFile) {
            var content = aSourceMapConsumer.sourceContentFor(sourceFile)
            if (content != null) {
              if (aRelativePath != null) {
                sourceFile = util.join(aRelativePath, sourceFile)
              }
              node.setSourceContent(sourceFile, content)
            }
          })

          return node

          function addMappingWithCode(mapping, code) {
            if (mapping === null || mapping.source === undefined) {
              node.add(code)
            } else {
              var source = aRelativePath ? util.join(aRelativePath, mapping.source) : mapping.source
              node.add(new SourceNode(mapping.originalLine, mapping.originalColumn, source, code, mapping.name))
            }
          }
        }

        /**
         * Add a chunk of generated JS to this source node.
         *
         * @param aChunk A string snippet of generated JS code, another instance of
         *        SourceNode, or an array where each member is one of those things.
         */
        SourceNode.prototype.add = function SourceNode_add(aChunk) {
          if (Array.isArray(aChunk)) {
            aChunk.forEach(function (chunk) {
              this.add(chunk)
            }, this)
          } else if (aChunk[isSourceNode] || typeof aChunk === 'string') {
            if (aChunk) {
              this.children.push(aChunk)
            }
          } else {
            throw new TypeError('Expected a SourceNode, string, or an array of SourceNodes and strings. Got ' + aChunk)
          }
          return this
        }

        /**
         * Add a chunk of generated JS to the beginning of this source node.
         *
         * @param aChunk A string snippet of generated JS code, another instance of
         *        SourceNode, or an array where each member is one of those things.
         */
        SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
          if (Array.isArray(aChunk)) {
            for (var i = aChunk.length - 1; i >= 0; i--) {
              this.prepend(aChunk[i])
            }
          } else if (aChunk[isSourceNode] || typeof aChunk === 'string') {
            this.children.unshift(aChunk)
          } else {
            throw new TypeError('Expected a SourceNode, string, or an array of SourceNodes and strings. Got ' + aChunk)
          }
          return this
        }

        /**
         * Walk over the tree of JS snippets in this node and its children. The
         * walking function is called once for each snippet of JS and is passed that
         * snippet and the its original associated source's line/column location.
         *
         * @param aFn The traversal function.
         */
        SourceNode.prototype.walk = function SourceNode_walk(aFn) {
          var chunk
          for (var i = 0, len = this.children.length; i < len; i++) {
            chunk = this.children[i]
            if (chunk[isSourceNode]) {
              chunk.walk(aFn)
            } else {
              if (chunk !== '') {
                aFn(chunk, { source: this.source, line: this.line, column: this.column, name: this.name })
              }
            }
          }
        }

        /**
         * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
         * each of `this.children`.
         *
         * @param aSep The separator.
         */
        SourceNode.prototype.join = function SourceNode_join(aSep) {
          var newChildren
          var i
          var len = this.children.length
          if (len > 0) {
            newChildren = []
            for (i = 0; i < len - 1; i++) {
              newChildren.push(this.children[i])
              newChildren.push(aSep)
            }
            newChildren.push(this.children[i])
            this.children = newChildren
          }
          return this
        }

        /**
         * Call String.prototype.replace on the very right-most source snippet. Useful
         * for trimming whitespace from the end of a source node, etc.
         *
         * @param aPattern The pattern to replace.
         * @param aReplacement The thing to replace the pattern with.
         */
        SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
          var lastChild = this.children[this.children.length - 1]
          if (lastChild[isSourceNode]) {
            lastChild.replaceRight(aPattern, aReplacement)
          } else if (typeof lastChild === 'string') {
            this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement)
          } else {
            this.children.push(''.replace(aPattern, aReplacement))
          }
          return this
        }

        /**
         * Set the source content for a source file. This will be added to the SourceMapGenerator
         * in the sourcesContent field.
         *
         * @param aSourceFile The filename of the source file
         * @param aSourceContent The content of the source file
         */
        SourceNode.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
          this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent
        }

        /**
         * Walk over the tree of SourceNodes. The walking function is called for each
         * source file content and is passed the filename and source content.
         *
         * @param aFn The traversal function.
         */
        SourceNode.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
          for (var i = 0, len = this.children.length; i < len; i++) {
            if (this.children[i][isSourceNode]) {
              this.children[i].walkSourceContents(aFn)
            }
          }

          var sources = Object.keys(this.sourceContents)
          for (var i = 0, len = sources.length; i < len; i++) {
            aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]])
          }
        }

        /**
         * Return the string representation of this source node. Walks over the tree
         * and concatenates all the various snippets together to one string.
         */
        SourceNode.prototype.toString = function SourceNode_toString() {
          var str = ''
          this.walk(function (chunk) {
            str += chunk
          })
          return str
        }

        /**
         * Returns the string representation of this source node along with a source
         * map.
         */
        SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
          var generated = {
            code: '',
            line: 1,
            column: 0,
          }
          var map = new SourceMapGenerator(aArgs)
          var sourceMappingActive = false
          var lastOriginalSource = null
          var lastOriginalLine = null
          var lastOriginalColumn = null
          var lastOriginalName = null
          this.walk(function (chunk, original) {
            generated.code += chunk
            if (original.source !== null && original.line !== null && original.column !== null) {
              if (
                lastOriginalSource !== original.source ||
                lastOriginalLine !== original.line ||
                lastOriginalColumn !== original.column ||
                lastOriginalName !== original.name
              ) {
                map.addMapping({
                  source: original.source,
                  original: {
                    line: original.line,
                    column: original.column,
                  },
                  generated: {
                    line: generated.line,
                    column: generated.column,
                  },
                  name: original.name,
                })
              }
              lastOriginalSource = original.source
              lastOriginalLine = original.line
              lastOriginalColumn = original.column
              lastOriginalName = original.name
              sourceMappingActive = true
            } else if (sourceMappingActive) {
              map.addMapping({
                generated: {
                  line: generated.line,
                  column: generated.column,
                },
              })
              lastOriginalSource = null
              sourceMappingActive = false
            }
            for (var idx = 0, length = chunk.length; idx < length; idx++) {
              if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
                generated.line++
                generated.column = 0
                // Mappings end at eol
                if (idx + 1 === length) {
                  lastOriginalSource = null
                  sourceMappingActive = false
                } else if (sourceMappingActive) {
                  map.addMapping({
                    source: original.source,
                    original: {
                      line: original.line,
                      column: original.column,
                    },
                    generated: {
                      line: generated.line,
                      column: generated.column,
                    },
                    name: original.name,
                  })
                }
              } else {
                generated.column++
              }
            }
          })
          this.walkSourceContents(function (sourceFile, sourceContent) {
            map.setSourceContent(sourceFile, sourceContent)
          })

          return { code: generated.code, map: map }
        }

        exports.SourceNode = SourceNode
      },
      { './source-map-generator': 18, './util': 20 },
    ],
    20: [
      function (require, module, exports) {
        /* -*- Mode: js; js-indent-level: 2; -*- */
        /*
         * Copyright 2011 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE or:
         * http://opensource.org/licenses/BSD-3-Clause
         */

        /**
         * This is a helper function for getting values from parameter/options
         * objects.
         *
         * @param args The object we are extracting values from
         * @param name The name of the property we are getting.
         * @param defaultValue An optional value to return if the property is missing
         * from the object. If this is not specified and the property is missing, an
         * error will be thrown.
         */
        function getArg(aArgs, aName, aDefaultValue) {
          if (aName in aArgs) {
            return aArgs[aName]
          } else if (arguments.length === 3) {
            return aDefaultValue
          } else {
            throw new Error('"' + aName + '" is a required argument.')
          }
        }
        exports.getArg = getArg

        var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/
        var dataUrlRegexp = /^data:.+\,.+$/

        function urlParse(aUrl) {
          var match = aUrl.match(urlRegexp)
          if (!match) {
            return null
          }
          return {
            scheme: match[1],
            auth: match[2],
            host: match[3],
            port: match[4],
            path: match[5],
          }
        }
        exports.urlParse = urlParse

        function urlGenerate(aParsedUrl) {
          var url = ''
          if (aParsedUrl.scheme) {
            url += aParsedUrl.scheme + ':'
          }
          url += '//'
          if (aParsedUrl.auth) {
            url += aParsedUrl.auth + '@'
          }
          if (aParsedUrl.host) {
            url += aParsedUrl.host
          }
          if (aParsedUrl.port) {
            url += ':' + aParsedUrl.port
          }
          if (aParsedUrl.path) {
            url += aParsedUrl.path
          }
          return url
        }
        exports.urlGenerate = urlGenerate

        /**
         * Normalizes a path, or the path portion of a URL:
         *
         * - Replaces consecutive slashes with one slash.
         * - Removes unnecessary '.' parts.
         * - Removes unnecessary '<dir>/..' parts.
         *
         * Based on code in the Node.js 'path' core module.
         *
         * @param aPath The path or url to normalize.
         */
        function normalize(aPath) {
          var path = aPath
          var url = urlParse(aPath)
          if (url) {
            if (!url.path) {
              return aPath
            }
            path = url.path
          }
          var isAbsolute = exports.isAbsolute(path)

          var parts = path.split(/\/+/)
          for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
            part = parts[i]
            if (part === '.') {
              parts.splice(i, 1)
            } else if (part === '..') {
              up++
            } else if (up > 0) {
              if (part === '') {
                // The first part is blank if the path is absolute. Trying to go
                // above the root is a no-op. Therefore we can remove all '..' parts
                // directly after the root.
                parts.splice(i + 1, up)
                up = 0
              } else {
                parts.splice(i, 2)
                up--
              }
            }
          }
          path = parts.join('/')

          if (path === '') {
            path = isAbsolute ? '/' : '.'
          }

          if (url) {
            url.path = path
            return urlGenerate(url)
          }
          return path
        }
        exports.normalize = normalize

        /**
         * Joins two paths/URLs.
         *
         * @param aRoot The root path or URL.
         * @param aPath The path or URL to be joined with the root.
         *
         * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
         *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
         *   first.
         * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
         *   is updated with the result and aRoot is returned. Otherwise the result
         *   is returned.
         *   - If aPath is absolute, the result is aPath.
         *   - Otherwise the two paths are joined with a slash.
         * - Joining for example 'http://' and 'www.example.com' is also supported.
         */
        function join(aRoot, aPath) {
          if (aRoot === '') {
            aRoot = '.'
          }
          if (aPath === '') {
            aPath = '.'
          }
          var aPathUrl = urlParse(aPath)
          var aRootUrl = urlParse(aRoot)
          if (aRootUrl) {
            aRoot = aRootUrl.path || '/'
          }

          // `join(foo, '//www.example.org')`
          if (aPathUrl && !aPathUrl.scheme) {
            if (aRootUrl) {
              aPathUrl.scheme = aRootUrl.scheme
            }
            return urlGenerate(aPathUrl)
          }

          if (aPathUrl || aPath.match(dataUrlRegexp)) {
            return aPath
          }

          // `join('http://', 'www.example.com')`
          if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
            aRootUrl.host = aPath
            return urlGenerate(aRootUrl)
          }

          var joined = aPath.charAt(0) === '/' ? aPath : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath)

          if (aRootUrl) {
            aRootUrl.path = joined
            return urlGenerate(aRootUrl)
          }
          return joined
        }
        exports.join = join

        exports.isAbsolute = function (aPath) {
          return aPath.charAt(0) === '/' || urlRegexp.test(aPath)
        }

        /**
         * Make a path relative to a URL or another path.
         *
         * @param aRoot The root path or URL.
         * @param aPath The path or URL to be made relative to aRoot.
         */
        function relative(aRoot, aPath) {
          if (aRoot === '') {
            aRoot = '.'
          }

          aRoot = aRoot.replace(/\/$/, '')

          // It is possible for the path to be above the root. In this case, simply
          // checking whether the root is a prefix of the path won't work. Instead, we
          // need to remove components from the root one by one, until either we find
          // a prefix that fits, or we run out of components to remove.
          var level = 0
          while (aPath.indexOf(aRoot + '/') !== 0) {
            var index = aRoot.lastIndexOf('/')
            if (index < 0) {
              return aPath
            }

            // If the only part of the root that is left is the scheme (i.e. http://,
            // file:///, etc.), one or more slashes (/), or simply nothing at all, we
            // have exhausted all components, so the path is not relative to the root.
            aRoot = aRoot.slice(0, index)
            if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
              return aPath
            }

            ++level
          }

          // Make sure we add a "../" for each component we removed from the root.
          return Array(level + 1).join('../') + aPath.substr(aRoot.length + 1)
        }
        exports.relative = relative

        var supportsNullProto = (function () {
          var obj = Object.create(null)
          return !('__proto__' in obj)
        })()

        function identity(s) {
          return s
        }

        /**
         * Because behavior goes wacky when you set `__proto__` on objects, we
         * have to prefix all the strings in our set with an arbitrary character.
         *
         * See https://github.com/mozilla/source-map/pull/31 and
         * https://github.com/mozilla/source-map/issues/30
         *
         * @param String aStr
         */
        function toSetString(aStr) {
          if (isProtoString(aStr)) {
            return '$' + aStr
          }

          return aStr
        }
        exports.toSetString = supportsNullProto ? identity : toSetString

        function fromSetString(aStr) {
          if (isProtoString(aStr)) {
            return aStr.slice(1)
          }

          return aStr
        }
        exports.fromSetString = supportsNullProto ? identity : fromSetString

        function isProtoString(s) {
          if (!s) {
            return false
          }

          var length = s.length

          if (length < 9 /* "__proto__".length */) {
            return false
          }

          if (
            s.charCodeAt(length - 1) !== 95 /* '_' */ ||
            s.charCodeAt(length - 2) !== 95 /* '_' */ ||
            s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
            s.charCodeAt(length - 4) !== 116 /* 't' */ ||
            s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
            s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
            s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
            s.charCodeAt(length - 8) !== 95 /* '_' */ ||
            s.charCodeAt(length - 9) !== 95 /* '_' */
          ) {
            return false
          }

          for (var i = length - 10; i >= 0; i--) {
            if (s.charCodeAt(i) !== 36 /* '$' */) {
              return false
            }
          }

          return true
        }

        /**
         * Comparator between two mappings where the original positions are compared.
         *
         * Optionally pass in `true` as `onlyCompareGenerated` to consider two
         * mappings with the same original source/line/column, but different generated
         * line and column the same. Useful when searching for a mapping with a
         * stubbed out mapping.
         */
        function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
          var cmp = strcmp(mappingA.source, mappingB.source)
          if (cmp !== 0) {
            return cmp
          }

          cmp = mappingA.originalLine - mappingB.originalLine
          if (cmp !== 0) {
            return cmp
          }

          cmp = mappingA.originalColumn - mappingB.originalColumn
          if (cmp !== 0 || onlyCompareOriginal) {
            return cmp
          }

          cmp = mappingA.generatedColumn - mappingB.generatedColumn
          if (cmp !== 0) {
            return cmp
          }

          cmp = mappingA.generatedLine - mappingB.generatedLine
          if (cmp !== 0) {
            return cmp
          }

          return strcmp(mappingA.name, mappingB.name)
        }
        exports.compareByOriginalPositions = compareByOriginalPositions

        /**
         * Comparator between two mappings with deflated source and name indices where
         * the generated positions are compared.
         *
         * Optionally pass in `true` as `onlyCompareGenerated` to consider two
         * mappings with the same generated line and column, but different
         * source/name/original line and column the same. Useful when searching for a
         * mapping with a stubbed out mapping.
         */
        function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
          var cmp = mappingA.generatedLine - mappingB.generatedLine
          if (cmp !== 0) {
            return cmp
          }

          cmp = mappingA.generatedColumn - mappingB.generatedColumn
          if (cmp !== 0 || onlyCompareGenerated) {
            return cmp
          }

          cmp = strcmp(mappingA.source, mappingB.source)
          if (cmp !== 0) {
            return cmp
          }

          cmp = mappingA.originalLine - mappingB.originalLine
          if (cmp !== 0) {
            return cmp
          }

          cmp = mappingA.originalColumn - mappingB.originalColumn
          if (cmp !== 0) {
            return cmp
          }

          return strcmp(mappingA.name, mappingB.name)
        }
        exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated

        function strcmp(aStr1, aStr2) {
          if (aStr1 === aStr2) {
            return 0
          }

          if (aStr1 === null) {
            return 1 // aStr2 !== null
          }

          if (aStr2 === null) {
            return -1 // aStr1 !== null
          }

          if (aStr1 > aStr2) {
            return 1
          }

          return -1
        }

        /**
         * Comparator between two mappings with inflated source and name strings where
         * the generated positions are compared.
         */
        function compareByGeneratedPositionsInflated(mappingA, mappingB) {
          var cmp = mappingA.generatedLine - mappingB.generatedLine
          if (cmp !== 0) {
            return cmp
          }

          cmp = mappingA.generatedColumn - mappingB.generatedColumn
          if (cmp !== 0) {
            return cmp
          }

          cmp = strcmp(mappingA.source, mappingB.source)
          if (cmp !== 0) {
            return cmp
          }

          cmp = mappingA.originalLine - mappingB.originalLine
          if (cmp !== 0) {
            return cmp
          }

          cmp = mappingA.originalColumn - mappingB.originalColumn
          if (cmp !== 0) {
            return cmp
          }

          return strcmp(mappingA.name, mappingB.name)
        }
        exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated

        /**
         * Strip any JSON XSSI avoidance prefix from the string (as documented
         * in the source maps specification), and then parse the string as
         * JSON.
         */
        function parseSourceMapInput(str) {
          return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''))
        }
        exports.parseSourceMapInput = parseSourceMapInput

        /**
         * Compute the URL of a source given the the source root, the source's
         * URL, and the source map's URL.
         */
        function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
          sourceURL = sourceURL || ''

          if (sourceRoot) {
            // This follows what Chrome does.
            if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
              sourceRoot += '/'
            }
            // The spec says:
            //   Line 4: An optional source root, useful for relocating source
            //   files on a server or removing repeated values in the
            //   “sources” entry.  This value is prepended to the individual
            //   entries in the “source” field.
            sourceURL = sourceRoot + sourceURL
          }

          // Historically, SourceMapConsumer did not take the sourceMapURL as
          // a parameter.  This mode is still somewhat supported, which is why
          // this code block is conditional.  However, it's preferable to pass
          // the source map URL to SourceMapConsumer, so that this function
          // can implement the source URL resolution algorithm as outlined in
          // the spec.  This block is basically the equivalent of:
          //    new URL(sourceURL, sourceMapURL).toString()
          // ... except it avoids using URL, which wasn't available in the
          // older releases of node still supported by this library.
          //
          // The spec says:
          //   If the sources are not absolute URLs after prepending of the
          //   “sourceRoot”, the sources are resolved relative to the
          //   SourceMap (like resolving script src in a html document).
          if (sourceMapURL) {
            var parsed = urlParse(sourceMapURL)
            if (!parsed) {
              throw new Error('sourceMapURL could not be parsed')
            }
            if (parsed.path) {
              // Strip the last path component, but keep the "/".
              var index = parsed.path.lastIndexOf('/')
              if (index >= 0) {
                parsed.path = parsed.path.substring(0, index + 1)
              }
            }
            sourceURL = join(urlGenerate(parsed), sourceURL)
          }

          return normalize(sourceURL)
        }
        exports.computeSourceURL = computeSourceURL
      },
      {},
    ],
    21: [
      function (require, module, exports) {
        /*
         * Copyright 2009-2011 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE.txt or:
         * http://opensource.org/licenses/BSD-3-Clause
         */
        exports.SourceMapGenerator = require('./lib/source-map-generator').SourceMapGenerator
        exports.SourceMapConsumer = require('./lib/source-map-consumer').SourceMapConsumer
        exports.SourceNode = require('./lib/source-node').SourceNode
      },
      { './lib/source-map-consumer': 17, './lib/source-map-generator': 18, './lib/source-node': 19 },
    ],
    22: [
      function (require, module, exports) {
        'use strict'

        module.exports = (arr_, pred) => {
          const arr = arr_ || [],
            spans = []

          let span = { label: undefined, items: [arr.first] }

          arr.forEach((x) => {
            const label = pred(x)

            if (span.label !== label && span.items.length) {
              spans.push((span = { label: label, items: [x] }))
            } else {
              span.items.push(x)
            }
          })

          return spans
        }
      },
      {},
    ],
    23: [
      function (require, module, exports) {
        ;(function (process) {
          'use strict'

          /*  ------------------------------------------------------------------------ */

          const O = Object,
            isBrowser = typeof window !== 'undefined' && window.window === window && window.navigator,
            nodeRequire = isBrowser ? null : module.require, // to prevent bundlers from expanding the require call
            lastOf = (x) => x[x.length - 1],
            getSource = require('get-source'),
            partition = require('./impl/partition'),
            asTable = require('as-table'),
            nixSlashes = (x) => x.replace(/\\/g, '/'),
            pathRoot = isBrowser ? window.location.href : nixSlashes(process.cwd()) + '/'

          /*  ------------------------------------------------------------------------ */

          class StackTracey {
            constructor(input, offset) {
              const originalInput = input,
                isParseableSyntaxError = input && input instanceof SyntaxError && !isBrowser

              /*  new StackTracey ()            */

              if (!input) {
                input = new Error()
                offset = offset === undefined ? 1 : offset
              }

              /*  new StackTracey (Error)      */

              if (input instanceof Error) {
                input = input.stack || ''
              }

              /*  new StackTracey (string)     */

              if (typeof input === 'string') {
                input = this.rawParse(input)
                  .slice(offset)
                  .map((x) => this.extractEntryMetadata(x))
              }

              /*  new StackTracey (array)      */

              if (Array.isArray(input)) {
                if (isParseableSyntaxError) {
                  const rawLines = nodeRequire('util').inspect(originalInput).split('\n'),
                    fileLine = rawLines[0].split(':'),
                    line = fileLine.pop(),
                    file = fileLine.join(':')

                  if (file) {
                    input.unshift({
                      file: nixSlashes(file),
                      line: line,
                      column: (rawLines[2] || '').indexOf('^') + 1,
                      sourceLine: rawLines[1],
                      callee: '(syntax error)',
                      syntaxError: true,
                    })
                  }
                }

                this.items = input
              } else {
                this.items = []
              }
            }

            extractEntryMetadata(e) {
              const decomposedPath = this.decomposePath(e.file || '')
              const fileRelative = decomposedPath[0]
              const externalDomain = decomposedPath[1]

              return O.assign(e, {
                calleeShort: e.calleeShort || lastOf((e.callee || '').split('.')),
                fileRelative: fileRelative,
                fileShort: this.shortenPath(fileRelative),
                fileName: lastOf((e.file || '').split('/')),
                thirdParty: this.isThirdParty(fileRelative, externalDomain) && !e.index,
                externalDomain: externalDomain,
              })
            }

            shortenPath(relativePath) {
              return relativePath
                .replace(/^node_modules\//, '')
                .replace(/^webpack\/bootstrap\//, '')
                .replace(/^__parcel_source_root\//, '')
            }

            decomposePath(fullPath) {
              let result = fullPath

              if (isBrowser) result = result.replace(pathRoot, '')

              const externalDomainMatch = result.match(/^(http|https)\:\/\/?([^\/]+)\/(.*)/)
              const externalDomain = externalDomainMatch ? externalDomainMatch[2] : undefined
              result = externalDomainMatch ? externalDomainMatch[3] : result

              if (!isBrowser) result = nodeRequire('path').relative(pathRoot, result)

              return [
                nixSlashes(result).replace(/^.*\:\/\/?\/?/, ''), // cut webpack:/// and webpack:/ things
                externalDomain,
              ]
            }

            isThirdParty(relativePath, externalDomain) {
              return (
                externalDomain ||
                relativePath[0] === '~' || // webpack-specific heuristic
                relativePath[0] === '/' || // external source
                relativePath.indexOf('node_modules') === 0 ||
                relativePath.indexOf('webpack/bootstrap') === 0
              )
            }

            rawParse(str) {
              const lines = (str || '').split('\n')

              const entries = lines.map((line) => {
                line = line.trim()

                let callee,
                  fileLineColumn = [],
                  native,
                  planA,
                  planB

                if (
                  (planA = line.match(/at (.+) \(eval at .+ \((.+)\), .+\)/)) || // eval calls
                  (planA = line.match(/at (.+) \((.+)\)/)) ||
                  (line.slice(0, 3) !== 'at ' && (planA = line.match(/(.*)@(.*)/)))
                ) {
                  callee = planA[1]
                  native = planA[2] === 'native'
                  fileLineColumn = (planA[2].match(/(.*):(\d+):(\d+)/) || planA[2].match(/(.*):(\d+)/) || []).slice(1)
                } else if ((planB = line.match(/^(at\s+)*(.+):(\d+):(\d+)/))) {
                  fileLineColumn = planB.slice(2)
                } else {
                  return undefined
                }

                /*  Detect things like Array.reduce
            TODO: detect more built-in types            */

                if (callee && !fileLineColumn[0]) {
                  const type = callee.split('.')[0]
                  if (type === 'Array') {
                    native = true
                  }
                }

                return {
                  beforeParse: line,
                  callee: callee || '',
                  index: isBrowser && fileLineColumn[0] === window.location.href,
                  native: native || false,
                  file: nixSlashes(fileLineColumn[0] || ''),
                  line: parseInt(fileLineColumn[1] || '', 10) || undefined,
                  column: parseInt(fileLineColumn[2] || '', 10) || undefined,
                }
              })

              return entries.filter((x) => x !== undefined)
            }

            withSourceAt(i) {
              return this.items[i] && this.withSource(this.items[i])
            }

            withSourceAsyncAt(i) {
              return this.items[i] && this.withSourceAsync(this.items[i])
            }

            withSource(loc) {
              if (this.shouldSkipResolving(loc)) {
                return loc
              } else {
                let resolved = getSource(loc.file || '').resolve(loc)

                if (!resolved.sourceFile) {
                  return loc
                }

                return this.withSourceResolved(loc, resolved)
              }
            }

            withSourceAsync(loc) {
              if (this.shouldSkipResolving(loc)) {
                return Promise.resolve(loc)
              } else {
                return getSource
                  .async(loc.file || '')
                  .then((x) => x.resolve(loc))
                  .then((resolved) => this.withSourceResolved(loc, resolved))
                  .catch((e) => this.withSourceResolved(loc, { error: e, sourceLine: '' }))
              }
            }

            shouldSkipResolving(loc) {
              return loc.sourceFile || loc.error || (loc.file && loc.file.indexOf('<') >= 0) // skip things like <anonymous> and stuff that was already fetched
            }

            withSourceResolved(loc, resolved) {
              if (resolved.sourceFile && !resolved.sourceFile.error) {
                resolved.file = nixSlashes(resolved.sourceFile.path)
                resolved = this.extractEntryMetadata(resolved)
              }

              if (resolved.sourceLine.includes('// @hide')) {
                resolved.sourceLine = resolved.sourceLine.replace('// @hide', '')
                resolved.hide = true
              }

              if (
                resolved.sourceLine.includes('__webpack_require__') || // webpack-specific heuristics
                resolved.sourceLine.includes('/******/ ({')
              ) {
                resolved.thirdParty = true
              }

              return O.assign({ sourceLine: '' }, loc, resolved)
            }

            withSources() {
              return this.map((x) => this.withSource(x))
            }

            withSourcesAsync() {
              return Promise.all(this.items.map((x) => this.withSourceAsync(x))).then((items) => new StackTracey(items))
            }

            mergeRepeatedLines() {
              return new StackTracey(
                partition(this.items, (e) => e.file + e.line).map((group) => {
                  return group.items.slice(1).reduce((memo, entry) => {
                    memo.callee = (memo.callee || '<anonymous>') + ' → ' + (entry.callee || '<anonymous>')
                    memo.calleeShort =
                      (memo.calleeShort || '<anonymous>') + ' → ' + (entry.calleeShort || '<anonymous>')
                    return memo
                  }, O.assign({}, group.items[0]))
                }),
              )
            }

            clean() {
              const s = this.withSources().mergeRepeatedLines()
              return s.filter(s.isClean.bind(s))
            }

            cleanAsync() {
              return this.withSourcesAsync().then((s) => {
                s = s.mergeRepeatedLines()
                return s.filter(s.isClean.bind(s))
              })
            }

            isClean(entry, index) {
              return index === 0 || !(entry.thirdParty || entry.hide || entry.native)
            }

            at(i) {
              return O.assign(
                {
                  beforeParse: '',
                  callee: '<???>',
                  index: false,
                  native: false,
                  file: '<???>',
                  line: 0,
                  column: 0,
                },
                this.items[i],
              )
            }

            asTable(opts) {
              const maxColumnWidths = (opts && opts.maxColumnWidths) || this.maxColumnWidths()

              const trimEnd = (s, n) => s && (s.length > n ? s.slice(0, n - 1) + '…' : s)
              const trimStart = (s, n) => s && (s.length > n ? '…' + s.slice(-(n - 1)) : s)

              const trimmed = this.map((e) => [
                'at ' + trimEnd(e.calleeShort, maxColumnWidths.callee),
                trimStart((e.fileShort && e.fileShort + ':' + e.line) || '', maxColumnWidths.file),
                trimEnd((e.sourceLine || '').trim() || '', maxColumnWidths.sourceLine),
              ])

              return asTable(trimmed.items)
            }

            maxColumnWidths() {
              return {
                callee: 30,
                file: 60,
                sourceLine: 80,
              }
            }

            static resetCache() {
              getSource.resetCache()
              getSource.async.resetCache()
            }

            static locationsEqual(a, b) {
              return a.file === b.file && a.line === b.line && a.column === b.column
            }
          }

          /*  Array methods
    ------------------------------------------------------------------------ */

          ;['map', 'filter', 'slice', 'concat'].forEach((method) => {
            StackTracey.prototype[method] = function (/*...args */) {
              // no support for ...args in Node v4 :(
              return new StackTracey(this.items[method].apply(this.items, arguments))
            }
          })

          /*  ------------------------------------------------------------------------ */

          module.exports = StackTracey
        }.call(this, require('_process')))
      },
      { './impl/partition': 22, _process: 10, 'as-table': 1, 'get-source': 5 },
    ],
    24: [
      function (require, module, exports) {
        'use strict'

        var _panicOverlay = _interopRequireDefault(require('./panic-overlay'))

        function _interopRequireDefault(obj) {
          return obj && obj.__esModule ? obj : { default: obj }
        }

        /*  Entry point for Browserify bundle (generated at `build/panic-overlay.browser.js`)  */
        window.panic = _panicOverlay['default']
      },
      { './panic-overlay': 25 },
    ],
    25: [
      function (require, module, exports) {
        'use strict'

        Object.defineProperty(exports, '__esModule', {
          value: true,
        })
        exports['default'] = void 0

        var _stacktracey = _interopRequireDefault(require('stacktracey'))

        var _path = _interopRequireDefault(require('get-source/impl/path'))

        function _interopRequireDefault(obj) {
          return obj && obj.__esModule ? obj : { default: obj }
        }

        function _toConsumableArray(arr) {
          return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread()
        }

        function _nonIterableSpread() {
          throw new TypeError('Invalid attempt to spread non-iterable instance')
        }

        function _arrayWithoutHoles(arr) {
          if (Array.isArray(arr)) {
            for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
              arr2[i] = arr[i]
            }
            return arr2
          }
        }

        function _typeof(obj) {
          if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
            _typeof = function _typeof(obj) {
              return typeof obj
            }
          } else {
            _typeof = function _typeof(obj) {
              return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
                ? 'symbol'
                : typeof obj
            }
          }
          return _typeof(obj)
        }

        function _slicedToArray(arr, i) {
          return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest()
        }

        function _iterableToArrayLimit(arr, i) {
          var _arr = []
          var _n = true
          var _d = false
          var _e = undefined
          try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
              _arr.push(_s.value)
              if (i && _arr.length === i) break
            }
          } catch (err) {
            _d = true
            _e = err
          } finally {
            try {
              if (!_n && _i['return'] != null) _i['return']()
            } finally {
              if (_d) throw _e
            }
          }
          return _arr
        }

        function _toArray(arr) {
          return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest()
        }

        function _nonIterableRest() {
          throw new TypeError('Invalid attempt to destructure non-iterable instance')
        }

        function _iterableToArray(iter) {
          if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === '[object Arguments]')
            return Array.from(iter)
        }

        function _arrayWithHoles(arr) {
          if (Array.isArray(arr)) return arr
        }

        var assign = Object.assign
        var min = Math.min,
          max = Math.max
        /*  DOM HELPERS --------------------------------------------------------------------    */

        var nanoscript = function nanoscript() {
          var classPrefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ''
          return function createElement(tagIdClasses) {
            var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}
            var children = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : []

            if (props instanceof Node || typeof props === 'string' || Array.isArray(props)) {
              children = props
              props = {}
            }

            if (children && !Array.isArray(children)) children = [children]

            var _tagIdClasses$split = tagIdClasses.split('.'),
              _tagIdClasses$split2 = _toArray(_tagIdClasses$split),
              tagId = _tagIdClasses$split2[0],
              classes = _tagIdClasses$split2.slice(1)

            var _tagId$split = tagId.split('#'),
              _tagId$split2 = _slicedToArray(_tagId$split, 2),
              tag = _tagId$split2[0],
              id = _tagId$split2[1]

            var el = document.createElement(tag || 'div')
            if (id) el.id = id
            var _iteratorNormalCompletion = true
            var _didIteratorError = false
            var _iteratorError = undefined

            try {
              for (
                var _iterator = classes[Symbol.iterator](), _step;
                !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
                _iteratorNormalCompletion = true
              ) {
                var c = _step.value
                el.classList.add(classPrefix + c)
              }
            } catch (err) {
              _didIteratorError = true
              _iteratorError = err
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator['return'] != null) {
                  _iterator['return']()
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError
                }
              }
            }

            var _iteratorNormalCompletion2 = true
            var _didIteratorError2 = false
            var _iteratorError2 = undefined

            try {
              for (
                var _iterator2 = children[Symbol.iterator](), _step2;
                !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done);
                _iteratorNormalCompletion2 = true
              ) {
                var _c = _step2.value
                if (_c) el.appendChild(typeof _c === 'string' ? document.createTextNode(_c) : _c)
              }
            } catch (err) {
              _didIteratorError2 = true
              _iteratorError2 = err
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2['return'] != null) {
                  _iterator2['return']()
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2
                }
              }
            }

            return assign(el, props)
          }
        }

        var h = nanoscript('panic-overlay__')
        /*  CSS --------------------------------------------------------------------------    */

        var style = h(
          'style',
          "\n\n.panic-overlay__modal {\n    \n    position: fixed;\n    top: 0;\n    right: 0;\n    bottom: 0;\n    left: 0;\n    background:white;\n    z-index: 10000;\n    box-sizing: border-box;\n    overflow-y: scroll;\n    overflow-x: hidden;\n    font-size:18px;\n    --left-pad: 60px;\n}\n\n.panic-overlay__modal,\n.panic-overlay__modal * {\n    display: block;\n    padding: 0;\n    margin: 0;\n    font-family: Menlo, Monaco, \"Courier New\", Courier, monospace;\n}\n\n.panic-overlay__modal span,\n.panic-overlay__modal em,\n.panic-overlay__modal strong {\n    display: inline;\n}\n\n.panic-overlay strong {\n    font-weight: bold;\n}\n\n.panic-overlay__hidden {\n    display: none;\n}\n\n.panic-overlay__modal h1 {\n\n    color: black;\n    margin: 0;\n    padding: 0;\n    font-size: 1.77em;\n    font-weight: 600;\n    opacity: 0.75;\n    margin-top:50px;\n    margin-bottom:45px;\n    position: relative;\n    padding-left: var(--left-pad);\n}\n\n.panic-overlay__close {\n    color: black;\n    font-weight: normal;\n    text-decoration: none;\n    position: absolute;\n    top:-0.32em;\n    right: 1em;\n    font-size: 1.77em;\n    opacity: 0.15;\n    transition: all 0.25s ease-in-out;\n}\n\n.panic-overlay__close:hover {\n    transform:scale(1.5);\n    opacity: 0.25;\n}\n\n.panic-overlay__error {\n    margin: 1em 0 3em 0;\n    left:0;\n}\n\n.panic-overlay__error-title {\n    display: flex;\n    align-items: stretch;\n    padding-right: 50px;\n}\n\n.panic-overlay__error-type {\n    min-height: 2.8em;\n    display: flex !important;\n    align-items: center;\n    padding:0 1em;\n    background: rgb(255, 0, 64);\n    color: white;\n    margin-right: 2em;\n    padding-left: var(--left-pad);\n    white-space: nowrap;\n}\n\n.panic-overlay__error-counter {\n    color: white;\n    opacity: 0.3;\n    position: absolute;\n    left: 0.8em;\n}\n\n.panic-overlay__error-message {\n    display: flex !important;\n    align-items: center;\n    font-weight:400;\n    line-height: 1em;\n}\n\n.panic-overlay__error-stack {\n    margin-top: 2em;\n    white-space: pre;\n    padding-left: var(--left-pad);\n}\n\n.panic-overlay__stack-entry {\n    cursor: pointer;\n    margin-bottom: 2.5em;\n}\n\n.panic-overlay__collapsed .panic-overlay__stack-entry-hidden {\n    display: none;\n}\n\n.panic-overlay__file {\n    font-weight: bold;\n    margin-top: 2.5em;\n    margin-bottom: 1.5em;\n    color: rgb(202, 17, 63);\n}\n\n.panic-overlay__file strong {\n    text-decoration: underline;\n}\n\n.panic-overlay__file:before,\n.panic-overlay__more:before {\n    content: '@ ';\n    opacity: 0.5;\n    margin-left: -1.25em;\n}\n\n.panic-overlay__more:before {\n    content: '\u25B7 ';\n    opacity: 0.5;\n}\n\n.panic-overlay__more {\n    opacity: 0.25;\n    color: black;\n    font-size: 0.835em;\n    cursor: pointer;\n    text-align: center;\n    display: none;\n}\n\n.panic-overlay__more em {\n    font-style: normal;\n    font-weight: normal;\n    border-bottom: 1px dashed black;\n}\n\n.panic-overlay__collapsed .panic-overlay__more {\n    display: block;\n}\n\n.panic-overlay__lines {\n    color:rgb(187, 165, 165);\n    font-size: 0.835em;\n}\n\n.panic-overlay__lines:not(.panic-overlay__no-fade) {\n    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 75%, rgba(0,0,0,0));\n    mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 75%, rgba(0,0,0,0));\n}\n\n.panic-overlay__line-number { \n    padding-right: 1.5em;\n    opacity: 0.5;\n}\n\n.panic-overlay__line-hili {\n    background: #ffff78;\n    color: #5f4545;\n}\n\n.panic-overlay__stack-entry:first-child .panic-overlay__line-hili strong {\n    text-decoration: underline wavy #ff0040;\n}\n\n.panic-overlay__line-hili em {\n    font-style: italic;\n    color: rgb(255, 0, 64);\n    font-size: 0.75em;\n    margin-left: 2em;\n    opacity: 0.25;\n    position: relative;\n    top: -0.115em;\n    white-space: nowrap;\n}\n\n.panic-overlay__line-hili em:before {\n    content: '\u2190 ';\n}\n\n.panic-overlay__no-source {\n    font-style: italic;\n}\n\n@media only screen and (max-width: 640px) {\n\n    .panic-overlay__modal {\n        font-size: 15px;\n        --left-pad: 50px;\n    }\n    \n    .panic-overlay__modal h1 {\n        margin:40px 0;\n    }\n}\n\n@media only screen and (max-width: 500px) {\n    \n    .panic-overlay__modal {\n        font-size: 14px;\n        --left-pad: 45px;\n    }\n    \n    .panic-overlay__modal h1 {\n        margin:30px 0;\n    }\n}\n\n",
        )
        /*  CONFIGURATION --------------------------------------------------------------------------    */

        var defaultConfig = {
          handleErrors: true,
          projectRoot: undefined,
          stackEntryClicked: function stackEntryClicked(entry) {
            if (this.projectRoot) {
              window.location = 'vscode://file/'
                .concat(_path['default'].concat(this.projectRoot, entry.fileRelative), ':')
                .concat(entry.line, ':')
                .concat(entry.column)
            }
          },
        }
        var config = defaultConfig
        /*  RENDERING --------------------------------------------------------------------------    */

        var errors = h('.errors')
        var modal = h('.modal.hidden.collapsed', [
          h('h1', [
            'Oops :(',
            h(
              'a.close',
              {
                href: '#',
                onclick: function onclick() {
                  toggle(false)
                },
              },
              '×',
            ),
          ]),
          errors,
        ])

        var shouldHideEntry = function shouldHideEntry(entry, i) {
          return (entry.thirdParty || entry['native'] || entry.hide) && i !== 0
        }

        function renderStackEntry(entry, i, message) {
          var _entry$sourceFile = entry.sourceFile,
            sourceFile =
              _entry$sourceFile === void 0
                ? {
                    lines: [],
                  }
                : _entry$sourceFile,
            line = entry.line,
            column = entry.column,
            fileShort = entry.fileShort,
            calleeShort = entry.calleeShort
          var lineIndex = line - 1
          var maxLines = sourceFile.lines.length
          var window = 4
          var start = lineIndex - window,
            end = lineIndex + window + 2

          if (start < 0) {
            end = min(end - start, maxLines)
            start = 0
          }

          if (end > maxLines) {
            start = max(0, start - (end - maxLines))
            end = maxLines
          }

          var lines = sourceFile.lines.slice(start, end)
          var lineNumberWidth = String(start + lines.length).length
          var hiliIndex = line - start - 1
          var hiliMsg = i === 0 ? message : ''
          var onLastLine = hiliIndex === lines.length - 1
          var className = '.stack-entry' + (shouldHideEntry(entry, i) ? '.stack-entry-hidden' : '')
          return h(
            className,
            {
              onclick: function onclick() {
                config.stackEntryClicked(entry)
              },
            },
            [
              h('.file', h('strong', fileShort)),
              h(
                '.lines' + (onLastLine ? '.no-fade' : ''),
                lines.length
                  ? lines.map(function (text, i) {
                      return h('.line' + (i === hiliIndex ? '.line-hili' : ''), [
                        h('span.line-number', String(start + i + 1).padStart(lineNumberWidth, ' ')),
                        h('span.line-text', i === hiliIndex ? renderHighlightedLine(text, column, hiliMsg) : text),
                      ])
                    })
                  : [
                      h('.line', [
                        h('span.line-number', String(line)),
                        h(
                          'span.line-text.no-source',
                          '\u2026 somewhere at '.concat(calleeShort ? calleeShort + '()' : '???', ' \u2026'),
                        ),
                      ]),
                    ],
              ),
            ],
          )
        }

        function renderHighlightedLine(text, column, msg) {
          var _ref = [text.slice(0, column - 1), text.slice(column - 1)],
            before = _ref[0],
            after = _ref[1]
          return [
            before,
            h('strong', after),
            /*, msg && h ('em', msg)*/
          ]
        }

        function panic(err) {
          var stack = new _stacktracey['default'](err).withSources()
          var indexText = stack.clean().asTable() // Deduplication

          var _iteratorNormalCompletion3 = true
          var _didIteratorError3 = false
          var _iteratorError3 = undefined

          try {
            for (
              var _iterator3 = errors.childNodes[Symbol.iterator](), _step3;
              !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done);
              _iteratorNormalCompletion3 = true
            ) {
              var _el = _step3.value

              if (_el._indexText === indexText) {
                assign(_el.querySelector('.panic-overlay__error-counter'), {
                  innerText: (_el._counter = (_el._counter || 1) + 1),
                  style: '',
                })
                return
              }
            }
          } catch (err) {
            _didIteratorError3 = true
            _iteratorError3 = err
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3['return'] != null) {
                _iterator3['return']()
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3
              }
            }
          }

          var showMore = function showMore() {
            return modal.classList.remove('panic-overlay__collapsed')
          }

          var type = String((err && (err.type || (err.constructor && err.constructor.name))) || _typeof(err))
          var msg = String(err && err.message)
          var el = h(
            '.error',
            {
              _indexText: indexText,
            },
            [
              h('.error-title', [
                h('span.error-type', [
                  type,
                  h('span.error-counter', {
                    style: 'display: none;',
                  }),
                ]),
                h('span.error-message', msg),
              ]),
              h(
                '.error-stack',
                [].concat(
                  _toConsumableArray(
                    stack.items.map(function (e, i) {
                      return renderStackEntry(e, i, msg)
                    }),
                  ),
                  [
                    h(
                      '.more',
                      h(
                        'em',
                        {
                          onclick: showMore,
                        },
                        'show more',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          )
          if (!stack.items.find(shouldHideEntry)) showMore() // hides "show more" if nothing to show

          errors.insertBefore(el, errors.firstChild)
          if (errors.childElementCount > 10) errors.lastChild.remove() // prevents hang in case of vast number of errors

          toggle(true)
          return panic
        }
        /*  VISIBILITY ON/OFF --------------------------------------------------------------------------    */

        var visible = false

        function toggle(yes) {
          if (document.body) {
            if (yes) {
              document.head.appendChild(style)
              document.body.appendChild(modal)
            }

            document.body.classList.toggle('panic-overlay__visible', yes)
          }

          modal.classList.toggle('panic-overlay__hidden', !yes)

          if (visible && !yes) {
            // clear on hide
            errors.innerText = ''
            modal.classList.add('panic-overlay__collapsed')
          }

          visible = yes
          return panic
        }
        /*  EVENTS --------------------------------------------------------------------------    */

        function onUncaughtError(e) {
          if (config.handleErrors) panic(e)
        }

        window.addEventListener('error', function (e) {
          return onUncaughtError(e.error)
        })
        window.addEventListener('unhandledrejection', function (e) {
          return onUncaughtError(e.reason)
        })
        ;(function onReady(fn) {
          if (document.body) fn()
          else document.addEventListener('DOMContentLoaded', fn)
        })(function () {
          toggle(visible)
        })
        /*  EXPORT --------------------------------------------------------------------------    */

        panic.toggle = toggle

        panic.configure = function configure(cfg) {
          assign(config, defaultConfig, cfg)
          return panic
        }

        var _default = panic
        exports['default'] = _default
      },
      { 'get-source/impl/path': 7, stacktracey: 23 },
    ],
  },
  {},
  [24],
)
