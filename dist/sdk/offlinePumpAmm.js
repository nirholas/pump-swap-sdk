"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/.pnpm/base64-js@1.5.1/node_modules/base64-js/index.js
var require_base64_js = __commonJS({
  "node_modules/.pnpm/base64-js@1.5.1/node_modules/base64-js/index.js"(exports) {
    "use strict";
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    var i;
    var len;
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len2 = b64.length;
      if (len2 % 4 > 0) {
        throw new Error("Invalid string. Length must be a multiple of 4");
      }
      var validLen = b64.indexOf("=");
      if (validLen === -1) validLen = len2;
      var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
      return [validLen, placeHoldersLen];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function _byteLength(b64, validLen, placeHoldersLen) {
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
      var i2;
      for (i2 = 0; i2 < len2; i2 += 4) {
        tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
        arr[curByte++] = tmp >> 16 & 255;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      return arr;
    }
    function tripletToBase64(num) {
      return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i2 = start; i2 < end; i2 += 3) {
        tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len2 = uint8.length;
      var extraBytes = len2 % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
        parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
      }
      if (extraBytes === 1) {
        tmp = uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
        );
      } else if (extraBytes === 2) {
        tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
        );
      }
      return parts.join("");
    }
  }
});

// node_modules/.pnpm/ieee754@1.2.1/node_modules/ieee754/index.js
var require_ieee754 = __commonJS({
  "node_modules/.pnpm/ieee754@1.2.1/node_modules/ieee754/index.js"(exports) {
    "use strict";
    exports.read = function(buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? nBytes - 1 : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];
      i += d;
      e = s & (1 << -nBits) - 1;
      s >>= -nBits;
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      m = e & (1 << -nBits) - 1;
      e >>= -nBits;
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : (s ? -1 : 1) * Infinity;
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    };
    exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
      var i = isLE ? 0 : nBytes - 1;
      var d = isLE ? 1 : -1;
      var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
      value = Math.abs(value);
      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }
        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }
      for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
      }
      e = e << mLen | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
      }
      buffer[offset + i - d] |= s * 128;
    };
  }
});

// node_modules/.pnpm/buffer@6.0.3/node_modules/buffer/index.js
var require_buffer = __commonJS({
  "node_modules/.pnpm/buffer@6.0.3/node_modules/buffer/index.js"(exports) {
    "use strict";
    var base64 = require_base64_js();
    var ieee754 = require_ieee754();
    var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
    exports.Buffer = Buffer3;
    exports.SlowBuffer = SlowBuffer;
    exports.INSPECT_MAX_BYTES = 50;
    var K_MAX_LENGTH = 2147483647;
    exports.kMaxLength = K_MAX_LENGTH;
    Buffer3.TYPED_ARRAY_SUPPORT = typedArraySupport();
    if (!Buffer3.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
      console.error(
        "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
      );
    }
    function typedArraySupport() {
      try {
        const arr = new Uint8Array(1);
        const proto = { foo: function() {
          return 42;
        } };
        Object.setPrototypeOf(proto, Uint8Array.prototype);
        Object.setPrototypeOf(arr, proto);
        return arr.foo() === 42;
      } catch (e) {
        return false;
      }
    }
    Object.defineProperty(Buffer3.prototype, "parent", {
      enumerable: true,
      get: function() {
        if (!Buffer3.isBuffer(this)) return void 0;
        return this.buffer;
      }
    });
    Object.defineProperty(Buffer3.prototype, "offset", {
      enumerable: true,
      get: function() {
        if (!Buffer3.isBuffer(this)) return void 0;
        return this.byteOffset;
      }
    });
    function createBuffer(length) {
      if (length > K_MAX_LENGTH) {
        throw new RangeError('The value "' + length + '" is invalid for option "size"');
      }
      const buf = new Uint8Array(length);
      Object.setPrototypeOf(buf, Buffer3.prototype);
      return buf;
    }
    function Buffer3(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        if (typeof encodingOrOffset === "string") {
          throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          );
        }
        return allocUnsafe(arg);
      }
      return from(arg, encodingOrOffset, length);
    }
    Buffer3.poolSize = 8192;
    function from(value, encodingOrOffset, length) {
      if (typeof value === "string") {
        return fromString(value, encodingOrOffset);
      }
      if (ArrayBuffer.isView(value)) {
        return fromArrayView(value);
      }
      if (value == null) {
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof value === "number") {
        throw new TypeError(
          'The "value" argument must not be of type number. Received type number'
        );
      }
      const valueOf = value.valueOf && value.valueOf();
      if (valueOf != null && valueOf !== value) {
        return Buffer3.from(valueOf, encodingOrOffset, length);
      }
      const b = fromObject(value);
      if (b) return b;
      if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
        return Buffer3.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
      }
      throw new TypeError(
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
      );
    }
    Buffer3.from = function(value, encodingOrOffset, length) {
      return from(value, encodingOrOffset, length);
    };
    Object.setPrototypeOf(Buffer3.prototype, Uint8Array.prototype);
    Object.setPrototypeOf(Buffer3, Uint8Array);
    function assertSize(size) {
      if (typeof size !== "number") {
        throw new TypeError('"size" argument must be of type number');
      } else if (size < 0) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
      }
    }
    function alloc(size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(size);
      }
      if (fill !== void 0) {
        return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
      }
      return createBuffer(size);
    }
    Buffer3.alloc = function(size, fill, encoding) {
      return alloc(size, fill, encoding);
    };
    function allocUnsafe(size) {
      assertSize(size);
      return createBuffer(size < 0 ? 0 : checked(size) | 0);
    }
    Buffer3.allocUnsafe = function(size) {
      return allocUnsafe(size);
    };
    Buffer3.allocUnsafeSlow = function(size) {
      return allocUnsafe(size);
    };
    function fromString(string, encoding) {
      if (typeof encoding !== "string" || encoding === "") {
        encoding = "utf8";
      }
      if (!Buffer3.isEncoding(encoding)) {
        throw new TypeError("Unknown encoding: " + encoding);
      }
      const length = byteLength(string, encoding) | 0;
      let buf = createBuffer(length);
      const actual = buf.write(string, encoding);
      if (actual !== length) {
        buf = buf.slice(0, actual);
      }
      return buf;
    }
    function fromArrayLike(array) {
      const length = array.length < 0 ? 0 : checked(array.length) | 0;
      const buf = createBuffer(length);
      for (let i = 0; i < length; i += 1) {
        buf[i] = array[i] & 255;
      }
      return buf;
    }
    function fromArrayView(arrayView) {
      if (isInstance(arrayView, Uint8Array)) {
        const copy = new Uint8Array(arrayView);
        return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
      }
      return fromArrayLike(arrayView);
    }
    function fromArrayBuffer(array, byteOffset, length) {
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds');
      }
      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds');
      }
      let buf;
      if (byteOffset === void 0 && length === void 0) {
        buf = new Uint8Array(array);
      } else if (length === void 0) {
        buf = new Uint8Array(array, byteOffset);
      } else {
        buf = new Uint8Array(array, byteOffset, length);
      }
      Object.setPrototypeOf(buf, Buffer3.prototype);
      return buf;
    }
    function fromObject(obj) {
      if (Buffer3.isBuffer(obj)) {
        const len = checked(obj.length) | 0;
        const buf = createBuffer(len);
        if (buf.length === 0) {
          return buf;
        }
        obj.copy(buf, 0, 0, len);
        return buf;
      }
      if (obj.length !== void 0) {
        if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
          return createBuffer(0);
        }
        return fromArrayLike(obj);
      }
      if (obj.type === "Buffer" && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
      }
    }
    function checked(length) {
      if (length >= K_MAX_LENGTH) {
        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
      }
      return length | 0;
    }
    function SlowBuffer(length) {
      if (+length != length) {
        length = 0;
      }
      return Buffer3.alloc(+length);
    }
    Buffer3.isBuffer = function isBuffer(b) {
      return b != null && b._isBuffer === true && b !== Buffer3.prototype;
    };
    Buffer3.compare = function compare(a, b) {
      if (isInstance(a, Uint8Array)) a = Buffer3.from(a, a.offset, a.byteLength);
      if (isInstance(b, Uint8Array)) b = Buffer3.from(b, b.offset, b.byteLength);
      if (!Buffer3.isBuffer(a) || !Buffer3.isBuffer(b)) {
        throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
      }
      if (a === b) return 0;
      let x = a.length;
      let y = b.length;
      for (let i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    Buffer3.isEncoding = function isEncoding(encoding) {
      switch (String(encoding).toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return true;
        default:
          return false;
      }
    };
    Buffer3.concat = function concat(list, length) {
      if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }
      if (list.length === 0) {
        return Buffer3.alloc(0);
      }
      let i;
      if (length === void 0) {
        length = 0;
        for (i = 0; i < list.length; ++i) {
          length += list[i].length;
        }
      }
      const buffer = Buffer3.allocUnsafe(length);
      let pos = 0;
      for (i = 0; i < list.length; ++i) {
        let buf = list[i];
        if (isInstance(buf, Uint8Array)) {
          if (pos + buf.length > buffer.length) {
            if (!Buffer3.isBuffer(buf)) buf = Buffer3.from(buf);
            buf.copy(buffer, pos);
          } else {
            Uint8Array.prototype.set.call(
              buffer,
              buf,
              pos
            );
          }
        } else if (!Buffer3.isBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        } else {
          buf.copy(buffer, pos);
        }
        pos += buf.length;
      }
      return buffer;
    };
    function byteLength(string, encoding) {
      if (Buffer3.isBuffer(string)) {
        return string.length;
      }
      if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
        return string.byteLength;
      }
      if (typeof string !== "string") {
        throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string
        );
      }
      const len = string.length;
      const mustMatch = arguments.length > 2 && arguments[2] === true;
      if (!mustMatch && len === 0) return 0;
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "ascii":
          case "latin1":
          case "binary":
            return len;
          case "utf8":
          case "utf-8":
            return utf8ToBytes(string).length;
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return len * 2;
          case "hex":
            return len >>> 1;
          case "base64":
            return base64ToBytes(string).length;
          default:
            if (loweredCase) {
              return mustMatch ? -1 : utf8ToBytes(string).length;
            }
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer3.byteLength = byteLength;
    function slowToString(encoding, start, end) {
      let loweredCase = false;
      if (start === void 0 || start < 0) {
        start = 0;
      }
      if (start > this.length) {
        return "";
      }
      if (end === void 0 || end > this.length) {
        end = this.length;
      }
      if (end <= 0) {
        return "";
      }
      end >>>= 0;
      start >>>= 0;
      if (end <= start) {
        return "";
      }
      if (!encoding) encoding = "utf8";
      while (true) {
        switch (encoding) {
          case "hex":
            return hexSlice(this, start, end);
          case "utf8":
          case "utf-8":
            return utf8Slice(this, start, end);
          case "ascii":
            return asciiSlice(this, start, end);
          case "latin1":
          case "binary":
            return latin1Slice(this, start, end);
          case "base64":
            return base64Slice(this, start, end);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return utf16leSlice(this, start, end);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = (encoding + "").toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer3.prototype._isBuffer = true;
    function swap(b, n, m) {
      const i = b[n];
      b[n] = b[m];
      b[m] = i;
    }
    Buffer3.prototype.swap16 = function swap16() {
      const len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 16-bits");
      }
      for (let i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this;
    };
    Buffer3.prototype.swap32 = function swap32() {
      const len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      }
      for (let i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this;
    };
    Buffer3.prototype.swap64 = function swap64() {
      const len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 64-bits");
      }
      for (let i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this;
    };
    Buffer3.prototype.toString = function toString() {
      const length = this.length;
      if (length === 0) return "";
      if (arguments.length === 0) return utf8Slice(this, 0, length);
      return slowToString.apply(this, arguments);
    };
    Buffer3.prototype.toLocaleString = Buffer3.prototype.toString;
    Buffer3.prototype.equals = function equals(b) {
      if (!Buffer3.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
      if (this === b) return true;
      return Buffer3.compare(this, b) === 0;
    };
    Buffer3.prototype.inspect = function inspect() {
      let str = "";
      const max = exports.INSPECT_MAX_BYTES;
      str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
      if (this.length > max) str += " ... ";
      return "<Buffer " + str + ">";
    };
    if (customInspectSymbol) {
      Buffer3.prototype[customInspectSymbol] = Buffer3.prototype.inspect;
    }
    Buffer3.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
      if (isInstance(target, Uint8Array)) {
        target = Buffer3.from(target, target.offset, target.byteLength);
      }
      if (!Buffer3.isBuffer(target)) {
        throw new TypeError(
          'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
        );
      }
      if (start === void 0) {
        start = 0;
      }
      if (end === void 0) {
        end = target ? target.length : 0;
      }
      if (thisStart === void 0) {
        thisStart = 0;
      }
      if (thisEnd === void 0) {
        thisEnd = this.length;
      }
      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError("out of range index");
      }
      if (thisStart >= thisEnd && start >= end) {
        return 0;
      }
      if (thisStart >= thisEnd) {
        return -1;
      }
      if (start >= end) {
        return 1;
      }
      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;
      if (this === target) return 0;
      let x = thisEnd - thisStart;
      let y = end - start;
      const len = Math.min(x, y);
      const thisCopy = this.slice(thisStart, thisEnd);
      const targetCopy = target.slice(start, end);
      for (let i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
      if (buffer.length === 0) return -1;
      if (typeof byteOffset === "string") {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 2147483647) {
        byteOffset = 2147483647;
      } else if (byteOffset < -2147483648) {
        byteOffset = -2147483648;
      }
      byteOffset = +byteOffset;
      if (numberIsNaN(byteOffset)) {
        byteOffset = dir ? 0 : buffer.length - 1;
      }
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1;
        else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1;
      }
      if (typeof val === "string") {
        val = Buffer3.from(val, encoding);
      }
      if (Buffer3.isBuffer(val)) {
        if (val.length === 0) {
          return -1;
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
      } else if (typeof val === "number") {
        val = val & 255;
        if (typeof Uint8Array.prototype.indexOf === "function") {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
          }
        }
        return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
      }
      throw new TypeError("val must be string, number or Buffer");
    }
    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
      let indexSize = 1;
      let arrLength = arr.length;
      let valLength = val.length;
      if (encoding !== void 0) {
        encoding = String(encoding).toLowerCase();
        if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
          if (arr.length < 2 || val.length < 2) {
            return -1;
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }
      function read(buf, i2) {
        if (indexSize === 1) {
          return buf[i2];
        } else {
          return buf.readUInt16BE(i2 * indexSize);
        }
      }
      let i;
      if (dir) {
        let foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          let found = true;
          for (let j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false;
              break;
            }
          }
          if (found) return i;
        }
      }
      return -1;
    }
    Buffer3.prototype.includes = function includes(val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1;
    };
    Buffer3.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
    };
    Buffer3.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
    };
    function hexWrite(buf, string, offset, length) {
      offset = Number(offset) || 0;
      const remaining = buf.length - offset;
      if (!length) {
        length = remaining;
      } else {
        length = Number(length);
        if (length > remaining) {
          length = remaining;
        }
      }
      const strLen = string.length;
      if (length > strLen / 2) {
        length = strLen / 2;
      }
      let i;
      for (i = 0; i < length; ++i) {
        const parsed = parseInt(string.substr(i * 2, 2), 16);
        if (numberIsNaN(parsed)) return i;
        buf[offset + i] = parsed;
      }
      return i;
    }
    function utf8Write(buf, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
    }
    function asciiWrite(buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length);
    }
    function base64Write(buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length);
    }
    function ucs2Write(buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
    }
    Buffer3.prototype.write = function write(string, offset, length, encoding) {
      if (offset === void 0) {
        encoding = "utf8";
        length = this.length;
        offset = 0;
      } else if (length === void 0 && typeof offset === "string") {
        encoding = offset;
        length = this.length;
        offset = 0;
      } else if (isFinite(offset)) {
        offset = offset >>> 0;
        if (isFinite(length)) {
          length = length >>> 0;
          if (encoding === void 0) encoding = "utf8";
        } else {
          encoding = length;
          length = void 0;
        }
      } else {
        throw new Error(
          "Buffer.write(string, encoding, offset[, length]) is no longer supported"
        );
      }
      const remaining = this.length - offset;
      if (length === void 0 || length > remaining) length = remaining;
      if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
        throw new RangeError("Attempt to write outside buffer bounds");
      }
      if (!encoding) encoding = "utf8";
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "hex":
            return hexWrite(this, string, offset, length);
          case "utf8":
          case "utf-8":
            return utf8Write(this, string, offset, length);
          case "ascii":
          case "latin1":
          case "binary":
            return asciiWrite(this, string, offset, length);
          case "base64":
            return base64Write(this, string, offset, length);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return ucs2Write(this, string, offset, length);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };
    Buffer3.prototype.toJSON = function toJSON() {
      return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0)
      };
    };
    function base64Slice(buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf);
      } else {
        return base64.fromByteArray(buf.slice(start, end));
      }
    }
    function utf8Slice(buf, start, end) {
      end = Math.min(buf.length, end);
      const res = [];
      let i = start;
      while (i < end) {
        const firstByte = buf[i];
        let codePoint = null;
        let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
        if (i + bytesPerSequence <= end) {
          let secondByte, thirdByte, fourthByte, tempCodePoint;
          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 128) {
                codePoint = firstByte;
              }
              break;
            case 2:
              secondByte = buf[i + 1];
              if ((secondByte & 192) === 128) {
                tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                if (tempCodePoint > 127) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 3:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 4:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              fourthByte = buf[i + 3];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }
        if (codePoint === null) {
          codePoint = 65533;
          bytesPerSequence = 1;
        } else if (codePoint > 65535) {
          codePoint -= 65536;
          res.push(codePoint >>> 10 & 1023 | 55296);
          codePoint = 56320 | codePoint & 1023;
        }
        res.push(codePoint);
        i += bytesPerSequence;
      }
      return decodeCodePointsArray(res);
    }
    var MAX_ARGUMENTS_LENGTH = 4096;
    function decodeCodePointsArray(codePoints) {
      const len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints);
      }
      let res = "";
      let i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        );
      }
      return res;
    }
    function asciiSlice(buf, start, end) {
      let ret = "";
      end = Math.min(buf.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 127);
      }
      return ret;
    }
    function latin1Slice(buf, start, end) {
      let ret = "";
      end = Math.min(buf.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i]);
      }
      return ret;
    }
    function hexSlice(buf, start, end) {
      const len = buf.length;
      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;
      let out = "";
      for (let i = start; i < end; ++i) {
        out += hexSliceLookupTable[buf[i]];
      }
      return out;
    }
    function utf16leSlice(buf, start, end) {
      const bytes = buf.slice(start, end);
      let res = "";
      for (let i = 0; i < bytes.length - 1; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res;
    }
    Buffer3.prototype.slice = function slice(start, end) {
      const len = this.length;
      start = ~~start;
      end = end === void 0 ? len : ~~end;
      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }
      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }
      if (end < start) end = start;
      const newBuf = this.subarray(start, end);
      Object.setPrototypeOf(newBuf, Buffer3.prototype);
      return newBuf;
    };
    function checkOffset(offset, ext, length) {
      if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
      if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
    }
    Buffer3.prototype.readUintLE = Buffer3.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      return val;
    };
    Buffer3.prototype.readUintBE = Buffer3.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        checkOffset(offset, byteLength2, this.length);
      }
      let val = this[offset + --byteLength2];
      let mul = 1;
      while (byteLength2 > 0 && (mul *= 256)) {
        val += this[offset + --byteLength2] * mul;
      }
      return val;
    };
    Buffer3.prototype.readUint8 = Buffer3.prototype.readUInt8 = function readUInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset];
    };
    Buffer3.prototype.readUint16LE = Buffer3.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | this[offset + 1] << 8;
    };
    Buffer3.prototype.readUint16BE = Buffer3.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] << 8 | this[offset + 1];
    };
    Buffer3.prototype.readUint32LE = Buffer3.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
    };
    Buffer3.prototype.readUint32BE = Buffer3.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
    };
    Buffer3.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
      const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
      return BigInt(lo) + (BigInt(hi) << BigInt(32));
    });
    Buffer3.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
      return (BigInt(hi) << BigInt(32)) + BigInt(lo);
    });
    Buffer3.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer3.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let i = byteLength2;
      let mul = 1;
      let val = this[offset + --i];
      while (i > 0 && (mul *= 256)) {
        val += this[offset + --i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer3.prototype.readInt8 = function readInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 128)) return this[offset];
      return (255 - this[offset] + 1) * -1;
    };
    Buffer3.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset] | this[offset + 1] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer3.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset + 1] | this[offset] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer3.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
    };
    Buffer3.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
    };
    Buffer3.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
      return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
    });
    Buffer3.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = (first << 24) + // Overflow
      this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
    });
    Buffer3.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, true, 23, 4);
    };
    Buffer3.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, false, 23, 4);
    };
    Buffer3.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, true, 52, 8);
    };
    Buffer3.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, false, 52, 8);
    };
    function checkInt(buf, value, offset, ext, max, min) {
      if (!Buffer3.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
      if (offset + ext > buf.length) throw new RangeError("Index out of range");
    }
    Buffer3.prototype.writeUintLE = Buffer3.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let mul = 1;
      let i = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeUintBE = Buffer3.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeUint8 = Buffer3.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer3.prototype.writeUint16LE = Buffer3.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer3.prototype.writeUint16BE = Buffer3.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer3.prototype.writeUint32LE = Buffer3.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 255;
      return offset + 4;
    };
    Buffer3.prototype.writeUint32BE = Buffer3.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    function wrtBigUInt64LE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      return offset;
    }
    function wrtBigUInt64BE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf[offset + 7] = lo;
      lo = lo >> 8;
      buf[offset + 6] = lo;
      lo = lo >> 8;
      buf[offset + 5] = lo;
      lo = lo >> 8;
      buf[offset + 4] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf[offset + 3] = hi;
      hi = hi >> 8;
      buf[offset + 2] = hi;
      hi = hi >> 8;
      buf[offset + 1] = hi;
      hi = hi >> 8;
      buf[offset] = hi;
      return offset + 8;
    }
    Buffer3.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer3.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer3.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = 0;
      let mul = 1;
      let sub = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      let sub = 0;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
      if (value < 0) value = 255 + value + 1;
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer3.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer3.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer3.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
      return offset + 4;
    };
    Buffer3.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      if (value < 0) value = 4294967295 + value + 1;
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    Buffer3.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    Buffer3.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    function checkIEEE754(buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError("Index out of range");
      if (offset < 0) throw new RangeError("Index out of range");
    }
    function writeFloat(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
      }
      ieee754.write(buf, value, offset, littleEndian, 23, 4);
      return offset + 4;
    }
    Buffer3.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert);
    };
    Buffer3.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert);
    };
    function writeDouble(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
      }
      ieee754.write(buf, value, offset, littleEndian, 52, 8);
      return offset + 8;
    }
    Buffer3.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert);
    };
    Buffer3.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert);
    };
    Buffer3.prototype.copy = function copy(target, targetStart, start, end) {
      if (!Buffer3.isBuffer(target)) throw new TypeError("argument should be a Buffer");
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;
      if (end === start) return 0;
      if (target.length === 0 || this.length === 0) return 0;
      if (targetStart < 0) {
        throw new RangeError("targetStart out of bounds");
      }
      if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
      if (end < 0) throw new RangeError("sourceEnd out of bounds");
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }
      const len = end - start;
      if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
        this.copyWithin(targetStart, start, end);
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, end),
          targetStart
        );
      }
      return len;
    };
    Buffer3.prototype.fill = function fill(val, start, end, encoding) {
      if (typeof val === "string") {
        if (typeof start === "string") {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === "string") {
          encoding = end;
          end = this.length;
        }
        if (encoding !== void 0 && typeof encoding !== "string") {
          throw new TypeError("encoding must be a string");
        }
        if (typeof encoding === "string" && !Buffer3.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        if (val.length === 1) {
          const code = val.charCodeAt(0);
          if (encoding === "utf8" && code < 128 || encoding === "latin1") {
            val = code;
          }
        }
      } else if (typeof val === "number") {
        val = val & 255;
      } else if (typeof val === "boolean") {
        val = Number(val);
      }
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError("Out of range index");
      }
      if (end <= start) {
        return this;
      }
      start = start >>> 0;
      end = end === void 0 ? this.length : end >>> 0;
      if (!val) val = 0;
      let i;
      if (typeof val === "number") {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        const bytes = Buffer3.isBuffer(val) ? val : Buffer3.from(val, encoding);
        const len = bytes.length;
        if (len === 0) {
          throw new TypeError('The value "' + val + '" is invalid for argument "value"');
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }
      return this;
    };
    var errors = {};
    function E(sym, getMessage, Base) {
      errors[sym] = class NodeError extends Base {
        constructor() {
          super();
          Object.defineProperty(this, "message", {
            value: getMessage.apply(this, arguments),
            writable: true,
            configurable: true
          });
          this.name = `${this.name} [${sym}]`;
          this.stack;
          delete this.name;
        }
        get code() {
          return sym;
        }
        set code(value) {
          Object.defineProperty(this, "code", {
            configurable: true,
            enumerable: true,
            value,
            writable: true
          });
        }
        toString() {
          return `${this.name} [${sym}]: ${this.message}`;
        }
      };
    }
    E(
      "ERR_BUFFER_OUT_OF_BOUNDS",
      function(name) {
        if (name) {
          return `${name} is outside of buffer bounds`;
        }
        return "Attempt to access memory outside buffer bounds";
      },
      RangeError
    );
    E(
      "ERR_INVALID_ARG_TYPE",
      function(name, actual) {
        return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
      },
      TypeError
    );
    E(
      "ERR_OUT_OF_RANGE",
      function(str, range, input) {
        let msg = `The value of "${str}" is out of range.`;
        let received = input;
        if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
          received = addNumericalSeparator(String(input));
        } else if (typeof input === "bigint") {
          received = String(input);
          if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
            received = addNumericalSeparator(received);
          }
          received += "n";
        }
        msg += ` It must be ${range}. Received ${received}`;
        return msg;
      },
      RangeError
    );
    function addNumericalSeparator(val) {
      let res = "";
      let i = val.length;
      const start = val[0] === "-" ? 1 : 0;
      for (; i >= start + 4; i -= 3) {
        res = `_${val.slice(i - 3, i)}${res}`;
      }
      return `${val.slice(0, i)}${res}`;
    }
    function checkBounds(buf, offset, byteLength2) {
      validateNumber(offset, "offset");
      if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
        boundsError(offset, buf.length - (byteLength2 + 1));
      }
    }
    function checkIntBI(value, min, max, buf, offset, byteLength2) {
      if (value > max || value < min) {
        const n = typeof min === "bigint" ? "n" : "";
        let range;
        if (byteLength2 > 3) {
          if (min === 0 || min === BigInt(0)) {
            range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
          } else {
            range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
          }
        } else {
          range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new errors.ERR_OUT_OF_RANGE("value", range, value);
      }
      checkBounds(buf, offset, byteLength2);
    }
    function validateNumber(value, name) {
      if (typeof value !== "number") {
        throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
      }
    }
    function boundsError(value, length, type) {
      if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
      }
      if (length < 0) {
        throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
      }
      throw new errors.ERR_OUT_OF_RANGE(
        type || "offset",
        `>= ${type ? 1 : 0} and <= ${length}`,
        value
      );
    }
    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
    function base64clean(str) {
      str = str.split("=")[0];
      str = str.trim().replace(INVALID_BASE64_RE, "");
      if (str.length < 2) return "";
      while (str.length % 4 !== 0) {
        str = str + "=";
      }
      return str;
    }
    function utf8ToBytes(string, units) {
      units = units || Infinity;
      let codePoint;
      const length = string.length;
      let leadSurrogate = null;
      const bytes = [];
      for (let i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);
        if (codePoint > 55295 && codePoint < 57344) {
          if (!leadSurrogate) {
            if (codePoint > 56319) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            } else if (i + 1 === length) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            }
            leadSurrogate = codePoint;
            continue;
          }
          if (codePoint < 56320) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            leadSurrogate = codePoint;
            continue;
          }
          codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
        } else if (leadSurrogate) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
        }
        leadSurrogate = null;
        if (codePoint < 128) {
          if ((units -= 1) < 0) break;
          bytes.push(codePoint);
        } else if (codePoint < 2048) {
          if ((units -= 2) < 0) break;
          bytes.push(
            codePoint >> 6 | 192,
            codePoint & 63 | 128
          );
        } else if (codePoint < 65536) {
          if ((units -= 3) < 0) break;
          bytes.push(
            codePoint >> 12 | 224,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else if (codePoint < 1114112) {
          if ((units -= 4) < 0) break;
          bytes.push(
            codePoint >> 18 | 240,
            codePoint >> 12 & 63 | 128,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else {
          throw new Error("Invalid code point");
        }
      }
      return bytes;
    }
    function asciiToBytes(str) {
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        byteArray.push(str.charCodeAt(i) & 255);
      }
      return byteArray;
    }
    function utf16leToBytes(str, units) {
      let c, hi, lo;
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break;
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }
      return byteArray;
    }
    function base64ToBytes(str) {
      return base64.toByteArray(base64clean(str));
    }
    function blitBuffer(src, dst, offset, length) {
      let i;
      for (i = 0; i < length; ++i) {
        if (i + offset >= dst.length || i >= src.length) break;
        dst[i + offset] = src[i];
      }
      return i;
    }
    function isInstance(obj, type) {
      return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
    }
    function numberIsNaN(obj) {
      return obj !== obj;
    }
    var hexSliceLookupTable = (function() {
      const alphabet = "0123456789abcdef";
      const table = new Array(256);
      for (let i = 0; i < 16; ++i) {
        const i16 = i * 16;
        for (let j = 0; j < 16; ++j) {
          table[i16 + j] = alphabet[i] + alphabet[j];
        }
      }
      return table;
    })();
    function defineBigIntMethod(fn) {
      return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
    }
    function BufferBigIntNotDefined() {
      throw new Error("BigInt not supported");
    }
  }
});

// src/sdk/offlinePumpAmm.ts
var offlinePumpAmm_exports = {};
__export(offlinePumpAmm_exports, {
  FEE_CONFIG_SIZE_POST_EXOTIC: () => FEE_CONFIG_SIZE_POST_EXOTIC,
  FEE_CONFIG_SIZE_POST_STABLE: () => FEE_CONFIG_SIZE_POST_STABLE,
  FEE_CONFIG_SIZE_PRE_STABLE: () => FEE_CONFIG_SIZE_PRE_STABLE,
  GLOBAL_CONFIG_SIZE: () => GLOBAL_CONFIG_SIZE,
  OFFLINE_PUMP_AMM_PROGRAM: () => OFFLINE_PUMP_AMM_PROGRAM,
  POOL_ACCOUNT_NEW_SIZE: () => POOL_ACCOUNT_NEW_SIZE,
  POOL_SIZE: () => POOL_SIZE,
  PUMP_AMM_SDK: () => PUMP_AMM_SDK,
  PumpAmmSdk: () => PumpAmmSdk
});
module.exports = __toCommonJS(offlinePumpAmm_exports);
var import_web36 = require("@solana/web3.js");

// src/sdk/pda.ts
var import_web3 = require("@solana/web3.js");
var import_bn = __toESM(require("bn.js"));
var import_spl_token = require("@solana/spl-token");
var import_buffer = __toESM(require_buffer());
var PUMP_PROGRAM_ID = new import_web3.PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
);
var PUMP_AMM_PROGRAM_ID = new import_web3.PublicKey(
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
);
var PUMP_FEE_PROGRAM_ID = new import_web3.PublicKey(
  "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ"
);
var PUMP_MINT = new import_web3.PublicKey(
  "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn"
);
function pumpPda(seeds) {
  return import_web3.PublicKey.findProgramAddressSync(seeds, PUMP_PROGRAM_ID)[0];
}
function pumpAmmPda(seeds) {
  return import_web3.PublicKey.findProgramAddressSync(seeds, PUMP_AMM_PROGRAM_ID)[0];
}
function pumpFeePda(seeds) {
  return import_web3.PublicKey.findProgramAddressSync(seeds, PUMP_FEE_PROGRAM_ID)[0];
}
var GLOBAL_CONFIG_PDA = pumpAmmPda([import_buffer.Buffer.from("global_config")]);
var PUMP_AMM_EVENT_AUTHORITY_PDA = pumpAmmPda([
  import_buffer.Buffer.from("__event_authority")
]);
var GLOBAL_VOLUME_ACCUMULATOR_PDA = pumpAmmPda([
  import_buffer.Buffer.from("global_volume_accumulator")
]);
var PUMP_AMM_FEE_CONFIG_PDA = pumpFeePda([
  import_buffer.Buffer.from("fee_config"),
  PUMP_AMM_PROGRAM_ID.toBuffer()
]);
var PUMP_GLOBAL_PDA = pumpPda([import_buffer.Buffer.from("global")]);
var PUMP_EVENT_AUTHORITY_PDA = pumpPda([
  import_buffer.Buffer.from("__event_authority")
]);
var PUMP_FEE_CONFIG_PDA = pumpFeePda([
  import_buffer.Buffer.from("fee_config"),
  PUMP_PROGRAM_ID.toBuffer()
]);
function pumpPoolAuthorityPda(mint) {
  return pumpPda([import_buffer.Buffer.from("pool-authority"), mint.toBuffer()]);
}
var MPL_TOKEN_METADATA_PROGRAM_ID = new import_web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
function bondingCurvePda(mint) {
  return pumpPda([import_buffer.Buffer.from("bonding-curve"), mint.toBuffer()]);
}
function metadataPda(mint) {
  return import_web3.PublicKey.findProgramAddressSync(
    [
      import_buffer.Buffer.from("metadata"),
      MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer()
    ],
    MPL_TOKEN_METADATA_PROGRAM_ID
  )[0];
}
function canonicalPoolQuoteMint(bondingCurveQuoteMint) {
  return bondingCurveQuoteMint.equals(import_web3.PublicKey.default) ? import_spl_token.NATIVE_MINT : bondingCurveQuoteMint;
}
function userVolumeAccumulatorPda(user) {
  return pumpAmmPda([import_buffer.Buffer.from("user_volume_accumulator"), user.toBuffer()]);
}
function coinCreatorVaultAuthorityPda(coinCreator) {
  return pumpAmmPda([import_buffer.Buffer.from("creator_vault"), coinCreator.toBuffer()]);
}
function coinCreatorVaultAtaPda(coinCreatorVaultAuthority, quoteMint, quoteTokenProgram) {
  return (0, import_spl_token.getAssociatedTokenAddressSync)(
    quoteMint,
    coinCreatorVaultAuthority,
    true,
    quoteTokenProgram
  );
}
function poolV2Pda(baseMint) {
  return pumpAmmPda([import_buffer.Buffer.from("pool-v2"), baseMint.toBuffer()]);
}
function boostVaultAuthorityPda(pool) {
  return pumpAmmPda([import_buffer.Buffer.from("boost_vault"), pool.toBuffer()]);
}
function boostVaultAta(boostVaultAuthority, quoteMint, quoteTokenProgram) {
  return (0, import_spl_token.getAssociatedTokenAddressSync)(
    quoteMint,
    boostVaultAuthority,
    true,
    quoteTokenProgram
  );
}

// src/sdk/offlinePumpAmm.ts
var import_spl_token4 = require("@solana/spl-token");

// src/sdk/deposit.ts
var import_bn2 = __toESM(require("bn.js"));
function depositToken0(token0, slippage, token0Reserve, token1Reserve, totalLpTokens) {
  if (slippage < 0 || slippage > 100) {
    throw new Error("Slippage must be between 0 and 100 (0% to 100%)");
  }
  const token1 = token0.mul(token1Reserve).div(token0Reserve);
  const slippageFactor = new import_bn2.default((1 + slippage / 100) * 1e9);
  const maxToken0 = token0.mul(slippageFactor).div(new import_bn2.default(1e9));
  const maxToken1 = token1.mul(slippageFactor).div(new import_bn2.default(1e9));
  const lpToken = token0.mul(totalLpTokens).div(token0Reserve);
  return {
    token1,
    lpToken,
    maxToken0,
    maxToken1
  };
}
function ceilDiv(numerator, denominator) {
  return numerator.add(denominator).sub(new import_bn2.default(1)).div(denominator);
}
function depositLpToken(lpToken, slippage, baseReserve, quoteReserve, totalLpTokens) {
  if (totalLpTokens.isZero()) {
    throw new Error("Division by zero: totalLpTokens cannot be zero");
  }
  const baseAmountIn = ceilDiv(baseReserve.mul(lpToken), totalLpTokens);
  const quoteAmountIn = ceilDiv(quoteReserve.mul(lpToken), totalLpTokens);
  const slippageFactor = new import_bn2.default((1 + slippage / 100) * 1e9);
  const slippageDenominator = new import_bn2.default(1e9);
  const maxBase = baseAmountIn.mul(slippageFactor).div(slippageDenominator);
  const maxQuote = quoteAmountIn.mul(slippageFactor).div(slippageDenominator);
  return {
    maxBase,
    maxQuote
  };
}

// src/sdk/withdraw.ts
var import_bn3 = __toESM(require("bn.js"));
function withdraw(lpAmount, slippage, baseReserve, quoteReserve, totalLpTokens) {
  if (lpAmount.isZero() || totalLpTokens.isZero()) {
    throw new Error("LP amount or total LP tokens cannot be zero.");
  }
  const base = baseReserve.mul(lpAmount).div(totalLpTokens);
  const quote = quoteReserve.mul(lpAmount).div(totalLpTokens);
  const scaleFactor = new import_bn3.default(1e9);
  const slippageFactor = new import_bn3.default((1 - slippage / 100) * 1e9);
  const minBase = base.mul(slippageFactor).div(scaleFactor);
  const minQuote = quote.mul(slippageFactor).div(scaleFactor);
  return {
    base,
    quote,
    minBase,
    minQuote
  };
}

// src/sdk/buy.ts
var import_bn5 = __toESM(require("bn.js"));
var import_web33 = require("@solana/web3.js");

// src/sdk/util.ts
var import_bn4 = __toESM(require("bn.js"));
var import_anchor = require("@coral-xyz/anchor");

// src/idl/pump_amm.json
var pump_amm_default = {
  address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
  metadata: {
    name: "pump_amm",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor"
  },
  instructions: [
    {
      name: "admin_cto_pool",
      discriminator: [
        45,
        61,
        165,
        151,
        104,
        0,
        49,
        189
      ],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "global_config"
        },
        {
          name: "pool",
          writable: true
        },
        {
          name: "pool_authority",
          signer: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  112,
                  111,
                  111,
                  108,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                kind: "account",
                path: "pool.base_mint",
                account: "Pool"
              }
            ],
            program: {
              kind: "const",
              value: [
                1,
                86,
                224,
                246,
                147,
                102,
                90,
                207,
                68,
                219,
                21,
                104,
                191,
                23,
                91,
                170,
                81,
                137,
                203,
                151,
                245,
                210,
                255,
                59,
                101,
                93,
                43,
                182,
                253,
                109,
                24,
                176
              ]
            }
          }
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "coin_creator",
          type: "pubkey"
        },
        {
          name: "is_holder_reward",
          type: "bool"
        },
        {
          name: "creator_fee_bps",
          type: {
            option: "u64"
          }
        }
      ]
    },
    {
      name: "admin_update_token_incentives",
      discriminator: [
        209,
        11,
        115,
        87,
        213,
        23,
        124,
        204
      ],
      accounts: [
        {
          name: "admin",
          writable: true,
          signer: true,
          relations: [
            "global_config"
          ]
        },
        {
          name: "global_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          name: "global_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              }
            ]
          }
        },
        {
          name: "mint"
        },
        {
          name: "global_incentive_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "global_volume_accumulator"
              },
              {
                kind: "account",
                path: "token_program"
              },
              {
                kind: "account",
                path: "mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "token_program"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "start_time",
          type: "i64"
        },
        {
          name: "end_time",
          type: "i64"
        },
        {
          name: "seconds_in_a_day",
          type: "i64"
        },
        {
          name: "day_number",
          type: "u64"
        },
        {
          name: "token_supply_per_day",
          type: "u64"
        }
      ]
    },
    {
      name: "boost_buy_and_burn",
      discriminator: [
        105,
        68,
        6,
        175,
        0,
        7,
        35,
        162
      ],
      accounts: [
        {
          name: "pool"
        },
        {
          name: "authority",
          writable: true,
          signer: true
        },
        {
          name: "global_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          name: "base_mint",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_base_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "boost_vault_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  98,
                  111,
                  111,
                  115,
                  116,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                kind: "account",
                path: "pool"
              }
            ]
          }
        },
        {
          name: "boost_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "boost_vault_authority"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "base_token_program"
        },
        {
          name: "quote_token_program"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "quote_amount_in",
          type: "u64"
        },
        {
          name: "min_base_amount_burned",
          type: "u64"
        }
      ]
    },
    {
      name: "buy",
      docs: [
        "For cashback coins, optionally pass user_volume_accumulator_wsol_ata as remaining_accounts[0].",
        "If provided and valid, the ATA will be initialized if needed."
      ],
      discriminator: [
        102,
        6,
        61,
        18,
        1,
        218,
        235,
        234
      ],
      accounts: [
        {
          name: "pool",
          writable: true
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "global_config"
        },
        {
          name: "base_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "user_base_token_account",
          writable: true
        },
        {
          name: "user_quote_token_account",
          writable: true
        },
        {
          name: "pool_base_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "protocol_fee_recipient"
        },
        {
          name: "protocol_fee_recipient_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "protocol_fee_recipient"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "base_token_program"
        },
        {
          name: "quote_token_program"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program",
          address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
        },
        {
          name: "coin_creator_vault_ata",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "coin_creator_vault_authority"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "coin_creator_vault_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                kind: "account",
                path: "pool.coin_creator",
                account: "Pool"
              }
            ]
          }
        },
        {
          name: "global_volume_accumulator",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              }
            ]
          }
        },
        {
          name: "user_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                kind: "account",
                path: "user"
              }
            ]
          }
        },
        {
          name: "fee_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  102,
                  101,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                kind: "const",
                value: [
                  12,
                  20,
                  222,
                  252,
                  130,
                  94,
                  198,
                  118,
                  148,
                  37,
                  8,
                  24,
                  187,
                  101,
                  64,
                  101,
                  244,
                  41,
                  141,
                  49,
                  86,
                  213,
                  113,
                  180,
                  212,
                  248,
                  9,
                  12,
                  24,
                  233,
                  168,
                  99
                ]
              }
            ],
            program: {
              kind: "account",
              path: "fee_program"
            }
          }
        },
        {
          name: "fee_program",
          address: "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ"
        }
      ],
      args: [
        {
          name: "base_amount_out",
          type: "u64"
        },
        {
          name: "max_quote_amount_in",
          type: "u64"
        },
        {
          name: "track_volume",
          type: {
            defined: {
              name: "OptionBool"
            }
          }
        }
      ]
    },
    {
      name: "buy_exact_quote_in",
      docs: [
        "Given a budget of spendable_quote_in, buy at least min_base_amount_out",
        "Fees will be deducted from spendable_quote_in",
        "",
        "f(quote) = tokens, where tokens >= min_base_amount_out",
        "",
        "Make sure the payer has enough SOL to cover creation of the following accounts (unless already created):",
        "- protocol_fee_recipient_token_account: rent.minimum_balance(TokenAccount::LEN)",
        "- coin_creator_vault_ata: rent.minimum_balance(TokenAccount::LEN)",
        "- user_volume_accumulator: rent.minimum_balance(UserVolumeAccumulator::LEN)",
        "",
        "For cashback coins, optionally pass user_volume_accumulator_wsol_ata as remaining_accounts[0].",
        "If provided and valid, the ATA will be initialized if needed."
      ],
      discriminator: [
        198,
        46,
        21,
        82,
        180,
        217,
        232,
        112
      ],
      accounts: [
        {
          name: "pool",
          writable: true
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "global_config"
        },
        {
          name: "base_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "user_base_token_account",
          writable: true
        },
        {
          name: "user_quote_token_account",
          writable: true
        },
        {
          name: "pool_base_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "protocol_fee_recipient"
        },
        {
          name: "protocol_fee_recipient_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "protocol_fee_recipient"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "base_token_program"
        },
        {
          name: "quote_token_program"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program",
          address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
        },
        {
          name: "coin_creator_vault_ata",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "coin_creator_vault_authority"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "coin_creator_vault_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                kind: "account",
                path: "pool.coin_creator",
                account: "Pool"
              }
            ]
          }
        },
        {
          name: "global_volume_accumulator",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              }
            ]
          }
        },
        {
          name: "user_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                kind: "account",
                path: "user"
              }
            ]
          }
        },
        {
          name: "fee_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  102,
                  101,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                kind: "const",
                value: [
                  12,
                  20,
                  222,
                  252,
                  130,
                  94,
                  198,
                  118,
                  148,
                  37,
                  8,
                  24,
                  187,
                  101,
                  64,
                  101,
                  244,
                  41,
                  141,
                  49,
                  86,
                  213,
                  113,
                  180,
                  212,
                  248,
                  9,
                  12,
                  24,
                  233,
                  168,
                  99
                ]
              }
            ],
            program: {
              kind: "account",
              path: "fee_program"
            }
          }
        },
        {
          name: "fee_program",
          address: "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ"
        }
      ],
      args: [
        {
          name: "spendable_quote_in",
          type: "u64"
        },
        {
          name: "min_base_amount_out",
          type: "u64"
        },
        {
          name: "track_volume",
          type: {
            defined: {
              name: "OptionBool"
            }
          }
        }
      ]
    },
    {
      name: "buy_exact_quote_in_v2",
      discriminator: [
        194,
        171,
        28,
        70,
        104,
        77,
        91,
        47
      ],
      accounts: [
        {
          name: "pool",
          writable: true
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "global_config"
        },
        {
          name: "base_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "user_base_token_account",
          writable: true
        },
        {
          name: "user_quote_token_account",
          writable: true
        },
        {
          name: "pool_base_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "base_token_program"
        },
        {
          name: "quote_token_program"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "user_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                kind: "account",
                path: "user"
              }
            ]
          }
        },
        {
          name: "fee_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  102,
                  101,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                kind: "const",
                value: [
                  12,
                  20,
                  222,
                  252,
                  130,
                  94,
                  198,
                  118,
                  148,
                  37,
                  8,
                  24,
                  187,
                  101,
                  64,
                  101,
                  244,
                  41,
                  141,
                  49,
                  86,
                  213,
                  113,
                  180,
                  212,
                  248,
                  9,
                  12,
                  24,
                  233,
                  168,
                  99
                ]
              }
            ],
            program: {
              kind: "const",
              value: [
                12,
                53,
                255,
                169,
                5,
                90,
                142,
                86,
                141,
                168,
                247,
                188,
                7,
                86,
                21,
                39,
                76,
                241,
                201,
                44,
                164,
                31,
                64,
                0,
                156,
                81,
                106,
                164,
                20,
                194,
                124,
                112
              ]
            }
          }
        },
        {
          name: "buyback_fee_recipient",
          writable: true
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program",
          address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
        }
      ],
      args: [
        {
          name: "spendable_quote_in",
          type: "u64"
        },
        {
          name: "min_base_amount_out",
          type: "u64"
        }
      ]
    },
    {
      name: "buy_v2",
      discriminator: [
        184,
        23,
        238,
        97,
        103,
        197,
        211,
        61
      ],
      accounts: [
        {
          name: "pool",
          writable: true
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "global_config"
        },
        {
          name: "base_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "user_base_token_account",
          writable: true
        },
        {
          name: "user_quote_token_account",
          writable: true
        },
        {
          name: "pool_base_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "base_token_program"
        },
        {
          name: "quote_token_program"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "user_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                kind: "account",
                path: "user"
              }
            ]
          }
        },
        {
          name: "fee_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  102,
                  101,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                kind: "const",
                value: [
                  12,
                  20,
                  222,
                  252,
                  130,
                  94,
                  198,
                  118,
                  148,
                  37,
                  8,
                  24,
                  187,
                  101,
                  64,
                  101,
                  244,
                  41,
                  141,
                  49,
                  86,
                  213,
                  113,
                  180,
                  212,
                  248,
                  9,
                  12,
                  24,
                  233,
                  168,
                  99
                ]
              }
            ],
            program: {
              kind: "const",
              value: [
                12,
                53,
                255,
                169,
                5,
                90,
                142,
                86,
                141,
                168,
                247,
                188,
                7,
                86,
                21,
                39,
                76,
                241,
                201,
                44,
                164,
                31,
                64,
                0,
                156,
                81,
                106,
                164,
                20,
                194,
                124,
                112
              ]
            }
          }
        },
        {
          name: "buyback_fee_recipient",
          writable: true
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program",
          address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
        }
      ],
      args: [
        {
          name: "base_amount_out",
          type: "u64"
        },
        {
          name: "max_quote_amount_in",
          type: "u64"
        }
      ]
    },
    {
      name: "claim_cashback",
      docs: [
        "Pays out the user's accrued cashback. `user_wsol_token_account` may be any token account",
        "of `quote_mint` owned by `user`, not only the associated one."
      ],
      discriminator: [
        37,
        58,
        35,
        126,
        190,
        53,
        228,
        197
      ],
      accounts: [
        {
          name: "user",
          writable: true
        },
        {
          name: "user_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                kind: "account",
                path: "user"
              }
            ]
          }
        },
        {
          name: "quote_mint"
        },
        {
          name: "quote_token_program"
        },
        {
          name: "user_volume_accumulator_wsol_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "user_volume_accumulator"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "user_wsol_token_account",
          writable: true
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program",
          address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
        }
      ],
      args: []
    },
    {
      name: "claim_token_incentives",
      discriminator: [
        16,
        4,
        71,
        28,
        204,
        1,
        40,
        27
      ],
      accounts: [
        {
          name: "user"
        },
        {
          name: "user_ata",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "user"
              },
              {
                kind: "account",
                path: "token_program"
              },
              {
                kind: "account",
                path: "mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "global_volume_accumulator",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              }
            ]
          }
        },
        {
          name: "global_incentive_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "global_volume_accumulator"
              },
              {
                kind: "account",
                path: "token_program"
              },
              {
                kind: "account",
                path: "mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "user_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                kind: "account",
                path: "user"
              }
            ]
          }
        },
        {
          name: "mint",
          relations: [
            "global_volume_accumulator"
          ]
        },
        {
          name: "token_program"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program",
          address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
        },
        {
          name: "payer",
          writable: true,
          signer: true
        }
      ],
      args: []
    },
    {
      name: "close_user_volume_accumulator",
      discriminator: [
        249,
        69,
        164,
        218,
        150,
        103,
        84,
        138
      ],
      accounts: [
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "user_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                kind: "account",
                path: "user"
              }
            ]
          }
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "collect_coin_creator_fee",
      discriminator: [
        160,
        57,
        89,
        42,
        181,
        139,
        43,
        66
      ],
      accounts: [
        {
          name: "quote_mint"
        },
        {
          name: "quote_token_program"
        },
        {
          name: "coin_creator"
        },
        {
          name: "coin_creator_vault_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                kind: "account",
                path: "coin_creator"
              }
            ]
          }
        },
        {
          name: "coin_creator_vault_ata",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "coin_creator_vault_authority"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "coin_creator_token_account",
          writable: true
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "create_config",
      discriminator: [
        201,
        207,
        243,
        114,
        75,
        111,
        47,
        189
      ],
      accounts: [
        {
          name: "admin",
          writable: true,
          signer: true,
          address: "8LWu7QM2dGR1G8nKDHthckea57bkCzXyBTAKPJUBDHo8"
        },
        {
          name: "global_config",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "lp_fee_basis_points",
          type: "u64"
        },
        {
          name: "protocol_fee_basis_points",
          type: "u64"
        },
        {
          name: "protocol_fee_recipients",
          type: {
            array: [
              "pubkey",
              8
            ]
          }
        },
        {
          name: "coin_creator_fee_basis_points",
          type: "u64"
        },
        {
          name: "admin_set_coin_creator_authority",
          type: "pubkey"
        }
      ]
    },
    {
      name: "create_pool",
      discriminator: [
        233,
        146,
        209,
        142,
        207,
        104,
        64,
        188
      ],
      accounts: [
        {
          name: "pool",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                kind: "arg",
                path: "index"
              },
              {
                kind: "account",
                path: "creator"
              },
              {
                kind: "account",
                path: "base_mint"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ]
          }
        },
        {
          name: "global_config"
        },
        {
          name: "creator",
          writable: true,
          signer: true
        },
        {
          name: "base_mint"
        },
        {
          name: "quote_mint"
        },
        {
          name: "lp_mint",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  112,
                  111,
                  111,
                  108,
                  95,
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                kind: "account",
                path: "pool"
              }
            ]
          }
        },
        {
          name: "user_base_token_account",
          writable: true
        },
        {
          name: "user_quote_token_account",
          writable: true
        },
        {
          name: "user_pool_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "creator"
              },
              {
                kind: "account",
                path: "token_2022_program"
              },
              {
                kind: "account",
                path: "lp_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "pool_base_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "pool"
              },
              {
                kind: "account",
                path: "base_token_program"
              },
              {
                kind: "account",
                path: "base_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "pool"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "token_2022_program",
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          name: "base_token_program"
        },
        {
          name: "quote_token_program"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "index",
          type: "u16"
        },
        {
          name: "base_amount_in",
          type: "u64"
        },
        {
          name: "quote_amount_in",
          type: "u64"
        },
        {
          name: "coin_creator",
          type: "pubkey"
        },
        {
          name: "is_mayhem_mode",
          type: "bool"
        },
        {
          name: "is_cashback_coin",
          type: {
            defined: {
              name: "OptionBool"
            }
          }
        },
        {
          name: "creator_fee_bps",
          type: {
            defined: {
              name: "OptionU64"
            }
          }
        },
        {
          name: "can_edit_creator_fee",
          type: {
            defined: {
              name: "OptionBool"
            }
          }
        },
        {
          name: "is_holder_reward",
          type: {
            defined: {
              name: "OptionBool"
            }
          }
        }
      ]
    },
    {
      name: "deposit",
      discriminator: [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      accounts: [
        {
          name: "pool",
          writable: true
        },
        {
          name: "global_config"
        },
        {
          name: "user",
          signer: true
        },
        {
          name: "base_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "lp_mint",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "user_base_token_account",
          writable: true
        },
        {
          name: "user_quote_token_account",
          writable: true
        },
        {
          name: "user_pool_token_account",
          writable: true
        },
        {
          name: "pool_base_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          name: "token_2022_program",
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "lp_token_amount_out",
          type: "u64"
        },
        {
          name: "max_base_amount_in",
          type: "u64"
        },
        {
          name: "max_quote_amount_in",
          type: "u64"
        }
      ]
    },
    {
      name: "disable",
      discriminator: [
        185,
        173,
        187,
        90,
        216,
        15,
        238,
        233
      ],
      accounts: [
        {
          name: "admin",
          signer: true,
          relations: [
            "global_config"
          ]
        },
        {
          name: "global_config",
          writable: true
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "disable_create_pool",
          type: "bool"
        },
        {
          name: "disable_deposit",
          type: "bool"
        },
        {
          name: "disable_withdraw",
          type: "bool"
        },
        {
          name: "disable_buy",
          type: "bool"
        },
        {
          name: "disable_sell",
          type: "bool"
        }
      ]
    },
    {
      name: "extend_account",
      discriminator: [
        234,
        102,
        194,
        203,
        150,
        72,
        62,
        229
      ],
      accounts: [
        {
          name: "account",
          writable: true
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "init_boost",
      discriminator: [
        140,
        233,
        33,
        94,
        132,
        90,
        194,
        143
      ],
      accounts: [
        {
          name: "pool",
          writable: true
        },
        {
          name: "global_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          name: "creator",
          writable: true,
          signer: true
        },
        {
          name: "base_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_base_token_account",
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "boost_vault_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  98,
                  111,
                  111,
                  115,
                  116,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                kind: "account",
                path: "pool"
              }
            ]
          }
        },
        {
          name: "boost_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "boost_vault_authority"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "quote_token_program"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "init_user_volume_accumulator",
      discriminator: [
        94,
        6,
        202,
        115,
        255,
        96,
        232,
        183
      ],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "user"
        },
        {
          name: "user_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                kind: "account",
                path: "user"
              }
            ]
          }
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "migrate_pool_coin_creator",
      docs: [
        "Migrate Pool Coin Creator to Sharing Config"
      ],
      discriminator: [
        208,
        8,
        159,
        4,
        74,
        175,
        16,
        58
      ],
      accounts: [
        {
          name: "pool",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                kind: "account",
                path: "pool.index",
                account: "Pool"
              },
              {
                kind: "account",
                path: "pool.creator",
                account: "Pool"
              },
              {
                kind: "account",
                path: "pool.base_mint",
                account: "Pool"
              },
              {
                kind: "account",
                path: "pool.quote_mint",
                account: "Pool"
              }
            ]
          }
        },
        {
          name: "sharing_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  115,
                  104,
                  97,
                  114,
                  105,
                  110,
                  103,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                kind: "account",
                path: "pool.base_mint",
                account: "Pool"
              }
            ],
            program: {
              kind: "const",
              value: [
                12,
                53,
                255,
                169,
                5,
                90,
                142,
                86,
                141,
                168,
                247,
                188,
                7,
                86,
                21,
                39,
                76,
                241,
                201,
                44,
                164,
                31,
                64,
                0,
                156,
                81,
                106,
                164,
                20,
                194,
                124,
                112
              ]
            }
          }
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "multi_hop_swap",
      discriminator: [
        43,
        100,
        73,
        19,
        233,
        246,
        111,
        148
      ],
      accounts: [
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "user_in_token_account",
          writable: true
        },
        {
          name: "user_out_token_account",
          writable: true
        },
        {
          name: "global_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          name: "fee_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  102,
                  101,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                kind: "const",
                value: [
                  12,
                  20,
                  222,
                  252,
                  130,
                  94,
                  198,
                  118,
                  148,
                  37,
                  8,
                  24,
                  187,
                  101,
                  64,
                  101,
                  244,
                  41,
                  141,
                  49,
                  86,
                  213,
                  113,
                  180,
                  212,
                  248,
                  9,
                  12,
                  24,
                  233,
                  168,
                  99
                ]
              }
            ],
            program: {
              kind: "const",
              value: [
                12,
                53,
                255,
                169,
                5,
                90,
                142,
                86,
                141,
                168,
                247,
                188,
                7,
                86,
                21,
                39,
                76,
                241,
                201,
                44,
                164,
                31,
                64,
                0,
                156,
                81,
                106,
                164,
                20,
                194,
                124,
                112
              ]
            }
          }
        },
        {
          name: "user_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                kind: "account",
                path: "user"
              }
            ]
          }
        },
        {
          name: "buyback_fee_recipient",
          writable: true
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          name: "token_2022_program",
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program",
          address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
        },
        {
          name: "pump_program",
          address: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
        },
        {
          name: "pump_global"
        },
        {
          name: "pump_fee_config"
        },
        {
          name: "pump_event_authority"
        }
      ],
      args: [
        {
          name: "amount_in",
          type: "u64"
        },
        {
          name: "min_amount_out",
          type: "u64"
        }
      ]
    },
    {
      name: "sell",
      discriminator: [
        51,
        230,
        133,
        164,
        1,
        127,
        131,
        173
      ],
      accounts: [
        {
          name: "pool",
          writable: true
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "global_config"
        },
        {
          name: "base_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "user_base_token_account",
          writable: true
        },
        {
          name: "user_quote_token_account",
          writable: true
        },
        {
          name: "pool_base_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "protocol_fee_recipient"
        },
        {
          name: "protocol_fee_recipient_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "protocol_fee_recipient"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "base_token_program"
        },
        {
          name: "quote_token_program"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program",
          address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
        },
        {
          name: "coin_creator_vault_ata",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "coin_creator_vault_authority"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "coin_creator_vault_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                kind: "account",
                path: "pool.coin_creator",
                account: "Pool"
              }
            ]
          }
        },
        {
          name: "fee_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  102,
                  101,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                kind: "const",
                value: [
                  12,
                  20,
                  222,
                  252,
                  130,
                  94,
                  198,
                  118,
                  148,
                  37,
                  8,
                  24,
                  187,
                  101,
                  64,
                  101,
                  244,
                  41,
                  141,
                  49,
                  86,
                  213,
                  113,
                  180,
                  212,
                  248,
                  9,
                  12,
                  24,
                  233,
                  168,
                  99
                ]
              }
            ],
            program: {
              kind: "account",
              path: "fee_program"
            }
          }
        },
        {
          name: "fee_program",
          address: "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ"
        }
      ],
      args: [
        {
          name: "base_amount_in",
          type: "u64"
        },
        {
          name: "min_quote_amount_out",
          type: "u64"
        }
      ]
    },
    {
      name: "sell_v2",
      discriminator: [
        93,
        246,
        130,
        60,
        231,
        233,
        64,
        178
      ],
      accounts: [
        {
          name: "pool",
          writable: true
        },
        {
          name: "user",
          writable: true,
          signer: true
        },
        {
          name: "global_config"
        },
        {
          name: "base_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "user_base_token_account",
          writable: true
        },
        {
          name: "user_quote_token_account",
          writable: true
        },
        {
          name: "pool_base_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "base_token_program"
        },
        {
          name: "quote_token_program"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "user_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                kind: "account",
                path: "user"
              }
            ]
          }
        },
        {
          name: "fee_config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  102,
                  101,
                  101,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                kind: "const",
                value: [
                  12,
                  20,
                  222,
                  252,
                  130,
                  94,
                  198,
                  118,
                  148,
                  37,
                  8,
                  24,
                  187,
                  101,
                  64,
                  101,
                  244,
                  41,
                  141,
                  49,
                  86,
                  213,
                  113,
                  180,
                  212,
                  248,
                  9,
                  12,
                  24,
                  233,
                  168,
                  99
                ]
              }
            ],
            program: {
              kind: "const",
              value: [
                12,
                53,
                255,
                169,
                5,
                90,
                142,
                86,
                141,
                168,
                247,
                188,
                7,
                86,
                21,
                39,
                76,
                241,
                201,
                44,
                164,
                31,
                64,
                0,
                156,
                81,
                106,
                164,
                20,
                194,
                124,
                112
              ]
            }
          }
        },
        {
          name: "buyback_fee_recipient",
          writable: true
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program",
          address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
        }
      ],
      args: [
        {
          name: "base_amount_in",
          type: "u64"
        },
        {
          name: "min_quote_amount_out",
          type: "u64"
        }
      ]
    },
    {
      name: "set_boost_authority",
      discriminator: [
        227,
        149,
        76,
        42,
        130,
        39,
        234,
        205
      ],
      accounts: [
        {
          name: "admin",
          signer: true,
          relations: [
            "global_config"
          ]
        },
        {
          name: "global_config",
          writable: true
        },
        {
          name: "boost_authority"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "set_coin_creator",
      docs: [
        "Sets Pool::coin_creator from Metaplex metadata creator or BondingCurve::creator"
      ],
      discriminator: [
        210,
        149,
        128,
        45,
        188,
        58,
        78,
        175
      ],
      accounts: [
        {
          name: "pool",
          writable: true
        },
        {
          name: "metadata",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                kind: "const",
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ]
              },
              {
                kind: "account",
                path: "pool.base_mint",
                account: "Pool"
              }
            ],
            program: {
              kind: "const",
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ]
            }
          }
        },
        {
          name: "bonding_curve",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  98,
                  111,
                  110,
                  100,
                  105,
                  110,
                  103,
                  45,
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              },
              {
                kind: "account",
                path: "pool.base_mint",
                account: "Pool"
              }
            ],
            program: {
              kind: "const",
              value: [
                1,
                86,
                224,
                246,
                147,
                102,
                90,
                207,
                68,
                219,
                21,
                104,
                191,
                23,
                91,
                170,
                81,
                137,
                203,
                151,
                245,
                210,
                255,
                59,
                101,
                93,
                43,
                182,
                253,
                109,
                24,
                176
              ]
            }
          }
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "set_reserved_fee_recipients",
      discriminator: [
        111,
        172,
        162,
        232,
        114,
        89,
        213,
        142
      ],
      accounts: [
        {
          name: "global_config",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          name: "admin",
          signer: true,
          relations: [
            "global_config"
          ]
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "whitelist_pda",
          type: "pubkey"
        }
      ]
    },
    {
      name: "sweep_creator_fee",
      discriminator: [
        32,
        246,
        191,
        52,
        8,
        201,
        73,
        186
      ],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "global_config"
        },
        {
          name: "pool",
          writable: true
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_token_program"
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "recipient",
          docs: [
            "protocol fee recipient (`check_protocol_fee_recipient`) or the coin-creator vault",
            "authority PDA of `pool.coin_creator`."
          ]
        },
        {
          name: "recipient_token_account",
          docs: [
            "idempotently when missing (the payer pays)."
          ],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "recipient"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "sweep_protocol_fee",
      discriminator: [
        8,
        48,
        190,
        7,
        182,
        68,
        183,
        229
      ],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "global_config"
        },
        {
          name: "pool",
          writable: true
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_token_program"
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "recipient",
          docs: [
            "protocol fee recipient (`check_protocol_fee_recipient`) or the coin-creator vault",
            "authority PDA of `pool.coin_creator`."
          ]
        },
        {
          name: "recipient_token_account",
          docs: [
            "idempotently when missing (the payer pays)."
          ],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "recipient"
              },
              {
                kind: "account",
                path: "quote_token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "sync_user_volume_accumulator",
      discriminator: [
        86,
        31,
        192,
        87,
        163,
        87,
        79,
        238
      ],
      accounts: [
        {
          name: "user"
        },
        {
          name: "global_volume_accumulator",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              }
            ]
          }
        },
        {
          name: "user_volume_accumulator",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  108,
                  117,
                  109,
                  101,
                  95,
                  97,
                  99,
                  99,
                  117,
                  109,
                  117,
                  108,
                  97,
                  116,
                  111,
                  114
                ]
              },
              {
                kind: "account",
                path: "user"
              }
            ]
          }
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "toggle_boost",
      discriminator: [
        117,
        161,
        160,
        74,
        223,
        137,
        118,
        99
      ],
      accounts: [
        {
          name: "admin",
          signer: true,
          relations: [
            "global_config"
          ]
        },
        {
          name: "global_config",
          writable: true
        }
      ],
      args: [
        {
          name: "enabled",
          type: "bool"
        }
      ]
    },
    {
      name: "toggle_cashback_enabled",
      discriminator: [
        115,
        103,
        224,
        255,
        189,
        89,
        86,
        195
      ],
      accounts: [
        {
          name: "admin",
          signer: true,
          relations: [
            "global_config"
          ]
        },
        {
          name: "global_config",
          writable: true
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "enabled",
          type: "bool"
        }
      ]
    },
    {
      name: "toggle_mayhem_mode",
      discriminator: [
        1,
        9,
        111,
        208,
        100,
        31,
        255,
        163
      ],
      accounts: [
        {
          name: "admin",
          signer: true,
          relations: [
            "global_config"
          ]
        },
        {
          name: "global_config",
          writable: true
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "enabled",
          type: "bool"
        }
      ]
    },
    {
      name: "transfer_creator_fees_to_pump",
      docs: [
        "Transfer creator fees to pump creator vault",
        "If coin creator fees are currently below rent.minimum_balance(TokenAccount::LEN)",
        "The transfer will be skipped"
      ],
      discriminator: [
        139,
        52,
        134,
        85,
        228,
        229,
        108,
        241
      ],
      accounts: [
        {
          name: "wsol_mint",
          docs: [
            "Pump Canonical Pool are quoted in wSOL"
          ]
        },
        {
          name: "token_program"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "coin_creator"
        },
        {
          name: "coin_creator_vault_authority",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                kind: "account",
                path: "coin_creator"
              }
            ]
          }
        },
        {
          name: "coin_creator_vault_ata",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "coin_creator_vault_authority"
              },
              {
                kind: "account",
                path: "token_program"
              },
              {
                kind: "account",
                path: "wsol_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "pump_creator_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                kind: "account",
                path: "coin_creator"
              }
            ],
            program: {
              kind: "const",
              value: [
                1,
                86,
                224,
                246,
                147,
                102,
                90,
                207,
                68,
                219,
                21,
                104,
                191,
                23,
                91,
                170,
                81,
                137,
                203,
                151,
                245,
                210,
                255,
                59,
                101,
                93,
                43,
                182,
                253,
                109,
                24,
                176
              ]
            }
          }
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "transfer_creator_fees_to_pump_v2",
      discriminator: [
        1,
        33,
        78,
        185,
        33,
        67,
        44,
        92
      ],
      accounts: [
        {
          name: "payer",
          writable: true,
          signer: true
        },
        {
          name: "quote_mint"
        },
        {
          name: "token_program"
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          name: "coin_creator"
        },
        {
          name: "coin_creator_vault_authority",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                kind: "account",
                path: "coin_creator"
              }
            ]
          }
        },
        {
          name: "coin_creator_vault_ata",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "coin_creator_vault_authority"
              },
              {
                kind: "account",
                path: "token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "const",
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          name: "pump_creator_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  99,
                  114,
                  101,
                  97,
                  116,
                  111,
                  114,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                kind: "account",
                path: "coin_creator"
              }
            ],
            program: {
              kind: "const",
              value: [
                1,
                86,
                224,
                246,
                147,
                102,
                90,
                207,
                68,
                219,
                21,
                104,
                191,
                23,
                91,
                170,
                81,
                137,
                203,
                151,
                245,
                210,
                255,
                59,
                101,
                93,
                43,
                182,
                253,
                109,
                24,
                176
              ]
            }
          }
        },
        {
          name: "pump_creator_vault_ata",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "pump_creator_vault"
              },
              {
                kind: "account",
                path: "token_program"
              },
              {
                kind: "account",
                path: "quote_mint"
              }
            ],
            program: {
              kind: "account",
              path: "associated_token_program"
            }
          }
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "update_admin",
      discriminator: [
        161,
        176,
        40,
        213,
        60,
        184,
        179,
        228
      ],
      accounts: [
        {
          name: "admin",
          signer: true,
          relations: [
            "global_config"
          ]
        },
        {
          name: "global_config",
          writable: true
        },
        {
          name: "new_admin"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: []
    },
    {
      name: "update_buyback_config",
      discriminator: [
        251,
        224,
        171,
        146,
        160,
        26,
        113,
        233
      ],
      accounts: [
        {
          name: "admin",
          signer: true,
          relations: [
            "global_config"
          ]
        },
        {
          name: "global_config",
          writable: true
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "buyback_basis_points",
          type: {
            option: "u64"
          }
        }
      ]
    },
    {
      name: "update_creator_fee_config",
      discriminator: [
        61,
        175,
        160,
        249,
        66,
        66,
        136,
        175
      ],
      accounts: [
        {
          name: "admin",
          writable: true,
          signer: true,
          relations: [
            "global_config"
          ]
        },
        {
          name: "global_config",
          writable: true
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "creator_fee_configurable",
          type: "bool"
        },
        {
          name: "max_configurable_creator_fee_bps",
          type: "u64"
        }
      ]
    },
    {
      name: "update_fee_config",
      discriminator: [
        104,
        184,
        103,
        242,
        88,
        151,
        107,
        20
      ],
      accounts: [
        {
          name: "admin",
          signer: true,
          relations: [
            "global_config"
          ]
        },
        {
          name: "global_config",
          writable: true
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "lp_fee_basis_points",
          type: "u64"
        },
        {
          name: "protocol_fee_basis_points",
          type: "u64"
        },
        {
          name: "protocol_fee_recipients",
          type: {
            array: [
              "pubkey",
              8
            ]
          }
        },
        {
          name: "coin_creator_fee_basis_points",
          type: "u64"
        },
        {
          name: "admin_set_coin_creator_authority",
          type: "pubkey"
        }
      ]
    },
    {
      name: "withdraw",
      discriminator: [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      accounts: [
        {
          name: "pool",
          writable: true
        },
        {
          name: "global_config"
        },
        {
          name: "user",
          signer: true
        },
        {
          name: "base_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "quote_mint",
          relations: [
            "pool"
          ]
        },
        {
          name: "lp_mint",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "user_base_token_account",
          writable: true
        },
        {
          name: "user_quote_token_account",
          writable: true
        },
        {
          name: "user_pool_token_account",
          writable: true
        },
        {
          name: "pool_base_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "pool_quote_token_account",
          writable: true,
          relations: [
            "pool"
          ]
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          name: "token_2022_program",
          address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          name: "event_authority",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          name: "program"
        }
      ],
      args: [
        {
          name: "lp_token_amount_in",
          type: "u64"
        },
        {
          name: "min_base_amount_out",
          type: "u64"
        },
        {
          name: "min_quote_amount_out",
          type: "u64"
        }
      ]
    }
  ],
  accounts: [
    {
      name: "BondingCurve",
      discriminator: [
        23,
        183,
        248,
        55,
        96,
        216,
        172,
        96
      ]
    },
    {
      name: "FeeConfig",
      discriminator: [
        143,
        52,
        146,
        187,
        219,
        123,
        76,
        155
      ]
    },
    {
      name: "GlobalConfig",
      discriminator: [
        149,
        8,
        156,
        202,
        160,
        252,
        176,
        217
      ]
    },
    {
      name: "GlobalVolumeAccumulator",
      discriminator: [
        202,
        42,
        246,
        43,
        142,
        190,
        30,
        255
      ]
    },
    {
      name: "Pool",
      discriminator: [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    },
    {
      name: "SharingConfig",
      discriminator: [
        216,
        74,
        9,
        0,
        56,
        140,
        93,
        75
      ]
    },
    {
      name: "UserVolumeAccumulator",
      discriminator: [
        86,
        255,
        112,
        14,
        102,
        53,
        154,
        250
      ]
    }
  ],
  events: [
    {
      name: "AdminCtoPoolEvent",
      discriminator: [
        47,
        35,
        163,
        249,
        150,
        157,
        147,
        122
      ]
    },
    {
      name: "AdminUpdateTokenIncentivesEvent",
      discriminator: [
        147,
        250,
        108,
        120,
        247,
        29,
        67,
        222
      ]
    },
    {
      name: "BoostBuyAndBurnEvent",
      discriminator: [
        63,
        69,
        28,
        22,
        48,
        92,
        194,
        185
      ]
    },
    {
      name: "BuyEvent",
      discriminator: [
        103,
        244,
        82,
        31,
        44,
        245,
        119,
        119
      ]
    },
    {
      name: "ClaimCashbackEvent",
      discriminator: [
        226,
        214,
        246,
        33,
        7,
        242,
        147,
        229
      ]
    },
    {
      name: "ClaimTokenIncentivesEvent",
      discriminator: [
        79,
        172,
        246,
        49,
        205,
        91,
        206,
        232
      ]
    },
    {
      name: "CloseUserVolumeAccumulatorEvent",
      discriminator: [
        146,
        159,
        189,
        172,
        146,
        88,
        56,
        244
      ]
    },
    {
      name: "CollectCoinCreatorFeeEvent",
      discriminator: [
        232,
        245,
        194,
        238,
        234,
        218,
        58,
        89
      ]
    },
    {
      name: "CreateConfigEvent",
      discriminator: [
        107,
        52,
        89,
        129,
        55,
        226,
        81,
        22
      ]
    },
    {
      name: "CreatePoolEvent",
      discriminator: [
        177,
        49,
        12,
        210,
        160,
        118,
        167,
        116
      ]
    },
    {
      name: "DepositEvent",
      discriminator: [
        120,
        248,
        61,
        83,
        31,
        142,
        107,
        144
      ]
    },
    {
      name: "DisableEvent",
      discriminator: [
        107,
        253,
        193,
        76,
        228,
        202,
        27,
        104
      ]
    },
    {
      name: "ExtendAccountEvent",
      discriminator: [
        97,
        97,
        215,
        144,
        93,
        146,
        22,
        124
      ]
    },
    {
      name: "InitBoostEvent",
      discriminator: [
        174,
        124,
        74,
        249,
        4,
        81,
        246,
        17
      ]
    },
    {
      name: "InitUserVolumeAccumulatorEvent",
      discriminator: [
        134,
        36,
        13,
        72,
        232,
        101,
        130,
        216
      ]
    },
    {
      name: "MigratePoolCoinCreatorEvent",
      discriminator: [
        170,
        221,
        82,
        199,
        147,
        165,
        247,
        46
      ]
    },
    {
      name: "ReservedFeeRecipientsEvent",
      discriminator: [
        43,
        188,
        250,
        18,
        221,
        75,
        187,
        95
      ]
    },
    {
      name: "SellEvent",
      discriminator: [
        62,
        47,
        55,
        10,
        165,
        3,
        220,
        42
      ]
    },
    {
      name: "SetBondingCurveCoinCreatorEvent",
      discriminator: [
        242,
        231,
        235,
        102,
        65,
        99,
        189,
        211
      ]
    },
    {
      name: "SetBoostAuthorityEvent",
      discriminator: [
        89,
        128,
        240,
        141,
        91,
        202,
        71,
        105
      ]
    },
    {
      name: "SetMetaplexCoinCreatorEvent",
      discriminator: [
        150,
        107,
        199,
        123,
        124,
        207,
        102,
        228
      ]
    },
    {
      name: "SweepPoolFeeEvent",
      discriminator: [
        130,
        164,
        36,
        97,
        228,
        130,
        135,
        165
      ]
    },
    {
      name: "SyncUserVolumeAccumulatorEvent",
      discriminator: [
        197,
        122,
        167,
        124,
        116,
        81,
        91,
        255
      ]
    },
    {
      name: "UpdateAdminEvent",
      discriminator: [
        225,
        152,
        171,
        87,
        246,
        63,
        66,
        234
      ]
    },
    {
      name: "UpdateCreatorFeeConfigEvent",
      discriminator: [
        152,
        198,
        124,
        124,
        106,
        246,
        127,
        191
      ]
    },
    {
      name: "UpdateFeeConfigEvent",
      discriminator: [
        90,
        23,
        65,
        35,
        62,
        244,
        188,
        208
      ]
    },
    {
      name: "WithdrawEvent",
      discriminator: [
        22,
        9,
        133,
        26,
        160,
        44,
        71,
        192
      ]
    }
  ],
  errors: [
    {
      code: 6e3,
      name: "FeeBasisPointsExceedsMaximum"
    },
    {
      code: 6001,
      name: "ZeroBaseAmount"
    },
    {
      code: 6002,
      name: "ZeroQuoteAmount"
    },
    {
      code: 6003,
      name: "TooLittlePoolTokenLiquidity"
    },
    {
      code: 6004,
      name: "ExceededSlippage"
    },
    {
      code: 6005,
      name: "InvalidAdmin"
    },
    {
      code: 6006,
      name: "UnsupportedBaseMint"
    },
    {
      code: 6007,
      name: "UnsupportedQuoteMint"
    },
    {
      code: 6008,
      name: "InvalidBaseMint"
    },
    {
      code: 6009,
      name: "InvalidQuoteMint"
    },
    {
      code: 6010,
      name: "InvalidLpMint"
    },
    {
      code: 6011,
      name: "AllProtocolFeeRecipientsShouldBeNonZero"
    },
    {
      code: 6012,
      name: "UnsortedNotUniqueProtocolFeeRecipients"
    },
    {
      code: 6013,
      name: "InvalidProtocolFeeRecipient"
    },
    {
      code: 6014,
      name: "InvalidPoolBaseTokenAccount"
    },
    {
      code: 6015,
      name: "InvalidPoolQuoteTokenAccount"
    },
    {
      code: 6016,
      name: "BuyMoreBaseAmountThanPoolReserves"
    },
    {
      code: 6017,
      name: "DisabledCreatePool"
    },
    {
      code: 6018,
      name: "DisabledDeposit"
    },
    {
      code: 6019,
      name: "DisabledWithdraw"
    },
    {
      code: 6020,
      name: "DisabledBuy"
    },
    {
      code: 6021,
      name: "DisabledSell"
    },
    {
      code: 6022,
      name: "SameMint"
    },
    {
      code: 6023,
      name: "Overflow"
    },
    {
      code: 6024,
      name: "Truncation"
    },
    {
      code: 6025,
      name: "DivisionByZero"
    },
    {
      code: 6026,
      name: "NewSizeLessThanCurrentSize"
    },
    {
      code: 6027,
      name: "AccountTypeNotSupported"
    },
    {
      code: 6028,
      name: "OnlyCanonicalPumpPoolsCanHaveCoinCreator"
    },
    {
      code: 6029,
      name: "InvalidAdminSetCoinCreatorAuthority"
    },
    {
      code: 6030,
      name: "StartTimeInThePast"
    },
    {
      code: 6031,
      name: "EndTimeInThePast"
    },
    {
      code: 6032,
      name: "EndTimeBeforeStartTime"
    },
    {
      code: 6033,
      name: "TimeRangeTooLarge"
    },
    {
      code: 6034,
      name: "EndTimeBeforeCurrentDay"
    },
    {
      code: 6035,
      name: "SupplyUpdateForFinishedRange"
    },
    {
      code: 6036,
      name: "DayIndexAfterEndIndex"
    },
    {
      code: 6037,
      name: "DayInActiveRange"
    },
    {
      code: 6038,
      name: "InvalidIncentiveMint"
    },
    {
      code: 6039,
      name: "BuyNotEnoughQuoteTokensToCoverFees",
      msg: "buy: Not enough quote tokens to cover for fees."
    },
    {
      code: 6040,
      name: "BuySlippageBelowMinBaseAmountOut",
      msg: "buy: slippage - would buy less tokens than expected min_base_amount_out"
    },
    {
      code: 6041,
      name: "MayhemModeDisabled"
    },
    {
      code: 6042,
      name: "OnlyPumpPoolsMayhemMode"
    },
    {
      code: 6043,
      name: "MayhemModeInDesiredState"
    },
    {
      code: 6044,
      name: "NotEnoughRemainingAccounts"
    },
    {
      code: 6045,
      name: "InvalidSharingConfigBaseMint"
    },
    {
      code: 6046,
      name: "InvalidSharingConfigCoinCreator"
    },
    {
      code: 6047,
      name: "CoinCreatorMigratedToSharingConfig",
      msg: "coin creator has been migrated to sharing config"
    },
    {
      code: 6048,
      name: "CreatorVaultMigratedToSharingConfig",
      msg: "creator_vault has been migrated to sharing config, use pump:distribute_creator_fees instead"
    },
    {
      code: 6049,
      name: "CashbackNotEnabled",
      msg: "Cashback is disabled"
    },
    {
      code: 6050,
      name: "OnlyPumpPoolsCashback"
    },
    {
      code: 6051,
      name: "CashbackNotInDesiredState"
    },
    {
      code: 6052,
      name: "TokensInVaultLessThanCashbackEarned"
    },
    {
      code: 6053,
      name: "BuybackFeeRecipientNotAuthorized",
      msg: "Buyback fee recipient not authorized"
    },
    {
      code: 6054,
      name: "AllBuybackFeeRecipientsShouldBeNonZero"
    },
    {
      code: 6055,
      name: "NotUniqueBuybackFeeRecipients"
    },
    {
      code: 6056,
      name: "BuybackBasisPointsOutOfRange",
      msg: "buyback_basis_points must be <= 10_000"
    },
    {
      code: 6057,
      name: "WrongBuybackFeeRecipientsCount",
      msg: "buyback fee recipients require exactly 8 remaining accounts (or none)"
    },
    {
      code: 6058,
      name: "BuybackFeeRecipientMissing"
    },
    {
      code: 6059,
      name: "MissingCashbackAccounts",
      msg: "Cashback trade is missing the required remaining accounts"
    },
    {
      code: 6060,
      name: "InvalidCashbackAccumulator",
      msg: "Cashback user_volume_accumulator account is invalid"
    },
    {
      code: 6061,
      name: "InvalidCashbackAccumulatorAta",
      msg: "Cashback user_volume_accumulator ATA is missing or invalid"
    },
    {
      code: 6062,
      name: "InvalidPoolV2",
      msg: "pool_v2 remaining account is missing or invalid"
    },
    {
      code: 6063,
      name: "InsufficientRealQuoteReserves",
      msg: "BOOST: sell output exceeds the real quote vault. effective = real + virtual is pricing-only; payout is capped at real_vault, so quote min(out, real_vault)"
    },
    {
      code: 6064,
      name: "BoostPoolLiquidityUnsupported",
      msg: "BOOST: deposit/withdraw don't apply to boost pools"
    },
    {
      code: 6065,
      name: "PoolCannotBoost",
      msg: "BOOST: pool cannot be boosted (no virtual reserves)"
    },
    {
      code: 6066,
      name: "BoostDisabled",
      msg: "BOOST: boost is disabled"
    },
    {
      code: 6067,
      name: "SeedLockViolation",
      msg: "BOOST: lp_supply must never drop below the circulating LP mint supply"
    },
    {
      code: 6068,
      name: "CreatorFeeNotConfigurable",
      msg: "Configurable creator fee is disabled"
    },
    {
      code: 6069,
      name: "CreatorFeeBpsOutOfRange",
      msg: "Creator fee basis points must be between 1 and the configured maximum"
    },
    {
      code: 6070,
      name: "CreatorFeeNotEditable",
      msg: "Creator fee is not editable for this pool"
    },
    {
      code: 6071,
      name: "CreatorFeeNotAllowedForCashbackCoin",
      msg: "Cashback coins cannot have a creator fee"
    },
    {
      code: 6072,
      name: "SharingConfigNotActive",
      msg: "Sharing config is not active"
    },
    {
      code: 6073,
      name: "NotAuthorized",
      msg: "Not authorized"
    },
    {
      code: 6074,
      name: "HolderRewardCreatorImmutable",
      msg: "The coin creator of a holder-reward pool cannot be changed"
    },
    {
      code: 6075,
      name: "CtoNotAllowedForMayhemPool",
      msg: "CTO is not allowed on a mayhem-mode pool"
    },
    {
      code: 6076,
      name: "InvalidHolderRewardCoinCreator",
      msg: "A holder-reward pool's coin creator must be the holder-rewards PDA"
    },
    {
      code: 6077,
      name: "CreatorFeeNotConfigurableForQuote",
      msg: "Creator fee is not configurable on a SOL or USDC quote; the fee schedule applies"
    },
    {
      code: 6078,
      name: "OnlyPumpPools",
      msg: "Only canonical pump pools are supported by this instruction"
    },
    {
      code: 6079,
      name: "CashbackCoinNotSupported",
      msg: "v2 trades do not support cashback coins; use the v1 instructions"
    },
    {
      code: 6080,
      name: "MayhemPoolNotSupported",
      msg: "v2 trades do not support mayhem-mode pools; use the v1 instructions"
    },
    {
      code: 6081,
      name: "CreatorFeesNotSwept",
      msg: "creator_fees must be swept before the coin creator changes"
    },
    {
      code: 6082,
      name: "FeeTiersEmpty",
      msg: "The fee config tier table is empty"
    },
    {
      code: 6083,
      name: "FeeConfigTooShort",
      msg: "The fee config account is shorter than its initialize size"
    },
    {
      code: 6084,
      name: "MultiHopDiscontinuousPath",
      msg: "multi-hop: a hop's input mint is neither side of its pool or curve, or the route does not end in user_out_token_account's mint"
    },
    {
      code: 6085,
      name: "MultiHopCurveRunMismatch",
      msg: "multi-hop: the balances around the bonding-curve hops do not match the amounts pump reported"
    },
    {
      code: 6086,
      name: "MultiHopMixedDirection",
      msg: "multi-hop: every hop must trade in the same direction, all buys or all sells"
    },
    {
      code: 6087,
      name: "SelfTransferNotAllowed",
      msg: "A transfer's source is its destination and the signer does not own it"
    }
  ],
  types: [
    {
      name: "AdminCtoPoolEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "base_mint",
            type: "pubkey"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "old_coin_creator",
            type: "pubkey"
          },
          {
            name: "new_coin_creator",
            type: "pubkey"
          },
          {
            name: "is_holder_reward",
            type: "bool"
          },
          {
            name: "is_cashback_coin",
            type: "bool"
          },
          {
            name: "old_creator_fee_bps",
            type: "u64"
          },
          {
            name: "new_creator_fee_bps",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "AdminUpdateTokenIncentivesEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "start_time",
            type: "i64"
          },
          {
            name: "end_time",
            type: "i64"
          },
          {
            name: "day_number",
            type: "u64"
          },
          {
            name: "token_supply_per_day",
            type: "u64"
          },
          {
            name: "mint",
            type: "pubkey"
          },
          {
            name: "seconds_in_a_day",
            type: "i64"
          },
          {
            name: "timestamp",
            type: "i64"
          }
        ]
      }
    },
    {
      name: "BondingCurve",
      type: {
        kind: "struct",
        fields: [
          {
            name: "virtual_token_reserves",
            type: "u64"
          },
          {
            name: "virtual_sol_reserves",
            type: "u64"
          },
          {
            name: "real_token_reserves",
            type: "u64"
          },
          {
            name: "real_sol_reserves",
            type: "u64"
          },
          {
            name: "token_total_supply",
            type: "u64"
          },
          {
            name: "complete",
            type: "bool"
          },
          {
            name: "creator",
            type: "pubkey"
          },
          {
            name: "is_mayhem_mode",
            type: "bool"
          },
          {
            name: "is_cashback_coin",
            type: "bool"
          }
        ]
      }
    },
    {
      name: "BoostBuyAndBurnEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "mint",
            type: "pubkey"
          },
          {
            name: "bonding_curve",
            type: "pubkey"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "authority",
            type: "pubkey"
          },
          {
            name: "quote_amount_in_requested",
            type: "u64"
          },
          {
            name: "quote_amount_in_used",
            type: "u64"
          },
          {
            name: "base_amount_burned",
            type: "u64"
          },
          {
            name: "virtual_quote_reserves",
            type: "i128"
          },
          {
            name: "real_quote_reserves_after",
            type: "u64"
          },
          {
            name: "base_reserves_after",
            type: "u64"
          },
          {
            name: "boost_vault_remaining",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "BuyEvent",
      docs: [
        'ix_name: "buy" | "buy_exact_quote_in"'
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "base_amount_out",
            type: "u64"
          },
          {
            name: "max_quote_amount_in",
            type: "u64"
          },
          {
            name: "user_base_token_reserves",
            type: "u64"
          },
          {
            name: "user_quote_token_reserves",
            type: "u64"
          },
          {
            name: "pool_base_token_reserves",
            type: "u64"
          },
          {
            name: "pool_quote_token_reserves",
            type: "u64"
          },
          {
            name: "quote_amount_in",
            type: "u64"
          },
          {
            name: "lp_fee_basis_points",
            type: "u64"
          },
          {
            name: "lp_fee",
            type: "u64"
          },
          {
            name: "protocol_fee_basis_points",
            type: "u64"
          },
          {
            name: "protocol_fee",
            type: "u64"
          },
          {
            name: "quote_amount_in_with_lp_fee",
            type: "u64"
          },
          {
            name: "user_quote_amount_in",
            type: "u64"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "user_base_token_account",
            type: "pubkey"
          },
          {
            name: "user_quote_token_account",
            type: "pubkey"
          },
          {
            name: "protocol_fee_recipient",
            type: "pubkey"
          },
          {
            name: "protocol_fee_recipient_token_account",
            type: "pubkey"
          },
          {
            name: "coin_creator",
            type: "pubkey"
          },
          {
            name: "coin_creator_fee_basis_points",
            type: "u64"
          },
          {
            name: "coin_creator_fee",
            type: "u64"
          },
          {
            name: "track_volume",
            type: "bool"
          },
          {
            name: "total_unclaimed_tokens",
            type: "u64"
          },
          {
            name: "total_claimed_tokens",
            type: "u64"
          },
          {
            name: "current_sol_volume",
            type: "u64"
          },
          {
            name: "last_update_timestamp",
            type: "i64"
          },
          {
            name: "min_base_amount_out",
            type: "u64"
          },
          {
            name: "ix_name",
            type: "string"
          },
          {
            name: "cashback_fee_basis_points",
            type: "u64"
          },
          {
            name: "cashback",
            type: "u64"
          },
          {
            name: "buyback_fee_basis_points",
            type: "u64"
          },
          {
            name: "buyback_fee",
            type: "u64"
          },
          {
            name: "virtual_quote_reserves",
            type: "i128"
          },
          {
            name: "can_boost",
            type: "bool"
          },
          {
            name: "base_supply",
            type: "u64"
          },
          {
            name: "holder_rewards_bps",
            type: "u64"
          },
          {
            name: "holder_rewards",
            type: "u64"
          },
          {
            name: "creator_fee_unclaimed",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "ClaimCashbackEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "amount",
            type: "u64"
          },
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "total_claimed",
            type: "u64"
          },
          {
            name: "total_cashback_earned",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "ClaimTokenIncentivesEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "mint",
            type: "pubkey"
          },
          {
            name: "amount",
            type: "u64"
          },
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "total_claimed_tokens",
            type: "u64"
          },
          {
            name: "current_sol_volume",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "CloseUserVolumeAccumulatorEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "total_unclaimed_tokens",
            type: "u64"
          },
          {
            name: "total_claimed_tokens",
            type: "u64"
          },
          {
            name: "current_sol_volume",
            type: "u64"
          },
          {
            name: "last_update_timestamp",
            type: "i64"
          }
        ]
      }
    },
    {
      name: "CollectCoinCreatorFeeEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "coin_creator",
            type: "pubkey"
          },
          {
            name: "coin_creator_fee",
            type: "u64"
          },
          {
            name: "coin_creator_vault_ata",
            type: "pubkey"
          },
          {
            name: "coin_creator_token_account",
            type: "pubkey"
          }
        ]
      }
    },
    {
      name: "ConfigStatus",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Paused"
          },
          {
            name: "Active"
          }
        ]
      }
    },
    {
      name: "CreateConfigEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "admin",
            type: "pubkey"
          },
          {
            name: "lp_fee_basis_points",
            type: "u64"
          },
          {
            name: "protocol_fee_basis_points",
            type: "u64"
          },
          {
            name: "protocol_fee_recipients",
            type: {
              array: [
                "pubkey",
                8
              ]
            }
          },
          {
            name: "coin_creator_fee_basis_points",
            type: "u64"
          },
          {
            name: "admin_set_coin_creator_authority",
            type: "pubkey"
          }
        ]
      }
    },
    {
      name: "CreatePoolEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "index",
            type: "u16"
          },
          {
            name: "creator",
            type: "pubkey"
          },
          {
            name: "base_mint",
            type: "pubkey"
          },
          {
            name: "quote_mint",
            type: "pubkey"
          },
          {
            name: "base_mint_decimals",
            type: "u8"
          },
          {
            name: "quote_mint_decimals",
            type: "u8"
          },
          {
            name: "base_amount_in",
            type: "u64"
          },
          {
            name: "quote_amount_in",
            type: "u64"
          },
          {
            name: "pool_base_amount",
            type: "u64"
          },
          {
            name: "pool_quote_amount",
            type: "u64"
          },
          {
            name: "minimum_liquidity",
            type: "u64"
          },
          {
            name: "initial_liquidity",
            type: "u64"
          },
          {
            name: "lp_token_amount_out",
            type: "u64"
          },
          {
            name: "pool_bump",
            type: "u8"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "lp_mint",
            type: "pubkey"
          },
          {
            name: "user_base_token_account",
            type: "pubkey"
          },
          {
            name: "user_quote_token_account",
            type: "pubkey"
          },
          {
            name: "coin_creator",
            type: "pubkey"
          },
          {
            name: "is_mayhem_mode",
            type: "bool"
          },
          {
            name: "creator_fee_bps",
            type: "u64"
          },
          {
            name: "can_edit_creator_fee",
            type: "bool"
          },
          {
            name: "is_holder_reward",
            type: "bool"
          }
        ]
      }
    },
    {
      name: "DepositEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "lp_token_amount_out",
            type: "u64"
          },
          {
            name: "max_base_amount_in",
            type: "u64"
          },
          {
            name: "max_quote_amount_in",
            type: "u64"
          },
          {
            name: "user_base_token_reserves",
            type: "u64"
          },
          {
            name: "user_quote_token_reserves",
            type: "u64"
          },
          {
            name: "pool_base_token_reserves",
            type: "u64"
          },
          {
            name: "pool_quote_token_reserves",
            type: "u64"
          },
          {
            name: "base_amount_in",
            type: "u64"
          },
          {
            name: "quote_amount_in",
            type: "u64"
          },
          {
            name: "lp_mint_supply",
            type: "u64"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "user_base_token_account",
            type: "pubkey"
          },
          {
            name: "user_quote_token_account",
            type: "pubkey"
          },
          {
            name: "user_pool_token_account",
            type: "pubkey"
          }
        ]
      }
    },
    {
      name: "DisableEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "admin",
            type: "pubkey"
          },
          {
            name: "disable_create_pool",
            type: "bool"
          },
          {
            name: "disable_deposit",
            type: "bool"
          },
          {
            name: "disable_withdraw",
            type: "bool"
          },
          {
            name: "disable_buy",
            type: "bool"
          },
          {
            name: "disable_sell",
            type: "bool"
          }
        ]
      }
    },
    {
      name: "ExtendAccountEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "account",
            type: "pubkey"
          },
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "current_size",
            type: "u64"
          },
          {
            name: "new_size",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "FeeConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8"
          },
          {
            name: "admin",
            type: "pubkey"
          },
          {
            name: "flat_fees",
            type: {
              defined: {
                name: "Fees"
              }
            }
          },
          {
            name: "fee_tiers",
            type: {
              vec: {
                defined: {
                  name: "FeeTier"
                }
              }
            }
          },
          {
            name: "stable_fee_tiers",
            type: {
              vec: {
                defined: {
                  name: "FeeTier"
                }
              }
            }
          },
          {
            name: "exotic_flat_fees",
            type: {
              defined: {
                name: "Fees"
              }
            }
          }
        ]
      }
    },
    {
      name: "FeeTier",
      type: {
        kind: "struct",
        fields: [
          {
            name: "market_cap_lamports_threshold",
            type: "u128"
          },
          {
            name: "fees",
            type: {
              defined: {
                name: "Fees"
              }
            }
          }
        ]
      }
    },
    {
      name: "Fees",
      type: {
        kind: "struct",
        fields: [
          {
            name: "lp_fee_bps",
            type: "u64"
          },
          {
            name: "protocol_fee_bps",
            type: "u64"
          },
          {
            name: "creator_fee_bps",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "GlobalConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "admin",
            docs: [
              "The admin pubkey"
            ],
            type: "pubkey"
          },
          {
            name: "lp_fee_basis_points",
            type: "u64"
          },
          {
            name: "protocol_fee_basis_points",
            type: "u64"
          },
          {
            name: "disable_flags",
            docs: [
              "Flags to disable certain functionality",
              "bit 0 - Disable create pool",
              "bit 1 - Disable deposit",
              "bit 2 - Disable withdraw",
              "bit 3 - Disable buy",
              "bit 4 - Disable sell"
            ],
            type: "u8"
          },
          {
            name: "protocol_fee_recipients",
            docs: [
              "Addresses of the protocol fee recipients"
            ],
            type: {
              array: [
                "pubkey",
                8
              ]
            }
          },
          {
            name: "coin_creator_fee_basis_points",
            type: "u64"
          },
          {
            name: "admin_set_coin_creator_authority",
            docs: [
              "The admin authority for setting coin creators"
            ],
            type: "pubkey"
          },
          {
            name: "whitelist_pda",
            type: "pubkey"
          },
          {
            name: "reserved_fee_recipient",
            type: "pubkey"
          },
          {
            name: "mayhem_mode_enabled",
            type: "bool"
          },
          {
            name: "reserved_fee_recipients",
            type: {
              array: [
                "pubkey",
                7
              ]
            }
          },
          {
            name: "is_cashback_enabled",
            type: "bool"
          },
          {
            name: "buyback_fee_recipients",
            type: {
              array: [
                "pubkey",
                8
              ]
            }
          },
          {
            name: "buyback_basis_points",
            type: "u64"
          },
          {
            name: "boost_authority",
            type: "pubkey"
          },
          {
            name: "boost_enabled",
            type: "bool"
          },
          {
            name: "creator_fee_configurable",
            type: "bool"
          },
          {
            name: "max_configurable_creator_fee_bps",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "GlobalVolumeAccumulator",
      type: {
        kind: "struct",
        fields: [
          {
            name: "start_time",
            type: "i64"
          },
          {
            name: "end_time",
            type: "i64"
          },
          {
            name: "seconds_in_a_day",
            type: "i64"
          },
          {
            name: "mint",
            type: "pubkey"
          },
          {
            name: "total_token_supply",
            type: {
              array: [
                "u64",
                30
              ]
            }
          },
          {
            name: "sol_volumes",
            type: {
              array: [
                "u64",
                30
              ]
            }
          }
        ]
      }
    },
    {
      name: "InitBoostEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "mint",
            type: "pubkey"
          },
          {
            name: "bonding_curve",
            type: "pubkey"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "virtual_quote_reserves",
            type: "i128"
          },
          {
            name: "real_quote_reserves_after",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "InitUserVolumeAccumulatorEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "payer",
            type: "pubkey"
          },
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "timestamp",
            type: "i64"
          }
        ]
      }
    },
    {
      name: "MigratePoolCoinCreatorEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "base_mint",
            type: "pubkey"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "sharing_config",
            type: "pubkey"
          },
          {
            name: "old_coin_creator",
            type: "pubkey"
          },
          {
            name: "new_coin_creator",
            type: "pubkey"
          }
        ]
      }
    },
    {
      name: "OptionBool",
      type: {
        kind: "struct",
        fields: [
          "bool"
        ]
      }
    },
    {
      name: "OptionU64",
      type: {
        kind: "struct",
        fields: [
          "u64"
        ]
      }
    },
    {
      name: "Pool",
      type: {
        kind: "struct",
        fields: [
          {
            name: "pool_bump",
            type: "u8"
          },
          {
            name: "index",
            type: "u16"
          },
          {
            name: "creator",
            type: "pubkey"
          },
          {
            name: "base_mint",
            type: "pubkey"
          },
          {
            name: "quote_mint",
            type: "pubkey"
          },
          {
            name: "lp_mint",
            type: "pubkey"
          },
          {
            name: "pool_base_token_account",
            type: "pubkey"
          },
          {
            name: "pool_quote_token_account",
            type: "pubkey"
          },
          {
            name: "lp_supply",
            docs: [
              "True circulating supply without burns and lock-ups"
            ],
            type: "u64"
          },
          {
            name: "coin_creator",
            type: "pubkey"
          },
          {
            name: "is_mayhem_mode",
            type: "bool"
          },
          {
            name: "is_cashback_coin",
            type: "bool"
          },
          {
            name: "virtual_quote_reserves",
            docs: [
              "For non-boost pools, value is 0, so the behavior is identical to legacy pools."
            ],
            type: "i128"
          },
          {
            name: "creator_fee_bps",
            type: "u64"
          },
          {
            name: "can_edit_creator_fee",
            type: "bool"
          },
          {
            name: "is_holder_reward",
            type: "bool"
          },
          {
            name: "protocol_fees",
            type: "u64"
          },
          {
            name: "creator_fees",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "ReservedFeeRecipientsEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "reserved_fee_recipient",
            type: "pubkey"
          },
          {
            name: "reserved_fee_recipients",
            type: {
              array: [
                "pubkey",
                7
              ]
            }
          }
        ]
      }
    },
    {
      name: "SellEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "base_amount_in",
            type: "u64"
          },
          {
            name: "min_quote_amount_out",
            type: "u64"
          },
          {
            name: "user_base_token_reserves",
            type: "u64"
          },
          {
            name: "user_quote_token_reserves",
            type: "u64"
          },
          {
            name: "pool_base_token_reserves",
            type: "u64"
          },
          {
            name: "pool_quote_token_reserves",
            type: "u64"
          },
          {
            name: "quote_amount_out",
            type: "u64"
          },
          {
            name: "lp_fee_basis_points",
            type: "u64"
          },
          {
            name: "lp_fee",
            type: "u64"
          },
          {
            name: "protocol_fee_basis_points",
            type: "u64"
          },
          {
            name: "protocol_fee",
            type: "u64"
          },
          {
            name: "quote_amount_out_without_lp_fee",
            type: "u64"
          },
          {
            name: "user_quote_amount_out",
            type: "u64"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "user_base_token_account",
            type: "pubkey"
          },
          {
            name: "user_quote_token_account",
            type: "pubkey"
          },
          {
            name: "protocol_fee_recipient",
            type: "pubkey"
          },
          {
            name: "protocol_fee_recipient_token_account",
            type: "pubkey"
          },
          {
            name: "coin_creator",
            type: "pubkey"
          },
          {
            name: "coin_creator_fee_basis_points",
            type: "u64"
          },
          {
            name: "coin_creator_fee",
            type: "u64"
          },
          {
            name: "cashback_fee_basis_points",
            type: "u64"
          },
          {
            name: "cashback",
            type: "u64"
          },
          {
            name: "buyback_fee_basis_points",
            type: "u64"
          },
          {
            name: "buyback_fee",
            type: "u64"
          },
          {
            name: "virtual_quote_reserves",
            type: "i128"
          },
          {
            name: "can_boost",
            type: "bool"
          },
          {
            name: "base_supply",
            type: "u64"
          },
          {
            name: "holder_rewards_bps",
            type: "u64"
          },
          {
            name: "holder_rewards",
            type: "u64"
          },
          {
            name: "creator_fee_unclaimed",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "SetBondingCurveCoinCreatorEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "base_mint",
            type: "pubkey"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "bonding_curve",
            type: "pubkey"
          },
          {
            name: "coin_creator",
            type: "pubkey"
          }
        ]
      }
    },
    {
      name: "SetBoostAuthorityEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "admin",
            type: "pubkey"
          },
          {
            name: "old_boost_authority",
            type: "pubkey"
          },
          {
            name: "new_boost_authority",
            type: "pubkey"
          }
        ]
      }
    },
    {
      name: "SetMetaplexCoinCreatorEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "base_mint",
            type: "pubkey"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "metadata",
            type: "pubkey"
          },
          {
            name: "coin_creator",
            type: "pubkey"
          }
        ]
      }
    },
    {
      name: "Shareholder",
      type: {
        kind: "struct",
        fields: [
          {
            name: "address",
            type: "pubkey"
          },
          {
            name: "share_bps",
            type: "u16"
          }
        ]
      }
    },
    {
      name: "SharingConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8"
          },
          {
            name: "version",
            type: "u8"
          },
          {
            name: "status",
            type: {
              defined: {
                name: "ConfigStatus"
              }
            }
          },
          {
            name: "mint",
            type: "pubkey"
          },
          {
            name: "admin",
            type: "pubkey"
          },
          {
            name: "admin_revoked",
            type: "bool"
          },
          {
            name: "shareholders",
            type: {
              vec: {
                defined: {
                  name: "Shareholder"
                }
              }
            }
          }
        ]
      }
    },
    {
      name: "SweepPoolFeeEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "base_mint",
            type: "pubkey"
          },
          {
            name: "quote_mint",
            type: "pubkey"
          },
          {
            name: "recipient",
            type: "pubkey"
          },
          {
            name: "payer",
            type: "pubkey"
          },
          {
            name: "amount",
            type: "u64"
          },
          {
            name: "bucket",
            type: "u8"
          }
        ]
      }
    },
    {
      name: "SyncUserVolumeAccumulatorEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "total_claimed_tokens_before",
            type: "u64"
          },
          {
            name: "total_claimed_tokens_after",
            type: "u64"
          },
          {
            name: "timestamp",
            type: "i64"
          }
        ]
      }
    },
    {
      name: "UpdateAdminEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "admin",
            type: "pubkey"
          },
          {
            name: "new_admin",
            type: "pubkey"
          }
        ]
      }
    },
    {
      name: "UpdateCreatorFeeConfigEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "admin",
            type: "pubkey"
          },
          {
            name: "creator_fee_configurable",
            type: "bool"
          },
          {
            name: "max_configurable_creator_fee_bps",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "UpdateFeeConfigEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "admin",
            type: "pubkey"
          },
          {
            name: "lp_fee_basis_points",
            type: "u64"
          },
          {
            name: "protocol_fee_basis_points",
            type: "u64"
          },
          {
            name: "protocol_fee_recipients",
            type: {
              array: [
                "pubkey",
                8
              ]
            }
          },
          {
            name: "coin_creator_fee_basis_points",
            type: "u64"
          },
          {
            name: "admin_set_coin_creator_authority",
            type: "pubkey"
          }
        ]
      }
    },
    {
      name: "UserVolumeAccumulator",
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "needs_claim",
            type: "bool"
          },
          {
            name: "total_unclaimed_tokens",
            type: "u64"
          },
          {
            name: "total_claimed_tokens",
            type: "u64"
          },
          {
            name: "current_sol_volume",
            type: "u64"
          },
          {
            name: "last_update_timestamp",
            type: "i64"
          },
          {
            name: "has_total_claimed_tokens",
            type: "bool"
          },
          {
            name: "cashback_earned",
            type: "u64"
          },
          {
            name: "total_cashback_claimed",
            type: "u64"
          }
        ]
      }
    },
    {
      name: "WithdrawEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "lp_token_amount_in",
            type: "u64"
          },
          {
            name: "min_base_amount_out",
            type: "u64"
          },
          {
            name: "min_quote_amount_out",
            type: "u64"
          },
          {
            name: "user_base_token_reserves",
            type: "u64"
          },
          {
            name: "user_quote_token_reserves",
            type: "u64"
          },
          {
            name: "pool_base_token_reserves",
            type: "u64"
          },
          {
            name: "pool_quote_token_reserves",
            type: "u64"
          },
          {
            name: "base_amount_out",
            type: "u64"
          },
          {
            name: "quote_amount_out",
            type: "u64"
          },
          {
            name: "lp_mint_supply",
            type: "u64"
          },
          {
            name: "pool",
            type: "pubkey"
          },
          {
            name: "user",
            type: "pubkey"
          },
          {
            name: "user_base_token_account",
            type: "pubkey"
          },
          {
            name: "user_quote_token_account",
            type: "pubkey"
          },
          {
            name: "user_pool_token_account",
            type: "pubkey"
          }
        ]
      }
    }
  ]
};

// src/sdk/util.ts
function ceilDiv2(a, b) {
  if (b.isZero()) {
    throw new Error("Cannot divide by zero.");
  }
  return a.add(b).subn(1).div(b);
}
function fee(amount, basisPoints) {
  return ceilDiv2(amount.mul(basisPoints), new import_bn4.default(1e4));
}
function getPumpAmmProgram(connection) {
  return new import_anchor.Program(
    pump_amm_default,
    new import_anchor.AnchorProvider(connection, null, {})
  );
}
function isPumpPool(baseMint, poolCreator) {
  return pumpPoolAuthorityPda(baseMint).equals(poolCreator);
}
function supportsTradeV2(pool) {
  return !pool.isCashbackCoin;
}
var PUMP_AMM_TOTAL_TOKEN_SUPPLY = new import_bn4.default("1000000000000000");
function poolMarketCap({
  baseMintSupply,
  baseReserve,
  quoteReserve,
  isMayhemMode = false
}) {
  if (baseReserve.isZero()) {
    throw new Error(
      "Division by zero: pool base token reserves cannot be zero"
    );
  }
  const circulatingSupply = isMayhemMode ? PUMP_AMM_TOTAL_TOKEN_SUPPLY : baseMintSupply;
  return quoteReserve.mul(circulatingSupply).div(baseReserve);
}

// src/sdk/fees.ts
var import_web32 = require("@solana/web3.js");
var import_spl_token2 = require("@solana/spl-token");
var USDC_MINT = new import_web32.PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);
var STABLE_QUOTE_MINTS = Object.freeze([
  USDC_MINT
]);
var SOL_LIKE_QUOTE_MINTS = Object.freeze([
  import_web32.PublicKey.default,
  import_spl_token2.NATIVE_MINT,
  import_spl_token2.NATIVE_MINT_2022
]);
function isSolLikeQuoteMint(quoteMint) {
  return SOL_LIKE_QUOTE_MINTS.some((mint) => mint.equals(quoteMint));
}
function isStableQuoteMint(quoteMint) {
  return STABLE_QUOTE_MINTS.some((mint) => mint.equals(quoteMint));
}
function isZeroFees(fees) {
  return fees.lpFeeBps.isZero() && fees.protocolFeeBps.isZero() && fees.creatorFeeBps.isZero();
}
function computeFeesBps({
  globalConfig,
  feeConfig,
  creator,
  baseMintSupply,
  baseMint,
  baseReserve,
  quoteReserve,
  quoteMint = import_spl_token2.NATIVE_MINT,
  isMayhemMode = false,
  creatorFeeBps
}) {
  if (feeConfig != null) {
    const marketCap = poolMarketCap({
      baseMintSupply,
      baseReserve,
      quoteReserve,
      isMayhemMode
    });
    const fees = feesForQuoteMint({
      feeConfig,
      isPumpPool: isPumpPool(baseMint, creator),
      marketCap,
      quoteMint
    });
    return globalConfig.creatorFeeConfigurable && creatorFeeBps?.gtn(0) ? { ...fees, creatorFeeBps } : fees;
  }
  return {
    lpFeeBps: globalConfig.lpFeeBasisPoints,
    protocolFeeBps: globalConfig.protocolFeeBasisPoints,
    creatorFeeBps: globalConfig.coinCreatorFeeBasisPoints
  };
}
function feesForQuoteMint({
  feeConfig,
  isPumpPool: isPumpPool2,
  marketCap,
  quoteMint
}) {
  if (!isPumpPool2) {
    return feeConfig.flatFees;
  }
  if (isSolLikeQuoteMint(quoteMint)) {
    return calculateFeeTier({ feeTiers: feeConfig.feeTiers, marketCap });
  }
  if (isStableQuoteMint(quoteMint)) {
    return calculateFeeTier({
      feeTiers: feeConfig.stableFeeTiers.length > 0 ? feeConfig.stableFeeTiers : feeConfig.feeTiers,
      marketCap
    });
  }
  return isZeroFees(feeConfig.exoticFlatFees) ? feeConfig.flatFees : feeConfig.exoticFlatFees;
}
function calculateFeeTier({
  feeTiers,
  marketCap
}) {
  if (feeTiers.length === 0) {
    throw new Error("Fee tiers cannot be empty.");
  }
  const firstTier = feeTiers[0];
  if (marketCap.lt(firstTier.marketCapLamportsThreshold)) {
    return firstTier.fees;
  }
  for (const tier of feeTiers.slice().reverse()) {
    if (marketCap.gte(tier.marketCapLamportsThreshold)) {
      return tier.fees;
    }
  }
  return firstTier.fees;
}
function getFeeRecipient(globalConfig, isMayhemMode) {
  if (isMayhemMode) {
    const feeRecipients = [
      globalConfig.reservedFeeRecipient,
      ...globalConfig.reservedFeeRecipients
    ];
    return feeRecipients[Math.floor(Math.random() * feeRecipients.length)];
  } else {
    return globalConfig.protocolFeeRecipients[Math.floor(Math.random() * globalConfig.protocolFeeRecipients.length)];
  }
}
function getBuybackFeeRecipient(globalConfig) {
  return globalConfig.buybackFeeRecipients[Math.floor(Math.random() * globalConfig.buybackFeeRecipients.length)];
}

// src/sdk/buy.ts
function buyBaseInput({
  base,
  slippage,
  baseReserve,
  quoteReserve,
  virtualQuoteReserves = new import_bn5.default(0),
  globalConfig,
  baseMintAccount,
  baseMint,
  coinCreator,
  creator,
  feeConfig,
  quoteMint,
  isMayhemMode,
  creatorFeeBps
}) {
  if (baseReserve.isZero() || quoteReserve.isZero()) {
    throw new Error(
      "Invalid input: 'baseReserve' or 'quoteReserve' cannot be zero."
    );
  }
  if (base.gt(baseReserve)) {
    throw new Error("Cannot buy more base tokens than the pool reserves.");
  }
  const effectiveQuoteReserve = quoteReserve.add(virtualQuoteReserves);
  const numerator = effectiveQuoteReserve.mul(base);
  const denominator = baseReserve.sub(base);
  if (denominator.isZero()) {
    throw new Error("Pool would be depleted; denominator is zero.");
  }
  const quoteAmountIn = ceilDiv2(numerator, denominator);
  const {
    lpFeeBps,
    protocolFeeBps,
    creatorFeeBps: coinCreatorFeeBps
  } = computeFeesBps({
    globalConfig,
    feeConfig,
    creator,
    baseMintSupply: new import_bn5.default(baseMintAccount.supply.toString()),
    baseMint,
    baseReserve,
    quoteReserve: effectiveQuoteReserve,
    quoteMint,
    isMayhemMode,
    creatorFeeBps
  });
  const lpFee = fee(quoteAmountIn, lpFeeBps);
  const protocolFee = fee(quoteAmountIn, protocolFeeBps);
  const coinCreatorFee = import_web33.PublicKey.default.equals(coinCreator) ? new import_bn5.default(0) : fee(quoteAmountIn, coinCreatorFeeBps);
  const totalQuote = quoteAmountIn.add(lpFee).add(protocolFee).add(coinCreatorFee);
  const precision = new import_bn5.default(1e9);
  const slippageFactorFloat = (1 + slippage / 100) * 1e9;
  const slippageFactor = new import_bn5.default(Math.floor(slippageFactorFloat));
  const maxQuote = totalQuote.mul(slippageFactor).div(precision);
  return {
    internalQuoteAmount: quoteAmountIn,
    uiQuote: totalQuote,
    // Final total quote after fees
    maxQuote
  };
}
function buyQuoteInput({
  quote,
  slippage,
  baseReserve,
  quoteReserve,
  virtualQuoteReserves = new import_bn5.default(0),
  globalConfig,
  baseMintAccount,
  baseMint,
  coinCreator,
  creator,
  feeConfig,
  quoteMint,
  isMayhemMode,
  creatorFeeBps
}) {
  if (baseReserve.isZero() || quoteReserve.isZero()) {
    throw new Error(
      "Invalid input: 'baseReserve' or 'quoteReserve' cannot be zero."
    );
  }
  const effectiveQuoteReserve = quoteReserve.add(virtualQuoteReserves);
  const {
    lpFeeBps,
    protocolFeeBps,
    creatorFeeBps: coinCreatorFeeBps
  } = computeFeesBps({
    globalConfig,
    feeConfig,
    creator,
    baseMintSupply: new import_bn5.default(baseMintAccount.supply.toString()),
    baseMint,
    baseReserve,
    quoteReserve: effectiveQuoteReserve,
    quoteMint,
    isMayhemMode,
    creatorFeeBps
  });
  const totalFeeBps = lpFeeBps.add(protocolFeeBps).add(import_web33.PublicKey.default.equals(coinCreator) ? new import_bn5.default(0) : coinCreatorFeeBps);
  const denominator = new import_bn5.default(1e4).add(totalFeeBps);
  let effectiveQuote = quote.mul(new import_bn5.default(1e4)).div(denominator);
  const lpFee = fee(effectiveQuote, lpFeeBps);
  const protocolFee = fee(effectiveQuote, protocolFeeBps);
  const coinCreatorFee = import_web33.PublicKey.default.equals(coinCreator) ? new import_bn5.default(0) : fee(effectiveQuote, coinCreatorFeeBps);
  const totalWithFees = effectiveQuote.add(lpFee).add(protocolFee).add(coinCreatorFee);
  if (totalWithFees.gt(quote)) {
    effectiveQuote = effectiveQuote.sub(totalWithFees.sub(quote));
  }
  const inputAmount = effectiveQuote.subn(1);
  const numerator = baseReserve.mul(inputAmount);
  const denominatorEffective = effectiveQuoteReserve.add(inputAmount);
  if (denominatorEffective.isZero()) {
    throw new Error("Pool would be depleted; denominator is zero.");
  }
  const baseAmountOut = numerator.div(denominatorEffective);
  const precision = new import_bn5.default(1e9);
  const slippageFactorFloat = (1 + slippage / 100) * 1e9;
  const slippageFactor = new import_bn5.default(Math.floor(slippageFactorFloat));
  const maxQuote = quote.mul(slippageFactor).div(precision);
  return {
    base: baseAmountOut,
    // Base tokens received after fees
    internalQuoteWithoutFees: effectiveQuote,
    maxQuote
    // Maximum quote tokens to pay (with slippage)
  };
}

// src/sdk/sell.ts
var import_bn6 = __toESM(require("bn.js"));
var import_web34 = require("@solana/web3.js");
function sellBaseInput({
  base,
  slippage,
  baseReserve,
  quoteReserve,
  virtualQuoteReserves = new import_bn6.default(0),
  feeBucketsTotal = new import_bn6.default(0),
  globalConfig,
  baseMintAccount,
  baseMint,
  coinCreator,
  creator,
  feeConfig,
  quoteMint,
  isMayhemMode,
  creatorFeeBps
}) {
  if (baseReserve.isZero() || quoteReserve.isZero()) {
    throw new Error(
      "Invalid input: 'baseReserve' or 'quoteReserve' cannot be zero."
    );
  }
  const effectiveQuoteReserve = quoteReserve.add(virtualQuoteReserves);
  const quoteAmountOut = effectiveQuoteReserve.mul(base).div(baseReserve.add(base));
  const {
    lpFeeBps,
    protocolFeeBps,
    creatorFeeBps: coinCreatorFeeBps
  } = computeFeesBps({
    globalConfig,
    feeConfig,
    creator,
    baseMintSupply: new import_bn6.default(baseMintAccount.supply.toString()),
    baseMint,
    baseReserve,
    quoteReserve: effectiveQuoteReserve,
    quoteMint,
    isMayhemMode,
    creatorFeeBps
  });
  const lpFee = fee(quoteAmountOut, lpFeeBps);
  const protocolFee = fee(quoteAmountOut, protocolFeeBps);
  const coinCreatorFee = import_web34.PublicKey.default.equals(coinCreator) ? new import_bn6.default(0) : fee(quoteAmountOut, coinCreatorFeeBps);
  const { userQuoteAmountOut: finalQuote } = sellAmounts(
    quoteAmountOut,
    { lpFee, protocolFee, coinCreatorFee },
    quoteReserve.sub(feeBucketsTotal)
  );
  if (finalQuote.isNeg()) {
    throw new Error("Fees exceed total output; final quote is negative.");
  }
  const precision = new import_bn6.default(1e9);
  const slippageFactorFloat = (1 - slippage / 100) * 1e9;
  const slippageFactor = new import_bn6.default(Math.floor(slippageFactorFloat));
  const minQuote = finalQuote.mul(slippageFactor).div(precision);
  return {
    uiQuote: finalQuote,
    // actual tokens user receives after fees
    minQuote,
    // minimum acceptable tokens after applying slippage
    internalQuoteAmountOut: quoteAmountOut
  };
}
function sellAmounts(quoteAmountOut, fees, realQuoteReserves) {
  const quoteAmountOutWithoutLpFee = quoteAmountOut.sub(fees.lpFee);
  if (realQuoteReserves.lt(quoteAmountOutWithoutLpFee)) {
    throw new Error(
      "Insufficient real quote reserves to cover the sell output."
    );
  }
  return {
    quoteAmountOutWithoutLpFee,
    userQuoteAmountOut: quoteAmountOutWithoutLpFee.sub(fees.coinCreatorFee).sub(fees.protocolFee)
  };
}
var MAX_FEE_BASIS_POINTS = new import_bn6.default(1e4);
function calculateQuoteAmountOut(userQuoteAmountOut, lpFeeBasisPoints, protocolFeeBasisPoints, coinCreatorFeeBasisPoints) {
  const totalFeeBasisPoints = lpFeeBasisPoints.add(protocolFeeBasisPoints).add(coinCreatorFeeBasisPoints);
  const denominator = MAX_FEE_BASIS_POINTS.sub(totalFeeBasisPoints);
  return ceilDiv2(userQuoteAmountOut.mul(MAX_FEE_BASIS_POINTS), denominator);
}
function sellQuoteInput({
  quote,
  slippage,
  baseReserve,
  quoteReserve,
  virtualQuoteReserves = new import_bn6.default(0),
  feeBucketsTotal = new import_bn6.default(0),
  globalConfig,
  baseMintAccount,
  baseMint,
  coinCreator,
  creator,
  feeConfig,
  quoteMint,
  isMayhemMode,
  creatorFeeBps
}) {
  if (baseReserve.isZero() || quoteReserve.isZero()) {
    throw new Error(
      "Invalid input: 'baseReserve' or 'quoteReserve' cannot be zero."
    );
  }
  const effectiveQuoteReserve = quoteReserve.add(virtualQuoteReserves);
  const {
    lpFeeBps,
    protocolFeeBps,
    creatorFeeBps: coinCreatorFeeBps
  } = computeFeesBps({
    globalConfig,
    feeConfig,
    creator,
    baseMintSupply: new import_bn6.default(baseMintAccount.supply.toString()),
    baseMint,
    baseReserve,
    quoteReserve: effectiveQuoteReserve,
    quoteMint,
    isMayhemMode,
    creatorFeeBps
  });
  const rawQuote = calculateQuoteAmountOut(
    quote,
    lpFeeBps,
    protocolFeeBps,
    import_web34.PublicKey.default.equals(coinCreator) ? new import_bn6.default(0) : coinCreatorFeeBps
  );
  if (rawQuote.gte(effectiveQuoteReserve)) {
    throw new Error(
      "Invalid input: Desired quote amount exceeds available reserve."
    );
  }
  const baseAmountIn = ceilDiv2(
    baseReserve.mul(rawQuote),
    effectiveQuoteReserve.sub(rawQuote)
  );
  const quoteAmountOut = effectiveQuoteReserve.mul(baseAmountIn).div(baseReserve.add(baseAmountIn));
  if (quoteReserve.sub(feeBucketsTotal).lt(quoteAmountOut.sub(fee(quoteAmountOut, lpFeeBps)))) {
    throw new Error(
      "Insufficient real quote reserves to cover the sell output."
    );
  }
  const precision = new import_bn6.default(1e9);
  const slippageFactorFloat = (1 - slippage / 100) * 1e9;
  const slippageFactor = new import_bn6.default(Math.floor(slippageFactorFloat));
  const minQuote = quote.mul(slippageFactor).div(precision);
  return {
    internalRawQuote: rawQuote,
    base: baseAmountIn,
    // amount of base tokens required to get the desired quote
    minQuote
    // minimum acceptable tokens after applying slippage
  };
}

// src/sdk/multiHop.ts
var import_bn7 = __toESM(require("bn.js"));
var import_web35 = require("@solana/web3.js");
var import_spl_token3 = require("@solana/spl-token");
var MULTI_HOP_MAX_HOPS = 6;
var MULTI_HOP_MAX_POOLS_AT_MAX_HOPS = 3;
function isSolCurve(venue) {
  return venue.kind === "curve" && canonicalPoolQuoteMint(venue.quoteMint).equals(import_spl_token3.NATIVE_MINT);
}
function venueMints(venue) {
  if (venue.kind === "pool") {
    return venue.pool;
  }
  return {
    baseMint: venue.baseMint,
    quoteMint: canonicalPoolQuoteMint(venue.quoteMint)
  };
}
function venueQuoteTokenProgram(venue) {
  return isSolCurve(venue) ? import_spl_token3.TOKEN_PROGRAM_ID : venue.quoteTokenProgram;
}
function multiHopLegFees(isBuy, index, hops, isPool = true) {
  const first = index === 0;
  const last = index + 1 === hops;
  const [protocol, target] = isBuy ? [first, last] : [last, first];
  return { protocol, creator: target, lp: target && isPool };
}
function resolveMultiHopRoute(inMint, venues) {
  const hops = venues.length;
  if (hops === 0) {
    throw new Error("A multi-hop route needs at least one hop.");
  }
  const pools = venues.filter((venue) => venue.kind === "pool").length;
  if (hops > MULTI_HOP_MAX_HOPS || hops === MULTI_HOP_MAX_HOPS && pools > MULTI_HOP_MAX_POOLS_AT_MAX_HOPS) {
    throw new Error(
      `A ${hops}-hop route with ${pools} pool hops exceeds the programs' heap (at most ${MULTI_HOP_MAX_HOPS} hops, ${MULTI_HOP_MAX_POOLS_AT_MAX_HOPS} of them pools at that length).`
    );
  }
  inMint = canonicalPoolQuoteMint(inMint);
  const { quoteMint: firstQuote } = venueMints(venues[0]);
  const isBuy = inMint.equals(firstQuote);
  const mints = [inMint];
  const legs = venues.map((venue, i) => {
    const { baseMint, quoteMint } = venueMints(venue);
    const running = mints[i];
    const hopIsBuy = running.equals(quoteMint);
    if (!hopIsBuy && !running.equals(baseMint)) {
      throw new Error(
        `Hop ${i} trades ${baseMint.toBase58()}/${quoteMint.toBase58()}, not the running mint ${running.toBase58()}.`
      );
    }
    if (hopIsBuy !== isBuy) {
      throw new Error(
        "Every hop of a multi-hop route must trade in the same direction."
      );
    }
    mints.push(hopIsBuy ? baseMint : quoteMint);
    const hopLegs = multiHopLegFees(isBuy, i, hops, venue.kind === "pool");
    if (venue.kind === "curve") {
      return hopLegs;
    }
    const { pool, poolKey } = venue;
    if (!isPumpPool(pool.baseMint, pool.creator)) {
      throw new Error(
        `Hop ${i}: pool ${poolKey.toBase58()} is not a canonical pump pool.`
      );
    }
    if (pool.isMayhemMode) {
      throw new Error(`Hop ${i}: pool ${poolKey.toBase58()} is a mayhem pool.`);
    }
    if (pool.isCashbackCoin && hopLegs.creator) {
      throw new Error(
        `Hop ${i}: cashback pool ${poolKey.toBase58()} cannot charge the creator fee.`
      );
    }
    return hopLegs;
  });
  return { isBuy, mints, legs };
}

// src/sdk/offlinePumpAmm.ts
var import_bn8 = __toESM(require("bn.js"));
var POOL_ACCOUNT_NEW_SIZE = 300;
var POOL_SIZE = 287;
var GLOBAL_CONFIG_SIZE = 949;
var FEE_CONFIG_SIZE_PRE_STABLE = 2512;
var FEE_CONFIG_SIZE_POST_STABLE = 4073;
var FEE_CONFIG_SIZE_POST_EXOTIC = 4097;
var FEE_CONFIG_FEE_TIERS_OFFSET = 8 + 1 + 32 + 24;
var FEES_SIZE = 24;
var FEE_TIER_SIZE = 16 + FEES_SIZE;
function padTrailing(data, size) {
  return data.length >= size ? data : Buffer.concat([data, Buffer.alloc(size - data.length)]);
}
function feeTierVecEnd(data, offset) {
  if (offset + 4 > data.length) {
    throw new Error(
      `FeeConfig fee tier vector length at offset ${offset} runs past the account data (${data.length} bytes)`
    );
  }
  const end = offset + 4 + data.readUInt32LE(offset) * FEE_TIER_SIZE;
  if (end > data.length) {
    throw new Error(
      `FeeConfig fee tier vector at offset ${offset} runs past the account data (${data.length} bytes)`
    );
  }
  return end;
}
function versionedFeeConfigData(data) {
  if (data.length < FEE_CONFIG_SIZE_PRE_STABLE) {
    throw new Error(
      `FeeConfig account is ${data.length} bytes; expected at least ${FEE_CONFIG_SIZE_PRE_STABLE}`
    );
  }
  let end = feeTierVecEnd(data, FEE_CONFIG_FEE_TIERS_OFFSET);
  if (data.length >= FEE_CONFIG_SIZE_POST_STABLE) {
    end = feeTierVecEnd(data, end);
  }
  if (data.length >= FEE_CONFIG_SIZE_POST_EXOTIC) {
    end += FEES_SIZE;
    if (end > data.length) {
      throw new Error(
        `FeeConfig exotic flat fees run past the account data (${data.length} bytes)`
      );
    }
  }
  return padTrailing(data.subarray(0, end), FEE_CONFIG_SIZE_POST_EXOTIC);
}
var OFFLINE_PUMP_AMM_PROGRAM = getPumpAmmProgram(
  null
);
var PumpAmmSdk = class {
  constructor() {
    this.offlineProgram = OFFLINE_PUMP_AMM_PROGRAM;
  }
  decodeGlobalConfig(globalConfigAccountInfo) {
    return this.offlineProgram.coder.accounts.decode(
      "globalConfig",
      padTrailing(
        globalConfigAccountInfo.data,
        this.offlineProgram.account.globalConfig.size
      )
    );
  }
  decodeFeeConfig(feeConfigAccountInfo) {
    return this.offlineProgram.coder.accounts.decode(
      "feeConfig",
      versionedFeeConfigData(feeConfigAccountInfo.data)
    );
  }
  decodePool(poolAccountInfo) {
    return this.offlineProgram.coder.accounts.decode(
      "pool",
      padTrailing(poolAccountInfo.data, this.offlineProgram.account.pool.size)
    );
  }
  decodePoolNullable(poolAccountInfo) {
    try {
      return this.decodePool(poolAccountInfo);
    } catch (e) {
      console.warn("Failed to decode pool account", e);
      return null;
    }
  }
  decodeGlobalVolumeAccumulator(globalVolumeAccumulatorAccountInfo) {
    return this.offlineProgram.coder.accounts.decode(
      "globalVolumeAccumulator",
      globalVolumeAccumulatorAccountInfo.data
    );
  }
  decodeUserVolumeAccumulator(userVolumeAccumulatorAccountInfo) {
    return this.offlineProgram.coder.accounts.decode(
      "userVolumeAccumulator",
      userVolumeAccumulatorAccountInfo.data
    );
  }
  decodeUserVolumeAccumulatorNullable(userVolumeAccumulatorAccountInfo) {
    try {
      return this.decodeUserVolumeAccumulator(userVolumeAccumulatorAccountInfo);
    } catch (e) {
      console.warn("Failed to decode user volume accumulator", e);
      return null;
    }
  }
  /**
   * Builds `create_pool` (plus the pool ATA creates and wSOL wrapping it needs) for a
   * permissionless pool: `coin_creator` is the default key and `creator` is a wallet signer (a
   * canonical pump pool's creator is pump's pool-authority PDA, which signs only through pump's
   * `migrate` / `migrate_v2` CPI). `creatorFeeBps`, `canEditCreatorFee` and `isHolderReward` are
   * the instruction's three trailing arguments, always encoded (0 / false when unset), so
   * `create_pool` data is 10 bytes longer than before they existed; the program ignores trailing
   * bytes it does not read. The program stores the values for canonical pools only: a nonzero /
   * true `creatorFeeBps` / `canEditCreatorFee` on a permissionless pool fails with
   * `OnlyCanonicalPumpPoolsCanHaveCoinCreator`, and `isHolderReward` is stored as false on one.
   * The options exist to keep the encoding aligned with the IDL; canonical pools receive the
   * bonding curve's values from `migrate` / `migrate_v2`.
   */
  async createPoolInstructions(createPoolSolanaState, baseIn, quoteIn, {
    creatorFeeBps = new import_bn8.default(0),
    canEditCreatorFee = false,
    isHolderReward = false
  } = {}) {
    const {
      index,
      creator,
      baseMint,
      quoteMint,
      poolKey,
      baseTokenProgram,
      quoteTokenProgram,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
      userBaseAccountInfo,
      userQuoteAccountInfo,
      poolBaseAccountInfo,
      poolQuoteAccountInfo
    } = createPoolSolanaState;
    return await this.withWsolAccounts(
      creator,
      baseMint,
      userBaseTokenAccount,
      this.accountExists(userBaseAccountInfo, baseTokenProgram),
      baseIn,
      quoteMint,
      userQuoteTokenAccount,
      this.accountExists(userQuoteAccountInfo, quoteTokenProgram),
      quoteIn,
      async () => {
        const instructions = [];
        if (!this.accountExists(poolBaseAccountInfo, baseTokenProgram)) {
          instructions.push(
            (0, import_spl_token4.createAssociatedTokenAccountIdempotentInstruction)(
              creator,
              poolBaseTokenAccount,
              poolKey,
              baseMint,
              baseTokenProgram
            )
          );
        }
        if (!this.accountExists(poolQuoteAccountInfo, quoteTokenProgram)) {
          instructions.push(
            (0, import_spl_token4.createAssociatedTokenAccountIdempotentInstruction)(
              creator,
              poolQuoteTokenAccount,
              poolKey,
              quoteMint,
              quoteTokenProgram
            )
          );
        }
        instructions.push(
          await this.offlineProgram.methods.createPool(
            index,
            baseIn,
            quoteIn,
            import_web36.SystemProgram.programId,
            false,
            { 0: false },
            { 0: creatorFeeBps },
            { 0: canEditCreatorFee },
            { 0: isHolderReward }
          ).accountsPartial({
            globalConfig: GLOBAL_CONFIG_PDA,
            baseMint,
            quoteMint,
            creator,
            userBaseTokenAccount,
            userQuoteTokenAccount,
            baseTokenProgram,
            quoteTokenProgram
          }).instruction()
        );
        return instructions;
      }
    );
  }
  async depositInstructionsInternal(liquiditySolanaState, lpToken, maxBase, maxQuote) {
    const {
      pool,
      user,
      userPoolAccountInfo,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      userPoolTokenAccount,
      userBaseAccountInfo,
      userQuoteAccountInfo,
      baseTokenProgram,
      quoteTokenProgram
    } = liquiditySolanaState;
    const { baseMint, quoteMint, lpMint } = pool;
    const liquidityAccounts = this.liquidityAccounts(liquiditySolanaState);
    return await this.withFixPoolInstructions(
      liquiditySolanaState,
      async () => {
        return await this.withWsolAccounts(
          user,
          baseMint,
          userBaseTokenAccount,
          this.accountExists(userBaseAccountInfo, baseTokenProgram),
          maxBase,
          quoteMint,
          userQuoteTokenAccount,
          this.accountExists(userQuoteAccountInfo, quoteTokenProgram),
          maxQuote,
          async () => {
            const instructions = [];
            if (!this.accountExists(userPoolAccountInfo, import_spl_token4.TOKEN_2022_PROGRAM_ID)) {
              instructions.push(
                (0, import_spl_token4.createAssociatedTokenAccountIdempotentInstruction)(
                  user,
                  userPoolTokenAccount,
                  user,
                  lpMint,
                  import_spl_token4.TOKEN_2022_PROGRAM_ID
                )
              );
            }
            instructions.push(
              await this.offlineProgram.methods.deposit(lpToken, maxBase, maxQuote).accounts(liquidityAccounts).instruction()
            );
            return instructions;
          }
        );
      }
    );
  }
  async withWsolAccounts(user, baseMint, userBaseAta, userBaseAtaExists, baseAmount, quoteMint, userQuoteAta, userQuoteAtaExists, quoteAmount, block) {
    return await this.withWsolAccount(
      user,
      user,
      baseMint,
      userBaseAta,
      userBaseAtaExists,
      baseAmount,
      async () => this.withWsolAccount(
        user,
        user,
        quoteMint,
        userQuoteAta,
        userQuoteAtaExists,
        quoteAmount,
        block
      )
    );
  }
  /**
   * Creates `ata` (the associated token account of `owner` for `mint` under `tokenProgram`) when
   * it does not exist yet; any mint and either token program.
   */
  ensureAtaInstructions(payer, owner, mint, ata, ataExists, tokenProgram) {
    return ataExists ? [] : [
      (0, import_spl_token4.createAssociatedTokenAccountIdempotentInstruction)(
        payer,
        ata,
        owner,
        mint,
        tokenProgram
      )
    ];
  }
  /**
   * Runs `block` with the wSOL handling a legacy-WSOL leg needs: the user's wSOL ATA is created
   * when missing, funded with `amount` lamports and closed again afterwards to unwrap. For any
   * other mint `block` runs alone; that ATA holds the user's own tokens and is left as is.
   */
  async withWsolAccount(payer, user, mint, ata, ataExists, amount, block) {
    const instructions = [];
    if (mint.equals(import_spl_token4.NATIVE_MINT)) {
      instructions.push(
        ...this.ensureAtaInstructions(
          payer,
          user,
          import_spl_token4.NATIVE_MINT,
          ata,
          ataExists,
          import_spl_token4.TOKEN_PROGRAM_ID
        )
      );
      if (amount.gtn(0)) {
        instructions.push(
          import_web36.SystemProgram.transfer({
            fromPubkey: user,
            toPubkey: ata,
            lamports: BigInt(amount.toString())
          }),
          (0, import_spl_token4.createSyncNativeInstruction)(ata)
        );
      }
    }
    const blockInstructions = await block();
    instructions.push(...blockInstructions);
    if (mint.equals(import_spl_token4.NATIVE_MINT)) {
      instructions.push(
        (0, import_spl_token4.createCloseAccountInstruction)(
          ata,
          user,
          user,
          void 0,
          import_spl_token4.TOKEN_PROGRAM_ID
        )
      );
    }
    return instructions;
  }
  accountExists(accountInfo, owner) {
    return accountInfo !== null && accountInfo.owner.equals(owner);
  }
  depositBaseInput(liquiditySolanaState, base, slippage) {
    const { pool, poolBaseTokenAccount } = liquiditySolanaState;
    const { token1, lpToken, maxToken0, maxToken1 } = depositToken0(
      base,
      slippage,
      new import_bn8.default(poolBaseTokenAccount.amount.toString()),
      this.realQuoteReserves(liquiditySolanaState),
      pool.lpSupply
    );
    return {
      quote: token1,
      lpToken,
      maxBase: maxToken0,
      maxQuote: maxToken1
    };
  }
  depositQuoteInput(liquiditySolanaState, quote, slippage) {
    const { pool, poolBaseTokenAccount } = liquiditySolanaState;
    const { token1, lpToken, maxToken0, maxToken1 } = depositToken0(
      quote,
      slippage,
      this.realQuoteReserves(liquiditySolanaState),
      new import_bn8.default(poolBaseTokenAccount.amount.toString()),
      pool.lpSupply
    );
    return {
      base: token1,
      lpToken,
      maxBase: maxToken1,
      maxQuote: maxToken0
    };
  }
  async withdrawInstructionsInternal(liquiditySolanaState, lpTokenAmountIn, minBaseAmountOut, minQuoteAmountOut) {
    const {
      pool,
      baseTokenProgram,
      quoteTokenProgram,
      user,
      userBaseAccountInfo,
      userQuoteAccountInfo,
      userBaseTokenAccount,
      userQuoteTokenAccount
    } = liquiditySolanaState;
    const { baseMint, quoteMint } = pool;
    const liquidityAccounts = this.liquidityAccounts(liquiditySolanaState);
    return await this.withFixPoolInstructions(
      liquiditySolanaState,
      async () => {
        const instructions = [];
        let baseWsolAtaCreated = false;
        if (!this.accountExists(userBaseAccountInfo, baseTokenProgram)) {
          instructions.push(
            (0, import_spl_token4.createAssociatedTokenAccountIdempotentInstruction)(
              user,
              userBaseTokenAccount,
              user,
              baseMint,
              baseTokenProgram
            )
          );
          if (baseMint.equals(import_spl_token4.NATIVE_MINT)) {
            baseWsolAtaCreated = true;
          }
        }
        let quoteWsolAtaCreated = false;
        if (!this.accountExists(userQuoteAccountInfo, quoteTokenProgram)) {
          instructions.push(
            (0, import_spl_token4.createAssociatedTokenAccountIdempotentInstruction)(
              user,
              userQuoteTokenAccount,
              user,
              quoteMint,
              quoteTokenProgram
            )
          );
          if (quoteMint.equals(import_spl_token4.NATIVE_MINT)) {
            quoteWsolAtaCreated = true;
          }
        }
        instructions.push(
          await this.offlineProgram.methods.withdraw(lpTokenAmountIn, minBaseAmountOut, minQuoteAmountOut).accounts(liquidityAccounts).instruction()
        );
        if (baseWsolAtaCreated) {
          instructions.push(
            (0, import_spl_token4.createCloseAccountInstruction)(
              userBaseTokenAccount,
              user,
              user,
              void 0,
              import_spl_token4.TOKEN_PROGRAM_ID
            )
          );
        }
        if (quoteWsolAtaCreated) {
          instructions.push(
            (0, import_spl_token4.createCloseAccountInstruction)(
              userQuoteTokenAccount,
              user,
              user,
              void 0,
              import_spl_token4.TOKEN_PROGRAM_ID
            )
          );
        }
        return instructions;
      }
    );
  }
  withdrawInputs(liquiditySolanaState, lpAmount, slippage) {
    const { pool, poolBaseTokenAccount } = liquiditySolanaState;
    return withdraw(
      lpAmount,
      slippage,
      new import_bn8.default(poolBaseTokenAccount.amount.toString()),
      this.realQuoteReserves(liquiditySolanaState),
      pool.lpSupply
    );
  }
  /**
   * The pool's quote liquidity: the vault balance less the fee buckets v2 trades left in it,
   * which deposits and withdrawals never touch (pump-amm `real_quote_reserves`).
   */
  realQuoteReserves({
    pool,
    poolQuoteTokenAccount
  }) {
    return new import_bn8.default(poolQuoteTokenAccount.amount.toString()).sub(pool.protocolFees).sub(pool.creatorFees);
  }
  liquidityAccounts(liquiditySolanaState) {
    const {
      poolKey,
      pool,
      user,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      userPoolTokenAccount
    } = liquiditySolanaState;
    const {
      baseMint,
      quoteMint,
      lpMint,
      poolBaseTokenAccount,
      poolQuoteTokenAccount
    } = pool;
    return {
      pool: poolKey,
      globalConfig: GLOBAL_CONFIG_PDA,
      user,
      baseMint,
      quoteMint,
      lpMint,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      userPoolTokenAccount,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
      tokenProgram: import_spl_token4.TOKEN_PROGRAM_ID,
      token2022Program: import_spl_token4.TOKEN_2022_PROGRAM_ID,
      eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
      program: PUMP_AMM_PROGRAM_ID
    };
  }
  async buyInstructions(swapSolanaState, baseOut, maxQuoteIn) {
    return await this.withFixPoolInstructions(swapSolanaState, async () => {
      return await this.buyInstructionsNoPool(
        swapSolanaState,
        baseOut,
        maxQuoteIn
      );
    });
  }
  async buyInstructionsNoPool(swapSolanaState, baseOut, maxQuoteIn) {
    const { pool } = swapSolanaState;
    const swapAccounts = this.swapAccounts(swapSolanaState);
    const {
      user,
      quoteMint,
      quoteTokenProgram,
      buybackFeeRecipient,
      buybackFeeRecipientTokenAccount
    } = swapAccounts;
    const poolV2PdaKey = poolV2Pda(pool.baseMint);
    const remainingAccounts = [];
    if (pool.isCashbackCoin) {
      remainingAccounts.push({
        pubkey: (0, import_spl_token4.getAssociatedTokenAddressSync)(
          quoteMint,
          userVolumeAccumulatorPda(user),
          true,
          quoteTokenProgram
        ),
        isWritable: true,
        isSigner: false
      });
    }
    if (!pool.coinCreator.equals(import_web36.PublicKey.default)) {
      remainingAccounts.push({
        pubkey: poolV2PdaKey,
        isWritable: false,
        isSigner: false
      });
    }
    remainingAccounts.push(
      {
        pubkey: buybackFeeRecipient,
        isWritable: false,
        isSigner: false
      },
      {
        pubkey: buybackFeeRecipientTokenAccount,
        isWritable: true,
        isSigner: false
      }
    );
    const instruction = await this.offlineProgram.methods.buy(baseOut, maxQuoteIn, { 0: true }).accounts(swapAccounts).remainingAccounts([...remainingAccounts]).instruction();
    return this.withBuyAccounts(swapSolanaState, maxQuoteIn, instruction);
  }
  /** The buy instruction `swap` with its user-side setup: quote in, base out. */
  withBuyAccounts(swapSolanaState, quoteIn, swap) {
    const { user, pool } = swapSolanaState;
    return this.withSwapUserAccounts(
      user,
      {
        mint: pool.quoteMint,
        account: swapSolanaState.userQuoteTokenAccount,
        tokenProgram: swapSolanaState.quoteTokenProgram,
        accountInfo: swapSolanaState.userQuoteAccountInfo,
        amount: quoteIn
      },
      {
        mint: pool.baseMint,
        account: swapSolanaState.userBaseTokenAccount,
        tokenProgram: swapSolanaState.baseTokenProgram,
        accountInfo: swapSolanaState.userBaseAccountInfo
      },
      swap
    );
  }
  /**
   * The user-side setup around a swap instruction: a legacy-WSOL input is wrapped (`input.amount`
   * lamports; the account is closed again afterwards), the output account is created when it is
   * the user's ATA and `accountInfo` does not show it, and a legacy-WSOL output is closed to
   * unwrap. A custom (non-ATA) account is never created: it must already exist.
   */
  async withSwapUserAccounts(user, input, output, swap) {
    const exists = ({
      mint,
      account,
      tokenProgram,
      accountInfo
    }) => !account.equals(
      (0, import_spl_token4.getAssociatedTokenAddressSync)(mint, user, true, tokenProgram)
    ) || this.accountExists(accountInfo, tokenProgram);
    return this.withWsolAccount(
      user,
      user,
      input.mint,
      input.account,
      exists(input),
      input.amount,
      async () => [
        ...this.ensureAtaInstructions(
          user,
          user,
          output.mint,
          output.account,
          exists(output),
          output.tokenProgram
        ),
        swap,
        ...output.mint.equals(import_spl_token4.NATIVE_MINT) ? [
          (0, import_spl_token4.createCloseAccountInstruction)(
            output.account,
            user,
            user,
            void 0,
            import_spl_token4.TOKEN_PROGRAM_ID
          )
        ] : []
      ]
    );
  }
  async buyBaseInput(swapSolanaState, base, slippage, options = {}) {
    const {
      baseMint,
      baseMintAccount,
      feeConfig,
      globalConfig,
      pool,
      poolBaseAmount,
      poolQuoteAmount
    } = swapSolanaState;
    const { coinCreator, creator } = pool;
    const { maxQuote } = buyBaseInput({
      base,
      slippage,
      baseReserve: poolBaseAmount,
      quoteReserve: poolQuoteAmount,
      virtualQuoteReserves: pool.virtualQuoteReserves,
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
      globalConfig,
      quoteMint: pool.quoteMint,
      isMayhemMode: pool.isMayhemMode,
      creatorFeeBps: pool.creatorFeeBps
    });
    return this.routedBuyInstructions(swapSolanaState, base, maxQuote, options);
  }
  async buyQuoteInput(swapSolanaState, quote, slippage, options = {}) {
    const {
      baseMint,
      baseMintAccount,
      feeConfig,
      globalConfig,
      pool,
      poolBaseAmount,
      poolQuoteAmount
    } = swapSolanaState;
    const { coinCreator, creator } = pool;
    const { base, maxQuote } = buyQuoteInput({
      quote,
      slippage,
      baseReserve: poolBaseAmount,
      quoteReserve: poolQuoteAmount,
      virtualQuoteReserves: pool.virtualQuoteReserves,
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
      globalConfig,
      quoteMint: pool.quoteMint,
      isMayhemMode: pool.isMayhemMode,
      creatorFeeBps: pool.creatorFeeBps
    });
    return this.routedBuyInstructions(swapSolanaState, base, maxQuote, options);
  }
  async sellInstructions(swapSolanaState, baseAmountIn, minQuoteAmountOut) {
    return await this.withFixPoolInstructions(swapSolanaState, async () => {
      return await this.sellInstructionsNoPool(
        swapSolanaState,
        baseAmountIn,
        minQuoteAmountOut
      );
    });
  }
  async withFixPoolInstructions(commonSolanaState, block) {
    const { poolAccountInfo, poolKey, user } = commonSolanaState;
    const instructions = [];
    if (poolAccountInfo === null || poolAccountInfo.data.length < POOL_ACCOUNT_NEW_SIZE) {
      instructions.push(
        await this.offlineProgram.methods.extendAccount().accountsPartial({
          account: poolKey,
          user
        }).instruction()
      );
    }
    return [...instructions, ...await block()];
  }
  async sellInstructionsNoPool(swapSolanaState, baseAmountIn, minQuoteAmountOut) {
    const { pool } = swapSolanaState;
    const swapAccounts = this.swapAccounts(swapSolanaState);
    const poolV2PdaKey = poolV2Pda(pool.baseMint);
    const {
      user,
      quoteMint,
      quoteTokenProgram,
      buybackFeeRecipient,
      buybackFeeRecipientTokenAccount
    } = swapAccounts;
    const remainingAccounts = [];
    if (pool.isCashbackCoin) {
      remainingAccounts.push(
        {
          pubkey: (0, import_spl_token4.getAssociatedTokenAddressSync)(
            quoteMint,
            userVolumeAccumulatorPda(user),
            true,
            quoteTokenProgram
          ),
          isWritable: true,
          isSigner: false
        },
        {
          pubkey: userVolumeAccumulatorPda(user),
          isWritable: true,
          isSigner: false
        }
      );
    }
    if (!pool.coinCreator.equals(import_web36.PublicKey.default)) {
      remainingAccounts.push({
        pubkey: poolV2PdaKey,
        isWritable: false,
        isSigner: false
      });
    }
    remainingAccounts.push(
      {
        pubkey: buybackFeeRecipient,
        isWritable: false,
        isSigner: false
      },
      {
        pubkey: buybackFeeRecipientTokenAccount,
        isWritable: true,
        isSigner: false
      }
    );
    const instruction = await this.offlineProgram.methods.sell(baseAmountIn, minQuoteAmountOut).accounts(swapAccounts).remainingAccounts([...remainingAccounts]).instruction();
    return this.withSellAccounts(swapSolanaState, baseAmountIn, instruction);
  }
  /** The sell instruction `swap` with its user-side setup: base in, quote out. */
  withSellAccounts(swapSolanaState, baseIn, swap) {
    const { user, pool } = swapSolanaState;
    return this.withSwapUserAccounts(
      user,
      {
        mint: pool.baseMint,
        account: swapSolanaState.userBaseTokenAccount,
        tokenProgram: swapSolanaState.baseTokenProgram,
        accountInfo: swapSolanaState.userBaseAccountInfo,
        amount: baseIn
      },
      {
        mint: pool.quoteMint,
        account: swapSolanaState.userQuoteTokenAccount,
        tokenProgram: swapSolanaState.quoteTokenProgram,
        accountInfo: swapSolanaState.userQuoteAccountInfo
      },
      swap
    );
  }
  async sellBaseInput(swapSolanaState, base, slippage, options = {}) {
    const {
      baseMint,
      baseMintAccount,
      feeConfig,
      globalConfig,
      pool,
      poolBaseAmount,
      poolQuoteAmount
    } = swapSolanaState;
    const { coinCreator, creator } = pool;
    const { minQuote } = sellBaseInput({
      base,
      slippage,
      baseReserve: poolBaseAmount,
      quoteReserve: poolQuoteAmount,
      virtualQuoteReserves: pool.virtualQuoteReserves,
      feeBucketsTotal: pool.protocolFees.add(pool.creatorFees),
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
      globalConfig,
      quoteMint: pool.quoteMint,
      isMayhemMode: pool.isMayhemMode,
      creatorFeeBps: pool.creatorFeeBps
    });
    return this.routedSellInstructions(
      swapSolanaState,
      base,
      minQuote,
      options
    );
  }
  async sellQuoteInput(swapSolanaState, quote, slippage, options = {}) {
    const {
      baseMint,
      baseMintAccount,
      feeConfig,
      globalConfig,
      pool,
      poolBaseAmount,
      poolQuoteAmount
    } = swapSolanaState;
    const { coinCreator, creator } = pool;
    const { base, minQuote } = sellQuoteInput({
      quote,
      slippage,
      baseReserve: poolBaseAmount,
      quoteReserve: poolQuoteAmount,
      virtualQuoteReserves: pool.virtualQuoteReserves,
      feeBucketsTotal: pool.protocolFees.add(pool.creatorFees),
      baseMintAccount,
      baseMint,
      coinCreator,
      creator,
      feeConfig,
      globalConfig,
      quoteMint: pool.quoteMint,
      isMayhemMode: pool.isMayhemMode,
      creatorFeeBps: pool.creatorFeeBps
    });
    return this.routedSellInstructions(
      swapSolanaState,
      base,
      minQuote,
      options
    );
  }
  routedBuyInstructions(swapSolanaState, baseOut, maxQuoteIn, { v2 = false }) {
    return v2 && supportsTradeV2(swapSolanaState.pool) ? this.buyV2Instructions(swapSolanaState, baseOut, maxQuoteIn) : this.buyInstructions(swapSolanaState, baseOut, maxQuoteIn);
  }
  routedSellInstructions(swapSolanaState, baseIn, minQuoteOut, { v2 = false }) {
    return v2 && supportsTradeV2(swapSolanaState.pool) ? this.sellV2Instructions(swapSolanaState, baseIn, minQuoteOut) : this.sellInstructions(swapSolanaState, baseIn, minQuoteOut);
  }
  async extendAccount(account, user) {
    return this.offlineProgram.methods.extendAccount().accountsPartial({
      account,
      user
    }).instruction();
  }
  async boostBuyAndBurnInstruction(poolKey, pool, authority, quoteAmountIn, minBaseAmountBurned, baseTokenProgram, quoteTokenProgram) {
    const boostVaultAuthority = boostVaultAuthorityPda(poolKey);
    return this.offlineProgram.methods.boostBuyAndBurn(quoteAmountIn, minBaseAmountBurned).accountsPartial({
      pool: poolKey,
      authority,
      globalConfig: GLOBAL_CONFIG_PDA,
      baseMint: pool.baseMint,
      quoteMint: pool.quoteMint,
      poolBaseTokenAccount: pool.poolBaseTokenAccount,
      poolQuoteTokenAccount: pool.poolQuoteTokenAccount,
      boostVaultAuthority,
      boostVault: boostVaultAta(
        boostVaultAuthority,
        pool.quoteMint,
        quoteTokenProgram
      ),
      baseTokenProgram,
      quoteTokenProgram
    }).instruction();
  }
  /**
   * Moves the creator's accumulated AMM fees, quoted in the state's `quoteMint`, from the creator
   * vault ATA to `coinCreatorTokenAccount`. The program transfers between two existing token
   * accounts and creates neither, so the vault ATA and, when it is the destination, the creator's
   * ATA are created here (rent paid by `payer`) when missing, under the quote mint's token
   * program. The program accepts any token account the creator owns as the destination, but
   * only an ATA can be created idempotently, so a custom `coinCreatorTokenAccount` must already
   * exist (an error is thrown otherwise). A wSOL payout is unwrapped by closing the creator's
   * ATA, but only when the creator pays for the transaction themselves.
   */
  async collectCoinCreatorFee(collectCoinCreatorFeeSolanaState, payer = void 0) {
    const {
      coinCreator,
      quoteMint,
      quoteTokenProgram,
      coinCreatorVaultAuthority,
      coinCreatorVaultAta,
      coinCreatorTokenAccount,
      coinCreatorVaultAtaAccountInfo,
      coinCreatorTokenAccountInfo
    } = collectCoinCreatorFeeSolanaState;
    const actualPayer = payer ?? coinCreator;
    const shouldCloseCoinCreatorATA = quoteMint.equals(import_spl_token4.NATIVE_MINT) && coinCreator.equals(actualPayer);
    const coinCreatorTokenAccountExists = this.accountExists(
      coinCreatorTokenAccountInfo,
      quoteTokenProgram
    );
    const coinCreatorTokenAccountIsAta = coinCreatorTokenAccount.equals(
      (0, import_spl_token4.getAssociatedTokenAddressSync)(
        quoteMint,
        coinCreator,
        true,
        quoteTokenProgram
      )
    );
    if (!coinCreatorTokenAccountExists && !coinCreatorTokenAccountIsAta) {
      throw new Error(
        `coinCreatorTokenAccount=${coinCreatorTokenAccount.toString()} does not exist; only the creator's ATA is created automatically`
      );
    }
    const instructions = [
      ...this.ensureAtaInstructions(
        actualPayer,
        coinCreatorVaultAuthority,
        quoteMint,
        coinCreatorVaultAta,
        this.accountExists(coinCreatorVaultAtaAccountInfo, quoteTokenProgram),
        quoteTokenProgram
      ),
      ...this.ensureAtaInstructions(
        actualPayer,
        coinCreator,
        quoteMint,
        coinCreatorTokenAccount,
        coinCreatorTokenAccountExists,
        quoteTokenProgram
      ),
      await this.offlineProgram.methods.collectCoinCreatorFee().accountsPartial({
        coinCreator,
        coinCreatorTokenAccount,
        quoteMint,
        quoteTokenProgram
      }).instruction()
    ];
    if (shouldCloseCoinCreatorATA) {
      instructions.push(
        (0, import_spl_token4.createCloseAccountInstruction)(
          coinCreatorTokenAccount,
          coinCreator,
          coinCreator,
          void 0,
          import_spl_token4.TOKEN_PROGRAM_ID
        )
      );
    }
    return instructions;
  }
  /**
   * Moves a coin creator's accumulated AMM fees, quoted in `quoteMint`, into their pump creator
   * vault (the `creator-vault` PDA of the pump program), for coins whose creator fees are paid
   * out through that vault. The program unwraps a wSOL vault into the PDA itself and moves any
   * other quote into the PDA's quote ATA, which it creates (rent paid by `payer`) when missing;
   * `pump_creator_vault_ata` is part of the account list even for wSOL. `quoteTokenProgram`
   * must be the quote mint's owner program, SPL Token or Token-2022; every quote-side ATA is
   * derived under it.
   */
  async transferCreatorFeesToPumpV2Instruction({
    payer,
    coinCreator,
    quoteMint,
    quoteTokenProgram
  }) {
    return this.offlineProgram.methods.transferCreatorFeesToPumpV2().accountsPartial({
      payer,
      quoteMint,
      tokenProgram: quoteTokenProgram,
      coinCreator
    }).instruction();
  }
  /**
   * Builds `set_coin_creator`, the permissionless instruction that fills in a canonical pool's
   * coin creator from the base mint's Metaplex metadata (its first creator) or, when the metadata
   * lists none, from the bonding curve's creator; a no-op once the pool has one. With `baseMint`
   * the `metadata` and `bonding_curve` accounts are derived here (`metadataPda`,
   * `bondingCurvePda`). Without it they are left to Anchor's account resolver, which reads the
   * pool through the provider's connection (the offline program has none) and, with this IDL,
   * cannot decode a pre-upgrade 261-byte pool, so pass `baseMint` or use
   * `OnlinePumpAmmSdk.setCoinCreatorInstructions`. The program writes the whole `Pool` back, so a
   * pre-upgrade pool must be grown by `extend_account` first.
   */
  async setCoinCreator(pool, baseMint) {
    return this.offlineProgram.methods.setCoinCreator().accountsPartial(
      baseMint === void 0 ? { pool } : {
        pool,
        metadata: metadataPda(baseMint),
        bondingCurve: bondingCurvePda(baseMint)
      }
    ).instruction();
  }
  /**
   * `buy_v2`: buys exactly `baseOut` for at most `maxQuoteIn` (fees included) on a pool
   * `supportsTradeV2` accepts, with the same user-side accounts as `buyInstructions`. The protocol
   * and coin-creator fees stay in the pool's quote vault (`Pool.protocolFees` /
   * `Pool.creatorFees`, paid out by the sweeps); only the buyback slice of the protocol fee is paid
   * in the trade (none on a mayhem pool), to a listed buyback fee recipient's quote ATA, which
   * must already exist (v2 never creates it, and checks it even when the slice is 0). No
   * `extend_account` is prepended: the program grows a pre-upgrade pool itself.
   */
  async buyV2Instructions(swapSolanaState, baseOut, maxQuoteIn) {
    return this.withBuyAccounts(
      swapSolanaState,
      maxQuoteIn,
      await this.offlineProgram.methods.buyV2(baseOut, maxQuoteIn).accountsStrict(this.tradeV2Accounts(swapSolanaState)).instruction()
    );
  }
  /**
   * `buy_exact_quote_in_v2`: spends at most `spendableQuoteIn` (fees included) for at least
   * `minBaseOut`, which must be nonzero. Accounts and fee handling as `buyV2Instructions`.
   */
  async buyExactQuoteInV2Instructions(swapSolanaState, spendableQuoteIn, minBaseOut) {
    return this.withBuyAccounts(
      swapSolanaState,
      spendableQuoteIn,
      await this.offlineProgram.methods.buyExactQuoteInV2(spendableQuoteIn, minBaseOut).accountsStrict(this.tradeV2Accounts(swapSolanaState)).instruction()
    );
  }
  /**
   * `sell_v2`: sells exactly `baseIn` for at least `minQuoteOut` (fees deducted), with the same
   * user-side accounts as `sellInstructions`. Fee handling as `buyV2Instructions`; the buyback
   * slice leaves the pool vault.
   */
  async sellV2Instructions(swapSolanaState, baseIn, minQuoteOut) {
    return this.withSellAccounts(
      swapSolanaState,
      baseIn,
      await this.offlineProgram.methods.sellV2(baseIn, minQuoteOut).accountsStrict(this.tradeV2Accounts(swapSolanaState)).instruction()
    );
  }
  /**
   * `multi_hop_swap`: spends exactly `amountIn` of `inMint` along `venues` (canonical, non-mayhem
   * pump pools and pump bonding curves, every hop buying or every hop selling) and pays at
   * least `minAmountOut` of the final mint into the user's account (`multiHopSwapQuote` prices
   * it). The route is checked as the program checks it before anything is built
   * (`resolveMultiHopRoute`).
   *
   * `buybackFeeRecipient` is the buyback recipient *wallet* the route's protocol leg (first hop of
   * a buy route, last of a sell route) pays the buyback slice to, through its ATA for that hop's
   * quote mint, which must exist. It must be listed by the venue holding the leg: a pool leg
   * defaults to a `globalConfig.buybackFeeRecipients` entry (picked at random, as the v1 and v2
   * trades do, so every listed recipient needs that ATA); a curve leg checks pump's
   * `Global.buybackFeeRecipients`, which this SDK does not read, so it must be passed.
   *
   * The user's token accounts default to their ATAs; a custom account must exist. A legacy-WSOL
   * input is wrapped (and the account closed afterwards), except on a buy starting on a SOL
   * bonding curve: pump takes `amountIn` from the wallet as lamports, so the user's WSOL ATA is
   * only created when missing (it must exist) and the wallet needs `amountIn` plus rent in SOL.
   * A sell ending on a SOL curve pays into the user's WSOL ATA, which is likewise created and then
   * closed to unwrap. On a SOL protocol leg the buyback slice goes to the recipient's WSOL ATA. the output ATA is created when
   * `userOutAccountInfo` does not show it, and a legacy-WSOL output is closed to unwrap. No
   * compute-budget instruction is added: set a limit of about 50k CU per hop (the 200k default
   * does not cover four hops).
   */
  async multiHopSwapInstructions({
    user,
    inMint,
    venues,
    amountIn,
    minAmountOut,
    globalConfig,
    buybackFeeRecipient,
    userInTokenAccount,
    userOutTokenAccount,
    userInAccountInfo = null,
    userOutAccountInfo = null
  }) {
    if (amountIn.lten(0) || minAmountOut.lten(0)) {
      throw new Error("amountIn and minAmountOut must be positive.");
    }
    const { isBuy, mints } = resolveMultiHopRoute(inMint, venues);
    inMint = mints[0];
    const outMint = mints[mints.length - 1];
    const first = venues[0];
    const last = venues[venues.length - 1];
    const inTokenProgram = isBuy ? venueQuoteTokenProgram(first) : first.baseTokenProgram;
    const outTokenProgram = isBuy ? last.baseTokenProgram : venueQuoteTokenProgram(last);
    const protocolLeg = isBuy ? first : last;
    if (buybackFeeRecipient === void 0) {
      if (protocolLeg.kind === "curve") {
        throw new Error(
          "The route's protocol leg is a bonding curve: pass buybackFeeRecipient (a wallet listed in pump's Global.buybackFeeRecipients)."
        );
      }
      buybackFeeRecipient = getBuybackFeeRecipient(globalConfig);
    }
    const hopAccounts = venues.flatMap((venue) => {
      const { baseMint, quoteMint } = venueMints(venue);
      const venueKey = venue.kind === "pool" ? venue.poolKey : bondingCurvePda(baseMint);
      const [baseVault, quoteVault] = venue.kind === "pool" ? [venue.pool.poolBaseTokenAccount, venue.pool.poolQuoteTokenAccount] : [
        (0, import_spl_token4.getAssociatedTokenAddressSync)(
          baseMint,
          venueKey,
          true,
          venue.baseTokenProgram
        ),
        (0, import_spl_token4.getAssociatedTokenAddressSync)(
          quoteMint,
          venueKey,
          true,
          venueQuoteTokenProgram(venue)
        )
      ];
      return [
        { pubkey: baseMint, isSigner: false, isWritable: false },
        { pubkey: quoteMint, isSigner: false, isWritable: false },
        { pubkey: venueKey, isSigner: false, isWritable: true },
        { pubkey: baseVault, isSigner: false, isWritable: true },
        { pubkey: quoteVault, isSigner: false, isWritable: true }
      ];
    });
    const userIn = userInTokenAccount ?? (0, import_spl_token4.getAssociatedTokenAddressSync)(inMint, user, true, inTokenProgram);
    const userOut = userOutTokenAccount ?? (0, import_spl_token4.getAssociatedTokenAddressSync)(outMint, user, true, outTokenProgram);
    const swap = await this.offlineProgram.methods.multiHopSwap(amountIn, minAmountOut).accountsStrict({
      user,
      userInTokenAccount: userIn,
      userOutTokenAccount: userOut,
      globalConfig: GLOBAL_CONFIG_PDA,
      feeConfig: PUMP_AMM_FEE_CONFIG_PDA,
      userVolumeAccumulator: userVolumeAccumulatorPda(user),
      buybackFeeRecipient: (0, import_spl_token4.getAssociatedTokenAddressSync)(
        venueMints(protocolLeg).quoteMint,
        buybackFeeRecipient,
        true,
        venueQuoteTokenProgram(protocolLeg)
      ),
      tokenProgram: import_spl_token4.TOKEN_PROGRAM_ID,
      token2022Program: import_spl_token4.TOKEN_2022_PROGRAM_ID,
      systemProgram: import_web36.SystemProgram.programId,
      eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
      program: PUMP_AMM_PROGRAM_ID,
      pumpProgram: PUMP_PROGRAM_ID,
      pumpGlobal: PUMP_GLOBAL_PDA,
      pumpFeeConfig: PUMP_FEE_CONFIG_PDA,
      pumpEventAuthority: PUMP_EVENT_AUTHORITY_PDA
    }).remainingAccounts(hopAccounts).instruction();
    return this.withSwapUserAccounts(
      user,
      {
        mint: inMint,
        account: userIn,
        tokenProgram: inTokenProgram,
        accountInfo: userInAccountInfo,
        // A buy starting on a SOL curve pays from the wallet's lamports: the user's WSOL account
        // only has to exist, so it is created when missing but never funded.
        amount: isBuy && isSolCurve(first) ? new import_bn8.default(0) : amountIn
      },
      {
        mint: outMint,
        account: userOut,
        tokenProgram: outTokenProgram,
        accountInfo: userOutAccountInfo
      },
      swap
    );
  }
  /**
   * `sweep_protocol_fee`: pays a pool's `protocolFees` out of its quote vault to a protocol fee
   * recipient's quote ATA (a reserved one on a mayhem pool; created when missing).
   * Permissionless: `payer` signs and pays that ATA's rent and a pre-upgrade pool's realloc. A
   * no-op when the bucket is empty. `quoteTokenProgram` is the owner of `pool.quoteMint`.
   */
  async sweepProtocolFeeInstruction({
    payer,
    poolKey,
    pool,
    quoteTokenProgram,
    globalConfig
  }) {
    return this.offlineProgram.methods.sweepProtocolFee().accountsStrict(
      this.sweepFeeAccounts(
        payer,
        poolKey,
        pool,
        quoteTokenProgram,
        getFeeRecipient(globalConfig, pool.isMayhemMode)
      )
    ).instruction();
  }
  /**
   * `sweep_creator_fee`: pays a pool's `creatorFees` into the coin-creator vault of
   * `pool.coinCreator` (the vault `collectCoinCreatorFee` pays out from), otherwise as
   * `sweepProtocolFeeInstruction`. The programs refuse to change a coin creator or its fee shares
   * while the bucket is nonzero (pump-amm `CreatorFeesNotSwept`, pump-fees
   * `PoolCreatorFeesNotSwept`), so a CTO, a fee-sharing config creation or an `update_fee_shares`
   * on a coin with v2 volume must carry this instruction before it, in the same transaction.
   */
  async sweepCreatorFeeInstruction({
    payer,
    poolKey,
    pool,
    quoteTokenProgram
  }) {
    return this.offlineProgram.methods.sweepCreatorFee().accountsStrict(
      this.sweepFeeAccounts(
        payer,
        poolKey,
        pool,
        quoteTokenProgram,
        coinCreatorVaultAuthorityPda(pool.coinCreator)
      )
    ).instruction();
  }
  sweepFeeAccounts(payer, poolKey, pool, quoteTokenProgram, recipient) {
    return {
      payer,
      globalConfig: GLOBAL_CONFIG_PDA,
      pool: poolKey,
      quoteMint: pool.quoteMint,
      quoteTokenProgram,
      poolQuoteTokenAccount: pool.poolQuoteTokenAccount,
      recipient,
      recipientTokenAccount: (0, import_spl_token4.getAssociatedTokenAddressSync)(
        pool.quoteMint,
        recipient,
        true,
        quoteTokenProgram
      ),
      systemProgram: import_web36.SystemProgram.programId,
      associatedTokenProgram: import_spl_token4.ASSOCIATED_TOKEN_PROGRAM_ID,
      eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
      program: PUMP_AMM_PROGRAM_ID
    };
  }
  /** The 17 accounts of `buy_v2` / `buy_exact_quote_in_v2` / `sell_v2`, in IDL order. */
  tradeV2Accounts({
    globalConfig,
    poolKey,
    pool,
    baseTokenProgram,
    quoteTokenProgram,
    user,
    userBaseTokenAccount,
    userQuoteTokenAccount
  }) {
    return {
      pool: poolKey,
      user,
      globalConfig: GLOBAL_CONFIG_PDA,
      baseMint: pool.baseMint,
      quoteMint: pool.quoteMint,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      poolBaseTokenAccount: pool.poolBaseTokenAccount,
      poolQuoteTokenAccount: pool.poolQuoteTokenAccount,
      baseTokenProgram,
      quoteTokenProgram,
      systemProgram: import_web36.SystemProgram.programId,
      userVolumeAccumulator: userVolumeAccumulatorPda(user),
      feeConfig: PUMP_AMM_FEE_CONFIG_PDA,
      // Only the ATA: the program checks it is a listed recipient's canonical quote ATA.
      buybackFeeRecipient: (0, import_spl_token4.getAssociatedTokenAddressSync)(
        pool.quoteMint,
        getBuybackFeeRecipient(globalConfig),
        true,
        quoteTokenProgram
      ),
      eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
      program: PUMP_AMM_PROGRAM_ID
    };
  }
  swapAccounts(swapSolanaState) {
    const {
      globalConfig,
      poolKey,
      pool,
      baseTokenProgram,
      quoteTokenProgram,
      user,
      userBaseTokenAccount,
      userQuoteTokenAccount
    } = swapSolanaState;
    const protocolFeeRecipient = getFeeRecipient(
      globalConfig,
      pool.isMayhemMode
    );
    const buybackFeeRecipient = getBuybackFeeRecipient(globalConfig);
    const {
      baseMint,
      quoteMint,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
      coinCreator
    } = pool;
    const coinCreatorVaultAuthority = coinCreatorVaultAuthorityPda(coinCreator);
    return {
      pool: poolKey,
      globalConfig: GLOBAL_CONFIG_PDA,
      user,
      baseMint,
      quoteMint,
      userBaseTokenAccount,
      userQuoteTokenAccount,
      poolBaseTokenAccount,
      poolQuoteTokenAccount,
      protocolFeeRecipient,
      protocolFeeRecipientTokenAccount: (0, import_spl_token4.getAssociatedTokenAddressSync)(
        quoteMint,
        protocolFeeRecipient,
        true,
        quoteTokenProgram
      ),
      buybackFeeRecipient,
      buybackFeeRecipientTokenAccount: (0, import_spl_token4.getAssociatedTokenAddressSync)(
        quoteMint,
        buybackFeeRecipient,
        true,
        quoteTokenProgram
      ),
      baseTokenProgram,
      quoteTokenProgram,
      systemProgram: import_web36.SystemProgram.programId,
      associatedTokenProgram: import_spl_token4.ASSOCIATED_TOKEN_PROGRAM_ID,
      eventAuthority: PUMP_AMM_EVENT_AUTHORITY_PDA,
      program: PUMP_AMM_PROGRAM_ID,
      coinCreatorVaultAta: coinCreatorVaultAtaPda(
        coinCreatorVaultAuthority,
        quoteMint,
        quoteTokenProgram
      ),
      coinCreatorVaultAuthority
    };
  }
  async syncUserVolumeAccumulator(user) {
    return await this.offlineProgram.methods.syncUserVolumeAccumulator().accountsPartial({ user }).instruction();
  }
  async initUserVolumeAccumulator({
    payer,
    user
  }) {
    return await this.offlineProgram.methods.initUserVolumeAccumulator().accountsPartial({ payer, user }).instruction();
  }
  async closeUserVolumeAccumulator(user) {
    return await this.offlineProgram.methods.closeUserVolumeAccumulator().accountsPartial({ user }).instruction();
  }
  // from pumpAmm
  async createAutocompleteInitialPoolPrice(initialBase, initialQuote) {
    return initialQuote.div(initialBase);
  }
  async depositInstructions(liquiditySolanaState, lpToken, slippage) {
    const { pool, poolBaseTokenAccount } = liquiditySolanaState;
    const { maxBase, maxQuote } = depositLpToken(
      lpToken,
      slippage,
      new import_bn8.default(poolBaseTokenAccount.amount.toString()),
      this.realQuoteReserves(liquiditySolanaState),
      pool.lpSupply
    );
    return this.depositInstructionsInternal(
      liquiditySolanaState,
      lpToken,
      maxBase,
      maxQuote
    );
  }
  depositAutocompleteQuoteAndLpTokenFromBase(liquiditySolanaState, base, slippage) {
    const { quote, lpToken } = this.depositBaseInput(
      liquiditySolanaState,
      base,
      slippage
    );
    return {
      quote,
      lpToken
    };
  }
  depositAutocompleteBaseAndLpTokenFromQuote(liquiditySolanaState, quote, slippage) {
    const { base, lpToken } = this.depositQuoteInput(
      liquiditySolanaState,
      quote,
      slippage
    );
    return {
      base,
      lpToken
    };
  }
  async withdrawInstructions(liquiditySolanaState, lpToken, slippage) {
    const { minBase, minQuote } = this.withdrawInputs(
      liquiditySolanaState,
      lpToken,
      slippage
    );
    return this.withdrawInstructionsInternal(
      liquiditySolanaState,
      lpToken,
      minBase,
      minQuote
    );
  }
  withdrawAutoCompleteBaseAndQuoteFromLpToken(liquiditySolanaState, lpAmount, slippage) {
    const { base, quote } = this.withdrawInputs(
      liquiditySolanaState,
      lpAmount,
      slippage
    );
    return {
      base,
      quote
    };
  }
};
var PUMP_AMM_SDK = new PumpAmmSdk();
/*! Bundled license information:

ieee754/index.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)

buffer/index.js:
  (*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)
*/
