"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/node-forge/lib/forge.js
var require_forge = __commonJS({
  "node_modules/node-forge/lib/forge.js"(exports2, module2) {
    module2.exports = {
      // default options
      options: {
        usePureJavaScript: false
      }
    };
  }
});

// node_modules/node-forge/lib/baseN.js
var require_baseN = __commonJS({
  "node_modules/node-forge/lib/baseN.js"(exports2, module2) {
    var api = {};
    module2.exports = api;
    var _reverseAlphabets = {};
    api.encode = function(input, alphabet, maxline) {
      if (typeof alphabet !== "string") {
        throw new TypeError('"alphabet" must be a string.');
      }
      if (maxline !== void 0 && typeof maxline !== "number") {
        throw new TypeError('"maxline" must be a number.');
      }
      var output = "";
      if (!(input instanceof Uint8Array)) {
        output = _encodeWithByteBuffer(input, alphabet);
      } else {
        var i2 = 0;
        var base = alphabet.length;
        var first = alphabet.charAt(0);
        var digits = [0];
        for (i2 = 0; i2 < input.length; ++i2) {
          for (var j2 = 0, carry = input[i2]; j2 < digits.length; ++j2) {
            carry += digits[j2] << 8;
            digits[j2] = carry % base;
            carry = carry / base | 0;
          }
          while (carry > 0) {
            digits.push(carry % base);
            carry = carry / base | 0;
          }
        }
        for (i2 = 0; input[i2] === 0 && i2 < input.length - 1; ++i2) {
          output += first;
        }
        for (i2 = digits.length - 1; i2 >= 0; --i2) {
          output += alphabet[digits[i2]];
        }
      }
      if (maxline) {
        var regex = new RegExp(".{1," + maxline + "}", "g");
        output = output.match(regex).join("\r\n");
      }
      return output;
    };
    api.decode = function(input, alphabet) {
      if (typeof input !== "string") {
        throw new TypeError('"input" must be a string.');
      }
      if (typeof alphabet !== "string") {
        throw new TypeError('"alphabet" must be a string.');
      }
      var table = _reverseAlphabets[alphabet];
      if (!table) {
        table = _reverseAlphabets[alphabet] = [];
        for (var i2 = 0; i2 < alphabet.length; ++i2) {
          table[alphabet.charCodeAt(i2)] = i2;
        }
      }
      input = input.replace(/\s/g, "");
      var base = alphabet.length;
      var first = alphabet.charAt(0);
      var bytes = [0];
      for (var i2 = 0; i2 < input.length; i2++) {
        var value = table[input.charCodeAt(i2)];
        if (value === void 0) {
          return;
        }
        for (var j2 = 0, carry = value; j2 < bytes.length; ++j2) {
          carry += bytes[j2] * base;
          bytes[j2] = carry & 255;
          carry >>= 8;
        }
        while (carry > 0) {
          bytes.push(carry & 255);
          carry >>= 8;
        }
      }
      for (var k2 = 0; input[k2] === first && k2 < input.length - 1; ++k2) {
        bytes.push(0);
      }
      if (typeof Buffer !== "undefined") {
        return Buffer.from(bytes.reverse());
      }
      return new Uint8Array(bytes.reverse());
    };
    function _encodeWithByteBuffer(input, alphabet) {
      var i2 = 0;
      var base = alphabet.length;
      var first = alphabet.charAt(0);
      var digits = [0];
      for (i2 = 0; i2 < input.length(); ++i2) {
        for (var j2 = 0, carry = input.at(i2); j2 < digits.length; ++j2) {
          carry += digits[j2] << 8;
          digits[j2] = carry % base;
          carry = carry / base | 0;
        }
        while (carry > 0) {
          digits.push(carry % base);
          carry = carry / base | 0;
        }
      }
      var output = "";
      for (i2 = 0; input.at(i2) === 0 && i2 < input.length() - 1; ++i2) {
        output += first;
      }
      for (i2 = digits.length - 1; i2 >= 0; --i2) {
        output += alphabet[digits[i2]];
      }
      return output;
    }
  }
});

// node_modules/node-forge/lib/util.js
var require_util = __commonJS({
  "node_modules/node-forge/lib/util.js"(exports2, module2) {
    var forge = require_forge();
    var baseN = require_baseN();
    var util = module2.exports = forge.util = forge.util || {};
    (function() {
      if (typeof process !== "undefined" && process.nextTick && !process.browser) {
        util.nextTick = process.nextTick;
        if (typeof setImmediate === "function") {
          util.setImmediate = setImmediate;
        } else {
          util.setImmediate = util.nextTick;
        }
        return;
      }
      if (typeof setImmediate === "function") {
        util.setImmediate = function() {
          return setImmediate.apply(void 0, arguments);
        };
        util.nextTick = function(callback) {
          return setImmediate(callback);
        };
        return;
      }
      util.setImmediate = function(callback) {
        setTimeout(callback, 0);
      };
      if (typeof window !== "undefined" && typeof window.postMessage === "function") {
        let handler2 = function(event) {
          if (event.source === window && event.data === msg) {
            event.stopPropagation();
            var copy = callbacks.slice();
            callbacks.length = 0;
            copy.forEach(function(callback) {
              callback();
            });
          }
        };
        var handler = handler2;
        var msg = "forge.setImmediate";
        var callbacks = [];
        util.setImmediate = function(callback) {
          callbacks.push(callback);
          if (callbacks.length === 1) {
            window.postMessage(msg, "*");
          }
        };
        window.addEventListener("message", handler2, true);
      }
      if (typeof MutationObserver !== "undefined") {
        var now = Date.now();
        var attr = true;
        var div = document.createElement("div");
        var callbacks = [];
        new MutationObserver(function() {
          var copy = callbacks.slice();
          callbacks.length = 0;
          copy.forEach(function(callback) {
            callback();
          });
        }).observe(div, { attributes: true });
        var oldSetImmediate = util.setImmediate;
        util.setImmediate = function(callback) {
          if (Date.now() - now > 15) {
            now = Date.now();
            oldSetImmediate(callback);
          } else {
            callbacks.push(callback);
            if (callbacks.length === 1) {
              div.setAttribute("a", attr = !attr);
            }
          }
        };
      }
      util.nextTick = util.setImmediate;
    })();
    util.isNodejs = typeof process !== "undefined" && process.versions && process.versions.node;
    util.globalScope = (function() {
      if (util.isNodejs) {
        return global;
      }
      return typeof self === "undefined" ? window : self;
    })();
    util.isArray = Array.isArray || function(x2) {
      return Object.prototype.toString.call(x2) === "[object Array]";
    };
    util.isArrayBuffer = function(x2) {
      return typeof ArrayBuffer !== "undefined" && x2 instanceof ArrayBuffer;
    };
    util.isArrayBufferView = function(x2) {
      return x2 && util.isArrayBuffer(x2.buffer) && x2.byteLength !== void 0;
    };
    function _checkBitsParam(n2) {
      if (!(n2 === 8 || n2 === 16 || n2 === 24 || n2 === 32)) {
        throw new Error("Only 8, 16, 24, or 32 bits supported: " + n2);
      }
    }
    util.ByteBuffer = ByteStringBuffer;
    function ByteStringBuffer(b2) {
      this.data = "";
      this.read = 0;
      if (typeof b2 === "string") {
        this.data = b2;
      } else if (util.isArrayBuffer(b2) || util.isArrayBufferView(b2)) {
        if (typeof Buffer !== "undefined" && b2 instanceof Buffer) {
          this.data = b2.toString("binary");
        } else {
          var arr = new Uint8Array(b2);
          try {
            this.data = String.fromCharCode.apply(null, arr);
          } catch (e2) {
            for (var i2 = 0; i2 < arr.length; ++i2) {
              this.putByte(arr[i2]);
            }
          }
        }
      } else if (b2 instanceof ByteStringBuffer || typeof b2 === "object" && typeof b2.data === "string" && typeof b2.read === "number") {
        this.data = b2.data;
        this.read = b2.read;
      }
      this._constructedStringLength = 0;
    }
    util.ByteStringBuffer = ByteStringBuffer;
    var _MAX_CONSTRUCTED_STRING_LENGTH = 4096;
    util.ByteStringBuffer.prototype._optimizeConstructedString = function(x2) {
      this._constructedStringLength += x2;
      if (this._constructedStringLength > _MAX_CONSTRUCTED_STRING_LENGTH) {
        this.data.substr(0, 1);
        this._constructedStringLength = 0;
      }
    };
    util.ByteStringBuffer.prototype.length = function() {
      return this.data.length - this.read;
    };
    util.ByteStringBuffer.prototype.isEmpty = function() {
      return this.length() <= 0;
    };
    util.ByteStringBuffer.prototype.putByte = function(b2) {
      return this.putBytes(String.fromCharCode(b2));
    };
    util.ByteStringBuffer.prototype.fillWithByte = function(b2, n2) {
      b2 = String.fromCharCode(b2);
      var d2 = this.data;
      while (n2 > 0) {
        if (n2 & 1) {
          d2 += b2;
        }
        n2 >>>= 1;
        if (n2 > 0) {
          b2 += b2;
        }
      }
      this.data = d2;
      this._optimizeConstructedString(n2);
      return this;
    };
    util.ByteStringBuffer.prototype.putBytes = function(bytes) {
      this.data += bytes;
      this._optimizeConstructedString(bytes.length);
      return this;
    };
    util.ByteStringBuffer.prototype.putString = function(str) {
      return this.putBytes(util.encodeUtf8(str));
    };
    util.ByteStringBuffer.prototype.putInt16 = function(i2) {
      return this.putBytes(
        String.fromCharCode(i2 >> 8 & 255) + String.fromCharCode(i2 & 255)
      );
    };
    util.ByteStringBuffer.prototype.putInt24 = function(i2) {
      return this.putBytes(
        String.fromCharCode(i2 >> 16 & 255) + String.fromCharCode(i2 >> 8 & 255) + String.fromCharCode(i2 & 255)
      );
    };
    util.ByteStringBuffer.prototype.putInt32 = function(i2) {
      return this.putBytes(
        String.fromCharCode(i2 >> 24 & 255) + String.fromCharCode(i2 >> 16 & 255) + String.fromCharCode(i2 >> 8 & 255) + String.fromCharCode(i2 & 255)
      );
    };
    util.ByteStringBuffer.prototype.putInt16Le = function(i2) {
      return this.putBytes(
        String.fromCharCode(i2 & 255) + String.fromCharCode(i2 >> 8 & 255)
      );
    };
    util.ByteStringBuffer.prototype.putInt24Le = function(i2) {
      return this.putBytes(
        String.fromCharCode(i2 & 255) + String.fromCharCode(i2 >> 8 & 255) + String.fromCharCode(i2 >> 16 & 255)
      );
    };
    util.ByteStringBuffer.prototype.putInt32Le = function(i2) {
      return this.putBytes(
        String.fromCharCode(i2 & 255) + String.fromCharCode(i2 >> 8 & 255) + String.fromCharCode(i2 >> 16 & 255) + String.fromCharCode(i2 >> 24 & 255)
      );
    };
    util.ByteStringBuffer.prototype.putInt = function(i2, n2) {
      _checkBitsParam(n2);
      var bytes = "";
      do {
        n2 -= 8;
        bytes += String.fromCharCode(i2 >> n2 & 255);
      } while (n2 > 0);
      return this.putBytes(bytes);
    };
    util.ByteStringBuffer.prototype.putSignedInt = function(i2, n2) {
      if (i2 < 0) {
        i2 += 2 << n2 - 1;
      }
      return this.putInt(i2, n2);
    };
    util.ByteStringBuffer.prototype.putBuffer = function(buffer) {
      return this.putBytes(buffer.getBytes());
    };
    util.ByteStringBuffer.prototype.getByte = function() {
      return this.data.charCodeAt(this.read++);
    };
    util.ByteStringBuffer.prototype.getInt16 = function() {
      var rval = this.data.charCodeAt(this.read) << 8 ^ this.data.charCodeAt(this.read + 1);
      this.read += 2;
      return rval;
    };
    util.ByteStringBuffer.prototype.getInt24 = function() {
      var rval = this.data.charCodeAt(this.read) << 16 ^ this.data.charCodeAt(this.read + 1) << 8 ^ this.data.charCodeAt(this.read + 2);
      this.read += 3;
      return rval;
    };
    util.ByteStringBuffer.prototype.getInt32 = function() {
      var rval = this.data.charCodeAt(this.read) << 24 ^ this.data.charCodeAt(this.read + 1) << 16 ^ this.data.charCodeAt(this.read + 2) << 8 ^ this.data.charCodeAt(this.read + 3);
      this.read += 4;
      return rval;
    };
    util.ByteStringBuffer.prototype.getInt16Le = function() {
      var rval = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read + 1) << 8;
      this.read += 2;
      return rval;
    };
    util.ByteStringBuffer.prototype.getInt24Le = function() {
      var rval = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read + 1) << 8 ^ this.data.charCodeAt(this.read + 2) << 16;
      this.read += 3;
      return rval;
    };
    util.ByteStringBuffer.prototype.getInt32Le = function() {
      var rval = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read + 1) << 8 ^ this.data.charCodeAt(this.read + 2) << 16 ^ this.data.charCodeAt(this.read + 3) << 24;
      this.read += 4;
      return rval;
    };
    util.ByteStringBuffer.prototype.getInt = function(n2) {
      _checkBitsParam(n2);
      var rval = 0;
      do {
        rval = (rval << 8) + this.data.charCodeAt(this.read++);
        n2 -= 8;
      } while (n2 > 0);
      return rval;
    };
    util.ByteStringBuffer.prototype.getSignedInt = function(n2) {
      var x2 = this.getInt(n2);
      var max = 2 << n2 - 2;
      if (x2 >= max) {
        x2 -= max << 1;
      }
      return x2;
    };
    util.ByteStringBuffer.prototype.getBytes = function(count) {
      var rval;
      if (count) {
        count = Math.min(this.length(), count);
        rval = this.data.slice(this.read, this.read + count);
        this.read += count;
      } else if (count === 0) {
        rval = "";
      } else {
        rval = this.read === 0 ? this.data : this.data.slice(this.read);
        this.clear();
      }
      return rval;
    };
    util.ByteStringBuffer.prototype.bytes = function(count) {
      return typeof count === "undefined" ? this.data.slice(this.read) : this.data.slice(this.read, this.read + count);
    };
    util.ByteStringBuffer.prototype.at = function(i2) {
      return this.data.charCodeAt(this.read + i2);
    };
    util.ByteStringBuffer.prototype.setAt = function(i2, b2) {
      this.data = this.data.substr(0, this.read + i2) + String.fromCharCode(b2) + this.data.substr(this.read + i2 + 1);
      return this;
    };
    util.ByteStringBuffer.prototype.last = function() {
      return this.data.charCodeAt(this.data.length - 1);
    };
    util.ByteStringBuffer.prototype.copy = function() {
      var c2 = util.createBuffer(this.data);
      c2.read = this.read;
      return c2;
    };
    util.ByteStringBuffer.prototype.compact = function() {
      if (this.read > 0) {
        this.data = this.data.slice(this.read);
        this.read = 0;
      }
      return this;
    };
    util.ByteStringBuffer.prototype.clear = function() {
      this.data = "";
      this.read = 0;
      return this;
    };
    util.ByteStringBuffer.prototype.truncate = function(count) {
      var len = Math.max(0, this.length() - count);
      this.data = this.data.substr(this.read, len);
      this.read = 0;
      return this;
    };
    util.ByteStringBuffer.prototype.toHex = function() {
      var rval = "";
      for (var i2 = this.read; i2 < this.data.length; ++i2) {
        var b2 = this.data.charCodeAt(i2);
        if (b2 < 16) {
          rval += "0";
        }
        rval += b2.toString(16);
      }
      return rval;
    };
    util.ByteStringBuffer.prototype.toString = function() {
      return util.decodeUtf8(this.bytes());
    };
    function DataBuffer(b2, options) {
      options = options || {};
      this.read = options.readOffset || 0;
      this.growSize = options.growSize || 1024;
      var isArrayBuffer = util.isArrayBuffer(b2);
      var isArrayBufferView = util.isArrayBufferView(b2);
      if (isArrayBuffer || isArrayBufferView) {
        if (isArrayBuffer) {
          this.data = new DataView(b2);
        } else {
          this.data = new DataView(b2.buffer, b2.byteOffset, b2.byteLength);
        }
        this.write = "writeOffset" in options ? options.writeOffset : this.data.byteLength;
        return;
      }
      this.data = new DataView(new ArrayBuffer(0));
      this.write = 0;
      if (b2 !== null && b2 !== void 0) {
        this.putBytes(b2);
      }
      if ("writeOffset" in options) {
        this.write = options.writeOffset;
      }
    }
    util.DataBuffer = DataBuffer;
    util.DataBuffer.prototype.length = function() {
      return this.write - this.read;
    };
    util.DataBuffer.prototype.isEmpty = function() {
      return this.length() <= 0;
    };
    util.DataBuffer.prototype.accommodate = function(amount, growSize) {
      if (this.length() >= amount) {
        return this;
      }
      growSize = Math.max(growSize || this.growSize, amount);
      var src = new Uint8Array(
        this.data.buffer,
        this.data.byteOffset,
        this.data.byteLength
      );
      var dst = new Uint8Array(this.length() + growSize);
      dst.set(src);
      this.data = new DataView(dst.buffer);
      return this;
    };
    util.DataBuffer.prototype.putByte = function(b2) {
      this.accommodate(1);
      this.data.setUint8(this.write++, b2);
      return this;
    };
    util.DataBuffer.prototype.fillWithByte = function(b2, n2) {
      this.accommodate(n2);
      for (var i2 = 0; i2 < n2; ++i2) {
        this.data.setUint8(b2);
      }
      return this;
    };
    util.DataBuffer.prototype.putBytes = function(bytes, encoding) {
      if (util.isArrayBufferView(bytes)) {
        var src = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        var len = src.byteLength - src.byteOffset;
        this.accommodate(len);
        var dst = new Uint8Array(this.data.buffer, this.write);
        dst.set(src);
        this.write += len;
        return this;
      }
      if (util.isArrayBuffer(bytes)) {
        var src = new Uint8Array(bytes);
        this.accommodate(src.byteLength);
        var dst = new Uint8Array(this.data.buffer);
        dst.set(src, this.write);
        this.write += src.byteLength;
        return this;
      }
      if (bytes instanceof util.DataBuffer || typeof bytes === "object" && typeof bytes.read === "number" && typeof bytes.write === "number" && util.isArrayBufferView(bytes.data)) {
        var src = new Uint8Array(bytes.data.byteLength, bytes.read, bytes.length());
        this.accommodate(src.byteLength);
        var dst = new Uint8Array(bytes.data.byteLength, this.write);
        dst.set(src);
        this.write += src.byteLength;
        return this;
      }
      if (bytes instanceof util.ByteStringBuffer) {
        bytes = bytes.data;
        encoding = "binary";
      }
      encoding = encoding || "binary";
      if (typeof bytes === "string") {
        var view;
        if (encoding === "hex") {
          this.accommodate(Math.ceil(bytes.length / 2));
          view = new Uint8Array(this.data.buffer, this.write);
          this.write += util.binary.hex.decode(bytes, view, this.write);
          return this;
        }
        if (encoding === "base64") {
          this.accommodate(Math.ceil(bytes.length / 4) * 3);
          view = new Uint8Array(this.data.buffer, this.write);
          this.write += util.binary.base64.decode(bytes, view, this.write);
          return this;
        }
        if (encoding === "utf8") {
          bytes = util.encodeUtf8(bytes);
          encoding = "binary";
        }
        if (encoding === "binary" || encoding === "raw") {
          this.accommodate(bytes.length);
          view = new Uint8Array(this.data.buffer, this.write);
          this.write += util.binary.raw.decode(view);
          return this;
        }
        if (encoding === "utf16") {
          this.accommodate(bytes.length * 2);
          view = new Uint16Array(this.data.buffer, this.write);
          this.write += util.text.utf16.encode(view);
          return this;
        }
        throw new Error("Invalid encoding: " + encoding);
      }
      throw Error("Invalid parameter: " + bytes);
    };
    util.DataBuffer.prototype.putBuffer = function(buffer) {
      this.putBytes(buffer);
      buffer.clear();
      return this;
    };
    util.DataBuffer.prototype.putString = function(str) {
      return this.putBytes(str, "utf16");
    };
    util.DataBuffer.prototype.putInt16 = function(i2) {
      this.accommodate(2);
      this.data.setInt16(this.write, i2);
      this.write += 2;
      return this;
    };
    util.DataBuffer.prototype.putInt24 = function(i2) {
      this.accommodate(3);
      this.data.setInt16(this.write, i2 >> 8 & 65535);
      this.data.setInt8(this.write, i2 >> 16 & 255);
      this.write += 3;
      return this;
    };
    util.DataBuffer.prototype.putInt32 = function(i2) {
      this.accommodate(4);
      this.data.setInt32(this.write, i2);
      this.write += 4;
      return this;
    };
    util.DataBuffer.prototype.putInt16Le = function(i2) {
      this.accommodate(2);
      this.data.setInt16(this.write, i2, true);
      this.write += 2;
      return this;
    };
    util.DataBuffer.prototype.putInt24Le = function(i2) {
      this.accommodate(3);
      this.data.setInt8(this.write, i2 >> 16 & 255);
      this.data.setInt16(this.write, i2 >> 8 & 65535, true);
      this.write += 3;
      return this;
    };
    util.DataBuffer.prototype.putInt32Le = function(i2) {
      this.accommodate(4);
      this.data.setInt32(this.write, i2, true);
      this.write += 4;
      return this;
    };
    util.DataBuffer.prototype.putInt = function(i2, n2) {
      _checkBitsParam(n2);
      this.accommodate(n2 / 8);
      do {
        n2 -= 8;
        this.data.setInt8(this.write++, i2 >> n2 & 255);
      } while (n2 > 0);
      return this;
    };
    util.DataBuffer.prototype.putSignedInt = function(i2, n2) {
      _checkBitsParam(n2);
      this.accommodate(n2 / 8);
      if (i2 < 0) {
        i2 += 2 << n2 - 1;
      }
      return this.putInt(i2, n2);
    };
    util.DataBuffer.prototype.getByte = function() {
      return this.data.getInt8(this.read++);
    };
    util.DataBuffer.prototype.getInt16 = function() {
      var rval = this.data.getInt16(this.read);
      this.read += 2;
      return rval;
    };
    util.DataBuffer.prototype.getInt24 = function() {
      var rval = this.data.getInt16(this.read) << 8 ^ this.data.getInt8(this.read + 2);
      this.read += 3;
      return rval;
    };
    util.DataBuffer.prototype.getInt32 = function() {
      var rval = this.data.getInt32(this.read);
      this.read += 4;
      return rval;
    };
    util.DataBuffer.prototype.getInt16Le = function() {
      var rval = this.data.getInt16(this.read, true);
      this.read += 2;
      return rval;
    };
    util.DataBuffer.prototype.getInt24Le = function() {
      var rval = this.data.getInt8(this.read) ^ this.data.getInt16(this.read + 1, true) << 8;
      this.read += 3;
      return rval;
    };
    util.DataBuffer.prototype.getInt32Le = function() {
      var rval = this.data.getInt32(this.read, true);
      this.read += 4;
      return rval;
    };
    util.DataBuffer.prototype.getInt = function(n2) {
      _checkBitsParam(n2);
      var rval = 0;
      do {
        rval = (rval << 8) + this.data.getInt8(this.read++);
        n2 -= 8;
      } while (n2 > 0);
      return rval;
    };
    util.DataBuffer.prototype.getSignedInt = function(n2) {
      var x2 = this.getInt(n2);
      var max = 2 << n2 - 2;
      if (x2 >= max) {
        x2 -= max << 1;
      }
      return x2;
    };
    util.DataBuffer.prototype.getBytes = function(count) {
      var rval;
      if (count) {
        count = Math.min(this.length(), count);
        rval = this.data.slice(this.read, this.read + count);
        this.read += count;
      } else if (count === 0) {
        rval = "";
      } else {
        rval = this.read === 0 ? this.data : this.data.slice(this.read);
        this.clear();
      }
      return rval;
    };
    util.DataBuffer.prototype.bytes = function(count) {
      return typeof count === "undefined" ? this.data.slice(this.read) : this.data.slice(this.read, this.read + count);
    };
    util.DataBuffer.prototype.at = function(i2) {
      return this.data.getUint8(this.read + i2);
    };
    util.DataBuffer.prototype.setAt = function(i2, b2) {
      this.data.setUint8(i2, b2);
      return this;
    };
    util.DataBuffer.prototype.last = function() {
      return this.data.getUint8(this.write - 1);
    };
    util.DataBuffer.prototype.copy = function() {
      return new util.DataBuffer(this);
    };
    util.DataBuffer.prototype.compact = function() {
      if (this.read > 0) {
        var src = new Uint8Array(this.data.buffer, this.read);
        var dst = new Uint8Array(src.byteLength);
        dst.set(src);
        this.data = new DataView(dst);
        this.write -= this.read;
        this.read = 0;
      }
      return this;
    };
    util.DataBuffer.prototype.clear = function() {
      this.data = new DataView(new ArrayBuffer(0));
      this.read = this.write = 0;
      return this;
    };
    util.DataBuffer.prototype.truncate = function(count) {
      this.write = Math.max(0, this.length() - count);
      this.read = Math.min(this.read, this.write);
      return this;
    };
    util.DataBuffer.prototype.toHex = function() {
      var rval = "";
      for (var i2 = this.read; i2 < this.data.byteLength; ++i2) {
        var b2 = this.data.getUint8(i2);
        if (b2 < 16) {
          rval += "0";
        }
        rval += b2.toString(16);
      }
      return rval;
    };
    util.DataBuffer.prototype.toString = function(encoding) {
      var view = new Uint8Array(this.data, this.read, this.length());
      encoding = encoding || "utf8";
      if (encoding === "binary" || encoding === "raw") {
        return util.binary.raw.encode(view);
      }
      if (encoding === "hex") {
        return util.binary.hex.encode(view);
      }
      if (encoding === "base64") {
        return util.binary.base64.encode(view);
      }
      if (encoding === "utf8") {
        return util.text.utf8.decode(view);
      }
      if (encoding === "utf16") {
        return util.text.utf16.decode(view);
      }
      throw new Error("Invalid encoding: " + encoding);
    };
    util.createBuffer = function(input, encoding) {
      encoding = encoding || "raw";
      if (input !== void 0 && encoding === "utf8") {
        input = util.encodeUtf8(input);
      }
      return new util.ByteBuffer(input);
    };
    util.fillString = function(c2, n2) {
      var s2 = "";
      while (n2 > 0) {
        if (n2 & 1) {
          s2 += c2;
        }
        n2 >>>= 1;
        if (n2 > 0) {
          c2 += c2;
        }
      }
      return s2;
    };
    util.xorBytes = function(s1, s2, n2) {
      var s3 = "";
      var b2 = "";
      var t2 = "";
      var i2 = 0;
      var c2 = 0;
      for (; n2 > 0; --n2, ++i2) {
        b2 = s1.charCodeAt(i2) ^ s2.charCodeAt(i2);
        if (c2 >= 10) {
          s3 += t2;
          t2 = "";
          c2 = 0;
        }
        t2 += String.fromCharCode(b2);
        ++c2;
      }
      s3 += t2;
      return s3;
    };
    util.hexToBytes = function(hex) {
      var rval = "";
      var i2 = 0;
      if (hex.length & true) {
        i2 = 1;
        rval += String.fromCharCode(parseInt(hex[0], 16));
      }
      for (; i2 < hex.length; i2 += 2) {
        rval += String.fromCharCode(parseInt(hex.substr(i2, 2), 16));
      }
      return rval;
    };
    util.bytesToHex = function(bytes) {
      return util.createBuffer(bytes).toHex();
    };
    util.int32ToBytes = function(i2) {
      return String.fromCharCode(i2 >> 24 & 255) + String.fromCharCode(i2 >> 16 & 255) + String.fromCharCode(i2 >> 8 & 255) + String.fromCharCode(i2 & 255);
    };
    var _base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var _base64Idx = [
      /*43 -43 = 0*/
      /*'+',  1,  2,  3,'/' */
      62,
      -1,
      -1,
      -1,
      63,
      /*'0','1','2','3','4','5','6','7','8','9' */
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      59,
      60,
      61,
      /*15, 16, 17,'=', 19, 20, 21 */
      -1,
      -1,
      -1,
      64,
      -1,
      -1,
      -1,
      /*65 - 43 = 22*/
      /*'A','B','C','D','E','F','G','H','I','J','K','L','M', */
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      /*'N','O','P','Q','R','S','T','U','V','W','X','Y','Z' */
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      /*91 - 43 = 48 */
      /*48, 49, 50, 51, 52, 53 */
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      /*97 - 43 = 54*/
      /*'a','b','c','d','e','f','g','h','i','j','k','l','m' */
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      38,
      /*'n','o','p','q','r','s','t','u','v','w','x','y','z' */
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49,
      50,
      51
    ];
    var _base58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    util.encode64 = function(input, maxline) {
      var line = "";
      var output = "";
      var chr1, chr2, chr3;
      var i2 = 0;
      while (i2 < input.length) {
        chr1 = input.charCodeAt(i2++);
        chr2 = input.charCodeAt(i2++);
        chr3 = input.charCodeAt(i2++);
        line += _base64.charAt(chr1 >> 2);
        line += _base64.charAt((chr1 & 3) << 4 | chr2 >> 4);
        if (isNaN(chr2)) {
          line += "==";
        } else {
          line += _base64.charAt((chr2 & 15) << 2 | chr3 >> 6);
          line += isNaN(chr3) ? "=" : _base64.charAt(chr3 & 63);
        }
        if (maxline && line.length > maxline) {
          output += line.substr(0, maxline) + "\r\n";
          line = line.substr(maxline);
        }
      }
      output += line;
      return output;
    };
    util.decode64 = function(input) {
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      var output = "";
      var enc1, enc2, enc3, enc4;
      var i2 = 0;
      while (i2 < input.length) {
        enc1 = _base64Idx[input.charCodeAt(i2++) - 43];
        enc2 = _base64Idx[input.charCodeAt(i2++) - 43];
        enc3 = _base64Idx[input.charCodeAt(i2++) - 43];
        enc4 = _base64Idx[input.charCodeAt(i2++) - 43];
        output += String.fromCharCode(enc1 << 2 | enc2 >> 4);
        if (enc3 !== 64) {
          output += String.fromCharCode((enc2 & 15) << 4 | enc3 >> 2);
          if (enc4 !== 64) {
            output += String.fromCharCode((enc3 & 3) << 6 | enc4);
          }
        }
      }
      return output;
    };
    util.encodeUtf8 = function(str) {
      return unescape(encodeURIComponent(str));
    };
    util.decodeUtf8 = function(str) {
      return decodeURIComponent(escape(str));
    };
    util.binary = {
      raw: {},
      hex: {},
      base64: {},
      base58: {},
      baseN: {
        encode: baseN.encode,
        decode: baseN.decode
      }
    };
    util.binary.raw.encode = function(bytes) {
      return String.fromCharCode.apply(null, bytes);
    };
    util.binary.raw.decode = function(str, output, offset) {
      var out = output;
      if (!out) {
        out = new Uint8Array(str.length);
      }
      offset = offset || 0;
      var j2 = offset;
      for (var i2 = 0; i2 < str.length; ++i2) {
        out[j2++] = str.charCodeAt(i2);
      }
      return output ? j2 - offset : out;
    };
    util.binary.hex.encode = util.bytesToHex;
    util.binary.hex.decode = function(hex, output, offset) {
      var out = output;
      if (!out) {
        out = new Uint8Array(Math.ceil(hex.length / 2));
      }
      offset = offset || 0;
      var i2 = 0, j2 = offset;
      if (hex.length & 1) {
        i2 = 1;
        out[j2++] = parseInt(hex[0], 16);
      }
      for (; i2 < hex.length; i2 += 2) {
        out[j2++] = parseInt(hex.substr(i2, 2), 16);
      }
      return output ? j2 - offset : out;
    };
    util.binary.base64.encode = function(input, maxline) {
      var line = "";
      var output = "";
      var chr1, chr2, chr3;
      var i2 = 0;
      while (i2 < input.byteLength) {
        chr1 = input[i2++];
        chr2 = input[i2++];
        chr3 = input[i2++];
        line += _base64.charAt(chr1 >> 2);
        line += _base64.charAt((chr1 & 3) << 4 | chr2 >> 4);
        if (isNaN(chr2)) {
          line += "==";
        } else {
          line += _base64.charAt((chr2 & 15) << 2 | chr3 >> 6);
          line += isNaN(chr3) ? "=" : _base64.charAt(chr3 & 63);
        }
        if (maxline && line.length > maxline) {
          output += line.substr(0, maxline) + "\r\n";
          line = line.substr(maxline);
        }
      }
      output += line;
      return output;
    };
    util.binary.base64.decode = function(input, output, offset) {
      var out = output;
      if (!out) {
        out = new Uint8Array(Math.ceil(input.length / 4) * 3);
      }
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      offset = offset || 0;
      var enc1, enc2, enc3, enc4;
      var i2 = 0, j2 = offset;
      while (i2 < input.length) {
        enc1 = _base64Idx[input.charCodeAt(i2++) - 43];
        enc2 = _base64Idx[input.charCodeAt(i2++) - 43];
        enc3 = _base64Idx[input.charCodeAt(i2++) - 43];
        enc4 = _base64Idx[input.charCodeAt(i2++) - 43];
        out[j2++] = enc1 << 2 | enc2 >> 4;
        if (enc3 !== 64) {
          out[j2++] = (enc2 & 15) << 4 | enc3 >> 2;
          if (enc4 !== 64) {
            out[j2++] = (enc3 & 3) << 6 | enc4;
          }
        }
      }
      return output ? j2 - offset : out.subarray(0, j2);
    };
    util.binary.base58.encode = function(input, maxline) {
      return util.binary.baseN.encode(input, _base58, maxline);
    };
    util.binary.base58.decode = function(input, maxline) {
      return util.binary.baseN.decode(input, _base58, maxline);
    };
    util.text = {
      utf8: {},
      utf16: {}
    };
    util.text.utf8.encode = function(str, output, offset) {
      str = util.encodeUtf8(str);
      var out = output;
      if (!out) {
        out = new Uint8Array(str.length);
      }
      offset = offset || 0;
      var j2 = offset;
      for (var i2 = 0; i2 < str.length; ++i2) {
        out[j2++] = str.charCodeAt(i2);
      }
      return output ? j2 - offset : out;
    };
    util.text.utf8.decode = function(bytes) {
      return util.decodeUtf8(String.fromCharCode.apply(null, bytes));
    };
    util.text.utf16.encode = function(str, output, offset) {
      var out = output;
      if (!out) {
        out = new Uint8Array(str.length * 2);
      }
      var view = new Uint16Array(out.buffer);
      offset = offset || 0;
      var j2 = offset;
      var k2 = offset;
      for (var i2 = 0; i2 < str.length; ++i2) {
        view[k2++] = str.charCodeAt(i2);
        j2 += 2;
      }
      return output ? j2 - offset : out;
    };
    util.text.utf16.decode = function(bytes) {
      return String.fromCharCode.apply(null, new Uint16Array(bytes.buffer));
    };
    util.deflate = function(api, bytes, raw) {
      bytes = util.decode64(api.deflate(util.encode64(bytes)).rval);
      if (raw) {
        var start = 2;
        var flg = bytes.charCodeAt(1);
        if (flg & 32) {
          start = 6;
        }
        bytes = bytes.substring(start, bytes.length - 4);
      }
      return bytes;
    };
    util.inflate = function(api, bytes, raw) {
      var rval = api.inflate(util.encode64(bytes)).rval;
      return rval === null ? null : util.decode64(rval);
    };
    var _setStorageObject = function(api, id, obj) {
      if (!api) {
        throw new Error("WebStorage not available.");
      }
      var rval;
      if (obj === null) {
        rval = api.removeItem(id);
      } else {
        obj = util.encode64(JSON.stringify(obj));
        rval = api.setItem(id, obj);
      }
      if (typeof rval !== "undefined" && rval.rval !== true) {
        var error = new Error(rval.error.message);
        error.id = rval.error.id;
        error.name = rval.error.name;
        throw error;
      }
    };
    var _getStorageObject = function(api, id) {
      if (!api) {
        throw new Error("WebStorage not available.");
      }
      var rval = api.getItem(id);
      if (api.init) {
        if (rval.rval === null) {
          if (rval.error) {
            var error = new Error(rval.error.message);
            error.id = rval.error.id;
            error.name = rval.error.name;
            throw error;
          }
          rval = null;
        } else {
          rval = rval.rval;
        }
      }
      if (rval !== null) {
        rval = JSON.parse(util.decode64(rval));
      }
      return rval;
    };
    var _setItem = function(api, id, key, data) {
      var obj = _getStorageObject(api, id);
      if (obj === null) {
        obj = {};
      }
      obj[key] = data;
      _setStorageObject(api, id, obj);
    };
    var _getItem = function(api, id, key) {
      var rval = _getStorageObject(api, id);
      if (rval !== null) {
        rval = key in rval ? rval[key] : null;
      }
      return rval;
    };
    var _removeItem = function(api, id, key) {
      var obj = _getStorageObject(api, id);
      if (obj !== null && key in obj) {
        delete obj[key];
        var empty = true;
        for (var prop in obj) {
          empty = false;
          break;
        }
        if (empty) {
          obj = null;
        }
        _setStorageObject(api, id, obj);
      }
    };
    var _clearItems = function(api, id) {
      _setStorageObject(api, id, null);
    };
    var _callStorageFunction = function(func, args, location) {
      var rval = null;
      if (typeof location === "undefined") {
        location = ["web", "flash"];
      }
      var type;
      var done = false;
      var exception = null;
      for (var idx in location) {
        type = location[idx];
        try {
          if (type === "flash" || type === "both") {
            if (args[0] === null) {
              throw new Error("Flash local storage not available.");
            }
            rval = func.apply(this, args);
            done = type === "flash";
          }
          if (type === "web" || type === "both") {
            args[0] = localStorage;
            rval = func.apply(this, args);
            done = true;
          }
        } catch (ex) {
          exception = ex;
        }
        if (done) {
          break;
        }
      }
      if (!done) {
        throw exception;
      }
      return rval;
    };
    util.setItem = function(api, id, key, data, location) {
      _callStorageFunction(_setItem, arguments, location);
    };
    util.getItem = function(api, id, key, location) {
      return _callStorageFunction(_getItem, arguments, location);
    };
    util.removeItem = function(api, id, key, location) {
      _callStorageFunction(_removeItem, arguments, location);
    };
    util.clearItems = function(api, id, location) {
      _callStorageFunction(_clearItems, arguments, location);
    };
    util.isEmpty = function(obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          return false;
        }
      }
      return true;
    };
    util.format = function(format) {
      var re2 = /%./g;
      var match;
      var part;
      var argi = 0;
      var parts = [];
      var last = 0;
      while (match = re2.exec(format)) {
        part = format.substring(last, re2.lastIndex - 2);
        if (part.length > 0) {
          parts.push(part);
        }
        last = re2.lastIndex;
        var code = match[0][1];
        switch (code) {
          case "s":
          case "o":
            if (argi < arguments.length) {
              parts.push(arguments[argi++ + 1]);
            } else {
              parts.push("<?>");
            }
            break;
          // FIXME: do proper formatting for numbers, etc
          //case 'f':
          //case 'd':
          case "%":
            parts.push("%");
            break;
          default:
            parts.push("<%" + code + "?>");
        }
      }
      parts.push(format.substring(last));
      return parts.join("");
    };
    util.formatNumber = function(number, decimals, dec_point, thousands_sep) {
      var n2 = number, c2 = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals;
      var d2 = dec_point === void 0 ? "," : dec_point;
      var t2 = thousands_sep === void 0 ? "." : thousands_sep, s2 = n2 < 0 ? "-" : "";
      var i2 = parseInt(n2 = Math.abs(+n2 || 0).toFixed(c2), 10) + "";
      var j2 = i2.length > 3 ? i2.length % 3 : 0;
      return s2 + (j2 ? i2.substr(0, j2) + t2 : "") + i2.substr(j2).replace(/(\d{3})(?=\d)/g, "$1" + t2) + (c2 ? d2 + Math.abs(n2 - i2).toFixed(c2).slice(2) : "");
    };
    util.formatSize = function(size) {
      if (size >= 1073741824) {
        size = util.formatNumber(size / 1073741824, 2, ".", "") + " GiB";
      } else if (size >= 1048576) {
        size = util.formatNumber(size / 1048576, 2, ".", "") + " MiB";
      } else if (size >= 1024) {
        size = util.formatNumber(size / 1024, 0) + " KiB";
      } else {
        size = util.formatNumber(size, 0) + " bytes";
      }
      return size;
    };
    util.bytesFromIP = function(ip) {
      if (ip.indexOf(".") !== -1) {
        return util.bytesFromIPv4(ip);
      }
      if (ip.indexOf(":") !== -1) {
        return util.bytesFromIPv6(ip);
      }
      return null;
    };
    util.bytesFromIPv4 = function(ip) {
      ip = ip.split(".");
      if (ip.length !== 4) {
        return null;
      }
      var b2 = util.createBuffer();
      for (var i2 = 0; i2 < ip.length; ++i2) {
        var num = parseInt(ip[i2], 10);
        if (isNaN(num)) {
          return null;
        }
        b2.putByte(num);
      }
      return b2.getBytes();
    };
    util.bytesFromIPv6 = function(ip) {
      var blanks = 0;
      ip = ip.split(":").filter(function(e2) {
        if (e2.length === 0) ++blanks;
        return true;
      });
      var zeros = (8 - ip.length + blanks) * 2;
      var b2 = util.createBuffer();
      for (var i2 = 0; i2 < 8; ++i2) {
        if (!ip[i2] || ip[i2].length === 0) {
          b2.fillWithByte(0, zeros);
          zeros = 0;
          continue;
        }
        var bytes = util.hexToBytes(ip[i2]);
        if (bytes.length < 2) {
          b2.putByte(0);
        }
        b2.putBytes(bytes);
      }
      return b2.getBytes();
    };
    util.bytesToIP = function(bytes) {
      if (bytes.length === 4) {
        return util.bytesToIPv4(bytes);
      }
      if (bytes.length === 16) {
        return util.bytesToIPv6(bytes);
      }
      return null;
    };
    util.bytesToIPv4 = function(bytes) {
      if (bytes.length !== 4) {
        return null;
      }
      var ip = [];
      for (var i2 = 0; i2 < bytes.length; ++i2) {
        ip.push(bytes.charCodeAt(i2));
      }
      return ip.join(".");
    };
    util.bytesToIPv6 = function(bytes) {
      if (bytes.length !== 16) {
        return null;
      }
      var ip = [];
      var zeroGroups = [];
      var zeroMaxGroup = 0;
      for (var i2 = 0; i2 < bytes.length; i2 += 2) {
        var hex = util.bytesToHex(bytes[i2] + bytes[i2 + 1]);
        while (hex[0] === "0" && hex !== "0") {
          hex = hex.substr(1);
        }
        if (hex === "0") {
          var last = zeroGroups[zeroGroups.length - 1];
          var idx = ip.length;
          if (!last || idx !== last.end + 1) {
            zeroGroups.push({ start: idx, end: idx });
          } else {
            last.end = idx;
            if (last.end - last.start > zeroGroups[zeroMaxGroup].end - zeroGroups[zeroMaxGroup].start) {
              zeroMaxGroup = zeroGroups.length - 1;
            }
          }
        }
        ip.push(hex);
      }
      if (zeroGroups.length > 0) {
        var group = zeroGroups[zeroMaxGroup];
        if (group.end - group.start > 0) {
          ip.splice(group.start, group.end - group.start + 1, "");
          if (group.start === 0) {
            ip.unshift("");
          }
          if (group.end === 7) {
            ip.push("");
          }
        }
      }
      return ip.join(":");
    };
    util.estimateCores = function(options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      options = options || {};
      if ("cores" in util && !options.update) {
        return callback(null, util.cores);
      }
      if (typeof navigator !== "undefined" && "hardwareConcurrency" in navigator && navigator.hardwareConcurrency > 0) {
        util.cores = navigator.hardwareConcurrency;
        return callback(null, util.cores);
      }
      if (typeof Worker === "undefined") {
        util.cores = 1;
        return callback(null, util.cores);
      }
      if (typeof Blob === "undefined") {
        util.cores = 2;
        return callback(null, util.cores);
      }
      var blobUrl = URL.createObjectURL(new Blob([
        "(",
        function() {
          self.addEventListener("message", function(e2) {
            var st = Date.now();
            var et = st + 4;
            while (Date.now() < et) ;
            self.postMessage({ st, et });
          });
        }.toString(),
        ")()"
      ], { type: "application/javascript" }));
      sample([], 5, 16);
      function sample(max, samples, numWorkers) {
        if (samples === 0) {
          var avg = Math.floor(max.reduce(function(avg2, x2) {
            return avg2 + x2;
          }, 0) / max.length);
          util.cores = Math.max(1, avg);
          URL.revokeObjectURL(blobUrl);
          return callback(null, util.cores);
        }
        map(numWorkers, function(err, results) {
          max.push(reduce(numWorkers, results));
          sample(max, samples - 1, numWorkers);
        });
      }
      function map(numWorkers, callback2) {
        var workers = [];
        var results = [];
        for (var i2 = 0; i2 < numWorkers; ++i2) {
          var worker = new Worker(blobUrl);
          worker.addEventListener("message", function(e2) {
            results.push(e2.data);
            if (results.length === numWorkers) {
              for (var i3 = 0; i3 < numWorkers; ++i3) {
                workers[i3].terminate();
              }
              callback2(null, results);
            }
          });
          workers.push(worker);
        }
        for (var i2 = 0; i2 < numWorkers; ++i2) {
          workers[i2].postMessage(i2);
        }
      }
      function reduce(numWorkers, results) {
        var overlaps = [];
        for (var n2 = 0; n2 < numWorkers; ++n2) {
          var r1 = results[n2];
          var overlap = overlaps[n2] = [];
          for (var i2 = 0; i2 < numWorkers; ++i2) {
            if (n2 === i2) {
              continue;
            }
            var r2 = results[i2];
            if (r1.st > r2.st && r1.st < r2.et || r2.st > r1.st && r2.st < r1.et) {
              overlap.push(i2);
            }
          }
        }
        return overlaps.reduce(function(max, overlap2) {
          return Math.max(max, overlap2.length);
        }, 0);
      }
    };
  }
});

// node_modules/node-forge/lib/cipher.js
var require_cipher = __commonJS({
  "node_modules/node-forge/lib/cipher.js"(exports2, module2) {
    var forge = require_forge();
    require_util();
    module2.exports = forge.cipher = forge.cipher || {};
    forge.cipher.algorithms = forge.cipher.algorithms || {};
    forge.cipher.createCipher = function(algorithm, key) {
      var api = algorithm;
      if (typeof api === "string") {
        api = forge.cipher.getAlgorithm(api);
        if (api) {
          api = api();
        }
      }
      if (!api) {
        throw new Error("Unsupported algorithm: " + algorithm);
      }
      return new forge.cipher.BlockCipher({
        algorithm: api,
        key,
        decrypt: false
      });
    };
    forge.cipher.createDecipher = function(algorithm, key) {
      var api = algorithm;
      if (typeof api === "string") {
        api = forge.cipher.getAlgorithm(api);
        if (api) {
          api = api();
        }
      }
      if (!api) {
        throw new Error("Unsupported algorithm: " + algorithm);
      }
      return new forge.cipher.BlockCipher({
        algorithm: api,
        key,
        decrypt: true
      });
    };
    forge.cipher.registerAlgorithm = function(name, algorithm) {
      name = name.toUpperCase();
      forge.cipher.algorithms[name] = algorithm;
    };
    forge.cipher.getAlgorithm = function(name) {
      name = name.toUpperCase();
      if (name in forge.cipher.algorithms) {
        return forge.cipher.algorithms[name];
      }
      return null;
    };
    var BlockCipher = forge.cipher.BlockCipher = function(options) {
      this.algorithm = options.algorithm;
      this.mode = this.algorithm.mode;
      this.blockSize = this.mode.blockSize;
      this._finish = false;
      this._input = null;
      this.output = null;
      this._op = options.decrypt ? this.mode.decrypt : this.mode.encrypt;
      this._decrypt = options.decrypt;
      this.algorithm.initialize(options);
    };
    BlockCipher.prototype.start = function(options) {
      options = options || {};
      var opts = {};
      for (var key in options) {
        opts[key] = options[key];
      }
      opts.decrypt = this._decrypt;
      this._finish = false;
      this._input = forge.util.createBuffer();
      this.output = options.output || forge.util.createBuffer();
      this.mode.start(opts);
    };
    BlockCipher.prototype.update = function(input) {
      if (input) {
        this._input.putBuffer(input);
      }
      while (!this._op.call(this.mode, this._input, this.output, this._finish) && !this._finish) {
      }
      this._input.compact();
    };
    BlockCipher.prototype.finish = function(pad) {
      if (pad && (this.mode.name === "ECB" || this.mode.name === "CBC")) {
        this.mode.pad = function(input) {
          return pad(this.blockSize, input, false);
        };
        this.mode.unpad = function(output) {
          return pad(this.blockSize, output, true);
        };
      }
      var options = {};
      options.decrypt = this._decrypt;
      options.overflow = this._input.length() % this.blockSize;
      if (!this._decrypt && this.mode.pad) {
        if (!this.mode.pad(this._input, options)) {
          return false;
        }
      }
      this._finish = true;
      this.update();
      if (this._decrypt && this.mode.unpad) {
        if (!this.mode.unpad(this.output, options)) {
          return false;
        }
      }
      if (this.mode.afterFinish) {
        if (!this.mode.afterFinish(this.output, options)) {
          return false;
        }
      }
      return true;
    };
  }
});

// node_modules/node-forge/lib/cipherModes.js
var require_cipherModes = __commonJS({
  "node_modules/node-forge/lib/cipherModes.js"(exports2, module2) {
    var forge = require_forge();
    require_util();
    forge.cipher = forge.cipher || {};
    var modes = module2.exports = forge.cipher.modes = forge.cipher.modes || {};
    modes.ecb = function(options) {
      options = options || {};
      this.name = "ECB";
      this.cipher = options.cipher;
      this.blockSize = options.blockSize || 16;
      this._ints = this.blockSize / 4;
      this._inBlock = new Array(this._ints);
      this._outBlock = new Array(this._ints);
    };
    modes.ecb.prototype.start = function(options) {
    };
    modes.ecb.prototype.encrypt = function(input, output, finish) {
      if (input.length() < this.blockSize && !(finish && input.length() > 0)) {
        return true;
      }
      for (var i2 = 0; i2 < this._ints; ++i2) {
        this._inBlock[i2] = input.getInt32();
      }
      this.cipher.encrypt(this._inBlock, this._outBlock);
      for (var i2 = 0; i2 < this._ints; ++i2) {
        output.putInt32(this._outBlock[i2]);
      }
    };
    modes.ecb.prototype.decrypt = function(input, output, finish) {
      if (input.length() < this.blockSize && !(finish && input.length() > 0)) {
        return true;
      }
      for (var i2 = 0; i2 < this._ints; ++i2) {
        this._inBlock[i2] = input.getInt32();
      }
      this.cipher.decrypt(this._inBlock, this._outBlock);
      for (var i2 = 0; i2 < this._ints; ++i2) {
        output.putInt32(this._outBlock[i2]);
      }
    };
    modes.ecb.prototype.pad = function(input, options) {
      var padding = input.length() === this.blockSize ? this.blockSize : this.blockSize - input.length();
      input.fillWithByte(padding, padding);
      return true;
    };
    modes.ecb.prototype.unpad = function(output, options) {
      if (options.overflow > 0) {
        return false;
      }
      var len = output.length();
      var count = output.at(len - 1);
      if (count > this.blockSize << 2) {
        return false;
      }
      output.truncate(count);
      return true;
    };
    modes.cbc = function(options) {
      options = options || {};
      this.name = "CBC";
      this.cipher = options.cipher;
      this.blockSize = options.blockSize || 16;
      this._ints = this.blockSize / 4;
      this._inBlock = new Array(this._ints);
      this._outBlock = new Array(this._ints);
    };
    modes.cbc.prototype.start = function(options) {
      if (options.iv === null) {
        if (!this._prev) {
          throw new Error("Invalid IV parameter.");
        }
        this._iv = this._prev.slice(0);
      } else if (!("iv" in options)) {
        throw new Error("Invalid IV parameter.");
      } else {
        this._iv = transformIV(options.iv, this.blockSize);
        this._prev = this._iv.slice(0);
      }
    };
    modes.cbc.prototype.encrypt = function(input, output, finish) {
      if (input.length() < this.blockSize && !(finish && input.length() > 0)) {
        return true;
      }
      for (var i2 = 0; i2 < this._ints; ++i2) {
        this._inBlock[i2] = this._prev[i2] ^ input.getInt32();
      }
      this.cipher.encrypt(this._inBlock, this._outBlock);
      for (var i2 = 0; i2 < this._ints; ++i2) {
        output.putInt32(this._outBlock[i2]);
      }
      this._prev = this._outBlock;
    };
    modes.cbc.prototype.decrypt = function(input, output, finish) {
      if (input.length() < this.blockSize && !(finish && input.length() > 0)) {
        return true;
      }
      for (var i2 = 0; i2 < this._ints; ++i2) {
        this._inBlock[i2] = input.getInt32();
      }
      this.cipher.decrypt(this._inBlock, this._outBlock);
      for (var i2 = 0; i2 < this._ints; ++i2) {
        output.putInt32(this._prev[i2] ^ this._outBlock[i2]);
      }
      this._prev = this._inBlock.slice(0);
    };
    modes.cbc.prototype.pad = function(input, options) {
      var padding = input.length() === this.blockSize ? this.blockSize : this.blockSize - input.length();
      input.fillWithByte(padding, padding);
      return true;
    };
    modes.cbc.prototype.unpad = function(output, options) {
      if (options.overflow > 0) {
        return false;
      }
      var len = output.length();
      var count = output.at(len - 1);
      if (count > this.blockSize << 2) {
        return false;
      }
      output.truncate(count);
      return true;
    };
    modes.cfb = function(options) {
      options = options || {};
      this.name = "CFB";
      this.cipher = options.cipher;
      this.blockSize = options.blockSize || 16;
      this._ints = this.blockSize / 4;
      this._inBlock = null;
      this._outBlock = new Array(this._ints);
      this._partialBlock = new Array(this._ints);
      this._partialOutput = forge.util.createBuffer();
      this._partialBytes = 0;
    };
    modes.cfb.prototype.start = function(options) {
      if (!("iv" in options)) {
        throw new Error("Invalid IV parameter.");
      }
      this._iv = transformIV(options.iv, this.blockSize);
      this._inBlock = this._iv.slice(0);
      this._partialBytes = 0;
    };
    modes.cfb.prototype.encrypt = function(input, output, finish) {
      var inputLength = input.length();
      if (inputLength === 0) {
        return true;
      }
      this.cipher.encrypt(this._inBlock, this._outBlock);
      if (this._partialBytes === 0 && inputLength >= this.blockSize) {
        for (var i2 = 0; i2 < this._ints; ++i2) {
          this._inBlock[i2] = input.getInt32() ^ this._outBlock[i2];
          output.putInt32(this._inBlock[i2]);
        }
        return;
      }
      var partialBytes = (this.blockSize - inputLength) % this.blockSize;
      if (partialBytes > 0) {
        partialBytes = this.blockSize - partialBytes;
      }
      this._partialOutput.clear();
      for (var i2 = 0; i2 < this._ints; ++i2) {
        this._partialBlock[i2] = input.getInt32() ^ this._outBlock[i2];
        this._partialOutput.putInt32(this._partialBlock[i2]);
      }
      if (partialBytes > 0) {
        input.read -= this.blockSize;
      } else {
        for (var i2 = 0; i2 < this._ints; ++i2) {
          this._inBlock[i2] = this._partialBlock[i2];
        }
      }
      if (this._partialBytes > 0) {
        this._partialOutput.getBytes(this._partialBytes);
      }
      if (partialBytes > 0 && !finish) {
        output.putBytes(this._partialOutput.getBytes(
          partialBytes - this._partialBytes
        ));
        this._partialBytes = partialBytes;
        return true;
      }
      output.putBytes(this._partialOutput.getBytes(
        inputLength - this._partialBytes
      ));
      this._partialBytes = 0;
    };
    modes.cfb.prototype.decrypt = function(input, output, finish) {
      var inputLength = input.length();
      if (inputLength === 0) {
        return true;
      }
      this.cipher.encrypt(this._inBlock, this._outBlock);
      if (this._partialBytes === 0 && inputLength >= this.blockSize) {
        for (var i2 = 0; i2 < this._ints; ++i2) {
          this._inBlock[i2] = input.getInt32();
          output.putInt32(this._inBlock[i2] ^ this._outBlock[i2]);
        }
        return;
      }
      var partialBytes = (this.blockSize - inputLength) % this.blockSize;
      if (partialBytes > 0) {
        partialBytes = this.blockSize - partialBytes;
      }
      this._partialOutput.clear();
      for (var i2 = 0; i2 < this._ints; ++i2) {
        this._partialBlock[i2] = input.getInt32();
        this._partialOutput.putInt32(this._partialBlock[i2] ^ this._outBlock[i2]);
      }
      if (partialBytes > 0) {
        input.read -= this.blockSize;
      } else {
        for (var i2 = 0; i2 < this._ints; ++i2) {
          this._inBlock[i2] = this._partialBlock[i2];
        }
      }
      if (this._partialBytes > 0) {
        this._partialOutput.getBytes(this._partialBytes);
      }
      if (partialBytes > 0 && !finish) {
        output.putBytes(this._partialOutput.getBytes(
          partialBytes - this._partialBytes
        ));
        this._partialBytes = partialBytes;
        return true;
      }
      output.putBytes(this._partialOutput.getBytes(
        inputLength - this._partialBytes
      ));
      this._partialBytes = 0;
    };
    modes.ofb = function(options) {
      options = options || {};
      this.name = "OFB";
      this.cipher = options.cipher;
      this.blockSize = options.blockSize || 16;
      this._ints = this.blockSize / 4;
      this._inBlock = null;
      this._outBlock = new Array(this._ints);
      this._partialOutput = forge.util.createBuffer();
      this._partialBytes = 0;
    };
    modes.ofb.prototype.start = function(options) {
      if (!("iv" in options)) {
        throw new Error("Invalid IV parameter.");
      }
      this._iv = transformIV(options.iv, this.blockSize);
      this._inBlock = this._iv.slice(0);
      this._partialBytes = 0;
    };
    modes.ofb.prototype.encrypt = function(input, output, finish) {
      var inputLength = input.length();
      if (input.length() === 0) {
        return true;
      }
      this.cipher.encrypt(this._inBlock, this._outBlock);
      if (this._partialBytes === 0 && inputLength >= this.blockSize) {
        for (var i2 = 0; i2 < this._ints; ++i2) {
          output.putInt32(input.getInt32() ^ this._outBlock[i2]);
          this._inBlock[i2] = this._outBlock[i2];
        }
        return;
      }
      var partialBytes = (this.blockSize - inputLength) % this.blockSize;
      if (partialBytes > 0) {
        partialBytes = this.blockSize - partialBytes;
      }
      this._partialOutput.clear();
      for (var i2 = 0; i2 < this._ints; ++i2) {
        this._partialOutput.putInt32(input.getInt32() ^ this._outBlock[i2]);
      }
      if (partialBytes > 0) {
        input.read -= this.blockSize;
      } else {
        for (var i2 = 0; i2 < this._ints; ++i2) {
          this._inBlock[i2] = this._outBlock[i2];
        }
      }
      if (this._partialBytes > 0) {
        this._partialOutput.getBytes(this._partialBytes);
      }
      if (partialBytes > 0 && !finish) {
        output.putBytes(this._partialOutput.getBytes(
          partialBytes - this._partialBytes
        ));
        this._partialBytes = partialBytes;
        return true;
      }
      output.putBytes(this._partialOutput.getBytes(
        inputLength - this._partialBytes
      ));
      this._partialBytes = 0;
    };
    modes.ofb.prototype.decrypt = modes.ofb.prototype.encrypt;
    modes.ctr = function(options) {
      options = options || {};
      this.name = "CTR";
      this.cipher = options.cipher;
      this.blockSize = options.blockSize || 16;
      this._ints = this.blockSize / 4;
      this._inBlock = null;
      this._outBlock = new Array(this._ints);
      this._partialOutput = forge.util.createBuffer();
      this._partialBytes = 0;
    };
    modes.ctr.prototype.start = function(options) {
      if (!("iv" in options)) {
        throw new Error("Invalid IV parameter.");
      }
      this._iv = transformIV(options.iv, this.blockSize);
      this._inBlock = this._iv.slice(0);
      this._partialBytes = 0;
    };
    modes.ctr.prototype.encrypt = function(input, output, finish) {
      var inputLength = input.length();
      if (inputLength === 0) {
        return true;
      }
      this.cipher.encrypt(this._inBlock, this._outBlock);
      if (this._partialBytes === 0 && inputLength >= this.blockSize) {
        for (var i2 = 0; i2 < this._ints; ++i2) {
          output.putInt32(input.getInt32() ^ this._outBlock[i2]);
        }
      } else {
        var partialBytes = (this.blockSize - inputLength) % this.blockSize;
        if (partialBytes > 0) {
          partialBytes = this.blockSize - partialBytes;
        }
        this._partialOutput.clear();
        for (var i2 = 0; i2 < this._ints; ++i2) {
          this._partialOutput.putInt32(input.getInt32() ^ this._outBlock[i2]);
        }
        if (partialBytes > 0) {
          input.read -= this.blockSize;
        }
        if (this._partialBytes > 0) {
          this._partialOutput.getBytes(this._partialBytes);
        }
        if (partialBytes > 0 && !finish) {
          output.putBytes(this._partialOutput.getBytes(
            partialBytes - this._partialBytes
          ));
          this._partialBytes = partialBytes;
          return true;
        }
        output.putBytes(this._partialOutput.getBytes(
          inputLength - this._partialBytes
        ));
        this._partialBytes = 0;
      }
      inc32(this._inBlock);
    };
    modes.ctr.prototype.decrypt = modes.ctr.prototype.encrypt;
    modes.gcm = function(options) {
      options = options || {};
      this.name = "GCM";
      this.cipher = options.cipher;
      this.blockSize = options.blockSize || 16;
      this._ints = this.blockSize / 4;
      this._inBlock = new Array(this._ints);
      this._outBlock = new Array(this._ints);
      this._partialOutput = forge.util.createBuffer();
      this._partialBytes = 0;
      this._R = 3774873600;
    };
    modes.gcm.prototype.start = function(options) {
      if (!("iv" in options)) {
        throw new Error("Invalid IV parameter.");
      }
      var iv = forge.util.createBuffer(options.iv);
      this._cipherLength = 0;
      var additionalData;
      if ("additionalData" in options) {
        additionalData = forge.util.createBuffer(options.additionalData);
      } else {
        additionalData = forge.util.createBuffer();
      }
      if ("tagLength" in options) {
        this._tagLength = options.tagLength;
      } else {
        this._tagLength = 128;
      }
      this._tag = null;
      if (options.decrypt) {
        this._tag = forge.util.createBuffer(options.tag).getBytes();
        if (this._tag.length !== this._tagLength / 8) {
          throw new Error("Authentication tag does not match tag length.");
        }
      }
      this._hashBlock = new Array(this._ints);
      this.tag = null;
      this._hashSubkey = new Array(this._ints);
      this.cipher.encrypt([0, 0, 0, 0], this._hashSubkey);
      this.componentBits = 4;
      this._m = this.generateHashTable(this._hashSubkey, this.componentBits);
      var ivLength = iv.length();
      if (ivLength === 12) {
        this._j0 = [iv.getInt32(), iv.getInt32(), iv.getInt32(), 1];
      } else {
        this._j0 = [0, 0, 0, 0];
        while (iv.length() > 0) {
          this._j0 = this.ghash(
            this._hashSubkey,
            this._j0,
            [iv.getInt32(), iv.getInt32(), iv.getInt32(), iv.getInt32()]
          );
        }
        this._j0 = this.ghash(
          this._hashSubkey,
          this._j0,
          [0, 0].concat(from64To32(ivLength * 8))
        );
      }
      this._inBlock = this._j0.slice(0);
      inc32(this._inBlock);
      this._partialBytes = 0;
      additionalData = forge.util.createBuffer(additionalData);
      this._aDataLength = from64To32(additionalData.length() * 8);
      var overflow = additionalData.length() % this.blockSize;
      if (overflow) {
        additionalData.fillWithByte(0, this.blockSize - overflow);
      }
      this._s = [0, 0, 0, 0];
      while (additionalData.length() > 0) {
        this._s = this.ghash(this._hashSubkey, this._s, [
          additionalData.getInt32(),
          additionalData.getInt32(),
          additionalData.getInt32(),
          additionalData.getInt32()
        ]);
      }
    };
    modes.gcm.prototype.encrypt = function(input, output, finish) {
      var inputLength = input.length();
      if (inputLength === 0) {
        return true;
      }
      this.cipher.encrypt(this._inBlock, this._outBlock);
      if (this._partialBytes === 0 && inputLength >= this.blockSize) {
        for (var i2 = 0; i2 < this._ints; ++i2) {
          output.putInt32(this._outBlock[i2] ^= input.getInt32());
        }
        this._cipherLength += this.blockSize;
      } else {
        var partialBytes = (this.blockSize - inputLength) % this.blockSize;
        if (partialBytes > 0) {
          partialBytes = this.blockSize - partialBytes;
        }
        this._partialOutput.clear();
        for (var i2 = 0; i2 < this._ints; ++i2) {
          this._partialOutput.putInt32(input.getInt32() ^ this._outBlock[i2]);
        }
        if (partialBytes <= 0 || finish) {
          if (finish) {
            var overflow = inputLength % this.blockSize;
            this._cipherLength += overflow;
            this._partialOutput.truncate(this.blockSize - overflow);
          } else {
            this._cipherLength += this.blockSize;
          }
          for (var i2 = 0; i2 < this._ints; ++i2) {
            this._outBlock[i2] = this._partialOutput.getInt32();
          }
          this._partialOutput.read -= this.blockSize;
        }
        if (this._partialBytes > 0) {
          this._partialOutput.getBytes(this._partialBytes);
        }
        if (partialBytes > 0 && !finish) {
          input.read -= this.blockSize;
          output.putBytes(this._partialOutput.getBytes(
            partialBytes - this._partialBytes
          ));
          this._partialBytes = partialBytes;
          return true;
        }
        output.putBytes(this._partialOutput.getBytes(
          inputLength - this._partialBytes
        ));
        this._partialBytes = 0;
      }
      this._s = this.ghash(this._hashSubkey, this._s, this._outBlock);
      inc32(this._inBlock);
    };
    modes.gcm.prototype.decrypt = function(input, output, finish) {
      var inputLength = input.length();
      if (inputLength < this.blockSize && !(finish && inputLength > 0)) {
        return true;
      }
      this.cipher.encrypt(this._inBlock, this._outBlock);
      inc32(this._inBlock);
      this._hashBlock[0] = input.getInt32();
      this._hashBlock[1] = input.getInt32();
      this._hashBlock[2] = input.getInt32();
      this._hashBlock[3] = input.getInt32();
      this._s = this.ghash(this._hashSubkey, this._s, this._hashBlock);
      for (var i2 = 0; i2 < this._ints; ++i2) {
        output.putInt32(this._outBlock[i2] ^ this._hashBlock[i2]);
      }
      if (inputLength < this.blockSize) {
        this._cipherLength += inputLength % this.blockSize;
      } else {
        this._cipherLength += this.blockSize;
      }
    };
    modes.gcm.prototype.afterFinish = function(output, options) {
      var rval = true;
      if (options.decrypt && options.overflow) {
        output.truncate(this.blockSize - options.overflow);
      }
      this.tag = forge.util.createBuffer();
      var lengths = this._aDataLength.concat(from64To32(this._cipherLength * 8));
      this._s = this.ghash(this._hashSubkey, this._s, lengths);
      var tag = [];
      this.cipher.encrypt(this._j0, tag);
      for (var i2 = 0; i2 < this._ints; ++i2) {
        this.tag.putInt32(this._s[i2] ^ tag[i2]);
      }
      this.tag.truncate(this.tag.length() % (this._tagLength / 8));
      if (options.decrypt && this.tag.bytes() !== this._tag) {
        rval = false;
      }
      return rval;
    };
    modes.gcm.prototype.multiply = function(x2, y2) {
      var z_i = [0, 0, 0, 0];
      var v_i = y2.slice(0);
      for (var i2 = 0; i2 < 128; ++i2) {
        var x_i = x2[i2 / 32 | 0] & 1 << 31 - i2 % 32;
        if (x_i) {
          z_i[0] ^= v_i[0];
          z_i[1] ^= v_i[1];
          z_i[2] ^= v_i[2];
          z_i[3] ^= v_i[3];
        }
        this.pow(v_i, v_i);
      }
      return z_i;
    };
    modes.gcm.prototype.pow = function(x2, out) {
      var lsb = x2[3] & 1;
      for (var i2 = 3; i2 > 0; --i2) {
        out[i2] = x2[i2] >>> 1 | (x2[i2 - 1] & 1) << 31;
      }
      out[0] = x2[0] >>> 1;
      if (lsb) {
        out[0] ^= this._R;
      }
    };
    modes.gcm.prototype.tableMultiply = function(x2) {
      var z2 = [0, 0, 0, 0];
      for (var i2 = 0; i2 < 32; ++i2) {
        var idx = i2 / 8 | 0;
        var x_i = x2[idx] >>> (7 - i2 % 8) * 4 & 15;
        var ah = this._m[i2][x_i];
        z2[0] ^= ah[0];
        z2[1] ^= ah[1];
        z2[2] ^= ah[2];
        z2[3] ^= ah[3];
      }
      return z2;
    };
    modes.gcm.prototype.ghash = function(h2, y2, x2) {
      y2[0] ^= x2[0];
      y2[1] ^= x2[1];
      y2[2] ^= x2[2];
      y2[3] ^= x2[3];
      return this.tableMultiply(y2);
    };
    modes.gcm.prototype.generateHashTable = function(h2, bits) {
      var multiplier = 8 / bits;
      var perInt = 4 * multiplier;
      var size = 16 * multiplier;
      var m2 = new Array(size);
      for (var i2 = 0; i2 < size; ++i2) {
        var tmp = [0, 0, 0, 0];
        var idx = i2 / perInt | 0;
        var shft = (perInt - 1 - i2 % perInt) * bits;
        tmp[idx] = 1 << bits - 1 << shft;
        m2[i2] = this.generateSubHashTable(this.multiply(tmp, h2), bits);
      }
      return m2;
    };
    modes.gcm.prototype.generateSubHashTable = function(mid, bits) {
      var size = 1 << bits;
      var half = size >>> 1;
      var m2 = new Array(size);
      m2[half] = mid.slice(0);
      var i2 = half >>> 1;
      while (i2 > 0) {
        this.pow(m2[2 * i2], m2[i2] = []);
        i2 >>= 1;
      }
      i2 = 2;
      while (i2 < half) {
        for (var j2 = 1; j2 < i2; ++j2) {
          var m_i = m2[i2];
          var m_j = m2[j2];
          m2[i2 + j2] = [
            m_i[0] ^ m_j[0],
            m_i[1] ^ m_j[1],
            m_i[2] ^ m_j[2],
            m_i[3] ^ m_j[3]
          ];
        }
        i2 *= 2;
      }
      m2[0] = [0, 0, 0, 0];
      for (i2 = half + 1; i2 < size; ++i2) {
        var c2 = m2[i2 ^ half];
        m2[i2] = [mid[0] ^ c2[0], mid[1] ^ c2[1], mid[2] ^ c2[2], mid[3] ^ c2[3]];
      }
      return m2;
    };
    function transformIV(iv, blockSize) {
      if (typeof iv === "string") {
        iv = forge.util.createBuffer(iv);
      }
      if (forge.util.isArray(iv) && iv.length > 4) {
        var tmp = iv;
        iv = forge.util.createBuffer();
        for (var i2 = 0; i2 < tmp.length; ++i2) {
          iv.putByte(tmp[i2]);
        }
      }
      if (iv.length() < blockSize) {
        throw new Error(
          "Invalid IV length; got " + iv.length() + " bytes and expected " + blockSize + " bytes."
        );
      }
      if (!forge.util.isArray(iv)) {
        var ints = [];
        var blocks = blockSize / 4;
        for (var i2 = 0; i2 < blocks; ++i2) {
          ints.push(iv.getInt32());
        }
        iv = ints;
      }
      return iv;
    }
    function inc32(block) {
      block[block.length - 1] = block[block.length - 1] + 1 & 4294967295;
    }
    function from64To32(num) {
      return [num / 4294967296 | 0, num & 4294967295];
    }
  }
});

// node_modules/node-forge/lib/aes.js
var require_aes = __commonJS({
  "node_modules/node-forge/lib/aes.js"(exports2, module2) {
    var forge = require_forge();
    require_cipher();
    require_cipherModes();
    require_util();
    module2.exports = forge.aes = forge.aes || {};
    forge.aes.startEncrypting = function(key, iv, output, mode) {
      var cipher = _createCipher({
        key,
        output,
        decrypt: false,
        mode
      });
      cipher.start(iv);
      return cipher;
    };
    forge.aes.createEncryptionCipher = function(key, mode) {
      return _createCipher({
        key,
        output: null,
        decrypt: false,
        mode
      });
    };
    forge.aes.startDecrypting = function(key, iv, output, mode) {
      var cipher = _createCipher({
        key,
        output,
        decrypt: true,
        mode
      });
      cipher.start(iv);
      return cipher;
    };
    forge.aes.createDecryptionCipher = function(key, mode) {
      return _createCipher({
        key,
        output: null,
        decrypt: true,
        mode
      });
    };
    forge.aes.Algorithm = function(name, mode) {
      if (!init) {
        initialize();
      }
      var self2 = this;
      self2.name = name;
      self2.mode = new mode({
        blockSize: 16,
        cipher: {
          encrypt: function(inBlock, outBlock) {
            return _updateBlock(self2._w, inBlock, outBlock, false);
          },
          decrypt: function(inBlock, outBlock) {
            return _updateBlock(self2._w, inBlock, outBlock, true);
          }
        }
      });
      self2._init = false;
    };
    forge.aes.Algorithm.prototype.initialize = function(options) {
      if (this._init) {
        return;
      }
      var key = options.key;
      var tmp;
      if (typeof key === "string" && (key.length === 16 || key.length === 24 || key.length === 32)) {
        key = forge.util.createBuffer(key);
      } else if (forge.util.isArray(key) && (key.length === 16 || key.length === 24 || key.length === 32)) {
        tmp = key;
        key = forge.util.createBuffer();
        for (var i2 = 0; i2 < tmp.length; ++i2) {
          key.putByte(tmp[i2]);
        }
      }
      if (!forge.util.isArray(key)) {
        tmp = key;
        key = [];
        var len = tmp.length();
        if (len === 16 || len === 24 || len === 32) {
          len = len >>> 2;
          for (var i2 = 0; i2 < len; ++i2) {
            key.push(tmp.getInt32());
          }
        }
      }
      if (!forge.util.isArray(key) || !(key.length === 4 || key.length === 6 || key.length === 8)) {
        throw new Error("Invalid key parameter.");
      }
      var mode = this.mode.name;
      var encryptOp = ["CFB", "OFB", "CTR", "GCM"].indexOf(mode) !== -1;
      this._w = _expandKey(key, options.decrypt && !encryptOp);
      this._init = true;
    };
    forge.aes._expandKey = function(key, decrypt) {
      if (!init) {
        initialize();
      }
      return _expandKey(key, decrypt);
    };
    forge.aes._updateBlock = _updateBlock;
    registerAlgorithm("AES-ECB", forge.cipher.modes.ecb);
    registerAlgorithm("AES-CBC", forge.cipher.modes.cbc);
    registerAlgorithm("AES-CFB", forge.cipher.modes.cfb);
    registerAlgorithm("AES-OFB", forge.cipher.modes.ofb);
    registerAlgorithm("AES-CTR", forge.cipher.modes.ctr);
    registerAlgorithm("AES-GCM", forge.cipher.modes.gcm);
    function registerAlgorithm(name, mode) {
      var factory = function() {
        return new forge.aes.Algorithm(name, mode);
      };
      forge.cipher.registerAlgorithm(name, factory);
    }
    var init = false;
    var Nb = 4;
    var sbox;
    var isbox;
    var rcon;
    var mix;
    var imix;
    function initialize() {
      init = true;
      rcon = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54];
      var xtime = new Array(256);
      for (var i2 = 0; i2 < 128; ++i2) {
        xtime[i2] = i2 << 1;
        xtime[i2 + 128] = i2 + 128 << 1 ^ 283;
      }
      sbox = new Array(256);
      isbox = new Array(256);
      mix = new Array(4);
      imix = new Array(4);
      for (var i2 = 0; i2 < 4; ++i2) {
        mix[i2] = new Array(256);
        imix[i2] = new Array(256);
      }
      var e2 = 0, ei = 0, e22, e4, e8, sx, sx2, me2, ime;
      for (var i2 = 0; i2 < 256; ++i2) {
        sx = ei ^ ei << 1 ^ ei << 2 ^ ei << 3 ^ ei << 4;
        sx = sx >> 8 ^ sx & 255 ^ 99;
        sbox[e2] = sx;
        isbox[sx] = e2;
        sx2 = xtime[sx];
        e22 = xtime[e2];
        e4 = xtime[e22];
        e8 = xtime[e4];
        me2 = sx2 << 24 ^ // 2
        sx << 16 ^ // 1
        sx << 8 ^ // 1
        (sx ^ sx2);
        ime = (e22 ^ e4 ^ e8) << 24 ^ // E (14)
        (e2 ^ e8) << 16 ^ // 9
        (e2 ^ e4 ^ e8) << 8 ^ // D (13)
        (e2 ^ e22 ^ e8);
        for (var n2 = 0; n2 < 4; ++n2) {
          mix[n2][e2] = me2;
          imix[n2][sx] = ime;
          me2 = me2 << 24 | me2 >>> 8;
          ime = ime << 24 | ime >>> 8;
        }
        if (e2 === 0) {
          e2 = ei = 1;
        } else {
          e2 = e22 ^ xtime[xtime[xtime[e22 ^ e8]]];
          ei ^= xtime[xtime[ei]];
        }
      }
    }
    function _expandKey(key, decrypt) {
      var w2 = key.slice(0);
      var temp, iNk = 1;
      var Nk = w2.length;
      var Nr1 = Nk + 6 + 1;
      var end = Nb * Nr1;
      for (var i2 = Nk; i2 < end; ++i2) {
        temp = w2[i2 - 1];
        if (i2 % Nk === 0) {
          temp = sbox[temp >>> 16 & 255] << 24 ^ sbox[temp >>> 8 & 255] << 16 ^ sbox[temp & 255] << 8 ^ sbox[temp >>> 24] ^ rcon[iNk] << 24;
          iNk++;
        } else if (Nk > 6 && i2 % Nk === 4) {
          temp = sbox[temp >>> 24] << 24 ^ sbox[temp >>> 16 & 255] << 16 ^ sbox[temp >>> 8 & 255] << 8 ^ sbox[temp & 255];
        }
        w2[i2] = w2[i2 - Nk] ^ temp;
      }
      if (decrypt) {
        var tmp;
        var m0 = imix[0];
        var m1 = imix[1];
        var m2 = imix[2];
        var m3 = imix[3];
        var wnew = w2.slice(0);
        end = w2.length;
        for (var i2 = 0, wi = end - Nb; i2 < end; i2 += Nb, wi -= Nb) {
          if (i2 === 0 || i2 === end - Nb) {
            wnew[i2] = w2[wi];
            wnew[i2 + 1] = w2[wi + 3];
            wnew[i2 + 2] = w2[wi + 2];
            wnew[i2 + 3] = w2[wi + 1];
          } else {
            for (var n2 = 0; n2 < Nb; ++n2) {
              tmp = w2[wi + n2];
              wnew[i2 + (3 & -n2)] = m0[sbox[tmp >>> 24]] ^ m1[sbox[tmp >>> 16 & 255]] ^ m2[sbox[tmp >>> 8 & 255]] ^ m3[sbox[tmp & 255]];
            }
          }
        }
        w2 = wnew;
      }
      return w2;
    }
    function _updateBlock(w2, input, output, decrypt) {
      var Nr = w2.length / 4 - 1;
      var m0, m1, m2, m3, sub;
      if (decrypt) {
        m0 = imix[0];
        m1 = imix[1];
        m2 = imix[2];
        m3 = imix[3];
        sub = isbox;
      } else {
        m0 = mix[0];
        m1 = mix[1];
        m2 = mix[2];
        m3 = mix[3];
        sub = sbox;
      }
      var a2, b2, c2, d2, a22, b22, c22;
      a2 = input[0] ^ w2[0];
      b2 = input[decrypt ? 3 : 1] ^ w2[1];
      c2 = input[2] ^ w2[2];
      d2 = input[decrypt ? 1 : 3] ^ w2[3];
      var i2 = 3;
      for (var round = 1; round < Nr; ++round) {
        a22 = m0[a2 >>> 24] ^ m1[b2 >>> 16 & 255] ^ m2[c2 >>> 8 & 255] ^ m3[d2 & 255] ^ w2[++i2];
        b22 = m0[b2 >>> 24] ^ m1[c2 >>> 16 & 255] ^ m2[d2 >>> 8 & 255] ^ m3[a2 & 255] ^ w2[++i2];
        c22 = m0[c2 >>> 24] ^ m1[d2 >>> 16 & 255] ^ m2[a2 >>> 8 & 255] ^ m3[b2 & 255] ^ w2[++i2];
        d2 = m0[d2 >>> 24] ^ m1[a2 >>> 16 & 255] ^ m2[b2 >>> 8 & 255] ^ m3[c2 & 255] ^ w2[++i2];
        a2 = a22;
        b2 = b22;
        c2 = c22;
      }
      output[0] = sub[a2 >>> 24] << 24 ^ sub[b2 >>> 16 & 255] << 16 ^ sub[c2 >>> 8 & 255] << 8 ^ sub[d2 & 255] ^ w2[++i2];
      output[decrypt ? 3 : 1] = sub[b2 >>> 24] << 24 ^ sub[c2 >>> 16 & 255] << 16 ^ sub[d2 >>> 8 & 255] << 8 ^ sub[a2 & 255] ^ w2[++i2];
      output[2] = sub[c2 >>> 24] << 24 ^ sub[d2 >>> 16 & 255] << 16 ^ sub[a2 >>> 8 & 255] << 8 ^ sub[b2 & 255] ^ w2[++i2];
      output[decrypt ? 1 : 3] = sub[d2 >>> 24] << 24 ^ sub[a2 >>> 16 & 255] << 16 ^ sub[b2 >>> 8 & 255] << 8 ^ sub[c2 & 255] ^ w2[++i2];
    }
    function _createCipher(options) {
      options = options || {};
      var mode = (options.mode || "CBC").toUpperCase();
      var algorithm = "AES-" + mode;
      var cipher;
      if (options.decrypt) {
        cipher = forge.cipher.createDecipher(algorithm, options.key);
      } else {
        cipher = forge.cipher.createCipher(algorithm, options.key);
      }
      var start = cipher.start;
      cipher.start = function(iv, options2) {
        var output = null;
        if (options2 instanceof forge.util.ByteBuffer) {
          output = options2;
          options2 = {};
        }
        options2 = options2 || {};
        options2.output = output;
        options2.iv = iv;
        start.call(cipher, options2);
      };
      return cipher;
    }
  }
});

// node_modules/node-forge/lib/oids.js
var require_oids = __commonJS({
  "node_modules/node-forge/lib/oids.js"(exports2, module2) {
    var forge = require_forge();
    forge.pki = forge.pki || {};
    var oids = module2.exports = forge.pki.oids = forge.oids = forge.oids || {};
    function _IN(id, name) {
      oids[id] = name;
      oids[name] = id;
    }
    function _I_(id, name) {
      oids[id] = name;
    }
    _IN("1.2.840.113549.1.1.1", "rsaEncryption");
    _IN("1.2.840.113549.1.1.4", "md5WithRSAEncryption");
    _IN("1.2.840.113549.1.1.5", "sha1WithRSAEncryption");
    _IN("1.2.840.113549.1.1.7", "RSAES-OAEP");
    _IN("1.2.840.113549.1.1.8", "mgf1");
    _IN("1.2.840.113549.1.1.9", "pSpecified");
    _IN("1.2.840.113549.1.1.10", "RSASSA-PSS");
    _IN("1.2.840.113549.1.1.11", "sha256WithRSAEncryption");
    _IN("1.2.840.113549.1.1.12", "sha384WithRSAEncryption");
    _IN("1.2.840.113549.1.1.13", "sha512WithRSAEncryption");
    _IN("1.3.101.112", "EdDSA25519");
    _IN("1.2.840.10040.4.3", "dsa-with-sha1");
    _IN("1.3.14.3.2.7", "desCBC");
    _IN("1.3.14.3.2.26", "sha1");
    _IN("1.3.14.3.2.29", "sha1WithRSASignature");
    _IN("2.16.840.1.101.3.4.2.1", "sha256");
    _IN("2.16.840.1.101.3.4.2.2", "sha384");
    _IN("2.16.840.1.101.3.4.2.3", "sha512");
    _IN("2.16.840.1.101.3.4.2.4", "sha224");
    _IN("2.16.840.1.101.3.4.2.5", "sha512-224");
    _IN("2.16.840.1.101.3.4.2.6", "sha512-256");
    _IN("1.2.840.113549.2.2", "md2");
    _IN("1.2.840.113549.2.5", "md5");
    _IN("1.2.840.113549.1.7.1", "data");
    _IN("1.2.840.113549.1.7.2", "signedData");
    _IN("1.2.840.113549.1.7.3", "envelopedData");
    _IN("1.2.840.113549.1.7.4", "signedAndEnvelopedData");
    _IN("1.2.840.113549.1.7.5", "digestedData");
    _IN("1.2.840.113549.1.7.6", "encryptedData");
    _IN("1.2.840.113549.1.9.1", "emailAddress");
    _IN("1.2.840.113549.1.9.2", "unstructuredName");
    _IN("1.2.840.113549.1.9.3", "contentType");
    _IN("1.2.840.113549.1.9.4", "messageDigest");
    _IN("1.2.840.113549.1.9.5", "signingTime");
    _IN("1.2.840.113549.1.9.6", "counterSignature");
    _IN("1.2.840.113549.1.9.7", "challengePassword");
    _IN("1.2.840.113549.1.9.8", "unstructuredAddress");
    _IN("1.2.840.113549.1.9.14", "extensionRequest");
    _IN("1.2.840.113549.1.9.20", "friendlyName");
    _IN("1.2.840.113549.1.9.21", "localKeyId");
    _IN("1.2.840.113549.1.9.22.1", "x509Certificate");
    _IN("1.2.840.113549.1.12.10.1.1", "keyBag");
    _IN("1.2.840.113549.1.12.10.1.2", "pkcs8ShroudedKeyBag");
    _IN("1.2.840.113549.1.12.10.1.3", "certBag");
    _IN("1.2.840.113549.1.12.10.1.4", "crlBag");
    _IN("1.2.840.113549.1.12.10.1.5", "secretBag");
    _IN("1.2.840.113549.1.12.10.1.6", "safeContentsBag");
    _IN("1.2.840.113549.1.5.13", "pkcs5PBES2");
    _IN("1.2.840.113549.1.5.12", "pkcs5PBKDF2");
    _IN("1.2.840.113549.1.12.1.1", "pbeWithSHAAnd128BitRC4");
    _IN("1.2.840.113549.1.12.1.2", "pbeWithSHAAnd40BitRC4");
    _IN("1.2.840.113549.1.12.1.3", "pbeWithSHAAnd3-KeyTripleDES-CBC");
    _IN("1.2.840.113549.1.12.1.4", "pbeWithSHAAnd2-KeyTripleDES-CBC");
    _IN("1.2.840.113549.1.12.1.5", "pbeWithSHAAnd128BitRC2-CBC");
    _IN("1.2.840.113549.1.12.1.6", "pbewithSHAAnd40BitRC2-CBC");
    _IN("1.2.840.113549.2.7", "hmacWithSHA1");
    _IN("1.2.840.113549.2.8", "hmacWithSHA224");
    _IN("1.2.840.113549.2.9", "hmacWithSHA256");
    _IN("1.2.840.113549.2.10", "hmacWithSHA384");
    _IN("1.2.840.113549.2.11", "hmacWithSHA512");
    _IN("1.2.840.113549.3.7", "des-EDE3-CBC");
    _IN("2.16.840.1.101.3.4.1.2", "aes128-CBC");
    _IN("2.16.840.1.101.3.4.1.22", "aes192-CBC");
    _IN("2.16.840.1.101.3.4.1.42", "aes256-CBC");
    _IN("2.5.4.3", "commonName");
    _IN("2.5.4.4", "surname");
    _IN("2.5.4.5", "serialNumber");
    _IN("2.5.4.6", "countryName");
    _IN("2.5.4.7", "localityName");
    _IN("2.5.4.8", "stateOrProvinceName");
    _IN("2.5.4.9", "streetAddress");
    _IN("2.5.4.10", "organizationName");
    _IN("2.5.4.11", "organizationalUnitName");
    _IN("2.5.4.12", "title");
    _IN("2.5.4.13", "description");
    _IN("2.5.4.15", "businessCategory");
    _IN("2.5.4.17", "postalCode");
    _IN("2.5.4.42", "givenName");
    _IN("2.5.4.65", "pseudonym");
    _IN("1.3.6.1.4.1.311.60.2.1.2", "jurisdictionOfIncorporationStateOrProvinceName");
    _IN("1.3.6.1.4.1.311.60.2.1.3", "jurisdictionOfIncorporationCountryName");
    _IN("2.16.840.1.113730.1.1", "nsCertType");
    _IN("2.16.840.1.113730.1.13", "nsComment");
    _I_("2.5.29.1", "authorityKeyIdentifier");
    _I_("2.5.29.2", "keyAttributes");
    _I_("2.5.29.3", "certificatePolicies");
    _I_("2.5.29.4", "keyUsageRestriction");
    _I_("2.5.29.5", "policyMapping");
    _I_("2.5.29.6", "subtreesConstraint");
    _I_("2.5.29.7", "subjectAltName");
    _I_("2.5.29.8", "issuerAltName");
    _I_("2.5.29.9", "subjectDirectoryAttributes");
    _I_("2.5.29.10", "basicConstraints");
    _I_("2.5.29.11", "nameConstraints");
    _I_("2.5.29.12", "policyConstraints");
    _I_("2.5.29.13", "basicConstraints");
    _IN("2.5.29.14", "subjectKeyIdentifier");
    _IN("2.5.29.15", "keyUsage");
    _I_("2.5.29.16", "privateKeyUsagePeriod");
    _IN("2.5.29.17", "subjectAltName");
    _IN("2.5.29.18", "issuerAltName");
    _IN("2.5.29.19", "basicConstraints");
    _I_("2.5.29.20", "cRLNumber");
    _I_("2.5.29.21", "cRLReason");
    _I_("2.5.29.22", "expirationDate");
    _I_("2.5.29.23", "instructionCode");
    _I_("2.5.29.24", "invalidityDate");
    _I_("2.5.29.25", "cRLDistributionPoints");
    _I_("2.5.29.26", "issuingDistributionPoint");
    _I_("2.5.29.27", "deltaCRLIndicator");
    _I_("2.5.29.28", "issuingDistributionPoint");
    _I_("2.5.29.29", "certificateIssuer");
    _I_("2.5.29.30", "nameConstraints");
    _IN("2.5.29.31", "cRLDistributionPoints");
    _IN("2.5.29.32", "certificatePolicies");
    _I_("2.5.29.33", "policyMappings");
    _I_("2.5.29.34", "policyConstraints");
    _IN("2.5.29.35", "authorityKeyIdentifier");
    _I_("2.5.29.36", "policyConstraints");
    _IN("2.5.29.37", "extKeyUsage");
    _I_("2.5.29.46", "freshestCRL");
    _I_("2.5.29.54", "inhibitAnyPolicy");
    _IN("1.3.6.1.4.1.11129.2.4.2", "timestampList");
    _IN("1.3.6.1.5.5.7.1.1", "authorityInfoAccess");
    _IN("1.3.6.1.5.5.7.3.1", "serverAuth");
    _IN("1.3.6.1.5.5.7.3.2", "clientAuth");
    _IN("1.3.6.1.5.5.7.3.3", "codeSigning");
    _IN("1.3.6.1.5.5.7.3.4", "emailProtection");
    _IN("1.3.6.1.5.5.7.3.8", "timeStamping");
  }
});

// node_modules/node-forge/lib/asn1.js
var require_asn1 = __commonJS({
  "node_modules/node-forge/lib/asn1.js"(exports2, module2) {
    var forge = require_forge();
    require_util();
    require_oids();
    var asn1 = module2.exports = forge.asn1 = forge.asn1 || {};
    asn1.Class = {
      UNIVERSAL: 0,
      APPLICATION: 64,
      CONTEXT_SPECIFIC: 128,
      PRIVATE: 192
    };
    asn1.Type = {
      NONE: 0,
      BOOLEAN: 1,
      INTEGER: 2,
      BITSTRING: 3,
      OCTETSTRING: 4,
      NULL: 5,
      OID: 6,
      ODESC: 7,
      EXTERNAL: 8,
      REAL: 9,
      ENUMERATED: 10,
      EMBEDDED: 11,
      UTF8: 12,
      ROID: 13,
      SEQUENCE: 16,
      SET: 17,
      PRINTABLESTRING: 19,
      IA5STRING: 22,
      UTCTIME: 23,
      GENERALIZEDTIME: 24,
      BMPSTRING: 30
    };
    asn1.maxDepth = 256;
    asn1.create = function(tagClass, type, constructed, value, options) {
      if (forge.util.isArray(value)) {
        var tmp = [];
        for (var i2 = 0; i2 < value.length; ++i2) {
          if (value[i2] !== void 0) {
            tmp.push(value[i2]);
          }
        }
        value = tmp;
      }
      var obj = {
        tagClass,
        type,
        constructed,
        composed: constructed || forge.util.isArray(value),
        value
      };
      if (options && "bitStringContents" in options) {
        obj.bitStringContents = options.bitStringContents;
        obj.original = asn1.copy(obj);
      }
      return obj;
    };
    asn1.copy = function(obj, options) {
      var copy;
      if (forge.util.isArray(obj)) {
        copy = [];
        for (var i2 = 0; i2 < obj.length; ++i2) {
          copy.push(asn1.copy(obj[i2], options));
        }
        return copy;
      }
      if (typeof obj === "string") {
        return obj;
      }
      copy = {
        tagClass: obj.tagClass,
        type: obj.type,
        constructed: obj.constructed,
        composed: obj.composed,
        value: asn1.copy(obj.value, options)
      };
      if (options && !options.excludeBitStringContents) {
        copy.bitStringContents = obj.bitStringContents;
      }
      return copy;
    };
    asn1.equals = function(obj1, obj2, options) {
      if (forge.util.isArray(obj1)) {
        if (!forge.util.isArray(obj2)) {
          return false;
        }
        if (obj1.length !== obj2.length) {
          return false;
        }
        for (var i2 = 0; i2 < obj1.length; ++i2) {
          if (!asn1.equals(obj1[i2], obj2[i2])) {
            return false;
          }
        }
        return true;
      }
      if (typeof obj1 !== typeof obj2) {
        return false;
      }
      if (typeof obj1 === "string") {
        return obj1 === obj2;
      }
      var equal = obj1.tagClass === obj2.tagClass && obj1.type === obj2.type && obj1.constructed === obj2.constructed && obj1.composed === obj2.composed && asn1.equals(obj1.value, obj2.value);
      if (options && options.includeBitStringContents) {
        equal = equal && obj1.bitStringContents === obj2.bitStringContents;
      }
      return equal;
    };
    asn1.getBerValueLength = function(b2) {
      var b22 = b2.getByte();
      if (b22 === 128) {
        return void 0;
      }
      var length;
      var longForm = b22 & 128;
      if (!longForm) {
        length = b22;
      } else {
        length = b2.getInt((b22 & 127) << 3);
      }
      return length;
    };
    function _checkBufferLength(bytes, remaining, n2) {
      if (n2 > remaining) {
        var error = new Error("Too few bytes to parse DER.");
        error.available = bytes.length();
        error.remaining = remaining;
        error.requested = n2;
        throw error;
      }
    }
    var _getValueLength = function(bytes, remaining) {
      var b2 = bytes.getByte();
      remaining--;
      if (b2 === 128) {
        return void 0;
      }
      var length;
      var longForm = b2 & 128;
      if (!longForm) {
        length = b2;
      } else {
        var longFormBytes = b2 & 127;
        _checkBufferLength(bytes, remaining, longFormBytes);
        length = bytes.getInt(longFormBytes << 3);
      }
      if (length < 0) {
        throw new Error("Negative length: " + length);
      }
      return length;
    };
    asn1.fromDer = function(bytes, options) {
      if (options === void 0) {
        options = {
          strict: true,
          parseAllBytes: true,
          decodeBitStrings: true
        };
      }
      if (typeof options === "boolean") {
        options = {
          strict: options,
          parseAllBytes: true,
          decodeBitStrings: true
        };
      }
      if (!("strict" in options)) {
        options.strict = true;
      }
      if (!("parseAllBytes" in options)) {
        options.parseAllBytes = true;
      }
      if (!("decodeBitStrings" in options)) {
        options.decodeBitStrings = true;
      }
      if (!("maxDepth" in options)) {
        options.maxDepth = asn1.maxDepth;
      }
      if (typeof bytes === "string") {
        bytes = forge.util.createBuffer(bytes);
      }
      var byteCount = bytes.length();
      var value = _fromDer(bytes, bytes.length(), 0, options);
      if (options.parseAllBytes && bytes.length() !== 0) {
        var error = new Error("Unparsed DER bytes remain after ASN.1 parsing.");
        error.byteCount = byteCount;
        error.remaining = bytes.length();
        throw error;
      }
      return value;
    };
    function _fromDer(bytes, remaining, depth, options) {
      if (depth >= options.maxDepth) {
        throw new Error("ASN.1 parsing error: Max depth exceeded.");
      }
      var start;
      _checkBufferLength(bytes, remaining, 2);
      var b1 = bytes.getByte();
      remaining--;
      var tagClass = b1 & 192;
      var type = b1 & 31;
      start = bytes.length();
      var length = _getValueLength(bytes, remaining);
      remaining -= start - bytes.length();
      if (length !== void 0 && length > remaining) {
        if (options.strict) {
          var error = new Error("Too few bytes to read ASN.1 value.");
          error.available = bytes.length();
          error.remaining = remaining;
          error.requested = length;
          throw error;
        }
        length = remaining;
      }
      var value;
      var bitStringContents;
      var constructed = (b1 & 32) === 32;
      if (constructed) {
        value = [];
        if (length === void 0) {
          for (; ; ) {
            _checkBufferLength(bytes, remaining, 2);
            if (bytes.bytes(2) === String.fromCharCode(0, 0)) {
              bytes.getBytes(2);
              remaining -= 2;
              break;
            }
            start = bytes.length();
            value.push(_fromDer(bytes, remaining, depth + 1, options));
            remaining -= start - bytes.length();
          }
        } else {
          while (length > 0) {
            start = bytes.length();
            value.push(_fromDer(bytes, length, depth + 1, options));
            remaining -= start - bytes.length();
            length -= start - bytes.length();
          }
        }
      }
      if (value === void 0 && tagClass === asn1.Class.UNIVERSAL && type === asn1.Type.BITSTRING) {
        bitStringContents = bytes.bytes(length);
      }
      if (value === void 0 && options.decodeBitStrings && tagClass === asn1.Class.UNIVERSAL && // FIXME: OCTET STRINGs not yet supported here
      // .. other parts of forge expect to decode OCTET STRINGs manually
      type === asn1.Type.BITSTRING && length > 1) {
        var savedRead = bytes.read;
        var savedRemaining = remaining;
        var unused = 0;
        if (type === asn1.Type.BITSTRING) {
          _checkBufferLength(bytes, remaining, 1);
          unused = bytes.getByte();
          remaining--;
        }
        if (unused === 0) {
          try {
            start = bytes.length();
            var subOptions = {
              // enforce strict mode to avoid parsing ASN.1 from plain data
              strict: true,
              decodeBitStrings: true
            };
            var composed = _fromDer(bytes, remaining, depth + 1, subOptions);
            var used = start - bytes.length();
            remaining -= used;
            if (type == asn1.Type.BITSTRING) {
              used++;
            }
            var tc = composed.tagClass;
            if (used === length && (tc === asn1.Class.UNIVERSAL || tc === asn1.Class.CONTEXT_SPECIFIC)) {
              value = [composed];
            }
          } catch (ex) {
          }
        }
        if (value === void 0) {
          bytes.read = savedRead;
          remaining = savedRemaining;
        }
      }
      if (value === void 0) {
        if (length === void 0) {
          if (options.strict) {
            throw new Error("Non-constructed ASN.1 object of indefinite length.");
          }
          length = remaining;
        }
        if (type === asn1.Type.BMPSTRING) {
          value = "";
          for (; length > 0; length -= 2) {
            _checkBufferLength(bytes, remaining, 2);
            value += String.fromCharCode(bytes.getInt16());
            remaining -= 2;
          }
        } else {
          value = bytes.getBytes(length);
          remaining -= length;
        }
      }
      var asn1Options = bitStringContents === void 0 ? null : {
        bitStringContents
      };
      return asn1.create(tagClass, type, constructed, value, asn1Options);
    }
    asn1.toDer = function(obj) {
      var bytes = forge.util.createBuffer();
      var b1 = obj.tagClass | obj.type;
      var value = forge.util.createBuffer();
      var useBitStringContents = false;
      if ("bitStringContents" in obj) {
        useBitStringContents = true;
        if (obj.original) {
          useBitStringContents = asn1.equals(obj, obj.original);
        }
      }
      if (useBitStringContents) {
        value.putBytes(obj.bitStringContents);
      } else if (obj.composed) {
        if (obj.constructed) {
          b1 |= 32;
        } else {
          value.putByte(0);
        }
        for (var i2 = 0; i2 < obj.value.length; ++i2) {
          if (obj.value[i2] !== void 0) {
            value.putBuffer(asn1.toDer(obj.value[i2]));
          }
        }
      } else {
        if (obj.type === asn1.Type.BMPSTRING) {
          for (var i2 = 0; i2 < obj.value.length; ++i2) {
            value.putInt16(obj.value.charCodeAt(i2));
          }
        } else {
          if (obj.type === asn1.Type.INTEGER && obj.value.length > 1 && // leading 0x00 for positive integer
          (obj.value.charCodeAt(0) === 0 && (obj.value.charCodeAt(1) & 128) === 0 || // leading 0xFF for negative integer
          obj.value.charCodeAt(0) === 255 && (obj.value.charCodeAt(1) & 128) === 128)) {
            value.putBytes(obj.value.substr(1));
          } else {
            value.putBytes(obj.value);
          }
        }
      }
      bytes.putByte(b1);
      if (value.length() <= 127) {
        bytes.putByte(value.length() & 127);
      } else {
        var len = value.length();
        var lenBytes = "";
        do {
          lenBytes += String.fromCharCode(len & 255);
          len = len >>> 8;
        } while (len > 0);
        bytes.putByte(lenBytes.length | 128);
        for (var i2 = lenBytes.length - 1; i2 >= 0; --i2) {
          bytes.putByte(lenBytes.charCodeAt(i2));
        }
      }
      bytes.putBuffer(value);
      return bytes;
    };
    asn1.oidToDer = function(oid) {
      var values = oid.split(".");
      var bytes = forge.util.createBuffer();
      bytes.putByte(40 * parseInt(values[0], 10) + parseInt(values[1], 10));
      var last, valueBytes, value, b2;
      for (var i2 = 2; i2 < values.length; ++i2) {
        last = true;
        valueBytes = [];
        value = parseInt(values[i2], 10);
        if (value > 4294967295) {
          throw new Error("OID value too large; max is 32-bits.");
        }
        do {
          b2 = value & 127;
          value = value >>> 7;
          if (!last) {
            b2 |= 128;
          }
          valueBytes.push(b2);
          last = false;
        } while (value > 0);
        for (var n2 = valueBytes.length - 1; n2 >= 0; --n2) {
          bytes.putByte(valueBytes[n2]);
        }
      }
      return bytes;
    };
    asn1.derToOid = function(bytes) {
      var oid;
      if (typeof bytes === "string") {
        bytes = forge.util.createBuffer(bytes);
      }
      var b2 = bytes.getByte();
      oid = Math.floor(b2 / 40) + "." + b2 % 40;
      var value = 0;
      while (bytes.length() > 0) {
        if (value > 70368744177663) {
          throw new Error("OID value too large; max is 53-bits.");
        }
        b2 = bytes.getByte();
        value = value * 128;
        if (b2 & 128) {
          value += b2 & 127;
        } else {
          oid += "." + (value + b2);
          value = 0;
        }
      }
      return oid;
    };
    asn1.utcTimeToDate = function(utc) {
      var date = /* @__PURE__ */ new Date();
      var year = parseInt(utc.substr(0, 2), 10);
      year = year >= 50 ? 1900 + year : 2e3 + year;
      var MM = parseInt(utc.substr(2, 2), 10) - 1;
      var DD = parseInt(utc.substr(4, 2), 10);
      var hh = parseInt(utc.substr(6, 2), 10);
      var mm = parseInt(utc.substr(8, 2), 10);
      var ss2 = 0;
      if (utc.length > 11) {
        var c2 = utc.charAt(10);
        var end = 10;
        if (c2 !== "+" && c2 !== "-") {
          ss2 = parseInt(utc.substr(10, 2), 10);
          end += 2;
        }
      }
      date.setUTCFullYear(year, MM, DD);
      date.setUTCHours(hh, mm, ss2, 0);
      if (end) {
        c2 = utc.charAt(end);
        if (c2 === "+" || c2 === "-") {
          var hhoffset = parseInt(utc.substr(end + 1, 2), 10);
          var mmoffset = parseInt(utc.substr(end + 4, 2), 10);
          var offset = hhoffset * 60 + mmoffset;
          offset *= 6e4;
          if (c2 === "+") {
            date.setTime(+date - offset);
          } else {
            date.setTime(+date + offset);
          }
        }
      }
      return date;
    };
    asn1.generalizedTimeToDate = function(gentime) {
      var date = /* @__PURE__ */ new Date();
      var YYYY = parseInt(gentime.substr(0, 4), 10);
      var MM = parseInt(gentime.substr(4, 2), 10) - 1;
      var DD = parseInt(gentime.substr(6, 2), 10);
      var hh = parseInt(gentime.substr(8, 2), 10);
      var mm = parseInt(gentime.substr(10, 2), 10);
      var ss2 = parseInt(gentime.substr(12, 2), 10);
      var fff = 0;
      var offset = 0;
      var isUTC = false;
      if (gentime.charAt(gentime.length - 1) === "Z") {
        isUTC = true;
      }
      var end = gentime.length - 5, c2 = gentime.charAt(end);
      if (c2 === "+" || c2 === "-") {
        var hhoffset = parseInt(gentime.substr(end + 1, 2), 10);
        var mmoffset = parseInt(gentime.substr(end + 4, 2), 10);
        offset = hhoffset * 60 + mmoffset;
        offset *= 6e4;
        if (c2 === "+") {
          offset *= -1;
        }
        isUTC = true;
      }
      if (gentime.charAt(14) === ".") {
        fff = parseFloat(gentime.substr(14), 10) * 1e3;
      }
      if (isUTC) {
        date.setUTCFullYear(YYYY, MM, DD);
        date.setUTCHours(hh, mm, ss2, fff);
        date.setTime(+date + offset);
      } else {
        date.setFullYear(YYYY, MM, DD);
        date.setHours(hh, mm, ss2, fff);
      }
      return date;
    };
    asn1.dateToUtcTime = function(date) {
      if (typeof date === "string") {
        return date;
      }
      var rval = "";
      var format = [];
      format.push(("" + date.getUTCFullYear()).substr(2));
      format.push("" + (date.getUTCMonth() + 1));
      format.push("" + date.getUTCDate());
      format.push("" + date.getUTCHours());
      format.push("" + date.getUTCMinutes());
      format.push("" + date.getUTCSeconds());
      for (var i2 = 0; i2 < format.length; ++i2) {
        if (format[i2].length < 2) {
          rval += "0";
        }
        rval += format[i2];
      }
      rval += "Z";
      return rval;
    };
    asn1.dateToGeneralizedTime = function(date) {
      if (typeof date === "string") {
        return date;
      }
      var rval = "";
      var format = [];
      format.push("" + date.getUTCFullYear());
      format.push("" + (date.getUTCMonth() + 1));
      format.push("" + date.getUTCDate());
      format.push("" + date.getUTCHours());
      format.push("" + date.getUTCMinutes());
      format.push("" + date.getUTCSeconds());
      for (var i2 = 0; i2 < format.length; ++i2) {
        if (format[i2].length < 2) {
          rval += "0";
        }
        rval += format[i2];
      }
      rval += "Z";
      return rval;
    };
    asn1.integerToDer = function(x2) {
      var rval = forge.util.createBuffer();
      if (x2 >= -128 && x2 < 128) {
        return rval.putSignedInt(x2, 8);
      }
      if (x2 >= -32768 && x2 < 32768) {
        return rval.putSignedInt(x2, 16);
      }
      if (x2 >= -8388608 && x2 < 8388608) {
        return rval.putSignedInt(x2, 24);
      }
      if (x2 >= -2147483648 && x2 < 2147483648) {
        return rval.putSignedInt(x2, 32);
      }
      var error = new Error("Integer too large; max is 32-bits.");
      error.integer = x2;
      throw error;
    };
    asn1.derToInteger = function(bytes) {
      if (typeof bytes === "string") {
        bytes = forge.util.createBuffer(bytes);
      }
      var n2 = bytes.length() * 8;
      if (n2 > 32) {
        throw new Error("Integer too large; max is 32-bits.");
      }
      return bytes.getSignedInt(n2);
    };
    asn1.validate = function(obj, v2, capture, errors) {
      var rval = false;
      if ((obj.tagClass === v2.tagClass || typeof v2.tagClass === "undefined") && (obj.type === v2.type || typeof v2.type === "undefined")) {
        if (obj.constructed === v2.constructed || typeof v2.constructed === "undefined") {
          rval = true;
          if (v2.value && forge.util.isArray(v2.value)) {
            var j2 = 0;
            for (var i2 = 0; rval && i2 < v2.value.length; ++i2) {
              var schemaItem = v2.value[i2];
              rval = !!schemaItem.optional;
              var objChild = obj.value[j2];
              if (!objChild) {
                if (!schemaItem.optional) {
                  rval = false;
                  if (errors) {
                    errors.push("[" + v2.name + '] Missing required element. Expected tag class "' + schemaItem.tagClass + '", type "' + schemaItem.type + '"');
                  }
                }
                continue;
              }
              var schemaHasTag = typeof schemaItem.tagClass !== "undefined" && typeof schemaItem.type !== "undefined";
              if (schemaHasTag && (objChild.tagClass !== schemaItem.tagClass || objChild.type !== schemaItem.type)) {
                if (schemaItem.optional) {
                  rval = true;
                  continue;
                } else {
                  rval = false;
                  if (errors) {
                    errors.push("[" + v2.name + "] Tag mismatch. Expected (" + schemaItem.tagClass + "," + schemaItem.type + "), got (" + objChild.tagClass + "," + objChild.type + ")");
                  }
                  break;
                }
              }
              var childRval = asn1.validate(objChild, schemaItem, capture, errors);
              if (childRval) {
                ++j2;
                rval = true;
              } else if (schemaItem.optional) {
                rval = true;
              } else {
                rval = false;
                break;
              }
            }
          }
          if (rval && capture) {
            if (v2.capture) {
              capture[v2.capture] = obj.value;
            }
            if (v2.captureAsn1) {
              capture[v2.captureAsn1] = obj;
            }
            if (v2.captureBitStringContents && "bitStringContents" in obj) {
              capture[v2.captureBitStringContents] = obj.bitStringContents;
            }
            if (v2.captureBitStringValue && "bitStringContents" in obj) {
              var value;
              if (obj.bitStringContents.length < 2) {
                capture[v2.captureBitStringValue] = "";
              } else {
                var unused = obj.bitStringContents.charCodeAt(0);
                if (unused !== 0) {
                  throw new Error(
                    "captureBitStringValue only supported for zero unused bits"
                  );
                }
                capture[v2.captureBitStringValue] = obj.bitStringContents.slice(1);
              }
            }
          }
        } else if (errors) {
          errors.push(
            "[" + v2.name + '] Expected constructed "' + v2.constructed + '", got "' + obj.constructed + '"'
          );
        }
      } else if (errors) {
        if (obj.tagClass !== v2.tagClass) {
          errors.push(
            "[" + v2.name + '] Expected tag class "' + v2.tagClass + '", got "' + obj.tagClass + '"'
          );
        }
        if (obj.type !== v2.type) {
          errors.push(
            "[" + v2.name + '] Expected type "' + v2.type + '", got "' + obj.type + '"'
          );
        }
      }
      return rval;
    };
    var _nonLatinRegex = /[^\\u0000-\\u00ff]/;
    asn1.prettyPrint = function(obj, level, indentation) {
      var rval = "";
      level = level || 0;
      indentation = indentation || 2;
      if (level > 0) {
        rval += "\n";
      }
      var indent = "";
      for (var i2 = 0; i2 < level * indentation; ++i2) {
        indent += " ";
      }
      rval += indent + "Tag: ";
      switch (obj.tagClass) {
        case asn1.Class.UNIVERSAL:
          rval += "Universal:";
          break;
        case asn1.Class.APPLICATION:
          rval += "Application:";
          break;
        case asn1.Class.CONTEXT_SPECIFIC:
          rval += "Context-Specific:";
          break;
        case asn1.Class.PRIVATE:
          rval += "Private:";
          break;
      }
      if (obj.tagClass === asn1.Class.UNIVERSAL) {
        rval += obj.type;
        switch (obj.type) {
          case asn1.Type.NONE:
            rval += " (None)";
            break;
          case asn1.Type.BOOLEAN:
            rval += " (Boolean)";
            break;
          case asn1.Type.INTEGER:
            rval += " (Integer)";
            break;
          case asn1.Type.BITSTRING:
            rval += " (Bit string)";
            break;
          case asn1.Type.OCTETSTRING:
            rval += " (Octet string)";
            break;
          case asn1.Type.NULL:
            rval += " (Null)";
            break;
          case asn1.Type.OID:
            rval += " (Object Identifier)";
            break;
          case asn1.Type.ODESC:
            rval += " (Object Descriptor)";
            break;
          case asn1.Type.EXTERNAL:
            rval += " (External or Instance of)";
            break;
          case asn1.Type.REAL:
            rval += " (Real)";
            break;
          case asn1.Type.ENUMERATED:
            rval += " (Enumerated)";
            break;
          case asn1.Type.EMBEDDED:
            rval += " (Embedded PDV)";
            break;
          case asn1.Type.UTF8:
            rval += " (UTF8)";
            break;
          case asn1.Type.ROID:
            rval += " (Relative Object Identifier)";
            break;
          case asn1.Type.SEQUENCE:
            rval += " (Sequence)";
            break;
          case asn1.Type.SET:
            rval += " (Set)";
            break;
          case asn1.Type.PRINTABLESTRING:
            rval += " (Printable String)";
            break;
          case asn1.Type.IA5String:
            rval += " (IA5String (ASCII))";
            break;
          case asn1.Type.UTCTIME:
            rval += " (UTC time)";
            break;
          case asn1.Type.GENERALIZEDTIME:
            rval += " (Generalized time)";
            break;
          case asn1.Type.BMPSTRING:
            rval += " (BMP String)";
            break;
        }
      } else {
        rval += obj.type;
      }
      rval += "\n";
      rval += indent + "Constructed: " + obj.constructed + "\n";
      if (obj.composed) {
        var subvalues = 0;
        var sub = "";
        for (var i2 = 0; i2 < obj.value.length; ++i2) {
          if (obj.value[i2] !== void 0) {
            subvalues += 1;
            sub += asn1.prettyPrint(obj.value[i2], level + 1, indentation);
            if (i2 + 1 < obj.value.length) {
              sub += ",";
            }
          }
        }
        rval += indent + "Sub values: " + subvalues + sub;
      } else {
        rval += indent + "Value: ";
        if (obj.type === asn1.Type.OID) {
          var oid = asn1.derToOid(obj.value);
          rval += oid;
          if (forge.pki && forge.pki.oids) {
            if (oid in forge.pki.oids) {
              rval += " (" + forge.pki.oids[oid] + ") ";
            }
          }
        }
        if (obj.type === asn1.Type.INTEGER) {
          try {
            rval += asn1.derToInteger(obj.value);
          } catch (ex) {
            rval += "0x" + forge.util.bytesToHex(obj.value);
          }
        } else if (obj.type === asn1.Type.BITSTRING) {
          if (obj.value.length > 1) {
            rval += "0x" + forge.util.bytesToHex(obj.value.slice(1));
          } else {
            rval += "(none)";
          }
          if (obj.value.length > 0) {
            var unused = obj.value.charCodeAt(0);
            if (unused == 1) {
              rval += " (1 unused bit shown)";
            } else if (unused > 1) {
              rval += " (" + unused + " unused bits shown)";
            }
          }
        } else if (obj.type === asn1.Type.OCTETSTRING) {
          if (!_nonLatinRegex.test(obj.value)) {
            rval += "(" + obj.value + ") ";
          }
          rval += "0x" + forge.util.bytesToHex(obj.value);
        } else if (obj.type === asn1.Type.UTF8) {
          try {
            rval += forge.util.decodeUtf8(obj.value);
          } catch (e2) {
            if (e2.message === "URI malformed") {
              rval += "0x" + forge.util.bytesToHex(obj.value) + " (malformed UTF8)";
            } else {
              throw e2;
            }
          }
        } else if (obj.type === asn1.Type.PRINTABLESTRING || obj.type === asn1.Type.IA5String) {
          rval += obj.value;
        } else if (_nonLatinRegex.test(obj.value)) {
          rval += "0x" + forge.util.bytesToHex(obj.value);
        } else if (obj.value.length === 0) {
          rval += "[null]";
        } else {
          rval += obj.value;
        }
      }
      return rval;
    };
  }
});

// node_modules/node-forge/lib/md.js
var require_md = __commonJS({
  "node_modules/node-forge/lib/md.js"(exports2, module2) {
    var forge = require_forge();
    module2.exports = forge.md = forge.md || {};
    forge.md.algorithms = forge.md.algorithms || {};
  }
});

// node_modules/node-forge/lib/hmac.js
var require_hmac = __commonJS({
  "node_modules/node-forge/lib/hmac.js"(exports2, module2) {
    var forge = require_forge();
    require_md();
    require_util();
    var hmac = module2.exports = forge.hmac = forge.hmac || {};
    hmac.create = function() {
      var _key = null;
      var _md = null;
      var _ipadding = null;
      var _opadding = null;
      var ctx = {};
      ctx.start = function(md, key) {
        if (md !== null) {
          if (typeof md === "string") {
            md = md.toLowerCase();
            if (md in forge.md.algorithms) {
              _md = forge.md.algorithms[md].create();
            } else {
              throw new Error('Unknown hash algorithm "' + md + '"');
            }
          } else {
            _md = md;
          }
        }
        if (key === null) {
          key = _key;
        } else {
          if (typeof key === "string") {
            key = forge.util.createBuffer(key);
          } else if (forge.util.isArray(key)) {
            var tmp = key;
            key = forge.util.createBuffer();
            for (var i2 = 0; i2 < tmp.length; ++i2) {
              key.putByte(tmp[i2]);
            }
          }
          var keylen = key.length();
          if (keylen > _md.blockLength) {
            _md.start();
            _md.update(key.bytes());
            key = _md.digest();
          }
          _ipadding = forge.util.createBuffer();
          _opadding = forge.util.createBuffer();
          keylen = key.length();
          for (var i2 = 0; i2 < keylen; ++i2) {
            var tmp = key.at(i2);
            _ipadding.putByte(54 ^ tmp);
            _opadding.putByte(92 ^ tmp);
          }
          if (keylen < _md.blockLength) {
            var tmp = _md.blockLength - keylen;
            for (var i2 = 0; i2 < tmp; ++i2) {
              _ipadding.putByte(54);
              _opadding.putByte(92);
            }
          }
          _key = key;
          _ipadding = _ipadding.bytes();
          _opadding = _opadding.bytes();
        }
        _md.start();
        _md.update(_ipadding);
      };
      ctx.update = function(bytes) {
        _md.update(bytes);
      };
      ctx.getMac = function() {
        var inner = _md.digest().bytes();
        _md.start();
        _md.update(_opadding);
        _md.update(inner);
        return _md.digest();
      };
      ctx.digest = ctx.getMac;
      return ctx;
    };
  }
});

// node_modules/node-forge/lib/md5.js
var require_md5 = __commonJS({
  "node_modules/node-forge/lib/md5.js"(exports2, module2) {
    var forge = require_forge();
    require_md();
    require_util();
    var md5 = module2.exports = forge.md5 = forge.md5 || {};
    forge.md.md5 = forge.md.algorithms.md5 = md5;
    md5.create = function() {
      if (!_initialized) {
        _init();
      }
      var _state = null;
      var _input = forge.util.createBuffer();
      var _w = new Array(16);
      var md = {
        algorithm: "md5",
        blockLength: 64,
        digestLength: 16,
        // 56-bit length of message so far (does not including padding)
        messageLength: 0,
        // true message length
        fullMessageLength: null,
        // size of message length in bytes
        messageLengthSize: 8
      };
      md.start = function() {
        md.messageLength = 0;
        md.fullMessageLength = md.messageLength64 = [];
        var int32s = md.messageLengthSize / 4;
        for (var i2 = 0; i2 < int32s; ++i2) {
          md.fullMessageLength.push(0);
        }
        _input = forge.util.createBuffer();
        _state = {
          h0: 1732584193,
          h1: 4023233417,
          h2: 2562383102,
          h3: 271733878
        };
        return md;
      };
      md.start();
      md.update = function(msg, encoding) {
        if (encoding === "utf8") {
          msg = forge.util.encodeUtf8(msg);
        }
        var len = msg.length;
        md.messageLength += len;
        len = [len / 4294967296 >>> 0, len >>> 0];
        for (var i2 = md.fullMessageLength.length - 1; i2 >= 0; --i2) {
          md.fullMessageLength[i2] += len[1];
          len[1] = len[0] + (md.fullMessageLength[i2] / 4294967296 >>> 0);
          md.fullMessageLength[i2] = md.fullMessageLength[i2] >>> 0;
          len[0] = len[1] / 4294967296 >>> 0;
        }
        _input.putBytes(msg);
        _update(_state, _w, _input);
        if (_input.read > 2048 || _input.length() === 0) {
          _input.compact();
        }
        return md;
      };
      md.digest = function() {
        var finalBlock = forge.util.createBuffer();
        finalBlock.putBytes(_input.bytes());
        var remaining = md.fullMessageLength[md.fullMessageLength.length - 1] + md.messageLengthSize;
        var overflow = remaining & md.blockLength - 1;
        finalBlock.putBytes(_padding.substr(0, md.blockLength - overflow));
        var bits, carry = 0;
        for (var i2 = md.fullMessageLength.length - 1; i2 >= 0; --i2) {
          bits = md.fullMessageLength[i2] * 8 + carry;
          carry = bits / 4294967296 >>> 0;
          finalBlock.putInt32Le(bits >>> 0);
        }
        var s2 = {
          h0: _state.h0,
          h1: _state.h1,
          h2: _state.h2,
          h3: _state.h3
        };
        _update(s2, _w, finalBlock);
        var rval = forge.util.createBuffer();
        rval.putInt32Le(s2.h0);
        rval.putInt32Le(s2.h1);
        rval.putInt32Le(s2.h2);
        rval.putInt32Le(s2.h3);
        return rval;
      };
      return md;
    };
    var _padding = null;
    var _g = null;
    var _r = null;
    var _k = null;
    var _initialized = false;
    function _init() {
      _padding = String.fromCharCode(128);
      _padding += forge.util.fillString(String.fromCharCode(0), 64);
      _g = [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        1,
        6,
        11,
        0,
        5,
        10,
        15,
        4,
        9,
        14,
        3,
        8,
        13,
        2,
        7,
        12,
        5,
        8,
        11,
        14,
        1,
        4,
        7,
        10,
        13,
        0,
        3,
        6,
        9,
        12,
        15,
        2,
        0,
        7,
        14,
        5,
        12,
        3,
        10,
        1,
        8,
        15,
        6,
        13,
        4,
        11,
        2,
        9
      ];
      _r = [
        7,
        12,
        17,
        22,
        7,
        12,
        17,
        22,
        7,
        12,
        17,
        22,
        7,
        12,
        17,
        22,
        5,
        9,
        14,
        20,
        5,
        9,
        14,
        20,
        5,
        9,
        14,
        20,
        5,
        9,
        14,
        20,
        4,
        11,
        16,
        23,
        4,
        11,
        16,
        23,
        4,
        11,
        16,
        23,
        4,
        11,
        16,
        23,
        6,
        10,
        15,
        21,
        6,
        10,
        15,
        21,
        6,
        10,
        15,
        21,
        6,
        10,
        15,
        21
      ];
      _k = new Array(64);
      for (var i2 = 0; i2 < 64; ++i2) {
        _k[i2] = Math.floor(Math.abs(Math.sin(i2 + 1)) * 4294967296);
      }
      _initialized = true;
    }
    function _update(s2, w2, bytes) {
      var t2, a2, b2, c2, d2, f2, r2, i2;
      var len = bytes.length();
      while (len >= 64) {
        a2 = s2.h0;
        b2 = s2.h1;
        c2 = s2.h2;
        d2 = s2.h3;
        for (i2 = 0; i2 < 16; ++i2) {
          w2[i2] = bytes.getInt32Le();
          f2 = d2 ^ b2 & (c2 ^ d2);
          t2 = a2 + f2 + _k[i2] + w2[i2];
          r2 = _r[i2];
          a2 = d2;
          d2 = c2;
          c2 = b2;
          b2 += t2 << r2 | t2 >>> 32 - r2;
        }
        for (; i2 < 32; ++i2) {
          f2 = c2 ^ d2 & (b2 ^ c2);
          t2 = a2 + f2 + _k[i2] + w2[_g[i2]];
          r2 = _r[i2];
          a2 = d2;
          d2 = c2;
          c2 = b2;
          b2 += t2 << r2 | t2 >>> 32 - r2;
        }
        for (; i2 < 48; ++i2) {
          f2 = b2 ^ c2 ^ d2;
          t2 = a2 + f2 + _k[i2] + w2[_g[i2]];
          r2 = _r[i2];
          a2 = d2;
          d2 = c2;
          c2 = b2;
          b2 += t2 << r2 | t2 >>> 32 - r2;
        }
        for (; i2 < 64; ++i2) {
          f2 = c2 ^ (b2 | ~d2);
          t2 = a2 + f2 + _k[i2] + w2[_g[i2]];
          r2 = _r[i2];
          a2 = d2;
          d2 = c2;
          c2 = b2;
          b2 += t2 << r2 | t2 >>> 32 - r2;
        }
        s2.h0 = s2.h0 + a2 | 0;
        s2.h1 = s2.h1 + b2 | 0;
        s2.h2 = s2.h2 + c2 | 0;
        s2.h3 = s2.h3 + d2 | 0;
        len -= 64;
      }
    }
  }
});

// node_modules/node-forge/lib/pem.js
var require_pem = __commonJS({
  "node_modules/node-forge/lib/pem.js"(exports2, module2) {
    var forge = require_forge();
    require_util();
    var pem = module2.exports = forge.pem = forge.pem || {};
    pem.encode = function(msg, options) {
      options = options || {};
      var rval = "-----BEGIN " + msg.type + "-----\r\n";
      var header;
      if (msg.procType) {
        header = {
          name: "Proc-Type",
          values: [String(msg.procType.version), msg.procType.type]
        };
        rval += foldHeader(header);
      }
      if (msg.contentDomain) {
        header = { name: "Content-Domain", values: [msg.contentDomain] };
        rval += foldHeader(header);
      }
      if (msg.dekInfo) {
        header = { name: "DEK-Info", values: [msg.dekInfo.algorithm] };
        if (msg.dekInfo.parameters) {
          header.values.push(msg.dekInfo.parameters);
        }
        rval += foldHeader(header);
      }
      if (msg.headers) {
        for (var i2 = 0; i2 < msg.headers.length; ++i2) {
          rval += foldHeader(msg.headers[i2]);
        }
      }
      if (msg.procType) {
        rval += "\r\n";
      }
      rval += forge.util.encode64(msg.body, options.maxline || 64) + "\r\n";
      rval += "-----END " + msg.type + "-----\r\n";
      return rval;
    };
    pem.decode = function(str) {
      var rval = [];
      var rMessage = /\s*-----BEGIN ([A-Z0-9- ]+)-----\r?\n?([\x21-\x7e\s]+?(?:\r?\n\r?\n))?([:A-Za-z0-9+\/=\s]+?)-----END \1-----/g;
      var rHeader = /([\x21-\x7e]+):\s*([\x21-\x7e\s^:]+)/;
      var rCRLF = /\r?\n/;
      var match;
      while (true) {
        match = rMessage.exec(str);
        if (!match) {
          break;
        }
        var type = match[1];
        if (type === "NEW CERTIFICATE REQUEST") {
          type = "CERTIFICATE REQUEST";
        }
        var msg = {
          type,
          procType: null,
          contentDomain: null,
          dekInfo: null,
          headers: [],
          body: forge.util.decode64(match[3])
        };
        rval.push(msg);
        if (!match[2]) {
          continue;
        }
        var lines = match[2].split(rCRLF);
        var li = 0;
        while (match && li < lines.length) {
          var line = lines[li].replace(/\s+$/, "");
          for (var nl = li + 1; nl < lines.length; ++nl) {
            var next = lines[nl];
            if (!/\s/.test(next[0])) {
              break;
            }
            line += next;
            li = nl;
          }
          match = line.match(rHeader);
          if (match) {
            var header = { name: match[1], values: [] };
            var values = match[2].split(",");
            for (var vi = 0; vi < values.length; ++vi) {
              header.values.push(ltrim(values[vi]));
            }
            if (!msg.procType) {
              if (header.name !== "Proc-Type") {
                throw new Error('Invalid PEM formatted message. The first encapsulated header must be "Proc-Type".');
              } else if (header.values.length !== 2) {
                throw new Error('Invalid PEM formatted message. The "Proc-Type" header must have two subfields.');
              }
              msg.procType = { version: values[0], type: values[1] };
            } else if (!msg.contentDomain && header.name === "Content-Domain") {
              msg.contentDomain = values[0] || "";
            } else if (!msg.dekInfo && header.name === "DEK-Info") {
              if (header.values.length === 0) {
                throw new Error('Invalid PEM formatted message. The "DEK-Info" header must have at least one subfield.');
              }
              msg.dekInfo = { algorithm: values[0], parameters: values[1] || null };
            } else {
              msg.headers.push(header);
            }
          }
          ++li;
        }
        if (msg.procType === "ENCRYPTED" && !msg.dekInfo) {
          throw new Error('Invalid PEM formatted message. The "DEK-Info" header must be present if "Proc-Type" is "ENCRYPTED".');
        }
      }
      if (rval.length === 0) {
        throw new Error("Invalid PEM formatted message.");
      }
      return rval;
    };
    function foldHeader(header) {
      var rval = header.name + ": ";
      var values = [];
      var insertSpace = function(match, $1) {
        return " " + $1;
      };
      for (var i2 = 0; i2 < header.values.length; ++i2) {
        values.push(header.values[i2].replace(/^(\S+\r\n)/, insertSpace));
      }
      rval += values.join(",") + "\r\n";
      var length = 0;
      var candidate = -1;
      for (var i2 = 0; i2 < rval.length; ++i2, ++length) {
        if (length > 65 && candidate !== -1) {
          var insert = rval[candidate];
          if (insert === ",") {
            ++candidate;
            rval = rval.substr(0, candidate) + "\r\n " + rval.substr(candidate);
          } else {
            rval = rval.substr(0, candidate) + "\r\n" + insert + rval.substr(candidate + 1);
          }
          length = i2 - candidate - 1;
          candidate = -1;
          ++i2;
        } else if (rval[i2] === " " || rval[i2] === "	" || rval[i2] === ",") {
          candidate = i2;
        }
      }
      return rval;
    }
    function ltrim(str) {
      return str.replace(/^\s+/, "");
    }
  }
});

// node_modules/node-forge/lib/des.js
var require_des = __commonJS({
  "node_modules/node-forge/lib/des.js"(exports2, module2) {
    var forge = require_forge();
    require_cipher();
    require_cipherModes();
    require_util();
    module2.exports = forge.des = forge.des || {};
    forge.des.startEncrypting = function(key, iv, output, mode) {
      var cipher = _createCipher({
        key,
        output,
        decrypt: false,
        mode: mode || (iv === null ? "ECB" : "CBC")
      });
      cipher.start(iv);
      return cipher;
    };
    forge.des.createEncryptionCipher = function(key, mode) {
      return _createCipher({
        key,
        output: null,
        decrypt: false,
        mode
      });
    };
    forge.des.startDecrypting = function(key, iv, output, mode) {
      var cipher = _createCipher({
        key,
        output,
        decrypt: true,
        mode: mode || (iv === null ? "ECB" : "CBC")
      });
      cipher.start(iv);
      return cipher;
    };
    forge.des.createDecryptionCipher = function(key, mode) {
      return _createCipher({
        key,
        output: null,
        decrypt: true,
        mode
      });
    };
    forge.des.Algorithm = function(name, mode) {
      var self2 = this;
      self2.name = name;
      self2.mode = new mode({
        blockSize: 8,
        cipher: {
          encrypt: function(inBlock, outBlock) {
            return _updateBlock(self2._keys, inBlock, outBlock, false);
          },
          decrypt: function(inBlock, outBlock) {
            return _updateBlock(self2._keys, inBlock, outBlock, true);
          }
        }
      });
      self2._init = false;
    };
    forge.des.Algorithm.prototype.initialize = function(options) {
      if (this._init) {
        return;
      }
      var key = forge.util.createBuffer(options.key);
      if (this.name.indexOf("3DES") === 0) {
        if (key.length() !== 24) {
          throw new Error("Invalid Triple-DES key size: " + key.length() * 8);
        }
      }
      this._keys = _createKeys(key);
      this._init = true;
    };
    registerAlgorithm("DES-ECB", forge.cipher.modes.ecb);
    registerAlgorithm("DES-CBC", forge.cipher.modes.cbc);
    registerAlgorithm("DES-CFB", forge.cipher.modes.cfb);
    registerAlgorithm("DES-OFB", forge.cipher.modes.ofb);
    registerAlgorithm("DES-CTR", forge.cipher.modes.ctr);
    registerAlgorithm("3DES-ECB", forge.cipher.modes.ecb);
    registerAlgorithm("3DES-CBC", forge.cipher.modes.cbc);
    registerAlgorithm("3DES-CFB", forge.cipher.modes.cfb);
    registerAlgorithm("3DES-OFB", forge.cipher.modes.ofb);
    registerAlgorithm("3DES-CTR", forge.cipher.modes.ctr);
    function registerAlgorithm(name, mode) {
      var factory = function() {
        return new forge.des.Algorithm(name, mode);
      };
      forge.cipher.registerAlgorithm(name, factory);
    }
    var spfunction1 = [16843776, 0, 65536, 16843780, 16842756, 66564, 4, 65536, 1024, 16843776, 16843780, 1024, 16778244, 16842756, 16777216, 4, 1028, 16778240, 16778240, 66560, 66560, 16842752, 16842752, 16778244, 65540, 16777220, 16777220, 65540, 0, 1028, 66564, 16777216, 65536, 16843780, 4, 16842752, 16843776, 16777216, 16777216, 1024, 16842756, 65536, 66560, 16777220, 1024, 4, 16778244, 66564, 16843780, 65540, 16842752, 16778244, 16777220, 1028, 66564, 16843776, 1028, 16778240, 16778240, 0, 65540, 66560, 0, 16842756];
    var spfunction2 = [-2146402272, -2147450880, 32768, 1081376, 1048576, 32, -2146435040, -2147450848, -2147483616, -2146402272, -2146402304, -2147483648, -2147450880, 1048576, 32, -2146435040, 1081344, 1048608, -2147450848, 0, -2147483648, 32768, 1081376, -2146435072, 1048608, -2147483616, 0, 1081344, 32800, -2146402304, -2146435072, 32800, 0, 1081376, -2146435040, 1048576, -2147450848, -2146435072, -2146402304, 32768, -2146435072, -2147450880, 32, -2146402272, 1081376, 32, 32768, -2147483648, 32800, -2146402304, 1048576, -2147483616, 1048608, -2147450848, -2147483616, 1048608, 1081344, 0, -2147450880, 32800, -2147483648, -2146435040, -2146402272, 1081344];
    var spfunction3 = [520, 134349312, 0, 134348808, 134218240, 0, 131592, 134218240, 131080, 134217736, 134217736, 131072, 134349320, 131080, 134348800, 520, 134217728, 8, 134349312, 512, 131584, 134348800, 134348808, 131592, 134218248, 131584, 131072, 134218248, 8, 134349320, 512, 134217728, 134349312, 134217728, 131080, 520, 131072, 134349312, 134218240, 0, 512, 131080, 134349320, 134218240, 134217736, 512, 0, 134348808, 134218248, 131072, 134217728, 134349320, 8, 131592, 131584, 134217736, 134348800, 134218248, 520, 134348800, 131592, 8, 134348808, 131584];
    var spfunction4 = [8396801, 8321, 8321, 128, 8396928, 8388737, 8388609, 8193, 0, 8396800, 8396800, 8396929, 129, 0, 8388736, 8388609, 1, 8192, 8388608, 8396801, 128, 8388608, 8193, 8320, 8388737, 1, 8320, 8388736, 8192, 8396928, 8396929, 129, 8388736, 8388609, 8396800, 8396929, 129, 0, 0, 8396800, 8320, 8388736, 8388737, 1, 8396801, 8321, 8321, 128, 8396929, 129, 1, 8192, 8388609, 8193, 8396928, 8388737, 8193, 8320, 8388608, 8396801, 128, 8388608, 8192, 8396928];
    var spfunction5 = [256, 34078976, 34078720, 1107296512, 524288, 256, 1073741824, 34078720, 1074266368, 524288, 33554688, 1074266368, 1107296512, 1107820544, 524544, 1073741824, 33554432, 1074266112, 1074266112, 0, 1073742080, 1107820800, 1107820800, 33554688, 1107820544, 1073742080, 0, 1107296256, 34078976, 33554432, 1107296256, 524544, 524288, 1107296512, 256, 33554432, 1073741824, 34078720, 1107296512, 1074266368, 33554688, 1073741824, 1107820544, 34078976, 1074266368, 256, 33554432, 1107820544, 1107820800, 524544, 1107296256, 1107820800, 34078720, 0, 1074266112, 1107296256, 524544, 33554688, 1073742080, 524288, 0, 1074266112, 34078976, 1073742080];
    var spfunction6 = [536870928, 541065216, 16384, 541081616, 541065216, 16, 541081616, 4194304, 536887296, 4210704, 4194304, 536870928, 4194320, 536887296, 536870912, 16400, 0, 4194320, 536887312, 16384, 4210688, 536887312, 16, 541065232, 541065232, 0, 4210704, 541081600, 16400, 4210688, 541081600, 536870912, 536887296, 16, 541065232, 4210688, 541081616, 4194304, 16400, 536870928, 4194304, 536887296, 536870912, 16400, 536870928, 541081616, 4210688, 541065216, 4210704, 541081600, 0, 541065232, 16, 16384, 541065216, 4210704, 16384, 4194320, 536887312, 0, 541081600, 536870912, 4194320, 536887312];
    var spfunction7 = [2097152, 69206018, 67110914, 0, 2048, 67110914, 2099202, 69208064, 69208066, 2097152, 0, 67108866, 2, 67108864, 69206018, 2050, 67110912, 2099202, 2097154, 67110912, 67108866, 69206016, 69208064, 2097154, 69206016, 2048, 2050, 69208066, 2099200, 2, 67108864, 2099200, 67108864, 2099200, 2097152, 67110914, 67110914, 69206018, 69206018, 2, 2097154, 67108864, 67110912, 2097152, 69208064, 2050, 2099202, 69208064, 2050, 67108866, 69208066, 69206016, 2099200, 0, 2, 69208066, 0, 2099202, 69206016, 2048, 67108866, 67110912, 2048, 2097154];
    var spfunction8 = [268439616, 4096, 262144, 268701760, 268435456, 268439616, 64, 268435456, 262208, 268697600, 268701760, 266240, 268701696, 266304, 4096, 64, 268697600, 268435520, 268439552, 4160, 266240, 262208, 268697664, 268701696, 4160, 0, 0, 268697664, 268435520, 268439552, 266304, 262144, 266304, 262144, 268701696, 4096, 64, 268697664, 4096, 266304, 268439552, 64, 268435520, 268697600, 268697664, 268435456, 262144, 268439616, 0, 268701760, 262208, 268435520, 268697600, 268439552, 268439616, 0, 268701760, 266240, 266240, 4160, 4160, 262208, 268435456, 268701696];
    function _createKeys(key) {
      var pc2bytes0 = [0, 4, 536870912, 536870916, 65536, 65540, 536936448, 536936452, 512, 516, 536871424, 536871428, 66048, 66052, 536936960, 536936964], pc2bytes1 = [0, 1, 1048576, 1048577, 67108864, 67108865, 68157440, 68157441, 256, 257, 1048832, 1048833, 67109120, 67109121, 68157696, 68157697], pc2bytes2 = [0, 8, 2048, 2056, 16777216, 16777224, 16779264, 16779272, 0, 8, 2048, 2056, 16777216, 16777224, 16779264, 16779272], pc2bytes3 = [0, 2097152, 134217728, 136314880, 8192, 2105344, 134225920, 136323072, 131072, 2228224, 134348800, 136445952, 139264, 2236416, 134356992, 136454144], pc2bytes4 = [0, 262144, 16, 262160, 0, 262144, 16, 262160, 4096, 266240, 4112, 266256, 4096, 266240, 4112, 266256], pc2bytes5 = [0, 1024, 32, 1056, 0, 1024, 32, 1056, 33554432, 33555456, 33554464, 33555488, 33554432, 33555456, 33554464, 33555488], pc2bytes6 = [0, 268435456, 524288, 268959744, 2, 268435458, 524290, 268959746, 0, 268435456, 524288, 268959744, 2, 268435458, 524290, 268959746], pc2bytes7 = [0, 65536, 2048, 67584, 536870912, 536936448, 536872960, 536938496, 131072, 196608, 133120, 198656, 537001984, 537067520, 537004032, 537069568], pc2bytes8 = [0, 262144, 0, 262144, 2, 262146, 2, 262146, 33554432, 33816576, 33554432, 33816576, 33554434, 33816578, 33554434, 33816578], pc2bytes9 = [0, 268435456, 8, 268435464, 0, 268435456, 8, 268435464, 1024, 268436480, 1032, 268436488, 1024, 268436480, 1032, 268436488], pc2bytes10 = [0, 32, 0, 32, 1048576, 1048608, 1048576, 1048608, 8192, 8224, 8192, 8224, 1056768, 1056800, 1056768, 1056800], pc2bytes11 = [0, 16777216, 512, 16777728, 2097152, 18874368, 2097664, 18874880, 67108864, 83886080, 67109376, 83886592, 69206016, 85983232, 69206528, 85983744], pc2bytes12 = [0, 4096, 134217728, 134221824, 524288, 528384, 134742016, 134746112, 16, 4112, 134217744, 134221840, 524304, 528400, 134742032, 134746128], pc2bytes13 = [0, 4, 256, 260, 0, 4, 256, 260, 1, 5, 257, 261, 1, 5, 257, 261];
      var iterations = key.length() > 8 ? 3 : 1;
      var keys = [];
      var shifts = [0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0];
      var n2 = 0, tmp;
      for (var j2 = 0; j2 < iterations; j2++) {
        var left = key.getInt32();
        var right = key.getInt32();
        tmp = (left >>> 4 ^ right) & 252645135;
        right ^= tmp;
        left ^= tmp << 4;
        tmp = (right >>> -16 ^ left) & 65535;
        left ^= tmp;
        right ^= tmp << -16;
        tmp = (left >>> 2 ^ right) & 858993459;
        right ^= tmp;
        left ^= tmp << 2;
        tmp = (right >>> -16 ^ left) & 65535;
        left ^= tmp;
        right ^= tmp << -16;
        tmp = (left >>> 1 ^ right) & 1431655765;
        right ^= tmp;
        left ^= tmp << 1;
        tmp = (right >>> 8 ^ left) & 16711935;
        left ^= tmp;
        right ^= tmp << 8;
        tmp = (left >>> 1 ^ right) & 1431655765;
        right ^= tmp;
        left ^= tmp << 1;
        tmp = left << 8 | right >>> 20 & 240;
        left = right << 24 | right << 8 & 16711680 | right >>> 8 & 65280 | right >>> 24 & 240;
        right = tmp;
        for (var i2 = 0; i2 < shifts.length; ++i2) {
          if (shifts[i2]) {
            left = left << 2 | left >>> 26;
            right = right << 2 | right >>> 26;
          } else {
            left = left << 1 | left >>> 27;
            right = right << 1 | right >>> 27;
          }
          left &= -15;
          right &= -15;
          var lefttmp = pc2bytes0[left >>> 28] | pc2bytes1[left >>> 24 & 15] | pc2bytes2[left >>> 20 & 15] | pc2bytes3[left >>> 16 & 15] | pc2bytes4[left >>> 12 & 15] | pc2bytes5[left >>> 8 & 15] | pc2bytes6[left >>> 4 & 15];
          var righttmp = pc2bytes7[right >>> 28] | pc2bytes8[right >>> 24 & 15] | pc2bytes9[right >>> 20 & 15] | pc2bytes10[right >>> 16 & 15] | pc2bytes11[right >>> 12 & 15] | pc2bytes12[right >>> 8 & 15] | pc2bytes13[right >>> 4 & 15];
          tmp = (righttmp >>> 16 ^ lefttmp) & 65535;
          keys[n2++] = lefttmp ^ tmp;
          keys[n2++] = righttmp ^ tmp << 16;
        }
      }
      return keys;
    }
    function _updateBlock(keys, input, output, decrypt) {
      var iterations = keys.length === 32 ? 3 : 9;
      var looping;
      if (iterations === 3) {
        looping = decrypt ? [30, -2, -2] : [0, 32, 2];
      } else {
        looping = decrypt ? [94, 62, -2, 32, 64, 2, 30, -2, -2] : [0, 32, 2, 62, 30, -2, 64, 96, 2];
      }
      var tmp;
      var left = input[0];
      var right = input[1];
      tmp = (left >>> 4 ^ right) & 252645135;
      right ^= tmp;
      left ^= tmp << 4;
      tmp = (left >>> 16 ^ right) & 65535;
      right ^= tmp;
      left ^= tmp << 16;
      tmp = (right >>> 2 ^ left) & 858993459;
      left ^= tmp;
      right ^= tmp << 2;
      tmp = (right >>> 8 ^ left) & 16711935;
      left ^= tmp;
      right ^= tmp << 8;
      tmp = (left >>> 1 ^ right) & 1431655765;
      right ^= tmp;
      left ^= tmp << 1;
      left = left << 1 | left >>> 31;
      right = right << 1 | right >>> 31;
      for (var j2 = 0; j2 < iterations; j2 += 3) {
        var endloop = looping[j2 + 1];
        var loopinc = looping[j2 + 2];
        for (var i2 = looping[j2]; i2 != endloop; i2 += loopinc) {
          var right1 = right ^ keys[i2];
          var right2 = (right >>> 4 | right << 28) ^ keys[i2 + 1];
          tmp = left;
          left = right;
          right = tmp ^ (spfunction2[right1 >>> 24 & 63] | spfunction4[right1 >>> 16 & 63] | spfunction6[right1 >>> 8 & 63] | spfunction8[right1 & 63] | spfunction1[right2 >>> 24 & 63] | spfunction3[right2 >>> 16 & 63] | spfunction5[right2 >>> 8 & 63] | spfunction7[right2 & 63]);
        }
        tmp = left;
        left = right;
        right = tmp;
      }
      left = left >>> 1 | left << 31;
      right = right >>> 1 | right << 31;
      tmp = (left >>> 1 ^ right) & 1431655765;
      right ^= tmp;
      left ^= tmp << 1;
      tmp = (right >>> 8 ^ left) & 16711935;
      left ^= tmp;
      right ^= tmp << 8;
      tmp = (right >>> 2 ^ left) & 858993459;
      left ^= tmp;
      right ^= tmp << 2;
      tmp = (left >>> 16 ^ right) & 65535;
      right ^= tmp;
      left ^= tmp << 16;
      tmp = (left >>> 4 ^ right) & 252645135;
      right ^= tmp;
      left ^= tmp << 4;
      output[0] = left;
      output[1] = right;
    }
    function _createCipher(options) {
      options = options || {};
      var mode = (options.mode || "CBC").toUpperCase();
      var algorithm = "DES-" + mode;
      var cipher;
      if (options.decrypt) {
        cipher = forge.cipher.createDecipher(algorithm, options.key);
      } else {
        cipher = forge.cipher.createCipher(algorithm, options.key);
      }
      var start = cipher.start;
      cipher.start = function(iv, options2) {
        var output = null;
        if (options2 instanceof forge.util.ByteBuffer) {
          output = options2;
          options2 = {};
        }
        options2 = options2 || {};
        options2.output = output;
        options2.iv = iv;
        start.call(cipher, options2);
      };
      return cipher;
    }
  }
});

// node_modules/node-forge/lib/pbkdf2.js
var require_pbkdf2 = __commonJS({
  "node_modules/node-forge/lib/pbkdf2.js"(exports2, module2) {
    var forge = require_forge();
    require_hmac();
    require_md();
    require_util();
    var pkcs5 = forge.pkcs5 = forge.pkcs5 || {};
    var crypto;
    if (forge.util.isNodejs && !forge.options.usePureJavaScript) {
      crypto = require("crypto");
    }
    module2.exports = forge.pbkdf2 = pkcs5.pbkdf2 = function(p2, s2, c2, dkLen, md, callback) {
      if (typeof md === "function") {
        callback = md;
        md = null;
      }
      if (forge.util.isNodejs && !forge.options.usePureJavaScript && crypto.pbkdf2 && (md === null || typeof md !== "object") && (crypto.pbkdf2Sync.length > 4 || (!md || md === "sha1"))) {
        if (typeof md !== "string") {
          md = "sha1";
        }
        p2 = Buffer.from(p2, "binary");
        s2 = Buffer.from(s2, "binary");
        if (!callback) {
          if (crypto.pbkdf2Sync.length === 4) {
            return crypto.pbkdf2Sync(p2, s2, c2, dkLen).toString("binary");
          }
          return crypto.pbkdf2Sync(p2, s2, c2, dkLen, md).toString("binary");
        }
        if (crypto.pbkdf2Sync.length === 4) {
          return crypto.pbkdf2(p2, s2, c2, dkLen, function(err2, key) {
            if (err2) {
              return callback(err2);
            }
            callback(null, key.toString("binary"));
          });
        }
        return crypto.pbkdf2(p2, s2, c2, dkLen, md, function(err2, key) {
          if (err2) {
            return callback(err2);
          }
          callback(null, key.toString("binary"));
        });
      }
      if (typeof md === "undefined" || md === null) {
        md = "sha1";
      }
      if (typeof md === "string") {
        if (!(md in forge.md.algorithms)) {
          throw new Error("Unknown hash algorithm: " + md);
        }
        md = forge.md[md].create();
      }
      var hLen = md.digestLength;
      if (dkLen > 4294967295 * hLen) {
        var err = new Error("Derived key is too long.");
        if (callback) {
          return callback(err);
        }
        throw err;
      }
      var len = Math.ceil(dkLen / hLen);
      var r2 = dkLen - (len - 1) * hLen;
      var prf = forge.hmac.create();
      prf.start(md, p2);
      var dk = "";
      var xor, u_c, u_c1;
      if (!callback) {
        for (var i2 = 1; i2 <= len; ++i2) {
          prf.start(null, null);
          prf.update(s2);
          prf.update(forge.util.int32ToBytes(i2));
          xor = u_c1 = prf.digest().getBytes();
          for (var j2 = 2; j2 <= c2; ++j2) {
            prf.start(null, null);
            prf.update(u_c1);
            u_c = prf.digest().getBytes();
            xor = forge.util.xorBytes(xor, u_c, hLen);
            u_c1 = u_c;
          }
          dk += i2 < len ? xor : xor.substr(0, r2);
        }
        return dk;
      }
      var i2 = 1, j2;
      function outer() {
        if (i2 > len) {
          return callback(null, dk);
        }
        prf.start(null, null);
        prf.update(s2);
        prf.update(forge.util.int32ToBytes(i2));
        xor = u_c1 = prf.digest().getBytes();
        j2 = 2;
        inner();
      }
      function inner() {
        if (j2 <= c2) {
          prf.start(null, null);
          prf.update(u_c1);
          u_c = prf.digest().getBytes();
          xor = forge.util.xorBytes(xor, u_c, hLen);
          u_c1 = u_c;
          ++j2;
          return forge.util.setImmediate(inner);
        }
        dk += i2 < len ? xor : xor.substr(0, r2);
        ++i2;
        outer();
      }
      outer();
    };
  }
});

// node_modules/node-forge/lib/sha256.js
var require_sha256 = __commonJS({
  "node_modules/node-forge/lib/sha256.js"(exports2, module2) {
    var forge = require_forge();
    require_md();
    require_util();
    var sha256 = module2.exports = forge.sha256 = forge.sha256 || {};
    forge.md.sha256 = forge.md.algorithms.sha256 = sha256;
    sha256.create = function() {
      if (!_initialized) {
        _init();
      }
      var _state = null;
      var _input = forge.util.createBuffer();
      var _w = new Array(64);
      var md = {
        algorithm: "sha256",
        blockLength: 64,
        digestLength: 32,
        // 56-bit length of message so far (does not including padding)
        messageLength: 0,
        // true message length
        fullMessageLength: null,
        // size of message length in bytes
        messageLengthSize: 8
      };
      md.start = function() {
        md.messageLength = 0;
        md.fullMessageLength = md.messageLength64 = [];
        var int32s = md.messageLengthSize / 4;
        for (var i2 = 0; i2 < int32s; ++i2) {
          md.fullMessageLength.push(0);
        }
        _input = forge.util.createBuffer();
        _state = {
          h0: 1779033703,
          h1: 3144134277,
          h2: 1013904242,
          h3: 2773480762,
          h4: 1359893119,
          h5: 2600822924,
          h6: 528734635,
          h7: 1541459225
        };
        return md;
      };
      md.start();
      md.update = function(msg, encoding) {
        if (encoding === "utf8") {
          msg = forge.util.encodeUtf8(msg);
        }
        var len = msg.length;
        md.messageLength += len;
        len = [len / 4294967296 >>> 0, len >>> 0];
        for (var i2 = md.fullMessageLength.length - 1; i2 >= 0; --i2) {
          md.fullMessageLength[i2] += len[1];
          len[1] = len[0] + (md.fullMessageLength[i2] / 4294967296 >>> 0);
          md.fullMessageLength[i2] = md.fullMessageLength[i2] >>> 0;
          len[0] = len[1] / 4294967296 >>> 0;
        }
        _input.putBytes(msg);
        _update(_state, _w, _input);
        if (_input.read > 2048 || _input.length() === 0) {
          _input.compact();
        }
        return md;
      };
      md.digest = function() {
        var finalBlock = forge.util.createBuffer();
        finalBlock.putBytes(_input.bytes());
        var remaining = md.fullMessageLength[md.fullMessageLength.length - 1] + md.messageLengthSize;
        var overflow = remaining & md.blockLength - 1;
        finalBlock.putBytes(_padding.substr(0, md.blockLength - overflow));
        var next, carry;
        var bits = md.fullMessageLength[0] * 8;
        for (var i2 = 0; i2 < md.fullMessageLength.length - 1; ++i2) {
          next = md.fullMessageLength[i2 + 1] * 8;
          carry = next / 4294967296 >>> 0;
          bits += carry;
          finalBlock.putInt32(bits >>> 0);
          bits = next >>> 0;
        }
        finalBlock.putInt32(bits);
        var s2 = {
          h0: _state.h0,
          h1: _state.h1,
          h2: _state.h2,
          h3: _state.h3,
          h4: _state.h4,
          h5: _state.h5,
          h6: _state.h6,
          h7: _state.h7
        };
        _update(s2, _w, finalBlock);
        var rval = forge.util.createBuffer();
        rval.putInt32(s2.h0);
        rval.putInt32(s2.h1);
        rval.putInt32(s2.h2);
        rval.putInt32(s2.h3);
        rval.putInt32(s2.h4);
        rval.putInt32(s2.h5);
        rval.putInt32(s2.h6);
        rval.putInt32(s2.h7);
        return rval;
      };
      return md;
    };
    var _padding = null;
    var _initialized = false;
    var _k = null;
    function _init() {
      _padding = String.fromCharCode(128);
      _padding += forge.util.fillString(String.fromCharCode(0), 64);
      _k = [
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ];
      _initialized = true;
    }
    function _update(s2, w2, bytes) {
      var t1, t2, s0, s1, ch, maj, i2, a2, b2, c2, d2, e2, f2, g2, h2;
      var len = bytes.length();
      while (len >= 64) {
        for (i2 = 0; i2 < 16; ++i2) {
          w2[i2] = bytes.getInt32();
        }
        for (; i2 < 64; ++i2) {
          t1 = w2[i2 - 2];
          t1 = (t1 >>> 17 | t1 << 15) ^ (t1 >>> 19 | t1 << 13) ^ t1 >>> 10;
          t2 = w2[i2 - 15];
          t2 = (t2 >>> 7 | t2 << 25) ^ (t2 >>> 18 | t2 << 14) ^ t2 >>> 3;
          w2[i2] = t1 + w2[i2 - 7] + t2 + w2[i2 - 16] | 0;
        }
        a2 = s2.h0;
        b2 = s2.h1;
        c2 = s2.h2;
        d2 = s2.h3;
        e2 = s2.h4;
        f2 = s2.h5;
        g2 = s2.h6;
        h2 = s2.h7;
        for (i2 = 0; i2 < 64; ++i2) {
          s1 = (e2 >>> 6 | e2 << 26) ^ (e2 >>> 11 | e2 << 21) ^ (e2 >>> 25 | e2 << 7);
          ch = g2 ^ e2 & (f2 ^ g2);
          s0 = (a2 >>> 2 | a2 << 30) ^ (a2 >>> 13 | a2 << 19) ^ (a2 >>> 22 | a2 << 10);
          maj = a2 & b2 | c2 & (a2 ^ b2);
          t1 = h2 + s1 + ch + _k[i2] + w2[i2];
          t2 = s0 + maj;
          h2 = g2;
          g2 = f2;
          f2 = e2;
          e2 = d2 + t1 >>> 0;
          d2 = c2;
          c2 = b2;
          b2 = a2;
          a2 = t1 + t2 >>> 0;
        }
        s2.h0 = s2.h0 + a2 | 0;
        s2.h1 = s2.h1 + b2 | 0;
        s2.h2 = s2.h2 + c2 | 0;
        s2.h3 = s2.h3 + d2 | 0;
        s2.h4 = s2.h4 + e2 | 0;
        s2.h5 = s2.h5 + f2 | 0;
        s2.h6 = s2.h6 + g2 | 0;
        s2.h7 = s2.h7 + h2 | 0;
        len -= 64;
      }
    }
  }
});

// node_modules/node-forge/lib/prng.js
var require_prng = __commonJS({
  "node_modules/node-forge/lib/prng.js"(exports2, module2) {
    var forge = require_forge();
    require_util();
    var _crypto = null;
    if (forge.util.isNodejs && !forge.options.usePureJavaScript && !process.versions["node-webkit"]) {
      _crypto = require("crypto");
    }
    var prng = module2.exports = forge.prng = forge.prng || {};
    prng.create = function(plugin) {
      var ctx = {
        plugin,
        key: null,
        seed: null,
        time: null,
        // number of reseeds so far
        reseeds: 0,
        // amount of data generated so far
        generated: 0,
        // no initial key bytes
        keyBytes: ""
      };
      var md = plugin.md;
      var pools = new Array(32);
      for (var i2 = 0; i2 < 32; ++i2) {
        pools[i2] = md.create();
      }
      ctx.pools = pools;
      ctx.pool = 0;
      ctx.generate = function(count, callback) {
        if (!callback) {
          return ctx.generateSync(count);
        }
        var cipher = ctx.plugin.cipher;
        var increment = ctx.plugin.increment;
        var formatKey = ctx.plugin.formatKey;
        var formatSeed = ctx.plugin.formatSeed;
        var b2 = forge.util.createBuffer();
        ctx.key = null;
        generate();
        function generate(err) {
          if (err) {
            return callback(err);
          }
          if (b2.length() >= count) {
            return callback(null, b2.getBytes(count));
          }
          if (ctx.generated > 1048575) {
            ctx.key = null;
          }
          if (ctx.key === null) {
            return forge.util.nextTick(function() {
              _reseed(generate);
            });
          }
          var bytes = cipher(ctx.key, ctx.seed);
          ctx.generated += bytes.length;
          b2.putBytes(bytes);
          ctx.key = formatKey(cipher(ctx.key, increment(ctx.seed)));
          ctx.seed = formatSeed(cipher(ctx.key, ctx.seed));
          forge.util.setImmediate(generate);
        }
      };
      ctx.generateSync = function(count) {
        var cipher = ctx.plugin.cipher;
        var increment = ctx.plugin.increment;
        var formatKey = ctx.plugin.formatKey;
        var formatSeed = ctx.plugin.formatSeed;
        ctx.key = null;
        var b2 = forge.util.createBuffer();
        while (b2.length() < count) {
          if (ctx.generated > 1048575) {
            ctx.key = null;
          }
          if (ctx.key === null) {
            _reseedSync();
          }
          var bytes = cipher(ctx.key, ctx.seed);
          ctx.generated += bytes.length;
          b2.putBytes(bytes);
          ctx.key = formatKey(cipher(ctx.key, increment(ctx.seed)));
          ctx.seed = formatSeed(cipher(ctx.key, ctx.seed));
        }
        return b2.getBytes(count);
      };
      function _reseed(callback) {
        if (ctx.pools[0].messageLength >= 32) {
          _seed();
          return callback();
        }
        var needed = 32 - ctx.pools[0].messageLength << 5;
        ctx.seedFile(needed, function(err, bytes) {
          if (err) {
            return callback(err);
          }
          ctx.collect(bytes);
          _seed();
          callback();
        });
      }
      function _reseedSync() {
        if (ctx.pools[0].messageLength >= 32) {
          return _seed();
        }
        var needed = 32 - ctx.pools[0].messageLength << 5;
        ctx.collect(ctx.seedFileSync(needed));
        _seed();
      }
      function _seed() {
        ctx.reseeds = ctx.reseeds === 4294967295 ? 0 : ctx.reseeds + 1;
        var md2 = ctx.plugin.md.create();
        md2.update(ctx.keyBytes);
        var _2powK = 1;
        for (var k2 = 0; k2 < 32; ++k2) {
          if (ctx.reseeds % _2powK === 0) {
            md2.update(ctx.pools[k2].digest().getBytes());
            ctx.pools[k2].start();
          }
          _2powK = _2powK << 1;
        }
        ctx.keyBytes = md2.digest().getBytes();
        md2.start();
        md2.update(ctx.keyBytes);
        var seedBytes = md2.digest().getBytes();
        ctx.key = ctx.plugin.formatKey(ctx.keyBytes);
        ctx.seed = ctx.plugin.formatSeed(seedBytes);
        ctx.generated = 0;
      }
      function defaultSeedFile(needed) {
        var getRandomValues = null;
        var globalScope = forge.util.globalScope;
        var _crypto2 = globalScope.crypto || globalScope.msCrypto;
        if (_crypto2 && _crypto2.getRandomValues) {
          getRandomValues = function(arr) {
            return _crypto2.getRandomValues(arr);
          };
        }
        var b2 = forge.util.createBuffer();
        if (getRandomValues) {
          while (b2.length() < needed) {
            var count = Math.max(1, Math.min(needed - b2.length(), 65536) / 4);
            var entropy = new Uint32Array(Math.floor(count));
            try {
              getRandomValues(entropy);
              for (var i3 = 0; i3 < entropy.length; ++i3) {
                b2.putInt32(entropy[i3]);
              }
            } catch (e2) {
              if (!(typeof QuotaExceededError !== "undefined" && e2 instanceof QuotaExceededError)) {
                throw e2;
              }
            }
          }
        }
        if (b2.length() < needed) {
          var hi, lo, next;
          var seed = Math.floor(Math.random() * 65536);
          while (b2.length() < needed) {
            lo = 16807 * (seed & 65535);
            hi = 16807 * (seed >> 16);
            lo += (hi & 32767) << 16;
            lo += hi >> 15;
            lo = (lo & 2147483647) + (lo >> 31);
            seed = lo & 4294967295;
            for (var i3 = 0; i3 < 3; ++i3) {
              next = seed >>> (i3 << 3);
              next ^= Math.floor(Math.random() * 256);
              b2.putByte(next & 255);
            }
          }
        }
        return b2.getBytes(needed);
      }
      if (_crypto) {
        ctx.seedFile = function(needed, callback) {
          _crypto.randomBytes(needed, function(err, bytes) {
            if (err) {
              return callback(err);
            }
            callback(null, bytes.toString());
          });
        };
        ctx.seedFileSync = function(needed) {
          return _crypto.randomBytes(needed).toString();
        };
      } else {
        ctx.seedFile = function(needed, callback) {
          try {
            callback(null, defaultSeedFile(needed));
          } catch (e2) {
            callback(e2);
          }
        };
        ctx.seedFileSync = defaultSeedFile;
      }
      ctx.collect = function(bytes) {
        var count = bytes.length;
        for (var i3 = 0; i3 < count; ++i3) {
          ctx.pools[ctx.pool].update(bytes.substr(i3, 1));
          ctx.pool = ctx.pool === 31 ? 0 : ctx.pool + 1;
        }
      };
      ctx.collectInt = function(i3, n2) {
        var bytes = "";
        for (var x2 = 0; x2 < n2; x2 += 8) {
          bytes += String.fromCharCode(i3 >> x2 & 255);
        }
        ctx.collect(bytes);
      };
      ctx.registerWorker = function(worker) {
        if (worker === self) {
          ctx.seedFile = function(needed, callback) {
            function listener2(e2) {
              var data = e2.data;
              if (data.forge && data.forge.prng) {
                self.removeEventListener("message", listener2);
                callback(data.forge.prng.err, data.forge.prng.bytes);
              }
            }
            self.addEventListener("message", listener2);
            self.postMessage({ forge: { prng: { needed } } });
          };
        } else {
          var listener = function(e2) {
            var data = e2.data;
            if (data.forge && data.forge.prng) {
              ctx.seedFile(data.forge.prng.needed, function(err, bytes) {
                worker.postMessage({ forge: { prng: { err, bytes } } });
              });
            }
          };
          worker.addEventListener("message", listener);
        }
      };
      return ctx;
    };
  }
});

// node_modules/node-forge/lib/random.js
var require_random = __commonJS({
  "node_modules/node-forge/lib/random.js"(exports2, module2) {
    var forge = require_forge();
    require_aes();
    require_sha256();
    require_prng();
    require_util();
    (function() {
      if (forge.random && forge.random.getBytes) {
        module2.exports = forge.random;
        return;
      }
      (function(jQuery2) {
        var prng_aes = {};
        var _prng_aes_output = new Array(4);
        var _prng_aes_buffer = forge.util.createBuffer();
        prng_aes.formatKey = function(key2) {
          var tmp = forge.util.createBuffer(key2);
          key2 = new Array(4);
          key2[0] = tmp.getInt32();
          key2[1] = tmp.getInt32();
          key2[2] = tmp.getInt32();
          key2[3] = tmp.getInt32();
          return forge.aes._expandKey(key2, false);
        };
        prng_aes.formatSeed = function(seed) {
          var tmp = forge.util.createBuffer(seed);
          seed = new Array(4);
          seed[0] = tmp.getInt32();
          seed[1] = tmp.getInt32();
          seed[2] = tmp.getInt32();
          seed[3] = tmp.getInt32();
          return seed;
        };
        prng_aes.cipher = function(key2, seed) {
          forge.aes._updateBlock(key2, seed, _prng_aes_output, false);
          _prng_aes_buffer.putInt32(_prng_aes_output[0]);
          _prng_aes_buffer.putInt32(_prng_aes_output[1]);
          _prng_aes_buffer.putInt32(_prng_aes_output[2]);
          _prng_aes_buffer.putInt32(_prng_aes_output[3]);
          return _prng_aes_buffer.getBytes();
        };
        prng_aes.increment = function(seed) {
          ++seed[3];
          return seed;
        };
        prng_aes.md = forge.md.sha256;
        function spawnPrng() {
          var ctx = forge.prng.create(prng_aes);
          ctx.getBytes = function(count, callback) {
            return ctx.generate(count, callback);
          };
          ctx.getBytesSync = function(count) {
            return ctx.generate(count);
          };
          return ctx;
        }
        var _ctx = spawnPrng();
        var getRandomValues = null;
        var globalScope = forge.util.globalScope;
        var _crypto = globalScope.crypto || globalScope.msCrypto;
        if (_crypto && _crypto.getRandomValues) {
          getRandomValues = function(arr) {
            return _crypto.getRandomValues(arr);
          };
        }
        if (forge.options.usePureJavaScript || !forge.util.isNodejs && !getRandomValues) {
          if (typeof window === "undefined" || window.document === void 0) {
          }
          _ctx.collectInt(+/* @__PURE__ */ new Date(), 32);
          if (typeof navigator !== "undefined") {
            var _navBytes = "";
            for (var key in navigator) {
              try {
                if (typeof navigator[key] == "string") {
                  _navBytes += navigator[key];
                }
              } catch (e2) {
              }
            }
            _ctx.collect(_navBytes);
            _navBytes = null;
          }
          if (jQuery2) {
            jQuery2().mousemove(function(e2) {
              _ctx.collectInt(e2.clientX, 16);
              _ctx.collectInt(e2.clientY, 16);
            });
            jQuery2().keypress(function(e2) {
              _ctx.collectInt(e2.charCode, 8);
            });
          }
        }
        if (!forge.random) {
          forge.random = _ctx;
        } else {
          for (var key in _ctx) {
            forge.random[key] = _ctx[key];
          }
        }
        forge.random.createInstance = spawnPrng;
        module2.exports = forge.random;
      })(typeof jQuery !== "undefined" ? jQuery : null);
    })();
  }
});

// node_modules/node-forge/lib/rc2.js
var require_rc2 = __commonJS({
  "node_modules/node-forge/lib/rc2.js"(exports2, module2) {
    var forge = require_forge();
    require_util();
    var piTable = [
      217,
      120,
      249,
      196,
      25,
      221,
      181,
      237,
      40,
      233,
      253,
      121,
      74,
      160,
      216,
      157,
      198,
      126,
      55,
      131,
      43,
      118,
      83,
      142,
      98,
      76,
      100,
      136,
      68,
      139,
      251,
      162,
      23,
      154,
      89,
      245,
      135,
      179,
      79,
      19,
      97,
      69,
      109,
      141,
      9,
      129,
      125,
      50,
      189,
      143,
      64,
      235,
      134,
      183,
      123,
      11,
      240,
      149,
      33,
      34,
      92,
      107,
      78,
      130,
      84,
      214,
      101,
      147,
      206,
      96,
      178,
      28,
      115,
      86,
      192,
      20,
      167,
      140,
      241,
      220,
      18,
      117,
      202,
      31,
      59,
      190,
      228,
      209,
      66,
      61,
      212,
      48,
      163,
      60,
      182,
      38,
      111,
      191,
      14,
      218,
      70,
      105,
      7,
      87,
      39,
      242,
      29,
      155,
      188,
      148,
      67,
      3,
      248,
      17,
      199,
      246,
      144,
      239,
      62,
      231,
      6,
      195,
      213,
      47,
      200,
      102,
      30,
      215,
      8,
      232,
      234,
      222,
      128,
      82,
      238,
      247,
      132,
      170,
      114,
      172,
      53,
      77,
      106,
      42,
      150,
      26,
      210,
      113,
      90,
      21,
      73,
      116,
      75,
      159,
      208,
      94,
      4,
      24,
      164,
      236,
      194,
      224,
      65,
      110,
      15,
      81,
      203,
      204,
      36,
      145,
      175,
      80,
      161,
      244,
      112,
      57,
      153,
      124,
      58,
      133,
      35,
      184,
      180,
      122,
      252,
      2,
      54,
      91,
      37,
      85,
      151,
      49,
      45,
      93,
      250,
      152,
      227,
      138,
      146,
      174,
      5,
      223,
      41,
      16,
      103,
      108,
      186,
      201,
      211,
      0,
      230,
      207,
      225,
      158,
      168,
      44,
      99,
      22,
      1,
      63,
      88,
      226,
      137,
      169,
      13,
      56,
      52,
      27,
      171,
      51,
      255,
      176,
      187,
      72,
      12,
      95,
      185,
      177,
      205,
      46,
      197,
      243,
      219,
      71,
      229,
      165,
      156,
      119,
      10,
      166,
      32,
      104,
      254,
      127,
      193,
      173
    ];
    var s2 = [1, 2, 3, 5];
    var rol = function(word, bits) {
      return word << bits & 65535 | (word & 65535) >> 16 - bits;
    };
    var ror = function(word, bits) {
      return (word & 65535) >> bits | word << 16 - bits & 65535;
    };
    module2.exports = forge.rc2 = forge.rc2 || {};
    forge.rc2.expandKey = function(key, effKeyBits) {
      if (typeof key === "string") {
        key = forge.util.createBuffer(key);
      }
      effKeyBits = effKeyBits || 128;
      var L2 = key;
      var T2 = key.length();
      var T1 = effKeyBits;
      var T8 = Math.ceil(T1 / 8);
      var TM = 255 >> (T1 & 7);
      var i2;
      for (i2 = T2; i2 < 128; i2++) {
        L2.putByte(piTable[L2.at(i2 - 1) + L2.at(i2 - T2) & 255]);
      }
      L2.setAt(128 - T8, piTable[L2.at(128 - T8) & TM]);
      for (i2 = 127 - T8; i2 >= 0; i2--) {
        L2.setAt(i2, piTable[L2.at(i2 + 1) ^ L2.at(i2 + T8)]);
      }
      return L2;
    };
    var createCipher = function(key, bits, encrypt) {
      var _finish = false, _input = null, _output = null, _iv = null;
      var mixRound, mashRound;
      var i2, j2, K2 = [];
      key = forge.rc2.expandKey(key, bits);
      for (i2 = 0; i2 < 64; i2++) {
        K2.push(key.getInt16Le());
      }
      if (encrypt) {
        mixRound = function(R2) {
          for (i2 = 0; i2 < 4; i2++) {
            R2[i2] += K2[j2] + (R2[(i2 + 3) % 4] & R2[(i2 + 2) % 4]) + (~R2[(i2 + 3) % 4] & R2[(i2 + 1) % 4]);
            R2[i2] = rol(R2[i2], s2[i2]);
            j2++;
          }
        };
        mashRound = function(R2) {
          for (i2 = 0; i2 < 4; i2++) {
            R2[i2] += K2[R2[(i2 + 3) % 4] & 63];
          }
        };
      } else {
        mixRound = function(R2) {
          for (i2 = 3; i2 >= 0; i2--) {
            R2[i2] = ror(R2[i2], s2[i2]);
            R2[i2] -= K2[j2] + (R2[(i2 + 3) % 4] & R2[(i2 + 2) % 4]) + (~R2[(i2 + 3) % 4] & R2[(i2 + 1) % 4]);
            j2--;
          }
        };
        mashRound = function(R2) {
          for (i2 = 3; i2 >= 0; i2--) {
            R2[i2] -= K2[R2[(i2 + 3) % 4] & 63];
          }
        };
      }
      var runPlan = function(plan) {
        var R2 = [];
        for (i2 = 0; i2 < 4; i2++) {
          var val = _input.getInt16Le();
          if (_iv !== null) {
            if (encrypt) {
              val ^= _iv.getInt16Le();
            } else {
              _iv.putInt16Le(val);
            }
          }
          R2.push(val & 65535);
        }
        j2 = encrypt ? 0 : 63;
        for (var ptr = 0; ptr < plan.length; ptr++) {
          for (var ctr = 0; ctr < plan[ptr][0]; ctr++) {
            plan[ptr][1](R2);
          }
        }
        for (i2 = 0; i2 < 4; i2++) {
          if (_iv !== null) {
            if (encrypt) {
              _iv.putInt16Le(R2[i2]);
            } else {
              R2[i2] ^= _iv.getInt16Le();
            }
          }
          _output.putInt16Le(R2[i2]);
        }
      };
      var cipher = null;
      cipher = {
        /**
         * Starts or restarts the encryption or decryption process, whichever
         * was previously configured.
         *
         * To use the cipher in CBC mode, iv may be given either as a string
         * of bytes, or as a byte buffer.  For ECB mode, give null as iv.
         *
         * @param iv the initialization vector to use, null for ECB mode.
         * @param output the output the buffer to write to, null to create one.
         */
        start: function(iv, output) {
          if (iv) {
            if (typeof iv === "string") {
              iv = forge.util.createBuffer(iv);
            }
          }
          _finish = false;
          _input = forge.util.createBuffer();
          _output = output || new forge.util.createBuffer();
          _iv = iv;
          cipher.output = _output;
        },
        /**
         * Updates the next block.
         *
         * @param input the buffer to read from.
         */
        update: function(input) {
          if (!_finish) {
            _input.putBuffer(input);
          }
          while (_input.length() >= 8) {
            runPlan([
              [5, mixRound],
              [1, mashRound],
              [6, mixRound],
              [1, mashRound],
              [5, mixRound]
            ]);
          }
        },
        /**
         * Finishes encrypting or decrypting.
         *
         * @param pad a padding function to use, null for PKCS#7 padding,
         *           signature(blockSize, buffer, decrypt).
         *
         * @return true if successful, false on error.
         */
        finish: function(pad) {
          var rval = true;
          if (encrypt) {
            if (pad) {
              rval = pad(8, _input, !encrypt);
            } else {
              var padding = _input.length() === 8 ? 8 : 8 - _input.length();
              _input.fillWithByte(padding, padding);
            }
          }
          if (rval) {
            _finish = true;
            cipher.update();
          }
          if (!encrypt) {
            rval = _input.length() === 0;
            if (rval) {
              if (pad) {
                rval = pad(8, _output, !encrypt);
              } else {
                var len = _output.length();
                var count = _output.at(len - 1);
                if (count > len) {
                  rval = false;
                } else {
                  _output.truncate(count);
                }
              }
            }
          }
          return rval;
        }
      };
      return cipher;
    };
    forge.rc2.startEncrypting = function(key, iv, output) {
      var cipher = forge.rc2.createEncryptionCipher(key, 128);
      cipher.start(iv, output);
      return cipher;
    };
    forge.rc2.createEncryptionCipher = function(key, bits) {
      return createCipher(key, bits, true);
    };
    forge.rc2.startDecrypting = function(key, iv, output) {
      var cipher = forge.rc2.createDecryptionCipher(key, 128);
      cipher.start(iv, output);
      return cipher;
    };
    forge.rc2.createDecryptionCipher = function(key, bits) {
      return createCipher(key, bits, false);
    };
  }
});

// node_modules/node-forge/lib/jsbn.js
var require_jsbn = __commonJS({
  "node_modules/node-forge/lib/jsbn.js"(exports2, module2) {
    var forge = require_forge();
    module2.exports = forge.jsbn = forge.jsbn || {};
    var dbits;
    var canary = 244837814094590;
    var j_lm = (canary & 16777215) == 15715070;
    function BigInteger(a2, b2, c2) {
      this.data = [];
      if (a2 != null)
        if ("number" == typeof a2) this.fromNumber(a2, b2, c2);
        else if (b2 == null && "string" != typeof a2) this.fromString(a2, 256);
        else this.fromString(a2, b2);
    }
    forge.jsbn.BigInteger = BigInteger;
    function nbi() {
      return new BigInteger(null);
    }
    function am1(i2, x2, w2, j2, c2, n2) {
      while (--n2 >= 0) {
        var v2 = x2 * this.data[i2++] + w2.data[j2] + c2;
        c2 = Math.floor(v2 / 67108864);
        w2.data[j2++] = v2 & 67108863;
      }
      return c2;
    }
    function am2(i2, x2, w2, j2, c2, n2) {
      var xl = x2 & 32767, xh = x2 >> 15;
      while (--n2 >= 0) {
        var l2 = this.data[i2] & 32767;
        var h2 = this.data[i2++] >> 15;
        var m2 = xh * l2 + h2 * xl;
        l2 = xl * l2 + ((m2 & 32767) << 15) + w2.data[j2] + (c2 & 1073741823);
        c2 = (l2 >>> 30) + (m2 >>> 15) + xh * h2 + (c2 >>> 30);
        w2.data[j2++] = l2 & 1073741823;
      }
      return c2;
    }
    function am3(i2, x2, w2, j2, c2, n2) {
      var xl = x2 & 16383, xh = x2 >> 14;
      while (--n2 >= 0) {
        var l2 = this.data[i2] & 16383;
        var h2 = this.data[i2++] >> 14;
        var m2 = xh * l2 + h2 * xl;
        l2 = xl * l2 + ((m2 & 16383) << 14) + w2.data[j2] + c2;
        c2 = (l2 >> 28) + (m2 >> 14) + xh * h2;
        w2.data[j2++] = l2 & 268435455;
      }
      return c2;
    }
    if (typeof navigator === "undefined") {
      BigInteger.prototype.am = am3;
      dbits = 28;
    } else if (j_lm && navigator.appName == "Microsoft Internet Explorer") {
      BigInteger.prototype.am = am2;
      dbits = 30;
    } else if (j_lm && navigator.appName != "Netscape") {
      BigInteger.prototype.am = am1;
      dbits = 26;
    } else {
      BigInteger.prototype.am = am3;
      dbits = 28;
    }
    BigInteger.prototype.DB = dbits;
    BigInteger.prototype.DM = (1 << dbits) - 1;
    BigInteger.prototype.DV = 1 << dbits;
    var BI_FP = 52;
    BigInteger.prototype.FV = Math.pow(2, BI_FP);
    BigInteger.prototype.F1 = BI_FP - dbits;
    BigInteger.prototype.F2 = 2 * dbits - BI_FP;
    var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
    var BI_RC = new Array();
    var rr;
    var vv;
    rr = "0".charCodeAt(0);
    for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
    rr = "a".charCodeAt(0);
    for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
    rr = "A".charCodeAt(0);
    for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
    function int2char(n2) {
      return BI_RM.charAt(n2);
    }
    function intAt(s2, i2) {
      var c2 = BI_RC[s2.charCodeAt(i2)];
      return c2 == null ? -1 : c2;
    }
    function bnpCopyTo(r2) {
      for (var i2 = this.t - 1; i2 >= 0; --i2) r2.data[i2] = this.data[i2];
      r2.t = this.t;
      r2.s = this.s;
    }
    function bnpFromInt(x2) {
      this.t = 1;
      this.s = x2 < 0 ? -1 : 0;
      if (x2 > 0) this.data[0] = x2;
      else if (x2 < -1) this.data[0] = x2 + this.DV;
      else this.t = 0;
    }
    function nbv(i2) {
      var r2 = nbi();
      r2.fromInt(i2);
      return r2;
    }
    function bnpFromString(s2, b2) {
      var k2;
      if (b2 == 16) k2 = 4;
      else if (b2 == 8) k2 = 3;
      else if (b2 == 256) k2 = 8;
      else if (b2 == 2) k2 = 1;
      else if (b2 == 32) k2 = 5;
      else if (b2 == 4) k2 = 2;
      else {
        this.fromRadix(s2, b2);
        return;
      }
      this.t = 0;
      this.s = 0;
      var i2 = s2.length, mi = false, sh = 0;
      while (--i2 >= 0) {
        var x2 = k2 == 8 ? s2[i2] & 255 : intAt(s2, i2);
        if (x2 < 0) {
          if (s2.charAt(i2) == "-") mi = true;
          continue;
        }
        mi = false;
        if (sh == 0)
          this.data[this.t++] = x2;
        else if (sh + k2 > this.DB) {
          this.data[this.t - 1] |= (x2 & (1 << this.DB - sh) - 1) << sh;
          this.data[this.t++] = x2 >> this.DB - sh;
        } else
          this.data[this.t - 1] |= x2 << sh;
        sh += k2;
        if (sh >= this.DB) sh -= this.DB;
      }
      if (k2 == 8 && (s2[0] & 128) != 0) {
        this.s = -1;
        if (sh > 0) this.data[this.t - 1] |= (1 << this.DB - sh) - 1 << sh;
      }
      this.clamp();
      if (mi) BigInteger.ZERO.subTo(this, this);
    }
    function bnpClamp() {
      var c2 = this.s & this.DM;
      while (this.t > 0 && this.data[this.t - 1] == c2) --this.t;
    }
    function bnToString(b2) {
      if (this.s < 0) return "-" + this.negate().toString(b2);
      var k2;
      if (b2 == 16) k2 = 4;
      else if (b2 == 8) k2 = 3;
      else if (b2 == 2) k2 = 1;
      else if (b2 == 32) k2 = 5;
      else if (b2 == 4) k2 = 2;
      else return this.toRadix(b2);
      var km = (1 << k2) - 1, d2, m2 = false, r2 = "", i2 = this.t;
      var p2 = this.DB - i2 * this.DB % k2;
      if (i2-- > 0) {
        if (p2 < this.DB && (d2 = this.data[i2] >> p2) > 0) {
          m2 = true;
          r2 = int2char(d2);
        }
        while (i2 >= 0) {
          if (p2 < k2) {
            d2 = (this.data[i2] & (1 << p2) - 1) << k2 - p2;
            d2 |= this.data[--i2] >> (p2 += this.DB - k2);
          } else {
            d2 = this.data[i2] >> (p2 -= k2) & km;
            if (p2 <= 0) {
              p2 += this.DB;
              --i2;
            }
          }
          if (d2 > 0) m2 = true;
          if (m2) r2 += int2char(d2);
        }
      }
      return m2 ? r2 : "0";
    }
    function bnNegate() {
      var r2 = nbi();
      BigInteger.ZERO.subTo(this, r2);
      return r2;
    }
    function bnAbs() {
      return this.s < 0 ? this.negate() : this;
    }
    function bnCompareTo(a2) {
      var r2 = this.s - a2.s;
      if (r2 != 0) return r2;
      var i2 = this.t;
      r2 = i2 - a2.t;
      if (r2 != 0) return this.s < 0 ? -r2 : r2;
      while (--i2 >= 0) if ((r2 = this.data[i2] - a2.data[i2]) != 0) return r2;
      return 0;
    }
    function nbits(x2) {
      var r2 = 1, t2;
      if ((t2 = x2 >>> 16) != 0) {
        x2 = t2;
        r2 += 16;
      }
      if ((t2 = x2 >> 8) != 0) {
        x2 = t2;
        r2 += 8;
      }
      if ((t2 = x2 >> 4) != 0) {
        x2 = t2;
        r2 += 4;
      }
      if ((t2 = x2 >> 2) != 0) {
        x2 = t2;
        r2 += 2;
      }
      if ((t2 = x2 >> 1) != 0) {
        x2 = t2;
        r2 += 1;
      }
      return r2;
    }
    function bnBitLength() {
      if (this.t <= 0) return 0;
      return this.DB * (this.t - 1) + nbits(this.data[this.t - 1] ^ this.s & this.DM);
    }
    function bnpDLShiftTo(n2, r2) {
      var i2;
      for (i2 = this.t - 1; i2 >= 0; --i2) r2.data[i2 + n2] = this.data[i2];
      for (i2 = n2 - 1; i2 >= 0; --i2) r2.data[i2] = 0;
      r2.t = this.t + n2;
      r2.s = this.s;
    }
    function bnpDRShiftTo(n2, r2) {
      for (var i2 = n2; i2 < this.t; ++i2) r2.data[i2 - n2] = this.data[i2];
      r2.t = Math.max(this.t - n2, 0);
      r2.s = this.s;
    }
    function bnpLShiftTo(n2, r2) {
      var bs2 = n2 % this.DB;
      var cbs = this.DB - bs2;
      var bm = (1 << cbs) - 1;
      var ds2 = Math.floor(n2 / this.DB), c2 = this.s << bs2 & this.DM, i2;
      for (i2 = this.t - 1; i2 >= 0; --i2) {
        r2.data[i2 + ds2 + 1] = this.data[i2] >> cbs | c2;
        c2 = (this.data[i2] & bm) << bs2;
      }
      for (i2 = ds2 - 1; i2 >= 0; --i2) r2.data[i2] = 0;
      r2.data[ds2] = c2;
      r2.t = this.t + ds2 + 1;
      r2.s = this.s;
      r2.clamp();
    }
    function bnpRShiftTo(n2, r2) {
      r2.s = this.s;
      var ds2 = Math.floor(n2 / this.DB);
      if (ds2 >= this.t) {
        r2.t = 0;
        return;
      }
      var bs2 = n2 % this.DB;
      var cbs = this.DB - bs2;
      var bm = (1 << bs2) - 1;
      r2.data[0] = this.data[ds2] >> bs2;
      for (var i2 = ds2 + 1; i2 < this.t; ++i2) {
        r2.data[i2 - ds2 - 1] |= (this.data[i2] & bm) << cbs;
        r2.data[i2 - ds2] = this.data[i2] >> bs2;
      }
      if (bs2 > 0) r2.data[this.t - ds2 - 1] |= (this.s & bm) << cbs;
      r2.t = this.t - ds2;
      r2.clamp();
    }
    function bnpSubTo(a2, r2) {
      var i2 = 0, c2 = 0, m2 = Math.min(a2.t, this.t);
      while (i2 < m2) {
        c2 += this.data[i2] - a2.data[i2];
        r2.data[i2++] = c2 & this.DM;
        c2 >>= this.DB;
      }
      if (a2.t < this.t) {
        c2 -= a2.s;
        while (i2 < this.t) {
          c2 += this.data[i2];
          r2.data[i2++] = c2 & this.DM;
          c2 >>= this.DB;
        }
        c2 += this.s;
      } else {
        c2 += this.s;
        while (i2 < a2.t) {
          c2 -= a2.data[i2];
          r2.data[i2++] = c2 & this.DM;
          c2 >>= this.DB;
        }
        c2 -= a2.s;
      }
      r2.s = c2 < 0 ? -1 : 0;
      if (c2 < -1) r2.data[i2++] = this.DV + c2;
      else if (c2 > 0) r2.data[i2++] = c2;
      r2.t = i2;
      r2.clamp();
    }
    function bnpMultiplyTo(a2, r2) {
      var x2 = this.abs(), y2 = a2.abs();
      var i2 = x2.t;
      r2.t = i2 + y2.t;
      while (--i2 >= 0) r2.data[i2] = 0;
      for (i2 = 0; i2 < y2.t; ++i2) r2.data[i2 + x2.t] = x2.am(0, y2.data[i2], r2, i2, 0, x2.t);
      r2.s = 0;
      r2.clamp();
      if (this.s != a2.s) BigInteger.ZERO.subTo(r2, r2);
    }
    function bnpSquareTo(r2) {
      var x2 = this.abs();
      var i2 = r2.t = 2 * x2.t;
      while (--i2 >= 0) r2.data[i2] = 0;
      for (i2 = 0; i2 < x2.t - 1; ++i2) {
        var c2 = x2.am(i2, x2.data[i2], r2, 2 * i2, 0, 1);
        if ((r2.data[i2 + x2.t] += x2.am(i2 + 1, 2 * x2.data[i2], r2, 2 * i2 + 1, c2, x2.t - i2 - 1)) >= x2.DV) {
          r2.data[i2 + x2.t] -= x2.DV;
          r2.data[i2 + x2.t + 1] = 1;
        }
      }
      if (r2.t > 0) r2.data[r2.t - 1] += x2.am(i2, x2.data[i2], r2, 2 * i2, 0, 1);
      r2.s = 0;
      r2.clamp();
    }
    function bnpDivRemTo(m2, q2, r2) {
      var pm = m2.abs();
      if (pm.t <= 0) return;
      var pt = this.abs();
      if (pt.t < pm.t) {
        if (q2 != null) q2.fromInt(0);
        if (r2 != null) this.copyTo(r2);
        return;
      }
      if (r2 == null) r2 = nbi();
      var y2 = nbi(), ts2 = this.s, ms2 = m2.s;
      var nsh = this.DB - nbits(pm.data[pm.t - 1]);
      if (nsh > 0) {
        pm.lShiftTo(nsh, y2);
        pt.lShiftTo(nsh, r2);
      } else {
        pm.copyTo(y2);
        pt.copyTo(r2);
      }
      var ys2 = y2.t;
      var y0 = y2.data[ys2 - 1];
      if (y0 == 0) return;
      var yt = y0 * (1 << this.F1) + (ys2 > 1 ? y2.data[ys2 - 2] >> this.F2 : 0);
      var d1 = this.FV / yt, d2 = (1 << this.F1) / yt, e2 = 1 << this.F2;
      var i2 = r2.t, j2 = i2 - ys2, t2 = q2 == null ? nbi() : q2;
      y2.dlShiftTo(j2, t2);
      if (r2.compareTo(t2) >= 0) {
        r2.data[r2.t++] = 1;
        r2.subTo(t2, r2);
      }
      BigInteger.ONE.dlShiftTo(ys2, t2);
      t2.subTo(y2, y2);
      while (y2.t < ys2) y2.data[y2.t++] = 0;
      while (--j2 >= 0) {
        var qd = r2.data[--i2] == y0 ? this.DM : Math.floor(r2.data[i2] * d1 + (r2.data[i2 - 1] + e2) * d2);
        if ((r2.data[i2] += y2.am(0, qd, r2, j2, 0, ys2)) < qd) {
          y2.dlShiftTo(j2, t2);
          r2.subTo(t2, r2);
          while (r2.data[i2] < --qd) r2.subTo(t2, r2);
        }
      }
      if (q2 != null) {
        r2.drShiftTo(ys2, q2);
        if (ts2 != ms2) BigInteger.ZERO.subTo(q2, q2);
      }
      r2.t = ys2;
      r2.clamp();
      if (nsh > 0) r2.rShiftTo(nsh, r2);
      if (ts2 < 0) BigInteger.ZERO.subTo(r2, r2);
    }
    function bnMod(a2) {
      var r2 = nbi();
      this.abs().divRemTo(a2, null, r2);
      if (this.s < 0 && r2.compareTo(BigInteger.ZERO) > 0) a2.subTo(r2, r2);
      return r2;
    }
    function Classic(m2) {
      this.m = m2;
    }
    function cConvert(x2) {
      if (x2.s < 0 || x2.compareTo(this.m) >= 0) return x2.mod(this.m);
      else return x2;
    }
    function cRevert(x2) {
      return x2;
    }
    function cReduce(x2) {
      x2.divRemTo(this.m, null, x2);
    }
    function cMulTo(x2, y2, r2) {
      x2.multiplyTo(y2, r2);
      this.reduce(r2);
    }
    function cSqrTo(x2, r2) {
      x2.squareTo(r2);
      this.reduce(r2);
    }
    Classic.prototype.convert = cConvert;
    Classic.prototype.revert = cRevert;
    Classic.prototype.reduce = cReduce;
    Classic.prototype.mulTo = cMulTo;
    Classic.prototype.sqrTo = cSqrTo;
    function bnpInvDigit() {
      if (this.t < 1) return 0;
      var x2 = this.data[0];
      if ((x2 & 1) == 0) return 0;
      var y2 = x2 & 3;
      y2 = y2 * (2 - (x2 & 15) * y2) & 15;
      y2 = y2 * (2 - (x2 & 255) * y2) & 255;
      y2 = y2 * (2 - ((x2 & 65535) * y2 & 65535)) & 65535;
      y2 = y2 * (2 - x2 * y2 % this.DV) % this.DV;
      return y2 > 0 ? this.DV - y2 : -y2;
    }
    function Montgomery(m2) {
      this.m = m2;
      this.mp = m2.invDigit();
      this.mpl = this.mp & 32767;
      this.mph = this.mp >> 15;
      this.um = (1 << m2.DB - 15) - 1;
      this.mt2 = 2 * m2.t;
    }
    function montConvert(x2) {
      var r2 = nbi();
      x2.abs().dlShiftTo(this.m.t, r2);
      r2.divRemTo(this.m, null, r2);
      if (x2.s < 0 && r2.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r2, r2);
      return r2;
    }
    function montRevert(x2) {
      var r2 = nbi();
      x2.copyTo(r2);
      this.reduce(r2);
      return r2;
    }
    function montReduce(x2) {
      while (x2.t <= this.mt2)
        x2.data[x2.t++] = 0;
      for (var i2 = 0; i2 < this.m.t; ++i2) {
        var j2 = x2.data[i2] & 32767;
        var u0 = j2 * this.mpl + ((j2 * this.mph + (x2.data[i2] >> 15) * this.mpl & this.um) << 15) & x2.DM;
        j2 = i2 + this.m.t;
        x2.data[j2] += this.m.am(0, u0, x2, i2, 0, this.m.t);
        while (x2.data[j2] >= x2.DV) {
          x2.data[j2] -= x2.DV;
          x2.data[++j2]++;
        }
      }
      x2.clamp();
      x2.drShiftTo(this.m.t, x2);
      if (x2.compareTo(this.m) >= 0) x2.subTo(this.m, x2);
    }
    function montSqrTo(x2, r2) {
      x2.squareTo(r2);
      this.reduce(r2);
    }
    function montMulTo(x2, y2, r2) {
      x2.multiplyTo(y2, r2);
      this.reduce(r2);
    }
    Montgomery.prototype.convert = montConvert;
    Montgomery.prototype.revert = montRevert;
    Montgomery.prototype.reduce = montReduce;
    Montgomery.prototype.mulTo = montMulTo;
    Montgomery.prototype.sqrTo = montSqrTo;
    function bnpIsEven() {
      return (this.t > 0 ? this.data[0] & 1 : this.s) == 0;
    }
    function bnpExp(e2, z2) {
      if (e2 > 4294967295 || e2 < 1) return BigInteger.ONE;
      var r2 = nbi(), r22 = nbi(), g2 = z2.convert(this), i2 = nbits(e2) - 1;
      g2.copyTo(r2);
      while (--i2 >= 0) {
        z2.sqrTo(r2, r22);
        if ((e2 & 1 << i2) > 0) z2.mulTo(r22, g2, r2);
        else {
          var t2 = r2;
          r2 = r22;
          r22 = t2;
        }
      }
      return z2.revert(r2);
    }
    function bnModPowInt(e2, m2) {
      var z2;
      if (e2 < 256 || m2.isEven()) z2 = new Classic(m2);
      else z2 = new Montgomery(m2);
      return this.exp(e2, z2);
    }
    BigInteger.prototype.copyTo = bnpCopyTo;
    BigInteger.prototype.fromInt = bnpFromInt;
    BigInteger.prototype.fromString = bnpFromString;
    BigInteger.prototype.clamp = bnpClamp;
    BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
    BigInteger.prototype.drShiftTo = bnpDRShiftTo;
    BigInteger.prototype.lShiftTo = bnpLShiftTo;
    BigInteger.prototype.rShiftTo = bnpRShiftTo;
    BigInteger.prototype.subTo = bnpSubTo;
    BigInteger.prototype.multiplyTo = bnpMultiplyTo;
    BigInteger.prototype.squareTo = bnpSquareTo;
    BigInteger.prototype.divRemTo = bnpDivRemTo;
    BigInteger.prototype.invDigit = bnpInvDigit;
    BigInteger.prototype.isEven = bnpIsEven;
    BigInteger.prototype.exp = bnpExp;
    BigInteger.prototype.toString = bnToString;
    BigInteger.prototype.negate = bnNegate;
    BigInteger.prototype.abs = bnAbs;
    BigInteger.prototype.compareTo = bnCompareTo;
    BigInteger.prototype.bitLength = bnBitLength;
    BigInteger.prototype.mod = bnMod;
    BigInteger.prototype.modPowInt = bnModPowInt;
    BigInteger.ZERO = nbv(0);
    BigInteger.ONE = nbv(1);
    function bnClone() {
      var r2 = nbi();
      this.copyTo(r2);
      return r2;
    }
    function bnIntValue() {
      if (this.s < 0) {
        if (this.t == 1) return this.data[0] - this.DV;
        else if (this.t == 0) return -1;
      } else if (this.t == 1) return this.data[0];
      else if (this.t == 0) return 0;
      return (this.data[1] & (1 << 32 - this.DB) - 1) << this.DB | this.data[0];
    }
    function bnByteValue() {
      return this.t == 0 ? this.s : this.data[0] << 24 >> 24;
    }
    function bnShortValue() {
      return this.t == 0 ? this.s : this.data[0] << 16 >> 16;
    }
    function bnpChunkSize(r2) {
      return Math.floor(Math.LN2 * this.DB / Math.log(r2));
    }
    function bnSigNum() {
      if (this.s < 0) return -1;
      else if (this.t <= 0 || this.t == 1 && this.data[0] <= 0) return 0;
      else return 1;
    }
    function bnpToRadix(b2) {
      if (b2 == null) b2 = 10;
      if (this.signum() == 0 || b2 < 2 || b2 > 36) return "0";
      var cs2 = this.chunkSize(b2);
      var a2 = Math.pow(b2, cs2);
      var d2 = nbv(a2), y2 = nbi(), z2 = nbi(), r2 = "";
      this.divRemTo(d2, y2, z2);
      while (y2.signum() > 0) {
        r2 = (a2 + z2.intValue()).toString(b2).substr(1) + r2;
        y2.divRemTo(d2, y2, z2);
      }
      return z2.intValue().toString(b2) + r2;
    }
    function bnpFromRadix(s2, b2) {
      this.fromInt(0);
      if (b2 == null) b2 = 10;
      var cs2 = this.chunkSize(b2);
      var d2 = Math.pow(b2, cs2), mi = false, j2 = 0, w2 = 0;
      for (var i2 = 0; i2 < s2.length; ++i2) {
        var x2 = intAt(s2, i2);
        if (x2 < 0) {
          if (s2.charAt(i2) == "-" && this.signum() == 0) mi = true;
          continue;
        }
        w2 = b2 * w2 + x2;
        if (++j2 >= cs2) {
          this.dMultiply(d2);
          this.dAddOffset(w2, 0);
          j2 = 0;
          w2 = 0;
        }
      }
      if (j2 > 0) {
        this.dMultiply(Math.pow(b2, j2));
        this.dAddOffset(w2, 0);
      }
      if (mi) BigInteger.ZERO.subTo(this, this);
    }
    function bnpFromNumber(a2, b2, c2) {
      if ("number" == typeof b2) {
        if (a2 < 2) this.fromInt(1);
        else {
          this.fromNumber(a2, c2);
          if (!this.testBit(a2 - 1))
            this.bitwiseTo(BigInteger.ONE.shiftLeft(a2 - 1), op_or, this);
          if (this.isEven()) this.dAddOffset(1, 0);
          while (!this.isProbablePrime(b2)) {
            this.dAddOffset(2, 0);
            if (this.bitLength() > a2) this.subTo(BigInteger.ONE.shiftLeft(a2 - 1), this);
          }
        }
      } else {
        var x2 = new Array(), t2 = a2 & 7;
        x2.length = (a2 >> 3) + 1;
        b2.nextBytes(x2);
        if (t2 > 0) x2[0] &= (1 << t2) - 1;
        else x2[0] = 0;
        this.fromString(x2, 256);
      }
    }
    function bnToByteArray() {
      var i2 = this.t, r2 = new Array();
      r2[0] = this.s;
      var p2 = this.DB - i2 * this.DB % 8, d2, k2 = 0;
      if (i2-- > 0) {
        if (p2 < this.DB && (d2 = this.data[i2] >> p2) != (this.s & this.DM) >> p2)
          r2[k2++] = d2 | this.s << this.DB - p2;
        while (i2 >= 0) {
          if (p2 < 8) {
            d2 = (this.data[i2] & (1 << p2) - 1) << 8 - p2;
            d2 |= this.data[--i2] >> (p2 += this.DB - 8);
          } else {
            d2 = this.data[i2] >> (p2 -= 8) & 255;
            if (p2 <= 0) {
              p2 += this.DB;
              --i2;
            }
          }
          if ((d2 & 128) != 0) d2 |= -256;
          if (k2 == 0 && (this.s & 128) != (d2 & 128)) ++k2;
          if (k2 > 0 || d2 != this.s) r2[k2++] = d2;
        }
      }
      return r2;
    }
    function bnEquals(a2) {
      return this.compareTo(a2) == 0;
    }
    function bnMin(a2) {
      return this.compareTo(a2) < 0 ? this : a2;
    }
    function bnMax(a2) {
      return this.compareTo(a2) > 0 ? this : a2;
    }
    function bnpBitwiseTo(a2, op, r2) {
      var i2, f2, m2 = Math.min(a2.t, this.t);
      for (i2 = 0; i2 < m2; ++i2) r2.data[i2] = op(this.data[i2], a2.data[i2]);
      if (a2.t < this.t) {
        f2 = a2.s & this.DM;
        for (i2 = m2; i2 < this.t; ++i2) r2.data[i2] = op(this.data[i2], f2);
        r2.t = this.t;
      } else {
        f2 = this.s & this.DM;
        for (i2 = m2; i2 < a2.t; ++i2) r2.data[i2] = op(f2, a2.data[i2]);
        r2.t = a2.t;
      }
      r2.s = op(this.s, a2.s);
      r2.clamp();
    }
    function op_and(x2, y2) {
      return x2 & y2;
    }
    function bnAnd(a2) {
      var r2 = nbi();
      this.bitwiseTo(a2, op_and, r2);
      return r2;
    }
    function op_or(x2, y2) {
      return x2 | y2;
    }
    function bnOr(a2) {
      var r2 = nbi();
      this.bitwiseTo(a2, op_or, r2);
      return r2;
    }
    function op_xor(x2, y2) {
      return x2 ^ y2;
    }
    function bnXor(a2) {
      var r2 = nbi();
      this.bitwiseTo(a2, op_xor, r2);
      return r2;
    }
    function op_andnot(x2, y2) {
      return x2 & ~y2;
    }
    function bnAndNot(a2) {
      var r2 = nbi();
      this.bitwiseTo(a2, op_andnot, r2);
      return r2;
    }
    function bnNot() {
      var r2 = nbi();
      for (var i2 = 0; i2 < this.t; ++i2) r2.data[i2] = this.DM & ~this.data[i2];
      r2.t = this.t;
      r2.s = ~this.s;
      return r2;
    }
    function bnShiftLeft(n2) {
      var r2 = nbi();
      if (n2 < 0) this.rShiftTo(-n2, r2);
      else this.lShiftTo(n2, r2);
      return r2;
    }
    function bnShiftRight(n2) {
      var r2 = nbi();
      if (n2 < 0) this.lShiftTo(-n2, r2);
      else this.rShiftTo(n2, r2);
      return r2;
    }
    function lbit(x2) {
      if (x2 == 0) return -1;
      var r2 = 0;
      if ((x2 & 65535) == 0) {
        x2 >>= 16;
        r2 += 16;
      }
      if ((x2 & 255) == 0) {
        x2 >>= 8;
        r2 += 8;
      }
      if ((x2 & 15) == 0) {
        x2 >>= 4;
        r2 += 4;
      }
      if ((x2 & 3) == 0) {
        x2 >>= 2;
        r2 += 2;
      }
      if ((x2 & 1) == 0) ++r2;
      return r2;
    }
    function bnGetLowestSetBit() {
      for (var i2 = 0; i2 < this.t; ++i2)
        if (this.data[i2] != 0) return i2 * this.DB + lbit(this.data[i2]);
      if (this.s < 0) return this.t * this.DB;
      return -1;
    }
    function cbit(x2) {
      var r2 = 0;
      while (x2 != 0) {
        x2 &= x2 - 1;
        ++r2;
      }
      return r2;
    }
    function bnBitCount() {
      var r2 = 0, x2 = this.s & this.DM;
      for (var i2 = 0; i2 < this.t; ++i2) r2 += cbit(this.data[i2] ^ x2);
      return r2;
    }
    function bnTestBit(n2) {
      var j2 = Math.floor(n2 / this.DB);
      if (j2 >= this.t) return this.s != 0;
      return (this.data[j2] & 1 << n2 % this.DB) != 0;
    }
    function bnpChangeBit(n2, op) {
      var r2 = BigInteger.ONE.shiftLeft(n2);
      this.bitwiseTo(r2, op, r2);
      return r2;
    }
    function bnSetBit(n2) {
      return this.changeBit(n2, op_or);
    }
    function bnClearBit(n2) {
      return this.changeBit(n2, op_andnot);
    }
    function bnFlipBit(n2) {
      return this.changeBit(n2, op_xor);
    }
    function bnpAddTo(a2, r2) {
      var i2 = 0, c2 = 0, m2 = Math.min(a2.t, this.t);
      while (i2 < m2) {
        c2 += this.data[i2] + a2.data[i2];
        r2.data[i2++] = c2 & this.DM;
        c2 >>= this.DB;
      }
      if (a2.t < this.t) {
        c2 += a2.s;
        while (i2 < this.t) {
          c2 += this.data[i2];
          r2.data[i2++] = c2 & this.DM;
          c2 >>= this.DB;
        }
        c2 += this.s;
      } else {
        c2 += this.s;
        while (i2 < a2.t) {
          c2 += a2.data[i2];
          r2.data[i2++] = c2 & this.DM;
          c2 >>= this.DB;
        }
        c2 += a2.s;
      }
      r2.s = c2 < 0 ? -1 : 0;
      if (c2 > 0) r2.data[i2++] = c2;
      else if (c2 < -1) r2.data[i2++] = this.DV + c2;
      r2.t = i2;
      r2.clamp();
    }
    function bnAdd(a2) {
      var r2 = nbi();
      this.addTo(a2, r2);
      return r2;
    }
    function bnSubtract(a2) {
      var r2 = nbi();
      this.subTo(a2, r2);
      return r2;
    }
    function bnMultiply(a2) {
      var r2 = nbi();
      this.multiplyTo(a2, r2);
      return r2;
    }
    function bnSquare() {
      var r2 = nbi();
      this.squareTo(r2);
      return r2;
    }
    function bnDivide(a2) {
      var r2 = nbi();
      this.divRemTo(a2, r2, null);
      return r2;
    }
    function bnRemainder(a2) {
      var r2 = nbi();
      this.divRemTo(a2, null, r2);
      return r2;
    }
    function bnDivideAndRemainder(a2) {
      var q2 = nbi(), r2 = nbi();
      this.divRemTo(a2, q2, r2);
      return new Array(q2, r2);
    }
    function bnpDMultiply(n2) {
      this.data[this.t] = this.am(0, n2 - 1, this, 0, 0, this.t);
      ++this.t;
      this.clamp();
    }
    function bnpDAddOffset(n2, w2) {
      if (n2 == 0) return;
      while (this.t <= w2) this.data[this.t++] = 0;
      this.data[w2] += n2;
      while (this.data[w2] >= this.DV) {
        this.data[w2] -= this.DV;
        if (++w2 >= this.t) this.data[this.t++] = 0;
        ++this.data[w2];
      }
    }
    function NullExp() {
    }
    function nNop(x2) {
      return x2;
    }
    function nMulTo(x2, y2, r2) {
      x2.multiplyTo(y2, r2);
    }
    function nSqrTo(x2, r2) {
      x2.squareTo(r2);
    }
    NullExp.prototype.convert = nNop;
    NullExp.prototype.revert = nNop;
    NullExp.prototype.mulTo = nMulTo;
    NullExp.prototype.sqrTo = nSqrTo;
    function bnPow(e2) {
      return this.exp(e2, new NullExp());
    }
    function bnpMultiplyLowerTo(a2, n2, r2) {
      var i2 = Math.min(this.t + a2.t, n2);
      r2.s = 0;
      r2.t = i2;
      while (i2 > 0) r2.data[--i2] = 0;
      var j2;
      for (j2 = r2.t - this.t; i2 < j2; ++i2) r2.data[i2 + this.t] = this.am(0, a2.data[i2], r2, i2, 0, this.t);
      for (j2 = Math.min(a2.t, n2); i2 < j2; ++i2) this.am(0, a2.data[i2], r2, i2, 0, n2 - i2);
      r2.clamp();
    }
    function bnpMultiplyUpperTo(a2, n2, r2) {
      --n2;
      var i2 = r2.t = this.t + a2.t - n2;
      r2.s = 0;
      while (--i2 >= 0) r2.data[i2] = 0;
      for (i2 = Math.max(n2 - this.t, 0); i2 < a2.t; ++i2)
        r2.data[this.t + i2 - n2] = this.am(n2 - i2, a2.data[i2], r2, 0, 0, this.t + i2 - n2);
      r2.clamp();
      r2.drShiftTo(1, r2);
    }
    function Barrett(m2) {
      this.r2 = nbi();
      this.q3 = nbi();
      BigInteger.ONE.dlShiftTo(2 * m2.t, this.r2);
      this.mu = this.r2.divide(m2);
      this.m = m2;
    }
    function barrettConvert(x2) {
      if (x2.s < 0 || x2.t > 2 * this.m.t) return x2.mod(this.m);
      else if (x2.compareTo(this.m) < 0) return x2;
      else {
        var r2 = nbi();
        x2.copyTo(r2);
        this.reduce(r2);
        return r2;
      }
    }
    function barrettRevert(x2) {
      return x2;
    }
    function barrettReduce(x2) {
      x2.drShiftTo(this.m.t - 1, this.r2);
      if (x2.t > this.m.t + 1) {
        x2.t = this.m.t + 1;
        x2.clamp();
      }
      this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
      this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
      while (x2.compareTo(this.r2) < 0) x2.dAddOffset(1, this.m.t + 1);
      x2.subTo(this.r2, x2);
      while (x2.compareTo(this.m) >= 0) x2.subTo(this.m, x2);
    }
    function barrettSqrTo(x2, r2) {
      x2.squareTo(r2);
      this.reduce(r2);
    }
    function barrettMulTo(x2, y2, r2) {
      x2.multiplyTo(y2, r2);
      this.reduce(r2);
    }
    Barrett.prototype.convert = barrettConvert;
    Barrett.prototype.revert = barrettRevert;
    Barrett.prototype.reduce = barrettReduce;
    Barrett.prototype.mulTo = barrettMulTo;
    Barrett.prototype.sqrTo = barrettSqrTo;
    function bnModPow(e2, m2) {
      var i2 = e2.bitLength(), k2, r2 = nbv(1), z2;
      if (i2 <= 0) return r2;
      else if (i2 < 18) k2 = 1;
      else if (i2 < 48) k2 = 3;
      else if (i2 < 144) k2 = 4;
      else if (i2 < 768) k2 = 5;
      else k2 = 6;
      if (i2 < 8)
        z2 = new Classic(m2);
      else if (m2.isEven())
        z2 = new Barrett(m2);
      else
        z2 = new Montgomery(m2);
      var g2 = new Array(), n2 = 3, k1 = k2 - 1, km = (1 << k2) - 1;
      g2[1] = z2.convert(this);
      if (k2 > 1) {
        var g22 = nbi();
        z2.sqrTo(g2[1], g22);
        while (n2 <= km) {
          g2[n2] = nbi();
          z2.mulTo(g22, g2[n2 - 2], g2[n2]);
          n2 += 2;
        }
      }
      var j2 = e2.t - 1, w2, is1 = true, r22 = nbi(), t2;
      i2 = nbits(e2.data[j2]) - 1;
      while (j2 >= 0) {
        if (i2 >= k1) w2 = e2.data[j2] >> i2 - k1 & km;
        else {
          w2 = (e2.data[j2] & (1 << i2 + 1) - 1) << k1 - i2;
          if (j2 > 0) w2 |= e2.data[j2 - 1] >> this.DB + i2 - k1;
        }
        n2 = k2;
        while ((w2 & 1) == 0) {
          w2 >>= 1;
          --n2;
        }
        if ((i2 -= n2) < 0) {
          i2 += this.DB;
          --j2;
        }
        if (is1) {
          g2[w2].copyTo(r2);
          is1 = false;
        } else {
          while (n2 > 1) {
            z2.sqrTo(r2, r22);
            z2.sqrTo(r22, r2);
            n2 -= 2;
          }
          if (n2 > 0) z2.sqrTo(r2, r22);
          else {
            t2 = r2;
            r2 = r22;
            r22 = t2;
          }
          z2.mulTo(r22, g2[w2], r2);
        }
        while (j2 >= 0 && (e2.data[j2] & 1 << i2) == 0) {
          z2.sqrTo(r2, r22);
          t2 = r2;
          r2 = r22;
          r22 = t2;
          if (--i2 < 0) {
            i2 = this.DB - 1;
            --j2;
          }
        }
      }
      return z2.revert(r2);
    }
    function bnGCD(a2) {
      var x2 = this.s < 0 ? this.negate() : this.clone();
      var y2 = a2.s < 0 ? a2.negate() : a2.clone();
      if (x2.compareTo(y2) < 0) {
        var t2 = x2;
        x2 = y2;
        y2 = t2;
      }
      var i2 = x2.getLowestSetBit(), g2 = y2.getLowestSetBit();
      if (g2 < 0) return x2;
      if (i2 < g2) g2 = i2;
      if (g2 > 0) {
        x2.rShiftTo(g2, x2);
        y2.rShiftTo(g2, y2);
      }
      while (x2.signum() > 0) {
        if ((i2 = x2.getLowestSetBit()) > 0) x2.rShiftTo(i2, x2);
        if ((i2 = y2.getLowestSetBit()) > 0) y2.rShiftTo(i2, y2);
        if (x2.compareTo(y2) >= 0) {
          x2.subTo(y2, x2);
          x2.rShiftTo(1, x2);
        } else {
          y2.subTo(x2, y2);
          y2.rShiftTo(1, y2);
        }
      }
      if (g2 > 0) y2.lShiftTo(g2, y2);
      return y2;
    }
    function bnpModInt(n2) {
      if (n2 <= 0) return 0;
      var d2 = this.DV % n2, r2 = this.s < 0 ? n2 - 1 : 0;
      if (this.t > 0)
        if (d2 == 0) r2 = this.data[0] % n2;
        else for (var i2 = this.t - 1; i2 >= 0; --i2) r2 = (d2 * r2 + this.data[i2]) % n2;
      return r2;
    }
    function bnModInverse(m2) {
      if (this.signum() == 0) {
        return BigInteger.ZERO;
      }
      var ac = m2.isEven();
      if (this.isEven() && ac || m2.signum() == 0) return BigInteger.ZERO;
      var u2 = m2.clone(), v2 = this.clone();
      var a2 = nbv(1), b2 = nbv(0), c2 = nbv(0), d2 = nbv(1);
      while (u2.signum() != 0) {
        while (u2.isEven()) {
          u2.rShiftTo(1, u2);
          if (ac) {
            if (!a2.isEven() || !b2.isEven()) {
              a2.addTo(this, a2);
              b2.subTo(m2, b2);
            }
            a2.rShiftTo(1, a2);
          } else if (!b2.isEven()) b2.subTo(m2, b2);
          b2.rShiftTo(1, b2);
        }
        while (v2.isEven()) {
          v2.rShiftTo(1, v2);
          if (ac) {
            if (!c2.isEven() || !d2.isEven()) {
              c2.addTo(this, c2);
              d2.subTo(m2, d2);
            }
            c2.rShiftTo(1, c2);
          } else if (!d2.isEven()) d2.subTo(m2, d2);
          d2.rShiftTo(1, d2);
        }
        if (u2.compareTo(v2) >= 0) {
          u2.subTo(v2, u2);
          if (ac) a2.subTo(c2, a2);
          b2.subTo(d2, b2);
        } else {
          v2.subTo(u2, v2);
          if (ac) c2.subTo(a2, c2);
          d2.subTo(b2, d2);
        }
      }
      if (v2.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
      if (d2.compareTo(m2) >= 0) return d2.subtract(m2);
      if (d2.signum() < 0) d2.addTo(m2, d2);
      else return d2;
      if (d2.signum() < 0) return d2.add(m2);
      else return d2;
    }
    var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
    var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];
    function bnIsProbablePrime(t2) {
      var i2, x2 = this.abs();
      if (x2.t == 1 && x2.data[0] <= lowprimes[lowprimes.length - 1]) {
        for (i2 = 0; i2 < lowprimes.length; ++i2)
          if (x2.data[0] == lowprimes[i2]) return true;
        return false;
      }
      if (x2.isEven()) return false;
      i2 = 1;
      while (i2 < lowprimes.length) {
        var m2 = lowprimes[i2], j2 = i2 + 1;
        while (j2 < lowprimes.length && m2 < lplim) m2 *= lowprimes[j2++];
        m2 = x2.modInt(m2);
        while (i2 < j2) if (m2 % lowprimes[i2++] == 0) return false;
      }
      return x2.millerRabin(t2);
    }
    function bnpMillerRabin(t2) {
      var n1 = this.subtract(BigInteger.ONE);
      var k2 = n1.getLowestSetBit();
      if (k2 <= 0) return false;
      var r2 = n1.shiftRight(k2);
      var prng = bnGetPrng();
      var a2;
      for (var i2 = 0; i2 < t2; ++i2) {
        do {
          a2 = new BigInteger(this.bitLength(), prng);
        } while (a2.compareTo(BigInteger.ONE) <= 0 || a2.compareTo(n1) >= 0);
        var y2 = a2.modPow(r2, this);
        if (y2.compareTo(BigInteger.ONE) != 0 && y2.compareTo(n1) != 0) {
          var j2 = 1;
          while (j2++ < k2 && y2.compareTo(n1) != 0) {
            y2 = y2.modPowInt(2, this);
            if (y2.compareTo(BigInteger.ONE) == 0) return false;
          }
          if (y2.compareTo(n1) != 0) return false;
        }
      }
      return true;
    }
    function bnGetPrng() {
      return {
        // x is an array to fill with bytes
        nextBytes: function(x2) {
          for (var i2 = 0; i2 < x2.length; ++i2) {
            x2[i2] = Math.floor(Math.random() * 256);
          }
        }
      };
    }
    BigInteger.prototype.chunkSize = bnpChunkSize;
    BigInteger.prototype.toRadix = bnpToRadix;
    BigInteger.prototype.fromRadix = bnpFromRadix;
    BigInteger.prototype.fromNumber = bnpFromNumber;
    BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
    BigInteger.prototype.changeBit = bnpChangeBit;
    BigInteger.prototype.addTo = bnpAddTo;
    BigInteger.prototype.dMultiply = bnpDMultiply;
    BigInteger.prototype.dAddOffset = bnpDAddOffset;
    BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
    BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
    BigInteger.prototype.modInt = bnpModInt;
    BigInteger.prototype.millerRabin = bnpMillerRabin;
    BigInteger.prototype.clone = bnClone;
    BigInteger.prototype.intValue = bnIntValue;
    BigInteger.prototype.byteValue = bnByteValue;
    BigInteger.prototype.shortValue = bnShortValue;
    BigInteger.prototype.signum = bnSigNum;
    BigInteger.prototype.toByteArray = bnToByteArray;
    BigInteger.prototype.equals = bnEquals;
    BigInteger.prototype.min = bnMin;
    BigInteger.prototype.max = bnMax;
    BigInteger.prototype.and = bnAnd;
    BigInteger.prototype.or = bnOr;
    BigInteger.prototype.xor = bnXor;
    BigInteger.prototype.andNot = bnAndNot;
    BigInteger.prototype.not = bnNot;
    BigInteger.prototype.shiftLeft = bnShiftLeft;
    BigInteger.prototype.shiftRight = bnShiftRight;
    BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
    BigInteger.prototype.bitCount = bnBitCount;
    BigInteger.prototype.testBit = bnTestBit;
    BigInteger.prototype.setBit = bnSetBit;
    BigInteger.prototype.clearBit = bnClearBit;
    BigInteger.prototype.flipBit = bnFlipBit;
    BigInteger.prototype.add = bnAdd;
    BigInteger.prototype.subtract = bnSubtract;
    BigInteger.prototype.multiply = bnMultiply;
    BigInteger.prototype.divide = bnDivide;
    BigInteger.prototype.remainder = bnRemainder;
    BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
    BigInteger.prototype.modPow = bnModPow;
    BigInteger.prototype.modInverse = bnModInverse;
    BigInteger.prototype.pow = bnPow;
    BigInteger.prototype.gcd = bnGCD;
    BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
    BigInteger.prototype.square = bnSquare;
  }
});

// node_modules/node-forge/lib/sha1.js
var require_sha1 = __commonJS({
  "node_modules/node-forge/lib/sha1.js"(exports2, module2) {
    var forge = require_forge();
    require_md();
    require_util();
    var sha1 = module2.exports = forge.sha1 = forge.sha1 || {};
    forge.md.sha1 = forge.md.algorithms.sha1 = sha1;
    sha1.create = function() {
      if (!_initialized) {
        _init();
      }
      var _state = null;
      var _input = forge.util.createBuffer();
      var _w = new Array(80);
      var md = {
        algorithm: "sha1",
        blockLength: 64,
        digestLength: 20,
        // 56-bit length of message so far (does not including padding)
        messageLength: 0,
        // true message length
        fullMessageLength: null,
        // size of message length in bytes
        messageLengthSize: 8
      };
      md.start = function() {
        md.messageLength = 0;
        md.fullMessageLength = md.messageLength64 = [];
        var int32s = md.messageLengthSize / 4;
        for (var i2 = 0; i2 < int32s; ++i2) {
          md.fullMessageLength.push(0);
        }
        _input = forge.util.createBuffer();
        _state = {
          h0: 1732584193,
          h1: 4023233417,
          h2: 2562383102,
          h3: 271733878,
          h4: 3285377520
        };
        return md;
      };
      md.start();
      md.update = function(msg, encoding) {
        if (encoding === "utf8") {
          msg = forge.util.encodeUtf8(msg);
        }
        var len = msg.length;
        md.messageLength += len;
        len = [len / 4294967296 >>> 0, len >>> 0];
        for (var i2 = md.fullMessageLength.length - 1; i2 >= 0; --i2) {
          md.fullMessageLength[i2] += len[1];
          len[1] = len[0] + (md.fullMessageLength[i2] / 4294967296 >>> 0);
          md.fullMessageLength[i2] = md.fullMessageLength[i2] >>> 0;
          len[0] = len[1] / 4294967296 >>> 0;
        }
        _input.putBytes(msg);
        _update(_state, _w, _input);
        if (_input.read > 2048 || _input.length() === 0) {
          _input.compact();
        }
        return md;
      };
      md.digest = function() {
        var finalBlock = forge.util.createBuffer();
        finalBlock.putBytes(_input.bytes());
        var remaining = md.fullMessageLength[md.fullMessageLength.length - 1] + md.messageLengthSize;
        var overflow = remaining & md.blockLength - 1;
        finalBlock.putBytes(_padding.substr(0, md.blockLength - overflow));
        var next, carry;
        var bits = md.fullMessageLength[0] * 8;
        for (var i2 = 0; i2 < md.fullMessageLength.length - 1; ++i2) {
          next = md.fullMessageLength[i2 + 1] * 8;
          carry = next / 4294967296 >>> 0;
          bits += carry;
          finalBlock.putInt32(bits >>> 0);
          bits = next >>> 0;
        }
        finalBlock.putInt32(bits);
        var s2 = {
          h0: _state.h0,
          h1: _state.h1,
          h2: _state.h2,
          h3: _state.h3,
          h4: _state.h4
        };
        _update(s2, _w, finalBlock);
        var rval = forge.util.createBuffer();
        rval.putInt32(s2.h0);
        rval.putInt32(s2.h1);
        rval.putInt32(s2.h2);
        rval.putInt32(s2.h3);
        rval.putInt32(s2.h4);
        return rval;
      };
      return md;
    };
    var _padding = null;
    var _initialized = false;
    function _init() {
      _padding = String.fromCharCode(128);
      _padding += forge.util.fillString(String.fromCharCode(0), 64);
      _initialized = true;
    }
    function _update(s2, w2, bytes) {
      var t2, a2, b2, c2, d2, e2, f2, i2;
      var len = bytes.length();
      while (len >= 64) {
        a2 = s2.h0;
        b2 = s2.h1;
        c2 = s2.h2;
        d2 = s2.h3;
        e2 = s2.h4;
        for (i2 = 0; i2 < 16; ++i2) {
          t2 = bytes.getInt32();
          w2[i2] = t2;
          f2 = d2 ^ b2 & (c2 ^ d2);
          t2 = (a2 << 5 | a2 >>> 27) + f2 + e2 + 1518500249 + t2;
          e2 = d2;
          d2 = c2;
          c2 = (b2 << 30 | b2 >>> 2) >>> 0;
          b2 = a2;
          a2 = t2;
        }
        for (; i2 < 20; ++i2) {
          t2 = w2[i2 - 3] ^ w2[i2 - 8] ^ w2[i2 - 14] ^ w2[i2 - 16];
          t2 = t2 << 1 | t2 >>> 31;
          w2[i2] = t2;
          f2 = d2 ^ b2 & (c2 ^ d2);
          t2 = (a2 << 5 | a2 >>> 27) + f2 + e2 + 1518500249 + t2;
          e2 = d2;
          d2 = c2;
          c2 = (b2 << 30 | b2 >>> 2) >>> 0;
          b2 = a2;
          a2 = t2;
        }
        for (; i2 < 32; ++i2) {
          t2 = w2[i2 - 3] ^ w2[i2 - 8] ^ w2[i2 - 14] ^ w2[i2 - 16];
          t2 = t2 << 1 | t2 >>> 31;
          w2[i2] = t2;
          f2 = b2 ^ c2 ^ d2;
          t2 = (a2 << 5 | a2 >>> 27) + f2 + e2 + 1859775393 + t2;
          e2 = d2;
          d2 = c2;
          c2 = (b2 << 30 | b2 >>> 2) >>> 0;
          b2 = a2;
          a2 = t2;
        }
        for (; i2 < 40; ++i2) {
          t2 = w2[i2 - 6] ^ w2[i2 - 16] ^ w2[i2 - 28] ^ w2[i2 - 32];
          t2 = t2 << 2 | t2 >>> 30;
          w2[i2] = t2;
          f2 = b2 ^ c2 ^ d2;
          t2 = (a2 << 5 | a2 >>> 27) + f2 + e2 + 1859775393 + t2;
          e2 = d2;
          d2 = c2;
          c2 = (b2 << 30 | b2 >>> 2) >>> 0;
          b2 = a2;
          a2 = t2;
        }
        for (; i2 < 60; ++i2) {
          t2 = w2[i2 - 6] ^ w2[i2 - 16] ^ w2[i2 - 28] ^ w2[i2 - 32];
          t2 = t2 << 2 | t2 >>> 30;
          w2[i2] = t2;
          f2 = b2 & c2 | d2 & (b2 ^ c2);
          t2 = (a2 << 5 | a2 >>> 27) + f2 + e2 + 2400959708 + t2;
          e2 = d2;
          d2 = c2;
          c2 = (b2 << 30 | b2 >>> 2) >>> 0;
          b2 = a2;
          a2 = t2;
        }
        for (; i2 < 80; ++i2) {
          t2 = w2[i2 - 6] ^ w2[i2 - 16] ^ w2[i2 - 28] ^ w2[i2 - 32];
          t2 = t2 << 2 | t2 >>> 30;
          w2[i2] = t2;
          f2 = b2 ^ c2 ^ d2;
          t2 = (a2 << 5 | a2 >>> 27) + f2 + e2 + 3395469782 + t2;
          e2 = d2;
          d2 = c2;
          c2 = (b2 << 30 | b2 >>> 2) >>> 0;
          b2 = a2;
          a2 = t2;
        }
        s2.h0 = s2.h0 + a2 | 0;
        s2.h1 = s2.h1 + b2 | 0;
        s2.h2 = s2.h2 + c2 | 0;
        s2.h3 = s2.h3 + d2 | 0;
        s2.h4 = s2.h4 + e2 | 0;
        len -= 64;
      }
    }
  }
});

// node_modules/node-forge/lib/pkcs1.js
var require_pkcs1 = __commonJS({
  "node_modules/node-forge/lib/pkcs1.js"(exports2, module2) {
    var forge = require_forge();
    require_util();
    require_random();
    require_sha1();
    var pkcs1 = module2.exports = forge.pkcs1 = forge.pkcs1 || {};
    pkcs1.encode_rsa_oaep = function(key, message, options) {
      var label;
      var seed;
      var md;
      var mgf1Md;
      if (typeof options === "string") {
        label = options;
        seed = arguments[3] || void 0;
        md = arguments[4] || void 0;
      } else if (options) {
        label = options.label || void 0;
        seed = options.seed || void 0;
        md = options.md || void 0;
        if (options.mgf1 && options.mgf1.md) {
          mgf1Md = options.mgf1.md;
        }
      }
      if (!md) {
        md = forge.md.sha1.create();
      } else {
        md.start();
      }
      if (!mgf1Md) {
        mgf1Md = md;
      }
      var keyLength = Math.ceil(key.n.bitLength() / 8);
      var maxLength = keyLength - 2 * md.digestLength - 2;
      if (message.length > maxLength) {
        var error = new Error("RSAES-OAEP input message length is too long.");
        error.length = message.length;
        error.maxLength = maxLength;
        throw error;
      }
      if (!label) {
        label = "";
      }
      md.update(label, "raw");
      var lHash = md.digest();
      var PS = "";
      var PS_length = maxLength - message.length;
      for (var i2 = 0; i2 < PS_length; i2++) {
        PS += "\0";
      }
      var DB = lHash.getBytes() + PS + "" + message;
      if (!seed) {
        seed = forge.random.getBytes(md.digestLength);
      } else if (seed.length !== md.digestLength) {
        var error = new Error("Invalid RSAES-OAEP seed. The seed length must match the digest length.");
        error.seedLength = seed.length;
        error.digestLength = md.digestLength;
        throw error;
      }
      var dbMask = rsa_mgf1(seed, keyLength - md.digestLength - 1, mgf1Md);
      var maskedDB = forge.util.xorBytes(DB, dbMask, DB.length);
      var seedMask = rsa_mgf1(maskedDB, md.digestLength, mgf1Md);
      var maskedSeed = forge.util.xorBytes(seed, seedMask, seed.length);
      return "\0" + maskedSeed + maskedDB;
    };
    pkcs1.decode_rsa_oaep = function(key, em, options) {
      var label;
      var md;
      var mgf1Md;
      if (typeof options === "string") {
        label = options;
        md = arguments[3] || void 0;
      } else if (options) {
        label = options.label || void 0;
        md = options.md || void 0;
        if (options.mgf1 && options.mgf1.md) {
          mgf1Md = options.mgf1.md;
        }
      }
      var keyLength = Math.ceil(key.n.bitLength() / 8);
      if (em.length !== keyLength) {
        var error = new Error("RSAES-OAEP encoded message length is invalid.");
        error.length = em.length;
        error.expectedLength = keyLength;
        throw error;
      }
      if (md === void 0) {
        md = forge.md.sha1.create();
      } else {
        md.start();
      }
      if (!mgf1Md) {
        mgf1Md = md;
      }
      if (keyLength < 2 * md.digestLength + 2) {
        throw new Error("RSAES-OAEP key is too short for the hash function.");
      }
      if (!label) {
        label = "";
      }
      md.update(label, "raw");
      var lHash = md.digest().getBytes();
      var y2 = em.charAt(0);
      var maskedSeed = em.substring(1, md.digestLength + 1);
      var maskedDB = em.substring(1 + md.digestLength);
      var seedMask = rsa_mgf1(maskedDB, md.digestLength, mgf1Md);
      var seed = forge.util.xorBytes(maskedSeed, seedMask, maskedSeed.length);
      var dbMask = rsa_mgf1(seed, keyLength - md.digestLength - 1, mgf1Md);
      var db = forge.util.xorBytes(maskedDB, dbMask, maskedDB.length);
      var lHashPrime = db.substring(0, md.digestLength);
      var error = y2 !== "\0";
      for (var i2 = 0; i2 < md.digestLength; ++i2) {
        error |= lHash.charAt(i2) !== lHashPrime.charAt(i2);
      }
      var in_ps = 1;
      var index = md.digestLength;
      for (var j2 = md.digestLength; j2 < db.length; j2++) {
        var code = db.charCodeAt(j2);
        var is_0 = code & 1 ^ 1;
        var error_mask = in_ps ? 65534 : 0;
        error |= code & error_mask;
        in_ps = in_ps & is_0;
        index += in_ps;
      }
      if (error || db.charCodeAt(index) !== 1) {
        throw new Error("Invalid RSAES-OAEP padding.");
      }
      return db.substring(index + 1);
    };
    function rsa_mgf1(seed, maskLength, hash) {
      if (!hash) {
        hash = forge.md.sha1.create();
      }
      var t2 = "";
      var count = Math.ceil(maskLength / hash.digestLength);
      for (var i2 = 0; i2 < count; ++i2) {
        var c2 = String.fromCharCode(
          i2 >> 24 & 255,
          i2 >> 16 & 255,
          i2 >> 8 & 255,
          i2 & 255
        );
        hash.start();
        hash.update(seed + c2);
        t2 += hash.digest().getBytes();
      }
      return t2.substring(0, maskLength);
    }
  }
});

// node_modules/node-forge/lib/prime.js
var require_prime = __commonJS({
  "node_modules/node-forge/lib/prime.js"(exports2, module2) {
    var forge = require_forge();
    require_util();
    require_jsbn();
    require_random();
    (function() {
      if (forge.prime) {
        module2.exports = forge.prime;
        return;
      }
      var prime = module2.exports = forge.prime = forge.prime || {};
      var BigInteger = forge.jsbn.BigInteger;
      var GCD_30_DELTA = [6, 4, 2, 4, 2, 4, 6, 2];
      var THIRTY = new BigInteger(null);
      THIRTY.fromInt(30);
      var op_or = function(x2, y2) {
        return x2 | y2;
      };
      prime.generateProbablePrime = function(bits, options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        options = options || {};
        var algorithm = options.algorithm || "PRIMEINC";
        if (typeof algorithm === "string") {
          algorithm = { name: algorithm };
        }
        algorithm.options = algorithm.options || {};
        var prng = options.prng || forge.random;
        var rng = {
          // x is an array to fill with bytes
          nextBytes: function(x2) {
            var b2 = prng.getBytesSync(x2.length);
            for (var i2 = 0; i2 < x2.length; ++i2) {
              x2[i2] = b2.charCodeAt(i2);
            }
          }
        };
        if (algorithm.name === "PRIMEINC") {
          return primeincFindPrime(bits, rng, algorithm.options, callback);
        }
        throw new Error("Invalid prime generation algorithm: " + algorithm.name);
      };
      function primeincFindPrime(bits, rng, options, callback) {
        if ("workers" in options) {
          return primeincFindPrimeWithWorkers(bits, rng, options, callback);
        }
        return primeincFindPrimeWithoutWorkers(bits, rng, options, callback);
      }
      function primeincFindPrimeWithoutWorkers(bits, rng, options, callback) {
        var num = generateRandom(bits, rng);
        var deltaIdx = 0;
        var mrTests = getMillerRabinTests(num.bitLength());
        if ("millerRabinTests" in options) {
          mrTests = options.millerRabinTests;
        }
        var maxBlockTime = 10;
        if ("maxBlockTime" in options) {
          maxBlockTime = options.maxBlockTime;
        }
        _primeinc(num, bits, rng, deltaIdx, mrTests, maxBlockTime, callback);
      }
      function _primeinc(num, bits, rng, deltaIdx, mrTests, maxBlockTime, callback) {
        var start = +/* @__PURE__ */ new Date();
        do {
          if (num.bitLength() > bits) {
            num = generateRandom(bits, rng);
          }
          if (num.isProbablePrime(mrTests)) {
            return callback(null, num);
          }
          num.dAddOffset(GCD_30_DELTA[deltaIdx++ % 8], 0);
        } while (maxBlockTime < 0 || +/* @__PURE__ */ new Date() - start < maxBlockTime);
        forge.util.setImmediate(function() {
          _primeinc(num, bits, rng, deltaIdx, mrTests, maxBlockTime, callback);
        });
      }
      function primeincFindPrimeWithWorkers(bits, rng, options, callback) {
        if (typeof Worker === "undefined") {
          return primeincFindPrimeWithoutWorkers(bits, rng, options, callback);
        }
        var num = generateRandom(bits, rng);
        var numWorkers = options.workers;
        var workLoad = options.workLoad || 100;
        var range = workLoad * 30 / 8;
        var workerScript = options.workerScript || "forge/prime.worker.js";
        if (numWorkers === -1) {
          return forge.util.estimateCores(function(err, cores) {
            if (err) {
              cores = 2;
            }
            numWorkers = cores - 1;
            generate();
          });
        }
        generate();
        function generate() {
          numWorkers = Math.max(1, numWorkers);
          var workers = [];
          for (var i2 = 0; i2 < numWorkers; ++i2) {
            workers[i2] = new Worker(workerScript);
          }
          var running = numWorkers;
          for (var i2 = 0; i2 < numWorkers; ++i2) {
            workers[i2].addEventListener("message", workerMessage);
          }
          var found = false;
          function workerMessage(e2) {
            if (found) {
              return;
            }
            --running;
            var data = e2.data;
            if (data.found) {
              for (var i3 = 0; i3 < workers.length; ++i3) {
                workers[i3].terminate();
              }
              found = true;
              return callback(null, new BigInteger(data.prime, 16));
            }
            if (num.bitLength() > bits) {
              num = generateRandom(bits, rng);
            }
            var hex = num.toString(16);
            e2.target.postMessage({
              hex,
              workLoad
            });
            num.dAddOffset(range, 0);
          }
        }
      }
      function generateRandom(bits, rng) {
        var num = new BigInteger(bits, rng);
        var bits1 = bits - 1;
        if (!num.testBit(bits1)) {
          num.bitwiseTo(BigInteger.ONE.shiftLeft(bits1), op_or, num);
        }
        num.dAddOffset(31 - num.mod(THIRTY).byteValue(), 0);
        return num;
      }
      function getMillerRabinTests(bits) {
        if (bits <= 100) return 27;
        if (bits <= 150) return 18;
        if (bits <= 200) return 15;
        if (bits <= 250) return 12;
        if (bits <= 300) return 9;
        if (bits <= 350) return 8;
        if (bits <= 400) return 7;
        if (bits <= 500) return 6;
        if (bits <= 600) return 5;
        if (bits <= 800) return 4;
        if (bits <= 1250) return 3;
        return 2;
      }
    })();
  }
});

// node_modules/node-forge/lib/rsa.js
var require_rsa = __commonJS({
  "node_modules/node-forge/lib/rsa.js"(exports2, module2) {
    var forge = require_forge();
    require_asn1();
    require_jsbn();
    require_oids();
    require_pkcs1();
    require_prime();
    require_random();
    require_util();
    if (typeof BigInteger === "undefined") {
      BigInteger = forge.jsbn.BigInteger;
    }
    var BigInteger;
    var _crypto = forge.util.isNodejs ? require("crypto") : null;
    var asn1 = forge.asn1;
    var util = forge.util;
    forge.pki = forge.pki || {};
    module2.exports = forge.pki.rsa = forge.rsa = forge.rsa || {};
    var pki = forge.pki;
    var GCD_30_DELTA = [6, 4, 2, 4, 2, 4, 6, 2];
    var privateKeyValidator = {
      // PrivateKeyInfo
      name: "PrivateKeyInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        // Version (INTEGER)
        name: "PrivateKeyInfo.version",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "privateKeyVersion"
      }, {
        // privateKeyAlgorithm
        name: "PrivateKeyInfo.privateKeyAlgorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "AlgorithmIdentifier.algorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "privateKeyOid"
        }]
      }, {
        // PrivateKey
        name: "PrivateKeyInfo",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OCTETSTRING,
        constructed: false,
        capture: "privateKey"
      }]
    };
    var rsaPrivateKeyValidator = {
      // RSAPrivateKey
      name: "RSAPrivateKey",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        // Version (INTEGER)
        name: "RSAPrivateKey.version",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "privateKeyVersion"
      }, {
        // modulus (n)
        name: "RSAPrivateKey.modulus",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "privateKeyModulus"
      }, {
        // publicExponent (e)
        name: "RSAPrivateKey.publicExponent",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "privateKeyPublicExponent"
      }, {
        // privateExponent (d)
        name: "RSAPrivateKey.privateExponent",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "privateKeyPrivateExponent"
      }, {
        // prime1 (p)
        name: "RSAPrivateKey.prime1",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "privateKeyPrime1"
      }, {
        // prime2 (q)
        name: "RSAPrivateKey.prime2",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "privateKeyPrime2"
      }, {
        // exponent1 (d mod (p-1))
        name: "RSAPrivateKey.exponent1",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "privateKeyExponent1"
      }, {
        // exponent2 (d mod (q-1))
        name: "RSAPrivateKey.exponent2",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "privateKeyExponent2"
      }, {
        // coefficient ((inverse of q) mod p)
        name: "RSAPrivateKey.coefficient",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "privateKeyCoefficient"
      }]
    };
    var rsaPublicKeyValidator = {
      // RSAPublicKey
      name: "RSAPublicKey",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        // modulus (n)
        name: "RSAPublicKey.modulus",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "publicKeyModulus"
      }, {
        // publicExponent (e)
        name: "RSAPublicKey.exponent",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "publicKeyExponent"
      }]
    };
    var publicKeyValidator = forge.pki.rsa.publicKeyValidator = {
      name: "SubjectPublicKeyInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      captureAsn1: "subjectPublicKeyInfo",
      value: [{
        name: "SubjectPublicKeyInfo.AlgorithmIdentifier",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "AlgorithmIdentifier.algorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "publicKeyOid"
        }]
      }, {
        // subjectPublicKey
        name: "SubjectPublicKeyInfo.subjectPublicKey",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.BITSTRING,
        constructed: false,
        value: [{
          // RSAPublicKey
          name: "SubjectPublicKeyInfo.subjectPublicKey.RSAPublicKey",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.SEQUENCE,
          constructed: true,
          optional: true,
          captureAsn1: "rsaPublicKey"
        }]
      }]
    };
    var digestInfoValidator = {
      name: "DigestInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "DigestInfo.DigestAlgorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "DigestInfo.DigestAlgorithm.algorithmIdentifier",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "algorithmIdentifier"
        }, {
          // NULL parameters
          name: "DigestInfo.DigestAlgorithm.parameters",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.NULL,
          // captured only to check existence for md2 and md5
          capture: "parameters",
          optional: true,
          constructed: false
        }]
      }, {
        // digest
        name: "DigestInfo.digest",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OCTETSTRING,
        constructed: false,
        capture: "digest"
      }]
    };
    var emsaPkcs1v15encode = function(md) {
      var oid;
      if (md.algorithm in pki.oids) {
        oid = pki.oids[md.algorithm];
      } else {
        var error = new Error("Unknown message digest algorithm.");
        error.algorithm = md.algorithm;
        throw error;
      }
      var oidBytes = asn1.oidToDer(oid).getBytes();
      var digestInfo = asn1.create(
        asn1.Class.UNIVERSAL,
        asn1.Type.SEQUENCE,
        true,
        []
      );
      var digestAlgorithm = asn1.create(
        asn1.Class.UNIVERSAL,
        asn1.Type.SEQUENCE,
        true,
        []
      );
      digestAlgorithm.value.push(asn1.create(
        asn1.Class.UNIVERSAL,
        asn1.Type.OID,
        false,
        oidBytes
      ));
      digestAlgorithm.value.push(asn1.create(
        asn1.Class.UNIVERSAL,
        asn1.Type.NULL,
        false,
        ""
      ));
      var digest = asn1.create(
        asn1.Class.UNIVERSAL,
        asn1.Type.OCTETSTRING,
        false,
        md.digest().getBytes()
      );
      digestInfo.value.push(digestAlgorithm);
      digestInfo.value.push(digest);
      return asn1.toDer(digestInfo).getBytes();
    };
    var _modPow = function(x2, key, pub) {
      if (pub) {
        return x2.modPow(key.e, key.n);
      }
      if (!key.p || !key.q) {
        return x2.modPow(key.d, key.n);
      }
      if (!key.dP) {
        key.dP = key.d.mod(key.p.subtract(BigInteger.ONE));
      }
      if (!key.dQ) {
        key.dQ = key.d.mod(key.q.subtract(BigInteger.ONE));
      }
      if (!key.qInv) {
        key.qInv = key.q.modInverse(key.p);
      }
      var r2;
      do {
        r2 = new BigInteger(
          forge.util.bytesToHex(forge.random.getBytes(key.n.bitLength() / 8)),
          16
        );
      } while (r2.compareTo(key.n) >= 0 || !r2.gcd(key.n).equals(BigInteger.ONE));
      x2 = x2.multiply(r2.modPow(key.e, key.n)).mod(key.n);
      var xp = x2.mod(key.p).modPow(key.dP, key.p);
      var xq = x2.mod(key.q).modPow(key.dQ, key.q);
      while (xp.compareTo(xq) < 0) {
        xp = xp.add(key.p);
      }
      var y2 = xp.subtract(xq).multiply(key.qInv).mod(key.p).multiply(key.q).add(xq);
      y2 = y2.multiply(r2.modInverse(key.n)).mod(key.n);
      return y2;
    };
    pki.rsa.encrypt = function(m2, key, bt) {
      var pub = bt;
      var eb;
      var k2 = Math.ceil(key.n.bitLength() / 8);
      if (bt !== false && bt !== true) {
        pub = bt === 2;
        eb = _encodePkcs1_v1_5(m2, key, bt);
      } else {
        eb = forge.util.createBuffer();
        eb.putBytes(m2);
      }
      var x2 = new BigInteger(eb.toHex(), 16);
      var y2 = _modPow(x2, key, pub);
      var yhex = y2.toString(16);
      var ed = forge.util.createBuffer();
      var zeros = k2 - Math.ceil(yhex.length / 2);
      while (zeros > 0) {
        ed.putByte(0);
        --zeros;
      }
      ed.putBytes(forge.util.hexToBytes(yhex));
      return ed.getBytes();
    };
    pki.rsa.decrypt = function(ed, key, pub, ml) {
      var k2 = Math.ceil(key.n.bitLength() / 8);
      if (ed.length !== k2) {
        var error = new Error("Encrypted message length is invalid.");
        error.length = ed.length;
        error.expected = k2;
        throw error;
      }
      var y2 = new BigInteger(forge.util.createBuffer(ed).toHex(), 16);
      if (y2.compareTo(key.n) >= 0) {
        throw new Error("Encrypted message is invalid.");
      }
      var x2 = _modPow(y2, key, pub);
      var xhex = x2.toString(16);
      var eb = forge.util.createBuffer();
      var zeros = k2 - Math.ceil(xhex.length / 2);
      while (zeros > 0) {
        eb.putByte(0);
        --zeros;
      }
      eb.putBytes(forge.util.hexToBytes(xhex));
      if (ml !== false) {
        return _decodePkcs1_v1_5(eb.getBytes(), key, pub);
      }
      return eb.getBytes();
    };
    pki.rsa.createKeyPairGenerationState = function(bits, e2, options) {
      if (typeof bits === "string") {
        bits = parseInt(bits, 10);
      }
      bits = bits || 2048;
      options = options || {};
      var prng = options.prng || forge.random;
      var rng = {
        // x is an array to fill with bytes
        nextBytes: function(x2) {
          var b2 = prng.getBytesSync(x2.length);
          for (var i2 = 0; i2 < x2.length; ++i2) {
            x2[i2] = b2.charCodeAt(i2);
          }
        }
      };
      var algorithm = options.algorithm || "PRIMEINC";
      var rval;
      if (algorithm === "PRIMEINC") {
        rval = {
          algorithm,
          state: 0,
          bits,
          rng,
          eInt: e2 || 65537,
          e: new BigInteger(null),
          p: null,
          q: null,
          qBits: bits >> 1,
          pBits: bits - (bits >> 1),
          pqState: 0,
          num: null,
          keys: null
        };
        rval.e.fromInt(rval.eInt);
      } else {
        throw new Error("Invalid key generation algorithm: " + algorithm);
      }
      return rval;
    };
    pki.rsa.stepKeyPairGenerationState = function(state, n2) {
      if (!("algorithm" in state)) {
        state.algorithm = "PRIMEINC";
      }
      var THIRTY = new BigInteger(null);
      THIRTY.fromInt(30);
      var deltaIdx = 0;
      var op_or = function(x2, y2) {
        return x2 | y2;
      };
      var t1 = +/* @__PURE__ */ new Date();
      var t2;
      var total = 0;
      while (state.keys === null && (n2 <= 0 || total < n2)) {
        if (state.state === 0) {
          var bits = state.p === null ? state.pBits : state.qBits;
          var bits1 = bits - 1;
          if (state.pqState === 0) {
            state.num = new BigInteger(bits, state.rng);
            if (!state.num.testBit(bits1)) {
              state.num.bitwiseTo(
                BigInteger.ONE.shiftLeft(bits1),
                op_or,
                state.num
              );
            }
            state.num.dAddOffset(31 - state.num.mod(THIRTY).byteValue(), 0);
            deltaIdx = 0;
            ++state.pqState;
          } else if (state.pqState === 1) {
            if (state.num.bitLength() > bits) {
              state.pqState = 0;
            } else if (state.num.isProbablePrime(
              _getMillerRabinTests(state.num.bitLength())
            )) {
              ++state.pqState;
            } else {
              state.num.dAddOffset(GCD_30_DELTA[deltaIdx++ % 8], 0);
            }
          } else if (state.pqState === 2) {
            state.pqState = state.num.subtract(BigInteger.ONE).gcd(state.e).compareTo(BigInteger.ONE) === 0 ? 3 : 0;
          } else if (state.pqState === 3) {
            state.pqState = 0;
            if (state.p === null) {
              state.p = state.num;
            } else {
              state.q = state.num;
            }
            if (state.p !== null && state.q !== null) {
              ++state.state;
            }
            state.num = null;
          }
        } else if (state.state === 1) {
          if (state.p.compareTo(state.q) < 0) {
            state.num = state.p;
            state.p = state.q;
            state.q = state.num;
          }
          ++state.state;
        } else if (state.state === 2) {
          state.p1 = state.p.subtract(BigInteger.ONE);
          state.q1 = state.q.subtract(BigInteger.ONE);
          state.phi = state.p1.multiply(state.q1);
          ++state.state;
        } else if (state.state === 3) {
          if (state.phi.gcd(state.e).compareTo(BigInteger.ONE) === 0) {
            ++state.state;
          } else {
            state.p = null;
            state.q = null;
            state.state = 0;
          }
        } else if (state.state === 4) {
          state.n = state.p.multiply(state.q);
          if (state.n.bitLength() === state.bits) {
            ++state.state;
          } else {
            state.q = null;
            state.state = 0;
          }
        } else if (state.state === 5) {
          var d2 = state.e.modInverse(state.phi);
          state.keys = {
            privateKey: pki.rsa.setPrivateKey(
              state.n,
              state.e,
              d2,
              state.p,
              state.q,
              d2.mod(state.p1),
              d2.mod(state.q1),
              state.q.modInverse(state.p)
            ),
            publicKey: pki.rsa.setPublicKey(state.n, state.e)
          };
        }
        t2 = +/* @__PURE__ */ new Date();
        total += t2 - t1;
        t1 = t2;
      }
      return state.keys !== null;
    };
    pki.rsa.generateKeyPair = function(bits, e2, options, callback) {
      if (arguments.length === 1) {
        if (typeof bits === "object") {
          options = bits;
          bits = void 0;
        } else if (typeof bits === "function") {
          callback = bits;
          bits = void 0;
        }
      } else if (arguments.length === 2) {
        if (typeof bits === "number") {
          if (typeof e2 === "function") {
            callback = e2;
            e2 = void 0;
          } else if (typeof e2 !== "number") {
            options = e2;
            e2 = void 0;
          }
        } else {
          options = bits;
          callback = e2;
          bits = void 0;
          e2 = void 0;
        }
      } else if (arguments.length === 3) {
        if (typeof e2 === "number") {
          if (typeof options === "function") {
            callback = options;
            options = void 0;
          }
        } else {
          callback = options;
          options = e2;
          e2 = void 0;
        }
      }
      options = options || {};
      if (bits === void 0) {
        bits = options.bits || 2048;
      }
      if (e2 === void 0) {
        e2 = options.e || 65537;
      }
      if (!forge.options.usePureJavaScript && !options.prng && bits >= 256 && bits <= 16384 && (e2 === 65537 || e2 === 3)) {
        if (callback) {
          if (_detectNodeCrypto("generateKeyPair")) {
            return _crypto.generateKeyPair("rsa", {
              modulusLength: bits,
              publicExponent: e2,
              publicKeyEncoding: {
                type: "spki",
                format: "pem"
              },
              privateKeyEncoding: {
                type: "pkcs8",
                format: "pem"
              }
            }, function(err, pub, priv) {
              if (err) {
                return callback(err);
              }
              callback(null, {
                privateKey: pki.privateKeyFromPem(priv),
                publicKey: pki.publicKeyFromPem(pub)
              });
            });
          }
          if (_detectSubtleCrypto("generateKey") && _detectSubtleCrypto("exportKey")) {
            return util.globalScope.crypto.subtle.generateKey({
              name: "RSASSA-PKCS1-v1_5",
              modulusLength: bits,
              publicExponent: _intToUint8Array(e2),
              hash: { name: "SHA-256" }
            }, true, ["sign", "verify"]).then(function(pair) {
              return util.globalScope.crypto.subtle.exportKey(
                "pkcs8",
                pair.privateKey
              );
            }).then(void 0, function(err) {
              callback(err);
            }).then(function(pkcs8) {
              if (pkcs8) {
                var privateKey = pki.privateKeyFromAsn1(
                  asn1.fromDer(forge.util.createBuffer(pkcs8))
                );
                callback(null, {
                  privateKey,
                  publicKey: pki.setRsaPublicKey(privateKey.n, privateKey.e)
                });
              }
            });
          }
          if (_detectSubtleMsCrypto("generateKey") && _detectSubtleMsCrypto("exportKey")) {
            var genOp = util.globalScope.msCrypto.subtle.generateKey({
              name: "RSASSA-PKCS1-v1_5",
              modulusLength: bits,
              publicExponent: _intToUint8Array(e2),
              hash: { name: "SHA-256" }
            }, true, ["sign", "verify"]);
            genOp.oncomplete = function(e3) {
              var pair = e3.target.result;
              var exportOp = util.globalScope.msCrypto.subtle.exportKey(
                "pkcs8",
                pair.privateKey
              );
              exportOp.oncomplete = function(e4) {
                var pkcs8 = e4.target.result;
                var privateKey = pki.privateKeyFromAsn1(
                  asn1.fromDer(forge.util.createBuffer(pkcs8))
                );
                callback(null, {
                  privateKey,
                  publicKey: pki.setRsaPublicKey(privateKey.n, privateKey.e)
                });
              };
              exportOp.onerror = function(err) {
                callback(err);
              };
            };
            genOp.onerror = function(err) {
              callback(err);
            };
            return;
          }
        } else {
          if (_detectNodeCrypto("generateKeyPairSync")) {
            var keypair = _crypto.generateKeyPairSync("rsa", {
              modulusLength: bits,
              publicExponent: e2,
              publicKeyEncoding: {
                type: "spki",
                format: "pem"
              },
              privateKeyEncoding: {
                type: "pkcs8",
                format: "pem"
              }
            });
            return {
              privateKey: pki.privateKeyFromPem(keypair.privateKey),
              publicKey: pki.publicKeyFromPem(keypair.publicKey)
            };
          }
        }
      }
      var state = pki.rsa.createKeyPairGenerationState(bits, e2, options);
      if (!callback) {
        pki.rsa.stepKeyPairGenerationState(state, 0);
        return state.keys;
      }
      _generateKeyPair(state, options, callback);
    };
    pki.setRsaPublicKey = pki.rsa.setPublicKey = function(n2, e2) {
      var key = {
        n: n2,
        e: e2
      };
      key.encrypt = function(data, scheme, schemeOptions) {
        if (typeof scheme === "string") {
          scheme = scheme.toUpperCase();
        } else if (scheme === void 0) {
          scheme = "RSAES-PKCS1-V1_5";
        }
        if (scheme === "RSAES-PKCS1-V1_5") {
          scheme = {
            encode: function(m2, key2, pub) {
              return _encodePkcs1_v1_5(m2, key2, 2).getBytes();
            }
          };
        } else if (scheme === "RSA-OAEP" || scheme === "RSAES-OAEP") {
          scheme = {
            encode: function(m2, key2) {
              return forge.pkcs1.encode_rsa_oaep(key2, m2, schemeOptions);
            }
          };
        } else if (["RAW", "NONE", "NULL", null].indexOf(scheme) !== -1) {
          scheme = { encode: function(e4) {
            return e4;
          } };
        } else if (typeof scheme === "string") {
          throw new Error('Unsupported encryption scheme: "' + scheme + '".');
        }
        var e3 = scheme.encode(data, key, true);
        return pki.rsa.encrypt(e3, key, true);
      };
      key.verify = function(digest, signature, scheme, options) {
        if (typeof scheme === "string") {
          scheme = scheme.toUpperCase();
        } else if (scheme === void 0) {
          scheme = "RSASSA-PKCS1-V1_5";
        }
        if (options === void 0) {
          options = {
            _parseAllDigestBytes: true,
            _skipPaddingChecks: false
          };
        }
        if (!("_parseAllDigestBytes" in options)) {
          options._parseAllDigestBytes = true;
        }
        if (!("_skipPaddingChecks" in options)) {
          options._skipPaddingChecks = false;
        }
        if (scheme === "RSASSA-PKCS1-V1_5") {
          scheme = {
            verify: function(digest2, d3) {
              d3 = _decodePkcs1_v1_5(d3, key, true, void 0, options);
              var obj = asn1.fromDer(d3, {
                parseAllBytes: options._parseAllDigestBytes
              });
              var capture = {};
              var errors = [];
              if (!asn1.validate(obj, digestInfoValidator, capture, errors) || obj.value.length !== 2) {
                var error = new Error(
                  "ASN.1 object does not contain a valid RSASSA-PKCS1-v1_5 DigestInfo value."
                );
                error.errors = errors;
                throw error;
              }
              var oid = asn1.derToOid(capture.algorithmIdentifier);
              if (!(oid === forge.oids.md2 || oid === forge.oids.md5 || oid === forge.oids.sha1 || oid === forge.oids.sha224 || oid === forge.oids.sha256 || oid === forge.oids.sha384 || oid === forge.oids.sha512 || oid === forge.oids["sha512-224"] || oid === forge.oids["sha512-256"])) {
                var error = new Error(
                  "Unknown RSASSA-PKCS1-v1_5 DigestAlgorithm identifier."
                );
                error.oid = oid;
                throw error;
              }
              if (oid === forge.oids.md2 || oid === forge.oids.md5) {
                if (!("parameters" in capture)) {
                  throw new Error(
                    "ASN.1 object does not contain a valid RSASSA-PKCS1-v1_5 DigestInfo value. Missing algorithm identifier NULL parameters."
                  );
                }
              }
              return digest2 === capture.digest;
            }
          };
        } else if (scheme === "NONE" || scheme === "NULL" || scheme === null) {
          scheme = {
            verify: function(digest2, d3) {
              d3 = _decodePkcs1_v1_5(d3, key, true, void 0, options);
              return digest2 === d3;
            }
          };
        }
        var d2 = pki.rsa.decrypt(signature, key, true, false);
        return scheme.verify(digest, d2, key.n.bitLength());
      };
      return key;
    };
    pki.setRsaPrivateKey = pki.rsa.setPrivateKey = function(n2, e2, d2, p2, q2, dP, dQ, qInv) {
      var key = {
        n: n2,
        e: e2,
        d: d2,
        p: p2,
        q: q2,
        dP,
        dQ,
        qInv
      };
      key.decrypt = function(data, scheme, schemeOptions) {
        if (typeof scheme === "string") {
          scheme = scheme.toUpperCase();
        } else if (scheme === void 0) {
          scheme = "RSAES-PKCS1-V1_5";
        }
        var d3 = pki.rsa.decrypt(data, key, false, false);
        if (scheme === "RSAES-PKCS1-V1_5") {
          scheme = { decode: _decodePkcs1_v1_5 };
        } else if (scheme === "RSA-OAEP" || scheme === "RSAES-OAEP") {
          scheme = {
            decode: function(d4, key2) {
              return forge.pkcs1.decode_rsa_oaep(key2, d4, schemeOptions);
            }
          };
        } else if (["RAW", "NONE", "NULL", null].indexOf(scheme) !== -1) {
          scheme = { decode: function(d4) {
            return d4;
          } };
        } else {
          throw new Error('Unsupported encryption scheme: "' + scheme + '".');
        }
        return scheme.decode(d3, key, false);
      };
      key.sign = function(md, scheme) {
        var bt = false;
        if (typeof scheme === "string") {
          scheme = scheme.toUpperCase();
        }
        if (scheme === void 0 || scheme === "RSASSA-PKCS1-V1_5") {
          scheme = { encode: emsaPkcs1v15encode };
          bt = 1;
        } else if (scheme === "NONE" || scheme === "NULL" || scheme === null) {
          scheme = { encode: function() {
            return md;
          } };
          bt = 1;
        }
        var d3 = scheme.encode(md, key.n.bitLength());
        return pki.rsa.encrypt(d3, key, bt);
      };
      return key;
    };
    pki.wrapRsaPrivateKey = function(rsaKey) {
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // version (0)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          asn1.integerToDer(0).getBytes()
        ),
        // privateKeyAlgorithm
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OID,
            false,
            asn1.oidToDer(pki.oids.rsaEncryption).getBytes()
          ),
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")
        ]),
        // PrivateKey
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OCTETSTRING,
          false,
          asn1.toDer(rsaKey).getBytes()
        )
      ]);
    };
    pki.privateKeyFromAsn1 = function(obj) {
      var capture = {};
      var errors = [];
      if (asn1.validate(obj, privateKeyValidator, capture, errors)) {
        obj = asn1.fromDer(forge.util.createBuffer(capture.privateKey));
      }
      capture = {};
      errors = [];
      if (!asn1.validate(obj, rsaPrivateKeyValidator, capture, errors)) {
        var error = new Error("Cannot read private key. ASN.1 object does not contain an RSAPrivateKey.");
        error.errors = errors;
        throw error;
      }
      var n2, e2, d2, p2, q2, dP, dQ, qInv;
      n2 = forge.util.createBuffer(capture.privateKeyModulus).toHex();
      e2 = forge.util.createBuffer(capture.privateKeyPublicExponent).toHex();
      d2 = forge.util.createBuffer(capture.privateKeyPrivateExponent).toHex();
      p2 = forge.util.createBuffer(capture.privateKeyPrime1).toHex();
      q2 = forge.util.createBuffer(capture.privateKeyPrime2).toHex();
      dP = forge.util.createBuffer(capture.privateKeyExponent1).toHex();
      dQ = forge.util.createBuffer(capture.privateKeyExponent2).toHex();
      qInv = forge.util.createBuffer(capture.privateKeyCoefficient).toHex();
      return pki.setRsaPrivateKey(
        new BigInteger(n2, 16),
        new BigInteger(e2, 16),
        new BigInteger(d2, 16),
        new BigInteger(p2, 16),
        new BigInteger(q2, 16),
        new BigInteger(dP, 16),
        new BigInteger(dQ, 16),
        new BigInteger(qInv, 16)
      );
    };
    pki.privateKeyToAsn1 = pki.privateKeyToRSAPrivateKey = function(key) {
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // version (0 = only 2 primes, 1 multiple primes)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          asn1.integerToDer(0).getBytes()
        ),
        // modulus (n)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          _bnToBytes(key.n)
        ),
        // publicExponent (e)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          _bnToBytes(key.e)
        ),
        // privateExponent (d)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          _bnToBytes(key.d)
        ),
        // privateKeyPrime1 (p)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          _bnToBytes(key.p)
        ),
        // privateKeyPrime2 (q)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          _bnToBytes(key.q)
        ),
        // privateKeyExponent1 (dP)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          _bnToBytes(key.dP)
        ),
        // privateKeyExponent2 (dQ)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          _bnToBytes(key.dQ)
        ),
        // coefficient (qInv)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          _bnToBytes(key.qInv)
        )
      ]);
    };
    pki.publicKeyFromAsn1 = function(obj) {
      var capture = {};
      var errors = [];
      if (asn1.validate(obj, publicKeyValidator, capture, errors)) {
        var oid = asn1.derToOid(capture.publicKeyOid);
        if (oid !== pki.oids.rsaEncryption) {
          var error = new Error("Cannot read public key. Unknown OID.");
          error.oid = oid;
          throw error;
        }
        obj = capture.rsaPublicKey;
      }
      errors = [];
      if (!asn1.validate(obj, rsaPublicKeyValidator, capture, errors)) {
        var error = new Error("Cannot read public key. ASN.1 object does not contain an RSAPublicKey.");
        error.errors = errors;
        throw error;
      }
      var n2 = forge.util.createBuffer(capture.publicKeyModulus).toHex();
      var e2 = forge.util.createBuffer(capture.publicKeyExponent).toHex();
      return pki.setRsaPublicKey(
        new BigInteger(n2, 16),
        new BigInteger(e2, 16)
      );
    };
    pki.publicKeyToAsn1 = pki.publicKeyToSubjectPublicKeyInfo = function(key) {
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // AlgorithmIdentifier
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // algorithm
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OID,
            false,
            asn1.oidToDer(pki.oids.rsaEncryption).getBytes()
          ),
          // parameters (null)
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")
        ]),
        // subjectPublicKey
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.BITSTRING, false, [
          pki.publicKeyToRSAPublicKey(key)
        ])
      ]);
    };
    pki.publicKeyToRSAPublicKey = function(key) {
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // modulus (n)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          _bnToBytes(key.n)
        ),
        // publicExponent (e)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          _bnToBytes(key.e)
        )
      ]);
    };
    function _encodePkcs1_v1_5(m2, key, bt) {
      var eb = forge.util.createBuffer();
      var k2 = Math.ceil(key.n.bitLength() / 8);
      if (m2.length > k2 - 11) {
        var error = new Error("Message is too long for PKCS#1 v1.5 padding.");
        error.length = m2.length;
        error.max = k2 - 11;
        throw error;
      }
      eb.putByte(0);
      eb.putByte(bt);
      var padNum = k2 - 3 - m2.length;
      var padByte;
      if (bt === 0 || bt === 1) {
        padByte = bt === 0 ? 0 : 255;
        for (var i2 = 0; i2 < padNum; ++i2) {
          eb.putByte(padByte);
        }
      } else {
        while (padNum > 0) {
          var numZeros = 0;
          var padBytes = forge.random.getBytes(padNum);
          for (var i2 = 0; i2 < padNum; ++i2) {
            padByte = padBytes.charCodeAt(i2);
            if (padByte === 0) {
              ++numZeros;
            } else {
              eb.putByte(padByte);
            }
          }
          padNum = numZeros;
        }
      }
      eb.putByte(0);
      eb.putBytes(m2);
      return eb;
    }
    function _decodePkcs1_v1_5(em, key, pub, ml, options) {
      var k2 = Math.ceil(key.n.bitLength() / 8);
      var eb = forge.util.createBuffer(em);
      var first = eb.getByte();
      var bt = eb.getByte();
      if (first !== 0 || pub && bt !== 0 && bt !== 1 || !pub && bt !== 2 || pub && bt === 0 && typeof ml === "undefined") {
        throw new Error("Encryption block is invalid.");
      }
      var padNum = 0;
      if (bt === 0) {
        padNum = k2 - 3 - ml;
        for (var i2 = 0; i2 < padNum; ++i2) {
          if (eb.getByte() !== 0) {
            throw new Error("Encryption block is invalid.");
          }
        }
      } else if (bt === 1) {
        padNum = 0;
        while (eb.length() > 1) {
          if (eb.getByte() !== 255) {
            --eb.read;
            break;
          }
          ++padNum;
        }
        if (padNum < 8 && !(options ? options._skipPaddingChecks : false)) {
          throw new Error("Encryption block is invalid.");
        }
      } else if (bt === 2) {
        padNum = 0;
        while (eb.length() > 1) {
          if (eb.getByte() === 0) {
            --eb.read;
            break;
          }
          ++padNum;
        }
        if (padNum < 8 && !(options ? options._skipPaddingChecks : false)) {
          throw new Error("Encryption block is invalid.");
        }
      }
      var zero = eb.getByte();
      if (zero !== 0 || padNum !== k2 - 3 - eb.length()) {
        throw new Error("Encryption block is invalid.");
      }
      return eb.getBytes();
    }
    function _generateKeyPair(state, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      options = options || {};
      var opts = {
        algorithm: {
          name: options.algorithm || "PRIMEINC",
          options: {
            workers: options.workers || 2,
            workLoad: options.workLoad || 100,
            workerScript: options.workerScript
          }
        }
      };
      if ("prng" in options) {
        opts.prng = options.prng;
      }
      generate();
      function generate() {
        getPrime(state.pBits, function(err, num) {
          if (err) {
            return callback(err);
          }
          state.p = num;
          if (state.q !== null) {
            return finish(err, state.q);
          }
          getPrime(state.qBits, finish);
        });
      }
      function getPrime(bits, callback2) {
        forge.prime.generateProbablePrime(bits, opts, callback2);
      }
      function finish(err, num) {
        if (err) {
          return callback(err);
        }
        state.q = num;
        if (state.p.compareTo(state.q) < 0) {
          var tmp = state.p;
          state.p = state.q;
          state.q = tmp;
        }
        if (state.p.subtract(BigInteger.ONE).gcd(state.e).compareTo(BigInteger.ONE) !== 0) {
          state.p = null;
          generate();
          return;
        }
        if (state.q.subtract(BigInteger.ONE).gcd(state.e).compareTo(BigInteger.ONE) !== 0) {
          state.q = null;
          getPrime(state.qBits, finish);
          return;
        }
        state.p1 = state.p.subtract(BigInteger.ONE);
        state.q1 = state.q.subtract(BigInteger.ONE);
        state.phi = state.p1.multiply(state.q1);
        if (state.phi.gcd(state.e).compareTo(BigInteger.ONE) !== 0) {
          state.p = state.q = null;
          generate();
          return;
        }
        state.n = state.p.multiply(state.q);
        if (state.n.bitLength() !== state.bits) {
          state.q = null;
          getPrime(state.qBits, finish);
          return;
        }
        var d2 = state.e.modInverse(state.phi);
        state.keys = {
          privateKey: pki.rsa.setPrivateKey(
            state.n,
            state.e,
            d2,
            state.p,
            state.q,
            d2.mod(state.p1),
            d2.mod(state.q1),
            state.q.modInverse(state.p)
          ),
          publicKey: pki.rsa.setPublicKey(state.n, state.e)
        };
        callback(null, state.keys);
      }
    }
    function _bnToBytes(b2) {
      var hex = b2.toString(16);
      if (hex[0] >= "8") {
        hex = "00" + hex;
      }
      var bytes = forge.util.hexToBytes(hex);
      if (bytes.length > 1 && // leading 0x00 for positive integer
      (bytes.charCodeAt(0) === 0 && (bytes.charCodeAt(1) & 128) === 0 || // leading 0xFF for negative integer
      bytes.charCodeAt(0) === 255 && (bytes.charCodeAt(1) & 128) === 128)) {
        return bytes.substr(1);
      }
      return bytes;
    }
    function _getMillerRabinTests(bits) {
      if (bits <= 100) return 27;
      if (bits <= 150) return 18;
      if (bits <= 200) return 15;
      if (bits <= 250) return 12;
      if (bits <= 300) return 9;
      if (bits <= 350) return 8;
      if (bits <= 400) return 7;
      if (bits <= 500) return 6;
      if (bits <= 600) return 5;
      if (bits <= 800) return 4;
      if (bits <= 1250) return 3;
      return 2;
    }
    function _detectNodeCrypto(fn) {
      return forge.util.isNodejs && typeof _crypto[fn] === "function";
    }
    function _detectSubtleCrypto(fn) {
      return typeof util.globalScope !== "undefined" && typeof util.globalScope.crypto === "object" && typeof util.globalScope.crypto.subtle === "object" && typeof util.globalScope.crypto.subtle[fn] === "function";
    }
    function _detectSubtleMsCrypto(fn) {
      return typeof util.globalScope !== "undefined" && typeof util.globalScope.msCrypto === "object" && typeof util.globalScope.msCrypto.subtle === "object" && typeof util.globalScope.msCrypto.subtle[fn] === "function";
    }
    function _intToUint8Array(x2) {
      var bytes = forge.util.hexToBytes(x2.toString(16));
      var buffer = new Uint8Array(bytes.length);
      for (var i2 = 0; i2 < bytes.length; ++i2) {
        buffer[i2] = bytes.charCodeAt(i2);
      }
      return buffer;
    }
  }
});

// node_modules/node-forge/lib/pbe.js
var require_pbe = __commonJS({
  "node_modules/node-forge/lib/pbe.js"(exports2, module2) {
    var forge = require_forge();
    require_aes();
    require_asn1();
    require_des();
    require_md();
    require_oids();
    require_pbkdf2();
    require_pem();
    require_random();
    require_rc2();
    require_rsa();
    require_util();
    if (typeof BigInteger === "undefined") {
      BigInteger = forge.jsbn.BigInteger;
    }
    var BigInteger;
    var asn1 = forge.asn1;
    var pki = forge.pki = forge.pki || {};
    module2.exports = pki.pbe = forge.pbe = forge.pbe || {};
    var oids = pki.oids;
    var encryptedPrivateKeyValidator = {
      name: "EncryptedPrivateKeyInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "EncryptedPrivateKeyInfo.encryptionAlgorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "AlgorithmIdentifier.algorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "encryptionOid"
        }, {
          name: "AlgorithmIdentifier.parameters",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.SEQUENCE,
          constructed: true,
          captureAsn1: "encryptionParams"
        }]
      }, {
        // encryptedData
        name: "EncryptedPrivateKeyInfo.encryptedData",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OCTETSTRING,
        constructed: false,
        capture: "encryptedData"
      }]
    };
    var PBES2AlgorithmsValidator = {
      name: "PBES2Algorithms",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "PBES2Algorithms.keyDerivationFunc",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "PBES2Algorithms.keyDerivationFunc.oid",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "kdfOid"
        }, {
          name: "PBES2Algorithms.params",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.SEQUENCE,
          constructed: true,
          value: [{
            name: "PBES2Algorithms.params.salt",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.OCTETSTRING,
            constructed: false,
            capture: "kdfSalt"
          }, {
            name: "PBES2Algorithms.params.iterationCount",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.INTEGER,
            constructed: false,
            capture: "kdfIterationCount"
          }, {
            name: "PBES2Algorithms.params.keyLength",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.INTEGER,
            constructed: false,
            optional: true,
            capture: "keyLength"
          }, {
            // prf
            name: "PBES2Algorithms.params.prf",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.SEQUENCE,
            constructed: true,
            optional: true,
            value: [{
              name: "PBES2Algorithms.params.prf.algorithm",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.OID,
              constructed: false,
              capture: "prfOid"
            }]
          }]
        }]
      }, {
        name: "PBES2Algorithms.encryptionScheme",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "PBES2Algorithms.encryptionScheme.oid",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "encOid"
        }, {
          name: "PBES2Algorithms.encryptionScheme.iv",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OCTETSTRING,
          constructed: false,
          capture: "encIv"
        }]
      }]
    };
    var pkcs12PbeParamsValidator = {
      name: "pkcs-12PbeParams",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "pkcs-12PbeParams.salt",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OCTETSTRING,
        constructed: false,
        capture: "salt"
      }, {
        name: "pkcs-12PbeParams.iterations",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "iterations"
      }]
    };
    pki.encryptPrivateKeyInfo = function(obj, password, options) {
      options = options || {};
      options.saltSize = options.saltSize || 8;
      options.count = options.count || 2048;
      options.algorithm = options.algorithm || "aes128";
      options.prfAlgorithm = options.prfAlgorithm || "sha1";
      var salt = forge.random.getBytesSync(options.saltSize);
      var count = options.count;
      var countBytes = asn1.integerToDer(count);
      var dkLen;
      var encryptionAlgorithm;
      var encryptedData;
      if (options.algorithm.indexOf("aes") === 0 || options.algorithm === "des") {
        var ivLen, encOid, cipherFn;
        switch (options.algorithm) {
          case "aes128":
            dkLen = 16;
            ivLen = 16;
            encOid = oids["aes128-CBC"];
            cipherFn = forge.aes.createEncryptionCipher;
            break;
          case "aes192":
            dkLen = 24;
            ivLen = 16;
            encOid = oids["aes192-CBC"];
            cipherFn = forge.aes.createEncryptionCipher;
            break;
          case "aes256":
            dkLen = 32;
            ivLen = 16;
            encOid = oids["aes256-CBC"];
            cipherFn = forge.aes.createEncryptionCipher;
            break;
          case "des":
            dkLen = 8;
            ivLen = 8;
            encOid = oids["desCBC"];
            cipherFn = forge.des.createEncryptionCipher;
            break;
          default:
            var error = new Error("Cannot encrypt private key. Unknown encryption algorithm.");
            error.algorithm = options.algorithm;
            throw error;
        }
        var prfAlgorithm = "hmacWith" + options.prfAlgorithm.toUpperCase();
        var md = prfAlgorithmToMessageDigest(prfAlgorithm);
        var dk = forge.pkcs5.pbkdf2(password, salt, count, dkLen, md);
        var iv = forge.random.getBytesSync(ivLen);
        var cipher = cipherFn(dk);
        cipher.start(iv);
        cipher.update(asn1.toDer(obj));
        cipher.finish();
        encryptedData = cipher.output.getBytes();
        var params = createPbkdf2Params(salt, countBytes, dkLen, prfAlgorithm);
        encryptionAlgorithm = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.SEQUENCE,
          true,
          [
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(oids["pkcs5PBES2"]).getBytes()
            ),
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
              // keyDerivationFunc
              asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
                asn1.create(
                  asn1.Class.UNIVERSAL,
                  asn1.Type.OID,
                  false,
                  asn1.oidToDer(oids["pkcs5PBKDF2"]).getBytes()
                ),
                // PBKDF2-params
                params
              ]),
              // encryptionScheme
              asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
                asn1.create(
                  asn1.Class.UNIVERSAL,
                  asn1.Type.OID,
                  false,
                  asn1.oidToDer(encOid).getBytes()
                ),
                // iv
                asn1.create(
                  asn1.Class.UNIVERSAL,
                  asn1.Type.OCTETSTRING,
                  false,
                  iv
                )
              ])
            ])
          ]
        );
      } else if (options.algorithm === "3des") {
        dkLen = 24;
        var saltBytes = new forge.util.ByteBuffer(salt);
        var dk = pki.pbe.generatePkcs12Key(password, saltBytes, 1, count, dkLen);
        var iv = pki.pbe.generatePkcs12Key(password, saltBytes, 2, count, dkLen);
        var cipher = forge.des.createEncryptionCipher(dk);
        cipher.start(iv);
        cipher.update(asn1.toDer(obj));
        cipher.finish();
        encryptedData = cipher.output.getBytes();
        encryptionAlgorithm = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.SEQUENCE,
          true,
          [
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(oids["pbeWithSHAAnd3-KeyTripleDES-CBC"]).getBytes()
            ),
            // pkcs-12PbeParams
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
              // salt
              asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, salt),
              // iteration count
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.INTEGER,
                false,
                countBytes.getBytes()
              )
            ])
          ]
        );
      } else {
        var error = new Error("Cannot encrypt private key. Unknown encryption algorithm.");
        error.algorithm = options.algorithm;
        throw error;
      }
      var rval = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // encryptionAlgorithm
        encryptionAlgorithm,
        // encryptedData
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OCTETSTRING,
          false,
          encryptedData
        )
      ]);
      return rval;
    };
    pki.decryptPrivateKeyInfo = function(obj, password) {
      var rval = null;
      var capture = {};
      var errors = [];
      if (!asn1.validate(obj, encryptedPrivateKeyValidator, capture, errors)) {
        var error = new Error("Cannot read encrypted private key. ASN.1 object is not a supported EncryptedPrivateKeyInfo.");
        error.errors = errors;
        throw error;
      }
      var oid = asn1.derToOid(capture.encryptionOid);
      var cipher = pki.pbe.getCipher(oid, capture.encryptionParams, password);
      var encrypted = forge.util.createBuffer(capture.encryptedData);
      cipher.update(encrypted);
      if (cipher.finish()) {
        rval = asn1.fromDer(cipher.output);
      }
      return rval;
    };
    pki.encryptedPrivateKeyToPem = function(epki, maxline) {
      var msg = {
        type: "ENCRYPTED PRIVATE KEY",
        body: asn1.toDer(epki).getBytes()
      };
      return forge.pem.encode(msg, { maxline });
    };
    pki.encryptedPrivateKeyFromPem = function(pem) {
      var msg = forge.pem.decode(pem)[0];
      if (msg.type !== "ENCRYPTED PRIVATE KEY") {
        var error = new Error('Could not convert encrypted private key from PEM; PEM header type is "ENCRYPTED PRIVATE KEY".');
        error.headerType = msg.type;
        throw error;
      }
      if (msg.procType && msg.procType.type === "ENCRYPTED") {
        throw new Error("Could not convert encrypted private key from PEM; PEM is encrypted.");
      }
      return asn1.fromDer(msg.body);
    };
    pki.encryptRsaPrivateKey = function(rsaKey, password, options) {
      options = options || {};
      if (!options.legacy) {
        var rval = pki.wrapRsaPrivateKey(pki.privateKeyToAsn1(rsaKey));
        rval = pki.encryptPrivateKeyInfo(rval, password, options);
        return pki.encryptedPrivateKeyToPem(rval);
      }
      var algorithm;
      var iv;
      var dkLen;
      var cipherFn;
      switch (options.algorithm) {
        case "aes128":
          algorithm = "AES-128-CBC";
          dkLen = 16;
          iv = forge.random.getBytesSync(16);
          cipherFn = forge.aes.createEncryptionCipher;
          break;
        case "aes192":
          algorithm = "AES-192-CBC";
          dkLen = 24;
          iv = forge.random.getBytesSync(16);
          cipherFn = forge.aes.createEncryptionCipher;
          break;
        case "aes256":
          algorithm = "AES-256-CBC";
          dkLen = 32;
          iv = forge.random.getBytesSync(16);
          cipherFn = forge.aes.createEncryptionCipher;
          break;
        case "3des":
          algorithm = "DES-EDE3-CBC";
          dkLen = 24;
          iv = forge.random.getBytesSync(8);
          cipherFn = forge.des.createEncryptionCipher;
          break;
        case "des":
          algorithm = "DES-CBC";
          dkLen = 8;
          iv = forge.random.getBytesSync(8);
          cipherFn = forge.des.createEncryptionCipher;
          break;
        default:
          var error = new Error('Could not encrypt RSA private key; unsupported encryption algorithm "' + options.algorithm + '".');
          error.algorithm = options.algorithm;
          throw error;
      }
      var dk = forge.pbe.opensslDeriveBytes(password, iv.substr(0, 8), dkLen);
      var cipher = cipherFn(dk);
      cipher.start(iv);
      cipher.update(asn1.toDer(pki.privateKeyToAsn1(rsaKey)));
      cipher.finish();
      var msg = {
        type: "RSA PRIVATE KEY",
        procType: {
          version: "4",
          type: "ENCRYPTED"
        },
        dekInfo: {
          algorithm,
          parameters: forge.util.bytesToHex(iv).toUpperCase()
        },
        body: cipher.output.getBytes()
      };
      return forge.pem.encode(msg);
    };
    pki.decryptRsaPrivateKey = function(pem, password) {
      var rval = null;
      var msg = forge.pem.decode(pem)[0];
      if (msg.type !== "ENCRYPTED PRIVATE KEY" && msg.type !== "PRIVATE KEY" && msg.type !== "RSA PRIVATE KEY") {
        var error = new Error('Could not convert private key from PEM; PEM header type is not "ENCRYPTED PRIVATE KEY", "PRIVATE KEY", or "RSA PRIVATE KEY".');
        error.headerType = error;
        throw error;
      }
      if (msg.procType && msg.procType.type === "ENCRYPTED") {
        var dkLen;
        var cipherFn;
        switch (msg.dekInfo.algorithm) {
          case "DES-CBC":
            dkLen = 8;
            cipherFn = forge.des.createDecryptionCipher;
            break;
          case "DES-EDE3-CBC":
            dkLen = 24;
            cipherFn = forge.des.createDecryptionCipher;
            break;
          case "AES-128-CBC":
            dkLen = 16;
            cipherFn = forge.aes.createDecryptionCipher;
            break;
          case "AES-192-CBC":
            dkLen = 24;
            cipherFn = forge.aes.createDecryptionCipher;
            break;
          case "AES-256-CBC":
            dkLen = 32;
            cipherFn = forge.aes.createDecryptionCipher;
            break;
          case "RC2-40-CBC":
            dkLen = 5;
            cipherFn = function(key) {
              return forge.rc2.createDecryptionCipher(key, 40);
            };
            break;
          case "RC2-64-CBC":
            dkLen = 8;
            cipherFn = function(key) {
              return forge.rc2.createDecryptionCipher(key, 64);
            };
            break;
          case "RC2-128-CBC":
            dkLen = 16;
            cipherFn = function(key) {
              return forge.rc2.createDecryptionCipher(key, 128);
            };
            break;
          default:
            var error = new Error('Could not decrypt private key; unsupported encryption algorithm "' + msg.dekInfo.algorithm + '".');
            error.algorithm = msg.dekInfo.algorithm;
            throw error;
        }
        var iv = forge.util.hexToBytes(msg.dekInfo.parameters);
        var dk = forge.pbe.opensslDeriveBytes(password, iv.substr(0, 8), dkLen);
        var cipher = cipherFn(dk);
        cipher.start(iv);
        cipher.update(forge.util.createBuffer(msg.body));
        if (cipher.finish()) {
          rval = cipher.output.getBytes();
        } else {
          return rval;
        }
      } else {
        rval = msg.body;
      }
      if (msg.type === "ENCRYPTED PRIVATE KEY") {
        rval = pki.decryptPrivateKeyInfo(asn1.fromDer(rval), password);
      } else {
        rval = asn1.fromDer(rval);
      }
      if (rval !== null) {
        rval = pki.privateKeyFromAsn1(rval);
      }
      return rval;
    };
    pki.pbe.generatePkcs12Key = function(password, salt, id, iter, n2, md) {
      var j2, l2;
      if (typeof md === "undefined" || md === null) {
        if (!("sha1" in forge.md)) {
          throw new Error('"sha1" hash algorithm unavailable.');
        }
        md = forge.md.sha1.create();
      }
      var u2 = md.digestLength;
      var v2 = md.blockLength;
      var result = new forge.util.ByteBuffer();
      var passBuf = new forge.util.ByteBuffer();
      if (password !== null && password !== void 0) {
        for (l2 = 0; l2 < password.length; l2++) {
          passBuf.putInt16(password.charCodeAt(l2));
        }
        passBuf.putInt16(0);
      }
      var p2 = passBuf.length();
      var s2 = salt.length();
      var D2 = new forge.util.ByteBuffer();
      D2.fillWithByte(id, v2);
      var Slen = v2 * Math.ceil(s2 / v2);
      var S2 = new forge.util.ByteBuffer();
      for (l2 = 0; l2 < Slen; l2++) {
        S2.putByte(salt.at(l2 % s2));
      }
      var Plen = v2 * Math.ceil(p2 / v2);
      var P2 = new forge.util.ByteBuffer();
      for (l2 = 0; l2 < Plen; l2++) {
        P2.putByte(passBuf.at(l2 % p2));
      }
      var I2 = S2;
      I2.putBuffer(P2);
      var c2 = Math.ceil(n2 / u2);
      for (var i2 = 1; i2 <= c2; i2++) {
        var buf = new forge.util.ByteBuffer();
        buf.putBytes(D2.bytes());
        buf.putBytes(I2.bytes());
        for (var round = 0; round < iter; round++) {
          md.start();
          md.update(buf.getBytes());
          buf = md.digest();
        }
        var B2 = new forge.util.ByteBuffer();
        for (l2 = 0; l2 < v2; l2++) {
          B2.putByte(buf.at(l2 % u2));
        }
        var k2 = Math.ceil(s2 / v2) + Math.ceil(p2 / v2);
        var Inew = new forge.util.ByteBuffer();
        for (j2 = 0; j2 < k2; j2++) {
          var chunk = new forge.util.ByteBuffer(I2.getBytes(v2));
          var x2 = 511;
          for (l2 = B2.length() - 1; l2 >= 0; l2--) {
            x2 = x2 >> 8;
            x2 += B2.at(l2) + chunk.at(l2);
            chunk.setAt(l2, x2 & 255);
          }
          Inew.putBuffer(chunk);
        }
        I2 = Inew;
        result.putBuffer(buf);
      }
      result.truncate(result.length() - n2);
      return result;
    };
    pki.pbe.getCipher = function(oid, params, password) {
      switch (oid) {
        case pki.oids["pkcs5PBES2"]:
          return pki.pbe.getCipherForPBES2(oid, params, password);
        case pki.oids["pbeWithSHAAnd3-KeyTripleDES-CBC"]:
        case pki.oids["pbewithSHAAnd40BitRC2-CBC"]:
          return pki.pbe.getCipherForPKCS12PBE(oid, params, password);
        default:
          var error = new Error("Cannot read encrypted PBE data block. Unsupported OID.");
          error.oid = oid;
          error.supportedOids = [
            "pkcs5PBES2",
            "pbeWithSHAAnd3-KeyTripleDES-CBC",
            "pbewithSHAAnd40BitRC2-CBC"
          ];
          throw error;
      }
    };
    pki.pbe.getCipherForPBES2 = function(oid, params, password) {
      var capture = {};
      var errors = [];
      if (!asn1.validate(params, PBES2AlgorithmsValidator, capture, errors)) {
        var error = new Error("Cannot read password-based-encryption algorithm parameters. ASN.1 object is not a supported EncryptedPrivateKeyInfo.");
        error.errors = errors;
        throw error;
      }
      oid = asn1.derToOid(capture.kdfOid);
      if (oid !== pki.oids["pkcs5PBKDF2"]) {
        var error = new Error("Cannot read encrypted private key. Unsupported key derivation function OID.");
        error.oid = oid;
        error.supportedOids = ["pkcs5PBKDF2"];
        throw error;
      }
      oid = asn1.derToOid(capture.encOid);
      if (oid !== pki.oids["aes128-CBC"] && oid !== pki.oids["aes192-CBC"] && oid !== pki.oids["aes256-CBC"] && oid !== pki.oids["des-EDE3-CBC"] && oid !== pki.oids["desCBC"]) {
        var error = new Error("Cannot read encrypted private key. Unsupported encryption scheme OID.");
        error.oid = oid;
        error.supportedOids = [
          "aes128-CBC",
          "aes192-CBC",
          "aes256-CBC",
          "des-EDE3-CBC",
          "desCBC"
        ];
        throw error;
      }
      var salt = capture.kdfSalt;
      var count = forge.util.createBuffer(capture.kdfIterationCount);
      count = count.getInt(count.length() << 3);
      var dkLen;
      var cipherFn;
      switch (pki.oids[oid]) {
        case "aes128-CBC":
          dkLen = 16;
          cipherFn = forge.aes.createDecryptionCipher;
          break;
        case "aes192-CBC":
          dkLen = 24;
          cipherFn = forge.aes.createDecryptionCipher;
          break;
        case "aes256-CBC":
          dkLen = 32;
          cipherFn = forge.aes.createDecryptionCipher;
          break;
        case "des-EDE3-CBC":
          dkLen = 24;
          cipherFn = forge.des.createDecryptionCipher;
          break;
        case "desCBC":
          dkLen = 8;
          cipherFn = forge.des.createDecryptionCipher;
          break;
      }
      var md = prfOidToMessageDigest(capture.prfOid);
      var dk = forge.pkcs5.pbkdf2(password, salt, count, dkLen, md);
      var iv = capture.encIv;
      var cipher = cipherFn(dk);
      cipher.start(iv);
      return cipher;
    };
    pki.pbe.getCipherForPKCS12PBE = function(oid, params, password) {
      var capture = {};
      var errors = [];
      if (!asn1.validate(params, pkcs12PbeParamsValidator, capture, errors)) {
        var error = new Error("Cannot read password-based-encryption algorithm parameters. ASN.1 object is not a supported EncryptedPrivateKeyInfo.");
        error.errors = errors;
        throw error;
      }
      var salt = forge.util.createBuffer(capture.salt);
      var count = forge.util.createBuffer(capture.iterations);
      count = count.getInt(count.length() << 3);
      var dkLen, dIvLen, cipherFn;
      switch (oid) {
        case pki.oids["pbeWithSHAAnd3-KeyTripleDES-CBC"]:
          dkLen = 24;
          dIvLen = 8;
          cipherFn = forge.des.startDecrypting;
          break;
        case pki.oids["pbewithSHAAnd40BitRC2-CBC"]:
          dkLen = 5;
          dIvLen = 8;
          cipherFn = function(key2, iv2) {
            var cipher = forge.rc2.createDecryptionCipher(key2, 40);
            cipher.start(iv2, null);
            return cipher;
          };
          break;
        default:
          var error = new Error("Cannot read PKCS #12 PBE data block. Unsupported OID.");
          error.oid = oid;
          throw error;
      }
      var md = prfOidToMessageDigest(capture.prfOid);
      var key = pki.pbe.generatePkcs12Key(password, salt, 1, count, dkLen, md);
      md.start();
      var iv = pki.pbe.generatePkcs12Key(password, salt, 2, count, dIvLen, md);
      return cipherFn(key, iv);
    };
    pki.pbe.opensslDeriveBytes = function(password, salt, dkLen, md) {
      if (typeof md === "undefined" || md === null) {
        if (!("md5" in forge.md)) {
          throw new Error('"md5" hash algorithm unavailable.');
        }
        md = forge.md.md5.create();
      }
      if (salt === null) {
        salt = "";
      }
      var digests = [hash(md, password + salt)];
      for (var length = 16, i2 = 1; length < dkLen; ++i2, length += 16) {
        digests.push(hash(md, digests[i2 - 1] + password + salt));
      }
      return digests.join("").substr(0, dkLen);
    };
    function hash(md, bytes) {
      return md.start().update(bytes).digest().getBytes();
    }
    function prfOidToMessageDigest(prfOid) {
      var prfAlgorithm;
      if (!prfOid) {
        prfAlgorithm = "hmacWithSHA1";
      } else {
        prfAlgorithm = pki.oids[asn1.derToOid(prfOid)];
        if (!prfAlgorithm) {
          var error = new Error("Unsupported PRF OID.");
          error.oid = prfOid;
          error.supported = [
            "hmacWithSHA1",
            "hmacWithSHA224",
            "hmacWithSHA256",
            "hmacWithSHA384",
            "hmacWithSHA512"
          ];
          throw error;
        }
      }
      return prfAlgorithmToMessageDigest(prfAlgorithm);
    }
    function prfAlgorithmToMessageDigest(prfAlgorithm) {
      var factory = forge.md;
      switch (prfAlgorithm) {
        case "hmacWithSHA224":
          factory = forge.md.sha512;
        case "hmacWithSHA1":
        case "hmacWithSHA256":
        case "hmacWithSHA384":
        case "hmacWithSHA512":
          prfAlgorithm = prfAlgorithm.substr(8).toLowerCase();
          break;
        default:
          var error = new Error("Unsupported PRF algorithm.");
          error.algorithm = prfAlgorithm;
          error.supported = [
            "hmacWithSHA1",
            "hmacWithSHA224",
            "hmacWithSHA256",
            "hmacWithSHA384",
            "hmacWithSHA512"
          ];
          throw error;
      }
      if (!factory || !(prfAlgorithm in factory)) {
        throw new Error("Unknown hash algorithm: " + prfAlgorithm);
      }
      return factory[prfAlgorithm].create();
    }
    function createPbkdf2Params(salt, countBytes, dkLen, prfAlgorithm) {
      var params = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // salt
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OCTETSTRING,
          false,
          salt
        ),
        // iteration count
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          countBytes.getBytes()
        )
      ]);
      if (prfAlgorithm !== "hmacWithSHA1") {
        params.value.push(
          // key length
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.INTEGER,
            false,
            forge.util.hexToBytes(dkLen.toString(16))
          ),
          // AlgorithmIdentifier
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // algorithm
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(pki.oids[prfAlgorithm]).getBytes()
            ),
            // parameters (null)
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")
          ])
        );
      }
      return params;
    }
  }
});

// node_modules/node-forge/lib/pkcs7asn1.js
var require_pkcs7asn1 = __commonJS({
  "node_modules/node-forge/lib/pkcs7asn1.js"(exports2, module2) {
    var forge = require_forge();
    require_asn1();
    require_util();
    var asn1 = forge.asn1;
    var p7v = module2.exports = forge.pkcs7asn1 = forge.pkcs7asn1 || {};
    forge.pkcs7 = forge.pkcs7 || {};
    forge.pkcs7.asn1 = p7v;
    var contentInfoValidator = {
      name: "ContentInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "ContentInfo.ContentType",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OID,
        constructed: false,
        capture: "contentType"
      }, {
        name: "ContentInfo.content",
        tagClass: asn1.Class.CONTEXT_SPECIFIC,
        type: 0,
        constructed: true,
        optional: true,
        captureAsn1: "content"
      }]
    };
    p7v.contentInfoValidator = contentInfoValidator;
    var encryptedContentInfoValidator = {
      name: "EncryptedContentInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "EncryptedContentInfo.contentType",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OID,
        constructed: false,
        capture: "contentType"
      }, {
        name: "EncryptedContentInfo.contentEncryptionAlgorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "EncryptedContentInfo.contentEncryptionAlgorithm.algorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "encAlgorithm"
        }, {
          name: "EncryptedContentInfo.contentEncryptionAlgorithm.parameter",
          tagClass: asn1.Class.UNIVERSAL,
          captureAsn1: "encParameter"
        }]
      }, {
        name: "EncryptedContentInfo.encryptedContent",
        tagClass: asn1.Class.CONTEXT_SPECIFIC,
        type: 0,
        /* The PKCS#7 structure output by OpenSSL somewhat differs from what
         * other implementations do generate.
         *
         * OpenSSL generates a structure like this:
         * SEQUENCE {
         *    ...
         *    [0]
         *       26 DA 67 D2 17 9C 45 3C B1 2A A8 59 2F 29 33 38
         *       C3 C3 DF 86 71 74 7A 19 9F 40 D0 29 BE 85 90 45
         *       ...
         * }
         *
         * Whereas other implementations (and this PKCS#7 module) generate:
         * SEQUENCE {
         *    ...
         *    [0] {
         *       OCTET STRING
         *          26 DA 67 D2 17 9C 45 3C B1 2A A8 59 2F 29 33 38
         *          C3 C3 DF 86 71 74 7A 19 9F 40 D0 29 BE 85 90 45
         *          ...
         *    }
         * }
         *
         * In order to support both, we just capture the context specific
         * field here.  The OCTET STRING bit is removed below.
         */
        capture: "encryptedContent",
        captureAsn1: "encryptedContentAsn1"
      }]
    };
    p7v.envelopedDataValidator = {
      name: "EnvelopedData",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "EnvelopedData.Version",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "version"
      }, {
        name: "EnvelopedData.RecipientInfos",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SET,
        constructed: true,
        captureAsn1: "recipientInfos"
      }].concat(encryptedContentInfoValidator)
    };
    p7v.encryptedDataValidator = {
      name: "EncryptedData",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "EncryptedData.Version",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "version"
      }].concat(encryptedContentInfoValidator)
    };
    var signerValidator = {
      name: "SignerInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "SignerInfo.version",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false
      }, {
        name: "SignerInfo.issuerAndSerialNumber",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "SignerInfo.issuerAndSerialNumber.issuer",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.SEQUENCE,
          constructed: true,
          captureAsn1: "issuer"
        }, {
          name: "SignerInfo.issuerAndSerialNumber.serialNumber",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.INTEGER,
          constructed: false,
          capture: "serial"
        }]
      }, {
        name: "SignerInfo.digestAlgorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "SignerInfo.digestAlgorithm.algorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "digestAlgorithm"
        }, {
          name: "SignerInfo.digestAlgorithm.parameter",
          tagClass: asn1.Class.UNIVERSAL,
          constructed: false,
          captureAsn1: "digestParameter",
          optional: true
        }]
      }, {
        name: "SignerInfo.authenticatedAttributes",
        tagClass: asn1.Class.CONTEXT_SPECIFIC,
        type: 0,
        constructed: true,
        optional: true,
        capture: "authenticatedAttributes"
      }, {
        name: "SignerInfo.digestEncryptionAlgorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        capture: "signatureAlgorithm"
      }, {
        name: "SignerInfo.encryptedDigest",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OCTETSTRING,
        constructed: false,
        capture: "signature"
      }, {
        name: "SignerInfo.unauthenticatedAttributes",
        tagClass: asn1.Class.CONTEXT_SPECIFIC,
        type: 1,
        constructed: true,
        optional: true,
        capture: "unauthenticatedAttributes"
      }]
    };
    p7v.signedDataValidator = {
      name: "SignedData",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [
        {
          name: "SignedData.Version",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.INTEGER,
          constructed: false,
          capture: "version"
        },
        {
          name: "SignedData.DigestAlgorithms",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.SET,
          constructed: true,
          captureAsn1: "digestAlgorithms"
        },
        contentInfoValidator,
        {
          name: "SignedData.Certificates",
          tagClass: asn1.Class.CONTEXT_SPECIFIC,
          type: 0,
          optional: true,
          captureAsn1: "certificates"
        },
        {
          name: "SignedData.CertificateRevocationLists",
          tagClass: asn1.Class.CONTEXT_SPECIFIC,
          type: 1,
          optional: true,
          captureAsn1: "crls"
        },
        {
          name: "SignedData.SignerInfos",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.SET,
          capture: "signerInfos",
          optional: true,
          value: [signerValidator]
        }
      ]
    };
    p7v.recipientInfoValidator = {
      name: "RecipientInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "RecipientInfo.version",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "version"
      }, {
        name: "RecipientInfo.issuerAndSerial",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "RecipientInfo.issuerAndSerial.issuer",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.SEQUENCE,
          constructed: true,
          captureAsn1: "issuer"
        }, {
          name: "RecipientInfo.issuerAndSerial.serialNumber",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.INTEGER,
          constructed: false,
          capture: "serial"
        }]
      }, {
        name: "RecipientInfo.keyEncryptionAlgorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "RecipientInfo.keyEncryptionAlgorithm.algorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "encAlgorithm"
        }, {
          name: "RecipientInfo.keyEncryptionAlgorithm.parameter",
          tagClass: asn1.Class.UNIVERSAL,
          constructed: false,
          captureAsn1: "encParameter",
          optional: true
        }]
      }, {
        name: "RecipientInfo.encryptedKey",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OCTETSTRING,
        constructed: false,
        capture: "encKey"
      }]
    };
  }
});

// node_modules/node-forge/lib/mgf1.js
var require_mgf1 = __commonJS({
  "node_modules/node-forge/lib/mgf1.js"(exports2, module2) {
    var forge = require_forge();
    require_util();
    forge.mgf = forge.mgf || {};
    var mgf1 = module2.exports = forge.mgf.mgf1 = forge.mgf1 = forge.mgf1 || {};
    mgf1.create = function(md) {
      var mgf = {
        /**
         * Generate mask of specified length.
         *
         * @param {String} seed The seed for mask generation.
         * @param maskLen Number of bytes to generate.
         * @return {String} The generated mask.
         */
        generate: function(seed, maskLen) {
          var t2 = new forge.util.ByteBuffer();
          var len = Math.ceil(maskLen / md.digestLength);
          for (var i2 = 0; i2 < len; i2++) {
            var c2 = new forge.util.ByteBuffer();
            c2.putInt32(i2);
            md.start();
            md.update(seed + c2.getBytes());
            t2.putBuffer(md.digest());
          }
          t2.truncate(t2.length() - maskLen);
          return t2.getBytes();
        }
      };
      return mgf;
    };
  }
});

// node_modules/node-forge/lib/mgf.js
var require_mgf = __commonJS({
  "node_modules/node-forge/lib/mgf.js"(exports2, module2) {
    var forge = require_forge();
    require_mgf1();
    module2.exports = forge.mgf = forge.mgf || {};
    forge.mgf.mgf1 = forge.mgf1;
  }
});

// node_modules/node-forge/lib/pss.js
var require_pss = __commonJS({
  "node_modules/node-forge/lib/pss.js"(exports2, module2) {
    var forge = require_forge();
    require_random();
    require_util();
    var pss = module2.exports = forge.pss = forge.pss || {};
    pss.create = function(options) {
      if (arguments.length === 3) {
        options = {
          md: arguments[0],
          mgf: arguments[1],
          saltLength: arguments[2]
        };
      }
      var hash = options.md;
      var mgf = options.mgf;
      var hLen = hash.digestLength;
      var salt_ = options.salt || null;
      if (typeof salt_ === "string") {
        salt_ = forge.util.createBuffer(salt_);
      }
      var sLen;
      if ("saltLength" in options) {
        sLen = options.saltLength;
      } else if (salt_ !== null) {
        sLen = salt_.length();
      } else {
        throw new Error("Salt length not specified or specific salt not given.");
      }
      if (salt_ !== null && salt_.length() !== sLen) {
        throw new Error("Given salt length does not match length of given salt.");
      }
      var prng = options.prng || forge.random;
      var pssobj = {};
      pssobj.encode = function(md, modBits) {
        var i2;
        var emBits = modBits - 1;
        var emLen = Math.ceil(emBits / 8);
        var mHash = md.digest().getBytes();
        if (emLen < hLen + sLen + 2) {
          throw new Error("Message is too long to encrypt.");
        }
        var salt;
        if (salt_ === null) {
          salt = prng.getBytesSync(sLen);
        } else {
          salt = salt_.bytes();
        }
        var m_ = new forge.util.ByteBuffer();
        m_.fillWithByte(0, 8);
        m_.putBytes(mHash);
        m_.putBytes(salt);
        hash.start();
        hash.update(m_.getBytes());
        var h2 = hash.digest().getBytes();
        var ps2 = new forge.util.ByteBuffer();
        ps2.fillWithByte(0, emLen - sLen - hLen - 2);
        ps2.putByte(1);
        ps2.putBytes(salt);
        var db = ps2.getBytes();
        var maskLen = emLen - hLen - 1;
        var dbMask = mgf.generate(h2, maskLen);
        var maskedDB = "";
        for (i2 = 0; i2 < maskLen; i2++) {
          maskedDB += String.fromCharCode(db.charCodeAt(i2) ^ dbMask.charCodeAt(i2));
        }
        var mask = 65280 >> 8 * emLen - emBits & 255;
        maskedDB = String.fromCharCode(maskedDB.charCodeAt(0) & ~mask) + maskedDB.substr(1);
        return maskedDB + h2 + String.fromCharCode(188);
      };
      pssobj.verify = function(mHash, em, modBits) {
        var i2;
        var emBits = modBits - 1;
        var emLen = Math.ceil(emBits / 8);
        em = em.substr(-emLen);
        if (emLen < hLen + sLen + 2) {
          throw new Error("Inconsistent parameters to PSS signature verification.");
        }
        if (em.charCodeAt(emLen - 1) !== 188) {
          throw new Error("Encoded message does not end in 0xBC.");
        }
        var maskLen = emLen - hLen - 1;
        var maskedDB = em.substr(0, maskLen);
        var h2 = em.substr(maskLen, hLen);
        var mask = 65280 >> 8 * emLen - emBits & 255;
        if ((maskedDB.charCodeAt(0) & mask) !== 0) {
          throw new Error("Bits beyond keysize not zero as expected.");
        }
        var dbMask = mgf.generate(h2, maskLen);
        var db = "";
        for (i2 = 0; i2 < maskLen; i2++) {
          db += String.fromCharCode(maskedDB.charCodeAt(i2) ^ dbMask.charCodeAt(i2));
        }
        db = String.fromCharCode(db.charCodeAt(0) & ~mask) + db.substr(1);
        var checkLen = emLen - hLen - sLen - 2;
        for (i2 = 0; i2 < checkLen; i2++) {
          if (db.charCodeAt(i2) !== 0) {
            throw new Error("Leftmost octets not zero as expected");
          }
        }
        if (db.charCodeAt(checkLen) !== 1) {
          throw new Error("Inconsistent PSS signature, 0x01 marker not found");
        }
        var salt = db.substr(-sLen);
        var m_ = new forge.util.ByteBuffer();
        m_.fillWithByte(0, 8);
        m_.putBytes(mHash);
        m_.putBytes(salt);
        hash.start();
        hash.update(m_.getBytes());
        var h_ = hash.digest().getBytes();
        return h2 === h_;
      };
      return pssobj;
    };
  }
});

// node_modules/node-forge/lib/x509.js
var require_x509 = __commonJS({
  "node_modules/node-forge/lib/x509.js"(exports2, module2) {
    var forge = require_forge();
    require_aes();
    require_asn1();
    require_des();
    require_md();
    require_mgf();
    require_oids();
    require_pem();
    require_pss();
    require_rsa();
    require_util();
    var asn1 = forge.asn1;
    var pki = module2.exports = forge.pki = forge.pki || {};
    var oids = pki.oids;
    var _shortNames = {};
    _shortNames["CN"] = oids["commonName"];
    _shortNames["commonName"] = "CN";
    _shortNames["C"] = oids["countryName"];
    _shortNames["countryName"] = "C";
    _shortNames["L"] = oids["localityName"];
    _shortNames["localityName"] = "L";
    _shortNames["ST"] = oids["stateOrProvinceName"];
    _shortNames["stateOrProvinceName"] = "ST";
    _shortNames["O"] = oids["organizationName"];
    _shortNames["organizationName"] = "O";
    _shortNames["OU"] = oids["organizationalUnitName"];
    _shortNames["organizationalUnitName"] = "OU";
    _shortNames["E"] = oids["emailAddress"];
    _shortNames["emailAddress"] = "E";
    var publicKeyValidator = forge.pki.rsa.publicKeyValidator;
    var x509CertificateValidator = {
      name: "Certificate",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "Certificate.TBSCertificate",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        captureAsn1: "tbsCertificate",
        value: [
          {
            name: "Certificate.TBSCertificate.version",
            tagClass: asn1.Class.CONTEXT_SPECIFIC,
            type: 0,
            constructed: true,
            optional: true,
            value: [{
              name: "Certificate.TBSCertificate.version.integer",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.INTEGER,
              constructed: false,
              capture: "certVersion"
            }]
          },
          {
            name: "Certificate.TBSCertificate.serialNumber",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.INTEGER,
            constructed: false,
            capture: "certSerialNumber"
          },
          {
            name: "Certificate.TBSCertificate.signature",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.SEQUENCE,
            constructed: true,
            value: [{
              name: "Certificate.TBSCertificate.signature.algorithm",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.OID,
              constructed: false,
              capture: "certinfoSignatureOid"
            }, {
              name: "Certificate.TBSCertificate.signature.parameters",
              tagClass: asn1.Class.UNIVERSAL,
              optional: true,
              captureAsn1: "certinfoSignatureParams"
            }]
          },
          {
            name: "Certificate.TBSCertificate.issuer",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.SEQUENCE,
            constructed: true,
            captureAsn1: "certIssuer"
          },
          {
            name: "Certificate.TBSCertificate.validity",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.SEQUENCE,
            constructed: true,
            // Note: UTC and generalized times may both appear so the capture
            // names are based on their detected order, the names used below
            // are only for the common case, which validity time really means
            // "notBefore" and which means "notAfter" will be determined by order
            value: [{
              // notBefore (Time) (UTC time case)
              name: "Certificate.TBSCertificate.validity.notBefore (utc)",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.UTCTIME,
              constructed: false,
              optional: true,
              capture: "certValidity1UTCTime"
            }, {
              // notBefore (Time) (generalized time case)
              name: "Certificate.TBSCertificate.validity.notBefore (generalized)",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.GENERALIZEDTIME,
              constructed: false,
              optional: true,
              capture: "certValidity2GeneralizedTime"
            }, {
              // notAfter (Time) (only UTC time is supported)
              name: "Certificate.TBSCertificate.validity.notAfter (utc)",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.UTCTIME,
              constructed: false,
              optional: true,
              capture: "certValidity3UTCTime"
            }, {
              // notAfter (Time) (only UTC time is supported)
              name: "Certificate.TBSCertificate.validity.notAfter (generalized)",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.GENERALIZEDTIME,
              constructed: false,
              optional: true,
              capture: "certValidity4GeneralizedTime"
            }]
          },
          {
            // Name (subject) (RDNSequence)
            name: "Certificate.TBSCertificate.subject",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.SEQUENCE,
            constructed: true,
            captureAsn1: "certSubject"
          },
          // SubjectPublicKeyInfo
          publicKeyValidator,
          {
            // issuerUniqueID (optional)
            name: "Certificate.TBSCertificate.issuerUniqueID",
            tagClass: asn1.Class.CONTEXT_SPECIFIC,
            type: 1,
            constructed: true,
            optional: true,
            value: [{
              name: "Certificate.TBSCertificate.issuerUniqueID.id",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.BITSTRING,
              constructed: false,
              // TODO: support arbitrary bit length ids
              captureBitStringValue: "certIssuerUniqueId"
            }]
          },
          {
            // subjectUniqueID (optional)
            name: "Certificate.TBSCertificate.subjectUniqueID",
            tagClass: asn1.Class.CONTEXT_SPECIFIC,
            type: 2,
            constructed: true,
            optional: true,
            value: [{
              name: "Certificate.TBSCertificate.subjectUniqueID.id",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.BITSTRING,
              constructed: false,
              // TODO: support arbitrary bit length ids
              captureBitStringValue: "certSubjectUniqueId"
            }]
          },
          {
            // Extensions (optional)
            name: "Certificate.TBSCertificate.extensions",
            tagClass: asn1.Class.CONTEXT_SPECIFIC,
            type: 3,
            constructed: true,
            captureAsn1: "certExtensions",
            optional: true
          }
        ]
      }, {
        // AlgorithmIdentifier (signature algorithm)
        name: "Certificate.signatureAlgorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          // algorithm
          name: "Certificate.signatureAlgorithm.algorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "certSignatureOid"
        }, {
          name: "Certificate.TBSCertificate.signature.parameters",
          tagClass: asn1.Class.UNIVERSAL,
          optional: true,
          captureAsn1: "certSignatureParams"
        }]
      }, {
        // SignatureValue
        name: "Certificate.signatureValue",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.BITSTRING,
        constructed: false,
        captureBitStringValue: "certSignature"
      }]
    };
    var rsassaPssParameterValidator = {
      name: "rsapss",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "rsapss.hashAlgorithm",
        tagClass: asn1.Class.CONTEXT_SPECIFIC,
        type: 0,
        constructed: true,
        value: [{
          name: "rsapss.hashAlgorithm.AlgorithmIdentifier",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Class.SEQUENCE,
          constructed: true,
          optional: true,
          value: [{
            name: "rsapss.hashAlgorithm.AlgorithmIdentifier.algorithm",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.OID,
            constructed: false,
            capture: "hashOid"
            /* parameter block omitted, for SHA1 NULL anyhow. */
          }]
        }]
      }, {
        name: "rsapss.maskGenAlgorithm",
        tagClass: asn1.Class.CONTEXT_SPECIFIC,
        type: 1,
        constructed: true,
        value: [{
          name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Class.SEQUENCE,
          constructed: true,
          optional: true,
          value: [{
            name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier.algorithm",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.OID,
            constructed: false,
            capture: "maskGenOid"
          }, {
            name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier.params",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.SEQUENCE,
            constructed: true,
            value: [{
              name: "rsapss.maskGenAlgorithm.AlgorithmIdentifier.params.algorithm",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.OID,
              constructed: false,
              capture: "maskGenHashOid"
              /* parameter block omitted, for SHA1 NULL anyhow. */
            }]
          }]
        }]
      }, {
        name: "rsapss.saltLength",
        tagClass: asn1.Class.CONTEXT_SPECIFIC,
        type: 2,
        optional: true,
        value: [{
          name: "rsapss.saltLength.saltLength",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Class.INTEGER,
          constructed: false,
          capture: "saltLength"
        }]
      }, {
        name: "rsapss.trailerField",
        tagClass: asn1.Class.CONTEXT_SPECIFIC,
        type: 3,
        optional: true,
        value: [{
          name: "rsapss.trailer.trailer",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Class.INTEGER,
          constructed: false,
          capture: "trailer"
        }]
      }]
    };
    var certificationRequestInfoValidator = {
      name: "CertificationRequestInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      captureAsn1: "certificationRequestInfo",
      value: [
        {
          name: "CertificationRequestInfo.integer",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.INTEGER,
          constructed: false,
          capture: "certificationRequestInfoVersion"
        },
        {
          // Name (subject) (RDNSequence)
          name: "CertificationRequestInfo.subject",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.SEQUENCE,
          constructed: true,
          captureAsn1: "certificationRequestInfoSubject"
        },
        // SubjectPublicKeyInfo
        publicKeyValidator,
        {
          name: "CertificationRequestInfo.attributes",
          tagClass: asn1.Class.CONTEXT_SPECIFIC,
          type: 0,
          constructed: true,
          optional: true,
          capture: "certificationRequestInfoAttributes",
          value: [{
            name: "CertificationRequestInfo.attributes",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.SEQUENCE,
            constructed: true,
            value: [{
              name: "CertificationRequestInfo.attributes.type",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.OID,
              constructed: false
            }, {
              name: "CertificationRequestInfo.attributes.value",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.SET,
              constructed: true
            }]
          }]
        }
      ]
    };
    var certificationRequestValidator = {
      name: "CertificationRequest",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      captureAsn1: "csr",
      value: [
        certificationRequestInfoValidator,
        {
          // AlgorithmIdentifier (signature algorithm)
          name: "CertificationRequest.signatureAlgorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.SEQUENCE,
          constructed: true,
          value: [{
            // algorithm
            name: "CertificationRequest.signatureAlgorithm.algorithm",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.OID,
            constructed: false,
            capture: "csrSignatureOid"
          }, {
            name: "CertificationRequest.signatureAlgorithm.parameters",
            tagClass: asn1.Class.UNIVERSAL,
            optional: true,
            captureAsn1: "csrSignatureParams"
          }]
        },
        {
          // signature
          name: "CertificationRequest.signature",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.BITSTRING,
          constructed: false,
          captureBitStringValue: "csrSignature"
        }
      ]
    };
    pki.RDNAttributesAsArray = function(rdn, md) {
      var rval = [];
      var set, attr, obj;
      for (var si = 0; si < rdn.value.length; ++si) {
        set = rdn.value[si];
        for (var i2 = 0; i2 < set.value.length; ++i2) {
          obj = {};
          attr = set.value[i2];
          obj.type = asn1.derToOid(attr.value[0].value);
          obj.value = attr.value[1].value;
          obj.valueTagClass = attr.value[1].type;
          if (obj.type in oids) {
            obj.name = oids[obj.type];
            if (obj.name in _shortNames) {
              obj.shortName = _shortNames[obj.name];
            }
          }
          if (md) {
            md.update(obj.type);
            md.update(obj.value);
          }
          rval.push(obj);
        }
      }
      return rval;
    };
    pki.CRIAttributesAsArray = function(attributes) {
      var rval = [];
      for (var si = 0; si < attributes.length; ++si) {
        var seq = attributes[si];
        var type = asn1.derToOid(seq.value[0].value);
        var values = seq.value[1].value;
        for (var vi = 0; vi < values.length; ++vi) {
          var obj = {};
          obj.type = type;
          obj.value = values[vi].value;
          obj.valueTagClass = values[vi].type;
          if (obj.type in oids) {
            obj.name = oids[obj.type];
            if (obj.name in _shortNames) {
              obj.shortName = _shortNames[obj.name];
            }
          }
          if (obj.type === oids.extensionRequest) {
            obj.extensions = [];
            for (var ei = 0; ei < obj.value.length; ++ei) {
              obj.extensions.push(pki.certificateExtensionFromAsn1(obj.value[ei]));
            }
          }
          rval.push(obj);
        }
      }
      return rval;
    };
    function _getAttribute(obj, options) {
      if (typeof options === "string") {
        options = { shortName: options };
      }
      var rval = null;
      var attr;
      for (var i2 = 0; rval === null && i2 < obj.attributes.length; ++i2) {
        attr = obj.attributes[i2];
        if (options.type && options.type === attr.type) {
          rval = attr;
        } else if (options.name && options.name === attr.name) {
          rval = attr;
        } else if (options.shortName && options.shortName === attr.shortName) {
          rval = attr;
        }
      }
      return rval;
    }
    var _readSignatureParameters = function(oid, obj, fillDefaults) {
      var params = {};
      if (oid !== oids["RSASSA-PSS"]) {
        return params;
      }
      if (fillDefaults) {
        params = {
          hash: {
            algorithmOid: oids["sha1"]
          },
          mgf: {
            algorithmOid: oids["mgf1"],
            hash: {
              algorithmOid: oids["sha1"]
            }
          },
          saltLength: 20
        };
      }
      var capture = {};
      var errors = [];
      if (!asn1.validate(obj, rsassaPssParameterValidator, capture, errors)) {
        var error = new Error("Cannot read RSASSA-PSS parameter block.");
        error.errors = errors;
        throw error;
      }
      if (capture.hashOid !== void 0) {
        params.hash = params.hash || {};
        params.hash.algorithmOid = asn1.derToOid(capture.hashOid);
      }
      if (capture.maskGenOid !== void 0) {
        params.mgf = params.mgf || {};
        params.mgf.algorithmOid = asn1.derToOid(capture.maskGenOid);
        params.mgf.hash = params.mgf.hash || {};
        params.mgf.hash.algorithmOid = asn1.derToOid(capture.maskGenHashOid);
      }
      if (capture.saltLength !== void 0) {
        params.saltLength = capture.saltLength.charCodeAt(0);
      }
      return params;
    };
    var _createSignatureDigest = function(options) {
      switch (oids[options.signatureOid]) {
        case "sha1WithRSAEncryption":
        // deprecated alias
        case "sha1WithRSASignature":
          return forge.md.sha1.create();
        case "md5WithRSAEncryption":
          return forge.md.md5.create();
        case "sha256WithRSAEncryption":
          return forge.md.sha256.create();
        case "sha384WithRSAEncryption":
          return forge.md.sha384.create();
        case "sha512WithRSAEncryption":
          return forge.md.sha512.create();
        case "RSASSA-PSS":
          return forge.md.sha256.create();
        default:
          var error = new Error(
            "Could not compute " + options.type + " digest. Unknown signature OID."
          );
          error.signatureOid = options.signatureOid;
          throw error;
      }
    };
    var _verifySignature = function(options) {
      var cert = options.certificate;
      var scheme;
      switch (cert.signatureOid) {
        case oids.sha1WithRSAEncryption:
        // deprecated alias
        case oids.sha1WithRSASignature:
          break;
        case oids["RSASSA-PSS"]:
          var hash, mgf;
          hash = oids[cert.signatureParameters.mgf.hash.algorithmOid];
          if (hash === void 0 || forge.md[hash] === void 0) {
            var error = new Error("Unsupported MGF hash function.");
            error.oid = cert.signatureParameters.mgf.hash.algorithmOid;
            error.name = hash;
            throw error;
          }
          mgf = oids[cert.signatureParameters.mgf.algorithmOid];
          if (mgf === void 0 || forge.mgf[mgf] === void 0) {
            var error = new Error("Unsupported MGF function.");
            error.oid = cert.signatureParameters.mgf.algorithmOid;
            error.name = mgf;
            throw error;
          }
          mgf = forge.mgf[mgf].create(forge.md[hash].create());
          hash = oids[cert.signatureParameters.hash.algorithmOid];
          if (hash === void 0 || forge.md[hash] === void 0) {
            var error = new Error("Unsupported RSASSA-PSS hash function.");
            error.oid = cert.signatureParameters.hash.algorithmOid;
            error.name = hash;
            throw error;
          }
          scheme = forge.pss.create(
            forge.md[hash].create(),
            mgf,
            cert.signatureParameters.saltLength
          );
          break;
      }
      return cert.publicKey.verify(
        options.md.digest().getBytes(),
        options.signature,
        scheme
      );
    };
    pki.certificateFromPem = function(pem, computeHash, strict) {
      var msg = forge.pem.decode(pem)[0];
      if (msg.type !== "CERTIFICATE" && msg.type !== "X509 CERTIFICATE" && msg.type !== "TRUSTED CERTIFICATE") {
        var error = new Error(
          'Could not convert certificate from PEM; PEM header type is not "CERTIFICATE", "X509 CERTIFICATE", or "TRUSTED CERTIFICATE".'
        );
        error.headerType = msg.type;
        throw error;
      }
      if (msg.procType && msg.procType.type === "ENCRYPTED") {
        throw new Error(
          "Could not convert certificate from PEM; PEM is encrypted."
        );
      }
      var obj = asn1.fromDer(msg.body, strict);
      return pki.certificateFromAsn1(obj, computeHash);
    };
    pki.certificateToPem = function(cert, maxline) {
      var msg = {
        type: "CERTIFICATE",
        body: asn1.toDer(pki.certificateToAsn1(cert)).getBytes()
      };
      return forge.pem.encode(msg, { maxline });
    };
    pki.publicKeyFromPem = function(pem) {
      var msg = forge.pem.decode(pem)[0];
      if (msg.type !== "PUBLIC KEY" && msg.type !== "RSA PUBLIC KEY") {
        var error = new Error('Could not convert public key from PEM; PEM header type is not "PUBLIC KEY" or "RSA PUBLIC KEY".');
        error.headerType = msg.type;
        throw error;
      }
      if (msg.procType && msg.procType.type === "ENCRYPTED") {
        throw new Error("Could not convert public key from PEM; PEM is encrypted.");
      }
      var obj = asn1.fromDer(msg.body);
      return pki.publicKeyFromAsn1(obj);
    };
    pki.publicKeyToPem = function(key, maxline) {
      var msg = {
        type: "PUBLIC KEY",
        body: asn1.toDer(pki.publicKeyToAsn1(key)).getBytes()
      };
      return forge.pem.encode(msg, { maxline });
    };
    pki.publicKeyToRSAPublicKeyPem = function(key, maxline) {
      var msg = {
        type: "RSA PUBLIC KEY",
        body: asn1.toDer(pki.publicKeyToRSAPublicKey(key)).getBytes()
      };
      return forge.pem.encode(msg, { maxline });
    };
    pki.getPublicKeyFingerprint = function(key, options) {
      options = options || {};
      var md = options.md || forge.md.sha1.create();
      var type = options.type || "RSAPublicKey";
      var bytes;
      switch (type) {
        case "RSAPublicKey":
          bytes = asn1.toDer(pki.publicKeyToRSAPublicKey(key)).getBytes();
          break;
        case "SubjectPublicKeyInfo":
          bytes = asn1.toDer(pki.publicKeyToAsn1(key)).getBytes();
          break;
        default:
          throw new Error('Unknown fingerprint type "' + options.type + '".');
      }
      md.start();
      md.update(bytes);
      var digest = md.digest();
      if (options.encoding === "hex") {
        var hex = digest.toHex();
        if (options.delimiter) {
          return hex.match(/.{2}/g).join(options.delimiter);
        }
        return hex;
      } else if (options.encoding === "binary") {
        return digest.getBytes();
      } else if (options.encoding) {
        throw new Error('Unknown encoding "' + options.encoding + '".');
      }
      return digest;
    };
    pki.certificationRequestFromPem = function(pem, computeHash, strict) {
      var msg = forge.pem.decode(pem)[0];
      if (msg.type !== "CERTIFICATE REQUEST") {
        var error = new Error('Could not convert certification request from PEM; PEM header type is not "CERTIFICATE REQUEST".');
        error.headerType = msg.type;
        throw error;
      }
      if (msg.procType && msg.procType.type === "ENCRYPTED") {
        throw new Error("Could not convert certification request from PEM; PEM is encrypted.");
      }
      var obj = asn1.fromDer(msg.body, strict);
      return pki.certificationRequestFromAsn1(obj, computeHash);
    };
    pki.certificationRequestToPem = function(csr, maxline) {
      var msg = {
        type: "CERTIFICATE REQUEST",
        body: asn1.toDer(pki.certificationRequestToAsn1(csr)).getBytes()
      };
      return forge.pem.encode(msg, { maxline });
    };
    pki.createCertificate = function() {
      var cert = {};
      cert.version = 2;
      cert.serialNumber = "00";
      cert.signatureOid = null;
      cert.signature = null;
      cert.siginfo = {};
      cert.siginfo.algorithmOid = null;
      cert.validity = {};
      cert.validity.notBefore = /* @__PURE__ */ new Date();
      cert.validity.notAfter = /* @__PURE__ */ new Date();
      cert.issuer = {};
      cert.issuer.getField = function(sn) {
        return _getAttribute(cert.issuer, sn);
      };
      cert.issuer.addField = function(attr) {
        _fillMissingFields([attr]);
        cert.issuer.attributes.push(attr);
      };
      cert.issuer.attributes = [];
      cert.issuer.hash = null;
      cert.subject = {};
      cert.subject.getField = function(sn) {
        return _getAttribute(cert.subject, sn);
      };
      cert.subject.addField = function(attr) {
        _fillMissingFields([attr]);
        cert.subject.attributes.push(attr);
      };
      cert.subject.attributes = [];
      cert.subject.hash = null;
      cert.extensions = [];
      cert.publicKey = null;
      cert.md = null;
      cert.setSubject = function(attrs, uniqueId) {
        _fillMissingFields(attrs);
        cert.subject.attributes = attrs;
        delete cert.subject.uniqueId;
        if (uniqueId) {
          cert.subject.uniqueId = uniqueId;
        }
        cert.subject.hash = null;
      };
      cert.setIssuer = function(attrs, uniqueId) {
        _fillMissingFields(attrs);
        cert.issuer.attributes = attrs;
        delete cert.issuer.uniqueId;
        if (uniqueId) {
          cert.issuer.uniqueId = uniqueId;
        }
        cert.issuer.hash = null;
      };
      cert.setExtensions = function(exts) {
        for (var i2 = 0; i2 < exts.length; ++i2) {
          _fillMissingExtensionFields(exts[i2], { cert });
        }
        cert.extensions = exts;
      };
      cert.getExtension = function(options) {
        if (typeof options === "string") {
          options = { name: options };
        }
        var rval = null;
        var ext;
        for (var i2 = 0; rval === null && i2 < cert.extensions.length; ++i2) {
          ext = cert.extensions[i2];
          if (options.id && ext.id === options.id) {
            rval = ext;
          } else if (options.name && ext.name === options.name) {
            rval = ext;
          }
        }
        return rval;
      };
      cert.sign = function(key, md) {
        cert.md = md || forge.md.sha1.create();
        var algorithmOid = oids[cert.md.algorithm + "WithRSAEncryption"];
        if (!algorithmOid) {
          var error = new Error("Could not compute certificate digest. Unknown message digest algorithm OID.");
          error.algorithm = cert.md.algorithm;
          throw error;
        }
        cert.signatureOid = cert.siginfo.algorithmOid = algorithmOid;
        cert.tbsCertificate = pki.getTBSCertificate(cert);
        var bytes = asn1.toDer(cert.tbsCertificate);
        cert.md.update(bytes.getBytes());
        cert.signature = key.sign(cert.md);
      };
      cert.verify = function(child) {
        var rval = false;
        if (!cert.issued(child)) {
          var issuer = child.issuer;
          var subject = cert.subject;
          var error = new Error(
            "The parent certificate did not issue the given child certificate; the child certificate's issuer does not match the parent's subject."
          );
          error.expectedIssuer = subject.attributes;
          error.actualIssuer = issuer.attributes;
          throw error;
        }
        var md = child.md;
        if (md === null) {
          md = _createSignatureDigest({
            signatureOid: child.signatureOid,
            type: "certificate"
          });
          var tbsCertificate = child.tbsCertificate || pki.getTBSCertificate(child);
          var bytes = asn1.toDer(tbsCertificate);
          md.update(bytes.getBytes());
        }
        if (md !== null) {
          rval = _verifySignature({
            certificate: cert,
            md,
            signature: child.signature
          });
        }
        return rval;
      };
      cert.isIssuer = function(parent) {
        var rval = false;
        var i2 = cert.issuer;
        var s2 = parent.subject;
        if (i2.hash && s2.hash) {
          rval = i2.hash === s2.hash;
        } else if (i2.attributes.length === s2.attributes.length) {
          rval = true;
          var iattr, sattr;
          for (var n2 = 0; rval && n2 < i2.attributes.length; ++n2) {
            iattr = i2.attributes[n2];
            sattr = s2.attributes[n2];
            if (iattr.type !== sattr.type || iattr.value !== sattr.value) {
              rval = false;
            }
          }
        }
        return rval;
      };
      cert.issued = function(child) {
        return child.isIssuer(cert);
      };
      cert.generateSubjectKeyIdentifier = function() {
        return pki.getPublicKeyFingerprint(cert.publicKey, { type: "RSAPublicKey" });
      };
      cert.verifySubjectKeyIdentifier = function() {
        var oid = oids["subjectKeyIdentifier"];
        for (var i2 = 0; i2 < cert.extensions.length; ++i2) {
          var ext = cert.extensions[i2];
          if (ext.id === oid) {
            var ski = cert.generateSubjectKeyIdentifier().getBytes();
            return forge.util.hexToBytes(ext.subjectKeyIdentifier) === ski;
          }
        }
        return false;
      };
      return cert;
    };
    pki.certificateFromAsn1 = function(obj, computeHash) {
      var capture = {};
      var errors = [];
      if (!asn1.validate(obj, x509CertificateValidator, capture, errors)) {
        var error = new Error("Cannot read X.509 certificate. ASN.1 object is not an X509v3 Certificate.");
        error.errors = errors;
        throw error;
      }
      var oid = asn1.derToOid(capture.publicKeyOid);
      if (oid !== pki.oids.rsaEncryption) {
        throw new Error("Cannot read public key. OID is not RSA.");
      }
      var cert = pki.createCertificate();
      cert.version = capture.certVersion ? capture.certVersion.charCodeAt(0) : 0;
      var serial = forge.util.createBuffer(capture.certSerialNumber);
      cert.serialNumber = serial.toHex();
      cert.signatureOid = forge.asn1.derToOid(capture.certSignatureOid);
      cert.signatureParameters = _readSignatureParameters(
        cert.signatureOid,
        capture.certSignatureParams,
        true
      );
      cert.siginfo.algorithmOid = forge.asn1.derToOid(capture.certinfoSignatureOid);
      cert.siginfo.parameters = _readSignatureParameters(
        cert.siginfo.algorithmOid,
        capture.certinfoSignatureParams,
        false
      );
      cert.signature = capture.certSignature;
      var validity = [];
      if (capture.certValidity1UTCTime !== void 0) {
        validity.push(asn1.utcTimeToDate(capture.certValidity1UTCTime));
      }
      if (capture.certValidity2GeneralizedTime !== void 0) {
        validity.push(asn1.generalizedTimeToDate(
          capture.certValidity2GeneralizedTime
        ));
      }
      if (capture.certValidity3UTCTime !== void 0) {
        validity.push(asn1.utcTimeToDate(capture.certValidity3UTCTime));
      }
      if (capture.certValidity4GeneralizedTime !== void 0) {
        validity.push(asn1.generalizedTimeToDate(
          capture.certValidity4GeneralizedTime
        ));
      }
      if (validity.length > 2) {
        throw new Error("Cannot read notBefore/notAfter validity times; more than two times were provided in the certificate.");
      }
      if (validity.length < 2) {
        throw new Error("Cannot read notBefore/notAfter validity times; they were not provided as either UTCTime or GeneralizedTime.");
      }
      cert.validity.notBefore = validity[0];
      cert.validity.notAfter = validity[1];
      cert.tbsCertificate = capture.tbsCertificate;
      if (computeHash) {
        cert.md = _createSignatureDigest({
          signatureOid: cert.signatureOid,
          type: "certificate"
        });
        var bytes = asn1.toDer(cert.tbsCertificate);
        cert.md.update(bytes.getBytes());
      }
      var imd = forge.md.sha1.create();
      var ibytes = asn1.toDer(capture.certIssuer);
      imd.update(ibytes.getBytes());
      cert.issuer.getField = function(sn) {
        return _getAttribute(cert.issuer, sn);
      };
      cert.issuer.addField = function(attr) {
        _fillMissingFields([attr]);
        cert.issuer.attributes.push(attr);
      };
      cert.issuer.attributes = pki.RDNAttributesAsArray(capture.certIssuer);
      if (capture.certIssuerUniqueId) {
        cert.issuer.uniqueId = capture.certIssuerUniqueId;
      }
      cert.issuer.hash = imd.digest().toHex();
      var smd = forge.md.sha1.create();
      var sbytes = asn1.toDer(capture.certSubject);
      smd.update(sbytes.getBytes());
      cert.subject.getField = function(sn) {
        return _getAttribute(cert.subject, sn);
      };
      cert.subject.addField = function(attr) {
        _fillMissingFields([attr]);
        cert.subject.attributes.push(attr);
      };
      cert.subject.attributes = pki.RDNAttributesAsArray(capture.certSubject);
      if (capture.certSubjectUniqueId) {
        cert.subject.uniqueId = capture.certSubjectUniqueId;
      }
      cert.subject.hash = smd.digest().toHex();
      if (capture.certExtensions) {
        cert.extensions = pki.certificateExtensionsFromAsn1(capture.certExtensions);
      } else {
        cert.extensions = [];
      }
      cert.publicKey = pki.publicKeyFromAsn1(capture.subjectPublicKeyInfo);
      return cert;
    };
    pki.certificateExtensionsFromAsn1 = function(exts) {
      var rval = [];
      for (var i2 = 0; i2 < exts.value.length; ++i2) {
        var extseq = exts.value[i2];
        for (var ei = 0; ei < extseq.value.length; ++ei) {
          rval.push(pki.certificateExtensionFromAsn1(extseq.value[ei]));
        }
      }
      return rval;
    };
    pki.certificateExtensionFromAsn1 = function(ext) {
      var e2 = {};
      e2.id = asn1.derToOid(ext.value[0].value);
      e2.critical = false;
      if (ext.value[1].type === asn1.Type.BOOLEAN) {
        e2.critical = ext.value[1].value.charCodeAt(0) !== 0;
        e2.value = ext.value[2].value;
      } else {
        e2.value = ext.value[1].value;
      }
      if (e2.id in oids) {
        e2.name = oids[e2.id];
        if (e2.name === "keyUsage") {
          var ev = asn1.fromDer(e2.value);
          var b2 = 0;
          var b3 = 0;
          if (ev.value.length > 1) {
            b2 = ev.value.charCodeAt(1);
            b3 = ev.value.length > 2 ? ev.value.charCodeAt(2) : 0;
          }
          e2.digitalSignature = (b2 & 128) === 128;
          e2.nonRepudiation = (b2 & 64) === 64;
          e2.keyEncipherment = (b2 & 32) === 32;
          e2.dataEncipherment = (b2 & 16) === 16;
          e2.keyAgreement = (b2 & 8) === 8;
          e2.keyCertSign = (b2 & 4) === 4;
          e2.cRLSign = (b2 & 2) === 2;
          e2.encipherOnly = (b2 & 1) === 1;
          e2.decipherOnly = (b3 & 128) === 128;
        } else if (e2.name === "basicConstraints") {
          var ev = asn1.fromDer(e2.value);
          if (ev.value.length > 0 && ev.value[0].type === asn1.Type.BOOLEAN) {
            e2.cA = ev.value[0].value.charCodeAt(0) !== 0;
          } else {
            e2.cA = false;
          }
          var value = null;
          if (ev.value.length > 0 && ev.value[0].type === asn1.Type.INTEGER) {
            value = ev.value[0].value;
          } else if (ev.value.length > 1) {
            value = ev.value[1].value;
          }
          if (value !== null) {
            e2.pathLenConstraint = asn1.derToInteger(value);
          }
        } else if (e2.name === "extKeyUsage") {
          var ev = asn1.fromDer(e2.value);
          for (var vi = 0; vi < ev.value.length; ++vi) {
            var oid = asn1.derToOid(ev.value[vi].value);
            if (oid in oids) {
              e2[oids[oid]] = true;
            } else {
              e2[oid] = true;
            }
          }
        } else if (e2.name === "nsCertType") {
          var ev = asn1.fromDer(e2.value);
          var b2 = 0;
          if (ev.value.length > 1) {
            b2 = ev.value.charCodeAt(1);
          }
          e2.client = (b2 & 128) === 128;
          e2.server = (b2 & 64) === 64;
          e2.email = (b2 & 32) === 32;
          e2.objsign = (b2 & 16) === 16;
          e2.reserved = (b2 & 8) === 8;
          e2.sslCA = (b2 & 4) === 4;
          e2.emailCA = (b2 & 2) === 2;
          e2.objCA = (b2 & 1) === 1;
        } else if (e2.name === "subjectAltName" || e2.name === "issuerAltName") {
          e2.altNames = [];
          var gn;
          var ev = asn1.fromDer(e2.value);
          for (var n2 = 0; n2 < ev.value.length; ++n2) {
            gn = ev.value[n2];
            var altName = {
              type: gn.type,
              value: gn.value
            };
            e2.altNames.push(altName);
            switch (gn.type) {
              // rfc822Name
              case 1:
              // dNSName
              case 2:
              // uniformResourceIdentifier (URI)
              case 6:
                break;
              // IPAddress
              case 7:
                altName.ip = forge.util.bytesToIP(gn.value);
                break;
              // registeredID
              case 8:
                altName.oid = asn1.derToOid(gn.value);
                break;
              default:
            }
          }
        } else if (e2.name === "subjectKeyIdentifier") {
          var ev = asn1.fromDer(e2.value);
          e2.subjectKeyIdentifier = forge.util.bytesToHex(ev.value);
        }
      }
      return e2;
    };
    pki.certificationRequestFromAsn1 = function(obj, computeHash) {
      var capture = {};
      var errors = [];
      if (!asn1.validate(obj, certificationRequestValidator, capture, errors)) {
        var error = new Error("Cannot read PKCS#10 certificate request. ASN.1 object is not a PKCS#10 CertificationRequest.");
        error.errors = errors;
        throw error;
      }
      var oid = asn1.derToOid(capture.publicKeyOid);
      if (oid !== pki.oids.rsaEncryption) {
        throw new Error("Cannot read public key. OID is not RSA.");
      }
      var csr = pki.createCertificationRequest();
      csr.version = capture.csrVersion ? capture.csrVersion.charCodeAt(0) : 0;
      csr.signatureOid = forge.asn1.derToOid(capture.csrSignatureOid);
      csr.signatureParameters = _readSignatureParameters(
        csr.signatureOid,
        capture.csrSignatureParams,
        true
      );
      csr.siginfo.algorithmOid = forge.asn1.derToOid(capture.csrSignatureOid);
      csr.siginfo.parameters = _readSignatureParameters(
        csr.siginfo.algorithmOid,
        capture.csrSignatureParams,
        false
      );
      csr.signature = capture.csrSignature;
      csr.certificationRequestInfo = capture.certificationRequestInfo;
      if (computeHash) {
        csr.md = _createSignatureDigest({
          signatureOid: csr.signatureOid,
          type: "certification request"
        });
        var bytes = asn1.toDer(csr.certificationRequestInfo);
        csr.md.update(bytes.getBytes());
      }
      var smd = forge.md.sha1.create();
      csr.subject.getField = function(sn) {
        return _getAttribute(csr.subject, sn);
      };
      csr.subject.addField = function(attr) {
        _fillMissingFields([attr]);
        csr.subject.attributes.push(attr);
      };
      csr.subject.attributes = pki.RDNAttributesAsArray(
        capture.certificationRequestInfoSubject,
        smd
      );
      csr.subject.hash = smd.digest().toHex();
      csr.publicKey = pki.publicKeyFromAsn1(capture.subjectPublicKeyInfo);
      csr.getAttribute = function(sn) {
        return _getAttribute(csr, sn);
      };
      csr.addAttribute = function(attr) {
        _fillMissingFields([attr]);
        csr.attributes.push(attr);
      };
      csr.attributes = pki.CRIAttributesAsArray(
        capture.certificationRequestInfoAttributes || []
      );
      return csr;
    };
    pki.createCertificationRequest = function() {
      var csr = {};
      csr.version = 0;
      csr.signatureOid = null;
      csr.signature = null;
      csr.siginfo = {};
      csr.siginfo.algorithmOid = null;
      csr.subject = {};
      csr.subject.getField = function(sn) {
        return _getAttribute(csr.subject, sn);
      };
      csr.subject.addField = function(attr) {
        _fillMissingFields([attr]);
        csr.subject.attributes.push(attr);
      };
      csr.subject.attributes = [];
      csr.subject.hash = null;
      csr.publicKey = null;
      csr.attributes = [];
      csr.getAttribute = function(sn) {
        return _getAttribute(csr, sn);
      };
      csr.addAttribute = function(attr) {
        _fillMissingFields([attr]);
        csr.attributes.push(attr);
      };
      csr.md = null;
      csr.setSubject = function(attrs) {
        _fillMissingFields(attrs);
        csr.subject.attributes = attrs;
        csr.subject.hash = null;
      };
      csr.setAttributes = function(attrs) {
        _fillMissingFields(attrs);
        csr.attributes = attrs;
      };
      csr.sign = function(key, md) {
        csr.md = md || forge.md.sha1.create();
        var algorithmOid = oids[csr.md.algorithm + "WithRSAEncryption"];
        if (!algorithmOid) {
          var error = new Error("Could not compute certification request digest. Unknown message digest algorithm OID.");
          error.algorithm = csr.md.algorithm;
          throw error;
        }
        csr.signatureOid = csr.siginfo.algorithmOid = algorithmOid;
        csr.certificationRequestInfo = pki.getCertificationRequestInfo(csr);
        var bytes = asn1.toDer(csr.certificationRequestInfo);
        csr.md.update(bytes.getBytes());
        csr.signature = key.sign(csr.md);
      };
      csr.verify = function() {
        var rval = false;
        var md = csr.md;
        if (md === null) {
          md = _createSignatureDigest({
            signatureOid: csr.signatureOid,
            type: "certification request"
          });
          var cri = csr.certificationRequestInfo || pki.getCertificationRequestInfo(csr);
          var bytes = asn1.toDer(cri);
          md.update(bytes.getBytes());
        }
        if (md !== null) {
          rval = _verifySignature({
            certificate: csr,
            md,
            signature: csr.signature
          });
        }
        return rval;
      };
      return csr;
    };
    function _dnToAsn1(obj) {
      var rval = asn1.create(
        asn1.Class.UNIVERSAL,
        asn1.Type.SEQUENCE,
        true,
        []
      );
      var attr, set;
      var attrs = obj.attributes;
      for (var i2 = 0; i2 < attrs.length; ++i2) {
        attr = attrs[i2];
        var value = attr.value;
        var valueTagClass = asn1.Type.PRINTABLESTRING;
        if ("valueTagClass" in attr) {
          valueTagClass = attr.valueTagClass;
          if (valueTagClass === asn1.Type.UTF8) {
            value = forge.util.encodeUtf8(value);
          }
        }
        set = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // AttributeType
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(attr.type).getBytes()
            ),
            // AttributeValue
            asn1.create(asn1.Class.UNIVERSAL, valueTagClass, false, value)
          ])
        ]);
        rval.value.push(set);
      }
      return rval;
    }
    function _fillMissingFields(attrs) {
      var attr;
      for (var i2 = 0; i2 < attrs.length; ++i2) {
        attr = attrs[i2];
        if (typeof attr.name === "undefined") {
          if (attr.type && attr.type in pki.oids) {
            attr.name = pki.oids[attr.type];
          } else if (attr.shortName && attr.shortName in _shortNames) {
            attr.name = pki.oids[_shortNames[attr.shortName]];
          }
        }
        if (typeof attr.type === "undefined") {
          if (attr.name && attr.name in pki.oids) {
            attr.type = pki.oids[attr.name];
          } else {
            var error = new Error("Attribute type not specified.");
            error.attribute = attr;
            throw error;
          }
        }
        if (typeof attr.shortName === "undefined") {
          if (attr.name && attr.name in _shortNames) {
            attr.shortName = _shortNames[attr.name];
          }
        }
        if (attr.type === oids.extensionRequest) {
          attr.valueConstructed = true;
          attr.valueTagClass = asn1.Type.SEQUENCE;
          if (!attr.value && attr.extensions) {
            attr.value = [];
            for (var ei = 0; ei < attr.extensions.length; ++ei) {
              attr.value.push(pki.certificateExtensionToAsn1(
                _fillMissingExtensionFields(attr.extensions[ei])
              ));
            }
          }
        }
        if (typeof attr.value === "undefined") {
          var error = new Error("Attribute value not specified.");
          error.attribute = attr;
          throw error;
        }
      }
    }
    function _fillMissingExtensionFields(e2, options) {
      options = options || {};
      if (typeof e2.name === "undefined") {
        if (e2.id && e2.id in pki.oids) {
          e2.name = pki.oids[e2.id];
        }
      }
      if (typeof e2.id === "undefined") {
        if (e2.name && e2.name in pki.oids) {
          e2.id = pki.oids[e2.name];
        } else {
          var error = new Error("Extension ID not specified.");
          error.extension = e2;
          throw error;
        }
      }
      if (typeof e2.value !== "undefined") {
        return e2;
      }
      if (e2.name === "keyUsage") {
        var unused = 0;
        var b2 = 0;
        var b3 = 0;
        if (e2.digitalSignature) {
          b2 |= 128;
          unused = 7;
        }
        if (e2.nonRepudiation) {
          b2 |= 64;
          unused = 6;
        }
        if (e2.keyEncipherment) {
          b2 |= 32;
          unused = 5;
        }
        if (e2.dataEncipherment) {
          b2 |= 16;
          unused = 4;
        }
        if (e2.keyAgreement) {
          b2 |= 8;
          unused = 3;
        }
        if (e2.keyCertSign) {
          b2 |= 4;
          unused = 2;
        }
        if (e2.cRLSign) {
          b2 |= 2;
          unused = 1;
        }
        if (e2.encipherOnly) {
          b2 |= 1;
          unused = 0;
        }
        if (e2.decipherOnly) {
          b3 |= 128;
          unused = 7;
        }
        var value = String.fromCharCode(unused);
        if (b3 !== 0) {
          value += String.fromCharCode(b2) + String.fromCharCode(b3);
        } else if (b2 !== 0) {
          value += String.fromCharCode(b2);
        }
        e2.value = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.BITSTRING,
          false,
          value
        );
      } else if (e2.name === "basicConstraints") {
        e2.value = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.SEQUENCE,
          true,
          []
        );
        if (e2.cA) {
          e2.value.value.push(asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.BOOLEAN,
            false,
            String.fromCharCode(255)
          ));
        }
        if ("pathLenConstraint" in e2) {
          e2.value.value.push(asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.INTEGER,
            false,
            asn1.integerToDer(e2.pathLenConstraint).getBytes()
          ));
        }
      } else if (e2.name === "extKeyUsage") {
        e2.value = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.SEQUENCE,
          true,
          []
        );
        var seq = e2.value.value;
        for (var key in e2) {
          if (e2[key] !== true) {
            continue;
          }
          if (key in oids) {
            seq.push(asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(oids[key]).getBytes()
            ));
          } else if (key.indexOf(".") !== -1) {
            seq.push(asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(key).getBytes()
            ));
          }
        }
      } else if (e2.name === "nsCertType") {
        var unused = 0;
        var b2 = 0;
        if (e2.client) {
          b2 |= 128;
          unused = 7;
        }
        if (e2.server) {
          b2 |= 64;
          unused = 6;
        }
        if (e2.email) {
          b2 |= 32;
          unused = 5;
        }
        if (e2.objsign) {
          b2 |= 16;
          unused = 4;
        }
        if (e2.reserved) {
          b2 |= 8;
          unused = 3;
        }
        if (e2.sslCA) {
          b2 |= 4;
          unused = 2;
        }
        if (e2.emailCA) {
          b2 |= 2;
          unused = 1;
        }
        if (e2.objCA) {
          b2 |= 1;
          unused = 0;
        }
        var value = String.fromCharCode(unused);
        if (b2 !== 0) {
          value += String.fromCharCode(b2);
        }
        e2.value = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.BITSTRING,
          false,
          value
        );
      } else if (e2.name === "subjectAltName" || e2.name === "issuerAltName") {
        e2.value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
        var altName;
        for (var n2 = 0; n2 < e2.altNames.length; ++n2) {
          altName = e2.altNames[n2];
          var value = altName.value;
          if (altName.type === 7 && altName.ip) {
            value = forge.util.bytesFromIP(altName.ip);
            if (value === null) {
              var error = new Error(
                'Extension "ip" value is not a valid IPv4 or IPv6 address.'
              );
              error.extension = e2;
              throw error;
            }
          } else if (altName.type === 8) {
            if (altName.oid) {
              value = asn1.oidToDer(asn1.oidToDer(altName.oid));
            } else {
              value = asn1.oidToDer(value);
            }
          }
          e2.value.value.push(asn1.create(
            asn1.Class.CONTEXT_SPECIFIC,
            altName.type,
            false,
            value
          ));
        }
      } else if (e2.name === "nsComment" && options.cert) {
        if (!/^[\x00-\x7F]*$/.test(e2.comment) || e2.comment.length < 1 || e2.comment.length > 128) {
          throw new Error('Invalid "nsComment" content.');
        }
        e2.value = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.IA5STRING,
          false,
          e2.comment
        );
      } else if (e2.name === "subjectKeyIdentifier" && options.cert) {
        var ski = options.cert.generateSubjectKeyIdentifier();
        e2.subjectKeyIdentifier = ski.toHex();
        e2.value = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OCTETSTRING,
          false,
          ski.getBytes()
        );
      } else if (e2.name === "authorityKeyIdentifier" && options.cert) {
        e2.value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
        var seq = e2.value.value;
        if (e2.keyIdentifier) {
          var keyIdentifier = e2.keyIdentifier === true ? options.cert.generateSubjectKeyIdentifier().getBytes() : e2.keyIdentifier;
          seq.push(
            asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, false, keyIdentifier)
          );
        }
        if (e2.authorityCertIssuer) {
          var authorityCertIssuer = [
            asn1.create(asn1.Class.CONTEXT_SPECIFIC, 4, true, [
              _dnToAsn1(e2.authorityCertIssuer === true ? options.cert.issuer : e2.authorityCertIssuer)
            ])
          ];
          seq.push(
            asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, authorityCertIssuer)
          );
        }
        if (e2.serialNumber) {
          var serialNumber = forge.util.hexToBytes(e2.serialNumber === true ? options.cert.serialNumber : e2.serialNumber);
          seq.push(
            asn1.create(asn1.Class.CONTEXT_SPECIFIC, 2, false, serialNumber)
          );
        }
      } else if (e2.name === "cRLDistributionPoints") {
        e2.value = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
        var seq = e2.value.value;
        var subSeq = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.SEQUENCE,
          true,
          []
        );
        var fullNameGeneralNames = asn1.create(
          asn1.Class.CONTEXT_SPECIFIC,
          0,
          true,
          []
        );
        var altName;
        for (var n2 = 0; n2 < e2.altNames.length; ++n2) {
          altName = e2.altNames[n2];
          var value = altName.value;
          if (altName.type === 7 && altName.ip) {
            value = forge.util.bytesFromIP(altName.ip);
            if (value === null) {
              var error = new Error(
                'Extension "ip" value is not a valid IPv4 or IPv6 address.'
              );
              error.extension = e2;
              throw error;
            }
          } else if (altName.type === 8) {
            if (altName.oid) {
              value = asn1.oidToDer(asn1.oidToDer(altName.oid));
            } else {
              value = asn1.oidToDer(value);
            }
          }
          fullNameGeneralNames.value.push(asn1.create(
            asn1.Class.CONTEXT_SPECIFIC,
            altName.type,
            false,
            value
          ));
        }
        subSeq.value.push(asn1.create(
          asn1.Class.CONTEXT_SPECIFIC,
          0,
          true,
          [fullNameGeneralNames]
        ));
        seq.push(subSeq);
      }
      if (typeof e2.value === "undefined") {
        var error = new Error("Extension value not specified.");
        error.extension = e2;
        throw error;
      }
      return e2;
    }
    function _signatureParametersToAsn1(oid, params) {
      switch (oid) {
        case oids["RSASSA-PSS"]:
          var parts = [];
          if (params.hash.algorithmOid !== void 0) {
            parts.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
              asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
                asn1.create(
                  asn1.Class.UNIVERSAL,
                  asn1.Type.OID,
                  false,
                  asn1.oidToDer(params.hash.algorithmOid).getBytes()
                ),
                asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")
              ])
            ]));
          }
          if (params.mgf.algorithmOid !== void 0) {
            parts.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, [
              asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
                asn1.create(
                  asn1.Class.UNIVERSAL,
                  asn1.Type.OID,
                  false,
                  asn1.oidToDer(params.mgf.algorithmOid).getBytes()
                ),
                asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
                  asn1.create(
                    asn1.Class.UNIVERSAL,
                    asn1.Type.OID,
                    false,
                    asn1.oidToDer(params.mgf.hash.algorithmOid).getBytes()
                  ),
                  asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")
                ])
              ])
            ]));
          }
          if (params.saltLength !== void 0) {
            parts.push(asn1.create(asn1.Class.CONTEXT_SPECIFIC, 2, true, [
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.INTEGER,
                false,
                asn1.integerToDer(params.saltLength).getBytes()
              )
            ]));
          }
          return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, parts);
        default:
          return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "");
      }
    }
    function _CRIAttributesToAsn1(csr) {
      var rval = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, []);
      if (csr.attributes.length === 0) {
        return rval;
      }
      var attrs = csr.attributes;
      for (var i2 = 0; i2 < attrs.length; ++i2) {
        var attr = attrs[i2];
        var value = attr.value;
        var valueTagClass = asn1.Type.UTF8;
        if ("valueTagClass" in attr) {
          valueTagClass = attr.valueTagClass;
        }
        if (valueTagClass === asn1.Type.UTF8) {
          value = forge.util.encodeUtf8(value);
        }
        var valueConstructed = false;
        if ("valueConstructed" in attr) {
          valueConstructed = attr.valueConstructed;
        }
        var seq = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // AttributeType
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OID,
            false,
            asn1.oidToDer(attr.type).getBytes()
          ),
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [
            // AttributeValue
            asn1.create(
              asn1.Class.UNIVERSAL,
              valueTagClass,
              valueConstructed,
              value
            )
          ])
        ]);
        rval.value.push(seq);
      }
      return rval;
    }
    var jan_1_1950 = /* @__PURE__ */ new Date("1950-01-01T00:00:00Z");
    var jan_1_2050 = /* @__PURE__ */ new Date("2050-01-01T00:00:00Z");
    function _dateToAsn1(date) {
      if (date >= jan_1_1950 && date < jan_1_2050) {
        return asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.UTCTIME,
          false,
          asn1.dateToUtcTime(date)
        );
      } else {
        return asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.GENERALIZEDTIME,
          false,
          asn1.dateToGeneralizedTime(date)
        );
      }
    }
    pki.getTBSCertificate = function(cert) {
      var notBefore = _dateToAsn1(cert.validity.notBefore);
      var notAfter = _dateToAsn1(cert.validity.notAfter);
      var tbs = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // version
        asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
          // integer
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.INTEGER,
            false,
            asn1.integerToDer(cert.version).getBytes()
          )
        ]),
        // serialNumber
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          forge.util.hexToBytes(cert.serialNumber)
        ),
        // signature
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // algorithm
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OID,
            false,
            asn1.oidToDer(cert.siginfo.algorithmOid).getBytes()
          ),
          // parameters
          _signatureParametersToAsn1(
            cert.siginfo.algorithmOid,
            cert.siginfo.parameters
          )
        ]),
        // issuer
        _dnToAsn1(cert.issuer),
        // validity
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          notBefore,
          notAfter
        ]),
        // subject
        _dnToAsn1(cert.subject),
        // SubjectPublicKeyInfo
        pki.publicKeyToAsn1(cert.publicKey)
      ]);
      if (cert.issuer.uniqueId) {
        tbs.value.push(
          asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, [
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.BITSTRING,
              false,
              // TODO: support arbitrary bit length ids
              String.fromCharCode(0) + cert.issuer.uniqueId
            )
          ])
        );
      }
      if (cert.subject.uniqueId) {
        tbs.value.push(
          asn1.create(asn1.Class.CONTEXT_SPECIFIC, 2, true, [
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.BITSTRING,
              false,
              // TODO: support arbitrary bit length ids
              String.fromCharCode(0) + cert.subject.uniqueId
            )
          ])
        );
      }
      if (cert.extensions.length > 0) {
        tbs.value.push(pki.certificateExtensionsToAsn1(cert.extensions));
      }
      return tbs;
    };
    pki.getCertificationRequestInfo = function(csr) {
      var cri = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // version
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          asn1.integerToDer(csr.version).getBytes()
        ),
        // subject
        _dnToAsn1(csr.subject),
        // SubjectPublicKeyInfo
        pki.publicKeyToAsn1(csr.publicKey),
        // attributes
        _CRIAttributesToAsn1(csr)
      ]);
      return cri;
    };
    pki.distinguishedNameToAsn1 = function(dn) {
      return _dnToAsn1(dn);
    };
    pki.certificateToAsn1 = function(cert) {
      var tbsCertificate = cert.tbsCertificate || pki.getTBSCertificate(cert);
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // TBSCertificate
        tbsCertificate,
        // AlgorithmIdentifier (signature algorithm)
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // algorithm
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OID,
            false,
            asn1.oidToDer(cert.signatureOid).getBytes()
          ),
          // parameters
          _signatureParametersToAsn1(cert.signatureOid, cert.signatureParameters)
        ]),
        // SignatureValue
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.BITSTRING,
          false,
          String.fromCharCode(0) + cert.signature
        )
      ]);
    };
    pki.certificateExtensionsToAsn1 = function(exts) {
      var rval = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 3, true, []);
      var seq = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
      rval.value.push(seq);
      for (var i2 = 0; i2 < exts.length; ++i2) {
        seq.value.push(pki.certificateExtensionToAsn1(exts[i2]));
      }
      return rval;
    };
    pki.certificateExtensionToAsn1 = function(ext) {
      var extseq = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, []);
      extseq.value.push(asn1.create(
        asn1.Class.UNIVERSAL,
        asn1.Type.OID,
        false,
        asn1.oidToDer(ext.id).getBytes()
      ));
      if (ext.critical) {
        extseq.value.push(asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.BOOLEAN,
          false,
          String.fromCharCode(255)
        ));
      }
      var value = ext.value;
      if (typeof ext.value !== "string") {
        value = asn1.toDer(value).getBytes();
      }
      extseq.value.push(asn1.create(
        asn1.Class.UNIVERSAL,
        asn1.Type.OCTETSTRING,
        false,
        value
      ));
      return extseq;
    };
    pki.certificationRequestToAsn1 = function(csr) {
      var cri = csr.certificationRequestInfo || pki.getCertificationRequestInfo(csr);
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // CertificationRequestInfo
        cri,
        // AlgorithmIdentifier (signature algorithm)
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // algorithm
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OID,
            false,
            asn1.oidToDer(csr.signatureOid).getBytes()
          ),
          // parameters
          _signatureParametersToAsn1(csr.signatureOid, csr.signatureParameters)
        ]),
        // signature
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.BITSTRING,
          false,
          String.fromCharCode(0) + csr.signature
        )
      ]);
    };
    pki.createCaStore = function(certs) {
      var caStore = {
        // stored certificates
        certs: {}
      };
      caStore.getIssuer = function(cert2) {
        var rval = getBySubject(cert2.issuer);
        return rval;
      };
      caStore.addCertificate = function(cert2) {
        if (typeof cert2 === "string") {
          cert2 = forge.pki.certificateFromPem(cert2);
        }
        ensureSubjectHasHash(cert2.subject);
        if (!caStore.hasCertificate(cert2)) {
          if (cert2.subject.hash in caStore.certs) {
            var tmp = caStore.certs[cert2.subject.hash];
            if (!forge.util.isArray(tmp)) {
              tmp = [tmp];
            }
            tmp.push(cert2);
            caStore.certs[cert2.subject.hash] = tmp;
          } else {
            caStore.certs[cert2.subject.hash] = cert2;
          }
        }
      };
      caStore.hasCertificate = function(cert2) {
        if (typeof cert2 === "string") {
          cert2 = forge.pki.certificateFromPem(cert2);
        }
        var match = getBySubject(cert2.subject);
        if (!match) {
          return false;
        }
        if (!forge.util.isArray(match)) {
          match = [match];
        }
        var der1 = asn1.toDer(pki.certificateToAsn1(cert2)).getBytes();
        for (var i3 = 0; i3 < match.length; ++i3) {
          var der2 = asn1.toDer(pki.certificateToAsn1(match[i3])).getBytes();
          if (der1 === der2) {
            return true;
          }
        }
        return false;
      };
      caStore.listAllCertificates = function() {
        var certList = [];
        for (var hash in caStore.certs) {
          if (caStore.certs.hasOwnProperty(hash)) {
            var value = caStore.certs[hash];
            if (!forge.util.isArray(value)) {
              certList.push(value);
            } else {
              for (var i3 = 0; i3 < value.length; ++i3) {
                certList.push(value[i3]);
              }
            }
          }
        }
        return certList;
      };
      caStore.removeCertificate = function(cert2) {
        var result;
        if (typeof cert2 === "string") {
          cert2 = forge.pki.certificateFromPem(cert2);
        }
        ensureSubjectHasHash(cert2.subject);
        if (!caStore.hasCertificate(cert2)) {
          return null;
        }
        var match = getBySubject(cert2.subject);
        if (!forge.util.isArray(match)) {
          result = caStore.certs[cert2.subject.hash];
          delete caStore.certs[cert2.subject.hash];
          return result;
        }
        var der1 = asn1.toDer(pki.certificateToAsn1(cert2)).getBytes();
        for (var i3 = 0; i3 < match.length; ++i3) {
          var der2 = asn1.toDer(pki.certificateToAsn1(match[i3])).getBytes();
          if (der1 === der2) {
            result = match[i3];
            match.splice(i3, 1);
          }
        }
        if (match.length === 0) {
          delete caStore.certs[cert2.subject.hash];
        }
        return result;
      };
      function getBySubject(subject) {
        ensureSubjectHasHash(subject);
        return caStore.certs[subject.hash] || null;
      }
      function ensureSubjectHasHash(subject) {
        if (!subject.hash) {
          var md = forge.md.sha1.create();
          subject.attributes = pki.RDNAttributesAsArray(_dnToAsn1(subject), md);
          subject.hash = md.digest().toHex();
        }
      }
      if (certs) {
        for (var i2 = 0; i2 < certs.length; ++i2) {
          var cert = certs[i2];
          caStore.addCertificate(cert);
        }
      }
      return caStore;
    };
    pki.certificateError = {
      bad_certificate: "forge.pki.BadCertificate",
      unsupported_certificate: "forge.pki.UnsupportedCertificate",
      certificate_revoked: "forge.pki.CertificateRevoked",
      certificate_expired: "forge.pki.CertificateExpired",
      certificate_unknown: "forge.pki.CertificateUnknown",
      unknown_ca: "forge.pki.UnknownCertificateAuthority"
    };
    pki.verifyCertificateChain = function(caStore, chain, options) {
      if (typeof options === "function") {
        options = { verify: options };
      }
      options = options || {};
      chain = chain.slice(0);
      var certs = chain.slice(0);
      var validityCheckDate = options.validityCheckDate;
      if (typeof validityCheckDate === "undefined") {
        validityCheckDate = /* @__PURE__ */ new Date();
      }
      var first = true;
      var error = null;
      var depth = 0;
      do {
        var cert = chain.shift();
        var parent = null;
        var selfSigned = false;
        if (validityCheckDate) {
          if (validityCheckDate < cert.validity.notBefore || validityCheckDate > cert.validity.notAfter) {
            error = {
              message: "Certificate is not valid yet or has expired.",
              error: pki.certificateError.certificate_expired,
              notBefore: cert.validity.notBefore,
              notAfter: cert.validity.notAfter,
              // TODO: we might want to reconsider renaming 'now' to
              // 'validityCheckDate' should this API be changed in the future.
              now: validityCheckDate
            };
          }
        }
        if (error === null) {
          parent = chain[0] || caStore.getIssuer(cert);
          if (parent === null) {
            if (cert.isIssuer(cert)) {
              selfSigned = true;
              parent = cert;
            }
          }
          if (parent) {
            var parents = parent;
            if (!forge.util.isArray(parents)) {
              parents = [parents];
            }
            var verified = false;
            while (!verified && parents.length > 0) {
              parent = parents.shift();
              try {
                verified = parent.verify(cert);
              } catch (ex) {
              }
            }
            if (!verified) {
              error = {
                message: "Certificate signature is invalid.",
                error: pki.certificateError.bad_certificate
              };
            }
          }
          if (error === null && (!parent || selfSigned) && !caStore.hasCertificate(cert)) {
            error = {
              message: "Certificate is not trusted.",
              error: pki.certificateError.unknown_ca
            };
          }
        }
        if (error === null && parent && !cert.isIssuer(parent)) {
          error = {
            message: "Certificate issuer is invalid.",
            error: pki.certificateError.bad_certificate
          };
        }
        if (error === null) {
          var se2 = {
            keyUsage: true,
            basicConstraints: true
          };
          for (var i2 = 0; error === null && i2 < cert.extensions.length; ++i2) {
            var ext = cert.extensions[i2];
            if (ext.critical && !(ext.name in se2)) {
              error = {
                message: "Certificate has an unsupported critical extension.",
                error: pki.certificateError.unsupported_certificate
              };
            }
          }
        }
        if (error === null && (!first || chain.length === 0 && (!parent || selfSigned))) {
          var bcExt = cert.getExtension("basicConstraints");
          var keyUsageExt = cert.getExtension("keyUsage");
          if (keyUsageExt !== null) {
            if (!keyUsageExt.keyCertSign || bcExt === null) {
              error = {
                message: "Certificate keyUsage or basicConstraints conflict or indicate that the certificate is not a CA. If the certificate is the only one in the chain or isn't the first then the certificate must be a valid CA.",
                error: pki.certificateError.bad_certificate
              };
            }
          }
          if (error === null && bcExt === null) {
            error = {
              message: "Certificate is missing basicConstraints extension and cannot be used as a CA.",
              error: pki.certificateError.bad_certificate
            };
          }
          if (error === null && bcExt !== null && !bcExt.cA) {
            error = {
              message: "Certificate basicConstraints indicates the certificate is not a CA.",
              error: pki.certificateError.bad_certificate
            };
          }
          if (error === null && keyUsageExt !== null && "pathLenConstraint" in bcExt) {
            var pathLen = depth - 1;
            if (pathLen > bcExt.pathLenConstraint) {
              error = {
                message: "Certificate basicConstraints pathLenConstraint violated.",
                error: pki.certificateError.bad_certificate
              };
            }
          }
        }
        var vfd = error === null ? true : error.error;
        var ret = options.verify ? options.verify(vfd, depth, certs) : vfd;
        if (ret === true) {
          error = null;
        } else {
          if (vfd === true) {
            error = {
              message: "The application rejected the certificate.",
              error: pki.certificateError.bad_certificate
            };
          }
          if (ret || ret === 0) {
            if (typeof ret === "object" && !forge.util.isArray(ret)) {
              if (ret.message) {
                error.message = ret.message;
              }
              if (ret.error) {
                error.error = ret.error;
              }
            } else if (typeof ret === "string") {
              error.error = ret;
            }
          }
          throw error;
        }
        first = false;
        ++depth;
      } while (chain.length > 0);
      return true;
    };
  }
});

// node_modules/node-forge/lib/pkcs12.js
var require_pkcs12 = __commonJS({
  "node_modules/node-forge/lib/pkcs12.js"(exports2, module2) {
    var forge = require_forge();
    require_asn1();
    require_hmac();
    require_oids();
    require_pkcs7asn1();
    require_pbe();
    require_random();
    require_rsa();
    require_sha1();
    require_util();
    require_x509();
    var asn1 = forge.asn1;
    var pki = forge.pki;
    var p12 = module2.exports = forge.pkcs12 = forge.pkcs12 || {};
    var contentInfoValidator = {
      name: "ContentInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      // a ContentInfo
      constructed: true,
      value: [{
        name: "ContentInfo.contentType",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OID,
        constructed: false,
        capture: "contentType"
      }, {
        name: "ContentInfo.content",
        tagClass: asn1.Class.CONTEXT_SPECIFIC,
        constructed: true,
        captureAsn1: "content"
      }]
    };
    var pfxValidator = {
      name: "PFX",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [
        {
          name: "PFX.version",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.INTEGER,
          constructed: false,
          capture: "version"
        },
        contentInfoValidator,
        {
          name: "PFX.macData",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.SEQUENCE,
          constructed: true,
          optional: true,
          captureAsn1: "mac",
          value: [{
            name: "PFX.macData.mac",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.SEQUENCE,
            // DigestInfo
            constructed: true,
            value: [{
              name: "PFX.macData.mac.digestAlgorithm",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.SEQUENCE,
              // DigestAlgorithmIdentifier
              constructed: true,
              value: [{
                name: "PFX.macData.mac.digestAlgorithm.algorithm",
                tagClass: asn1.Class.UNIVERSAL,
                type: asn1.Type.OID,
                constructed: false,
                capture: "macAlgorithm"
              }, {
                name: "PFX.macData.mac.digestAlgorithm.parameters",
                optional: true,
                tagClass: asn1.Class.UNIVERSAL,
                captureAsn1: "macAlgorithmParameters"
              }]
            }, {
              name: "PFX.macData.mac.digest",
              tagClass: asn1.Class.UNIVERSAL,
              type: asn1.Type.OCTETSTRING,
              constructed: false,
              capture: "macDigest"
            }]
          }, {
            name: "PFX.macData.macSalt",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.OCTETSTRING,
            constructed: false,
            capture: "macSalt"
          }, {
            name: "PFX.macData.iterations",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.INTEGER,
            constructed: false,
            optional: true,
            capture: "macIterations"
          }]
        }
      ]
    };
    var safeBagValidator = {
      name: "SafeBag",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "SafeBag.bagId",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OID,
        constructed: false,
        capture: "bagId"
      }, {
        name: "SafeBag.bagValue",
        tagClass: asn1.Class.CONTEXT_SPECIFIC,
        constructed: true,
        captureAsn1: "bagValue"
      }, {
        name: "SafeBag.bagAttributes",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SET,
        constructed: true,
        optional: true,
        capture: "bagAttributes"
      }]
    };
    var attributeValidator = {
      name: "Attribute",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "Attribute.attrId",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OID,
        constructed: false,
        capture: "oid"
      }, {
        name: "Attribute.attrValues",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SET,
        constructed: true,
        capture: "values"
      }]
    };
    var certBagValidator = {
      name: "CertBag",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        name: "CertBag.certId",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OID,
        constructed: false,
        capture: "certId"
      }, {
        name: "CertBag.certValue",
        tagClass: asn1.Class.CONTEXT_SPECIFIC,
        constructed: true,
        /* So far we only support X.509 certificates (which are wrapped in
           an OCTET STRING, hence hard code that here). */
        value: [{
          name: "CertBag.certValue[0]",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Class.OCTETSTRING,
          constructed: false,
          capture: "cert"
        }]
      }]
    };
    function _getBagsByAttribute(safeContents, attrName, attrValue, bagType) {
      var result = [];
      for (var i2 = 0; i2 < safeContents.length; i2++) {
        for (var j2 = 0; j2 < safeContents[i2].safeBags.length; j2++) {
          var bag = safeContents[i2].safeBags[j2];
          if (bagType !== void 0 && bag.type !== bagType) {
            continue;
          }
          if (attrName === null) {
            result.push(bag);
            continue;
          }
          if (bag.attributes[attrName] !== void 0 && bag.attributes[attrName].indexOf(attrValue) >= 0) {
            result.push(bag);
          }
        }
      }
      return result;
    }
    p12.pkcs12FromAsn1 = function(obj, strict, password) {
      if (typeof strict === "string") {
        password = strict;
        strict = true;
      } else if (strict === void 0) {
        strict = true;
      }
      var capture = {};
      var errors = [];
      if (!asn1.validate(obj, pfxValidator, capture, errors)) {
        var error = new Error("Cannot read PKCS#12 PFX. ASN.1 object is not an PKCS#12 PFX.");
        error.errors = error;
        throw error;
      }
      var pfx = {
        version: capture.version.charCodeAt(0),
        safeContents: [],
        /**
         * Gets bags with matching attributes.
         *
         * @param filter the attributes to filter by:
         *          [localKeyId] the localKeyId to search for.
         *          [localKeyIdHex] the localKeyId in hex to search for.
         *          [friendlyName] the friendly name to search for.
         *          [bagType] bag type to narrow each attribute search by.
         *
         * @return a map of attribute type to an array of matching bags or, if no
         *           attribute was given but a bag type, the map key will be the
         *           bag type.
         */
        getBags: function(filter) {
          var rval = {};
          var localKeyId;
          if ("localKeyId" in filter) {
            localKeyId = filter.localKeyId;
          } else if ("localKeyIdHex" in filter) {
            localKeyId = forge.util.hexToBytes(filter.localKeyIdHex);
          }
          if (localKeyId === void 0 && !("friendlyName" in filter) && "bagType" in filter) {
            rval[filter.bagType] = _getBagsByAttribute(
              pfx.safeContents,
              null,
              null,
              filter.bagType
            );
          }
          if (localKeyId !== void 0) {
            rval.localKeyId = _getBagsByAttribute(
              pfx.safeContents,
              "localKeyId",
              localKeyId,
              filter.bagType
            );
          }
          if ("friendlyName" in filter) {
            rval.friendlyName = _getBagsByAttribute(
              pfx.safeContents,
              "friendlyName",
              filter.friendlyName,
              filter.bagType
            );
          }
          return rval;
        },
        /**
         * DEPRECATED: use getBags() instead.
         *
         * Get bags with matching friendlyName attribute.
         *
         * @param friendlyName the friendly name to search for.
         * @param [bagType] bag type to narrow search by.
         *
         * @return an array of bags with matching friendlyName attribute.
         */
        getBagsByFriendlyName: function(friendlyName, bagType) {
          return _getBagsByAttribute(
            pfx.safeContents,
            "friendlyName",
            friendlyName,
            bagType
          );
        },
        /**
         * DEPRECATED: use getBags() instead.
         *
         * Get bags with matching localKeyId attribute.
         *
         * @param localKeyId the localKeyId to search for.
         * @param [bagType] bag type to narrow search by.
         *
         * @return an array of bags with matching localKeyId attribute.
         */
        getBagsByLocalKeyId: function(localKeyId, bagType) {
          return _getBagsByAttribute(
            pfx.safeContents,
            "localKeyId",
            localKeyId,
            bagType
          );
        }
      };
      if (capture.version.charCodeAt(0) !== 3) {
        var error = new Error("PKCS#12 PFX of version other than 3 not supported.");
        error.version = capture.version.charCodeAt(0);
        throw error;
      }
      if (asn1.derToOid(capture.contentType) !== pki.oids.data) {
        var error = new Error("Only PKCS#12 PFX in password integrity mode supported.");
        error.oid = asn1.derToOid(capture.contentType);
        throw error;
      }
      var data = capture.content.value[0];
      if (data.tagClass !== asn1.Class.UNIVERSAL || data.type !== asn1.Type.OCTETSTRING) {
        throw new Error("PKCS#12 authSafe content data is not an OCTET STRING.");
      }
      data = _decodePkcs7Data(data);
      if (capture.mac) {
        var md = null;
        var macKeyBytes = 0;
        var macAlgorithm = asn1.derToOid(capture.macAlgorithm);
        switch (macAlgorithm) {
          case pki.oids.sha1:
            md = forge.md.sha1.create();
            macKeyBytes = 20;
            break;
          case pki.oids.sha256:
            md = forge.md.sha256.create();
            macKeyBytes = 32;
            break;
          case pki.oids.sha384:
            md = forge.md.sha384.create();
            macKeyBytes = 48;
            break;
          case pki.oids.sha512:
            md = forge.md.sha512.create();
            macKeyBytes = 64;
            break;
          case pki.oids.md5:
            md = forge.md.md5.create();
            macKeyBytes = 16;
            break;
        }
        if (md === null) {
          throw new Error("PKCS#12 uses unsupported MAC algorithm: " + macAlgorithm);
        }
        var macSalt = new forge.util.ByteBuffer(capture.macSalt);
        var macIterations = "macIterations" in capture ? parseInt(forge.util.bytesToHex(capture.macIterations), 16) : 1;
        var macKey = p12.generateKey(
          password,
          macSalt,
          3,
          macIterations,
          macKeyBytes,
          md
        );
        var mac = forge.hmac.create();
        mac.start(md, macKey);
        mac.update(data.value);
        var macValue = mac.getMac();
        if (macValue.getBytes() !== capture.macDigest) {
          throw new Error("PKCS#12 MAC could not be verified. Invalid password?");
        }
      } else if (Array.isArray(obj.value) && obj.value.length > 2) {
        throw new Error("Invalid PKCS#12. macData field present but MAC was not validated.");
      }
      _decodeAuthenticatedSafe(pfx, data.value, strict, password);
      return pfx;
    };
    function _decodePkcs7Data(data) {
      if (data.composed || data.constructed) {
        var value = forge.util.createBuffer();
        for (var i2 = 0; i2 < data.value.length; ++i2) {
          value.putBytes(data.value[i2].value);
        }
        data.composed = data.constructed = false;
        data.value = value.getBytes();
      }
      return data;
    }
    function _decodeAuthenticatedSafe(pfx, authSafe, strict, password) {
      authSafe = asn1.fromDer(authSafe, strict);
      if (authSafe.tagClass !== asn1.Class.UNIVERSAL || authSafe.type !== asn1.Type.SEQUENCE || authSafe.constructed !== true) {
        throw new Error("PKCS#12 AuthenticatedSafe expected to be a SEQUENCE OF ContentInfo");
      }
      for (var i2 = 0; i2 < authSafe.value.length; i2++) {
        var contentInfo = authSafe.value[i2];
        var capture = {};
        var errors = [];
        if (!asn1.validate(contentInfo, contentInfoValidator, capture, errors)) {
          var error = new Error("Cannot read ContentInfo.");
          error.errors = errors;
          throw error;
        }
        var obj = {
          encrypted: false
        };
        var safeContents = null;
        var data = capture.content.value[0];
        switch (asn1.derToOid(capture.contentType)) {
          case pki.oids.data:
            if (data.tagClass !== asn1.Class.UNIVERSAL || data.type !== asn1.Type.OCTETSTRING) {
              throw new Error("PKCS#12 SafeContents Data is not an OCTET STRING.");
            }
            safeContents = _decodePkcs7Data(data).value;
            break;
          case pki.oids.encryptedData:
            safeContents = _decryptSafeContents(data, password);
            obj.encrypted = true;
            break;
          default:
            var error = new Error("Unsupported PKCS#12 contentType.");
            error.contentType = asn1.derToOid(capture.contentType);
            throw error;
        }
        obj.safeBags = _decodeSafeContents(safeContents, strict, password);
        pfx.safeContents.push(obj);
      }
    }
    function _decryptSafeContents(data, password) {
      var capture = {};
      var errors = [];
      if (!asn1.validate(
        data,
        forge.pkcs7.asn1.encryptedDataValidator,
        capture,
        errors
      )) {
        var error = new Error("Cannot read EncryptedContentInfo.");
        error.errors = errors;
        throw error;
      }
      var oid = asn1.derToOid(capture.contentType);
      if (oid !== pki.oids.data) {
        var error = new Error(
          "PKCS#12 EncryptedContentInfo ContentType is not Data."
        );
        error.oid = oid;
        throw error;
      }
      oid = asn1.derToOid(capture.encAlgorithm);
      var cipher = pki.pbe.getCipher(oid, capture.encParameter, password);
      var encryptedContentAsn1 = _decodePkcs7Data(capture.encryptedContentAsn1);
      var encrypted = forge.util.createBuffer(encryptedContentAsn1.value);
      cipher.update(encrypted);
      if (!cipher.finish()) {
        throw new Error("Failed to decrypt PKCS#12 SafeContents.");
      }
      return cipher.output.getBytes();
    }
    function _decodeSafeContents(safeContents, strict, password) {
      if (!strict && safeContents.length === 0) {
        return [];
      }
      safeContents = asn1.fromDer(safeContents, strict);
      if (safeContents.tagClass !== asn1.Class.UNIVERSAL || safeContents.type !== asn1.Type.SEQUENCE || safeContents.constructed !== true) {
        throw new Error(
          "PKCS#12 SafeContents expected to be a SEQUENCE OF SafeBag."
        );
      }
      var res = [];
      for (var i2 = 0; i2 < safeContents.value.length; i2++) {
        var safeBag = safeContents.value[i2];
        var capture = {};
        var errors = [];
        if (!asn1.validate(safeBag, safeBagValidator, capture, errors)) {
          var error = new Error("Cannot read SafeBag.");
          error.errors = errors;
          throw error;
        }
        var bag = {
          type: asn1.derToOid(capture.bagId),
          attributes: _decodeBagAttributes(capture.bagAttributes)
        };
        res.push(bag);
        var validator, decoder;
        var bagAsn1 = capture.bagValue.value[0];
        switch (bag.type) {
          case pki.oids.pkcs8ShroudedKeyBag:
            bagAsn1 = pki.decryptPrivateKeyInfo(bagAsn1, password);
            if (bagAsn1 === null) {
              throw new Error(
                "Unable to decrypt PKCS#8 ShroudedKeyBag, wrong password?"
              );
            }
          /* fall through */
          case pki.oids.keyBag:
            try {
              bag.key = pki.privateKeyFromAsn1(bagAsn1);
            } catch (e2) {
              bag.key = null;
              bag.asn1 = bagAsn1;
            }
            continue;
          /* Nothing more to do. */
          case pki.oids.certBag:
            validator = certBagValidator;
            decoder = function() {
              if (asn1.derToOid(capture.certId) !== pki.oids.x509Certificate) {
                var error2 = new Error(
                  "Unsupported certificate type, only X.509 supported."
                );
                error2.oid = asn1.derToOid(capture.certId);
                throw error2;
              }
              var certAsn1 = asn1.fromDer(capture.cert, strict);
              try {
                bag.cert = pki.certificateFromAsn1(certAsn1, true);
              } catch (e2) {
                bag.cert = null;
                bag.asn1 = certAsn1;
              }
            };
            break;
          default:
            var error = new Error("Unsupported PKCS#12 SafeBag type.");
            error.oid = bag.type;
            throw error;
        }
        if (validator !== void 0 && !asn1.validate(bagAsn1, validator, capture, errors)) {
          var error = new Error("Cannot read PKCS#12 " + validator.name);
          error.errors = errors;
          throw error;
        }
        decoder();
      }
      return res;
    }
    function _decodeBagAttributes(attributes) {
      var decodedAttrs = {};
      if (attributes !== void 0) {
        for (var i2 = 0; i2 < attributes.length; ++i2) {
          var capture = {};
          var errors = [];
          if (!asn1.validate(attributes[i2], attributeValidator, capture, errors)) {
            var error = new Error("Cannot read PKCS#12 BagAttribute.");
            error.errors = errors;
            throw error;
          }
          var oid = asn1.derToOid(capture.oid);
          if (pki.oids[oid] === void 0) {
            continue;
          }
          decodedAttrs[pki.oids[oid]] = [];
          for (var j2 = 0; j2 < capture.values.length; ++j2) {
            decodedAttrs[pki.oids[oid]].push(capture.values[j2].value);
          }
        }
      }
      return decodedAttrs;
    }
    p12.toPkcs12Asn1 = function(key, cert, password, options) {
      options = options || {};
      options.saltSize = options.saltSize || 8;
      options.count = options.count || 2048;
      options.algorithm = options.algorithm || options.encAlgorithm || "aes128";
      if (!("useMac" in options)) {
        options.useMac = true;
      }
      if (!("localKeyId" in options)) {
        options.localKeyId = null;
      }
      if (!("generateLocalKeyId" in options)) {
        options.generateLocalKeyId = true;
      }
      var localKeyId = options.localKeyId;
      var bagAttrs;
      if (localKeyId !== null) {
        localKeyId = forge.util.hexToBytes(localKeyId);
      } else if (options.generateLocalKeyId) {
        if (cert) {
          var pairedCert = forge.util.isArray(cert) ? cert[0] : cert;
          if (typeof pairedCert === "string") {
            pairedCert = pki.certificateFromPem(pairedCert);
          }
          var sha1 = forge.md.sha1.create();
          sha1.update(asn1.toDer(pki.certificateToAsn1(pairedCert)).getBytes());
          localKeyId = sha1.digest().getBytes();
        } else {
          localKeyId = forge.random.getBytes(20);
        }
      }
      var attrs = [];
      if (localKeyId !== null) {
        attrs.push(
          // localKeyID
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // attrId
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(pki.oids.localKeyId).getBytes()
            ),
            // attrValues
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.OCTETSTRING,
                false,
                localKeyId
              )
            ])
          ])
        );
      }
      if ("friendlyName" in options) {
        attrs.push(
          // friendlyName
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // attrId
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(pki.oids.friendlyName).getBytes()
            ),
            // attrValues
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.BMPSTRING,
                false,
                options.friendlyName
              )
            ])
          ])
        );
      }
      if (attrs.length > 0) {
        bagAttrs = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, attrs);
      }
      var contents = [];
      var chain = [];
      if (cert !== null) {
        if (forge.util.isArray(cert)) {
          chain = cert;
        } else {
          chain = [cert];
        }
      }
      var certSafeBags = [];
      for (var i2 = 0; i2 < chain.length; ++i2) {
        cert = chain[i2];
        if (typeof cert === "string") {
          cert = pki.certificateFromPem(cert);
        }
        var certBagAttrs = i2 === 0 ? bagAttrs : void 0;
        var certAsn1 = pki.certificateToAsn1(cert);
        var certSafeBag = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // bagId
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OID,
            false,
            asn1.oidToDer(pki.oids.certBag).getBytes()
          ),
          // bagValue
          asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
            // CertBag
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
              // certId
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.OID,
                false,
                asn1.oidToDer(pki.oids.x509Certificate).getBytes()
              ),
              // certValue (x509Certificate)
              asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
                asn1.create(
                  asn1.Class.UNIVERSAL,
                  asn1.Type.OCTETSTRING,
                  false,
                  asn1.toDer(certAsn1).getBytes()
                )
              ])
            ])
          ]),
          // bagAttributes (OPTIONAL)
          certBagAttrs
        ]);
        certSafeBags.push(certSafeBag);
      }
      if (certSafeBags.length > 0) {
        var certSafeContents = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.SEQUENCE,
          true,
          certSafeBags
        );
        var certCI = (
          // PKCS#7 ContentInfo
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // contentType
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              // OID for the content type is 'data'
              asn1.oidToDer(pki.oids.data).getBytes()
            ),
            // content
            asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.OCTETSTRING,
                false,
                asn1.toDer(certSafeContents).getBytes()
              )
            ])
          ])
        );
        contents.push(certCI);
      }
      var keyBag = null;
      if (key !== null) {
        var pkAsn1 = pki.wrapRsaPrivateKey(pki.privateKeyToAsn1(key));
        if (password === null) {
          keyBag = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // bagId
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(pki.oids.keyBag).getBytes()
            ),
            // bagValue
            asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
              // PrivateKeyInfo
              pkAsn1
            ]),
            // bagAttributes (OPTIONAL)
            bagAttrs
          ]);
        } else {
          keyBag = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // bagId
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(pki.oids.pkcs8ShroudedKeyBag).getBytes()
            ),
            // bagValue
            asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
              // EncryptedPrivateKeyInfo
              pki.encryptPrivateKeyInfo(pkAsn1, password, options)
            ]),
            // bagAttributes (OPTIONAL)
            bagAttrs
          ]);
        }
        var keySafeContents = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [keyBag]);
        var keyCI = (
          // PKCS#7 ContentInfo
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // contentType
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              // OID for the content type is 'data'
              asn1.oidToDer(pki.oids.data).getBytes()
            ),
            // content
            asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.OCTETSTRING,
                false,
                asn1.toDer(keySafeContents).getBytes()
              )
            ])
          ])
        );
        contents.push(keyCI);
      }
      var safe = asn1.create(
        asn1.Class.UNIVERSAL,
        asn1.Type.SEQUENCE,
        true,
        contents
      );
      var macData;
      if (options.useMac) {
        var sha1 = forge.md.sha1.create();
        var macSalt = new forge.util.ByteBuffer(
          forge.random.getBytes(options.saltSize)
        );
        var count = options.count;
        var key = p12.generateKey(password, macSalt, 3, count, 20);
        var mac = forge.hmac.create();
        mac.start(sha1, key);
        mac.update(asn1.toDer(safe).getBytes());
        var macValue = mac.getMac();
        macData = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // mac DigestInfo
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // digestAlgorithm
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
              // algorithm = SHA-1
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.OID,
                false,
                asn1.oidToDer(pki.oids.sha1).getBytes()
              ),
              // parameters = Null
              asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")
            ]),
            // digest
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OCTETSTRING,
              false,
              macValue.getBytes()
            )
          ]),
          // macSalt OCTET STRING
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OCTETSTRING,
            false,
            macSalt.getBytes()
          ),
          // iterations INTEGER (XXX: Only support count < 65536)
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.INTEGER,
            false,
            asn1.integerToDer(count).getBytes()
          )
        ]);
      }
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // version (3)
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          asn1.integerToDer(3).getBytes()
        ),
        // PKCS#7 ContentInfo
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // contentType
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OID,
            false,
            // OID for the content type is 'data'
            asn1.oidToDer(pki.oids.data).getBytes()
          ),
          // content
          asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OCTETSTRING,
              false,
              asn1.toDer(safe).getBytes()
            )
          ])
        ]),
        macData
      ]);
    };
    p12.generateKey = forge.pbe.generatePkcs12Key;
  }
});

// node_modules/node-forge/lib/pki.js
var require_pki = __commonJS({
  "node_modules/node-forge/lib/pki.js"(exports2, module2) {
    var forge = require_forge();
    require_asn1();
    require_oids();
    require_pbe();
    require_pem();
    require_pbkdf2();
    require_pkcs12();
    require_pss();
    require_rsa();
    require_util();
    require_x509();
    var asn1 = forge.asn1;
    var pki = module2.exports = forge.pki = forge.pki || {};
    pki.pemToDer = function(pem) {
      var msg = forge.pem.decode(pem)[0];
      if (msg.procType && msg.procType.type === "ENCRYPTED") {
        throw new Error("Could not convert PEM to DER; PEM is encrypted.");
      }
      return forge.util.createBuffer(msg.body);
    };
    pki.privateKeyFromPem = function(pem) {
      var msg = forge.pem.decode(pem)[0];
      if (msg.type !== "PRIVATE KEY" && msg.type !== "RSA PRIVATE KEY") {
        var error = new Error('Could not convert private key from PEM; PEM header type is not "PRIVATE KEY" or "RSA PRIVATE KEY".');
        error.headerType = msg.type;
        throw error;
      }
      if (msg.procType && msg.procType.type === "ENCRYPTED") {
        throw new Error("Could not convert private key from PEM; PEM is encrypted.");
      }
      var obj = asn1.fromDer(msg.body);
      return pki.privateKeyFromAsn1(obj);
    };
    pki.privateKeyToPem = function(key, maxline) {
      var msg = {
        type: "RSA PRIVATE KEY",
        body: asn1.toDer(pki.privateKeyToAsn1(key)).getBytes()
      };
      return forge.pem.encode(msg, { maxline });
    };
    pki.privateKeyInfoToPem = function(pki2, maxline) {
      var msg = {
        type: "PRIVATE KEY",
        body: asn1.toDer(pki2).getBytes()
      };
      return forge.pem.encode(msg, { maxline });
    };
  }
});

// node_modules/node-forge/lib/tls.js
var require_tls = __commonJS({
  "node_modules/node-forge/lib/tls.js"(exports2, module2) {
    var forge = require_forge();
    require_asn1();
    require_hmac();
    require_md5();
    require_pem();
    require_pki();
    require_random();
    require_sha1();
    require_util();
    var prf_TLS1 = function(secret, label, seed, length) {
      var rval = forge.util.createBuffer();
      var idx = secret.length >> 1;
      var slen = idx + (secret.length & 1);
      var s1 = secret.substr(0, slen);
      var s2 = secret.substr(idx, slen);
      var ai = forge.util.createBuffer();
      var hmac = forge.hmac.create();
      seed = label + seed;
      var md5itr = Math.ceil(length / 16);
      var sha1itr = Math.ceil(length / 20);
      hmac.start("MD5", s1);
      var md5bytes = forge.util.createBuffer();
      ai.putBytes(seed);
      for (var i2 = 0; i2 < md5itr; ++i2) {
        hmac.start(null, null);
        hmac.update(ai.getBytes());
        ai.putBuffer(hmac.digest());
        hmac.start(null, null);
        hmac.update(ai.bytes() + seed);
        md5bytes.putBuffer(hmac.digest());
      }
      hmac.start("SHA1", s2);
      var sha1bytes = forge.util.createBuffer();
      ai.clear();
      ai.putBytes(seed);
      for (var i2 = 0; i2 < sha1itr; ++i2) {
        hmac.start(null, null);
        hmac.update(ai.getBytes());
        ai.putBuffer(hmac.digest());
        hmac.start(null, null);
        hmac.update(ai.bytes() + seed);
        sha1bytes.putBuffer(hmac.digest());
      }
      rval.putBytes(forge.util.xorBytes(
        md5bytes.getBytes(),
        sha1bytes.getBytes(),
        length
      ));
      return rval;
    };
    var hmac_sha1 = function(key2, seqNum, record) {
      var hmac = forge.hmac.create();
      hmac.start("SHA1", key2);
      var b2 = forge.util.createBuffer();
      b2.putInt32(seqNum[0]);
      b2.putInt32(seqNum[1]);
      b2.putByte(record.type);
      b2.putByte(record.version.major);
      b2.putByte(record.version.minor);
      b2.putInt16(record.length);
      b2.putBytes(record.fragment.bytes());
      hmac.update(b2.getBytes());
      return hmac.digest().getBytes();
    };
    var deflate = function(c2, record, s2) {
      var rval = false;
      try {
        var bytes = c2.deflate(record.fragment.getBytes());
        record.fragment = forge.util.createBuffer(bytes);
        record.length = bytes.length;
        rval = true;
      } catch (ex) {
      }
      return rval;
    };
    var inflate = function(c2, record, s2) {
      var rval = false;
      try {
        var bytes = c2.inflate(record.fragment.getBytes());
        record.fragment = forge.util.createBuffer(bytes);
        record.length = bytes.length;
        rval = true;
      } catch (ex) {
      }
      return rval;
    };
    var readVector = function(b2, lenBytes) {
      var len = 0;
      switch (lenBytes) {
        case 1:
          len = b2.getByte();
          break;
        case 2:
          len = b2.getInt16();
          break;
        case 3:
          len = b2.getInt24();
          break;
        case 4:
          len = b2.getInt32();
          break;
      }
      return forge.util.createBuffer(b2.getBytes(len));
    };
    var writeVector = function(b2, lenBytes, v2) {
      b2.putInt(v2.length(), lenBytes << 3);
      b2.putBuffer(v2);
    };
    var tls = {};
    tls.Versions = {
      TLS_1_0: { major: 3, minor: 1 },
      TLS_1_1: { major: 3, minor: 2 },
      TLS_1_2: { major: 3, minor: 3 }
    };
    tls.SupportedVersions = [
      tls.Versions.TLS_1_1,
      tls.Versions.TLS_1_0
    ];
    tls.Version = tls.SupportedVersions[0];
    tls.MaxFragment = 16384 - 1024;
    tls.ConnectionEnd = {
      server: 0,
      client: 1
    };
    tls.PRFAlgorithm = {
      tls_prf_sha256: 0
    };
    tls.BulkCipherAlgorithm = {
      none: null,
      rc4: 0,
      des3: 1,
      aes: 2
    };
    tls.CipherType = {
      stream: 0,
      block: 1,
      aead: 2
    };
    tls.MACAlgorithm = {
      none: null,
      hmac_md5: 0,
      hmac_sha1: 1,
      hmac_sha256: 2,
      hmac_sha384: 3,
      hmac_sha512: 4
    };
    tls.CompressionMethod = {
      none: 0,
      deflate: 1
    };
    tls.ContentType = {
      change_cipher_spec: 20,
      alert: 21,
      handshake: 22,
      application_data: 23,
      heartbeat: 24
    };
    tls.HandshakeType = {
      hello_request: 0,
      client_hello: 1,
      server_hello: 2,
      certificate: 11,
      server_key_exchange: 12,
      certificate_request: 13,
      server_hello_done: 14,
      certificate_verify: 15,
      client_key_exchange: 16,
      finished: 20
    };
    tls.Alert = {};
    tls.Alert.Level = {
      warning: 1,
      fatal: 2
    };
    tls.Alert.Description = {
      close_notify: 0,
      unexpected_message: 10,
      bad_record_mac: 20,
      decryption_failed: 21,
      record_overflow: 22,
      decompression_failure: 30,
      handshake_failure: 40,
      bad_certificate: 42,
      unsupported_certificate: 43,
      certificate_revoked: 44,
      certificate_expired: 45,
      certificate_unknown: 46,
      illegal_parameter: 47,
      unknown_ca: 48,
      access_denied: 49,
      decode_error: 50,
      decrypt_error: 51,
      export_restriction: 60,
      protocol_version: 70,
      insufficient_security: 71,
      internal_error: 80,
      user_canceled: 90,
      no_renegotiation: 100
    };
    tls.HeartbeatMessageType = {
      heartbeat_request: 1,
      heartbeat_response: 2
    };
    tls.CipherSuites = {};
    tls.getCipherSuite = function(twoBytes) {
      var rval = null;
      for (var key2 in tls.CipherSuites) {
        var cs2 = tls.CipherSuites[key2];
        if (cs2.id[0] === twoBytes.charCodeAt(0) && cs2.id[1] === twoBytes.charCodeAt(1)) {
          rval = cs2;
          break;
        }
      }
      return rval;
    };
    tls.handleUnexpected = function(c2, record) {
      var ignore = !c2.open && c2.entity === tls.ConnectionEnd.client;
      if (!ignore) {
        c2.error(c2, {
          message: "Unexpected message. Received TLS record out of order.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.unexpected_message
          }
        });
      }
    };
    tls.handleHelloRequest = function(c2, record, length) {
      if (!c2.handshaking && c2.handshakes > 0) {
        tls.queue(c2, tls.createAlert(c2, {
          level: tls.Alert.Level.warning,
          description: tls.Alert.Description.no_renegotiation
        }));
        tls.flush(c2);
      }
      c2.process();
    };
    tls.parseHelloMessage = function(c2, record, length) {
      var msg = null;
      var client = c2.entity === tls.ConnectionEnd.client;
      if (length < 38) {
        c2.error(c2, {
          message: client ? "Invalid ServerHello message. Message too short." : "Invalid ClientHello message. Message too short.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.illegal_parameter
          }
        });
      } else {
        var b2 = record.fragment;
        var remaining = b2.length();
        msg = {
          version: {
            major: b2.getByte(),
            minor: b2.getByte()
          },
          random: forge.util.createBuffer(b2.getBytes(32)),
          session_id: readVector(b2, 1),
          extensions: []
        };
        if (client) {
          msg.cipher_suite = b2.getBytes(2);
          msg.compression_method = b2.getByte();
        } else {
          msg.cipher_suites = readVector(b2, 2);
          msg.compression_methods = readVector(b2, 1);
        }
        remaining = length - (remaining - b2.length());
        if (remaining > 0) {
          var exts = readVector(b2, 2);
          while (exts.length() > 0) {
            msg.extensions.push({
              type: [exts.getByte(), exts.getByte()],
              data: readVector(exts, 2)
            });
          }
          if (!client) {
            for (var i2 = 0; i2 < msg.extensions.length; ++i2) {
              var ext = msg.extensions[i2];
              if (ext.type[0] === 0 && ext.type[1] === 0) {
                var snl = readVector(ext.data, 2);
                while (snl.length() > 0) {
                  var snType = snl.getByte();
                  if (snType !== 0) {
                    break;
                  }
                  c2.session.extensions.server_name.serverNameList.push(
                    readVector(snl, 2).getBytes()
                  );
                }
              }
            }
          }
        }
        if (c2.session.version) {
          if (msg.version.major !== c2.session.version.major || msg.version.minor !== c2.session.version.minor) {
            return c2.error(c2, {
              message: "TLS version change is disallowed during renegotiation.",
              send: true,
              alert: {
                level: tls.Alert.Level.fatal,
                description: tls.Alert.Description.protocol_version
              }
            });
          }
        }
        if (client) {
          c2.session.cipherSuite = tls.getCipherSuite(msg.cipher_suite);
        } else {
          var tmp = forge.util.createBuffer(msg.cipher_suites.bytes());
          while (tmp.length() > 0) {
            c2.session.cipherSuite = tls.getCipherSuite(tmp.getBytes(2));
            if (c2.session.cipherSuite !== null) {
              break;
            }
          }
        }
        if (c2.session.cipherSuite === null) {
          return c2.error(c2, {
            message: "No cipher suites in common.",
            send: true,
            alert: {
              level: tls.Alert.Level.fatal,
              description: tls.Alert.Description.handshake_failure
            },
            cipherSuite: forge.util.bytesToHex(msg.cipher_suite)
          });
        }
        if (client) {
          c2.session.compressionMethod = msg.compression_method;
        } else {
          c2.session.compressionMethod = tls.CompressionMethod.none;
        }
      }
      return msg;
    };
    tls.createSecurityParameters = function(c2, msg) {
      var client = c2.entity === tls.ConnectionEnd.client;
      var msgRandom = msg.random.bytes();
      var cRandom = client ? c2.session.sp.client_random : msgRandom;
      var sRandom = client ? msgRandom : tls.createRandom().getBytes();
      c2.session.sp = {
        entity: c2.entity,
        prf_algorithm: tls.PRFAlgorithm.tls_prf_sha256,
        bulk_cipher_algorithm: null,
        cipher_type: null,
        enc_key_length: null,
        block_length: null,
        fixed_iv_length: null,
        record_iv_length: null,
        mac_algorithm: null,
        mac_length: null,
        mac_key_length: null,
        compression_algorithm: c2.session.compressionMethod,
        pre_master_secret: null,
        master_secret: null,
        client_random: cRandom,
        server_random: sRandom
      };
    };
    tls.handleServerHello = function(c2, record, length) {
      var msg = tls.parseHelloMessage(c2, record, length);
      if (c2.fail) {
        return;
      }
      if (msg.version.minor <= c2.version.minor) {
        c2.version.minor = msg.version.minor;
      } else {
        return c2.error(c2, {
          message: "Incompatible TLS version.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.protocol_version
          }
        });
      }
      c2.session.version = c2.version;
      var sessionId = msg.session_id.bytes();
      if (sessionId.length > 0 && sessionId === c2.session.id) {
        c2.expect = SCC;
        c2.session.resuming = true;
        c2.session.sp.server_random = msg.random.bytes();
      } else {
        c2.expect = SCE;
        c2.session.resuming = false;
        tls.createSecurityParameters(c2, msg);
      }
      c2.session.id = sessionId;
      c2.process();
    };
    tls.handleClientHello = function(c2, record, length) {
      var msg = tls.parseHelloMessage(c2, record, length);
      if (c2.fail) {
        return;
      }
      var sessionId = msg.session_id.bytes();
      var session = null;
      if (c2.sessionCache) {
        session = c2.sessionCache.getSession(sessionId);
        if (session === null) {
          sessionId = "";
        } else if (session.version.major !== msg.version.major || session.version.minor > msg.version.minor) {
          session = null;
          sessionId = "";
        }
      }
      if (sessionId.length === 0) {
        sessionId = forge.random.getBytes(32);
      }
      c2.session.id = sessionId;
      c2.session.clientHelloVersion = msg.version;
      c2.session.sp = {};
      if (session) {
        c2.version = c2.session.version = session.version;
        c2.session.sp = session.sp;
      } else {
        var version;
        for (var i2 = 1; i2 < tls.SupportedVersions.length; ++i2) {
          version = tls.SupportedVersions[i2];
          if (version.minor <= msg.version.minor) {
            break;
          }
        }
        c2.version = { major: version.major, minor: version.minor };
        c2.session.version = c2.version;
      }
      if (session !== null) {
        c2.expect = CCC;
        c2.session.resuming = true;
        c2.session.sp.client_random = msg.random.bytes();
      } else {
        c2.expect = c2.verifyClient !== false ? CCE : CKE;
        c2.session.resuming = false;
        tls.createSecurityParameters(c2, msg);
      }
      c2.open = true;
      tls.queue(c2, tls.createRecord(c2, {
        type: tls.ContentType.handshake,
        data: tls.createServerHello(c2)
      }));
      if (c2.session.resuming) {
        tls.queue(c2, tls.createRecord(c2, {
          type: tls.ContentType.change_cipher_spec,
          data: tls.createChangeCipherSpec()
        }));
        c2.state.pending = tls.createConnectionState(c2);
        c2.state.current.write = c2.state.pending.write;
        tls.queue(c2, tls.createRecord(c2, {
          type: tls.ContentType.handshake,
          data: tls.createFinished(c2)
        }));
      } else {
        tls.queue(c2, tls.createRecord(c2, {
          type: tls.ContentType.handshake,
          data: tls.createCertificate(c2)
        }));
        if (!c2.fail) {
          tls.queue(c2, tls.createRecord(c2, {
            type: tls.ContentType.handshake,
            data: tls.createServerKeyExchange(c2)
          }));
          if (c2.verifyClient !== false) {
            tls.queue(c2, tls.createRecord(c2, {
              type: tls.ContentType.handshake,
              data: tls.createCertificateRequest(c2)
            }));
          }
          tls.queue(c2, tls.createRecord(c2, {
            type: tls.ContentType.handshake,
            data: tls.createServerHelloDone(c2)
          }));
        }
      }
      tls.flush(c2);
      c2.process();
    };
    tls.handleCertificate = function(c2, record, length) {
      if (length < 3) {
        return c2.error(c2, {
          message: "Invalid Certificate message. Message too short.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.illegal_parameter
          }
        });
      }
      var b2 = record.fragment;
      var msg = {
        certificate_list: readVector(b2, 3)
      };
      var cert, asn1;
      var certs = [];
      try {
        while (msg.certificate_list.length() > 0) {
          cert = readVector(msg.certificate_list, 3);
          asn1 = forge.asn1.fromDer(cert);
          cert = forge.pki.certificateFromAsn1(asn1, true);
          certs.push(cert);
        }
      } catch (ex) {
        return c2.error(c2, {
          message: "Could not parse certificate list.",
          cause: ex,
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.bad_certificate
          }
        });
      }
      var client = c2.entity === tls.ConnectionEnd.client;
      if ((client || c2.verifyClient === true) && certs.length === 0) {
        c2.error(c2, {
          message: client ? "No server certificate provided." : "No client certificate provided.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.illegal_parameter
          }
        });
      } else if (certs.length === 0) {
        c2.expect = client ? SKE : CKE;
      } else {
        if (client) {
          c2.session.serverCertificate = certs[0];
        } else {
          c2.session.clientCertificate = certs[0];
        }
        if (tls.verifyCertificateChain(c2, certs)) {
          c2.expect = client ? SKE : CKE;
        }
      }
      c2.process();
    };
    tls.handleServerKeyExchange = function(c2, record, length) {
      if (length > 0) {
        return c2.error(c2, {
          message: "Invalid key parameters. Only RSA is supported.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.unsupported_certificate
          }
        });
      }
      c2.expect = SCR;
      c2.process();
    };
    tls.handleClientKeyExchange = function(c2, record, length) {
      if (length < 48) {
        return c2.error(c2, {
          message: "Invalid key parameters. Only RSA is supported.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.unsupported_certificate
          }
        });
      }
      var b2 = record.fragment;
      var msg = {
        enc_pre_master_secret: readVector(b2, 2).getBytes()
      };
      var privateKey = null;
      if (c2.getPrivateKey) {
        try {
          privateKey = c2.getPrivateKey(c2, c2.session.serverCertificate);
          privateKey = forge.pki.privateKeyFromPem(privateKey);
        } catch (ex) {
          c2.error(c2, {
            message: "Could not get private key.",
            cause: ex,
            send: true,
            alert: {
              level: tls.Alert.Level.fatal,
              description: tls.Alert.Description.internal_error
            }
          });
        }
      }
      if (privateKey === null) {
        return c2.error(c2, {
          message: "No private key set.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.internal_error
          }
        });
      }
      try {
        var sp = c2.session.sp;
        sp.pre_master_secret = privateKey.decrypt(msg.enc_pre_master_secret);
        var version = c2.session.clientHelloVersion;
        if (version.major !== sp.pre_master_secret.charCodeAt(0) || version.minor !== sp.pre_master_secret.charCodeAt(1)) {
          throw new Error("TLS version rollback attack detected.");
        }
      } catch (ex) {
        sp.pre_master_secret = forge.random.getBytes(48);
      }
      c2.expect = CCC;
      if (c2.session.clientCertificate !== null) {
        c2.expect = CCV;
      }
      c2.process();
    };
    tls.handleCertificateRequest = function(c2, record, length) {
      if (length < 3) {
        return c2.error(c2, {
          message: "Invalid CertificateRequest. Message too short.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.illegal_parameter
          }
        });
      }
      var b2 = record.fragment;
      var msg = {
        certificate_types: readVector(b2, 1),
        certificate_authorities: readVector(b2, 2)
      };
      c2.session.certificateRequest = msg;
      c2.expect = SHD;
      c2.process();
    };
    tls.handleCertificateVerify = function(c2, record, length) {
      if (length < 2) {
        return c2.error(c2, {
          message: "Invalid CertificateVerify. Message too short.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.illegal_parameter
          }
        });
      }
      var b2 = record.fragment;
      b2.read -= 4;
      var msgBytes = b2.bytes();
      b2.read += 4;
      var msg = {
        signature: readVector(b2, 2).getBytes()
      };
      var verify = forge.util.createBuffer();
      verify.putBuffer(c2.session.md5.digest());
      verify.putBuffer(c2.session.sha1.digest());
      verify = verify.getBytes();
      try {
        var cert = c2.session.clientCertificate;
        if (!cert.publicKey.verify(verify, msg.signature, "NONE")) {
          throw new Error("CertificateVerify signature does not match.");
        }
        c2.session.md5.update(msgBytes);
        c2.session.sha1.update(msgBytes);
      } catch (ex) {
        return c2.error(c2, {
          message: "Bad signature in CertificateVerify.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.handshake_failure
          }
        });
      }
      c2.expect = CCC;
      c2.process();
    };
    tls.handleServerHelloDone = function(c2, record, length) {
      if (length > 0) {
        return c2.error(c2, {
          message: "Invalid ServerHelloDone message. Invalid length.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.record_overflow
          }
        });
      }
      if (c2.serverCertificate === null) {
        var error = {
          message: "No server certificate provided. Not enough security.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.insufficient_security
          }
        };
        var depth = 0;
        var ret = c2.verify(c2, error.alert.description, depth, []);
        if (ret !== true) {
          if (ret || ret === 0) {
            if (typeof ret === "object" && !forge.util.isArray(ret)) {
              if (ret.message) {
                error.message = ret.message;
              }
              if (ret.alert) {
                error.alert.description = ret.alert;
              }
            } else if (typeof ret === "number") {
              error.alert.description = ret;
            }
          }
          return c2.error(c2, error);
        }
      }
      if (c2.session.certificateRequest !== null) {
        record = tls.createRecord(c2, {
          type: tls.ContentType.handshake,
          data: tls.createCertificate(c2)
        });
        tls.queue(c2, record);
      }
      record = tls.createRecord(c2, {
        type: tls.ContentType.handshake,
        data: tls.createClientKeyExchange(c2)
      });
      tls.queue(c2, record);
      c2.expect = SER;
      var callback = function(c3, signature) {
        if (c3.session.certificateRequest !== null && c3.session.clientCertificate !== null) {
          tls.queue(c3, tls.createRecord(c3, {
            type: tls.ContentType.handshake,
            data: tls.createCertificateVerify(c3, signature)
          }));
        }
        tls.queue(c3, tls.createRecord(c3, {
          type: tls.ContentType.change_cipher_spec,
          data: tls.createChangeCipherSpec()
        }));
        c3.state.pending = tls.createConnectionState(c3);
        c3.state.current.write = c3.state.pending.write;
        tls.queue(c3, tls.createRecord(c3, {
          type: tls.ContentType.handshake,
          data: tls.createFinished(c3)
        }));
        c3.expect = SCC;
        tls.flush(c3);
        c3.process();
      };
      if (c2.session.certificateRequest === null || c2.session.clientCertificate === null) {
        return callback(c2, null);
      }
      tls.getClientSignature(c2, callback);
    };
    tls.handleChangeCipherSpec = function(c2, record) {
      if (record.fragment.getByte() !== 1) {
        return c2.error(c2, {
          message: "Invalid ChangeCipherSpec message received.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.illegal_parameter
          }
        });
      }
      var client = c2.entity === tls.ConnectionEnd.client;
      if (c2.session.resuming && client || !c2.session.resuming && !client) {
        c2.state.pending = tls.createConnectionState(c2);
      }
      c2.state.current.read = c2.state.pending.read;
      if (!c2.session.resuming && client || c2.session.resuming && !client) {
        c2.state.pending = null;
      }
      c2.expect = client ? SFI : CFI;
      c2.process();
    };
    tls.handleFinished = function(c2, record, length) {
      var b2 = record.fragment;
      b2.read -= 4;
      var msgBytes = b2.bytes();
      b2.read += 4;
      var vd = record.fragment.getBytes();
      b2 = forge.util.createBuffer();
      b2.putBuffer(c2.session.md5.digest());
      b2.putBuffer(c2.session.sha1.digest());
      var client = c2.entity === tls.ConnectionEnd.client;
      var label = client ? "server finished" : "client finished";
      var sp = c2.session.sp;
      var vdl = 12;
      var prf = prf_TLS1;
      b2 = prf(sp.master_secret, label, b2.getBytes(), vdl);
      if (b2.getBytes() !== vd) {
        return c2.error(c2, {
          message: "Invalid verify_data in Finished message.",
          send: true,
          alert: {
            level: tls.Alert.Level.fatal,
            description: tls.Alert.Description.decrypt_error
          }
        });
      }
      c2.session.md5.update(msgBytes);
      c2.session.sha1.update(msgBytes);
      if (c2.session.resuming && client || !c2.session.resuming && !client) {
        tls.queue(c2, tls.createRecord(c2, {
          type: tls.ContentType.change_cipher_spec,
          data: tls.createChangeCipherSpec()
        }));
        c2.state.current.write = c2.state.pending.write;
        c2.state.pending = null;
        tls.queue(c2, tls.createRecord(c2, {
          type: tls.ContentType.handshake,
          data: tls.createFinished(c2)
        }));
      }
      c2.expect = client ? SAD : CAD;
      c2.handshaking = false;
      ++c2.handshakes;
      c2.peerCertificate = client ? c2.session.serverCertificate : c2.session.clientCertificate;
      tls.flush(c2);
      c2.isConnected = true;
      c2.connected(c2);
      c2.process();
    };
    tls.handleAlert = function(c2, record) {
      var b2 = record.fragment;
      var alert = {
        level: b2.getByte(),
        description: b2.getByte()
      };
      var msg;
      switch (alert.description) {
        case tls.Alert.Description.close_notify:
          msg = "Connection closed.";
          break;
        case tls.Alert.Description.unexpected_message:
          msg = "Unexpected message.";
          break;
        case tls.Alert.Description.bad_record_mac:
          msg = "Bad record MAC.";
          break;
        case tls.Alert.Description.decryption_failed:
          msg = "Decryption failed.";
          break;
        case tls.Alert.Description.record_overflow:
          msg = "Record overflow.";
          break;
        case tls.Alert.Description.decompression_failure:
          msg = "Decompression failed.";
          break;
        case tls.Alert.Description.handshake_failure:
          msg = "Handshake failure.";
          break;
        case tls.Alert.Description.bad_certificate:
          msg = "Bad certificate.";
          break;
        case tls.Alert.Description.unsupported_certificate:
          msg = "Unsupported certificate.";
          break;
        case tls.Alert.Description.certificate_revoked:
          msg = "Certificate revoked.";
          break;
        case tls.Alert.Description.certificate_expired:
          msg = "Certificate expired.";
          break;
        case tls.Alert.Description.certificate_unknown:
          msg = "Certificate unknown.";
          break;
        case tls.Alert.Description.illegal_parameter:
          msg = "Illegal parameter.";
          break;
        case tls.Alert.Description.unknown_ca:
          msg = "Unknown certificate authority.";
          break;
        case tls.Alert.Description.access_denied:
          msg = "Access denied.";
          break;
        case tls.Alert.Description.decode_error:
          msg = "Decode error.";
          break;
        case tls.Alert.Description.decrypt_error:
          msg = "Decrypt error.";
          break;
        case tls.Alert.Description.export_restriction:
          msg = "Export restriction.";
          break;
        case tls.Alert.Description.protocol_version:
          msg = "Unsupported protocol version.";
          break;
        case tls.Alert.Description.insufficient_security:
          msg = "Insufficient security.";
          break;
        case tls.Alert.Description.internal_error:
          msg = "Internal error.";
          break;
        case tls.Alert.Description.user_canceled:
          msg = "User canceled.";
          break;
        case tls.Alert.Description.no_renegotiation:
          msg = "Renegotiation not supported.";
          break;
        default:
          msg = "Unknown error.";
          break;
      }
      if (alert.description === tls.Alert.Description.close_notify) {
        return c2.close();
      }
      c2.error(c2, {
        message: msg,
        send: false,
        // origin is the opposite end
        origin: c2.entity === tls.ConnectionEnd.client ? "server" : "client",
        alert
      });
      c2.process();
    };
    tls.handleHandshake = function(c2, record) {
      var b2 = record.fragment;
      var type = b2.getByte();
      var length = b2.getInt24();
      if (length > b2.length()) {
        c2.fragmented = record;
        record.fragment = forge.util.createBuffer();
        b2.read -= 4;
        return c2.process();
      }
      c2.fragmented = null;
      b2.read -= 4;
      var bytes = b2.bytes(length + 4);
      b2.read += 4;
      if (type in hsTable[c2.entity][c2.expect]) {
        if (c2.entity === tls.ConnectionEnd.server && !c2.open && !c2.fail) {
          c2.handshaking = true;
          c2.session = {
            version: null,
            extensions: {
              server_name: {
                serverNameList: []
              }
            },
            cipherSuite: null,
            compressionMethod: null,
            serverCertificate: null,
            clientCertificate: null,
            md5: forge.md.md5.create(),
            sha1: forge.md.sha1.create()
          };
        }
        if (type !== tls.HandshakeType.hello_request && type !== tls.HandshakeType.certificate_verify && type !== tls.HandshakeType.finished) {
          c2.session.md5.update(bytes);
          c2.session.sha1.update(bytes);
        }
        hsTable[c2.entity][c2.expect][type](c2, record, length);
      } else {
        tls.handleUnexpected(c2, record);
      }
    };
    tls.handleApplicationData = function(c2, record) {
      c2.data.putBuffer(record.fragment);
      c2.dataReady(c2);
      c2.process();
    };
    tls.handleHeartbeat = function(c2, record) {
      var b2 = record.fragment;
      var type = b2.getByte();
      var length = b2.getInt16();
      var payload = b2.getBytes(length);
      if (type === tls.HeartbeatMessageType.heartbeat_request) {
        if (c2.handshaking || length > payload.length) {
          return c2.process();
        }
        tls.queue(c2, tls.createRecord(c2, {
          type: tls.ContentType.heartbeat,
          data: tls.createHeartbeat(
            tls.HeartbeatMessageType.heartbeat_response,
            payload
          )
        }));
        tls.flush(c2);
      } else if (type === tls.HeartbeatMessageType.heartbeat_response) {
        if (payload !== c2.expectedHeartbeatPayload) {
          return c2.process();
        }
        if (c2.heartbeatReceived) {
          c2.heartbeatReceived(c2, forge.util.createBuffer(payload));
        }
      }
      c2.process();
    };
    var SHE = 0;
    var SCE = 1;
    var SKE = 2;
    var SCR = 3;
    var SHD = 4;
    var SCC = 5;
    var SFI = 6;
    var SAD = 7;
    var SER = 8;
    var CHE = 0;
    var CCE = 1;
    var CKE = 2;
    var CCV = 3;
    var CCC = 4;
    var CFI = 5;
    var CAD = 6;
    var __ = tls.handleUnexpected;
    var R0 = tls.handleChangeCipherSpec;
    var R1 = tls.handleAlert;
    var R2 = tls.handleHandshake;
    var R3 = tls.handleApplicationData;
    var R4 = tls.handleHeartbeat;
    var ctTable = [];
    ctTable[tls.ConnectionEnd.client] = [
      //      CC,AL,HS,AD,HB
      /*SHE*/
      [__, R1, R2, __, R4],
      /*SCE*/
      [__, R1, R2, __, R4],
      /*SKE*/
      [__, R1, R2, __, R4],
      /*SCR*/
      [__, R1, R2, __, R4],
      /*SHD*/
      [__, R1, R2, __, R4],
      /*SCC*/
      [R0, R1, __, __, R4],
      /*SFI*/
      [__, R1, R2, __, R4],
      /*SAD*/
      [__, R1, R2, R3, R4],
      /*SER*/
      [__, R1, R2, __, R4]
    ];
    ctTable[tls.ConnectionEnd.server] = [
      //      CC,AL,HS,AD
      /*CHE*/
      [__, R1, R2, __, R4],
      /*CCE*/
      [__, R1, R2, __, R4],
      /*CKE*/
      [__, R1, R2, __, R4],
      /*CCV*/
      [__, R1, R2, __, R4],
      /*CCC*/
      [R0, R1, __, __, R4],
      /*CFI*/
      [__, R1, R2, __, R4],
      /*CAD*/
      [__, R1, R2, R3, R4],
      /*CER*/
      [__, R1, R2, __, R4]
    ];
    var H0 = tls.handleHelloRequest;
    var H1 = tls.handleServerHello;
    var H2 = tls.handleCertificate;
    var H3 = tls.handleServerKeyExchange;
    var H4 = tls.handleCertificateRequest;
    var H5 = tls.handleServerHelloDone;
    var H6 = tls.handleFinished;
    var hsTable = [];
    hsTable[tls.ConnectionEnd.client] = [
      //      HR,01,SH,03,04,05,06,07,08,09,10,SC,SK,CR,HD,15,CK,17,18,19,FI
      /*SHE*/
      [__, __, H1, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __],
      /*SCE*/
      [H0, __, __, __, __, __, __, __, __, __, __, H2, H3, H4, H5, __, __, __, __, __, __],
      /*SKE*/
      [H0, __, __, __, __, __, __, __, __, __, __, __, H3, H4, H5, __, __, __, __, __, __],
      /*SCR*/
      [H0, __, __, __, __, __, __, __, __, __, __, __, __, H4, H5, __, __, __, __, __, __],
      /*SHD*/
      [H0, __, __, __, __, __, __, __, __, __, __, __, __, __, H5, __, __, __, __, __, __],
      /*SCC*/
      [H0, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __],
      /*SFI*/
      [H0, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, H6],
      /*SAD*/
      [H0, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __],
      /*SER*/
      [H0, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __]
    ];
    var H7 = tls.handleClientHello;
    var H8 = tls.handleClientKeyExchange;
    var H9 = tls.handleCertificateVerify;
    hsTable[tls.ConnectionEnd.server] = [
      //      01,CH,02,03,04,05,06,07,08,09,10,CC,12,13,14,CV,CK,17,18,19,FI
      /*CHE*/
      [__, H7, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __],
      /*CCE*/
      [__, __, __, __, __, __, __, __, __, __, __, H2, __, __, __, __, __, __, __, __, __],
      /*CKE*/
      [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, H8, __, __, __, __],
      /*CCV*/
      [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, H9, __, __, __, __, __],
      /*CCC*/
      [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __],
      /*CFI*/
      [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, H6],
      /*CAD*/
      [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __],
      /*CER*/
      [__, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __, __]
    ];
    tls.generateKeys = function(c2, sp) {
      var prf = prf_TLS1;
      var random = sp.client_random + sp.server_random;
      if (!c2.session.resuming) {
        sp.master_secret = prf(
          sp.pre_master_secret,
          "master secret",
          random,
          48
        ).bytes();
        sp.pre_master_secret = null;
      }
      random = sp.server_random + sp.client_random;
      var length = 2 * sp.mac_key_length + 2 * sp.enc_key_length;
      var tls10 = c2.version.major === tls.Versions.TLS_1_0.major && c2.version.minor === tls.Versions.TLS_1_0.minor;
      if (tls10) {
        length += 2 * sp.fixed_iv_length;
      }
      var km = prf(sp.master_secret, "key expansion", random, length);
      var rval = {
        client_write_MAC_key: km.getBytes(sp.mac_key_length),
        server_write_MAC_key: km.getBytes(sp.mac_key_length),
        client_write_key: km.getBytes(sp.enc_key_length),
        server_write_key: km.getBytes(sp.enc_key_length)
      };
      if (tls10) {
        rval.client_write_IV = km.getBytes(sp.fixed_iv_length);
        rval.server_write_IV = km.getBytes(sp.fixed_iv_length);
      }
      return rval;
    };
    tls.createConnectionState = function(c2) {
      var client = c2.entity === tls.ConnectionEnd.client;
      var createMode = function() {
        var mode = {
          // two 32-bit numbers, first is most significant
          sequenceNumber: [0, 0],
          macKey: null,
          macLength: 0,
          macFunction: null,
          cipherState: null,
          cipherFunction: function(record) {
            return true;
          },
          compressionState: null,
          compressFunction: function(record) {
            return true;
          },
          updateSequenceNumber: function() {
            if (mode.sequenceNumber[1] === 4294967295) {
              mode.sequenceNumber[1] = 0;
              ++mode.sequenceNumber[0];
            } else {
              ++mode.sequenceNumber[1];
            }
          }
        };
        return mode;
      };
      var state = {
        read: createMode(),
        write: createMode()
      };
      state.read.update = function(c3, record) {
        if (!state.read.cipherFunction(record, state.read)) {
          c3.error(c3, {
            message: "Could not decrypt record or bad MAC.",
            send: true,
            alert: {
              level: tls.Alert.Level.fatal,
              // doesn't matter if decryption failed or MAC was
              // invalid, return the same error so as not to reveal
              // which one occurred
              description: tls.Alert.Description.bad_record_mac
            }
          });
        } else if (!state.read.compressFunction(c3, record, state.read)) {
          c3.error(c3, {
            message: "Could not decompress record.",
            send: true,
            alert: {
              level: tls.Alert.Level.fatal,
              description: tls.Alert.Description.decompression_failure
            }
          });
        }
        return !c3.fail;
      };
      state.write.update = function(c3, record) {
        if (!state.write.compressFunction(c3, record, state.write)) {
          c3.error(c3, {
            message: "Could not compress record.",
            send: false,
            alert: {
              level: tls.Alert.Level.fatal,
              description: tls.Alert.Description.internal_error
            }
          });
        } else if (!state.write.cipherFunction(record, state.write)) {
          c3.error(c3, {
            message: "Could not encrypt record.",
            send: false,
            alert: {
              level: tls.Alert.Level.fatal,
              description: tls.Alert.Description.internal_error
            }
          });
        }
        return !c3.fail;
      };
      if (c2.session) {
        var sp = c2.session.sp;
        c2.session.cipherSuite.initSecurityParameters(sp);
        sp.keys = tls.generateKeys(c2, sp);
        state.read.macKey = client ? sp.keys.server_write_MAC_key : sp.keys.client_write_MAC_key;
        state.write.macKey = client ? sp.keys.client_write_MAC_key : sp.keys.server_write_MAC_key;
        c2.session.cipherSuite.initConnectionState(state, c2, sp);
        switch (sp.compression_algorithm) {
          case tls.CompressionMethod.none:
            break;
          case tls.CompressionMethod.deflate:
            state.read.compressFunction = inflate;
            state.write.compressFunction = deflate;
            break;
          default:
            throw new Error("Unsupported compression algorithm.");
        }
      }
      return state;
    };
    tls.createRandom = function() {
      var d2 = /* @__PURE__ */ new Date();
      var utc = +d2 + d2.getTimezoneOffset() * 6e4;
      var rval = forge.util.createBuffer();
      rval.putInt32(utc);
      rval.putBytes(forge.random.getBytes(28));
      return rval;
    };
    tls.createRecord = function(c2, options) {
      if (!options.data) {
        return null;
      }
      var record = {
        type: options.type,
        version: {
          major: c2.version.major,
          minor: c2.version.minor
        },
        length: options.data.length(),
        fragment: options.data
      };
      return record;
    };
    tls.createAlert = function(c2, alert) {
      var b2 = forge.util.createBuffer();
      b2.putByte(alert.level);
      b2.putByte(alert.description);
      return tls.createRecord(c2, {
        type: tls.ContentType.alert,
        data: b2
      });
    };
    tls.createClientHello = function(c2) {
      c2.session.clientHelloVersion = {
        major: c2.version.major,
        minor: c2.version.minor
      };
      var cipherSuites = forge.util.createBuffer();
      for (var i2 = 0; i2 < c2.cipherSuites.length; ++i2) {
        var cs2 = c2.cipherSuites[i2];
        cipherSuites.putByte(cs2.id[0]);
        cipherSuites.putByte(cs2.id[1]);
      }
      var cSuites = cipherSuites.length();
      var compressionMethods = forge.util.createBuffer();
      compressionMethods.putByte(tls.CompressionMethod.none);
      var cMethods = compressionMethods.length();
      var extensions = forge.util.createBuffer();
      if (c2.virtualHost) {
        var ext = forge.util.createBuffer();
        ext.putByte(0);
        ext.putByte(0);
        var serverName = forge.util.createBuffer();
        serverName.putByte(0);
        writeVector(serverName, 2, forge.util.createBuffer(c2.virtualHost));
        var snList = forge.util.createBuffer();
        writeVector(snList, 2, serverName);
        writeVector(ext, 2, snList);
        extensions.putBuffer(ext);
      }
      var extLength = extensions.length();
      if (extLength > 0) {
        extLength += 2;
      }
      var sessionId = c2.session.id;
      var length = sessionId.length + 1 + // session ID vector
      2 + // version (major + minor)
      4 + 28 + // random time and random bytes
      2 + cSuites + // cipher suites vector
      1 + cMethods + // compression methods vector
      extLength;
      var rval = forge.util.createBuffer();
      rval.putByte(tls.HandshakeType.client_hello);
      rval.putInt24(length);
      rval.putByte(c2.version.major);
      rval.putByte(c2.version.minor);
      rval.putBytes(c2.session.sp.client_random);
      writeVector(rval, 1, forge.util.createBuffer(sessionId));
      writeVector(rval, 2, cipherSuites);
      writeVector(rval, 1, compressionMethods);
      if (extLength > 0) {
        writeVector(rval, 2, extensions);
      }
      return rval;
    };
    tls.createServerHello = function(c2) {
      var sessionId = c2.session.id;
      var length = sessionId.length + 1 + // session ID vector
      2 + // version (major + minor)
      4 + 28 + // random time and random bytes
      2 + // chosen cipher suite
      1;
      var rval = forge.util.createBuffer();
      rval.putByte(tls.HandshakeType.server_hello);
      rval.putInt24(length);
      rval.putByte(c2.version.major);
      rval.putByte(c2.version.minor);
      rval.putBytes(c2.session.sp.server_random);
      writeVector(rval, 1, forge.util.createBuffer(sessionId));
      rval.putByte(c2.session.cipherSuite.id[0]);
      rval.putByte(c2.session.cipherSuite.id[1]);
      rval.putByte(c2.session.compressionMethod);
      return rval;
    };
    tls.createCertificate = function(c2) {
      var client = c2.entity === tls.ConnectionEnd.client;
      var cert = null;
      if (c2.getCertificate) {
        var hint;
        if (client) {
          hint = c2.session.certificateRequest;
        } else {
          hint = c2.session.extensions.server_name.serverNameList;
        }
        cert = c2.getCertificate(c2, hint);
      }
      var certList = forge.util.createBuffer();
      if (cert !== null) {
        try {
          if (!forge.util.isArray(cert)) {
            cert = [cert];
          }
          var asn1 = null;
          for (var i2 = 0; i2 < cert.length; ++i2) {
            var msg = forge.pem.decode(cert[i2])[0];
            if (msg.type !== "CERTIFICATE" && msg.type !== "X509 CERTIFICATE" && msg.type !== "TRUSTED CERTIFICATE") {
              var error = new Error('Could not convert certificate from PEM; PEM header type is not "CERTIFICATE", "X509 CERTIFICATE", or "TRUSTED CERTIFICATE".');
              error.headerType = msg.type;
              throw error;
            }
            if (msg.procType && msg.procType.type === "ENCRYPTED") {
              throw new Error("Could not convert certificate from PEM; PEM is encrypted.");
            }
            var der = forge.util.createBuffer(msg.body);
            if (asn1 === null) {
              asn1 = forge.asn1.fromDer(der.bytes(), false);
            }
            var certBuffer = forge.util.createBuffer();
            writeVector(certBuffer, 3, der);
            certList.putBuffer(certBuffer);
          }
          cert = forge.pki.certificateFromAsn1(asn1);
          if (client) {
            c2.session.clientCertificate = cert;
          } else {
            c2.session.serverCertificate = cert;
          }
        } catch (ex) {
          return c2.error(c2, {
            message: "Could not send certificate list.",
            cause: ex,
            send: true,
            alert: {
              level: tls.Alert.Level.fatal,
              description: tls.Alert.Description.bad_certificate
            }
          });
        }
      }
      var length = 3 + certList.length();
      var rval = forge.util.createBuffer();
      rval.putByte(tls.HandshakeType.certificate);
      rval.putInt24(length);
      writeVector(rval, 3, certList);
      return rval;
    };
    tls.createClientKeyExchange = function(c2) {
      var b2 = forge.util.createBuffer();
      b2.putByte(c2.session.clientHelloVersion.major);
      b2.putByte(c2.session.clientHelloVersion.minor);
      b2.putBytes(forge.random.getBytes(46));
      var sp = c2.session.sp;
      sp.pre_master_secret = b2.getBytes();
      var key2 = c2.session.serverCertificate.publicKey;
      b2 = key2.encrypt(sp.pre_master_secret);
      var length = b2.length + 2;
      var rval = forge.util.createBuffer();
      rval.putByte(tls.HandshakeType.client_key_exchange);
      rval.putInt24(length);
      rval.putInt16(b2.length);
      rval.putBytes(b2);
      return rval;
    };
    tls.createServerKeyExchange = function(c2) {
      var length = 0;
      var rval = forge.util.createBuffer();
      if (length > 0) {
        rval.putByte(tls.HandshakeType.server_key_exchange);
        rval.putInt24(length);
      }
      return rval;
    };
    tls.getClientSignature = function(c2, callback) {
      var b2 = forge.util.createBuffer();
      b2.putBuffer(c2.session.md5.digest());
      b2.putBuffer(c2.session.sha1.digest());
      b2 = b2.getBytes();
      c2.getSignature = c2.getSignature || function(c3, b3, callback2) {
        var privateKey = null;
        if (c3.getPrivateKey) {
          try {
            privateKey = c3.getPrivateKey(c3, c3.session.clientCertificate);
            privateKey = forge.pki.privateKeyFromPem(privateKey);
          } catch (ex) {
            c3.error(c3, {
              message: "Could not get private key.",
              cause: ex,
              send: true,
              alert: {
                level: tls.Alert.Level.fatal,
                description: tls.Alert.Description.internal_error
              }
            });
          }
        }
        if (privateKey === null) {
          c3.error(c3, {
            message: "No private key set.",
            send: true,
            alert: {
              level: tls.Alert.Level.fatal,
              description: tls.Alert.Description.internal_error
            }
          });
        } else {
          b3 = privateKey.sign(b3, null);
        }
        callback2(c3, b3);
      };
      c2.getSignature(c2, b2, callback);
    };
    tls.createCertificateVerify = function(c2, signature) {
      var length = signature.length + 2;
      var rval = forge.util.createBuffer();
      rval.putByte(tls.HandshakeType.certificate_verify);
      rval.putInt24(length);
      rval.putInt16(signature.length);
      rval.putBytes(signature);
      return rval;
    };
    tls.createCertificateRequest = function(c2) {
      var certTypes = forge.util.createBuffer();
      certTypes.putByte(1);
      var cAs = forge.util.createBuffer();
      for (var key2 in c2.caStore.certs) {
        var cert = c2.caStore.certs[key2];
        var dn = forge.pki.distinguishedNameToAsn1(cert.subject);
        var byteBuffer = forge.asn1.toDer(dn);
        cAs.putInt16(byteBuffer.length());
        cAs.putBuffer(byteBuffer);
      }
      var length = 1 + certTypes.length() + 2 + cAs.length();
      var rval = forge.util.createBuffer();
      rval.putByte(tls.HandshakeType.certificate_request);
      rval.putInt24(length);
      writeVector(rval, 1, certTypes);
      writeVector(rval, 2, cAs);
      return rval;
    };
    tls.createServerHelloDone = function(c2) {
      var rval = forge.util.createBuffer();
      rval.putByte(tls.HandshakeType.server_hello_done);
      rval.putInt24(0);
      return rval;
    };
    tls.createChangeCipherSpec = function() {
      var rval = forge.util.createBuffer();
      rval.putByte(1);
      return rval;
    };
    tls.createFinished = function(c2) {
      var b2 = forge.util.createBuffer();
      b2.putBuffer(c2.session.md5.digest());
      b2.putBuffer(c2.session.sha1.digest());
      var client = c2.entity === tls.ConnectionEnd.client;
      var sp = c2.session.sp;
      var vdl = 12;
      var prf = prf_TLS1;
      var label = client ? "client finished" : "server finished";
      b2 = prf(sp.master_secret, label, b2.getBytes(), vdl);
      var rval = forge.util.createBuffer();
      rval.putByte(tls.HandshakeType.finished);
      rval.putInt24(b2.length());
      rval.putBuffer(b2);
      return rval;
    };
    tls.createHeartbeat = function(type, payload, payloadLength) {
      if (typeof payloadLength === "undefined") {
        payloadLength = payload.length;
      }
      var rval = forge.util.createBuffer();
      rval.putByte(type);
      rval.putInt16(payloadLength);
      rval.putBytes(payload);
      var plaintextLength = rval.length();
      var paddingLength = Math.max(16, plaintextLength - payloadLength - 3);
      rval.putBytes(forge.random.getBytes(paddingLength));
      return rval;
    };
    tls.queue = function(c2, record) {
      if (!record) {
        return;
      }
      if (record.fragment.length() === 0) {
        if (record.type === tls.ContentType.handshake || record.type === tls.ContentType.alert || record.type === tls.ContentType.change_cipher_spec) {
          return;
        }
      }
      if (record.type === tls.ContentType.handshake) {
        var bytes = record.fragment.bytes();
        c2.session.md5.update(bytes);
        c2.session.sha1.update(bytes);
        bytes = null;
      }
      var records;
      if (record.fragment.length() <= tls.MaxFragment) {
        records = [record];
      } else {
        records = [];
        var data = record.fragment.bytes();
        while (data.length > tls.MaxFragment) {
          records.push(tls.createRecord(c2, {
            type: record.type,
            data: forge.util.createBuffer(data.slice(0, tls.MaxFragment))
          }));
          data = data.slice(tls.MaxFragment);
        }
        if (data.length > 0) {
          records.push(tls.createRecord(c2, {
            type: record.type,
            data: forge.util.createBuffer(data)
          }));
        }
      }
      for (var i2 = 0; i2 < records.length && !c2.fail; ++i2) {
        var rec = records[i2];
        var s2 = c2.state.current.write;
        if (s2.update(c2, rec)) {
          c2.records.push(rec);
        }
      }
    };
    tls.flush = function(c2) {
      for (var i2 = 0; i2 < c2.records.length; ++i2) {
        var record = c2.records[i2];
        c2.tlsData.putByte(record.type);
        c2.tlsData.putByte(record.version.major);
        c2.tlsData.putByte(record.version.minor);
        c2.tlsData.putInt16(record.fragment.length());
        c2.tlsData.putBuffer(c2.records[i2].fragment);
      }
      c2.records = [];
      return c2.tlsDataReady(c2);
    };
    var _certErrorToAlertDesc = function(error) {
      switch (error) {
        case true:
          return true;
        case forge.pki.certificateError.bad_certificate:
          return tls.Alert.Description.bad_certificate;
        case forge.pki.certificateError.unsupported_certificate:
          return tls.Alert.Description.unsupported_certificate;
        case forge.pki.certificateError.certificate_revoked:
          return tls.Alert.Description.certificate_revoked;
        case forge.pki.certificateError.certificate_expired:
          return tls.Alert.Description.certificate_expired;
        case forge.pki.certificateError.certificate_unknown:
          return tls.Alert.Description.certificate_unknown;
        case forge.pki.certificateError.unknown_ca:
          return tls.Alert.Description.unknown_ca;
        default:
          return tls.Alert.Description.bad_certificate;
      }
    };
    var _alertDescToCertError = function(desc) {
      switch (desc) {
        case true:
          return true;
        case tls.Alert.Description.bad_certificate:
          return forge.pki.certificateError.bad_certificate;
        case tls.Alert.Description.unsupported_certificate:
          return forge.pki.certificateError.unsupported_certificate;
        case tls.Alert.Description.certificate_revoked:
          return forge.pki.certificateError.certificate_revoked;
        case tls.Alert.Description.certificate_expired:
          return forge.pki.certificateError.certificate_expired;
        case tls.Alert.Description.certificate_unknown:
          return forge.pki.certificateError.certificate_unknown;
        case tls.Alert.Description.unknown_ca:
          return forge.pki.certificateError.unknown_ca;
        default:
          return forge.pki.certificateError.bad_certificate;
      }
    };
    tls.verifyCertificateChain = function(c2, chain) {
      try {
        var options = {};
        for (var key2 in c2.verifyOptions) {
          options[key2] = c2.verifyOptions[key2];
        }
        options.verify = function(vfd, depth, chain2) {
          var desc = _certErrorToAlertDesc(vfd);
          var ret = c2.verify(c2, vfd, depth, chain2);
          if (ret !== true) {
            if (typeof ret === "object" && !forge.util.isArray(ret)) {
              var error = new Error("The application rejected the certificate.");
              error.send = true;
              error.alert = {
                level: tls.Alert.Level.fatal,
                description: tls.Alert.Description.bad_certificate
              };
              if (ret.message) {
                error.message = ret.message;
              }
              if (ret.alert) {
                error.alert.description = ret.alert;
              }
              throw error;
            }
            if (ret !== vfd) {
              ret = _alertDescToCertError(ret);
            }
          }
          return ret;
        };
        forge.pki.verifyCertificateChain(c2.caStore, chain, options);
      } catch (ex) {
        var err = ex;
        if (typeof err !== "object" || forge.util.isArray(err)) {
          err = {
            send: true,
            alert: {
              level: tls.Alert.Level.fatal,
              description: _certErrorToAlertDesc(ex)
            }
          };
        }
        if (!("send" in err)) {
          err.send = true;
        }
        if (!("alert" in err)) {
          err.alert = {
            level: tls.Alert.Level.fatal,
            description: _certErrorToAlertDesc(err.error)
          };
        }
        c2.error(c2, err);
      }
      return !c2.fail;
    };
    tls.createSessionCache = function(cache, capacity) {
      var rval = null;
      if (cache && cache.getSession && cache.setSession && cache.order) {
        rval = cache;
      } else {
        rval = {};
        rval.cache = cache || {};
        rval.capacity = Math.max(capacity || 100, 1);
        rval.order = [];
        for (var key2 in cache) {
          if (rval.order.length <= capacity) {
            rval.order.push(key2);
          } else {
            delete cache[key2];
          }
        }
        rval.getSession = function(sessionId) {
          var session = null;
          var key3 = null;
          if (sessionId) {
            key3 = forge.util.bytesToHex(sessionId);
          } else if (rval.order.length > 0) {
            key3 = rval.order[0];
          }
          if (key3 !== null && key3 in rval.cache) {
            session = rval.cache[key3];
            delete rval.cache[key3];
            for (var i2 in rval.order) {
              if (rval.order[i2] === key3) {
                rval.order.splice(i2, 1);
                break;
              }
            }
          }
          return session;
        };
        rval.setSession = function(sessionId, session) {
          if (rval.order.length === rval.capacity) {
            var key3 = rval.order.shift();
            delete rval.cache[key3];
          }
          var key3 = forge.util.bytesToHex(sessionId);
          rval.order.push(key3);
          rval.cache[key3] = session;
        };
      }
      return rval;
    };
    tls.createConnection = function(options) {
      var caStore = null;
      if (options.caStore) {
        if (forge.util.isArray(options.caStore)) {
          caStore = forge.pki.createCaStore(options.caStore);
        } else {
          caStore = options.caStore;
        }
      } else {
        caStore = forge.pki.createCaStore();
      }
      var cipherSuites = options.cipherSuites || null;
      if (cipherSuites === null) {
        cipherSuites = [];
        for (var key2 in tls.CipherSuites) {
          cipherSuites.push(tls.CipherSuites[key2]);
        }
      }
      var entity = options.server || false ? tls.ConnectionEnd.server : tls.ConnectionEnd.client;
      var sessionCache = options.sessionCache ? tls.createSessionCache(options.sessionCache) : null;
      var c2 = {
        version: { major: tls.Version.major, minor: tls.Version.minor },
        entity,
        sessionId: options.sessionId,
        caStore,
        sessionCache,
        cipherSuites,
        connected: options.connected,
        virtualHost: options.virtualHost || null,
        verifyClient: options.verifyClient || false,
        verify: options.verify || function(cn, vfd, dpth, cts) {
          return vfd;
        },
        verifyOptions: options.verifyOptions || {},
        getCertificate: options.getCertificate || null,
        getPrivateKey: options.getPrivateKey || null,
        getSignature: options.getSignature || null,
        input: forge.util.createBuffer(),
        tlsData: forge.util.createBuffer(),
        data: forge.util.createBuffer(),
        tlsDataReady: options.tlsDataReady,
        dataReady: options.dataReady,
        heartbeatReceived: options.heartbeatReceived,
        closed: options.closed,
        error: function(c3, ex) {
          ex.origin = ex.origin || (c3.entity === tls.ConnectionEnd.client ? "client" : "server");
          if (ex.send) {
            tls.queue(c3, tls.createAlert(c3, ex.alert));
            tls.flush(c3);
          }
          var fatal = ex.fatal !== false;
          if (fatal) {
            c3.fail = true;
          }
          options.error(c3, ex);
          if (fatal) {
            c3.close(false);
          }
        },
        deflate: options.deflate || null,
        inflate: options.inflate || null
      };
      c2.reset = function(clearFail) {
        c2.version = { major: tls.Version.major, minor: tls.Version.minor };
        c2.record = null;
        c2.session = null;
        c2.peerCertificate = null;
        c2.state = {
          pending: null,
          current: null
        };
        c2.expect = c2.entity === tls.ConnectionEnd.client ? SHE : CHE;
        c2.fragmented = null;
        c2.records = [];
        c2.open = false;
        c2.handshakes = 0;
        c2.handshaking = false;
        c2.isConnected = false;
        c2.fail = !(clearFail || typeof clearFail === "undefined");
        c2.input.clear();
        c2.tlsData.clear();
        c2.data.clear();
        c2.state.current = tls.createConnectionState(c2);
      };
      c2.reset();
      var _update = function(c3, record) {
        var aligned = record.type - tls.ContentType.change_cipher_spec;
        var handlers = ctTable[c3.entity][c3.expect];
        if (aligned in handlers) {
          handlers[aligned](c3, record);
        } else {
          tls.handleUnexpected(c3, record);
        }
      };
      var _readRecordHeader = function(c3) {
        var rval = 0;
        var b2 = c3.input;
        var len = b2.length();
        if (len < 5) {
          rval = 5 - len;
        } else {
          c3.record = {
            type: b2.getByte(),
            version: {
              major: b2.getByte(),
              minor: b2.getByte()
            },
            length: b2.getInt16(),
            fragment: forge.util.createBuffer(),
            ready: false
          };
          var compatibleVersion = c3.record.version.major === c3.version.major;
          if (compatibleVersion && c3.session && c3.session.version) {
            compatibleVersion = c3.record.version.minor === c3.version.minor;
          }
          if (!compatibleVersion) {
            c3.error(c3, {
              message: "Incompatible TLS version.",
              send: true,
              alert: {
                level: tls.Alert.Level.fatal,
                description: tls.Alert.Description.protocol_version
              }
            });
          }
        }
        return rval;
      };
      var _readRecord = function(c3) {
        var rval = 0;
        var b2 = c3.input;
        var len = b2.length();
        if (len < c3.record.length) {
          rval = c3.record.length - len;
        } else {
          c3.record.fragment.putBytes(b2.getBytes(c3.record.length));
          b2.compact();
          var s2 = c3.state.current.read;
          if (s2.update(c3, c3.record)) {
            if (c3.fragmented !== null) {
              if (c3.fragmented.type === c3.record.type) {
                c3.fragmented.fragment.putBuffer(c3.record.fragment);
                c3.record = c3.fragmented;
              } else {
                c3.error(c3, {
                  message: "Invalid fragmented record.",
                  send: true,
                  alert: {
                    level: tls.Alert.Level.fatal,
                    description: tls.Alert.Description.unexpected_message
                  }
                });
              }
            }
            c3.record.ready = true;
          }
        }
        return rval;
      };
      c2.handshake = function(sessionId) {
        if (c2.entity !== tls.ConnectionEnd.client) {
          c2.error(c2, {
            message: "Cannot initiate handshake as a server.",
            fatal: false
          });
        } else if (c2.handshaking) {
          c2.error(c2, {
            message: "Handshake already in progress.",
            fatal: false
          });
        } else {
          if (c2.fail && !c2.open && c2.handshakes === 0) {
            c2.fail = false;
          }
          c2.handshaking = true;
          sessionId = sessionId || "";
          var session = null;
          if (sessionId.length > 0) {
            if (c2.sessionCache) {
              session = c2.sessionCache.getSession(sessionId);
            }
            if (session === null) {
              sessionId = "";
            }
          }
          if (sessionId.length === 0 && c2.sessionCache) {
            session = c2.sessionCache.getSession();
            if (session !== null) {
              sessionId = session.id;
            }
          }
          c2.session = {
            id: sessionId,
            version: null,
            cipherSuite: null,
            compressionMethod: null,
            serverCertificate: null,
            certificateRequest: null,
            clientCertificate: null,
            sp: {},
            md5: forge.md.md5.create(),
            sha1: forge.md.sha1.create()
          };
          if (session) {
            c2.version = session.version;
            c2.session.sp = session.sp;
          }
          c2.session.sp.client_random = tls.createRandom().getBytes();
          c2.open = true;
          tls.queue(c2, tls.createRecord(c2, {
            type: tls.ContentType.handshake,
            data: tls.createClientHello(c2)
          }));
          tls.flush(c2);
        }
      };
      c2.process = function(data) {
        var rval = 0;
        if (data) {
          c2.input.putBytes(data);
        }
        if (!c2.fail) {
          if (c2.record !== null && c2.record.ready && c2.record.fragment.isEmpty()) {
            c2.record = null;
          }
          if (c2.record === null) {
            rval = _readRecordHeader(c2);
          }
          if (!c2.fail && c2.record !== null && !c2.record.ready) {
            rval = _readRecord(c2);
          }
          if (!c2.fail && c2.record !== null && c2.record.ready) {
            _update(c2, c2.record);
          }
        }
        return rval;
      };
      c2.prepare = function(data) {
        tls.queue(c2, tls.createRecord(c2, {
          type: tls.ContentType.application_data,
          data: forge.util.createBuffer(data)
        }));
        return tls.flush(c2);
      };
      c2.prepareHeartbeatRequest = function(payload, payloadLength) {
        if (payload instanceof forge.util.ByteBuffer) {
          payload = payload.bytes();
        }
        if (typeof payloadLength === "undefined") {
          payloadLength = payload.length;
        }
        c2.expectedHeartbeatPayload = payload;
        tls.queue(c2, tls.createRecord(c2, {
          type: tls.ContentType.heartbeat,
          data: tls.createHeartbeat(
            tls.HeartbeatMessageType.heartbeat_request,
            payload,
            payloadLength
          )
        }));
        return tls.flush(c2);
      };
      c2.close = function(clearFail) {
        if (!c2.fail && c2.sessionCache && c2.session) {
          var session = {
            id: c2.session.id,
            version: c2.session.version,
            sp: c2.session.sp
          };
          session.sp.keys = null;
          c2.sessionCache.setSession(session.id, session);
        }
        if (c2.open) {
          c2.open = false;
          c2.input.clear();
          if (c2.isConnected || c2.handshaking) {
            c2.isConnected = c2.handshaking = false;
            tls.queue(c2, tls.createAlert(c2, {
              level: tls.Alert.Level.warning,
              description: tls.Alert.Description.close_notify
            }));
            tls.flush(c2);
          }
          c2.closed(c2);
        }
        c2.reset(clearFail);
      };
      return c2;
    };
    module2.exports = forge.tls = forge.tls || {};
    for (key in tls) {
      if (typeof tls[key] !== "function") {
        forge.tls[key] = tls[key];
      }
    }
    var key;
    forge.tls.prf_tls1 = prf_TLS1;
    forge.tls.hmac_sha1 = hmac_sha1;
    forge.tls.createSessionCache = tls.createSessionCache;
    forge.tls.createConnection = tls.createConnection;
  }
});

// node_modules/node-forge/lib/aesCipherSuites.js
var require_aesCipherSuites = __commonJS({
  "node_modules/node-forge/lib/aesCipherSuites.js"(exports2, module2) {
    var forge = require_forge();
    require_aes();
    require_tls();
    var tls = module2.exports = forge.tls;
    tls.CipherSuites["TLS_RSA_WITH_AES_128_CBC_SHA"] = {
      id: [0, 47],
      name: "TLS_RSA_WITH_AES_128_CBC_SHA",
      initSecurityParameters: function(sp) {
        sp.bulk_cipher_algorithm = tls.BulkCipherAlgorithm.aes;
        sp.cipher_type = tls.CipherType.block;
        sp.enc_key_length = 16;
        sp.block_length = 16;
        sp.fixed_iv_length = 16;
        sp.record_iv_length = 16;
        sp.mac_algorithm = tls.MACAlgorithm.hmac_sha1;
        sp.mac_length = 20;
        sp.mac_key_length = 20;
      },
      initConnectionState
    };
    tls.CipherSuites["TLS_RSA_WITH_AES_256_CBC_SHA"] = {
      id: [0, 53],
      name: "TLS_RSA_WITH_AES_256_CBC_SHA",
      initSecurityParameters: function(sp) {
        sp.bulk_cipher_algorithm = tls.BulkCipherAlgorithm.aes;
        sp.cipher_type = tls.CipherType.block;
        sp.enc_key_length = 32;
        sp.block_length = 16;
        sp.fixed_iv_length = 16;
        sp.record_iv_length = 16;
        sp.mac_algorithm = tls.MACAlgorithm.hmac_sha1;
        sp.mac_length = 20;
        sp.mac_key_length = 20;
      },
      initConnectionState
    };
    function initConnectionState(state, c2, sp) {
      var client = c2.entity === forge.tls.ConnectionEnd.client;
      state.read.cipherState = {
        init: false,
        cipher: forge.cipher.createDecipher("AES-CBC", client ? sp.keys.server_write_key : sp.keys.client_write_key),
        iv: client ? sp.keys.server_write_IV : sp.keys.client_write_IV
      };
      state.write.cipherState = {
        init: false,
        cipher: forge.cipher.createCipher("AES-CBC", client ? sp.keys.client_write_key : sp.keys.server_write_key),
        iv: client ? sp.keys.client_write_IV : sp.keys.server_write_IV
      };
      state.read.cipherFunction = decrypt_aes_cbc_sha1;
      state.write.cipherFunction = encrypt_aes_cbc_sha1;
      state.read.macLength = state.write.macLength = sp.mac_length;
      state.read.macFunction = state.write.macFunction = tls.hmac_sha1;
    }
    function encrypt_aes_cbc_sha1(record, s2) {
      var rval = false;
      var mac = s2.macFunction(s2.macKey, s2.sequenceNumber, record);
      record.fragment.putBytes(mac);
      s2.updateSequenceNumber();
      var iv;
      if (record.version.minor === tls.Versions.TLS_1_0.minor) {
        iv = s2.cipherState.init ? null : s2.cipherState.iv;
      } else {
        iv = forge.random.getBytesSync(16);
      }
      s2.cipherState.init = true;
      var cipher = s2.cipherState.cipher;
      cipher.start({ iv });
      if (record.version.minor >= tls.Versions.TLS_1_1.minor) {
        cipher.output.putBytes(iv);
      }
      cipher.update(record.fragment);
      if (cipher.finish(encrypt_aes_cbc_sha1_padding)) {
        record.fragment = cipher.output;
        record.length = record.fragment.length();
        rval = true;
      }
      return rval;
    }
    function encrypt_aes_cbc_sha1_padding(blockSize, input, decrypt) {
      if (!decrypt) {
        var padding = blockSize - input.length() % blockSize;
        input.fillWithByte(padding - 1, padding);
      }
      return true;
    }
    function decrypt_aes_cbc_sha1_padding(blockSize, output, decrypt) {
      var rval = true;
      if (decrypt) {
        var len = output.length();
        var paddingLength = output.last();
        for (var i2 = len - 1 - paddingLength; i2 < len - 1; ++i2) {
          rval = rval && output.at(i2) == paddingLength;
        }
        if (rval) {
          output.truncate(paddingLength + 1);
        }
      }
      return rval;
    }
    function decrypt_aes_cbc_sha1(record, s2) {
      var rval = false;
      var iv;
      if (record.version.minor === tls.Versions.TLS_1_0.minor) {
        iv = s2.cipherState.init ? null : s2.cipherState.iv;
      } else {
        iv = record.fragment.getBytes(16);
      }
      s2.cipherState.init = true;
      var cipher = s2.cipherState.cipher;
      cipher.start({ iv });
      cipher.update(record.fragment);
      rval = cipher.finish(decrypt_aes_cbc_sha1_padding);
      var macLen = s2.macLength;
      var mac = forge.random.getBytesSync(macLen);
      var len = cipher.output.length();
      if (len >= macLen) {
        record.fragment = cipher.output.getBytes(len - macLen);
        mac = cipher.output.getBytes(macLen);
      } else {
        record.fragment = cipher.output.getBytes();
      }
      record.fragment = forge.util.createBuffer(record.fragment);
      record.length = record.fragment.length();
      var mac2 = s2.macFunction(s2.macKey, s2.sequenceNumber, record);
      s2.updateSequenceNumber();
      rval = compareMacs(s2.macKey, mac, mac2) && rval;
      return rval;
    }
    function compareMacs(key, mac1, mac2) {
      var hmac = forge.hmac.create();
      hmac.start("SHA1", key);
      hmac.update(mac1);
      mac1 = hmac.digest().getBytes();
      hmac.start(null, null);
      hmac.update(mac2);
      mac2 = hmac.digest().getBytes();
      return mac1 === mac2;
    }
  }
});

// node_modules/node-forge/lib/sha512.js
var require_sha512 = __commonJS({
  "node_modules/node-forge/lib/sha512.js"(exports2, module2) {
    var forge = require_forge();
    require_md();
    require_util();
    var sha512 = module2.exports = forge.sha512 = forge.sha512 || {};
    forge.md.sha512 = forge.md.algorithms.sha512 = sha512;
    var sha384 = forge.sha384 = forge.sha512.sha384 = forge.sha512.sha384 || {};
    sha384.create = function() {
      return sha512.create("SHA-384");
    };
    forge.md.sha384 = forge.md.algorithms.sha384 = sha384;
    forge.sha512.sha256 = forge.sha512.sha256 || {
      create: function() {
        return sha512.create("SHA-512/256");
      }
    };
    forge.md["sha512/256"] = forge.md.algorithms["sha512/256"] = forge.sha512.sha256;
    forge.sha512.sha224 = forge.sha512.sha224 || {
      create: function() {
        return sha512.create("SHA-512/224");
      }
    };
    forge.md["sha512/224"] = forge.md.algorithms["sha512/224"] = forge.sha512.sha224;
    sha512.create = function(algorithm) {
      if (!_initialized) {
        _init();
      }
      if (typeof algorithm === "undefined") {
        algorithm = "SHA-512";
      }
      if (!(algorithm in _states)) {
        throw new Error("Invalid SHA-512 algorithm: " + algorithm);
      }
      var _state = _states[algorithm];
      var _h = null;
      var _input = forge.util.createBuffer();
      var _w = new Array(80);
      for (var wi = 0; wi < 80; ++wi) {
        _w[wi] = new Array(2);
      }
      var digestLength = 64;
      switch (algorithm) {
        case "SHA-384":
          digestLength = 48;
          break;
        case "SHA-512/256":
          digestLength = 32;
          break;
        case "SHA-512/224":
          digestLength = 28;
          break;
      }
      var md = {
        // SHA-512 => sha512
        algorithm: algorithm.replace("-", "").toLowerCase(),
        blockLength: 128,
        digestLength,
        // 56-bit length of message so far (does not including padding)
        messageLength: 0,
        // true message length
        fullMessageLength: null,
        // size of message length in bytes
        messageLengthSize: 16
      };
      md.start = function() {
        md.messageLength = 0;
        md.fullMessageLength = md.messageLength128 = [];
        var int32s = md.messageLengthSize / 4;
        for (var i2 = 0; i2 < int32s; ++i2) {
          md.fullMessageLength.push(0);
        }
        _input = forge.util.createBuffer();
        _h = new Array(_state.length);
        for (var i2 = 0; i2 < _state.length; ++i2) {
          _h[i2] = _state[i2].slice(0);
        }
        return md;
      };
      md.start();
      md.update = function(msg, encoding) {
        if (encoding === "utf8") {
          msg = forge.util.encodeUtf8(msg);
        }
        var len = msg.length;
        md.messageLength += len;
        len = [len / 4294967296 >>> 0, len >>> 0];
        for (var i2 = md.fullMessageLength.length - 1; i2 >= 0; --i2) {
          md.fullMessageLength[i2] += len[1];
          len[1] = len[0] + (md.fullMessageLength[i2] / 4294967296 >>> 0);
          md.fullMessageLength[i2] = md.fullMessageLength[i2] >>> 0;
          len[0] = len[1] / 4294967296 >>> 0;
        }
        _input.putBytes(msg);
        _update(_h, _w, _input);
        if (_input.read > 2048 || _input.length() === 0) {
          _input.compact();
        }
        return md;
      };
      md.digest = function() {
        var finalBlock = forge.util.createBuffer();
        finalBlock.putBytes(_input.bytes());
        var remaining = md.fullMessageLength[md.fullMessageLength.length - 1] + md.messageLengthSize;
        var overflow = remaining & md.blockLength - 1;
        finalBlock.putBytes(_padding.substr(0, md.blockLength - overflow));
        var next, carry;
        var bits = md.fullMessageLength[0] * 8;
        for (var i2 = 0; i2 < md.fullMessageLength.length - 1; ++i2) {
          next = md.fullMessageLength[i2 + 1] * 8;
          carry = next / 4294967296 >>> 0;
          bits += carry;
          finalBlock.putInt32(bits >>> 0);
          bits = next >>> 0;
        }
        finalBlock.putInt32(bits);
        var h2 = new Array(_h.length);
        for (var i2 = 0; i2 < _h.length; ++i2) {
          h2[i2] = _h[i2].slice(0);
        }
        _update(h2, _w, finalBlock);
        var rval = forge.util.createBuffer();
        var hlen;
        if (algorithm === "SHA-512") {
          hlen = h2.length;
        } else if (algorithm === "SHA-384") {
          hlen = h2.length - 2;
        } else {
          hlen = h2.length - 4;
        }
        for (var i2 = 0; i2 < hlen; ++i2) {
          rval.putInt32(h2[i2][0]);
          if (i2 !== hlen - 1 || algorithm !== "SHA-512/224") {
            rval.putInt32(h2[i2][1]);
          }
        }
        return rval;
      };
      return md;
    };
    var _padding = null;
    var _initialized = false;
    var _k = null;
    var _states = null;
    function _init() {
      _padding = String.fromCharCode(128);
      _padding += forge.util.fillString(String.fromCharCode(0), 128);
      _k = [
        [1116352408, 3609767458],
        [1899447441, 602891725],
        [3049323471, 3964484399],
        [3921009573, 2173295548],
        [961987163, 4081628472],
        [1508970993, 3053834265],
        [2453635748, 2937671579],
        [2870763221, 3664609560],
        [3624381080, 2734883394],
        [310598401, 1164996542],
        [607225278, 1323610764],
        [1426881987, 3590304994],
        [1925078388, 4068182383],
        [2162078206, 991336113],
        [2614888103, 633803317],
        [3248222580, 3479774868],
        [3835390401, 2666613458],
        [4022224774, 944711139],
        [264347078, 2341262773],
        [604807628, 2007800933],
        [770255983, 1495990901],
        [1249150122, 1856431235],
        [1555081692, 3175218132],
        [1996064986, 2198950837],
        [2554220882, 3999719339],
        [2821834349, 766784016],
        [2952996808, 2566594879],
        [3210313671, 3203337956],
        [3336571891, 1034457026],
        [3584528711, 2466948901],
        [113926993, 3758326383],
        [338241895, 168717936],
        [666307205, 1188179964],
        [773529912, 1546045734],
        [1294757372, 1522805485],
        [1396182291, 2643833823],
        [1695183700, 2343527390],
        [1986661051, 1014477480],
        [2177026350, 1206759142],
        [2456956037, 344077627],
        [2730485921, 1290863460],
        [2820302411, 3158454273],
        [3259730800, 3505952657],
        [3345764771, 106217008],
        [3516065817, 3606008344],
        [3600352804, 1432725776],
        [4094571909, 1467031594],
        [275423344, 851169720],
        [430227734, 3100823752],
        [506948616, 1363258195],
        [659060556, 3750685593],
        [883997877, 3785050280],
        [958139571, 3318307427],
        [1322822218, 3812723403],
        [1537002063, 2003034995],
        [1747873779, 3602036899],
        [1955562222, 1575990012],
        [2024104815, 1125592928],
        [2227730452, 2716904306],
        [2361852424, 442776044],
        [2428436474, 593698344],
        [2756734187, 3733110249],
        [3204031479, 2999351573],
        [3329325298, 3815920427],
        [3391569614, 3928383900],
        [3515267271, 566280711],
        [3940187606, 3454069534],
        [4118630271, 4000239992],
        [116418474, 1914138554],
        [174292421, 2731055270],
        [289380356, 3203993006],
        [460393269, 320620315],
        [685471733, 587496836],
        [852142971, 1086792851],
        [1017036298, 365543100],
        [1126000580, 2618297676],
        [1288033470, 3409855158],
        [1501505948, 4234509866],
        [1607167915, 987167468],
        [1816402316, 1246189591]
      ];
      _states = {};
      _states["SHA-512"] = [
        [1779033703, 4089235720],
        [3144134277, 2227873595],
        [1013904242, 4271175723],
        [2773480762, 1595750129],
        [1359893119, 2917565137],
        [2600822924, 725511199],
        [528734635, 4215389547],
        [1541459225, 327033209]
      ];
      _states["SHA-384"] = [
        [3418070365, 3238371032],
        [1654270250, 914150663],
        [2438529370, 812702999],
        [355462360, 4144912697],
        [1731405415, 4290775857],
        [2394180231, 1750603025],
        [3675008525, 1694076839],
        [1203062813, 3204075428]
      ];
      _states["SHA-512/256"] = [
        [573645204, 4230739756],
        [2673172387, 3360449730],
        [596883563, 1867755857],
        [2520282905, 1497426621],
        [2519219938, 2827943907],
        [3193839141, 1401305490],
        [721525244, 746961066],
        [246885852, 2177182882]
      ];
      _states["SHA-512/224"] = [
        [2352822216, 424955298],
        [1944164710, 2312950998],
        [502970286, 855612546],
        [1738396948, 1479516111],
        [258812777, 2077511080],
        [2011393907, 79989058],
        [1067287976, 1780299464],
        [286451373, 2446758561]
      ];
      _initialized = true;
    }
    function _update(s2, w2, bytes) {
      var t1_hi, t1_lo;
      var t2_hi, t2_lo;
      var s0_hi, s0_lo;
      var s1_hi, s1_lo;
      var ch_hi, ch_lo;
      var maj_hi, maj_lo;
      var a_hi, a_lo;
      var b_hi, b_lo;
      var c_hi, c_lo;
      var d_hi, d_lo;
      var e_hi, e_lo;
      var f_hi, f_lo;
      var g_hi, g_lo;
      var h_hi, h_lo;
      var i2, hi, lo, w22, w7, w15, w16;
      var len = bytes.length();
      while (len >= 128) {
        for (i2 = 0; i2 < 16; ++i2) {
          w2[i2][0] = bytes.getInt32() >>> 0;
          w2[i2][1] = bytes.getInt32() >>> 0;
        }
        for (; i2 < 80; ++i2) {
          w22 = w2[i2 - 2];
          hi = w22[0];
          lo = w22[1];
          t1_hi = ((hi >>> 19 | lo << 13) ^ // ROTR 19
          (lo >>> 29 | hi << 3) ^ // ROTR 61/(swap + ROTR 29)
          hi >>> 6) >>> 0;
          t1_lo = ((hi << 13 | lo >>> 19) ^ // ROTR 19
          (lo << 3 | hi >>> 29) ^ // ROTR 61/(swap + ROTR 29)
          (hi << 26 | lo >>> 6)) >>> 0;
          w15 = w2[i2 - 15];
          hi = w15[0];
          lo = w15[1];
          t2_hi = ((hi >>> 1 | lo << 31) ^ // ROTR 1
          (hi >>> 8 | lo << 24) ^ // ROTR 8
          hi >>> 7) >>> 0;
          t2_lo = ((hi << 31 | lo >>> 1) ^ // ROTR 1
          (hi << 24 | lo >>> 8) ^ // ROTR 8
          (hi << 25 | lo >>> 7)) >>> 0;
          w7 = w2[i2 - 7];
          w16 = w2[i2 - 16];
          lo = t1_lo + w7[1] + t2_lo + w16[1];
          w2[i2][0] = t1_hi + w7[0] + t2_hi + w16[0] + (lo / 4294967296 >>> 0) >>> 0;
          w2[i2][1] = lo >>> 0;
        }
        a_hi = s2[0][0];
        a_lo = s2[0][1];
        b_hi = s2[1][0];
        b_lo = s2[1][1];
        c_hi = s2[2][0];
        c_lo = s2[2][1];
        d_hi = s2[3][0];
        d_lo = s2[3][1];
        e_hi = s2[4][0];
        e_lo = s2[4][1];
        f_hi = s2[5][0];
        f_lo = s2[5][1];
        g_hi = s2[6][0];
        g_lo = s2[6][1];
        h_hi = s2[7][0];
        h_lo = s2[7][1];
        for (i2 = 0; i2 < 80; ++i2) {
          s1_hi = ((e_hi >>> 14 | e_lo << 18) ^ // ROTR 14
          (e_hi >>> 18 | e_lo << 14) ^ // ROTR 18
          (e_lo >>> 9 | e_hi << 23)) >>> 0;
          s1_lo = ((e_hi << 18 | e_lo >>> 14) ^ // ROTR 14
          (e_hi << 14 | e_lo >>> 18) ^ // ROTR 18
          (e_lo << 23 | e_hi >>> 9)) >>> 0;
          ch_hi = (g_hi ^ e_hi & (f_hi ^ g_hi)) >>> 0;
          ch_lo = (g_lo ^ e_lo & (f_lo ^ g_lo)) >>> 0;
          s0_hi = ((a_hi >>> 28 | a_lo << 4) ^ // ROTR 28
          (a_lo >>> 2 | a_hi << 30) ^ // ROTR 34/(swap + ROTR 2)
          (a_lo >>> 7 | a_hi << 25)) >>> 0;
          s0_lo = ((a_hi << 4 | a_lo >>> 28) ^ // ROTR 28
          (a_lo << 30 | a_hi >>> 2) ^ // ROTR 34/(swap + ROTR 2)
          (a_lo << 25 | a_hi >>> 7)) >>> 0;
          maj_hi = (a_hi & b_hi | c_hi & (a_hi ^ b_hi)) >>> 0;
          maj_lo = (a_lo & b_lo | c_lo & (a_lo ^ b_lo)) >>> 0;
          lo = h_lo + s1_lo + ch_lo + _k[i2][1] + w2[i2][1];
          t1_hi = h_hi + s1_hi + ch_hi + _k[i2][0] + w2[i2][0] + (lo / 4294967296 >>> 0) >>> 0;
          t1_lo = lo >>> 0;
          lo = s0_lo + maj_lo;
          t2_hi = s0_hi + maj_hi + (lo / 4294967296 >>> 0) >>> 0;
          t2_lo = lo >>> 0;
          h_hi = g_hi;
          h_lo = g_lo;
          g_hi = f_hi;
          g_lo = f_lo;
          f_hi = e_hi;
          f_lo = e_lo;
          lo = d_lo + t1_lo;
          e_hi = d_hi + t1_hi + (lo / 4294967296 >>> 0) >>> 0;
          e_lo = lo >>> 0;
          d_hi = c_hi;
          d_lo = c_lo;
          c_hi = b_hi;
          c_lo = b_lo;
          b_hi = a_hi;
          b_lo = a_lo;
          lo = t1_lo + t2_lo;
          a_hi = t1_hi + t2_hi + (lo / 4294967296 >>> 0) >>> 0;
          a_lo = lo >>> 0;
        }
        lo = s2[0][1] + a_lo;
        s2[0][0] = s2[0][0] + a_hi + (lo / 4294967296 >>> 0) >>> 0;
        s2[0][1] = lo >>> 0;
        lo = s2[1][1] + b_lo;
        s2[1][0] = s2[1][0] + b_hi + (lo / 4294967296 >>> 0) >>> 0;
        s2[1][1] = lo >>> 0;
        lo = s2[2][1] + c_lo;
        s2[2][0] = s2[2][0] + c_hi + (lo / 4294967296 >>> 0) >>> 0;
        s2[2][1] = lo >>> 0;
        lo = s2[3][1] + d_lo;
        s2[3][0] = s2[3][0] + d_hi + (lo / 4294967296 >>> 0) >>> 0;
        s2[3][1] = lo >>> 0;
        lo = s2[4][1] + e_lo;
        s2[4][0] = s2[4][0] + e_hi + (lo / 4294967296 >>> 0) >>> 0;
        s2[4][1] = lo >>> 0;
        lo = s2[5][1] + f_lo;
        s2[5][0] = s2[5][0] + f_hi + (lo / 4294967296 >>> 0) >>> 0;
        s2[5][1] = lo >>> 0;
        lo = s2[6][1] + g_lo;
        s2[6][0] = s2[6][0] + g_hi + (lo / 4294967296 >>> 0) >>> 0;
        s2[6][1] = lo >>> 0;
        lo = s2[7][1] + h_lo;
        s2[7][0] = s2[7][0] + h_hi + (lo / 4294967296 >>> 0) >>> 0;
        s2[7][1] = lo >>> 0;
        len -= 128;
      }
    }
  }
});

// node_modules/node-forge/lib/asn1-validator.js
var require_asn1_validator = __commonJS({
  "node_modules/node-forge/lib/asn1-validator.js"(exports2) {
    var forge = require_forge();
    require_asn1();
    var asn1 = forge.asn1;
    exports2.privateKeyValidator = {
      // PrivateKeyInfo
      name: "PrivateKeyInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      value: [{
        // Version (INTEGER)
        name: "PrivateKeyInfo.version",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.INTEGER,
        constructed: false,
        capture: "privateKeyVersion"
      }, {
        // privateKeyAlgorithm
        name: "PrivateKeyInfo.privateKeyAlgorithm",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.SEQUENCE,
        constructed: true,
        value: [{
          name: "AlgorithmIdentifier.algorithm",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.OID,
          constructed: false,
          capture: "privateKeyOid"
        }]
      }, {
        // PrivateKey
        name: "PrivateKeyInfo",
        tagClass: asn1.Class.UNIVERSAL,
        type: asn1.Type.OCTETSTRING,
        constructed: false,
        capture: "privateKey"
      }]
    };
    exports2.publicKeyValidator = {
      name: "SubjectPublicKeyInfo",
      tagClass: asn1.Class.UNIVERSAL,
      type: asn1.Type.SEQUENCE,
      constructed: true,
      captureAsn1: "subjectPublicKeyInfo",
      value: [
        {
          name: "SubjectPublicKeyInfo.AlgorithmIdentifier",
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.SEQUENCE,
          constructed: true,
          value: [{
            name: "AlgorithmIdentifier.algorithm",
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.OID,
            constructed: false,
            capture: "publicKeyOid"
          }]
        },
        // capture group for ed25519PublicKey
        {
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.BITSTRING,
          constructed: false,
          composed: true,
          captureBitStringValue: "ed25519PublicKey"
        }
        // FIXME: this is capture group for rsaPublicKey, use it in this API or
        // discard?
        /* {
          // subjectPublicKey
          name: 'SubjectPublicKeyInfo.subjectPublicKey',
          tagClass: asn1.Class.UNIVERSAL,
          type: asn1.Type.BITSTRING,
          constructed: false,
          value: [{
            // RSAPublicKey
            name: 'SubjectPublicKeyInfo.subjectPublicKey.RSAPublicKey',
            tagClass: asn1.Class.UNIVERSAL,
            type: asn1.Type.SEQUENCE,
            constructed: true,
            optional: true,
            captureAsn1: 'rsaPublicKey'
          }]
        } */
      ]
    };
  }
});

// node_modules/node-forge/lib/ed25519.js
var require_ed25519 = __commonJS({
  "node_modules/node-forge/lib/ed25519.js"(exports2, module2) {
    var forge = require_forge();
    require_jsbn();
    require_random();
    require_sha512();
    require_util();
    var asn1Validator = require_asn1_validator();
    var publicKeyValidator = asn1Validator.publicKeyValidator;
    var privateKeyValidator = asn1Validator.privateKeyValidator;
    if (typeof BigInteger === "undefined") {
      BigInteger = forge.jsbn.BigInteger;
    }
    var BigInteger;
    var ByteBuffer = forge.util.ByteBuffer;
    var NativeBuffer = typeof Buffer === "undefined" ? Uint8Array : Buffer;
    forge.pki = forge.pki || {};
    module2.exports = forge.pki.ed25519 = forge.ed25519 = forge.ed25519 || {};
    var ed25519 = forge.ed25519;
    ed25519.constants = {};
    ed25519.constants.PUBLIC_KEY_BYTE_LENGTH = 32;
    ed25519.constants.PRIVATE_KEY_BYTE_LENGTH = 64;
    ed25519.constants.SEED_BYTE_LENGTH = 32;
    ed25519.constants.SIGN_BYTE_LENGTH = 64;
    ed25519.constants.HASH_BYTE_LENGTH = 64;
    ed25519.generateKeyPair = function(options) {
      options = options || {};
      var seed = options.seed;
      if (seed === void 0) {
        seed = forge.random.getBytesSync(ed25519.constants.SEED_BYTE_LENGTH);
      } else if (typeof seed === "string") {
        if (seed.length !== ed25519.constants.SEED_BYTE_LENGTH) {
          throw new TypeError(
            '"seed" must be ' + ed25519.constants.SEED_BYTE_LENGTH + " bytes in length."
          );
        }
      } else if (!(seed instanceof Uint8Array)) {
        throw new TypeError(
          '"seed" must be a node.js Buffer, Uint8Array, or a binary string.'
        );
      }
      seed = messageToNativeBuffer({ message: seed, encoding: "binary" });
      var pk = new NativeBuffer(ed25519.constants.PUBLIC_KEY_BYTE_LENGTH);
      var sk = new NativeBuffer(ed25519.constants.PRIVATE_KEY_BYTE_LENGTH);
      for (var i2 = 0; i2 < 32; ++i2) {
        sk[i2] = seed[i2];
      }
      crypto_sign_keypair(pk, sk);
      return { publicKey: pk, privateKey: sk };
    };
    ed25519.privateKeyFromAsn1 = function(obj) {
      var capture = {};
      var errors = [];
      var valid = forge.asn1.validate(obj, privateKeyValidator, capture, errors);
      if (!valid) {
        var error = new Error("Invalid Key.");
        error.errors = errors;
        throw error;
      }
      var oid = forge.asn1.derToOid(capture.privateKeyOid);
      var ed25519Oid = forge.oids.EdDSA25519;
      if (oid !== ed25519Oid) {
        throw new Error('Invalid OID "' + oid + '"; OID must be "' + ed25519Oid + '".');
      }
      var privateKey = capture.privateKey;
      var privateKeyBytes = messageToNativeBuffer({
        message: forge.asn1.fromDer(privateKey).value,
        encoding: "binary"
      });
      return { privateKeyBytes };
    };
    ed25519.publicKeyFromAsn1 = function(obj) {
      var capture = {};
      var errors = [];
      var valid = forge.asn1.validate(obj, publicKeyValidator, capture, errors);
      if (!valid) {
        var error = new Error("Invalid Key.");
        error.errors = errors;
        throw error;
      }
      var oid = forge.asn1.derToOid(capture.publicKeyOid);
      var ed25519Oid = forge.oids.EdDSA25519;
      if (oid !== ed25519Oid) {
        throw new Error('Invalid OID "' + oid + '"; OID must be "' + ed25519Oid + '".');
      }
      var publicKeyBytes = capture.ed25519PublicKey;
      if (publicKeyBytes.length !== ed25519.constants.PUBLIC_KEY_BYTE_LENGTH) {
        throw new Error("Key length is invalid.");
      }
      return messageToNativeBuffer({
        message: publicKeyBytes,
        encoding: "binary"
      });
    };
    ed25519.publicKeyFromPrivateKey = function(options) {
      options = options || {};
      var privateKey = messageToNativeBuffer({
        message: options.privateKey,
        encoding: "binary"
      });
      if (privateKey.length !== ed25519.constants.PRIVATE_KEY_BYTE_LENGTH) {
        throw new TypeError(
          '"options.privateKey" must have a byte length of ' + ed25519.constants.PRIVATE_KEY_BYTE_LENGTH
        );
      }
      var pk = new NativeBuffer(ed25519.constants.PUBLIC_KEY_BYTE_LENGTH);
      for (var i2 = 0; i2 < pk.length; ++i2) {
        pk[i2] = privateKey[32 + i2];
      }
      return pk;
    };
    ed25519.sign = function(options) {
      options = options || {};
      var msg = messageToNativeBuffer(options);
      var privateKey = messageToNativeBuffer({
        message: options.privateKey,
        encoding: "binary"
      });
      if (privateKey.length === ed25519.constants.SEED_BYTE_LENGTH) {
        var keyPair = ed25519.generateKeyPair({ seed: privateKey });
        privateKey = keyPair.privateKey;
      } else if (privateKey.length !== ed25519.constants.PRIVATE_KEY_BYTE_LENGTH) {
        throw new TypeError(
          '"options.privateKey" must have a byte length of ' + ed25519.constants.SEED_BYTE_LENGTH + " or " + ed25519.constants.PRIVATE_KEY_BYTE_LENGTH
        );
      }
      var signedMsg = new NativeBuffer(
        ed25519.constants.SIGN_BYTE_LENGTH + msg.length
      );
      crypto_sign(signedMsg, msg, msg.length, privateKey);
      var sig = new NativeBuffer(ed25519.constants.SIGN_BYTE_LENGTH);
      for (var i2 = 0; i2 < sig.length; ++i2) {
        sig[i2] = signedMsg[i2];
      }
      return sig;
    };
    ed25519.verify = function(options) {
      options = options || {};
      var msg = messageToNativeBuffer(options);
      if (options.signature === void 0) {
        throw new TypeError(
          '"options.signature" must be a node.js Buffer, a Uint8Array, a forge ByteBuffer, or a binary string.'
        );
      }
      var sig = messageToNativeBuffer({
        message: options.signature,
        encoding: "binary"
      });
      if (sig.length !== ed25519.constants.SIGN_BYTE_LENGTH) {
        throw new TypeError(
          '"options.signature" must have a byte length of ' + ed25519.constants.SIGN_BYTE_LENGTH
        );
      }
      var publicKey = messageToNativeBuffer({
        message: options.publicKey,
        encoding: "binary"
      });
      if (publicKey.length !== ed25519.constants.PUBLIC_KEY_BYTE_LENGTH) {
        throw new TypeError(
          '"options.publicKey" must have a byte length of ' + ed25519.constants.PUBLIC_KEY_BYTE_LENGTH
        );
      }
      var sm = new NativeBuffer(ed25519.constants.SIGN_BYTE_LENGTH + msg.length);
      var m2 = new NativeBuffer(ed25519.constants.SIGN_BYTE_LENGTH + msg.length);
      var i2;
      for (i2 = 0; i2 < ed25519.constants.SIGN_BYTE_LENGTH; ++i2) {
        sm[i2] = sig[i2];
      }
      for (i2 = 0; i2 < msg.length; ++i2) {
        sm[i2 + ed25519.constants.SIGN_BYTE_LENGTH] = msg[i2];
      }
      return crypto_sign_open(m2, sm, sm.length, publicKey) >= 0;
    };
    function messageToNativeBuffer(options) {
      var message = options.message;
      if (message instanceof Uint8Array || message instanceof NativeBuffer) {
        return message;
      }
      var encoding = options.encoding;
      if (message === void 0) {
        if (options.md) {
          message = options.md.digest().getBytes();
          encoding = "binary";
        } else {
          throw new TypeError('"options.message" or "options.md" not specified.');
        }
      }
      if (typeof message === "string" && !encoding) {
        throw new TypeError('"options.encoding" must be "binary" or "utf8".');
      }
      if (typeof message === "string") {
        if (typeof Buffer !== "undefined") {
          return Buffer.from(message, encoding);
        }
        message = new ByteBuffer(message, encoding);
      } else if (!(message instanceof ByteBuffer)) {
        throw new TypeError(
          '"options.message" must be a node.js Buffer, a Uint8Array, a forge ByteBuffer, or a string with "options.encoding" specifying its encoding.'
        );
      }
      var buffer = new NativeBuffer(message.length());
      for (var i2 = 0; i2 < buffer.length; ++i2) {
        buffer[i2] = message.at(i2);
      }
      return buffer;
    }
    var gf0 = gf();
    var gf1 = gf([1]);
    var D2 = gf([
      30883,
      4953,
      19914,
      30187,
      55467,
      16705,
      2637,
      112,
      59544,
      30585,
      16505,
      36039,
      65139,
      11119,
      27886,
      20995
    ]);
    var D22 = gf([
      61785,
      9906,
      39828,
      60374,
      45398,
      33411,
      5274,
      224,
      53552,
      61171,
      33010,
      6542,
      64743,
      22239,
      55772,
      9222
    ]);
    var X2 = gf([
      54554,
      36645,
      11616,
      51542,
      42930,
      38181,
      51040,
      26924,
      56412,
      64982,
      57905,
      49316,
      21502,
      52590,
      14035,
      8553
    ]);
    var Y2 = gf([
      26200,
      26214,
      26214,
      26214,
      26214,
      26214,
      26214,
      26214,
      26214,
      26214,
      26214,
      26214,
      26214,
      26214,
      26214,
      26214
    ]);
    var L2 = new Float64Array([
      237,
      211,
      245,
      92,
      26,
      99,
      18,
      88,
      214,
      156,
      247,
      162,
      222,
      249,
      222,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      16
    ]);
    var I2 = gf([
      41136,
      18958,
      6951,
      50414,
      58488,
      44335,
      6150,
      12099,
      55207,
      15867,
      153,
      11085,
      57099,
      20417,
      9344,
      11139
    ]);
    function sha512(msg, msgLen) {
      var md = forge.md.sha512.create();
      var buffer = new ByteBuffer(msg);
      md.update(buffer.getBytes(msgLen), "binary");
      var hash = md.digest().getBytes();
      if (typeof Buffer !== "undefined") {
        return Buffer.from(hash, "binary");
      }
      var out = new NativeBuffer(ed25519.constants.HASH_BYTE_LENGTH);
      for (var i2 = 0; i2 < 64; ++i2) {
        out[i2] = hash.charCodeAt(i2);
      }
      return out;
    }
    function crypto_sign_keypair(pk, sk) {
      var p2 = [gf(), gf(), gf(), gf()];
      var i2;
      var d2 = sha512(sk, 32);
      d2[0] &= 248;
      d2[31] &= 127;
      d2[31] |= 64;
      scalarbase(p2, d2);
      pack(pk, p2);
      for (i2 = 0; i2 < 32; ++i2) {
        sk[i2 + 32] = pk[i2];
      }
      return 0;
    }
    function crypto_sign(sm, m2, n2, sk) {
      var i2, j2, x2 = new Float64Array(64);
      var p2 = [gf(), gf(), gf(), gf()];
      var d2 = sha512(sk, 32);
      d2[0] &= 248;
      d2[31] &= 127;
      d2[31] |= 64;
      var smlen = n2 + 64;
      for (i2 = 0; i2 < n2; ++i2) {
        sm[64 + i2] = m2[i2];
      }
      for (i2 = 0; i2 < 32; ++i2) {
        sm[32 + i2] = d2[32 + i2];
      }
      var r2 = sha512(sm.subarray(32), n2 + 32);
      reduce(r2);
      scalarbase(p2, r2);
      pack(sm, p2);
      for (i2 = 32; i2 < 64; ++i2) {
        sm[i2] = sk[i2];
      }
      var h2 = sha512(sm, n2 + 64);
      reduce(h2);
      for (i2 = 32; i2 < 64; ++i2) {
        x2[i2] = 0;
      }
      for (i2 = 0; i2 < 32; ++i2) {
        x2[i2] = r2[i2];
      }
      for (i2 = 0; i2 < 32; ++i2) {
        for (j2 = 0; j2 < 32; j2++) {
          x2[i2 + j2] += h2[i2] * d2[j2];
        }
      }
      modL(sm.subarray(32), x2);
      return smlen;
    }
    function crypto_sign_open(m2, sm, n2, pk) {
      var i2, mlen;
      var t2 = new NativeBuffer(32);
      var p2 = [gf(), gf(), gf(), gf()], q2 = [gf(), gf(), gf(), gf()];
      mlen = -1;
      if (n2 < 64) {
        return -1;
      }
      if (unpackneg(q2, pk)) {
        return -1;
      }
      if (!_isCanonicalSignatureScalar(sm, 32)) {
        return -1;
      }
      for (i2 = 0; i2 < n2; ++i2) {
        m2[i2] = sm[i2];
      }
      for (i2 = 0; i2 < 32; ++i2) {
        m2[i2 + 32] = pk[i2];
      }
      var h2 = sha512(m2, n2);
      reduce(h2);
      scalarmult(p2, q2, h2);
      scalarbase(q2, sm.subarray(32));
      add(p2, q2);
      pack(t2, p2);
      n2 -= 64;
      if (crypto_verify_32(sm, 0, t2, 0)) {
        for (i2 = 0; i2 < n2; ++i2) {
          m2[i2] = 0;
        }
        return -1;
      }
      for (i2 = 0; i2 < n2; ++i2) {
        m2[i2] = sm[i2 + 64];
      }
      mlen = n2;
      return mlen;
    }
    function _isCanonicalSignatureScalar(bytes, offset) {
      var i2;
      for (i2 = 31; i2 >= 0; --i2) {
        if (bytes[offset + i2] < L2[i2]) {
          return true;
        }
        if (bytes[offset + i2] > L2[i2]) {
          return false;
        }
      }
      return false;
    }
    function modL(r2, x2) {
      var carry, i2, j2, k2;
      for (i2 = 63; i2 >= 32; --i2) {
        carry = 0;
        for (j2 = i2 - 32, k2 = i2 - 12; j2 < k2; ++j2) {
          x2[j2] += carry - 16 * x2[i2] * L2[j2 - (i2 - 32)];
          carry = x2[j2] + 128 >> 8;
          x2[j2] -= carry * 256;
        }
        x2[j2] += carry;
        x2[i2] = 0;
      }
      carry = 0;
      for (j2 = 0; j2 < 32; ++j2) {
        x2[j2] += carry - (x2[31] >> 4) * L2[j2];
        carry = x2[j2] >> 8;
        x2[j2] &= 255;
      }
      for (j2 = 0; j2 < 32; ++j2) {
        x2[j2] -= carry * L2[j2];
      }
      for (i2 = 0; i2 < 32; ++i2) {
        x2[i2 + 1] += x2[i2] >> 8;
        r2[i2] = x2[i2] & 255;
      }
    }
    function reduce(r2) {
      var x2 = new Float64Array(64);
      for (var i2 = 0; i2 < 64; ++i2) {
        x2[i2] = r2[i2];
        r2[i2] = 0;
      }
      modL(r2, x2);
    }
    function add(p2, q2) {
      var a2 = gf(), b2 = gf(), c2 = gf(), d2 = gf(), e2 = gf(), f2 = gf(), g2 = gf(), h2 = gf(), t2 = gf();
      Z2(a2, p2[1], p2[0]);
      Z2(t2, q2[1], q2[0]);
      M2(a2, a2, t2);
      A2(b2, p2[0], p2[1]);
      A2(t2, q2[0], q2[1]);
      M2(b2, b2, t2);
      M2(c2, p2[3], q2[3]);
      M2(c2, c2, D22);
      M2(d2, p2[2], q2[2]);
      A2(d2, d2, d2);
      Z2(e2, b2, a2);
      Z2(f2, d2, c2);
      A2(g2, d2, c2);
      A2(h2, b2, a2);
      M2(p2[0], e2, f2);
      M2(p2[1], h2, g2);
      M2(p2[2], g2, f2);
      M2(p2[3], e2, h2);
    }
    function cswap(p2, q2, b2) {
      for (var i2 = 0; i2 < 4; ++i2) {
        sel25519(p2[i2], q2[i2], b2);
      }
    }
    function pack(r2, p2) {
      var tx = gf(), ty = gf(), zi = gf();
      inv25519(zi, p2[2]);
      M2(tx, p2[0], zi);
      M2(ty, p2[1], zi);
      pack25519(r2, ty);
      r2[31] ^= par25519(tx) << 7;
    }
    function pack25519(o2, n2) {
      var i2, j2, b2;
      var m2 = gf(), t2 = gf();
      for (i2 = 0; i2 < 16; ++i2) {
        t2[i2] = n2[i2];
      }
      car25519(t2);
      car25519(t2);
      car25519(t2);
      for (j2 = 0; j2 < 2; ++j2) {
        m2[0] = t2[0] - 65517;
        for (i2 = 1; i2 < 15; ++i2) {
          m2[i2] = t2[i2] - 65535 - (m2[i2 - 1] >> 16 & 1);
          m2[i2 - 1] &= 65535;
        }
        m2[15] = t2[15] - 32767 - (m2[14] >> 16 & 1);
        b2 = m2[15] >> 16 & 1;
        m2[14] &= 65535;
        sel25519(t2, m2, 1 - b2);
      }
      for (i2 = 0; i2 < 16; i2++) {
        o2[2 * i2] = t2[i2] & 255;
        o2[2 * i2 + 1] = t2[i2] >> 8;
      }
    }
    function unpackneg(r2, p2) {
      var t2 = gf(), chk = gf(), num = gf(), den = gf(), den2 = gf(), den4 = gf(), den6 = gf();
      set25519(r2[2], gf1);
      unpack25519(r2[1], p2);
      S2(num, r2[1]);
      M2(den, num, D2);
      Z2(num, num, r2[2]);
      A2(den, r2[2], den);
      S2(den2, den);
      S2(den4, den2);
      M2(den6, den4, den2);
      M2(t2, den6, num);
      M2(t2, t2, den);
      pow2523(t2, t2);
      M2(t2, t2, num);
      M2(t2, t2, den);
      M2(t2, t2, den);
      M2(r2[0], t2, den);
      S2(chk, r2[0]);
      M2(chk, chk, den);
      if (neq25519(chk, num)) {
        M2(r2[0], r2[0], I2);
      }
      S2(chk, r2[0]);
      M2(chk, chk, den);
      if (neq25519(chk, num)) {
        return -1;
      }
      if (par25519(r2[0]) === p2[31] >> 7) {
        Z2(r2[0], gf0, r2[0]);
      }
      M2(r2[3], r2[0], r2[1]);
      return 0;
    }
    function unpack25519(o2, n2) {
      var i2;
      for (i2 = 0; i2 < 16; ++i2) {
        o2[i2] = n2[2 * i2] + (n2[2 * i2 + 1] << 8);
      }
      o2[15] &= 32767;
    }
    function pow2523(o2, i2) {
      var c2 = gf();
      var a2;
      for (a2 = 0; a2 < 16; ++a2) {
        c2[a2] = i2[a2];
      }
      for (a2 = 250; a2 >= 0; --a2) {
        S2(c2, c2);
        if (a2 !== 1) {
          M2(c2, c2, i2);
        }
      }
      for (a2 = 0; a2 < 16; ++a2) {
        o2[a2] = c2[a2];
      }
    }
    function neq25519(a2, b2) {
      var c2 = new NativeBuffer(32);
      var d2 = new NativeBuffer(32);
      pack25519(c2, a2);
      pack25519(d2, b2);
      return crypto_verify_32(c2, 0, d2, 0);
    }
    function crypto_verify_32(x2, xi, y2, yi) {
      return vn(x2, xi, y2, yi, 32);
    }
    function vn(x2, xi, y2, yi, n2) {
      var i2, d2 = 0;
      for (i2 = 0; i2 < n2; ++i2) {
        d2 |= x2[xi + i2] ^ y2[yi + i2];
      }
      return (1 & d2 - 1 >>> 8) - 1;
    }
    function par25519(a2) {
      var d2 = new NativeBuffer(32);
      pack25519(d2, a2);
      return d2[0] & 1;
    }
    function scalarmult(p2, q2, s2) {
      var b2, i2;
      set25519(p2[0], gf0);
      set25519(p2[1], gf1);
      set25519(p2[2], gf1);
      set25519(p2[3], gf0);
      for (i2 = 255; i2 >= 0; --i2) {
        b2 = s2[i2 / 8 | 0] >> (i2 & 7) & 1;
        cswap(p2, q2, b2);
        add(q2, p2);
        add(p2, p2);
        cswap(p2, q2, b2);
      }
    }
    function scalarbase(p2, s2) {
      var q2 = [gf(), gf(), gf(), gf()];
      set25519(q2[0], X2);
      set25519(q2[1], Y2);
      set25519(q2[2], gf1);
      M2(q2[3], X2, Y2);
      scalarmult(p2, q2, s2);
    }
    function set25519(r2, a2) {
      var i2;
      for (i2 = 0; i2 < 16; i2++) {
        r2[i2] = a2[i2] | 0;
      }
    }
    function inv25519(o2, i2) {
      var c2 = gf();
      var a2;
      for (a2 = 0; a2 < 16; ++a2) {
        c2[a2] = i2[a2];
      }
      for (a2 = 253; a2 >= 0; --a2) {
        S2(c2, c2);
        if (a2 !== 2 && a2 !== 4) {
          M2(c2, c2, i2);
        }
      }
      for (a2 = 0; a2 < 16; ++a2) {
        o2[a2] = c2[a2];
      }
    }
    function car25519(o2) {
      var i2, v2, c2 = 1;
      for (i2 = 0; i2 < 16; ++i2) {
        v2 = o2[i2] + c2 + 65535;
        c2 = Math.floor(v2 / 65536);
        o2[i2] = v2 - c2 * 65536;
      }
      o2[0] += c2 - 1 + 37 * (c2 - 1);
    }
    function sel25519(p2, q2, b2) {
      var t2, c2 = ~(b2 - 1);
      for (var i2 = 0; i2 < 16; ++i2) {
        t2 = c2 & (p2[i2] ^ q2[i2]);
        p2[i2] ^= t2;
        q2[i2] ^= t2;
      }
    }
    function gf(init) {
      var i2, r2 = new Float64Array(16);
      if (init) {
        for (i2 = 0; i2 < init.length; ++i2) {
          r2[i2] = init[i2];
        }
      }
      return r2;
    }
    function A2(o2, a2, b2) {
      for (var i2 = 0; i2 < 16; ++i2) {
        o2[i2] = a2[i2] + b2[i2];
      }
    }
    function Z2(o2, a2, b2) {
      for (var i2 = 0; i2 < 16; ++i2) {
        o2[i2] = a2[i2] - b2[i2];
      }
    }
    function S2(o2, a2) {
      M2(o2, a2, a2);
    }
    function M2(o2, a2, b2) {
      var v2, c2, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b2[0], b1 = b2[1], b22 = b2[2], b3 = b2[3], b4 = b2[4], b5 = b2[5], b6 = b2[6], b7 = b2[7], b8 = b2[8], b9 = b2[9], b10 = b2[10], b11 = b2[11], b12 = b2[12], b13 = b2[13], b14 = b2[14], b15 = b2[15];
      v2 = a2[0];
      t0 += v2 * b0;
      t1 += v2 * b1;
      t2 += v2 * b22;
      t3 += v2 * b3;
      t4 += v2 * b4;
      t5 += v2 * b5;
      t6 += v2 * b6;
      t7 += v2 * b7;
      t8 += v2 * b8;
      t9 += v2 * b9;
      t10 += v2 * b10;
      t11 += v2 * b11;
      t12 += v2 * b12;
      t13 += v2 * b13;
      t14 += v2 * b14;
      t15 += v2 * b15;
      v2 = a2[1];
      t1 += v2 * b0;
      t2 += v2 * b1;
      t3 += v2 * b22;
      t4 += v2 * b3;
      t5 += v2 * b4;
      t6 += v2 * b5;
      t7 += v2 * b6;
      t8 += v2 * b7;
      t9 += v2 * b8;
      t10 += v2 * b9;
      t11 += v2 * b10;
      t12 += v2 * b11;
      t13 += v2 * b12;
      t14 += v2 * b13;
      t15 += v2 * b14;
      t16 += v2 * b15;
      v2 = a2[2];
      t2 += v2 * b0;
      t3 += v2 * b1;
      t4 += v2 * b22;
      t5 += v2 * b3;
      t6 += v2 * b4;
      t7 += v2 * b5;
      t8 += v2 * b6;
      t9 += v2 * b7;
      t10 += v2 * b8;
      t11 += v2 * b9;
      t12 += v2 * b10;
      t13 += v2 * b11;
      t14 += v2 * b12;
      t15 += v2 * b13;
      t16 += v2 * b14;
      t17 += v2 * b15;
      v2 = a2[3];
      t3 += v2 * b0;
      t4 += v2 * b1;
      t5 += v2 * b22;
      t6 += v2 * b3;
      t7 += v2 * b4;
      t8 += v2 * b5;
      t9 += v2 * b6;
      t10 += v2 * b7;
      t11 += v2 * b8;
      t12 += v2 * b9;
      t13 += v2 * b10;
      t14 += v2 * b11;
      t15 += v2 * b12;
      t16 += v2 * b13;
      t17 += v2 * b14;
      t18 += v2 * b15;
      v2 = a2[4];
      t4 += v2 * b0;
      t5 += v2 * b1;
      t6 += v2 * b22;
      t7 += v2 * b3;
      t8 += v2 * b4;
      t9 += v2 * b5;
      t10 += v2 * b6;
      t11 += v2 * b7;
      t12 += v2 * b8;
      t13 += v2 * b9;
      t14 += v2 * b10;
      t15 += v2 * b11;
      t16 += v2 * b12;
      t17 += v2 * b13;
      t18 += v2 * b14;
      t19 += v2 * b15;
      v2 = a2[5];
      t5 += v2 * b0;
      t6 += v2 * b1;
      t7 += v2 * b22;
      t8 += v2 * b3;
      t9 += v2 * b4;
      t10 += v2 * b5;
      t11 += v2 * b6;
      t12 += v2 * b7;
      t13 += v2 * b8;
      t14 += v2 * b9;
      t15 += v2 * b10;
      t16 += v2 * b11;
      t17 += v2 * b12;
      t18 += v2 * b13;
      t19 += v2 * b14;
      t20 += v2 * b15;
      v2 = a2[6];
      t6 += v2 * b0;
      t7 += v2 * b1;
      t8 += v2 * b22;
      t9 += v2 * b3;
      t10 += v2 * b4;
      t11 += v2 * b5;
      t12 += v2 * b6;
      t13 += v2 * b7;
      t14 += v2 * b8;
      t15 += v2 * b9;
      t16 += v2 * b10;
      t17 += v2 * b11;
      t18 += v2 * b12;
      t19 += v2 * b13;
      t20 += v2 * b14;
      t21 += v2 * b15;
      v2 = a2[7];
      t7 += v2 * b0;
      t8 += v2 * b1;
      t9 += v2 * b22;
      t10 += v2 * b3;
      t11 += v2 * b4;
      t12 += v2 * b5;
      t13 += v2 * b6;
      t14 += v2 * b7;
      t15 += v2 * b8;
      t16 += v2 * b9;
      t17 += v2 * b10;
      t18 += v2 * b11;
      t19 += v2 * b12;
      t20 += v2 * b13;
      t21 += v2 * b14;
      t22 += v2 * b15;
      v2 = a2[8];
      t8 += v2 * b0;
      t9 += v2 * b1;
      t10 += v2 * b22;
      t11 += v2 * b3;
      t12 += v2 * b4;
      t13 += v2 * b5;
      t14 += v2 * b6;
      t15 += v2 * b7;
      t16 += v2 * b8;
      t17 += v2 * b9;
      t18 += v2 * b10;
      t19 += v2 * b11;
      t20 += v2 * b12;
      t21 += v2 * b13;
      t22 += v2 * b14;
      t23 += v2 * b15;
      v2 = a2[9];
      t9 += v2 * b0;
      t10 += v2 * b1;
      t11 += v2 * b22;
      t12 += v2 * b3;
      t13 += v2 * b4;
      t14 += v2 * b5;
      t15 += v2 * b6;
      t16 += v2 * b7;
      t17 += v2 * b8;
      t18 += v2 * b9;
      t19 += v2 * b10;
      t20 += v2 * b11;
      t21 += v2 * b12;
      t22 += v2 * b13;
      t23 += v2 * b14;
      t24 += v2 * b15;
      v2 = a2[10];
      t10 += v2 * b0;
      t11 += v2 * b1;
      t12 += v2 * b22;
      t13 += v2 * b3;
      t14 += v2 * b4;
      t15 += v2 * b5;
      t16 += v2 * b6;
      t17 += v2 * b7;
      t18 += v2 * b8;
      t19 += v2 * b9;
      t20 += v2 * b10;
      t21 += v2 * b11;
      t22 += v2 * b12;
      t23 += v2 * b13;
      t24 += v2 * b14;
      t25 += v2 * b15;
      v2 = a2[11];
      t11 += v2 * b0;
      t12 += v2 * b1;
      t13 += v2 * b22;
      t14 += v2 * b3;
      t15 += v2 * b4;
      t16 += v2 * b5;
      t17 += v2 * b6;
      t18 += v2 * b7;
      t19 += v2 * b8;
      t20 += v2 * b9;
      t21 += v2 * b10;
      t22 += v2 * b11;
      t23 += v2 * b12;
      t24 += v2 * b13;
      t25 += v2 * b14;
      t26 += v2 * b15;
      v2 = a2[12];
      t12 += v2 * b0;
      t13 += v2 * b1;
      t14 += v2 * b22;
      t15 += v2 * b3;
      t16 += v2 * b4;
      t17 += v2 * b5;
      t18 += v2 * b6;
      t19 += v2 * b7;
      t20 += v2 * b8;
      t21 += v2 * b9;
      t22 += v2 * b10;
      t23 += v2 * b11;
      t24 += v2 * b12;
      t25 += v2 * b13;
      t26 += v2 * b14;
      t27 += v2 * b15;
      v2 = a2[13];
      t13 += v2 * b0;
      t14 += v2 * b1;
      t15 += v2 * b22;
      t16 += v2 * b3;
      t17 += v2 * b4;
      t18 += v2 * b5;
      t19 += v2 * b6;
      t20 += v2 * b7;
      t21 += v2 * b8;
      t22 += v2 * b9;
      t23 += v2 * b10;
      t24 += v2 * b11;
      t25 += v2 * b12;
      t26 += v2 * b13;
      t27 += v2 * b14;
      t28 += v2 * b15;
      v2 = a2[14];
      t14 += v2 * b0;
      t15 += v2 * b1;
      t16 += v2 * b22;
      t17 += v2 * b3;
      t18 += v2 * b4;
      t19 += v2 * b5;
      t20 += v2 * b6;
      t21 += v2 * b7;
      t22 += v2 * b8;
      t23 += v2 * b9;
      t24 += v2 * b10;
      t25 += v2 * b11;
      t26 += v2 * b12;
      t27 += v2 * b13;
      t28 += v2 * b14;
      t29 += v2 * b15;
      v2 = a2[15];
      t15 += v2 * b0;
      t16 += v2 * b1;
      t17 += v2 * b22;
      t18 += v2 * b3;
      t19 += v2 * b4;
      t20 += v2 * b5;
      t21 += v2 * b6;
      t22 += v2 * b7;
      t23 += v2 * b8;
      t24 += v2 * b9;
      t25 += v2 * b10;
      t26 += v2 * b11;
      t27 += v2 * b12;
      t28 += v2 * b13;
      t29 += v2 * b14;
      t30 += v2 * b15;
      t0 += 38 * t16;
      t1 += 38 * t17;
      t2 += 38 * t18;
      t3 += 38 * t19;
      t4 += 38 * t20;
      t5 += 38 * t21;
      t6 += 38 * t22;
      t7 += 38 * t23;
      t8 += 38 * t24;
      t9 += 38 * t25;
      t10 += 38 * t26;
      t11 += 38 * t27;
      t12 += 38 * t28;
      t13 += 38 * t29;
      t14 += 38 * t30;
      c2 = 1;
      v2 = t0 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t0 = v2 - c2 * 65536;
      v2 = t1 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t1 = v2 - c2 * 65536;
      v2 = t2 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t2 = v2 - c2 * 65536;
      v2 = t3 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t3 = v2 - c2 * 65536;
      v2 = t4 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t4 = v2 - c2 * 65536;
      v2 = t5 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t5 = v2 - c2 * 65536;
      v2 = t6 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t6 = v2 - c2 * 65536;
      v2 = t7 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t7 = v2 - c2 * 65536;
      v2 = t8 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t8 = v2 - c2 * 65536;
      v2 = t9 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t9 = v2 - c2 * 65536;
      v2 = t10 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t10 = v2 - c2 * 65536;
      v2 = t11 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t11 = v2 - c2 * 65536;
      v2 = t12 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t12 = v2 - c2 * 65536;
      v2 = t13 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t13 = v2 - c2 * 65536;
      v2 = t14 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t14 = v2 - c2 * 65536;
      v2 = t15 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t15 = v2 - c2 * 65536;
      t0 += c2 - 1 + 37 * (c2 - 1);
      c2 = 1;
      v2 = t0 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t0 = v2 - c2 * 65536;
      v2 = t1 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t1 = v2 - c2 * 65536;
      v2 = t2 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t2 = v2 - c2 * 65536;
      v2 = t3 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t3 = v2 - c2 * 65536;
      v2 = t4 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t4 = v2 - c2 * 65536;
      v2 = t5 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t5 = v2 - c2 * 65536;
      v2 = t6 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t6 = v2 - c2 * 65536;
      v2 = t7 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t7 = v2 - c2 * 65536;
      v2 = t8 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t8 = v2 - c2 * 65536;
      v2 = t9 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t9 = v2 - c2 * 65536;
      v2 = t10 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t10 = v2 - c2 * 65536;
      v2 = t11 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t11 = v2 - c2 * 65536;
      v2 = t12 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t12 = v2 - c2 * 65536;
      v2 = t13 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t13 = v2 - c2 * 65536;
      v2 = t14 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t14 = v2 - c2 * 65536;
      v2 = t15 + c2 + 65535;
      c2 = Math.floor(v2 / 65536);
      t15 = v2 - c2 * 65536;
      t0 += c2 - 1 + 37 * (c2 - 1);
      o2[0] = t0;
      o2[1] = t1;
      o2[2] = t2;
      o2[3] = t3;
      o2[4] = t4;
      o2[5] = t5;
      o2[6] = t6;
      o2[7] = t7;
      o2[8] = t8;
      o2[9] = t9;
      o2[10] = t10;
      o2[11] = t11;
      o2[12] = t12;
      o2[13] = t13;
      o2[14] = t14;
      o2[15] = t15;
    }
  }
});

// node_modules/node-forge/lib/kem.js
var require_kem = __commonJS({
  "node_modules/node-forge/lib/kem.js"(exports2, module2) {
    var forge = require_forge();
    require_util();
    require_random();
    require_jsbn();
    module2.exports = forge.kem = forge.kem || {};
    var BigInteger = forge.jsbn.BigInteger;
    forge.kem.rsa = {};
    forge.kem.rsa.create = function(kdf, options) {
      options = options || {};
      var prng = options.prng || forge.random;
      var kem = {};
      kem.encrypt = function(publicKey, keyLength) {
        var byteLength = Math.ceil(publicKey.n.bitLength() / 8);
        var r2;
        do {
          r2 = new BigInteger(
            forge.util.bytesToHex(prng.getBytesSync(byteLength)),
            16
          ).mod(publicKey.n);
        } while (r2.compareTo(BigInteger.ONE) <= 0);
        r2 = forge.util.hexToBytes(r2.toString(16));
        var zeros = byteLength - r2.length;
        if (zeros > 0) {
          r2 = forge.util.fillString(String.fromCharCode(0), zeros) + r2;
        }
        var encapsulation = publicKey.encrypt(r2, "NONE");
        var key = kdf.generate(r2, keyLength);
        return { encapsulation, key };
      };
      kem.decrypt = function(privateKey, encapsulation, keyLength) {
        var r2 = privateKey.decrypt(encapsulation, "NONE");
        return kdf.generate(r2, keyLength);
      };
      return kem;
    };
    forge.kem.kdf1 = function(md, digestLength) {
      _createKDF(this, md, 0, digestLength || md.digestLength);
    };
    forge.kem.kdf2 = function(md, digestLength) {
      _createKDF(this, md, 1, digestLength || md.digestLength);
    };
    function _createKDF(kdf, md, counterStart, digestLength) {
      kdf.generate = function(x2, length) {
        var key = new forge.util.ByteBuffer();
        var k2 = Math.ceil(length / digestLength) + counterStart;
        var c2 = new forge.util.ByteBuffer();
        for (var i2 = counterStart; i2 < k2; ++i2) {
          c2.putInt32(i2);
          md.start();
          md.update(x2 + c2.getBytes());
          var hash = md.digest();
          key.putBytes(hash.getBytes(digestLength));
        }
        key.truncate(key.length() - length);
        return key.getBytes();
      };
    }
  }
});

// node_modules/node-forge/lib/log.js
var require_log = __commonJS({
  "node_modules/node-forge/lib/log.js"(exports2, module2) {
    var forge = require_forge();
    require_util();
    module2.exports = forge.log = forge.log || {};
    forge.log.levels = [
      "none",
      "error",
      "warning",
      "info",
      "debug",
      "verbose",
      "max"
    ];
    var sLevelInfo = {};
    var sLoggers = [];
    var sConsoleLogger = null;
    forge.log.LEVEL_LOCKED = 1 << 1;
    forge.log.NO_LEVEL_CHECK = 1 << 2;
    forge.log.INTERPOLATE = 1 << 3;
    for (i2 = 0; i2 < forge.log.levels.length; ++i2) {
      level = forge.log.levels[i2];
      sLevelInfo[level] = {
        index: i2,
        name: level.toUpperCase()
      };
    }
    var level;
    var i2;
    forge.log.logMessage = function(message) {
      var messageLevelIndex = sLevelInfo[message.level].index;
      for (var i3 = 0; i3 < sLoggers.length; ++i3) {
        var logger2 = sLoggers[i3];
        if (logger2.flags & forge.log.NO_LEVEL_CHECK) {
          logger2.f(message);
        } else {
          var loggerLevelIndex = sLevelInfo[logger2.level].index;
          if (messageLevelIndex <= loggerLevelIndex) {
            logger2.f(logger2, message);
          }
        }
      }
    };
    forge.log.prepareStandard = function(message) {
      if (!("standard" in message)) {
        message.standard = sLevelInfo[message.level].name + //' ' + +message.timestamp +
        " [" + message.category + "] " + message.message;
      }
    };
    forge.log.prepareFull = function(message) {
      if (!("full" in message)) {
        var args = [message.message];
        args = args.concat([]);
        message.full = forge.util.format.apply(this, args);
      }
    };
    forge.log.prepareStandardFull = function(message) {
      if (!("standardFull" in message)) {
        forge.log.prepareStandard(message);
        message.standardFull = message.standard;
      }
    };
    if (true) {
      levels = ["error", "warning", "info", "debug", "verbose"];
      for (i2 = 0; i2 < levels.length; ++i2) {
        (function(level2) {
          forge.log[level2] = function(category, message) {
            var args = Array.prototype.slice.call(arguments).slice(2);
            var msg = {
              timestamp: /* @__PURE__ */ new Date(),
              level: level2,
              category,
              message,
              "arguments": args
              /*standard*/
              /*full*/
              /*fullMessage*/
            };
            forge.log.logMessage(msg);
          };
        })(levels[i2]);
      }
    }
    var levels;
    var i2;
    forge.log.makeLogger = function(logFunction) {
      var logger2 = {
        flags: 0,
        f: logFunction
      };
      forge.log.setLevel(logger2, "none");
      return logger2;
    };
    forge.log.setLevel = function(logger2, level2) {
      var rval = false;
      if (logger2 && !(logger2.flags & forge.log.LEVEL_LOCKED)) {
        for (var i3 = 0; i3 < forge.log.levels.length; ++i3) {
          var aValidLevel = forge.log.levels[i3];
          if (level2 == aValidLevel) {
            logger2.level = level2;
            rval = true;
            break;
          }
        }
      }
      return rval;
    };
    forge.log.lock = function(logger2, lock2) {
      if (typeof lock2 === "undefined" || lock2) {
        logger2.flags |= forge.log.LEVEL_LOCKED;
      } else {
        logger2.flags &= ~forge.log.LEVEL_LOCKED;
      }
    };
    forge.log.addLogger = function(logger2) {
      sLoggers.push(logger2);
    };
    if (typeof console !== "undefined" && "log" in console) {
      if (console.error && console.warn && console.info && console.debug) {
        levelHandlers = {
          error: console.error,
          warning: console.warn,
          info: console.info,
          debug: console.debug,
          verbose: console.debug
        };
        f2 = function(logger2, message) {
          forge.log.prepareStandard(message);
          var handler = levelHandlers[message.level];
          var args = [message.standard];
          args = args.concat(message["arguments"].slice());
          handler.apply(console, args);
        };
        logger = forge.log.makeLogger(f2);
      } else {
        f2 = function(logger2, message) {
          forge.log.prepareStandardFull(message);
          console.log(message.standardFull);
        };
        logger = forge.log.makeLogger(f2);
      }
      forge.log.setLevel(logger, "debug");
      forge.log.addLogger(logger);
      sConsoleLogger = logger;
    } else {
      console = {
        log: function() {
        }
      };
    }
    var logger;
    var levelHandlers;
    var f2;
    if (sConsoleLogger !== null && typeof window !== "undefined" && window.location) {
      query = new URL(window.location.href).searchParams;
      if (query.has("console.level")) {
        forge.log.setLevel(
          sConsoleLogger,
          query.get("console.level").slice(-1)[0]
        );
      }
      if (query.has("console.lock")) {
        lock = query.get("console.lock").slice(-1)[0];
        if (lock == "true") {
          forge.log.lock(sConsoleLogger);
        }
      }
    }
    var query;
    var lock;
    forge.log.consoleLogger = sConsoleLogger;
  }
});

// node_modules/node-forge/lib/md.all.js
var require_md_all = __commonJS({
  "node_modules/node-forge/lib/md.all.js"(exports2, module2) {
    module2.exports = require_md();
    require_md5();
    require_sha1();
    require_sha256();
    require_sha512();
  }
});

// node_modules/node-forge/lib/pkcs7.js
var require_pkcs7 = __commonJS({
  "node_modules/node-forge/lib/pkcs7.js"(exports2, module2) {
    var forge = require_forge();
    require_aes();
    require_asn1();
    require_des();
    require_oids();
    require_pem();
    require_pkcs7asn1();
    require_random();
    require_util();
    require_x509();
    var asn1 = forge.asn1;
    var p7 = module2.exports = forge.pkcs7 = forge.pkcs7 || {};
    p7.messageFromPem = function(pem) {
      var msg = forge.pem.decode(pem)[0];
      if (msg.type !== "PKCS7") {
        var error = new Error('Could not convert PKCS#7 message from PEM; PEM header type is not "PKCS#7".');
        error.headerType = msg.type;
        throw error;
      }
      if (msg.procType && msg.procType.type === "ENCRYPTED") {
        throw new Error("Could not convert PKCS#7 message from PEM; PEM is encrypted.");
      }
      var obj = asn1.fromDer(msg.body);
      return p7.messageFromAsn1(obj);
    };
    p7.messageToPem = function(msg, maxline) {
      var pemObj = {
        type: "PKCS7",
        body: asn1.toDer(msg.toAsn1()).getBytes()
      };
      return forge.pem.encode(pemObj, { maxline });
    };
    p7.messageFromAsn1 = function(obj) {
      var capture = {};
      var errors = [];
      if (!asn1.validate(obj, p7.asn1.contentInfoValidator, capture, errors)) {
        var error = new Error("Cannot read PKCS#7 message. ASN.1 object is not an PKCS#7 ContentInfo.");
        error.errors = errors;
        throw error;
      }
      var contentType = asn1.derToOid(capture.contentType);
      var msg;
      switch (contentType) {
        case forge.pki.oids.envelopedData:
          msg = p7.createEnvelopedData();
          break;
        case forge.pki.oids.encryptedData:
          msg = p7.createEncryptedData();
          break;
        case forge.pki.oids.signedData:
          msg = p7.createSignedData();
          break;
        default:
          throw new Error("Cannot read PKCS#7 message. ContentType with OID " + contentType + " is not (yet) supported.");
      }
      msg.fromAsn1(capture.content.value[0]);
      return msg;
    };
    p7.createSignedData = function() {
      var msg = null;
      msg = {
        type: forge.pki.oids.signedData,
        version: 1,
        certificates: [],
        crls: [],
        // TODO: add json-formatted signer stuff here?
        signers: [],
        // populated during sign()
        digestAlgorithmIdentifiers: [],
        contentInfo: null,
        signerInfos: [],
        fromAsn1: function(obj) {
          _fromAsn1(msg, obj, p7.asn1.signedDataValidator);
          msg.certificates = [];
          msg.crls = [];
          msg.digestAlgorithmIdentifiers = [];
          msg.contentInfo = null;
          msg.signerInfos = [];
          if (msg.rawCapture.certificates) {
            var certs = msg.rawCapture.certificates.value;
            for (var i2 = 0; i2 < certs.length; ++i2) {
              msg.certificates.push(forge.pki.certificateFromAsn1(certs[i2]));
            }
          }
        },
        toAsn1: function() {
          if (!msg.contentInfo) {
            msg.sign();
          }
          var certs = [];
          for (var i2 = 0; i2 < msg.certificates.length; ++i2) {
            certs.push(forge.pki.certificateToAsn1(msg.certificates[i2]));
          }
          var crls = [];
          var signedData = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
              // Version
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.INTEGER,
                false,
                asn1.integerToDer(msg.version).getBytes()
              ),
              // DigestAlgorithmIdentifiers
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.SET,
                true,
                msg.digestAlgorithmIdentifiers
              ),
              // ContentInfo
              msg.contentInfo
            ])
          ]);
          if (certs.length > 0) {
            signedData.value[0].value.push(
              asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, certs)
            );
          }
          if (crls.length > 0) {
            signedData.value[0].value.push(
              asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, crls)
            );
          }
          signedData.value[0].value.push(
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.SET,
              true,
              msg.signerInfos
            )
          );
          return asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.SEQUENCE,
            true,
            [
              // ContentType
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.OID,
                false,
                asn1.oidToDer(msg.type).getBytes()
              ),
              // [0] SignedData
              signedData
            ]
          );
        },
        /**
         * Add (another) entity to list of signers.
         *
         * Note: If authenticatedAttributes are provided, then, per RFC 2315,
         * they must include at least two attributes: content type and
         * message digest. The message digest attribute value will be
         * auto-calculated during signing and will be ignored if provided.
         *
         * Here's an example of providing these two attributes:
         *
         * forge.pkcs7.createSignedData();
         * p7.addSigner({
         *   issuer: cert.issuer.attributes,
         *   serialNumber: cert.serialNumber,
         *   key: privateKey,
         *   digestAlgorithm: forge.pki.oids.sha1,
         *   authenticatedAttributes: [{
         *     type: forge.pki.oids.contentType,
         *     value: forge.pki.oids.data
         *   }, {
         *     type: forge.pki.oids.messageDigest
         *   }]
         * });
         *
         * TODO: Support [subjectKeyIdentifier] as signer's ID.
         *
         * @param signer the signer information:
         *          key the signer's private key.
         *          [certificate] a certificate containing the public key
         *            associated with the signer's private key; use this option as
         *            an alternative to specifying signer.issuer and
         *            signer.serialNumber.
         *          [issuer] the issuer attributes (eg: cert.issuer.attributes).
         *          [serialNumber] the signer's certificate's serial number in
         *           hexadecimal (eg: cert.serialNumber).
         *          [digestAlgorithm] the message digest OID, as a string, to use
         *            (eg: forge.pki.oids.sha1).
         *          [authenticatedAttributes] an optional array of attributes
         *            to also sign along with the content.
         */
        addSigner: function(signer) {
          var issuer = signer.issuer;
          var serialNumber = signer.serialNumber;
          if (signer.certificate) {
            var cert = signer.certificate;
            if (typeof cert === "string") {
              cert = forge.pki.certificateFromPem(cert);
            }
            issuer = cert.issuer.attributes;
            serialNumber = cert.serialNumber;
          }
          var key = signer.key;
          if (!key) {
            throw new Error(
              "Could not add PKCS#7 signer; no private key specified."
            );
          }
          if (typeof key === "string") {
            key = forge.pki.privateKeyFromPem(key);
          }
          var digestAlgorithm = signer.digestAlgorithm || forge.pki.oids.sha1;
          switch (digestAlgorithm) {
            case forge.pki.oids.sha1:
            case forge.pki.oids.sha256:
            case forge.pki.oids.sha384:
            case forge.pki.oids.sha512:
            case forge.pki.oids.md5:
              break;
            default:
              throw new Error(
                "Could not add PKCS#7 signer; unknown message digest algorithm: " + digestAlgorithm
              );
          }
          var authenticatedAttributes = signer.authenticatedAttributes || [];
          if (authenticatedAttributes.length > 0) {
            var contentType = false;
            var messageDigest = false;
            for (var i2 = 0; i2 < authenticatedAttributes.length; ++i2) {
              var attr = authenticatedAttributes[i2];
              if (!contentType && attr.type === forge.pki.oids.contentType) {
                contentType = true;
                if (messageDigest) {
                  break;
                }
                continue;
              }
              if (!messageDigest && attr.type === forge.pki.oids.messageDigest) {
                messageDigest = true;
                if (contentType) {
                  break;
                }
                continue;
              }
            }
            if (!contentType || !messageDigest) {
              throw new Error("Invalid signer.authenticatedAttributes. If signer.authenticatedAttributes is specified, then it must contain at least two attributes, PKCS #9 content-type and PKCS #9 message-digest.");
            }
          }
          msg.signers.push({
            key,
            version: 1,
            issuer,
            serialNumber,
            digestAlgorithm,
            signatureAlgorithm: forge.pki.oids.rsaEncryption,
            signature: null,
            authenticatedAttributes,
            unauthenticatedAttributes: []
          });
        },
        /**
         * Signs the content.
         * @param options Options to apply when signing:
         *    [detached] boolean. If signing should be done in detached mode. Defaults to false.
         */
        sign: function(options) {
          options = options || {};
          if (typeof msg.content !== "object" || msg.contentInfo === null) {
            msg.contentInfo = asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.SEQUENCE,
              true,
              [
                // ContentType
                asn1.create(
                  asn1.Class.UNIVERSAL,
                  asn1.Type.OID,
                  false,
                  asn1.oidToDer(forge.pki.oids.data).getBytes()
                )
              ]
            );
            if ("content" in msg) {
              var content;
              if (msg.content instanceof forge.util.ByteBuffer) {
                content = msg.content.bytes();
              } else if (typeof msg.content === "string") {
                content = forge.util.encodeUtf8(msg.content);
              }
              if (options.detached) {
                msg.detachedContent = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, content);
              } else {
                msg.contentInfo.value.push(
                  // [0] EXPLICIT content
                  asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
                    asn1.create(
                      asn1.Class.UNIVERSAL,
                      asn1.Type.OCTETSTRING,
                      false,
                      content
                    )
                  ])
                );
              }
            }
          }
          if (msg.signers.length === 0) {
            return;
          }
          var mds = addDigestAlgorithmIds();
          addSignerInfos(mds);
        },
        verify: function() {
          throw new Error("PKCS#7 signature verification not yet implemented.");
        },
        /**
         * Add a certificate.
         *
         * @param cert the certificate to add.
         */
        addCertificate: function(cert) {
          if (typeof cert === "string") {
            cert = forge.pki.certificateFromPem(cert);
          }
          msg.certificates.push(cert);
        },
        /**
         * Add a certificate revokation list.
         *
         * @param crl the certificate revokation list to add.
         */
        addCertificateRevokationList: function(crl) {
          throw new Error("PKCS#7 CRL support not yet implemented.");
        }
      };
      return msg;
      function addDigestAlgorithmIds() {
        var mds = {};
        for (var i2 = 0; i2 < msg.signers.length; ++i2) {
          var signer = msg.signers[i2];
          var oid = signer.digestAlgorithm;
          if (!(oid in mds)) {
            mds[oid] = forge.md[forge.pki.oids[oid]].create();
          }
          if (signer.authenticatedAttributes.length === 0) {
            signer.md = mds[oid];
          } else {
            signer.md = forge.md[forge.pki.oids[oid]].create();
          }
        }
        msg.digestAlgorithmIdentifiers = [];
        for (var oid in mds) {
          msg.digestAlgorithmIdentifiers.push(
            // AlgorithmIdentifier
            asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
              // algorithm
              asn1.create(
                asn1.Class.UNIVERSAL,
                asn1.Type.OID,
                false,
                asn1.oidToDer(oid).getBytes()
              ),
              // parameters (null)
              asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")
            ])
          );
        }
        return mds;
      }
      function addSignerInfos(mds) {
        var content;
        if (msg.detachedContent) {
          content = msg.detachedContent;
        } else {
          content = msg.contentInfo.value[1];
          content = content.value[0];
        }
        if (!content) {
          throw new Error(
            "Could not sign PKCS#7 message; there is no content to sign."
          );
        }
        var contentType = asn1.derToOid(msg.contentInfo.value[0].value);
        var bytes = asn1.toDer(content);
        bytes.getByte();
        asn1.getBerValueLength(bytes);
        bytes = bytes.getBytes();
        for (var oid in mds) {
          mds[oid].start().update(bytes);
        }
        var signingTime = /* @__PURE__ */ new Date();
        for (var i2 = 0; i2 < msg.signers.length; ++i2) {
          var signer = msg.signers[i2];
          if (signer.authenticatedAttributes.length === 0) {
            if (contentType !== forge.pki.oids.data) {
              throw new Error(
                "Invalid signer; authenticatedAttributes must be present when the ContentInfo content type is not PKCS#7 Data."
              );
            }
          } else {
            signer.authenticatedAttributesAsn1 = asn1.create(
              asn1.Class.CONTEXT_SPECIFIC,
              0,
              true,
              []
            );
            var attrsAsn1 = asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.SET,
              true,
              []
            );
            for (var ai = 0; ai < signer.authenticatedAttributes.length; ++ai) {
              var attr = signer.authenticatedAttributes[ai];
              if (attr.type === forge.pki.oids.messageDigest) {
                attr.value = mds[signer.digestAlgorithm].digest();
              } else if (attr.type === forge.pki.oids.signingTime) {
                if (!attr.value) {
                  attr.value = signingTime;
                }
              }
              attrsAsn1.value.push(_attributeToAsn1(attr));
              signer.authenticatedAttributesAsn1.value.push(_attributeToAsn1(attr));
            }
            bytes = asn1.toDer(attrsAsn1).getBytes();
            signer.md.start().update(bytes);
          }
          signer.signature = signer.key.sign(signer.md, "RSASSA-PKCS1-V1_5");
        }
        msg.signerInfos = _signersToAsn1(msg.signers);
      }
    };
    p7.createEncryptedData = function() {
      var msg = null;
      msg = {
        type: forge.pki.oids.encryptedData,
        version: 0,
        encryptedContent: {
          algorithm: forge.pki.oids["aes256-CBC"]
        },
        /**
         * Reads an EncryptedData content block (in ASN.1 format)
         *
         * @param obj The ASN.1 representation of the EncryptedData content block
         */
        fromAsn1: function(obj) {
          _fromAsn1(msg, obj, p7.asn1.encryptedDataValidator);
        },
        /**
         * Decrypt encrypted content
         *
         * @param key The (symmetric) key as a byte buffer
         */
        decrypt: function(key) {
          if (key !== void 0) {
            msg.encryptedContent.key = key;
          }
          _decryptContent(msg);
        }
      };
      return msg;
    };
    p7.createEnvelopedData = function() {
      var msg = null;
      msg = {
        type: forge.pki.oids.envelopedData,
        version: 0,
        recipients: [],
        encryptedContent: {
          algorithm: forge.pki.oids["aes256-CBC"]
        },
        /**
         * Reads an EnvelopedData content block (in ASN.1 format)
         *
         * @param obj the ASN.1 representation of the EnvelopedData content block.
         */
        fromAsn1: function(obj) {
          var capture = _fromAsn1(msg, obj, p7.asn1.envelopedDataValidator);
          msg.recipients = _recipientsFromAsn1(capture.recipientInfos.value);
        },
        toAsn1: function() {
          return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
            // ContentType
            asn1.create(
              asn1.Class.UNIVERSAL,
              asn1.Type.OID,
              false,
              asn1.oidToDer(msg.type).getBytes()
            ),
            // [0] EnvelopedData
            asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
              asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
                // Version
                asn1.create(
                  asn1.Class.UNIVERSAL,
                  asn1.Type.INTEGER,
                  false,
                  asn1.integerToDer(msg.version).getBytes()
                ),
                // RecipientInfos
                asn1.create(
                  asn1.Class.UNIVERSAL,
                  asn1.Type.SET,
                  true,
                  _recipientsToAsn1(msg.recipients)
                ),
                // EncryptedContentInfo
                asn1.create(
                  asn1.Class.UNIVERSAL,
                  asn1.Type.SEQUENCE,
                  true,
                  _encryptedContentToAsn1(msg.encryptedContent)
                )
              ])
            ])
          ]);
        },
        /**
         * Find recipient by X.509 certificate's issuer.
         *
         * @param cert the certificate with the issuer to look for.
         *
         * @return the recipient object.
         */
        findRecipient: function(cert) {
          var sAttr = cert.issuer.attributes;
          for (var i2 = 0; i2 < msg.recipients.length; ++i2) {
            var r2 = msg.recipients[i2];
            var rAttr = r2.issuer;
            if (r2.serialNumber !== cert.serialNumber) {
              continue;
            }
            if (rAttr.length !== sAttr.length) {
              continue;
            }
            var match = true;
            for (var j2 = 0; j2 < sAttr.length; ++j2) {
              if (rAttr[j2].type !== sAttr[j2].type || rAttr[j2].value !== sAttr[j2].value) {
                match = false;
                break;
              }
            }
            if (match) {
              return r2;
            }
          }
          return null;
        },
        /**
         * Decrypt enveloped content
         *
         * @param recipient The recipient object related to the private key
         * @param privKey The (RSA) private key object
         */
        decrypt: function(recipient, privKey) {
          if (msg.encryptedContent.key === void 0 && recipient !== void 0 && privKey !== void 0) {
            switch (recipient.encryptedContent.algorithm) {
              case forge.pki.oids.rsaEncryption:
              case forge.pki.oids.desCBC:
                var key = privKey.decrypt(recipient.encryptedContent.content);
                msg.encryptedContent.key = forge.util.createBuffer(key);
                break;
              default:
                throw new Error("Unsupported asymmetric cipher, OID " + recipient.encryptedContent.algorithm);
            }
          }
          _decryptContent(msg);
        },
        /**
         * Add (another) entity to list of recipients.
         *
         * @param cert The certificate of the entity to add.
         */
        addRecipient: function(cert) {
          msg.recipients.push({
            version: 0,
            issuer: cert.issuer.attributes,
            serialNumber: cert.serialNumber,
            encryptedContent: {
              // We simply assume rsaEncryption here, since forge.pki only
              // supports RSA so far.  If the PKI module supports other
              // ciphers one day, we need to modify this one as well.
              algorithm: forge.pki.oids.rsaEncryption,
              key: cert.publicKey
            }
          });
        },
        /**
         * Encrypt enveloped content.
         *
         * This function supports two optional arguments, cipher and key, which
         * can be used to influence symmetric encryption.  Unless cipher is
         * provided, the cipher specified in encryptedContent.algorithm is used
         * (defaults to AES-256-CBC).  If no key is provided, encryptedContent.key
         * is (re-)used.  If that one's not set, a random key will be generated
         * automatically.
         *
         * @param [key] The key to be used for symmetric encryption.
         * @param [cipher] The OID of the symmetric cipher to use.
         */
        encrypt: function(key, cipher) {
          if (msg.encryptedContent.content === void 0) {
            cipher = cipher || msg.encryptedContent.algorithm;
            key = key || msg.encryptedContent.key;
            var keyLen, ivLen, ciphFn;
            switch (cipher) {
              case forge.pki.oids["aes128-CBC"]:
                keyLen = 16;
                ivLen = 16;
                ciphFn = forge.aes.createEncryptionCipher;
                break;
              case forge.pki.oids["aes192-CBC"]:
                keyLen = 24;
                ivLen = 16;
                ciphFn = forge.aes.createEncryptionCipher;
                break;
              case forge.pki.oids["aes256-CBC"]:
                keyLen = 32;
                ivLen = 16;
                ciphFn = forge.aes.createEncryptionCipher;
                break;
              case forge.pki.oids["des-EDE3-CBC"]:
                keyLen = 24;
                ivLen = 8;
                ciphFn = forge.des.createEncryptionCipher;
                break;
              default:
                throw new Error("Unsupported symmetric cipher, OID " + cipher);
            }
            if (key === void 0) {
              key = forge.util.createBuffer(forge.random.getBytes(keyLen));
            } else if (key.length() != keyLen) {
              throw new Error("Symmetric key has wrong length; got " + key.length() + " bytes, expected " + keyLen + ".");
            }
            msg.encryptedContent.algorithm = cipher;
            msg.encryptedContent.key = key;
            msg.encryptedContent.parameter = forge.util.createBuffer(
              forge.random.getBytes(ivLen)
            );
            var ciph = ciphFn(key);
            ciph.start(msg.encryptedContent.parameter.copy());
            ciph.update(msg.content);
            if (!ciph.finish()) {
              throw new Error("Symmetric encryption failed.");
            }
            msg.encryptedContent.content = ciph.output;
          }
          for (var i2 = 0; i2 < msg.recipients.length; ++i2) {
            var recipient = msg.recipients[i2];
            if (recipient.encryptedContent.content !== void 0) {
              continue;
            }
            switch (recipient.encryptedContent.algorithm) {
              case forge.pki.oids.rsaEncryption:
                recipient.encryptedContent.content = recipient.encryptedContent.key.encrypt(
                  msg.encryptedContent.key.data
                );
                break;
              default:
                throw new Error("Unsupported asymmetric cipher, OID " + recipient.encryptedContent.algorithm);
            }
          }
        }
      };
      return msg;
    };
    function _recipientFromAsn1(obj) {
      var capture = {};
      var errors = [];
      if (!asn1.validate(obj, p7.asn1.recipientInfoValidator, capture, errors)) {
        var error = new Error("Cannot read PKCS#7 RecipientInfo. ASN.1 object is not an PKCS#7 RecipientInfo.");
        error.errors = errors;
        throw error;
      }
      return {
        version: capture.version.charCodeAt(0),
        issuer: forge.pki.RDNAttributesAsArray(capture.issuer),
        serialNumber: forge.util.createBuffer(capture.serial).toHex(),
        encryptedContent: {
          algorithm: asn1.derToOid(capture.encAlgorithm),
          parameter: capture.encParameter ? capture.encParameter.value : void 0,
          content: capture.encKey
        }
      };
    }
    function _recipientToAsn1(obj) {
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // Version
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          asn1.integerToDer(obj.version).getBytes()
        ),
        // IssuerAndSerialNumber
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // Name
          forge.pki.distinguishedNameToAsn1({ attributes: obj.issuer }),
          // Serial
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.INTEGER,
            false,
            forge.util.hexToBytes(obj.serialNumber)
          )
        ]),
        // KeyEncryptionAlgorithmIdentifier
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // Algorithm
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OID,
            false,
            asn1.oidToDer(obj.encryptedContent.algorithm).getBytes()
          ),
          // Parameter, force NULL, only RSA supported for now.
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")
        ]),
        // EncryptedKey
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OCTETSTRING,
          false,
          obj.encryptedContent.content
        )
      ]);
    }
    function _recipientsFromAsn1(infos) {
      var ret = [];
      for (var i2 = 0; i2 < infos.length; ++i2) {
        ret.push(_recipientFromAsn1(infos[i2]));
      }
      return ret;
    }
    function _recipientsToAsn1(recipients) {
      var ret = [];
      for (var i2 = 0; i2 < recipients.length; ++i2) {
        ret.push(_recipientToAsn1(recipients[i2]));
      }
      return ret;
    }
    function _signerToAsn1(obj) {
      var rval = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // version
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.INTEGER,
          false,
          asn1.integerToDer(obj.version).getBytes()
        ),
        // issuerAndSerialNumber
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // name
          forge.pki.distinguishedNameToAsn1({ attributes: obj.issuer }),
          // serial
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.INTEGER,
            false,
            forge.util.hexToBytes(obj.serialNumber)
          )
        ]),
        // digestAlgorithm
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // algorithm
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OID,
            false,
            asn1.oidToDer(obj.digestAlgorithm).getBytes()
          ),
          // parameters (null)
          asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")
        ])
      ]);
      if (obj.authenticatedAttributesAsn1) {
        rval.value.push(obj.authenticatedAttributesAsn1);
      }
      rval.value.push(asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // algorithm
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OID,
          false,
          asn1.oidToDer(obj.signatureAlgorithm).getBytes()
        ),
        // parameters (null)
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, "")
      ]));
      rval.value.push(asn1.create(
        asn1.Class.UNIVERSAL,
        asn1.Type.OCTETSTRING,
        false,
        obj.signature
      ));
      if (obj.unauthenticatedAttributes.length > 0) {
        var attrsAsn1 = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 1, true, []);
        for (var i2 = 0; i2 < obj.unauthenticatedAttributes.length; ++i2) {
          var attr = obj.unauthenticatedAttributes[i2];
          attrsAsn1.values.push(_attributeToAsn1(attr));
        }
        rval.value.push(attrsAsn1);
      }
      return rval;
    }
    function _signersToAsn1(signers) {
      var ret = [];
      for (var i2 = 0; i2 < signers.length; ++i2) {
        ret.push(_signerToAsn1(signers[i2]));
      }
      return ret;
    }
    function _attributeToAsn1(attr) {
      var value;
      if (attr.type === forge.pki.oids.contentType) {
        value = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OID,
          false,
          asn1.oidToDer(attr.value).getBytes()
        );
      } else if (attr.type === forge.pki.oids.messageDigest) {
        value = asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OCTETSTRING,
          false,
          attr.value.bytes()
        );
      } else if (attr.type === forge.pki.oids.signingTime) {
        var jan_1_1950 = /* @__PURE__ */ new Date("1950-01-01T00:00:00Z");
        var jan_1_2050 = /* @__PURE__ */ new Date("2050-01-01T00:00:00Z");
        var date = attr.value;
        if (typeof date === "string") {
          var timestamp = Date.parse(date);
          if (!isNaN(timestamp)) {
            date = new Date(timestamp);
          } else if (date.length === 13) {
            date = asn1.utcTimeToDate(date);
          } else {
            date = asn1.generalizedTimeToDate(date);
          }
        }
        if (date >= jan_1_1950 && date < jan_1_2050) {
          value = asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.UTCTIME,
            false,
            asn1.dateToUtcTime(date)
          );
        } else {
          value = asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.GENERALIZEDTIME,
            false,
            asn1.dateToGeneralizedTime(date)
          );
        }
      }
      return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
        // AttributeType
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OID,
          false,
          asn1.oidToDer(attr.type).getBytes()
        ),
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [
          // AttributeValue
          value
        ])
      ]);
    }
    function _encryptedContentToAsn1(ec) {
      return [
        // ContentType, always Data for the moment
        asn1.create(
          asn1.Class.UNIVERSAL,
          asn1.Type.OID,
          false,
          asn1.oidToDer(forge.pki.oids.data).getBytes()
        ),
        // ContentEncryptionAlgorithmIdentifier
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
          // Algorithm
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OID,
            false,
            asn1.oidToDer(ec.algorithm).getBytes()
          ),
          // Parameters (IV)
          !ec.parameter ? void 0 : asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OCTETSTRING,
            false,
            ec.parameter.getBytes()
          )
        ]),
        // [0] EncryptedContent
        asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [
          asn1.create(
            asn1.Class.UNIVERSAL,
            asn1.Type.OCTETSTRING,
            false,
            ec.content.getBytes()
          )
        ])
      ];
    }
    function _fromAsn1(msg, obj, validator) {
      var capture = {};
      var errors = [];
      if (!asn1.validate(obj, validator, capture, errors)) {
        var error = new Error("Cannot read PKCS#7 message. ASN.1 object is not a supported PKCS#7 message.");
        error.errors = error;
        throw error;
      }
      var contentType = asn1.derToOid(capture.contentType);
      if (contentType !== forge.pki.oids.data) {
        throw new Error("Unsupported PKCS#7 message. Only wrapped ContentType Data supported.");
      }
      if (capture.encryptedContent) {
        var content = "";
        if (forge.util.isArray(capture.encryptedContent)) {
          for (var i2 = 0; i2 < capture.encryptedContent.length; ++i2) {
            if (capture.encryptedContent[i2].type !== asn1.Type.OCTETSTRING) {
              throw new Error("Malformed PKCS#7 message, expecting encrypted content constructed of only OCTET STRING objects.");
            }
            content += capture.encryptedContent[i2].value;
          }
        } else {
          content = capture.encryptedContent;
        }
        msg.encryptedContent = {
          algorithm: asn1.derToOid(capture.encAlgorithm),
          parameter: forge.util.createBuffer(capture.encParameter.value),
          content: forge.util.createBuffer(content)
        };
      }
      if (capture.content) {
        var content = "";
        if (forge.util.isArray(capture.content)) {
          for (var i2 = 0; i2 < capture.content.length; ++i2) {
            if (capture.content[i2].type !== asn1.Type.OCTETSTRING) {
              throw new Error("Malformed PKCS#7 message, expecting content constructed of only OCTET STRING objects.");
            }
            content += capture.content[i2].value;
          }
        } else {
          content = capture.content;
        }
        msg.content = forge.util.createBuffer(content);
      }
      msg.version = capture.version.charCodeAt(0);
      msg.rawCapture = capture;
      return capture;
    }
    function _decryptContent(msg) {
      if (msg.encryptedContent.key === void 0) {
        throw new Error("Symmetric key not available.");
      }
      if (msg.content === void 0) {
        var ciph;
        switch (msg.encryptedContent.algorithm) {
          case forge.pki.oids["aes128-CBC"]:
          case forge.pki.oids["aes192-CBC"]:
          case forge.pki.oids["aes256-CBC"]:
            ciph = forge.aes.createDecryptionCipher(msg.encryptedContent.key);
            break;
          case forge.pki.oids["desCBC"]:
          case forge.pki.oids["des-EDE3-CBC"]:
            ciph = forge.des.createDecryptionCipher(msg.encryptedContent.key);
            break;
          default:
            throw new Error("Unsupported symmetric cipher, OID " + msg.encryptedContent.algorithm);
        }
        ciph.start(msg.encryptedContent.parameter);
        ciph.update(msg.encryptedContent.content);
        if (!ciph.finish()) {
          throw new Error("Symmetric decryption failed.");
        }
        msg.content = ciph.output;
      }
    }
  }
});

// node_modules/node-forge/lib/ssh.js
var require_ssh = __commonJS({
  "node_modules/node-forge/lib/ssh.js"(exports2, module2) {
    var forge = require_forge();
    require_aes();
    require_hmac();
    require_md5();
    require_sha1();
    require_util();
    var ssh = module2.exports = forge.ssh = forge.ssh || {};
    ssh.privateKeyToPutty = function(privateKey, passphrase, comment) {
      comment = comment || "";
      passphrase = passphrase || "";
      var algorithm = "ssh-rsa";
      var encryptionAlgorithm = passphrase === "" ? "none" : "aes256-cbc";
      var ppk = "PuTTY-User-Key-File-2: " + algorithm + "\r\n";
      ppk += "Encryption: " + encryptionAlgorithm + "\r\n";
      ppk += "Comment: " + comment + "\r\n";
      var pubbuffer = forge.util.createBuffer();
      _addStringToBuffer(pubbuffer, algorithm);
      _addBigIntegerToBuffer(pubbuffer, privateKey.e);
      _addBigIntegerToBuffer(pubbuffer, privateKey.n);
      var pub = forge.util.encode64(pubbuffer.bytes(), 64);
      var length = Math.floor(pub.length / 66) + 1;
      ppk += "Public-Lines: " + length + "\r\n";
      ppk += pub;
      var privbuffer = forge.util.createBuffer();
      _addBigIntegerToBuffer(privbuffer, privateKey.d);
      _addBigIntegerToBuffer(privbuffer, privateKey.p);
      _addBigIntegerToBuffer(privbuffer, privateKey.q);
      _addBigIntegerToBuffer(privbuffer, privateKey.qInv);
      var priv;
      if (!passphrase) {
        priv = forge.util.encode64(privbuffer.bytes(), 64);
      } else {
        var encLen = privbuffer.length() + 16 - 1;
        encLen -= encLen % 16;
        var padding = _sha1(privbuffer.bytes());
        padding.truncate(padding.length() - encLen + privbuffer.length());
        privbuffer.putBuffer(padding);
        var aeskey = forge.util.createBuffer();
        aeskey.putBuffer(_sha1("\0\0\0\0", passphrase));
        aeskey.putBuffer(_sha1("\0\0\0", passphrase));
        var cipher = forge.aes.createEncryptionCipher(aeskey.truncate(8), "CBC");
        cipher.start(forge.util.createBuffer().fillWithByte(0, 16));
        cipher.update(privbuffer.copy());
        cipher.finish();
        var encrypted = cipher.output;
        encrypted.truncate(16);
        priv = forge.util.encode64(encrypted.bytes(), 64);
      }
      length = Math.floor(priv.length / 66) + 1;
      ppk += "\r\nPrivate-Lines: " + length + "\r\n";
      ppk += priv;
      var mackey = _sha1("putty-private-key-file-mac-key", passphrase);
      var macbuffer = forge.util.createBuffer();
      _addStringToBuffer(macbuffer, algorithm);
      _addStringToBuffer(macbuffer, encryptionAlgorithm);
      _addStringToBuffer(macbuffer, comment);
      macbuffer.putInt32(pubbuffer.length());
      macbuffer.putBuffer(pubbuffer);
      macbuffer.putInt32(privbuffer.length());
      macbuffer.putBuffer(privbuffer);
      var hmac = forge.hmac.create();
      hmac.start("sha1", mackey);
      hmac.update(macbuffer.bytes());
      ppk += "\r\nPrivate-MAC: " + hmac.digest().toHex() + "\r\n";
      return ppk;
    };
    ssh.publicKeyToOpenSSH = function(key, comment) {
      var type = "ssh-rsa";
      comment = comment || "";
      var buffer = forge.util.createBuffer();
      _addStringToBuffer(buffer, type);
      _addBigIntegerToBuffer(buffer, key.e);
      _addBigIntegerToBuffer(buffer, key.n);
      return type + " " + forge.util.encode64(buffer.bytes()) + " " + comment;
    };
    ssh.privateKeyToOpenSSH = function(privateKey, passphrase) {
      if (!passphrase) {
        return forge.pki.privateKeyToPem(privateKey);
      }
      return forge.pki.encryptRsaPrivateKey(
        privateKey,
        passphrase,
        { legacy: true, algorithm: "aes128" }
      );
    };
    ssh.getPublicKeyFingerprint = function(key, options) {
      options = options || {};
      var md = options.md || forge.md.md5.create();
      var type = "ssh-rsa";
      var buffer = forge.util.createBuffer();
      _addStringToBuffer(buffer, type);
      _addBigIntegerToBuffer(buffer, key.e);
      _addBigIntegerToBuffer(buffer, key.n);
      md.start();
      md.update(buffer.getBytes());
      var digest = md.digest();
      if (options.encoding === "hex") {
        var hex = digest.toHex();
        if (options.delimiter) {
          return hex.match(/.{2}/g).join(options.delimiter);
        }
        return hex;
      } else if (options.encoding === "binary") {
        return digest.getBytes();
      } else if (options.encoding) {
        throw new Error('Unknown encoding "' + options.encoding + '".');
      }
      return digest;
    };
    function _addBigIntegerToBuffer(buffer, val) {
      var hexVal = val.toString(16);
      if (hexVal[0] >= "8") {
        hexVal = "00" + hexVal;
      }
      var bytes = forge.util.hexToBytes(hexVal);
      buffer.putInt32(bytes.length);
      buffer.putBytes(bytes);
    }
    function _addStringToBuffer(buffer, val) {
      buffer.putInt32(val.length);
      buffer.putString(val);
    }
    function _sha1() {
      var sha = forge.md.sha1.create();
      var num = arguments.length;
      for (var i2 = 0; i2 < num; ++i2) {
        sha.update(arguments[i2]);
      }
      return sha.digest();
    }
  }
});

// node_modules/node-forge/lib/index.js
var require_lib = __commonJS({
  "node_modules/node-forge/lib/index.js"(exports2, module2) {
    module2.exports = require_forge();
    require_aes();
    require_aesCipherSuites();
    require_asn1();
    require_cipher();
    require_des();
    require_ed25519();
    require_hmac();
    require_kem();
    require_log();
    require_md_all();
    require_mgf1();
    require_pbkdf2();
    require_pem();
    require_pkcs1();
    require_pkcs12();
    require_pkcs7();
    require_pki();
    require_prime();
    require_prng();
    require_pss();
    require_random();
    require_rc2();
    require_ssh();
    require_tls();
    require_util();
  }
});

// node_modules/pako/lib/utils/common.js
var require_common = __commonJS({
  "node_modules/pako/lib/utils/common.js"(exports2) {
    "use strict";
    var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
    exports2.assign = function(obj) {
      var sources = Array.prototype.slice.call(arguments, 1);
      while (sources.length) {
        var source = sources.shift();
        if (!source) {
          continue;
        }
        if (typeof source !== "object") {
          throw new TypeError(source + "must be non-object");
        }
        for (var p2 in source) {
          if (source.hasOwnProperty(p2)) {
            obj[p2] = source[p2];
          }
        }
      }
      return obj;
    };
    exports2.shrinkBuf = function(buf, size) {
      if (buf.length === size) {
        return buf;
      }
      if (buf.subarray) {
        return buf.subarray(0, size);
      }
      buf.length = size;
      return buf;
    };
    var fnTyped = {
      arraySet: function(dest, src, src_offs, len, dest_offs) {
        if (src.subarray && dest.subarray) {
          dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
          return;
        }
        for (var i2 = 0; i2 < len; i2++) {
          dest[dest_offs + i2] = src[src_offs + i2];
        }
      },
      // Join array of chunks to single array.
      flattenChunks: function(chunks) {
        var i2, l2, len, pos, chunk, result;
        len = 0;
        for (i2 = 0, l2 = chunks.length; i2 < l2; i2++) {
          len += chunks[i2].length;
        }
        result = new Uint8Array(len);
        pos = 0;
        for (i2 = 0, l2 = chunks.length; i2 < l2; i2++) {
          chunk = chunks[i2];
          result.set(chunk, pos);
          pos += chunk.length;
        }
        return result;
      }
    };
    var fnUntyped = {
      arraySet: function(dest, src, src_offs, len, dest_offs) {
        for (var i2 = 0; i2 < len; i2++) {
          dest[dest_offs + i2] = src[src_offs + i2];
        }
      },
      // Join array of chunks to single array.
      flattenChunks: function(chunks) {
        return [].concat.apply([], chunks);
      }
    };
    exports2.setTyped = function(on) {
      if (on) {
        exports2.Buf8 = Uint8Array;
        exports2.Buf16 = Uint16Array;
        exports2.Buf32 = Int32Array;
        exports2.assign(exports2, fnTyped);
      } else {
        exports2.Buf8 = Array;
        exports2.Buf16 = Array;
        exports2.Buf32 = Array;
        exports2.assign(exports2, fnUntyped);
      }
    };
    exports2.setTyped(TYPED_OK);
  }
});

// node_modules/pako/lib/zlib/trees.js
var require_trees = __commonJS({
  "node_modules/pako/lib/zlib/trees.js"(exports2) {
    "use strict";
    var utils = require_common();
    var Z_FIXED = 4;
    var Z_BINARY = 0;
    var Z_TEXT = 1;
    var Z_UNKNOWN = 2;
    function zero(buf) {
      var len = buf.length;
      while (--len >= 0) {
        buf[len] = 0;
      }
    }
    var STORED_BLOCK = 0;
    var STATIC_TREES = 1;
    var DYN_TREES = 2;
    var MIN_MATCH = 3;
    var MAX_MATCH = 258;
    var LENGTH_CODES = 29;
    var LITERALS = 256;
    var L_CODES = LITERALS + 1 + LENGTH_CODES;
    var D_CODES = 30;
    var BL_CODES = 19;
    var HEAP_SIZE = 2 * L_CODES + 1;
    var MAX_BITS = 15;
    var Buf_size = 16;
    var MAX_BL_BITS = 7;
    var END_BLOCK = 256;
    var REP_3_6 = 16;
    var REPZ_3_10 = 17;
    var REPZ_11_138 = 18;
    var extra_lbits = (
      /* extra bits for each length code */
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
    );
    var extra_dbits = (
      /* extra bits for each distance code */
      [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
    );
    var extra_blbits = (
      /* extra bits for each bit length code */
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
    );
    var bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
    var DIST_CODE_LEN = 512;
    var static_ltree = new Array((L_CODES + 2) * 2);
    zero(static_ltree);
    var static_dtree = new Array(D_CODES * 2);
    zero(static_dtree);
    var _dist_code = new Array(DIST_CODE_LEN);
    zero(_dist_code);
    var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
    zero(_length_code);
    var base_length = new Array(LENGTH_CODES);
    zero(base_length);
    var base_dist = new Array(D_CODES);
    zero(base_dist);
    function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
      this.static_tree = static_tree;
      this.extra_bits = extra_bits;
      this.extra_base = extra_base;
      this.elems = elems;
      this.max_length = max_length;
      this.has_stree = static_tree && static_tree.length;
    }
    var static_l_desc;
    var static_d_desc;
    var static_bl_desc;
    function TreeDesc(dyn_tree, stat_desc) {
      this.dyn_tree = dyn_tree;
      this.max_code = 0;
      this.stat_desc = stat_desc;
    }
    function d_code(dist) {
      return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
    }
    function put_short(s2, w2) {
      s2.pending_buf[s2.pending++] = w2 & 255;
      s2.pending_buf[s2.pending++] = w2 >>> 8 & 255;
    }
    function send_bits(s2, value, length) {
      if (s2.bi_valid > Buf_size - length) {
        s2.bi_buf |= value << s2.bi_valid & 65535;
        put_short(s2, s2.bi_buf);
        s2.bi_buf = value >> Buf_size - s2.bi_valid;
        s2.bi_valid += length - Buf_size;
      } else {
        s2.bi_buf |= value << s2.bi_valid & 65535;
        s2.bi_valid += length;
      }
    }
    function send_code(s2, c2, tree) {
      send_bits(
        s2,
        tree[c2 * 2],
        tree[c2 * 2 + 1]
        /*.Len*/
      );
    }
    function bi_reverse(code, len) {
      var res = 0;
      do {
        res |= code & 1;
        code >>>= 1;
        res <<= 1;
      } while (--len > 0);
      return res >>> 1;
    }
    function bi_flush(s2) {
      if (s2.bi_valid === 16) {
        put_short(s2, s2.bi_buf);
        s2.bi_buf = 0;
        s2.bi_valid = 0;
      } else if (s2.bi_valid >= 8) {
        s2.pending_buf[s2.pending++] = s2.bi_buf & 255;
        s2.bi_buf >>= 8;
        s2.bi_valid -= 8;
      }
    }
    function gen_bitlen(s2, desc) {
      var tree = desc.dyn_tree;
      var max_code = desc.max_code;
      var stree = desc.stat_desc.static_tree;
      var has_stree = desc.stat_desc.has_stree;
      var extra = desc.stat_desc.extra_bits;
      var base = desc.stat_desc.extra_base;
      var max_length = desc.stat_desc.max_length;
      var h2;
      var n2, m2;
      var bits;
      var xbits;
      var f2;
      var overflow = 0;
      for (bits = 0; bits <= MAX_BITS; bits++) {
        s2.bl_count[bits] = 0;
      }
      tree[s2.heap[s2.heap_max] * 2 + 1] = 0;
      for (h2 = s2.heap_max + 1; h2 < HEAP_SIZE; h2++) {
        n2 = s2.heap[h2];
        bits = tree[tree[n2 * 2 + 1] * 2 + 1] + 1;
        if (bits > max_length) {
          bits = max_length;
          overflow++;
        }
        tree[n2 * 2 + 1] = bits;
        if (n2 > max_code) {
          continue;
        }
        s2.bl_count[bits]++;
        xbits = 0;
        if (n2 >= base) {
          xbits = extra[n2 - base];
        }
        f2 = tree[n2 * 2];
        s2.opt_len += f2 * (bits + xbits);
        if (has_stree) {
          s2.static_len += f2 * (stree[n2 * 2 + 1] + xbits);
        }
      }
      if (overflow === 0) {
        return;
      }
      do {
        bits = max_length - 1;
        while (s2.bl_count[bits] === 0) {
          bits--;
        }
        s2.bl_count[bits]--;
        s2.bl_count[bits + 1] += 2;
        s2.bl_count[max_length]--;
        overflow -= 2;
      } while (overflow > 0);
      for (bits = max_length; bits !== 0; bits--) {
        n2 = s2.bl_count[bits];
        while (n2 !== 0) {
          m2 = s2.heap[--h2];
          if (m2 > max_code) {
            continue;
          }
          if (tree[m2 * 2 + 1] !== bits) {
            s2.opt_len += (bits - tree[m2 * 2 + 1]) * tree[m2 * 2];
            tree[m2 * 2 + 1] = bits;
          }
          n2--;
        }
      }
    }
    function gen_codes(tree, max_code, bl_count) {
      var next_code = new Array(MAX_BITS + 1);
      var code = 0;
      var bits;
      var n2;
      for (bits = 1; bits <= MAX_BITS; bits++) {
        next_code[bits] = code = code + bl_count[bits - 1] << 1;
      }
      for (n2 = 0; n2 <= max_code; n2++) {
        var len = tree[n2 * 2 + 1];
        if (len === 0) {
          continue;
        }
        tree[n2 * 2] = bi_reverse(next_code[len]++, len);
      }
    }
    function tr_static_init() {
      var n2;
      var bits;
      var length;
      var code;
      var dist;
      var bl_count = new Array(MAX_BITS + 1);
      length = 0;
      for (code = 0; code < LENGTH_CODES - 1; code++) {
        base_length[code] = length;
        for (n2 = 0; n2 < 1 << extra_lbits[code]; n2++) {
          _length_code[length++] = code;
        }
      }
      _length_code[length - 1] = code;
      dist = 0;
      for (code = 0; code < 16; code++) {
        base_dist[code] = dist;
        for (n2 = 0; n2 < 1 << extra_dbits[code]; n2++) {
          _dist_code[dist++] = code;
        }
      }
      dist >>= 7;
      for (; code < D_CODES; code++) {
        base_dist[code] = dist << 7;
        for (n2 = 0; n2 < 1 << extra_dbits[code] - 7; n2++) {
          _dist_code[256 + dist++] = code;
        }
      }
      for (bits = 0; bits <= MAX_BITS; bits++) {
        bl_count[bits] = 0;
      }
      n2 = 0;
      while (n2 <= 143) {
        static_ltree[n2 * 2 + 1] = 8;
        n2++;
        bl_count[8]++;
      }
      while (n2 <= 255) {
        static_ltree[n2 * 2 + 1] = 9;
        n2++;
        bl_count[9]++;
      }
      while (n2 <= 279) {
        static_ltree[n2 * 2 + 1] = 7;
        n2++;
        bl_count[7]++;
      }
      while (n2 <= 287) {
        static_ltree[n2 * 2 + 1] = 8;
        n2++;
        bl_count[8]++;
      }
      gen_codes(static_ltree, L_CODES + 1, bl_count);
      for (n2 = 0; n2 < D_CODES; n2++) {
        static_dtree[n2 * 2 + 1] = 5;
        static_dtree[n2 * 2] = bi_reverse(n2, 5);
      }
      static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
      static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
      static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
    }
    function init_block(s2) {
      var n2;
      for (n2 = 0; n2 < L_CODES; n2++) {
        s2.dyn_ltree[n2 * 2] = 0;
      }
      for (n2 = 0; n2 < D_CODES; n2++) {
        s2.dyn_dtree[n2 * 2] = 0;
      }
      for (n2 = 0; n2 < BL_CODES; n2++) {
        s2.bl_tree[n2 * 2] = 0;
      }
      s2.dyn_ltree[END_BLOCK * 2] = 1;
      s2.opt_len = s2.static_len = 0;
      s2.last_lit = s2.matches = 0;
    }
    function bi_windup(s2) {
      if (s2.bi_valid > 8) {
        put_short(s2, s2.bi_buf);
      } else if (s2.bi_valid > 0) {
        s2.pending_buf[s2.pending++] = s2.bi_buf;
      }
      s2.bi_buf = 0;
      s2.bi_valid = 0;
    }
    function copy_block(s2, buf, len, header) {
      bi_windup(s2);
      if (header) {
        put_short(s2, len);
        put_short(s2, ~len);
      }
      utils.arraySet(s2.pending_buf, s2.window, buf, len, s2.pending);
      s2.pending += len;
    }
    function smaller(tree, n2, m2, depth) {
      var _n2 = n2 * 2;
      var _m2 = m2 * 2;
      return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n2] <= depth[m2];
    }
    function pqdownheap(s2, tree, k2) {
      var v2 = s2.heap[k2];
      var j2 = k2 << 1;
      while (j2 <= s2.heap_len) {
        if (j2 < s2.heap_len && smaller(tree, s2.heap[j2 + 1], s2.heap[j2], s2.depth)) {
          j2++;
        }
        if (smaller(tree, v2, s2.heap[j2], s2.depth)) {
          break;
        }
        s2.heap[k2] = s2.heap[j2];
        k2 = j2;
        j2 <<= 1;
      }
      s2.heap[k2] = v2;
    }
    function compress_block(s2, ltree, dtree) {
      var dist;
      var lc;
      var lx = 0;
      var code;
      var extra;
      if (s2.last_lit !== 0) {
        do {
          dist = s2.pending_buf[s2.d_buf + lx * 2] << 8 | s2.pending_buf[s2.d_buf + lx * 2 + 1];
          lc = s2.pending_buf[s2.l_buf + lx];
          lx++;
          if (dist === 0) {
            send_code(s2, lc, ltree);
          } else {
            code = _length_code[lc];
            send_code(s2, code + LITERALS + 1, ltree);
            extra = extra_lbits[code];
            if (extra !== 0) {
              lc -= base_length[code];
              send_bits(s2, lc, extra);
            }
            dist--;
            code = d_code(dist);
            send_code(s2, code, dtree);
            extra = extra_dbits[code];
            if (extra !== 0) {
              dist -= base_dist[code];
              send_bits(s2, dist, extra);
            }
          }
        } while (lx < s2.last_lit);
      }
      send_code(s2, END_BLOCK, ltree);
    }
    function build_tree(s2, desc) {
      var tree = desc.dyn_tree;
      var stree = desc.stat_desc.static_tree;
      var has_stree = desc.stat_desc.has_stree;
      var elems = desc.stat_desc.elems;
      var n2, m2;
      var max_code = -1;
      var node;
      s2.heap_len = 0;
      s2.heap_max = HEAP_SIZE;
      for (n2 = 0; n2 < elems; n2++) {
        if (tree[n2 * 2] !== 0) {
          s2.heap[++s2.heap_len] = max_code = n2;
          s2.depth[n2] = 0;
        } else {
          tree[n2 * 2 + 1] = 0;
        }
      }
      while (s2.heap_len < 2) {
        node = s2.heap[++s2.heap_len] = max_code < 2 ? ++max_code : 0;
        tree[node * 2] = 1;
        s2.depth[node] = 0;
        s2.opt_len--;
        if (has_stree) {
          s2.static_len -= stree[node * 2 + 1];
        }
      }
      desc.max_code = max_code;
      for (n2 = s2.heap_len >> 1; n2 >= 1; n2--) {
        pqdownheap(s2, tree, n2);
      }
      node = elems;
      do {
        n2 = s2.heap[
          1
          /*SMALLEST*/
        ];
        s2.heap[
          1
          /*SMALLEST*/
        ] = s2.heap[s2.heap_len--];
        pqdownheap(
          s2,
          tree,
          1
          /*SMALLEST*/
        );
        m2 = s2.heap[
          1
          /*SMALLEST*/
        ];
        s2.heap[--s2.heap_max] = n2;
        s2.heap[--s2.heap_max] = m2;
        tree[node * 2] = tree[n2 * 2] + tree[m2 * 2];
        s2.depth[node] = (s2.depth[n2] >= s2.depth[m2] ? s2.depth[n2] : s2.depth[m2]) + 1;
        tree[n2 * 2 + 1] = tree[m2 * 2 + 1] = node;
        s2.heap[
          1
          /*SMALLEST*/
        ] = node++;
        pqdownheap(
          s2,
          tree,
          1
          /*SMALLEST*/
        );
      } while (s2.heap_len >= 2);
      s2.heap[--s2.heap_max] = s2.heap[
        1
        /*SMALLEST*/
      ];
      gen_bitlen(s2, desc);
      gen_codes(tree, max_code, s2.bl_count);
    }
    function scan_tree(s2, tree, max_code) {
      var n2;
      var prevlen = -1;
      var curlen;
      var nextlen = tree[0 * 2 + 1];
      var count = 0;
      var max_count = 7;
      var min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      tree[(max_code + 1) * 2 + 1] = 65535;
      for (n2 = 0; n2 <= max_code; n2++) {
        curlen = nextlen;
        nextlen = tree[(n2 + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          s2.bl_tree[curlen * 2] += count;
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            s2.bl_tree[curlen * 2]++;
          }
          s2.bl_tree[REP_3_6 * 2]++;
        } else if (count <= 10) {
          s2.bl_tree[REPZ_3_10 * 2]++;
        } else {
          s2.bl_tree[REPZ_11_138 * 2]++;
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }
    function send_tree(s2, tree, max_code) {
      var n2;
      var prevlen = -1;
      var curlen;
      var nextlen = tree[0 * 2 + 1];
      var count = 0;
      var max_count = 7;
      var min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      for (n2 = 0; n2 <= max_code; n2++) {
        curlen = nextlen;
        nextlen = tree[(n2 + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          do {
            send_code(s2, curlen, s2.bl_tree);
          } while (--count !== 0);
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            send_code(s2, curlen, s2.bl_tree);
            count--;
          }
          send_code(s2, REP_3_6, s2.bl_tree);
          send_bits(s2, count - 3, 2);
        } else if (count <= 10) {
          send_code(s2, REPZ_3_10, s2.bl_tree);
          send_bits(s2, count - 3, 3);
        } else {
          send_code(s2, REPZ_11_138, s2.bl_tree);
          send_bits(s2, count - 11, 7);
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    }
    function build_bl_tree(s2) {
      var max_blindex;
      scan_tree(s2, s2.dyn_ltree, s2.l_desc.max_code);
      scan_tree(s2, s2.dyn_dtree, s2.d_desc.max_code);
      build_tree(s2, s2.bl_desc);
      for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
        if (s2.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
          break;
        }
      }
      s2.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
      return max_blindex;
    }
    function send_all_trees(s2, lcodes, dcodes, blcodes) {
      var rank;
      send_bits(s2, lcodes - 257, 5);
      send_bits(s2, dcodes - 1, 5);
      send_bits(s2, blcodes - 4, 4);
      for (rank = 0; rank < blcodes; rank++) {
        send_bits(s2, s2.bl_tree[bl_order[rank] * 2 + 1], 3);
      }
      send_tree(s2, s2.dyn_ltree, lcodes - 1);
      send_tree(s2, s2.dyn_dtree, dcodes - 1);
    }
    function detect_data_type(s2) {
      var black_mask = 4093624447;
      var n2;
      for (n2 = 0; n2 <= 31; n2++, black_mask >>>= 1) {
        if (black_mask & 1 && s2.dyn_ltree[n2 * 2] !== 0) {
          return Z_BINARY;
        }
      }
      if (s2.dyn_ltree[9 * 2] !== 0 || s2.dyn_ltree[10 * 2] !== 0 || s2.dyn_ltree[13 * 2] !== 0) {
        return Z_TEXT;
      }
      for (n2 = 32; n2 < LITERALS; n2++) {
        if (s2.dyn_ltree[n2 * 2] !== 0) {
          return Z_TEXT;
        }
      }
      return Z_BINARY;
    }
    var static_init_done = false;
    function _tr_init(s2) {
      if (!static_init_done) {
        tr_static_init();
        static_init_done = true;
      }
      s2.l_desc = new TreeDesc(s2.dyn_ltree, static_l_desc);
      s2.d_desc = new TreeDesc(s2.dyn_dtree, static_d_desc);
      s2.bl_desc = new TreeDesc(s2.bl_tree, static_bl_desc);
      s2.bi_buf = 0;
      s2.bi_valid = 0;
      init_block(s2);
    }
    function _tr_stored_block(s2, buf, stored_len, last) {
      send_bits(s2, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
      copy_block(s2, buf, stored_len, true);
    }
    function _tr_align(s2) {
      send_bits(s2, STATIC_TREES << 1, 3);
      send_code(s2, END_BLOCK, static_ltree);
      bi_flush(s2);
    }
    function _tr_flush_block(s2, buf, stored_len, last) {
      var opt_lenb, static_lenb;
      var max_blindex = 0;
      if (s2.level > 0) {
        if (s2.strm.data_type === Z_UNKNOWN) {
          s2.strm.data_type = detect_data_type(s2);
        }
        build_tree(s2, s2.l_desc);
        build_tree(s2, s2.d_desc);
        max_blindex = build_bl_tree(s2);
        opt_lenb = s2.opt_len + 3 + 7 >>> 3;
        static_lenb = s2.static_len + 3 + 7 >>> 3;
        if (static_lenb <= opt_lenb) {
          opt_lenb = static_lenb;
        }
      } else {
        opt_lenb = static_lenb = stored_len + 5;
      }
      if (stored_len + 4 <= opt_lenb && buf !== -1) {
        _tr_stored_block(s2, buf, stored_len, last);
      } else if (s2.strategy === Z_FIXED || static_lenb === opt_lenb) {
        send_bits(s2, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
        compress_block(s2, static_ltree, static_dtree);
      } else {
        send_bits(s2, (DYN_TREES << 1) + (last ? 1 : 0), 3);
        send_all_trees(s2, s2.l_desc.max_code + 1, s2.d_desc.max_code + 1, max_blindex + 1);
        compress_block(s2, s2.dyn_ltree, s2.dyn_dtree);
      }
      init_block(s2);
      if (last) {
        bi_windup(s2);
      }
    }
    function _tr_tally(s2, dist, lc) {
      s2.pending_buf[s2.d_buf + s2.last_lit * 2] = dist >>> 8 & 255;
      s2.pending_buf[s2.d_buf + s2.last_lit * 2 + 1] = dist & 255;
      s2.pending_buf[s2.l_buf + s2.last_lit] = lc & 255;
      s2.last_lit++;
      if (dist === 0) {
        s2.dyn_ltree[lc * 2]++;
      } else {
        s2.matches++;
        dist--;
        s2.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
        s2.dyn_dtree[d_code(dist) * 2]++;
      }
      return s2.last_lit === s2.lit_bufsize - 1;
    }
    exports2._tr_init = _tr_init;
    exports2._tr_stored_block = _tr_stored_block;
    exports2._tr_flush_block = _tr_flush_block;
    exports2._tr_tally = _tr_tally;
    exports2._tr_align = _tr_align;
  }
});

// node_modules/pako/lib/zlib/adler32.js
var require_adler32 = __commonJS({
  "node_modules/pako/lib/zlib/adler32.js"(exports2, module2) {
    "use strict";
    function adler32(adler, buf, len, pos) {
      var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n2 = 0;
      while (len !== 0) {
        n2 = len > 2e3 ? 2e3 : len;
        len -= n2;
        do {
          s1 = s1 + buf[pos++] | 0;
          s2 = s2 + s1 | 0;
        } while (--n2);
        s1 %= 65521;
        s2 %= 65521;
      }
      return s1 | s2 << 16 | 0;
    }
    module2.exports = adler32;
  }
});

// node_modules/pako/lib/zlib/crc32.js
var require_crc32 = __commonJS({
  "node_modules/pako/lib/zlib/crc32.js"(exports2, module2) {
    "use strict";
    function makeTable() {
      var c2, table = [];
      for (var n2 = 0; n2 < 256; n2++) {
        c2 = n2;
        for (var k2 = 0; k2 < 8; k2++) {
          c2 = c2 & 1 ? 3988292384 ^ c2 >>> 1 : c2 >>> 1;
        }
        table[n2] = c2;
      }
      return table;
    }
    var crcTable = makeTable();
    function crc32(crc, buf, len, pos) {
      var t2 = crcTable, end = pos + len;
      crc ^= -1;
      for (var i2 = pos; i2 < end; i2++) {
        crc = crc >>> 8 ^ t2[(crc ^ buf[i2]) & 255];
      }
      return crc ^ -1;
    }
    module2.exports = crc32;
  }
});

// node_modules/pako/lib/zlib/messages.js
var require_messages = __commonJS({
  "node_modules/pako/lib/zlib/messages.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      2: "need dictionary",
      /* Z_NEED_DICT       2  */
      1: "stream end",
      /* Z_STREAM_END      1  */
      0: "",
      /* Z_OK              0  */
      "-1": "file error",
      /* Z_ERRNO         (-1) */
      "-2": "stream error",
      /* Z_STREAM_ERROR  (-2) */
      "-3": "data error",
      /* Z_DATA_ERROR    (-3) */
      "-4": "insufficient memory",
      /* Z_MEM_ERROR     (-4) */
      "-5": "buffer error",
      /* Z_BUF_ERROR     (-5) */
      "-6": "incompatible version"
      /* Z_VERSION_ERROR (-6) */
    };
  }
});

// node_modules/pako/lib/zlib/deflate.js
var require_deflate = __commonJS({
  "node_modules/pako/lib/zlib/deflate.js"(exports2) {
    "use strict";
    var utils = require_common();
    var trees = require_trees();
    var adler32 = require_adler32();
    var crc32 = require_crc32();
    var msg = require_messages();
    var Z_NO_FLUSH = 0;
    var Z_PARTIAL_FLUSH = 1;
    var Z_FULL_FLUSH = 3;
    var Z_FINISH = 4;
    var Z_BLOCK = 5;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_STREAM_ERROR = -2;
    var Z_DATA_ERROR = -3;
    var Z_BUF_ERROR = -5;
    var Z_DEFAULT_COMPRESSION = -1;
    var Z_FILTERED = 1;
    var Z_HUFFMAN_ONLY = 2;
    var Z_RLE = 3;
    var Z_FIXED = 4;
    var Z_DEFAULT_STRATEGY = 0;
    var Z_UNKNOWN = 2;
    var Z_DEFLATED = 8;
    var MAX_MEM_LEVEL = 9;
    var MAX_WBITS = 15;
    var DEF_MEM_LEVEL = 8;
    var LENGTH_CODES = 29;
    var LITERALS = 256;
    var L_CODES = LITERALS + 1 + LENGTH_CODES;
    var D_CODES = 30;
    var BL_CODES = 19;
    var HEAP_SIZE = 2 * L_CODES + 1;
    var MAX_BITS = 15;
    var MIN_MATCH = 3;
    var MAX_MATCH = 258;
    var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
    var PRESET_DICT = 32;
    var INIT_STATE = 42;
    var EXTRA_STATE = 69;
    var NAME_STATE = 73;
    var COMMENT_STATE = 91;
    var HCRC_STATE = 103;
    var BUSY_STATE = 113;
    var FINISH_STATE = 666;
    var BS_NEED_MORE = 1;
    var BS_BLOCK_DONE = 2;
    var BS_FINISH_STARTED = 3;
    var BS_FINISH_DONE = 4;
    var OS_CODE = 3;
    function err(strm, errorCode) {
      strm.msg = msg[errorCode];
      return errorCode;
    }
    function rank(f2) {
      return (f2 << 1) - (f2 > 4 ? 9 : 0);
    }
    function zero(buf) {
      var len = buf.length;
      while (--len >= 0) {
        buf[len] = 0;
      }
    }
    function flush_pending(strm) {
      var s2 = strm.state;
      var len = s2.pending;
      if (len > strm.avail_out) {
        len = strm.avail_out;
      }
      if (len === 0) {
        return;
      }
      utils.arraySet(strm.output, s2.pending_buf, s2.pending_out, len, strm.next_out);
      strm.next_out += len;
      s2.pending_out += len;
      strm.total_out += len;
      strm.avail_out -= len;
      s2.pending -= len;
      if (s2.pending === 0) {
        s2.pending_out = 0;
      }
    }
    function flush_block_only(s2, last) {
      trees._tr_flush_block(s2, s2.block_start >= 0 ? s2.block_start : -1, s2.strstart - s2.block_start, last);
      s2.block_start = s2.strstart;
      flush_pending(s2.strm);
    }
    function put_byte(s2, b2) {
      s2.pending_buf[s2.pending++] = b2;
    }
    function putShortMSB(s2, b2) {
      s2.pending_buf[s2.pending++] = b2 >>> 8 & 255;
      s2.pending_buf[s2.pending++] = b2 & 255;
    }
    function read_buf(strm, buf, start, size) {
      var len = strm.avail_in;
      if (len > size) {
        len = size;
      }
      if (len === 0) {
        return 0;
      }
      strm.avail_in -= len;
      utils.arraySet(buf, strm.input, strm.next_in, len, start);
      if (strm.state.wrap === 1) {
        strm.adler = adler32(strm.adler, buf, len, start);
      } else if (strm.state.wrap === 2) {
        strm.adler = crc32(strm.adler, buf, len, start);
      }
      strm.next_in += len;
      strm.total_in += len;
      return len;
    }
    function longest_match(s2, cur_match) {
      var chain_length = s2.max_chain_length;
      var scan = s2.strstart;
      var match;
      var len;
      var best_len = s2.prev_length;
      var nice_match = s2.nice_match;
      var limit = s2.strstart > s2.w_size - MIN_LOOKAHEAD ? s2.strstart - (s2.w_size - MIN_LOOKAHEAD) : 0;
      var _win = s2.window;
      var wmask = s2.w_mask;
      var prev = s2.prev;
      var strend = s2.strstart + MAX_MATCH;
      var scan_end1 = _win[scan + best_len - 1];
      var scan_end = _win[scan + best_len];
      if (s2.prev_length >= s2.good_match) {
        chain_length >>= 2;
      }
      if (nice_match > s2.lookahead) {
        nice_match = s2.lookahead;
      }
      do {
        match = cur_match;
        if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
          continue;
        }
        scan += 2;
        match++;
        do {
        } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
        len = MAX_MATCH - (strend - scan);
        scan = strend - MAX_MATCH;
        if (len > best_len) {
          s2.match_start = cur_match;
          best_len = len;
          if (len >= nice_match) {
            break;
          }
          scan_end1 = _win[scan + best_len - 1];
          scan_end = _win[scan + best_len];
        }
      } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
      if (best_len <= s2.lookahead) {
        return best_len;
      }
      return s2.lookahead;
    }
    function fill_window(s2) {
      var _w_size = s2.w_size;
      var p2, n2, m2, more, str;
      do {
        more = s2.window_size - s2.lookahead - s2.strstart;
        if (s2.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
          utils.arraySet(s2.window, s2.window, _w_size, _w_size, 0);
          s2.match_start -= _w_size;
          s2.strstart -= _w_size;
          s2.block_start -= _w_size;
          n2 = s2.hash_size;
          p2 = n2;
          do {
            m2 = s2.head[--p2];
            s2.head[p2] = m2 >= _w_size ? m2 - _w_size : 0;
          } while (--n2);
          n2 = _w_size;
          p2 = n2;
          do {
            m2 = s2.prev[--p2];
            s2.prev[p2] = m2 >= _w_size ? m2 - _w_size : 0;
          } while (--n2);
          more += _w_size;
        }
        if (s2.strm.avail_in === 0) {
          break;
        }
        n2 = read_buf(s2.strm, s2.window, s2.strstart + s2.lookahead, more);
        s2.lookahead += n2;
        if (s2.lookahead + s2.insert >= MIN_MATCH) {
          str = s2.strstart - s2.insert;
          s2.ins_h = s2.window[str];
          s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[str + 1]) & s2.hash_mask;
          while (s2.insert) {
            s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[str + MIN_MATCH - 1]) & s2.hash_mask;
            s2.prev[str & s2.w_mask] = s2.head[s2.ins_h];
            s2.head[s2.ins_h] = str;
            str++;
            s2.insert--;
            if (s2.lookahead + s2.insert < MIN_MATCH) {
              break;
            }
          }
        }
      } while (s2.lookahead < MIN_LOOKAHEAD && s2.strm.avail_in !== 0);
    }
    function deflate_stored(s2, flush) {
      var max_block_size = 65535;
      if (max_block_size > s2.pending_buf_size - 5) {
        max_block_size = s2.pending_buf_size - 5;
      }
      for (; ; ) {
        if (s2.lookahead <= 1) {
          fill_window(s2);
          if (s2.lookahead === 0 && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s2.lookahead === 0) {
            break;
          }
        }
        s2.strstart += s2.lookahead;
        s2.lookahead = 0;
        var max_start = s2.block_start + max_block_size;
        if (s2.strstart === 0 || s2.strstart >= max_start) {
          s2.lookahead = s2.strstart - max_start;
          s2.strstart = max_start;
          flush_block_only(s2, false);
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        if (s2.strstart - s2.block_start >= s2.w_size - MIN_LOOKAHEAD) {
          flush_block_only(s2, false);
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s2.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only(s2, true);
        if (s2.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s2.strstart > s2.block_start) {
        flush_block_only(s2, false);
        if (s2.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_NEED_MORE;
    }
    function deflate_fast(s2, flush) {
      var hash_head;
      var bflush;
      for (; ; ) {
        if (s2.lookahead < MIN_LOOKAHEAD) {
          fill_window(s2);
          if (s2.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s2.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s2.lookahead >= MIN_MATCH) {
          s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[s2.strstart + MIN_MATCH - 1]) & s2.hash_mask;
          hash_head = s2.prev[s2.strstart & s2.w_mask] = s2.head[s2.ins_h];
          s2.head[s2.ins_h] = s2.strstart;
        }
        if (hash_head !== 0 && s2.strstart - hash_head <= s2.w_size - MIN_LOOKAHEAD) {
          s2.match_length = longest_match(s2, hash_head);
        }
        if (s2.match_length >= MIN_MATCH) {
          bflush = trees._tr_tally(s2, s2.strstart - s2.match_start, s2.match_length - MIN_MATCH);
          s2.lookahead -= s2.match_length;
          if (s2.match_length <= s2.max_lazy_match && s2.lookahead >= MIN_MATCH) {
            s2.match_length--;
            do {
              s2.strstart++;
              s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[s2.strstart + MIN_MATCH - 1]) & s2.hash_mask;
              hash_head = s2.prev[s2.strstart & s2.w_mask] = s2.head[s2.ins_h];
              s2.head[s2.ins_h] = s2.strstart;
            } while (--s2.match_length !== 0);
            s2.strstart++;
          } else {
            s2.strstart += s2.match_length;
            s2.match_length = 0;
            s2.ins_h = s2.window[s2.strstart];
            s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[s2.strstart + 1]) & s2.hash_mask;
          }
        } else {
          bflush = trees._tr_tally(s2, 0, s2.window[s2.strstart]);
          s2.lookahead--;
          s2.strstart++;
        }
        if (bflush) {
          flush_block_only(s2, false);
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s2.insert = s2.strstart < MIN_MATCH - 1 ? s2.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH) {
        flush_block_only(s2, true);
        if (s2.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s2.last_lit) {
        flush_block_only(s2, false);
        if (s2.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function deflate_slow(s2, flush) {
      var hash_head;
      var bflush;
      var max_insert;
      for (; ; ) {
        if (s2.lookahead < MIN_LOOKAHEAD) {
          fill_window(s2);
          if (s2.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s2.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s2.lookahead >= MIN_MATCH) {
          s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[s2.strstart + MIN_MATCH - 1]) & s2.hash_mask;
          hash_head = s2.prev[s2.strstart & s2.w_mask] = s2.head[s2.ins_h];
          s2.head[s2.ins_h] = s2.strstart;
        }
        s2.prev_length = s2.match_length;
        s2.prev_match = s2.match_start;
        s2.match_length = MIN_MATCH - 1;
        if (hash_head !== 0 && s2.prev_length < s2.max_lazy_match && s2.strstart - hash_head <= s2.w_size - MIN_LOOKAHEAD) {
          s2.match_length = longest_match(s2, hash_head);
          if (s2.match_length <= 5 && (s2.strategy === Z_FILTERED || s2.match_length === MIN_MATCH && s2.strstart - s2.match_start > 4096)) {
            s2.match_length = MIN_MATCH - 1;
          }
        }
        if (s2.prev_length >= MIN_MATCH && s2.match_length <= s2.prev_length) {
          max_insert = s2.strstart + s2.lookahead - MIN_MATCH;
          bflush = trees._tr_tally(s2, s2.strstart - 1 - s2.prev_match, s2.prev_length - MIN_MATCH);
          s2.lookahead -= s2.prev_length - 1;
          s2.prev_length -= 2;
          do {
            if (++s2.strstart <= max_insert) {
              s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[s2.strstart + MIN_MATCH - 1]) & s2.hash_mask;
              hash_head = s2.prev[s2.strstart & s2.w_mask] = s2.head[s2.ins_h];
              s2.head[s2.ins_h] = s2.strstart;
            }
          } while (--s2.prev_length !== 0);
          s2.match_available = 0;
          s2.match_length = MIN_MATCH - 1;
          s2.strstart++;
          if (bflush) {
            flush_block_only(s2, false);
            if (s2.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        } else if (s2.match_available) {
          bflush = trees._tr_tally(s2, 0, s2.window[s2.strstart - 1]);
          if (bflush) {
            flush_block_only(s2, false);
          }
          s2.strstart++;
          s2.lookahead--;
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        } else {
          s2.match_available = 1;
          s2.strstart++;
          s2.lookahead--;
        }
      }
      if (s2.match_available) {
        bflush = trees._tr_tally(s2, 0, s2.window[s2.strstart - 1]);
        s2.match_available = 0;
      }
      s2.insert = s2.strstart < MIN_MATCH - 1 ? s2.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH) {
        flush_block_only(s2, true);
        if (s2.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s2.last_lit) {
        flush_block_only(s2, false);
        if (s2.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function deflate_rle(s2, flush) {
      var bflush;
      var prev;
      var scan, strend;
      var _win = s2.window;
      for (; ; ) {
        if (s2.lookahead <= MAX_MATCH) {
          fill_window(s2);
          if (s2.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s2.lookahead === 0) {
            break;
          }
        }
        s2.match_length = 0;
        if (s2.lookahead >= MIN_MATCH && s2.strstart > 0) {
          scan = s2.strstart - 1;
          prev = _win[scan];
          if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
            strend = s2.strstart + MAX_MATCH;
            do {
            } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
            s2.match_length = MAX_MATCH - (strend - scan);
            if (s2.match_length > s2.lookahead) {
              s2.match_length = s2.lookahead;
            }
          }
        }
        if (s2.match_length >= MIN_MATCH) {
          bflush = trees._tr_tally(s2, 1, s2.match_length - MIN_MATCH);
          s2.lookahead -= s2.match_length;
          s2.strstart += s2.match_length;
          s2.match_length = 0;
        } else {
          bflush = trees._tr_tally(s2, 0, s2.window[s2.strstart]);
          s2.lookahead--;
          s2.strstart++;
        }
        if (bflush) {
          flush_block_only(s2, false);
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s2.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only(s2, true);
        if (s2.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s2.last_lit) {
        flush_block_only(s2, false);
        if (s2.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function deflate_huff(s2, flush) {
      var bflush;
      for (; ; ) {
        if (s2.lookahead === 0) {
          fill_window(s2);
          if (s2.lookahead === 0) {
            if (flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            break;
          }
        }
        s2.match_length = 0;
        bflush = trees._tr_tally(s2, 0, s2.window[s2.strstart]);
        s2.lookahead--;
        s2.strstart++;
        if (bflush) {
          flush_block_only(s2, false);
          if (s2.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s2.insert = 0;
      if (flush === Z_FINISH) {
        flush_block_only(s2, true);
        if (s2.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s2.last_lit) {
        flush_block_only(s2, false);
        if (s2.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    }
    function Config(good_length, max_lazy, nice_length, max_chain, func) {
      this.good_length = good_length;
      this.max_lazy = max_lazy;
      this.nice_length = nice_length;
      this.max_chain = max_chain;
      this.func = func;
    }
    var configuration_table;
    configuration_table = [
      /*      good lazy nice chain */
      new Config(0, 0, 0, 0, deflate_stored),
      /* 0 store only */
      new Config(4, 4, 8, 4, deflate_fast),
      /* 1 max speed, no lazy matches */
      new Config(4, 5, 16, 8, deflate_fast),
      /* 2 */
      new Config(4, 6, 32, 32, deflate_fast),
      /* 3 */
      new Config(4, 4, 16, 16, deflate_slow),
      /* 4 lazy matches */
      new Config(8, 16, 32, 32, deflate_slow),
      /* 5 */
      new Config(8, 16, 128, 128, deflate_slow),
      /* 6 */
      new Config(8, 32, 128, 256, deflate_slow),
      /* 7 */
      new Config(32, 128, 258, 1024, deflate_slow),
      /* 8 */
      new Config(32, 258, 258, 4096, deflate_slow)
      /* 9 max compression */
    ];
    function lm_init(s2) {
      s2.window_size = 2 * s2.w_size;
      zero(s2.head);
      s2.max_lazy_match = configuration_table[s2.level].max_lazy;
      s2.good_match = configuration_table[s2.level].good_length;
      s2.nice_match = configuration_table[s2.level].nice_length;
      s2.max_chain_length = configuration_table[s2.level].max_chain;
      s2.strstart = 0;
      s2.block_start = 0;
      s2.lookahead = 0;
      s2.insert = 0;
      s2.match_length = s2.prev_length = MIN_MATCH - 1;
      s2.match_available = 0;
      s2.ins_h = 0;
    }
    function DeflateState() {
      this.strm = null;
      this.status = 0;
      this.pending_buf = null;
      this.pending_buf_size = 0;
      this.pending_out = 0;
      this.pending = 0;
      this.wrap = 0;
      this.gzhead = null;
      this.gzindex = 0;
      this.method = Z_DEFLATED;
      this.last_flush = -1;
      this.w_size = 0;
      this.w_bits = 0;
      this.w_mask = 0;
      this.window = null;
      this.window_size = 0;
      this.prev = null;
      this.head = null;
      this.ins_h = 0;
      this.hash_size = 0;
      this.hash_bits = 0;
      this.hash_mask = 0;
      this.hash_shift = 0;
      this.block_start = 0;
      this.match_length = 0;
      this.prev_match = 0;
      this.match_available = 0;
      this.strstart = 0;
      this.match_start = 0;
      this.lookahead = 0;
      this.prev_length = 0;
      this.max_chain_length = 0;
      this.max_lazy_match = 0;
      this.level = 0;
      this.strategy = 0;
      this.good_match = 0;
      this.nice_match = 0;
      this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
      this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
      this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
      zero(this.dyn_ltree);
      zero(this.dyn_dtree);
      zero(this.bl_tree);
      this.l_desc = null;
      this.d_desc = null;
      this.bl_desc = null;
      this.bl_count = new utils.Buf16(MAX_BITS + 1);
      this.heap = new utils.Buf16(2 * L_CODES + 1);
      zero(this.heap);
      this.heap_len = 0;
      this.heap_max = 0;
      this.depth = new utils.Buf16(2 * L_CODES + 1);
      zero(this.depth);
      this.l_buf = 0;
      this.lit_bufsize = 0;
      this.last_lit = 0;
      this.d_buf = 0;
      this.opt_len = 0;
      this.static_len = 0;
      this.matches = 0;
      this.insert = 0;
      this.bi_buf = 0;
      this.bi_valid = 0;
    }
    function deflateResetKeep(strm) {
      var s2;
      if (!strm || !strm.state) {
        return err(strm, Z_STREAM_ERROR);
      }
      strm.total_in = strm.total_out = 0;
      strm.data_type = Z_UNKNOWN;
      s2 = strm.state;
      s2.pending = 0;
      s2.pending_out = 0;
      if (s2.wrap < 0) {
        s2.wrap = -s2.wrap;
      }
      s2.status = s2.wrap ? INIT_STATE : BUSY_STATE;
      strm.adler = s2.wrap === 2 ? 0 : 1;
      s2.last_flush = Z_NO_FLUSH;
      trees._tr_init(s2);
      return Z_OK;
    }
    function deflateReset(strm) {
      var ret = deflateResetKeep(strm);
      if (ret === Z_OK) {
        lm_init(strm.state);
      }
      return ret;
    }
    function deflateSetHeader(strm, head) {
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      if (strm.state.wrap !== 2) {
        return Z_STREAM_ERROR;
      }
      strm.state.gzhead = head;
      return Z_OK;
    }
    function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
      if (!strm) {
        return Z_STREAM_ERROR;
      }
      var wrap = 1;
      if (level === Z_DEFAULT_COMPRESSION) {
        level = 6;
      }
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else if (windowBits > 15) {
        wrap = 2;
        windowBits -= 16;
      }
      if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
        return err(strm, Z_STREAM_ERROR);
      }
      if (windowBits === 8) {
        windowBits = 9;
      }
      var s2 = new DeflateState();
      strm.state = s2;
      s2.strm = strm;
      s2.wrap = wrap;
      s2.gzhead = null;
      s2.w_bits = windowBits;
      s2.w_size = 1 << s2.w_bits;
      s2.w_mask = s2.w_size - 1;
      s2.hash_bits = memLevel + 7;
      s2.hash_size = 1 << s2.hash_bits;
      s2.hash_mask = s2.hash_size - 1;
      s2.hash_shift = ~~((s2.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
      s2.window = new utils.Buf8(s2.w_size * 2);
      s2.head = new utils.Buf16(s2.hash_size);
      s2.prev = new utils.Buf16(s2.w_size);
      s2.lit_bufsize = 1 << memLevel + 6;
      s2.pending_buf_size = s2.lit_bufsize * 4;
      s2.pending_buf = new utils.Buf8(s2.pending_buf_size);
      s2.d_buf = 1 * s2.lit_bufsize;
      s2.l_buf = (1 + 2) * s2.lit_bufsize;
      s2.level = level;
      s2.strategy = strategy;
      s2.method = method;
      return deflateReset(strm);
    }
    function deflateInit(strm, level) {
      return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
    }
    function deflate(strm, flush) {
      var old_flush, s2;
      var beg, val;
      if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) {
        return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
      }
      s2 = strm.state;
      if (!strm.output || !strm.input && strm.avail_in !== 0 || s2.status === FINISH_STATE && flush !== Z_FINISH) {
        return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
      }
      s2.strm = strm;
      old_flush = s2.last_flush;
      s2.last_flush = flush;
      if (s2.status === INIT_STATE) {
        if (s2.wrap === 2) {
          strm.adler = 0;
          put_byte(s2, 31);
          put_byte(s2, 139);
          put_byte(s2, 8);
          if (!s2.gzhead) {
            put_byte(s2, 0);
            put_byte(s2, 0);
            put_byte(s2, 0);
            put_byte(s2, 0);
            put_byte(s2, 0);
            put_byte(s2, s2.level === 9 ? 2 : s2.strategy >= Z_HUFFMAN_ONLY || s2.level < 2 ? 4 : 0);
            put_byte(s2, OS_CODE);
            s2.status = BUSY_STATE;
          } else {
            put_byte(
              s2,
              (s2.gzhead.text ? 1 : 0) + (s2.gzhead.hcrc ? 2 : 0) + (!s2.gzhead.extra ? 0 : 4) + (!s2.gzhead.name ? 0 : 8) + (!s2.gzhead.comment ? 0 : 16)
            );
            put_byte(s2, s2.gzhead.time & 255);
            put_byte(s2, s2.gzhead.time >> 8 & 255);
            put_byte(s2, s2.gzhead.time >> 16 & 255);
            put_byte(s2, s2.gzhead.time >> 24 & 255);
            put_byte(s2, s2.level === 9 ? 2 : s2.strategy >= Z_HUFFMAN_ONLY || s2.level < 2 ? 4 : 0);
            put_byte(s2, s2.gzhead.os & 255);
            if (s2.gzhead.extra && s2.gzhead.extra.length) {
              put_byte(s2, s2.gzhead.extra.length & 255);
              put_byte(s2, s2.gzhead.extra.length >> 8 & 255);
            }
            if (s2.gzhead.hcrc) {
              strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending, 0);
            }
            s2.gzindex = 0;
            s2.status = EXTRA_STATE;
          }
        } else {
          var header = Z_DEFLATED + (s2.w_bits - 8 << 4) << 8;
          var level_flags = -1;
          if (s2.strategy >= Z_HUFFMAN_ONLY || s2.level < 2) {
            level_flags = 0;
          } else if (s2.level < 6) {
            level_flags = 1;
          } else if (s2.level === 6) {
            level_flags = 2;
          } else {
            level_flags = 3;
          }
          header |= level_flags << 6;
          if (s2.strstart !== 0) {
            header |= PRESET_DICT;
          }
          header += 31 - header % 31;
          s2.status = BUSY_STATE;
          putShortMSB(s2, header);
          if (s2.strstart !== 0) {
            putShortMSB(s2, strm.adler >>> 16);
            putShortMSB(s2, strm.adler & 65535);
          }
          strm.adler = 1;
        }
      }
      if (s2.status === EXTRA_STATE) {
        if (s2.gzhead.extra) {
          beg = s2.pending;
          while (s2.gzindex < (s2.gzhead.extra.length & 65535)) {
            if (s2.pending === s2.pending_buf_size) {
              if (s2.gzhead.hcrc && s2.pending > beg) {
                strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s2.pending;
              if (s2.pending === s2.pending_buf_size) {
                break;
              }
            }
            put_byte(s2, s2.gzhead.extra[s2.gzindex] & 255);
            s2.gzindex++;
          }
          if (s2.gzhead.hcrc && s2.pending > beg) {
            strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
          }
          if (s2.gzindex === s2.gzhead.extra.length) {
            s2.gzindex = 0;
            s2.status = NAME_STATE;
          }
        } else {
          s2.status = NAME_STATE;
        }
      }
      if (s2.status === NAME_STATE) {
        if (s2.gzhead.name) {
          beg = s2.pending;
          do {
            if (s2.pending === s2.pending_buf_size) {
              if (s2.gzhead.hcrc && s2.pending > beg) {
                strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s2.pending;
              if (s2.pending === s2.pending_buf_size) {
                val = 1;
                break;
              }
            }
            if (s2.gzindex < s2.gzhead.name.length) {
              val = s2.gzhead.name.charCodeAt(s2.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s2, val);
          } while (val !== 0);
          if (s2.gzhead.hcrc && s2.pending > beg) {
            strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
          }
          if (val === 0) {
            s2.gzindex = 0;
            s2.status = COMMENT_STATE;
          }
        } else {
          s2.status = COMMENT_STATE;
        }
      }
      if (s2.status === COMMENT_STATE) {
        if (s2.gzhead.comment) {
          beg = s2.pending;
          do {
            if (s2.pending === s2.pending_buf_size) {
              if (s2.gzhead.hcrc && s2.pending > beg) {
                strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s2.pending;
              if (s2.pending === s2.pending_buf_size) {
                val = 1;
                break;
              }
            }
            if (s2.gzindex < s2.gzhead.comment.length) {
              val = s2.gzhead.comment.charCodeAt(s2.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s2, val);
          } while (val !== 0);
          if (s2.gzhead.hcrc && s2.pending > beg) {
            strm.adler = crc32(strm.adler, s2.pending_buf, s2.pending - beg, beg);
          }
          if (val === 0) {
            s2.status = HCRC_STATE;
          }
        } else {
          s2.status = HCRC_STATE;
        }
      }
      if (s2.status === HCRC_STATE) {
        if (s2.gzhead.hcrc) {
          if (s2.pending + 2 > s2.pending_buf_size) {
            flush_pending(strm);
          }
          if (s2.pending + 2 <= s2.pending_buf_size) {
            put_byte(s2, strm.adler & 255);
            put_byte(s2, strm.adler >> 8 & 255);
            strm.adler = 0;
            s2.status = BUSY_STATE;
          }
        } else {
          s2.status = BUSY_STATE;
        }
      }
      if (s2.pending !== 0) {
        flush_pending(strm);
        if (strm.avail_out === 0) {
          s2.last_flush = -1;
          return Z_OK;
        }
      } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
        return err(strm, Z_BUF_ERROR);
      }
      if (s2.status === FINISH_STATE && strm.avail_in !== 0) {
        return err(strm, Z_BUF_ERROR);
      }
      if (strm.avail_in !== 0 || s2.lookahead !== 0 || flush !== Z_NO_FLUSH && s2.status !== FINISH_STATE) {
        var bstate = s2.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s2, flush) : s2.strategy === Z_RLE ? deflate_rle(s2, flush) : configuration_table[s2.level].func(s2, flush);
        if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
          s2.status = FINISH_STATE;
        }
        if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
          if (strm.avail_out === 0) {
            s2.last_flush = -1;
          }
          return Z_OK;
        }
        if (bstate === BS_BLOCK_DONE) {
          if (flush === Z_PARTIAL_FLUSH) {
            trees._tr_align(s2);
          } else if (flush !== Z_BLOCK) {
            trees._tr_stored_block(s2, 0, 0, false);
            if (flush === Z_FULL_FLUSH) {
              zero(s2.head);
              if (s2.lookahead === 0) {
                s2.strstart = 0;
                s2.block_start = 0;
                s2.insert = 0;
              }
            }
          }
          flush_pending(strm);
          if (strm.avail_out === 0) {
            s2.last_flush = -1;
            return Z_OK;
          }
        }
      }
      if (flush !== Z_FINISH) {
        return Z_OK;
      }
      if (s2.wrap <= 0) {
        return Z_STREAM_END;
      }
      if (s2.wrap === 2) {
        put_byte(s2, strm.adler & 255);
        put_byte(s2, strm.adler >> 8 & 255);
        put_byte(s2, strm.adler >> 16 & 255);
        put_byte(s2, strm.adler >> 24 & 255);
        put_byte(s2, strm.total_in & 255);
        put_byte(s2, strm.total_in >> 8 & 255);
        put_byte(s2, strm.total_in >> 16 & 255);
        put_byte(s2, strm.total_in >> 24 & 255);
      } else {
        putShortMSB(s2, strm.adler >>> 16);
        putShortMSB(s2, strm.adler & 65535);
      }
      flush_pending(strm);
      if (s2.wrap > 0) {
        s2.wrap = -s2.wrap;
      }
      return s2.pending !== 0 ? Z_OK : Z_STREAM_END;
    }
    function deflateEnd(strm) {
      var status;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      status = strm.state.status;
      if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
        return err(strm, Z_STREAM_ERROR);
      }
      strm.state = null;
      return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
    }
    function deflateSetDictionary(strm, dictionary) {
      var dictLength = dictionary.length;
      var s2;
      var str, n2;
      var wrap;
      var avail;
      var next;
      var input;
      var tmpDict;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      s2 = strm.state;
      wrap = s2.wrap;
      if (wrap === 2 || wrap === 1 && s2.status !== INIT_STATE || s2.lookahead) {
        return Z_STREAM_ERROR;
      }
      if (wrap === 1) {
        strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
      }
      s2.wrap = 0;
      if (dictLength >= s2.w_size) {
        if (wrap === 0) {
          zero(s2.head);
          s2.strstart = 0;
          s2.block_start = 0;
          s2.insert = 0;
        }
        tmpDict = new utils.Buf8(s2.w_size);
        utils.arraySet(tmpDict, dictionary, dictLength - s2.w_size, s2.w_size, 0);
        dictionary = tmpDict;
        dictLength = s2.w_size;
      }
      avail = strm.avail_in;
      next = strm.next_in;
      input = strm.input;
      strm.avail_in = dictLength;
      strm.next_in = 0;
      strm.input = dictionary;
      fill_window(s2);
      while (s2.lookahead >= MIN_MATCH) {
        str = s2.strstart;
        n2 = s2.lookahead - (MIN_MATCH - 1);
        do {
          s2.ins_h = (s2.ins_h << s2.hash_shift ^ s2.window[str + MIN_MATCH - 1]) & s2.hash_mask;
          s2.prev[str & s2.w_mask] = s2.head[s2.ins_h];
          s2.head[s2.ins_h] = str;
          str++;
        } while (--n2);
        s2.strstart = str;
        s2.lookahead = MIN_MATCH - 1;
        fill_window(s2);
      }
      s2.strstart += s2.lookahead;
      s2.block_start = s2.strstart;
      s2.insert = s2.lookahead;
      s2.lookahead = 0;
      s2.match_length = s2.prev_length = MIN_MATCH - 1;
      s2.match_available = 0;
      strm.next_in = next;
      strm.input = input;
      strm.avail_in = avail;
      s2.wrap = wrap;
      return Z_OK;
    }
    exports2.deflateInit = deflateInit;
    exports2.deflateInit2 = deflateInit2;
    exports2.deflateReset = deflateReset;
    exports2.deflateResetKeep = deflateResetKeep;
    exports2.deflateSetHeader = deflateSetHeader;
    exports2.deflate = deflate;
    exports2.deflateEnd = deflateEnd;
    exports2.deflateSetDictionary = deflateSetDictionary;
    exports2.deflateInfo = "pako deflate (from Nodeca project)";
  }
});

// node_modules/pako/lib/utils/strings.js
var require_strings = __commonJS({
  "node_modules/pako/lib/utils/strings.js"(exports2) {
    "use strict";
    var utils = require_common();
    var STR_APPLY_OK = true;
    var STR_APPLY_UIA_OK = true;
    try {
      String.fromCharCode.apply(null, [0]);
    } catch (__) {
      STR_APPLY_OK = false;
    }
    try {
      String.fromCharCode.apply(null, new Uint8Array(1));
    } catch (__) {
      STR_APPLY_UIA_OK = false;
    }
    var _utf8len = new utils.Buf8(256);
    for (q2 = 0; q2 < 256; q2++) {
      _utf8len[q2] = q2 >= 252 ? 6 : q2 >= 248 ? 5 : q2 >= 240 ? 4 : q2 >= 224 ? 3 : q2 >= 192 ? 2 : 1;
    }
    var q2;
    _utf8len[254] = _utf8len[254] = 1;
    exports2.string2buf = function(str) {
      var buf, c2, c22, m_pos, i2, str_len = str.length, buf_len = 0;
      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c2 = str.charCodeAt(m_pos);
        if ((c2 & 64512) === 55296 && m_pos + 1 < str_len) {
          c22 = str.charCodeAt(m_pos + 1);
          if ((c22 & 64512) === 56320) {
            c2 = 65536 + (c2 - 55296 << 10) + (c22 - 56320);
            m_pos++;
          }
        }
        buf_len += c2 < 128 ? 1 : c2 < 2048 ? 2 : c2 < 65536 ? 3 : 4;
      }
      buf = new utils.Buf8(buf_len);
      for (i2 = 0, m_pos = 0; i2 < buf_len; m_pos++) {
        c2 = str.charCodeAt(m_pos);
        if ((c2 & 64512) === 55296 && m_pos + 1 < str_len) {
          c22 = str.charCodeAt(m_pos + 1);
          if ((c22 & 64512) === 56320) {
            c2 = 65536 + (c2 - 55296 << 10) + (c22 - 56320);
            m_pos++;
          }
        }
        if (c2 < 128) {
          buf[i2++] = c2;
        } else if (c2 < 2048) {
          buf[i2++] = 192 | c2 >>> 6;
          buf[i2++] = 128 | c2 & 63;
        } else if (c2 < 65536) {
          buf[i2++] = 224 | c2 >>> 12;
          buf[i2++] = 128 | c2 >>> 6 & 63;
          buf[i2++] = 128 | c2 & 63;
        } else {
          buf[i2++] = 240 | c2 >>> 18;
          buf[i2++] = 128 | c2 >>> 12 & 63;
          buf[i2++] = 128 | c2 >>> 6 & 63;
          buf[i2++] = 128 | c2 & 63;
        }
      }
      return buf;
    };
    function buf2binstring(buf, len) {
      if (len < 65537) {
        if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) {
          return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
        }
      }
      var result = "";
      for (var i2 = 0; i2 < len; i2++) {
        result += String.fromCharCode(buf[i2]);
      }
      return result;
    }
    exports2.buf2binstring = function(buf) {
      return buf2binstring(buf, buf.length);
    };
    exports2.binstring2buf = function(str) {
      var buf = new utils.Buf8(str.length);
      for (var i2 = 0, len = buf.length; i2 < len; i2++) {
        buf[i2] = str.charCodeAt(i2);
      }
      return buf;
    };
    exports2.buf2string = function(buf, max) {
      var i2, out, c2, c_len;
      var len = max || buf.length;
      var utf16buf = new Array(len * 2);
      for (out = 0, i2 = 0; i2 < len; ) {
        c2 = buf[i2++];
        if (c2 < 128) {
          utf16buf[out++] = c2;
          continue;
        }
        c_len = _utf8len[c2];
        if (c_len > 4) {
          utf16buf[out++] = 65533;
          i2 += c_len - 1;
          continue;
        }
        c2 &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
        while (c_len > 1 && i2 < len) {
          c2 = c2 << 6 | buf[i2++] & 63;
          c_len--;
        }
        if (c_len > 1) {
          utf16buf[out++] = 65533;
          continue;
        }
        if (c2 < 65536) {
          utf16buf[out++] = c2;
        } else {
          c2 -= 65536;
          utf16buf[out++] = 55296 | c2 >> 10 & 1023;
          utf16buf[out++] = 56320 | c2 & 1023;
        }
      }
      return buf2binstring(utf16buf, out);
    };
    exports2.utf8border = function(buf, max) {
      var pos;
      max = max || buf.length;
      if (max > buf.length) {
        max = buf.length;
      }
      pos = max - 1;
      while (pos >= 0 && (buf[pos] & 192) === 128) {
        pos--;
      }
      if (pos < 0) {
        return max;
      }
      if (pos === 0) {
        return max;
      }
      return pos + _utf8len[buf[pos]] > max ? pos : max;
    };
  }
});

// node_modules/pako/lib/zlib/zstream.js
var require_zstream = __commonJS({
  "node_modules/pako/lib/zlib/zstream.js"(exports2, module2) {
    "use strict";
    function ZStream() {
      this.input = null;
      this.next_in = 0;
      this.avail_in = 0;
      this.total_in = 0;
      this.output = null;
      this.next_out = 0;
      this.avail_out = 0;
      this.total_out = 0;
      this.msg = "";
      this.state = null;
      this.data_type = 2;
      this.adler = 0;
    }
    module2.exports = ZStream;
  }
});

// node_modules/pako/lib/deflate.js
var require_deflate2 = __commonJS({
  "node_modules/pako/lib/deflate.js"(exports2) {
    "use strict";
    var zlib_deflate = require_deflate();
    var utils = require_common();
    var strings = require_strings();
    var msg = require_messages();
    var ZStream = require_zstream();
    var toString = Object.prototype.toString;
    var Z_NO_FLUSH = 0;
    var Z_FINISH = 4;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_SYNC_FLUSH = 2;
    var Z_DEFAULT_COMPRESSION = -1;
    var Z_DEFAULT_STRATEGY = 0;
    var Z_DEFLATED = 8;
    function Deflate(options) {
      if (!(this instanceof Deflate)) return new Deflate(options);
      this.options = utils.assign({
        level: Z_DEFAULT_COMPRESSION,
        method: Z_DEFLATED,
        chunkSize: 16384,
        windowBits: 15,
        memLevel: 8,
        strategy: Z_DEFAULT_STRATEGY,
        to: ""
      }, options || {});
      var opt = this.options;
      if (opt.raw && opt.windowBits > 0) {
        opt.windowBits = -opt.windowBits;
      } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
        opt.windowBits += 16;
      }
      this.err = 0;
      this.msg = "";
      this.ended = false;
      this.chunks = [];
      this.strm = new ZStream();
      this.strm.avail_out = 0;
      var status = zlib_deflate.deflateInit2(
        this.strm,
        opt.level,
        opt.method,
        opt.windowBits,
        opt.memLevel,
        opt.strategy
      );
      if (status !== Z_OK) {
        throw new Error(msg[status]);
      }
      if (opt.header) {
        zlib_deflate.deflateSetHeader(this.strm, opt.header);
      }
      if (opt.dictionary) {
        var dict;
        if (typeof opt.dictionary === "string") {
          dict = strings.string2buf(opt.dictionary);
        } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
          dict = new Uint8Array(opt.dictionary);
        } else {
          dict = opt.dictionary;
        }
        status = zlib_deflate.deflateSetDictionary(this.strm, dict);
        if (status !== Z_OK) {
          throw new Error(msg[status]);
        }
        this._dict_set = true;
      }
    }
    Deflate.prototype.push = function(data, mode) {
      var strm = this.strm;
      var chunkSize = this.options.chunkSize;
      var status, _mode;
      if (this.ended) {
        return false;
      }
      _mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
      if (typeof data === "string") {
        strm.input = strings.string2buf(data);
      } else if (toString.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      do {
        if (strm.avail_out === 0) {
          strm.output = new utils.Buf8(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = zlib_deflate.deflate(strm, _mode);
        if (status !== Z_STREAM_END && status !== Z_OK) {
          this.onEnd(status);
          this.ended = true;
          return false;
        }
        if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) {
          if (this.options.to === "string") {
            this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
          } else {
            this.onData(utils.shrinkBuf(strm.output, strm.next_out));
          }
        }
      } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
      if (_mode === Z_FINISH) {
        status = zlib_deflate.deflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === Z_OK;
      }
      if (_mode === Z_SYNC_FLUSH) {
        this.onEnd(Z_OK);
        strm.avail_out = 0;
        return true;
      }
      return true;
    };
    Deflate.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Deflate.prototype.onEnd = function(status) {
      if (status === Z_OK) {
        if (this.options.to === "string") {
          this.result = this.chunks.join("");
        } else {
          this.result = utils.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    function deflate(input, options) {
      var deflator = new Deflate(options);
      deflator.push(input, true);
      if (deflator.err) {
        throw deflator.msg;
      }
      return deflator.result;
    }
    function deflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return deflate(input, options);
    }
    function gzip(input, options) {
      options = options || {};
      options.gzip = true;
      return deflate(input, options);
    }
    exports2.Deflate = Deflate;
    exports2.deflate = deflate;
    exports2.deflateRaw = deflateRaw;
    exports2.gzip = gzip;
  }
});

// node_modules/pako/lib/zlib/inffast.js
var require_inffast = __commonJS({
  "node_modules/pako/lib/zlib/inffast.js"(exports2, module2) {
    "use strict";
    var BAD = 30;
    var TYPE = 12;
    module2.exports = function inflate_fast(strm, start) {
      var state;
      var _in;
      var last;
      var _out;
      var beg;
      var end;
      var dmax;
      var wsize;
      var whave;
      var wnext;
      var s_window;
      var hold;
      var bits;
      var lcode;
      var dcode;
      var lmask;
      var dmask;
      var here;
      var op;
      var len;
      var dist;
      var from;
      var from_source;
      var input, output;
      state = strm.state;
      _in = strm.next_in;
      input = strm.input;
      last = _in + (strm.avail_in - 5);
      _out = strm.next_out;
      output = strm.output;
      beg = _out - (start - strm.avail_out);
      end = _out + (strm.avail_out - 257);
      dmax = state.dmax;
      wsize = state.wsize;
      whave = state.whave;
      wnext = state.wnext;
      s_window = state.window;
      hold = state.hold;
      bits = state.bits;
      lcode = state.lencode;
      dcode = state.distcode;
      lmask = (1 << state.lenbits) - 1;
      dmask = (1 << state.distbits) - 1;
      top:
        do {
          if (bits < 15) {
            hold += input[_in++] << bits;
            bits += 8;
            hold += input[_in++] << bits;
            bits += 8;
          }
          here = lcode[hold & lmask];
          dolen:
            for (; ; ) {
              op = here >>> 24;
              hold >>>= op;
              bits -= op;
              op = here >>> 16 & 255;
              if (op === 0) {
                output[_out++] = here & 65535;
              } else if (op & 16) {
                len = here & 65535;
                op &= 15;
                if (op) {
                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                  len += hold & (1 << op) - 1;
                  hold >>>= op;
                  bits -= op;
                }
                if (bits < 15) {
                  hold += input[_in++] << bits;
                  bits += 8;
                  hold += input[_in++] << bits;
                  bits += 8;
                }
                here = dcode[hold & dmask];
                dodist:
                  for (; ; ) {
                    op = here >>> 24;
                    hold >>>= op;
                    bits -= op;
                    op = here >>> 16 & 255;
                    if (op & 16) {
                      dist = here & 65535;
                      op &= 15;
                      if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                        if (bits < op) {
                          hold += input[_in++] << bits;
                          bits += 8;
                        }
                      }
                      dist += hold & (1 << op) - 1;
                      if (dist > dmax) {
                        strm.msg = "invalid distance too far back";
                        state.mode = BAD;
                        break top;
                      }
                      hold >>>= op;
                      bits -= op;
                      op = _out - beg;
                      if (dist > op) {
                        op = dist - op;
                        if (op > whave) {
                          if (state.sane) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD;
                            break top;
                          }
                        }
                        from = 0;
                        from_source = s_window;
                        if (wnext === 0) {
                          from += wsize - op;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist;
                            from_source = output;
                          }
                        } else if (wnext < op) {
                          from += wsize + wnext - op;
                          op -= wnext;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = 0;
                            if (wnext < len) {
                              op = wnext;
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          }
                        } else {
                          from += wnext - op;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist;
                            from_source = output;
                          }
                        }
                        while (len > 2) {
                          output[_out++] = from_source[from++];
                          output[_out++] = from_source[from++];
                          output[_out++] = from_source[from++];
                          len -= 3;
                        }
                        if (len) {
                          output[_out++] = from_source[from++];
                          if (len > 1) {
                            output[_out++] = from_source[from++];
                          }
                        }
                      } else {
                        from = _out - dist;
                        do {
                          output[_out++] = output[from++];
                          output[_out++] = output[from++];
                          output[_out++] = output[from++];
                          len -= 3;
                        } while (len > 2);
                        if (len) {
                          output[_out++] = output[from++];
                          if (len > 1) {
                            output[_out++] = output[from++];
                          }
                        }
                      }
                    } else if ((op & 64) === 0) {
                      here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                      continue dodist;
                    } else {
                      strm.msg = "invalid distance code";
                      state.mode = BAD;
                      break top;
                    }
                    break;
                  }
              } else if ((op & 64) === 0) {
                here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                continue dolen;
              } else if (op & 32) {
                state.mode = TYPE;
                break top;
              } else {
                strm.msg = "invalid literal/length code";
                state.mode = BAD;
                break top;
              }
              break;
            }
        } while (_in < last && _out < end);
      len = bits >> 3;
      _in -= len;
      bits -= len << 3;
      hold &= (1 << bits) - 1;
      strm.next_in = _in;
      strm.next_out = _out;
      strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
      strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
      state.hold = hold;
      state.bits = bits;
      return;
    };
  }
});

// node_modules/pako/lib/zlib/inftrees.js
var require_inftrees = __commonJS({
  "node_modules/pako/lib/zlib/inftrees.js"(exports2, module2) {
    "use strict";
    var utils = require_common();
    var MAXBITS = 15;
    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;
    var lbase = [
      /* Length codes 257..285 base */
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      13,
      15,
      17,
      19,
      23,
      27,
      31,
      35,
      43,
      51,
      59,
      67,
      83,
      99,
      115,
      131,
      163,
      195,
      227,
      258,
      0,
      0
    ];
    var lext = [
      /* Length codes 257..285 extra */
      16,
      16,
      16,
      16,
      16,
      16,
      16,
      16,
      17,
      17,
      17,
      17,
      18,
      18,
      18,
      18,
      19,
      19,
      19,
      19,
      20,
      20,
      20,
      20,
      21,
      21,
      21,
      21,
      16,
      72,
      78
    ];
    var dbase = [
      /* Distance codes 0..29 base */
      1,
      2,
      3,
      4,
      5,
      7,
      9,
      13,
      17,
      25,
      33,
      49,
      65,
      97,
      129,
      193,
      257,
      385,
      513,
      769,
      1025,
      1537,
      2049,
      3073,
      4097,
      6145,
      8193,
      12289,
      16385,
      24577,
      0,
      0
    ];
    var dext = [
      /* Distance codes 0..29 extra */
      16,
      16,
      16,
      16,
      17,
      17,
      18,
      18,
      19,
      19,
      20,
      20,
      21,
      21,
      22,
      22,
      23,
      23,
      24,
      24,
      25,
      25,
      26,
      26,
      27,
      27,
      28,
      28,
      29,
      29,
      64,
      64
    ];
    module2.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
      var bits = opts.bits;
      var len = 0;
      var sym = 0;
      var min = 0, max = 0;
      var root = 0;
      var curr = 0;
      var drop = 0;
      var left = 0;
      var used = 0;
      var huff = 0;
      var incr;
      var fill;
      var low;
      var mask;
      var next;
      var base = null;
      var base_index = 0;
      var end;
      var count = new utils.Buf16(MAXBITS + 1);
      var offs = new utils.Buf16(MAXBITS + 1);
      var extra = null;
      var extra_index = 0;
      var here_bits, here_op, here_val;
      for (len = 0; len <= MAXBITS; len++) {
        count[len] = 0;
      }
      for (sym = 0; sym < codes; sym++) {
        count[lens[lens_index + sym]]++;
      }
      root = bits;
      for (max = MAXBITS; max >= 1; max--) {
        if (count[max] !== 0) {
          break;
        }
      }
      if (root > max) {
        root = max;
      }
      if (max === 0) {
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        opts.bits = 1;
        return 0;
      }
      for (min = 1; min < max; min++) {
        if (count[min] !== 0) {
          break;
        }
      }
      if (root < min) {
        root = min;
      }
      left = 1;
      for (len = 1; len <= MAXBITS; len++) {
        left <<= 1;
        left -= count[len];
        if (left < 0) {
          return -1;
        }
      }
      if (left > 0 && (type === CODES || max !== 1)) {
        return -1;
      }
      offs[1] = 0;
      for (len = 1; len < MAXBITS; len++) {
        offs[len + 1] = offs[len] + count[len];
      }
      for (sym = 0; sym < codes; sym++) {
        if (lens[lens_index + sym] !== 0) {
          work[offs[lens[lens_index + sym]]++] = sym;
        }
      }
      if (type === CODES) {
        base = extra = work;
        end = 19;
      } else if (type === LENS) {
        base = lbase;
        base_index -= 257;
        extra = lext;
        extra_index -= 257;
        end = 256;
      } else {
        base = dbase;
        extra = dext;
        end = -1;
      }
      huff = 0;
      sym = 0;
      len = min;
      next = table_index;
      curr = root;
      drop = 0;
      low = -1;
      used = 1 << root;
      mask = used - 1;
      if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
        return 1;
      }
      var i2 = 0;
      for (; ; ) {
        i2++;
        here_bits = len - drop;
        if (work[sym] < end) {
          here_op = 0;
          here_val = work[sym];
        } else if (work[sym] > end) {
          here_op = extra[extra_index + work[sym]];
          here_val = base[base_index + work[sym]];
        } else {
          here_op = 32 + 64;
          here_val = 0;
        }
        incr = 1 << len - drop;
        fill = 1 << curr;
        min = fill;
        do {
          fill -= incr;
          table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
        } while (fill !== 0);
        incr = 1 << len - 1;
        while (huff & incr) {
          incr >>= 1;
        }
        if (incr !== 0) {
          huff &= incr - 1;
          huff += incr;
        } else {
          huff = 0;
        }
        sym++;
        if (--count[len] === 0) {
          if (len === max) {
            break;
          }
          len = lens[lens_index + work[sym]];
        }
        if (len > root && (huff & mask) !== low) {
          if (drop === 0) {
            drop = root;
          }
          next += min;
          curr = len - drop;
          left = 1 << curr;
          while (curr + drop < max) {
            left -= count[curr + drop];
            if (left <= 0) {
              break;
            }
            curr++;
            left <<= 1;
          }
          used += 1 << curr;
          if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
            return 1;
          }
          low = huff & mask;
          table[low] = root << 24 | curr << 16 | next - table_index | 0;
        }
      }
      if (huff !== 0) {
        table[next + huff] = len - drop << 24 | 64 << 16 | 0;
      }
      opts.bits = root;
      return 0;
    };
  }
});

// node_modules/pako/lib/zlib/inflate.js
var require_inflate = __commonJS({
  "node_modules/pako/lib/zlib/inflate.js"(exports2) {
    "use strict";
    var utils = require_common();
    var adler32 = require_adler32();
    var crc32 = require_crc32();
    var inflate_fast = require_inffast();
    var inflate_table = require_inftrees();
    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;
    var Z_FINISH = 4;
    var Z_BLOCK = 5;
    var Z_TREES = 6;
    var Z_OK = 0;
    var Z_STREAM_END = 1;
    var Z_NEED_DICT = 2;
    var Z_STREAM_ERROR = -2;
    var Z_DATA_ERROR = -3;
    var Z_MEM_ERROR = -4;
    var Z_BUF_ERROR = -5;
    var Z_DEFLATED = 8;
    var HEAD = 1;
    var FLAGS = 2;
    var TIME = 3;
    var OS = 4;
    var EXLEN = 5;
    var EXTRA = 6;
    var NAME = 7;
    var COMMENT = 8;
    var HCRC = 9;
    var DICTID = 10;
    var DICT = 11;
    var TYPE = 12;
    var TYPEDO = 13;
    var STORED = 14;
    var COPY_ = 15;
    var COPY = 16;
    var TABLE = 17;
    var LENLENS = 18;
    var CODELENS = 19;
    var LEN_ = 20;
    var LEN = 21;
    var LENEXT = 22;
    var DIST = 23;
    var DISTEXT = 24;
    var MATCH = 25;
    var LIT = 26;
    var CHECK = 27;
    var LENGTH = 28;
    var DONE = 29;
    var BAD = 30;
    var MEM = 31;
    var SYNC = 32;
    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
    var MAX_WBITS = 15;
    var DEF_WBITS = MAX_WBITS;
    function zswap32(q2) {
      return (q2 >>> 24 & 255) + (q2 >>> 8 & 65280) + ((q2 & 65280) << 8) + ((q2 & 255) << 24);
    }
    function InflateState() {
      this.mode = 0;
      this.last = false;
      this.wrap = 0;
      this.havedict = false;
      this.flags = 0;
      this.dmax = 0;
      this.check = 0;
      this.total = 0;
      this.head = null;
      this.wbits = 0;
      this.wsize = 0;
      this.whave = 0;
      this.wnext = 0;
      this.window = null;
      this.hold = 0;
      this.bits = 0;
      this.length = 0;
      this.offset = 0;
      this.extra = 0;
      this.lencode = null;
      this.distcode = null;
      this.lenbits = 0;
      this.distbits = 0;
      this.ncode = 0;
      this.nlen = 0;
      this.ndist = 0;
      this.have = 0;
      this.next = null;
      this.lens = new utils.Buf16(320);
      this.work = new utils.Buf16(288);
      this.lendyn = null;
      this.distdyn = null;
      this.sane = 0;
      this.back = 0;
      this.was = 0;
    }
    function inflateResetKeep(strm) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      strm.total_in = strm.total_out = state.total = 0;
      strm.msg = "";
      if (state.wrap) {
        strm.adler = state.wrap & 1;
      }
      state.mode = HEAD;
      state.last = 0;
      state.havedict = 0;
      state.dmax = 32768;
      state.head = null;
      state.hold = 0;
      state.bits = 0;
      state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
      state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
      state.sane = 1;
      state.back = -1;
      return Z_OK;
    }
    function inflateReset(strm) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      state.wsize = 0;
      state.whave = 0;
      state.wnext = 0;
      return inflateResetKeep(strm);
    }
    function inflateReset2(strm, windowBits) {
      var wrap;
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else {
        wrap = (windowBits >> 4) + 1;
        if (windowBits < 48) {
          windowBits &= 15;
        }
      }
      if (windowBits && (windowBits < 8 || windowBits > 15)) {
        return Z_STREAM_ERROR;
      }
      if (state.window !== null && state.wbits !== windowBits) {
        state.window = null;
      }
      state.wrap = wrap;
      state.wbits = windowBits;
      return inflateReset(strm);
    }
    function inflateInit2(strm, windowBits) {
      var ret;
      var state;
      if (!strm) {
        return Z_STREAM_ERROR;
      }
      state = new InflateState();
      strm.state = state;
      state.window = null;
      ret = inflateReset2(strm, windowBits);
      if (ret !== Z_OK) {
        strm.state = null;
      }
      return ret;
    }
    function inflateInit(strm) {
      return inflateInit2(strm, DEF_WBITS);
    }
    var virgin = true;
    var lenfix;
    var distfix;
    function fixedtables(state) {
      if (virgin) {
        var sym;
        lenfix = new utils.Buf32(512);
        distfix = new utils.Buf32(32);
        sym = 0;
        while (sym < 144) {
          state.lens[sym++] = 8;
        }
        while (sym < 256) {
          state.lens[sym++] = 9;
        }
        while (sym < 280) {
          state.lens[sym++] = 7;
        }
        while (sym < 288) {
          state.lens[sym++] = 8;
        }
        inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
        sym = 0;
        while (sym < 32) {
          state.lens[sym++] = 5;
        }
        inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
        virgin = false;
      }
      state.lencode = lenfix;
      state.lenbits = 9;
      state.distcode = distfix;
      state.distbits = 5;
    }
    function updatewindow(strm, src, end, copy) {
      var dist;
      var state = strm.state;
      if (state.window === null) {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;
        state.window = new utils.Buf8(state.wsize);
      }
      if (copy >= state.wsize) {
        utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
        state.wnext = 0;
        state.whave = state.wsize;
      } else {
        dist = state.wsize - state.wnext;
        if (dist > copy) {
          dist = copy;
        }
        utils.arraySet(state.window, src, end - copy, dist, state.wnext);
        copy -= dist;
        if (copy) {
          utils.arraySet(state.window, src, end - copy, copy, 0);
          state.wnext = copy;
          state.whave = state.wsize;
        } else {
          state.wnext += dist;
          if (state.wnext === state.wsize) {
            state.wnext = 0;
          }
          if (state.whave < state.wsize) {
            state.whave += dist;
          }
        }
      }
      return 0;
    }
    function inflate(strm, flush) {
      var state;
      var input, output;
      var next;
      var put;
      var have, left;
      var hold;
      var bits;
      var _in, _out;
      var copy;
      var from;
      var from_source;
      var here = 0;
      var here_bits, here_op, here_val;
      var last_bits, last_op, last_val;
      var len;
      var ret;
      var hbuf = new utils.Buf8(4);
      var opts;
      var n2;
      var order = (
        /* permutation of code lengths */
        [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
      );
      if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (state.mode === TYPE) {
        state.mode = TYPEDO;
      }
      put = strm.next_out;
      output = strm.output;
      left = strm.avail_out;
      next = strm.next_in;
      input = strm.input;
      have = strm.avail_in;
      hold = state.hold;
      bits = state.bits;
      _in = have;
      _out = left;
      ret = Z_OK;
      inf_leave:
        for (; ; ) {
          switch (state.mode) {
            case HEAD:
              if (state.wrap === 0) {
                state.mode = TYPEDO;
                break;
              }
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.wrap & 2 && hold === 35615) {
                state.check = 0;
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
                hold = 0;
                bits = 0;
                state.mode = FLAGS;
                break;
              }
              state.flags = 0;
              if (state.head) {
                state.head.done = false;
              }
              if (!(state.wrap & 1) || /* check if zlib header allowed */
              (((hold & 255) << 8) + (hold >> 8)) % 31) {
                strm.msg = "incorrect header check";
                state.mode = BAD;
                break;
              }
              if ((hold & 15) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD;
                break;
              }
              hold >>>= 4;
              bits -= 4;
              len = (hold & 15) + 8;
              if (state.wbits === 0) {
                state.wbits = len;
              } else if (len > state.wbits) {
                strm.msg = "invalid window size";
                state.mode = BAD;
                break;
              }
              state.dmax = 1 << len;
              strm.adler = state.check = 1;
              state.mode = hold & 512 ? DICTID : TYPE;
              hold = 0;
              bits = 0;
              break;
            case FLAGS:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.flags = hold;
              if ((state.flags & 255) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD;
                break;
              }
              if (state.flags & 57344) {
                strm.msg = "unknown header flags set";
                state.mode = BAD;
                break;
              }
              if (state.head) {
                state.head.text = hold >> 8 & 1;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = TIME;
            /* falls through */
            case TIME:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.time = hold;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                hbuf[2] = hold >>> 16 & 255;
                hbuf[3] = hold >>> 24 & 255;
                state.check = crc32(state.check, hbuf, 4, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = OS;
            /* falls through */
            case OS:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.xflags = hold & 255;
                state.head.os = hold >> 8;
              }
              if (state.flags & 512) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = EXLEN;
            /* falls through */
            case EXLEN:
              if (state.flags & 1024) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.length = hold;
                if (state.head) {
                  state.head.extra_len = hold;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
              } else if (state.head) {
                state.head.extra = null;
              }
              state.mode = EXTRA;
            /* falls through */
            case EXTRA:
              if (state.flags & 1024) {
                copy = state.length;
                if (copy > have) {
                  copy = have;
                }
                if (copy) {
                  if (state.head) {
                    len = state.head.extra_len - state.length;
                    if (!state.head.extra) {
                      state.head.extra = new Array(state.head.extra_len);
                    }
                    utils.arraySet(
                      state.head.extra,
                      input,
                      next,
                      // extra field is limited to 65536 bytes
                      // - no need for additional size check
                      copy,
                      /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                      len
                    );
                  }
                  if (state.flags & 512) {
                    state.check = crc32(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  state.length -= copy;
                }
                if (state.length) {
                  break inf_leave;
                }
              }
              state.length = 0;
              state.mode = NAME;
            /* falls through */
            case NAME:
              if (state.flags & 2048) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.name += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512) {
                  state.check = crc32(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.name = null;
              }
              state.length = 0;
              state.mode = COMMENT;
            /* falls through */
            case COMMENT:
              if (state.flags & 4096) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.comment += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512) {
                  state.check = crc32(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.comment = null;
              }
              state.mode = HCRC;
            /* falls through */
            case HCRC:
              if (state.flags & 512) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (hold !== (state.check & 65535)) {
                  strm.msg = "header crc mismatch";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              if (state.head) {
                state.head.hcrc = state.flags >> 9 & 1;
                state.head.done = true;
              }
              strm.adler = state.check = 0;
              state.mode = TYPE;
              break;
            case DICTID:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              strm.adler = state.check = zswap32(hold);
              hold = 0;
              bits = 0;
              state.mode = DICT;
            /* falls through */
            case DICT:
              if (state.havedict === 0) {
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                return Z_NEED_DICT;
              }
              strm.adler = state.check = 1;
              state.mode = TYPE;
            /* falls through */
            case TYPE:
              if (flush === Z_BLOCK || flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case TYPEDO:
              if (state.last) {
                hold >>>= bits & 7;
                bits -= bits & 7;
                state.mode = CHECK;
                break;
              }
              while (bits < 3) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.last = hold & 1;
              hold >>>= 1;
              bits -= 1;
              switch (hold & 3) {
                case 0:
                  state.mode = STORED;
                  break;
                case 1:
                  fixedtables(state);
                  state.mode = LEN_;
                  if (flush === Z_TREES) {
                    hold >>>= 2;
                    bits -= 2;
                    break inf_leave;
                  }
                  break;
                case 2:
                  state.mode = TABLE;
                  break;
                case 3:
                  strm.msg = "invalid block type";
                  state.mode = BAD;
              }
              hold >>>= 2;
              bits -= 2;
              break;
            case STORED:
              hold >>>= bits & 7;
              bits -= bits & 7;
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                strm.msg = "invalid stored block lengths";
                state.mode = BAD;
                break;
              }
              state.length = hold & 65535;
              hold = 0;
              bits = 0;
              state.mode = COPY_;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case COPY_:
              state.mode = COPY;
            /* falls through */
            case COPY:
              copy = state.length;
              if (copy) {
                if (copy > have) {
                  copy = have;
                }
                if (copy > left) {
                  copy = left;
                }
                if (copy === 0) {
                  break inf_leave;
                }
                utils.arraySet(output, input, next, copy, put);
                have -= copy;
                next += copy;
                left -= copy;
                put += copy;
                state.length -= copy;
                break;
              }
              state.mode = TYPE;
              break;
            case TABLE:
              while (bits < 14) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.nlen = (hold & 31) + 257;
              hold >>>= 5;
              bits -= 5;
              state.ndist = (hold & 31) + 1;
              hold >>>= 5;
              bits -= 5;
              state.ncode = (hold & 15) + 4;
              hold >>>= 4;
              bits -= 4;
              if (state.nlen > 286 || state.ndist > 30) {
                strm.msg = "too many length or distance symbols";
                state.mode = BAD;
                break;
              }
              state.have = 0;
              state.mode = LENLENS;
            /* falls through */
            case LENLENS:
              while (state.have < state.ncode) {
                while (bits < 3) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.lens[order[state.have++]] = hold & 7;
                hold >>>= 3;
                bits -= 3;
              }
              while (state.have < 19) {
                state.lens[order[state.have++]] = 0;
              }
              state.lencode = state.lendyn;
              state.lenbits = 7;
              opts = { bits: state.lenbits };
              ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret) {
                strm.msg = "invalid code lengths set";
                state.mode = BAD;
                break;
              }
              state.have = 0;
              state.mode = CODELENS;
            /* falls through */
            case CODELENS:
              while (state.have < state.nlen + state.ndist) {
                for (; ; ) {
                  here = state.lencode[hold & (1 << state.lenbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (here_val < 16) {
                  hold >>>= here_bits;
                  bits -= here_bits;
                  state.lens[state.have++] = here_val;
                } else {
                  if (here_val === 16) {
                    n2 = here_bits + 2;
                    while (bits < n2) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    if (state.have === 0) {
                      strm.msg = "invalid bit length repeat";
                      state.mode = BAD;
                      break;
                    }
                    len = state.lens[state.have - 1];
                    copy = 3 + (hold & 3);
                    hold >>>= 2;
                    bits -= 2;
                  } else if (here_val === 17) {
                    n2 = here_bits + 3;
                    while (bits < n2) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    len = 0;
                    copy = 3 + (hold & 7);
                    hold >>>= 3;
                    bits -= 3;
                  } else {
                    n2 = here_bits + 7;
                    while (bits < n2) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    len = 0;
                    copy = 11 + (hold & 127);
                    hold >>>= 7;
                    bits -= 7;
                  }
                  if (state.have + copy > state.nlen + state.ndist) {
                    strm.msg = "invalid bit length repeat";
                    state.mode = BAD;
                    break;
                  }
                  while (copy--) {
                    state.lens[state.have++] = len;
                  }
                }
              }
              if (state.mode === BAD) {
                break;
              }
              if (state.lens[256] === 0) {
                strm.msg = "invalid code -- missing end-of-block";
                state.mode = BAD;
                break;
              }
              state.lenbits = 9;
              opts = { bits: state.lenbits };
              ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret) {
                strm.msg = "invalid literal/lengths set";
                state.mode = BAD;
                break;
              }
              state.distbits = 6;
              state.distcode = state.distdyn;
              opts = { bits: state.distbits };
              ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
              state.distbits = opts.bits;
              if (ret) {
                strm.msg = "invalid distances set";
                state.mode = BAD;
                break;
              }
              state.mode = LEN_;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case LEN_:
              state.mode = LEN;
            /* falls through */
            case LEN:
              if (have >= 6 && left >= 258) {
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                inflate_fast(strm, _out);
                put = strm.next_out;
                output = strm.output;
                left = strm.avail_out;
                next = strm.next_in;
                input = strm.input;
                have = strm.avail_in;
                hold = state.hold;
                bits = state.bits;
                if (state.mode === TYPE) {
                  state.back = -1;
                }
                break;
              }
              state.back = 0;
              for (; ; ) {
                here = state.lencode[hold & (1 << state.lenbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (here_op && (here_op & 240) === 0) {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (; ; ) {
                  here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= last_bits;
                bits -= last_bits;
                state.back += last_bits;
              }
              hold >>>= here_bits;
              bits -= here_bits;
              state.back += here_bits;
              state.length = here_val;
              if (here_op === 0) {
                state.mode = LIT;
                break;
              }
              if (here_op & 32) {
                state.back = -1;
                state.mode = TYPE;
                break;
              }
              if (here_op & 64) {
                strm.msg = "invalid literal/length code";
                state.mode = BAD;
                break;
              }
              state.extra = here_op & 15;
              state.mode = LENEXT;
            /* falls through */
            case LENEXT:
              if (state.extra) {
                n2 = state.extra;
                while (bits < n2) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.length += hold & (1 << state.extra) - 1;
                hold >>>= state.extra;
                bits -= state.extra;
                state.back += state.extra;
              }
              state.was = state.length;
              state.mode = DIST;
            /* falls through */
            case DIST:
              for (; ; ) {
                here = state.distcode[hold & (1 << state.distbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if ((here_op & 240) === 0) {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (; ; ) {
                  here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= last_bits;
                bits -= last_bits;
                state.back += last_bits;
              }
              hold >>>= here_bits;
              bits -= here_bits;
              state.back += here_bits;
              if (here_op & 64) {
                strm.msg = "invalid distance code";
                state.mode = BAD;
                break;
              }
              state.offset = here_val;
              state.extra = here_op & 15;
              state.mode = DISTEXT;
            /* falls through */
            case DISTEXT:
              if (state.extra) {
                n2 = state.extra;
                while (bits < n2) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.offset += hold & (1 << state.extra) - 1;
                hold >>>= state.extra;
                bits -= state.extra;
                state.back += state.extra;
              }
              if (state.offset > state.dmax) {
                strm.msg = "invalid distance too far back";
                state.mode = BAD;
                break;
              }
              state.mode = MATCH;
            /* falls through */
            case MATCH:
              if (left === 0) {
                break inf_leave;
              }
              copy = _out - left;
              if (state.offset > copy) {
                copy = state.offset - copy;
                if (copy > state.whave) {
                  if (state.sane) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD;
                    break;
                  }
                }
                if (copy > state.wnext) {
                  copy -= state.wnext;
                  from = state.wsize - copy;
                } else {
                  from = state.wnext - copy;
                }
                if (copy > state.length) {
                  copy = state.length;
                }
                from_source = state.window;
              } else {
                from_source = output;
                from = put - state.offset;
                copy = state.length;
              }
              if (copy > left) {
                copy = left;
              }
              left -= copy;
              state.length -= copy;
              do {
                output[put++] = from_source[from++];
              } while (--copy);
              if (state.length === 0) {
                state.mode = LEN;
              }
              break;
            case LIT:
              if (left === 0) {
                break inf_leave;
              }
              output[put++] = state.length;
              left--;
              state.mode = LEN;
              break;
            case CHECK:
              if (state.wrap) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold |= input[next++] << bits;
                  bits += 8;
                }
                _out -= left;
                strm.total_out += _out;
                state.total += _out;
                if (_out) {
                  strm.adler = state.check = /*UPDATE(state.check, put - _out, _out);*/
                  state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
                }
                _out = left;
                if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                  strm.msg = "incorrect data check";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = LENGTH;
            /* falls through */
            case LENGTH:
              if (state.wrap && state.flags) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (hold !== (state.total & 4294967295)) {
                  strm.msg = "incorrect length check";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = DONE;
            /* falls through */
            case DONE:
              ret = Z_STREAM_END;
              break inf_leave;
            case BAD:
              ret = Z_DATA_ERROR;
              break inf_leave;
            case MEM:
              return Z_MEM_ERROR;
            case SYNC:
            /* falls through */
            default:
              return Z_STREAM_ERROR;
          }
        }
      strm.next_out = put;
      strm.avail_out = left;
      strm.next_in = next;
      strm.avail_in = have;
      state.hold = hold;
      state.bits = bits;
      if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
        if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
          state.mode = MEM;
          return Z_MEM_ERROR;
        }
      }
      _in -= strm.avail_in;
      _out -= strm.avail_out;
      strm.total_in += _in;
      strm.total_out += _out;
      state.total += _out;
      if (state.wrap && _out) {
        strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
        state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
      }
      strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
      if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) {
        ret = Z_BUF_ERROR;
      }
      return ret;
    }
    function inflateEnd(strm) {
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      var state = strm.state;
      if (state.window) {
        state.window = null;
      }
      strm.state = null;
      return Z_OK;
    }
    function inflateGetHeader(strm, head) {
      var state;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if ((state.wrap & 2) === 0) {
        return Z_STREAM_ERROR;
      }
      state.head = head;
      head.done = false;
      return Z_OK;
    }
    function inflateSetDictionary(strm, dictionary) {
      var dictLength = dictionary.length;
      var state;
      var dictid;
      var ret;
      if (!strm || !strm.state) {
        return Z_STREAM_ERROR;
      }
      state = strm.state;
      if (state.wrap !== 0 && state.mode !== DICT) {
        return Z_STREAM_ERROR;
      }
      if (state.mode === DICT) {
        dictid = 1;
        dictid = adler32(dictid, dictionary, dictLength, 0);
        if (dictid !== state.check) {
          return Z_DATA_ERROR;
        }
      }
      ret = updatewindow(strm, dictionary, dictLength, dictLength);
      if (ret) {
        state.mode = MEM;
        return Z_MEM_ERROR;
      }
      state.havedict = 1;
      return Z_OK;
    }
    exports2.inflateReset = inflateReset;
    exports2.inflateReset2 = inflateReset2;
    exports2.inflateResetKeep = inflateResetKeep;
    exports2.inflateInit = inflateInit;
    exports2.inflateInit2 = inflateInit2;
    exports2.inflate = inflate;
    exports2.inflateEnd = inflateEnd;
    exports2.inflateGetHeader = inflateGetHeader;
    exports2.inflateSetDictionary = inflateSetDictionary;
    exports2.inflateInfo = "pako inflate (from Nodeca project)";
  }
});

// node_modules/pako/lib/zlib/constants.js
var require_constants = __commonJS({
  "node_modules/pako/lib/zlib/constants.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      /* Allowed flush values; see deflate() and inflate() below for details */
      Z_NO_FLUSH: 0,
      Z_PARTIAL_FLUSH: 1,
      Z_SYNC_FLUSH: 2,
      Z_FULL_FLUSH: 3,
      Z_FINISH: 4,
      Z_BLOCK: 5,
      Z_TREES: 6,
      /* Return codes for the compression/decompression functions. Negative values
      * are errors, positive values are used for special but normal events.
      */
      Z_OK: 0,
      Z_STREAM_END: 1,
      Z_NEED_DICT: 2,
      Z_ERRNO: -1,
      Z_STREAM_ERROR: -2,
      Z_DATA_ERROR: -3,
      //Z_MEM_ERROR:     -4,
      Z_BUF_ERROR: -5,
      //Z_VERSION_ERROR: -6,
      /* compression levels */
      Z_NO_COMPRESSION: 0,
      Z_BEST_SPEED: 1,
      Z_BEST_COMPRESSION: 9,
      Z_DEFAULT_COMPRESSION: -1,
      Z_FILTERED: 1,
      Z_HUFFMAN_ONLY: 2,
      Z_RLE: 3,
      Z_FIXED: 4,
      Z_DEFAULT_STRATEGY: 0,
      /* Possible values of the data_type field (though see inflate()) */
      Z_BINARY: 0,
      Z_TEXT: 1,
      //Z_ASCII:                1, // = Z_TEXT (deprecated)
      Z_UNKNOWN: 2,
      /* The deflate compression method */
      Z_DEFLATED: 8
      //Z_NULL:                 null // Use -1 or null inline, depending on var type
    };
  }
});

// node_modules/pako/lib/zlib/gzheader.js
var require_gzheader = __commonJS({
  "node_modules/pako/lib/zlib/gzheader.js"(exports2, module2) {
    "use strict";
    function GZheader() {
      this.text = 0;
      this.time = 0;
      this.xflags = 0;
      this.os = 0;
      this.extra = null;
      this.extra_len = 0;
      this.name = "";
      this.comment = "";
      this.hcrc = 0;
      this.done = false;
    }
    module2.exports = GZheader;
  }
});

// node_modules/pako/lib/inflate.js
var require_inflate2 = __commonJS({
  "node_modules/pako/lib/inflate.js"(exports2) {
    "use strict";
    var zlib_inflate = require_inflate();
    var utils = require_common();
    var strings = require_strings();
    var c2 = require_constants();
    var msg = require_messages();
    var ZStream = require_zstream();
    var GZheader = require_gzheader();
    var toString = Object.prototype.toString;
    function Inflate(options) {
      if (!(this instanceof Inflate)) return new Inflate(options);
      this.options = utils.assign({
        chunkSize: 16384,
        windowBits: 0,
        to: ""
      }, options || {});
      var opt = this.options;
      if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
        opt.windowBits = -opt.windowBits;
        if (opt.windowBits === 0) {
          opt.windowBits = -15;
        }
      }
      if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
        opt.windowBits += 32;
      }
      if (opt.windowBits > 15 && opt.windowBits < 48) {
        if ((opt.windowBits & 15) === 0) {
          opt.windowBits |= 15;
        }
      }
      this.err = 0;
      this.msg = "";
      this.ended = false;
      this.chunks = [];
      this.strm = new ZStream();
      this.strm.avail_out = 0;
      var status = zlib_inflate.inflateInit2(
        this.strm,
        opt.windowBits
      );
      if (status !== c2.Z_OK) {
        throw new Error(msg[status]);
      }
      this.header = new GZheader();
      zlib_inflate.inflateGetHeader(this.strm, this.header);
    }
    Inflate.prototype.push = function(data, mode) {
      var strm = this.strm;
      var chunkSize = this.options.chunkSize;
      var dictionary = this.options.dictionary;
      var status, _mode;
      var next_out_utf8, tail, utf8str;
      var dict;
      var allowBufError = false;
      if (this.ended) {
        return false;
      }
      _mode = mode === ~~mode ? mode : mode === true ? c2.Z_FINISH : c2.Z_NO_FLUSH;
      if (typeof data === "string") {
        strm.input = strings.binstring2buf(data);
      } else if (toString.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      do {
        if (strm.avail_out === 0) {
          strm.output = new utils.Buf8(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = zlib_inflate.inflate(strm, c2.Z_NO_FLUSH);
        if (status === c2.Z_NEED_DICT && dictionary) {
          if (typeof dictionary === "string") {
            dict = strings.string2buf(dictionary);
          } else if (toString.call(dictionary) === "[object ArrayBuffer]") {
            dict = new Uint8Array(dictionary);
          } else {
            dict = dictionary;
          }
          status = zlib_inflate.inflateSetDictionary(this.strm, dict);
        }
        if (status === c2.Z_BUF_ERROR && allowBufError === true) {
          status = c2.Z_OK;
          allowBufError = false;
        }
        if (status !== c2.Z_STREAM_END && status !== c2.Z_OK) {
          this.onEnd(status);
          this.ended = true;
          return false;
        }
        if (strm.next_out) {
          if (strm.avail_out === 0 || status === c2.Z_STREAM_END || strm.avail_in === 0 && (_mode === c2.Z_FINISH || _mode === c2.Z_SYNC_FLUSH)) {
            if (this.options.to === "string") {
              next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
              tail = strm.next_out - next_out_utf8;
              utf8str = strings.buf2string(strm.output, next_out_utf8);
              strm.next_out = tail;
              strm.avail_out = chunkSize - tail;
              if (tail) {
                utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
              }
              this.onData(utf8str);
            } else {
              this.onData(utils.shrinkBuf(strm.output, strm.next_out));
            }
          }
        }
        if (strm.avail_in === 0 && strm.avail_out === 0) {
          allowBufError = true;
        }
      } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c2.Z_STREAM_END);
      if (status === c2.Z_STREAM_END) {
        _mode = c2.Z_FINISH;
      }
      if (_mode === c2.Z_FINISH) {
        status = zlib_inflate.inflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === c2.Z_OK;
      }
      if (_mode === c2.Z_SYNC_FLUSH) {
        this.onEnd(c2.Z_OK);
        strm.avail_out = 0;
        return true;
      }
      return true;
    };
    Inflate.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Inflate.prototype.onEnd = function(status) {
      if (status === c2.Z_OK) {
        if (this.options.to === "string") {
          this.result = this.chunks.join("");
        } else {
          this.result = utils.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    function inflate(input, options) {
      var inflator = new Inflate(options);
      inflator.push(input, true);
      if (inflator.err) {
        throw inflator.msg;
      }
      return inflator.result;
    }
    function inflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return inflate(input, options);
    }
    exports2.Inflate = Inflate;
    exports2.inflate = inflate;
    exports2.inflateRaw = inflateRaw;
    exports2.ungzip = inflate;
  }
});

// node_modules/pako/index.js
var require_pako = __commonJS({
  "node_modules/pako/index.js"(exports2, module2) {
    "use strict";
    var assign = require_common().assign;
    var deflate = require_deflate2();
    var inflate = require_inflate2();
    var constants = require_constants();
    var pako = {};
    assign(pako, deflate, inflate, constants);
    module2.exports = pako;
  }
});

// src/lib/pawnote/index.js
var e = { defaultFetcher: async (e2) => {
  const t2 = await fetch(e2.url.href, { redirect: e2.redirect ?? "follow", headers: e2.headers ?? {}, method: e2.method ?? "GET", body: e2.content });
  return { status: t2.status, content: await t2.text(), headers: t2.headers };
}, setHeaderToRequest: (e2, t2, s2) => {
  e2.headers = e2.headers || {}, "function" == typeof e2.headers.set ? e2.headers.set(t2, s2) : e2.headers[t2] = s2;
}, setCookiesArrayToRequest: (t2, s2) => {
  e.setHeaderToRequest(t2, "Cookie", s2.join("; "));
} };
var s = require_lib();
var t = require_pako();
function n(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
var i = n(s);
var a = n(t);
var r = (e2) => {
  let s2 = new URL(e2);
  s2 = new URL(`${s2.protocol}//${s2.host}${s2.pathname}`);
  const t2 = s2.pathname.split("/");
  return t2[t2.length - 1].includes(".html") && t2.pop(), s2.pathname = t2.join("/"), s2.href.endsWith("/") ? s2.href.slice(0, -1) : s2.href;
};
var o = class extends Error {
  constructor() {
    super("Unable to resolve the challenge, make sure the credentials or token are corrects"), this.name = "BadCredentialsError";
  }
};
var c = class extends Error {
  constructor(e2) {
    super(e2), this.name = "AuthenticateError";
  }
};
var u = class extends Error {
  constructor() {
    super("You do not have access to this area or your authorizations are insufficient"), this.name = "AccessDeniedError";
  }
};
var l = class extends Error {
  constructor() {
    super("Your account has been deactivated"), this.name = "AccountDisabledError";
  }
};
var d = class extends Error {
  constructor() {
    super("You can't send a message or a draft in this discussion"), this.name = "DiscussionActionError";
  }
};
var p = class extends Error {
  constructor() {
    super("You should request messages before sending anything"), this.name = "DiscussionMessagesMissingError";
  }
};
var m = (e2) => {
  if ("[" !== (e2 = e2.trim())[0] || "]" !== e2[e2.length - 1]) return [];
  if (0 === (e2 = e2.slice(1, -1)).length) return [];
  const s2 = [];
  for (const t2 of e2.split(",")) if (t2.includes("..")) {
    const [e3, n2] = t2.split("..").map((e4) => parseInt(e4));
    for (let t3 = e3; t3 <= n2; t3++) s2.push(t3);
  } else s2.push(parseInt(t2));
  return s2;
};
var f = class extends Error {
  handle;
  constructor(e2, s2, t2) {
    super("You're asked to custom your security methods"), this.name = "SecurityError", this.handle = ((e3, s3, t3) => {
      const n2 = m(e3.actionsDoubleAuth.V);
      return { availableSecurityModes: m(e3.modesPossibles.V), defaultSecurityMode: e3.modeSecurisationParDefaut, passwordRules: (i2 = e3.reglesSaisieMDP, { maxLength: i2.max, minLength: i2.min, rules: m(i2.regles.V) }), shouldCustomPassword: n2.includes(L.AIHMSC_PersonnalisationMotDePasse), shouldCustomDoubleAuth: n2.includes(L.AIHMSC_ChoixStrategie), shouldEnterPIN: n2.includes(L.AIHMSC_SaisieCodePINetSource), shouldEnterSource: n2.includes(L.AIHMSC_SaisieSourcePourNotifSeulement), context: { authentication: e3, identity: s3, initialUsername: t3 } };
      var i2;
    })(e2, s2, t2);
  }
};
var h = class extends Error {
  constructor(e2) {
    super(`The source name is too long, limited to ${e2} characters`), this.name = "SecuritySourceTooLongError";
  }
};
var g = class extends Error {
  constructor() {
    super("Your IP address has been suspended"), this.name = "SuspendedIPError";
  }
};
var D = class extends Error {
  constructor() {
    super("The session has expired"), this.name = "SessionExpiredError";
  }
};
var b = class extends Error {
  constructor() {
    super("The requested page does not exist"), this.name = "PageUnavailableError";
  }
};
var w = class extends Error {
  constructor() {
    super("The site is temporarily unavailable"), this.name = "BusyPageError";
  }
};
var A = class extends Error {
  constructor() {
    super("You've been rate-limited"), this.name = "RateLimitedError";
  }
};
var C = class extends Error {
  constructor(e2 = "An error occurred, server-side") {
    super(e2), this.name = "ServerSideError";
  }
};
var v = class extends Error {
  constructor(e2) {
    super(`Unreachable code reached in '${e2}' function, please open an issue on GitHub (LiterateInk/Pawnote)`), this.name = "UnreachableError";
  }
};
var E = class extends Error {
  constructor(e2) {
    super(`The file you are trying to upload is too large, maximum allowed is ${e2} bytes`), this.name = "UploadSizeError";
  }
};
var y = class extends Error {
  constructor() {
    super("The file upload failed"), this.name = "UploadFailedError";
  }
};
var M = { STUDENT: 6, PARENT: 7, TEACHER: 8, VIE_SCOLAIRE: 14 };
var P = { None: 0, Paper: 1, FileUpload: 2, Kiosk: 3, AudioRecording: 4 };
var x = { Link: 0, File: 1 };
var V = { lu: "lu", nonLu: "nonLu", archiver: "archiver", desarchiver: "desarchiver", transferer: "transferer", signaler: "signaler", modifierCategories: "modifierCategories", fermerDiscussion: "fermerDiscussion", ouvrirDiscussion: "ouvrirDiscussion", signalerSuppression: "signalerSuppression", Trash: "corbeille", Restore: "restauration", Delete: "suppression", brouillon: "brouillon", plus: "plus", purger: "purger", discussionEnFenetre: "discussionEnFenetre", entrerSortirDiscussion: "entrerSortirDiscussion", modificationObjetDiscussion: "modificationObjetDiscussion", afficherDestinataires: "afficherDestinataires", copierContenuVisu: "copierContenuVisu", repondreMessage: "repondreMessage", afficherDiscussion: "afficherDiscussion" };
var S = { Send: 0, SendEveryone: 1, SendEveryoneExceptParentsAndStudents: 3, ReplyEveryone: 2, ReplyEveryoneExceptParentsAndStudents: 4, Close: 5 };
var N = { Entry: 0, Main: 1, Side: 2, Drink: 3, Dessert: 4, Fromage: 5 };
var I = { URL: 0, FILE: 1, CLOUD: 2, KIOSK_LINK: 3, CONFERENCE_LINK: 4 };
var L = { AIHMSC_PersonnalisationMotDePasse: 0, AIHMSC_ChoixStrategie: 1, AIHMSC_ChoixCodePINetSource: 2, AIHMSC_SaisieCodePINetSource: 3, AIHMSC_ReinitCodePINetSource: 4, AIHMSC_SaisieSourcePourNotifSeulement: 5 };
var R = { csch_VerifierPIN: 0, csch_VerifierMotDePassePersonnalise: 1, csch_LibellesSourceConnexionDejaConnus: 2, csch_EnregistrerChoixUtilisateur: 3, csch_AffecterModeDoubleAuthentification: 4, csch_AffecterCodePIN: 5, csch_RenommerSourceConnexionConnue: 6, csch_SupprimerSourceConnexionConnue: 7, csch_AffecterMotDePassePersonnalise: 8, csch_ModifierLogin: 9, csch_DemandeReinitialisationPIN: 10, csch_VerifierCodeReinitialisationPIN: 11 };
var T = { Aucune: 0, Classe: 1, Group: 2, Teacher: 3, Student: 4, Responsable: 5, Niveau: 6, Orientation: 7, Specialite: 8, OptionSpecialite: 9, Etablissement: 10, Period: 11, Service: 12, Absence: 13, Delay: 14, Exclusion: 15, Subject: 16, Room: 17, CoEnseignant: 18, Suivis: 19, Cours: 20, Infirmerie: 21, AbsenceRepas: 22, Pilier: 23, ElementPilier: 24, Competence: 25, _DisciplineBrevet: 26, Palier: 27, SousItem: 28, Evaluation: 29, Stage: 30, SousMatiere: 31, MaitreDeStage: 32, InspecteurPedagogique: 33, Personal: 34, EvaluationHistorique: 35, DossierProgression: 36, ContenuDeCours: 37, TravailAFaire: 38, Progression: 39, Dispense: 40, Punishment: 41, Sanction: 42, Communication: 43, AbsenceInternat: 44, Observation: 45, ObservationProfesseurEleve: 46, ConvocationVS: 47, DocumentJoint: 48, InternetCategorie: 49, DocJointEtablissement: 50, Option: 51, ProgrammationPunition: 52, ReportPunition: 53, DisciplineLivretScolaire: 54, QCM: 55, ExecutionQCM: 56, QCMEditeur: 57, PartieDeClasse: 58, DocJointEleve: 59, Devoir: 60, InternetEnumere: 61, AppreciationBulletinCompetence: 62, Entreprise: 63, DomaineProfessionnel: 64, OffreDeStage: 65, SujetDeStage: 66, DocumentCasier: 67, Message: 68, PossessionMessage: 69, RelationMessageDocJointEtablissement: 70, Engagement: 71, PrecautionaryMeasure: 72, SousCategorieObjetDossier: 73, Incident: 74, ProtagonisteIncident: 75, RelationIncidentFichierExterne: 76, RegimeEleve: 77, RepasAPreparer: 78, SessionDeStage: 79, Materiel: 80, Bourse: 81, RelationTravailAFaireEleve: 82, LieuDossier: 83, ElementProgramme: 84, ChapitreEltPgm: 85, EltPgmTravailleCDT: 86, Appreciation: 87, ExecutionDevoirKiosque: 88, PanierRessourceKiosque: 89, RessourceNumeriqueKiosque: 90, MetaMatiere: 91, EvaluationSujet: 92, EvaluationCorrige: 93, LibelleCours: 94, Site: 95, QuestionQCM: 96, RelationElevePilierDeCompetence: 97, QuestionCopieQCM: 98, Coordonnees: 99, ResponsablePostulant: 100, ExecutionQCMEleve: 101, DocJointInscription: 102, CategorieDossier: 103, MEFGEP: 104, AutreOrientation: 105, Commission: 106, ReponseEducative: 107, SuiviReponseEducative: 108, NatureDocumentEleve: 109 };
var k = { NONE: 0, CREATION: 1, MODIFICATION: 2, DELETION: 3, CHILDREN_MODIFICATION: 4 };
var O = { Error: -1, Grade: 0, Absent: 1, Exempted: 2, NotGraded: 3, Unfit: 4, Unreturned: 5, AbsentZero: 6, UnreturnedZero: 7, Congratulations: 8 };
var F = { Lunch: 0, Dinner: 1 };
var _ = { InformationText: 0, SurveyText: 5, TextInput: 1, UniqueChoice: 2, MultipleChoice: 3 };
var U = { ACCOUNT: 0, ACCOUNT_CONNECTION: 1, DIRECT_CONNECTION: 2, TOKEN_ACCOUNT_CONNECTION: 3, TOKEN_DIRECT_CONNECTION: 4, COOKIE_CONNECTION: 5 };
var G = { Grades: 198, Resources: 89, Assignments: 88, Timetable: 16, Evaluations: 201, Account: 49, Presence: 7, News: 8, Notebook: 19, Discussions: 131, Gradebook: 13, Menus: 10 };
var B = ([e2, s2, t2]) => e2 > 2024 || !(e2 < 2024) && (s2 > 3 || !(s2 < 3) && t2 >= 9);
var q = ([e2, s2, t2]) => e2 > 2025 || !(e2 < 2025) && (s2 > 1 || !(s2 < 1) && t2 >= 3);
var j = (e2, s2, t2) => {
  const n2 = !e2.MR && !e2.ER;
  let a2, r2;
  return q(t2) ? (a2 = !e2.CrA, r2 = !e2.CoA) : (a2 = e2.sCrA ?? false, r2 = e2.sCoA ?? false), { url: s2, id: parseInt(e2.h), accountKind: e2.a, demo: e2.d ?? false, accessKind: e2.g ?? U.ACCOUNT, rsaModulus: n2 ? "B99B77A3D72D3A29B4271FC7B7300E2F791EB8948174BE7B8024667E915446D4EEA0C2424B8D1EBF7E2DDFF94691C6E994E839225C627D140A8F1146D1B0B5F18A09BBD3D8F421CA1E3E4796B301EEBCCF80D81A32A1580121B8294433C38377083C5517D5921E8A078CDC019B15775292EFDA2C30251B1CCABE812386C893E5" : e2.MR, rsaExponent: n2 ? "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010001" : e2.ER, rsaFromConstants: n2, aesIV: i.default.random.getBytesSync(16), aesKey: "", skipEncryption: a2, skipCompression: r2, http: e2.http ?? false, poll: e2.poll ?? false, order: 0 };
};
var $ = "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 PRONOTE Mobile APP Version/2.0.11";
var H = />PRONOTE (?<version>\d+\.\d+\.\d+)/;
var K = async (s2, t2 = e.defaultFetcher) => {
  const n2 = new URL(s2.base + "/" + ((e2) => {
    let s3;
    switch (e2) {
      case M.STUDENT:
        s3 = "eleve";
        break;
      case M.PARENT:
        s3 = "parent";
        break;
      case M.TEACHER:
        s3 = "professeur";
        break;
      case M.VIE_SCOLAIRE:
        s3 = "viescolaire";
    }
    return `mobile.${s3}.html`;
  })(s2.kind));
  for (const [e2, t3] of Object.entries(s2.params)) n2.searchParams.set(e2, t3);
  const i2 = { url: n2, redirect: "manual" };
  e.setCookiesArrayToRequest(i2, s2.cookies), e.setHeaderToRequest(i2, "User-Agent", $);
  const { content: a2 } = await t2(i2), r2 = a2.match(H)?.groups?.version?.split(".").map(Number);
  if (!r2) throw new b();
  try {
    const m2 = a2.match(/Start\s*\(([^)]+)\)/);
    if (!m2) throw new b();
    const i3 = m2[1].replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/gu, '"$2": ').replace(/'/gu, '"');
    return { information: j(JSON.parse(i3), s2.base, r2), version: r2 };
  } catch (e2) {
    if (a2.includes("Votre adresse IP est provisoirement suspendue")) throw new g();
    if (a2.includes("Le site n'est pas disponible")) throw new b();
    if (a2.includes("Le site est momentan\xE9ment indisponible")) throw new w();
    throw new b();
  }
};
var J = class {
  static decrypt(e2, s2, t2) {
    s2 = i.default.md.md5.create().update(s2.bytes()).digest(), t2 = t2.length() ? i.default.md.md5.create().update(t2.bytes()).digest() : i.default.util.createBuffer().fillWithByte(0, 16);
    const n2 = i.default.util.createBuffer(i.default.util.binary.hex.decode(e2)), a2 = i.default.cipher.createDecipher("AES-CBC", s2);
    return a2.start({ iv: t2 }), a2.update(n2), a2.finish(), a2.output.bytes();
  }
  static encrypt(e2, s2, t2) {
    s2 = i.default.md.md5.create().update(s2.bytes()).digest(), t2 = t2.length() ? i.default.md.md5.create().update(t2.bytes()).digest() : i.default.util.createBuffer().fillWithByte(0, 16), e2 = i.default.util.createBuffer(e2);
    const n2 = i.default.cipher.createCipher("AES-CBC", s2);
    return n2.start({ iv: t2 }), n2.update(e2), n2.finish(), n2.output.toHex();
  }
};
var Q = (e2, s2 = false) => ({ iv: i.default.util.createBuffer(s2 ? "" : e2.information.aesIV), key: i.default.util.createBuffer(e2.information.aesKey) });
var W = (e2) => {
  if (q(e2.instance.version)) return { data: "data", orderNumber: "no", secureData: "dataSec", requestId: "id", signature: "Signature", session: "session", fileUploadOrderNumber: "u_no", fileUploadSession: "u_ns", fileUploadRequestId: "u_idR", fileUploadFileId: "u_idF", fileUploadMd5: "u_md5" };
  let s2 = { orderNumber: "numeroOrdre", secureData: "donneesSec", requestId: "nom", session: "session", fileUploadOrderNumber: "numeroOrdre", fileUploadSession: "numeroSession", fileUploadRequestId: "nomRequete", fileUploadFileId: "idFichier", fileUploadMd5: "md5" };
  return B(e2.instance.version) ? { ...s2, data: "data", signature: "Signature" } : { ...s2, data: "donnees", signature: "_Signature_" };
};
var z = class {
  constructor(e2, s2) {
    this.session = e2, this.data = s2;
    const t2 = W(this.session);
    this.session.information.order++;
    const n2 = s2;
    try {
      const e3 = JSON.parse(n2);
      if (e3.Erreur) {
        const s3 = e3.Erreur.Titre || "Server Error";
        throw new C(s3);
      }
      if (this.data = e3[t2.secureData], this.session.information.skipEncryption || this.decrypt(), this.session.information.skipCompression || this.decompress(), "string" == typeof this.data && (this.data = JSON.parse(this.data)), void 0 !== this.data?.[t2.signature]?.Erreur) throw new C(this.data[t2.signature].MessageErreur);
    } catch (e3) {
      if (n2.includes("La page a expir")) throw new D();
      if (n2.includes("Votre adresse IP ")) throw new g();
      if (n2.includes("La page dem") || n2.includes("Impossible d'a")) throw new b();
      if (n2.includes("Vous avez d")) throw new A();
      if (n2.includes("s refus")) throw new u();
      throw e3;
    }
  }
  decrypt() {
    const { iv: e2, key: s2 } = Q(this.session);
    this.data = J.decrypt(this.data, s2, e2), this.session.information.skipCompression || (this.data = i.default.util.bytesToHex(this.data));
  }
  decompress() {
    const e2 = i.default.util.hexToBytes(this.data), s2 = new Uint8Array(Array.from(e2).map((e3) => e3.charCodeAt(0)));
    this.data = a.default.inflateRaw(s2, { to: "string" });
  }
};
var Y = class {
  constructor(e2, s2, t2) {
    this.session = e2, this.name = s2, this.data = t2;
  }
  process() {
    this.session.information.order++;
    const e2 = this.generateOrder(), s2 = new URL(`${this.session.information.url}/appelfonction/${this.session.information.accountKind}/${this.session.information.id}/${e2}`);
    return this.session.information.skipCompression || this.compress(), this.session.information.skipEncryption || this.encrypt(), { order: e2, url: s2 };
  }
  keys() {
    return Q(this.session, 1 === this.session.information.order);
  }
  generateOrder() {
    const { key: e2, iv: s2 } = this.keys();
    return J.encrypt(this.session.information.order.toString(), e2, s2);
  }
  stringify() {
    return i.default.util.encodeUtf8(JSON.stringify(this.data) || "");
  }
  compress() {
    const e2 = i.default.util.createBuffer(this.stringify()).toHex(), s2 = a.default.deflateRaw(e2, { level: 6 }), t2 = Array.from(s2).map((e3) => String.fromCharCode(e3)).join("");
    this.data = i.default.util.bytesToHex(t2);
  }
  encrypt() {
    const { key: e2, iv: s2 } = this.keys(), t2 = this.session.information.skipCompression ? this.stringify() : i.default.util.hexToBytes(this.data);
    this.data = J.encrypt(t2, e2, s2);
  }
  async send() {
    return this.session.queue.push(async () => {
      const e2 = this.process(), s2 = W(this.session), t2 = await this.session.fetcher({ url: e2.url, method: "POST", headers: { "Content-Type": "application/json", "User-Agent": $ }, content: JSON.stringify({ [s2.session]: this.session.information.id, [s2.orderNumber]: e2.order, [s2.requestId]: this.name, [s2.secureData]: this.data }) });
      return new z(this.session, t2.content);
    });
  }
};
var Z = /^\d{2}\/\d{2}\/\d{4}$/;
var X = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/;
var ee = /^\d{2}\/\d{2}\/\d{2} \d{2}h\d{2}$/;
var se = (/* @__PURE__ */ new Date()).getFullYear().toString().slice(0, 2);
var te = (e2) => {
  if (Z.test(e2)) {
    const [s2, t2, n2] = e2.split("/").map(Number);
    return new Date(n2, t2 - 1, s2);
  }
  if (X.test(e2)) {
    const [s2, t2] = e2.split(" "), [n2, i2, a2] = s2.split("/").map(Number), [r2, o2, c2] = t2.split(":").map(Number), u2 = new Date(a2, i2 - 1, n2);
    return u2.setHours(r2, o2, c2), u2;
  }
  if (ee.test(e2)) {
    const [s2, t2] = e2.split(" "), [n2, i2, a2] = s2.split("/").map(Number), [r2, o2] = t2.split("h").map(Number), c2 = new Date(parseInt(`${se}${a2}`), i2 - 1, n2);
    return c2.setHours(r2, o2), c2;
  }
  throw new v("decodePronoteDate");
};
var ne = (e2) => ({ id: e2.N, name: e2.L, startDate: te(e2.dateDebut.V), endDate: te(e2.dateFin.V) });
var ie = (e2) => ({ id: e2.N, kind: e2.G, name: e2.L, startDate: te(e2.dateDebut.V), endDate: te(e2.dateFin.V) });
var ae = async (e2, s2 = null) => {
  const t2 = i.default.pki.rsa.setPublicKey(new i.default.jsbn.BigInteger(e2.information.rsaModulus, 16), new i.default.jsbn.BigInteger(e2.information.rsaExponent, 16)), n2 = e2.information.aesIV;
  let a2;
  a2 = e2.information.rsaFromConstants ? i.default.util.encode64(e2.information.http ? t2.encrypt(n2) : n2, 64) : i.default.util.encode64(t2.encrypt(n2));
  const r2 = { identifiantNav: s2, Uuid: a2 }, o2 = new Y(e2, "FonctionParametres", { data: r2, donnees: r2 }), c2 = await o2.send();
  return ((e3) => {
    const s3 = /* @__PURE__ */ new Map();
    for (const t3 of [1, 2]) {
      const n3 = m(e3.General.DomainesFrequences[t3].V);
      for (const i2 of n3) s3.set(i2, { label: e3.General.LibellesFrequences[t3], fortnight: t3 });
    }
    return { version: e3.General.versionPN.split(".").map(Number), nextBusinessDay: te(e3.General.JourOuvre.V), firstMonday: te(e3.General.PremierLundi.V), firstDate: te(e3.General.PremiereDate.V), lastDate: te(e3.General.DerniereDate.V), navigatorIdentifier: e3.identifiantNav, endings: e3.General.ListeHeuresFin.V.map((e4) => e4.L), periods: e3.General.ListePeriodes.map(ie), holidays: e3.General.listeJoursFeries.V.map(ne), weekFrequencies: s3, blocksPerDay: e3.General.PlacesParJour };
  })(c2.data.data || c2.data.donnees);
};
var re = async (e2, s2) => {
  const t2 = W(e2), n2 = new Y(e2, "Identification", { [t2.data]: { genreConnexion: 0, genreEspace: e2.information.accountKind, identifiant: s2.username, pourENT: s2.useCAS, enConnexionAuto: false, demandeConnexionAuto: false, enConnexionAppliMobile: s2.reuseMobileAuthentication, demandeConnexionAppliMobile: s2.requestFirstMobileAuthentication, demandeConnexionAppliMobileJeton: s2.requestFromQRCode, uuidAppliMobile: s2.deviceUUID, loginTokenSAV: "", informationsAppareil: { modele: "iPhone18,3", platforme: "iOS" } } });
  const data = (await n2.send()).data[t2.data];
  e2.identData = data;
  return data;
};
var oe = async (e2, s2) => {
  const t2 = W(e2), n2 = new Y(e2, "Authentification", { [t2.data]: { connexion: 0, challenge: s2, espace: e2.information.accountKind } }), i2 = (await n2.send()).data[t2.data];
  e2.authData = i2;
  if ("number" == typeof i2.Acces && 0 !== i2.Acces) switch (i2.Acces) {
    case 1:
      throw new o();
    case 2:
    case 3:
    case 4:
    case 5:
    case 7:
    case 8:
      throw new u();
    case 6:
    case 10:
      throw new l();
    case 9:
      if (void 0 !== i2.AccesMessage) {
        let e3 = i2.AccesMessage.message ?? "(none)";
        throw i2.AccesMessage.titre && (e3 += `${i2.AccesMessage.titre} ${e3}`), new c(e3);
      }
  }
  return i2;
};
var ce = (e2 = {}, s2 = []) => {
  const t2 = e2?.AvecDiscussion ?? false, n2 = t2 && !e2?.discussionInterdit, i2 = n2 && (e2?.AvecDiscussionPersonnels ?? false), a2 = n2 && (e2?.AvecDiscussionParents ?? false), r2 = n2 && (e2?.AvecDiscussionEleves ?? false), o2 = n2 && (e2?.AvecDiscussionProfesseurs ?? false), c2 = [];
  const tabItems = Array.isArray(s2) ? s2 : (s2?.V && Array.isArray(s2.V) ? s2.V : []);
  if (tabItems.length > 0) {
    const e3 = (s3) => {
      if (!s3) return;
      "G" in s3 && c2.push(s3.G);
      if ("Onglet" in s3 && Array.isArray(s3.Onglet)) s3.Onglet.forEach(e3);
      if (s3.Onglet?.V && Array.isArray(s3.Onglet.V)) s3.Onglet.V.forEach(e3);
    };
    tabItems.forEach(e3);
  }
  return { canReadDiscussions: t2, canDiscuss: n2, canDiscussWithStaff: i2, canDiscussWithParents: a2, canDiscussWithStudents: r2, canDiscussWithTeachers: o2, hasAdvancedDiscussionEditor: e2?.AvecDiscussionAvancee ?? false, maxAssignmentFileUploadSize: e2?.tailleMaxRenduTafEleve, tabs: c2 };
};
var ue = (e2, s2, t2 = {}) => {
  const n2 = e2.L ?? "", i2 = e2.G, a2 = e2.N;
  let r2;
  if (i2 === x.Link) r2 = e2.url ?? n2;
  else {
    const { iv: e3, key: i3 } = Q(s2), o2 = JSON.stringify({ N: a2, Actif: true, ...t2 }), c2 = J.encrypt(o2, i3, e3);
    r2 = `${s2.information.url}/FichiersExternes/${c2}/${encodeURIComponent(n2)}?Session=${s2.information.id}`;
  }
  return { kind: i2, name: n2, url: r2, id: a2 };
};
var le = (e2, s2) => {
  const t2 = (e3) => s2.find((s3) => s3.id === e3), n2 = e2.periodeParDefaut && t2(e2.periodeParDefaut.V.N), i2 = e2.listePeriodes.V.map((e3) => t2(e3.N)).filter(Boolean);
  return { defaultPeriod: n2, location: e2.G, periods: i2 };
};
var de = (e2, s2) => {
  let t2 = [];
  const fallbackRes = { N: 0, G: s2.information.accountKind, L: s2.user?.name || "Vie Scolaire" };
  const primaryRes = e2.ressource || e2.utilisateur || fallbackRes;
  switch (s2.information.accountKind) {
    case M.STUDENT:
    case M.TEACHER:
    case M.VIE_SCOLAIRE:
      t2 = e2.ressource ? [e2.ressource] : (e2.listeRessources?.V || e2.listeRessources || [primaryRes]);
      break;
    case M.PARENT:
      t2 = e2.ressource?.listeRessources || e2.listeRessources?.V || e2.listeRessources || [primaryRes];
  }
  if (!Array.isArray(t2)) t2 = [primaryRes];
  return { id: primaryRes.N ?? 0, kind: primaryRes.G ?? s2.information.accountKind, name: primaryRes.L ?? "Utilisateur", resources: t2.map((e3) => ((e4, s3) => {
    let t3 = null;
    e4?.avecPhoto && (t3 = ue({ G: 1, N: e4.N, L: "photo.jpg" }, s3));
    const n2 = /* @__PURE__ */ new Map();
    const tabsList = e4?.listeOngletsPourPeriodes?.V || e4?.listeOngletsPourPeriodes || [];
    if (Array.isArray(tabsList)) {
      for (const t4 of tabsList) n2.set(t4.G, le(t4, s3.instance.periods));
    }
    return { id: e4?.N ?? 0, kind: e4?.G ?? s3.information.accountKind, name: e4?.L ?? "", establishmentName: e4?.Etablissement?.V?.L || e4?.Etablissement?.L || "", className: e4?.classeDEleve?.L || "", profilePicture: t3, tabs: n2, isDirector: e4?.estDirecteur ?? false, isDelegate: e4?.estDelegue ?? false, isMemberCA: e4?.estMembreCA ?? false };
  })(e3, s2)), authorizations: ce(e2.autorisations, e2.listeOnglets) };
};
var pe = (e2) => {
  const s2 = e2.split(".");
  switch (s2.pop(), s2.pop()) {
    case "eleve":
      return M.STUDENT;
    case "parent":
      return M.PARENT;
    case "professeur":
      return M.TEACHER;
    case "viescolaire":
      return M.VIE_SCOLAIRE;
    default:
      throw new v("decodeAccountKindFromPath");
  }
};
function me(e2, s2) {
  if (e2.user?.resources && e2.user.resources.length > 0) {
    e2.userResource = "number" == typeof s2 ? e2.user.resources[s2] : s2;
  }
  if (!e2.userResource) {
    e2.userResource = { id: e2.user?.id ?? 0, kind: e2.user?.kind ?? e2.information.accountKind, name: e2.user?.name ?? "Utilisateur" };
  }
}
var fe = { fd: 1, login: true };
var he = async (e2, s2) => {
  const t2 = r(s2.url), { information: n2, version: i2 } = await K({ base: t2, kind: s2.kind, cookies: ["appliMobile=1"], params: fe }, e2.fetcher);
  e2.information = n2, e2.instance = { version: i2 }, e2.instance = await ae(e2, s2.navigatorIdentifier);
  const a2 = await re(e2, { username: s2.username, deviceUUID: s2.deviceUUID, requestFirstMobileAuthentication: false, reuseMobileAuthentication: true, requestFromQRCode: false, useCAS: false });
  be(s2, "token", a2);
  const o2 = De(a2, s2.username, s2.token), c2 = we(e2, a2, o2), u2 = await oe(e2, c2);
  Ae(e2, u2, o2);
  if (!u2.jetonConnexionAppliMobile) u2.jetonConnexionAppliMobile = s2.token;
  return ve(e2, u2, a2, s2.username);
};
var ge = (e2, s2) => he(e2, { url: e2.information.url, kind: e2.information.accountKind, username: s2.username, token: s2.token, deviceUUID: s2.deviceUUID, navigatorIdentifier: e2.instance.navigatorIdentifier });
var De = (e2, s2, t2) => {
  const n2 = i.default.md.sha256.create().update(e2.alea ?? "").update(i.default.util.encodeUtf8(t2)).digest().toHex().toUpperCase();
  return new i.default.util.ByteStringBuffer(i.default.util.encodeUtf8(s2.toLowerCase() + n2));
};
var be = (e2, s2, t2) => {
  1 === t2.modeCompLog && (e2.username = e2.username.toLowerCase()), 1 === t2.modeCompMdp && (e2[s2] = e2[s2].toLowerCase());
};
var we = (e2, s2, t2) => {
  try {
    const n2 = i.default.util.createBuffer(e2.information.aesIV), a2 = new i.default.util.ByteStringBuffer(i.default.util.encodeUtf8(s2.challenge)), r2 = i.default.md.md5.create().update(t2.bytes()).digest(), o2 = i.default.md.md5.create().update(n2.bytes()).digest(), c2 = i.default.cipher.createCipher("AES-CBC", r2);
    return c2.start({ iv: o2 }), c2.update(a2), c2.finish(), c2.output.toHex();
  } catch {
    throw new o();
  }
};
var Ae = (e2, s2, t2) => {
  const n2 = i.default.util.createBuffer(e2.information.aesIV), a2 = J.decrypt(s2.cle, t2, n2).split(",").map((e3) => String.fromCharCode(parseInt(e3))).join("");
  e2.information.aesKey = a2;
};
var Ce = (e2) => Boolean(e2.actionsDoubleAuth);
var ve = async (e2, s2, t2, n2) => {
  try {
    const uReq = new Y(e2, "ParametresUtilisateur", {}), uRes = await uReq.send();
    if (uRes?.data?.[W(e2).data]) {
      e2.rawUserData = uRes.data[W(e2).data];
      e2.user = de(uRes.data[W(e2).data], e2);
    }
  } catch (ign) {
    e2.paramError = String(ign?.message || ign);
  }
  if (!e2.user) {
    const defRes = { id: 0, kind: e2.information.accountKind, name: t2.login ?? n2 };
    e2.user = { id: 0, kind: e2.information.accountKind, name: t2.login ?? n2, resources: [defRes], authorizations: { tabs: [] } };
  }
  if (!e2.user.resources || e2.user.resources.length === 0) {
    e2.user.resources = [{ id: e2.user.id ?? 0, kind: e2.user.kind ?? e2.information.accountKind, name: e2.user.name ?? t2.login ?? n2 }];
  }
  me(e2, 0);
  return { token: s2.jetonConnexionAppliMobile ?? s2.token ?? n2, username: t2.login ?? n2, kind: e2.information.accountKind, url: e2.information.url, navigatorIdentifier: e2.instance.navigatorIdentifier };
};
var Ee = (e2, s2, t2) => {
  e2.kind === _.TextInput || e2.kind === _.InformationText ? e2.textInputAnswer = s2 : (e2.selectedAnswers = s2, e2.textInputAnswer = t2), e2.answered = void 0 !== s2, e2.answerDate = e2.answered ? /* @__PURE__ */ new Date() : void 0;
};
var ye = (e2, s2) => {
  const t2 = e2.instance.blocksPerDay, n2 = Math.floor(s2.blockPosition / t2);
  let i2 = s2.blockPosition + s2.blockLength - 1;
  return Math.floor(i2 / t2) !== n2 && (i2 = n2 * t2 + t2 - 1), i2;
};
var Me = (e2, s2, t2, n2) => {
  const i2 = [t2], a2 = s2.blockPosition, r2 = ye(e2, s2);
  for (let e3 = a2; e3 <= r2; e3++) {
    const s3 = n2[e3];
    void 0 !== s3 && (s3 === t2 || i2.includes(s3) || i2.push(s3));
  }
  return i2;
};
var Pe = (e2, s2) => {
  const t2 = {};
  for (let n2 = 0; n2 < s2.length; n2++) {
    const i2 = s2[n2];
    i2.weekNumber in t2 || (t2[i2.weekNumber] = []);
    const a2 = t2[i2.weekNumber], r2 = i2.blockPosition, o2 = ye(e2, i2);
    if (false !== i2._visible) for (let t3 = r2; t3 <= o2; t3++) {
      if (void 0 !== a2[t3]) {
        const t4 = Me(e2, i2, n2, a2);
        let r3 = false, o3 = false;
        for (const e3 of t4) {
          const t5 = s2[e3];
          o3 || (o3 = !("lesson" === t5.is && t5.canceled)), r3 || (r3 = "lesson" === t5.is && t5.canceled);
        }
        if (o3 && r3) for (const e3 of t4) {
          const t5 = s2[e3];
          if (t5 && "lesson" === t5.is && t5.canceled) return t5._visible = false, true;
        }
        break;
      }
      a2[t3] = n2;
    }
  }
  return false;
};
var xe = async (e2) => {
  let s2;
  s2 = B(e2.instance.version) ? new Y(e2, "Navigation", { Signature: { onglet: G.Presence }, data: { onglet: G.Presence, ongletPrec: G.Presence } }) : new Y(e2, "Presence", { _Signature_: { onglet: G.Presence } }), await s2.send();
};
var Ve = (e2) => {
  e2.presence && (clearInterval(e2.presence), e2.presence = null);
};
var Se = class {
  queue = [];
  pendingPromise = false;
  push(e2) {
    return new Promise((s2, t2) => {
      this.queue.push({ promise: e2, resolve: s2, reject: t2 }), this.pendingPromise || this.dequeue();
    });
  }
  dequeue() {
    if (this.pendingPromise) return false;
    const e2 = this.queue.shift();
    return !!e2 && (this.pendingPromise = true, e2.promise().then((s2) => {
      e2.resolve(s2), this.pendingPromise = false, this.dequeue();
    }).catch((s2) => {
      e2.reject(s2), this.pendingPromise = false, this.dequeue();
    }), true);
  }
};
var Ne = (e2) => e2.getTime() + 60 * e2.getTimezoneOffset() * 1e3;
var Ie = (e2) => new Date(Ne(e2));
var Le = (e2, s2) => {
  const t2 = Math.floor((Ne(e2) - Ne(s2)) / 864e5);
  return 1 + Math.floor(t2 / 7);
};
var Re = -1e3;
var Te = () => Re -= 1;
var ke = class {
  constructor(e2, s2, t2, n2) {
    this.session = e2, this.functionName = s2, this.fileName = n2, e2.information.order++;
    const { iv: i2, key: a2 } = Q(e2);
    this.order = J.encrypt(e2.information.order.toString(), a2, i2);
    const r2 = W(this.session), o2 = new FormData();
    o2.append(r2.fileUploadOrderNumber, this.order), o2.append(r2.fileUploadSession, e2.information.id.toString()), o2.append(r2.fileUploadRequestId, s2), o2.append(r2.fileUploadFileId, this.id), o2.append(r2.fileUploadMd5, ""), o2.append("files[]", t2, n2), this.form = o2, this.url = e2.information.url + `/uploadfilesession/${e2.information.accountKind}/${e2.information.id}`, this.headers["Content-Disposition"] = `attachment; filename="${encodeURI(n2)}"`;
  }
  order;
  id = `selecfile_1_${Date.now()}`;
  url;
  form;
  headers = { "User-Agent": $ };
  async send() {
    const e2 = await new Response(this.form).text();
    this.headers["Content-Type"] = `multipart/form-data; boundary=${e2.split("\n")[0].slice(2)}`;
    let s2 = 3;
    for (; 3 === s2; ) {
      const t2 = await this.session.fetcher({ url: new URL(this.url), method: "POST", content: e2, headers: this.headers });
      s2 = JSON.parse(t2.content).etat;
    }
    if (this.session.information.order++, 0 === s2 || 2 === s2) throw new y();
  }
};
var Oe = (e2) => ({ id: e2.N, name: e2.L, inGroups: e2.estServiceGroupe ?? false });
var Fe = (e2) => ({ id: e2.N, name: e2.L, subject: Oe(e2.Matiere.V) });
var _e = (e2, s2) => ({ id: e2.N, subject: Oe(e2.Matiere.V), description: e2.descriptif.V, backgroundColor: e2.CouleurFond, done: e2.TAFFait, deadline: te(e2.PourLe.V), attachments: e2.ListePieceJointe.V.map((e3) => ue(e3, s2)), difficulty: e2.niveauDifficulte, length: e2.duree, themes: e2.ListeThemes.V.map((e3) => Fe(e3)), return: { kind: e2.genreRendu ?? P.None, canUpload: e2.peuRendre ?? false, uploaded: e2.documentRendu && ue(e2.documentRendu.V, s2) }, resourceID: e2.cahierDeTextes?.V.N });
var Ue = async (e2, s2, t2, n2) => {
  const i2 = W(e2), a2 = new Y(e2, "PageCahierDeTexte", { [i2.signature]: { onglet: s2 }, [i2.data]: { domaine: { _T: 8, V: "number" == typeof n2 ? `[${t2}..${n2}]` : `[${t2}]` } } });
  return (await a2.send()).data[i2.data];
};
var Ge = async (e2, s2, t2, n2) => {
  t2 = Ie(t2), n2 = Ie(n2);
  const i2 = Le(t2, e2.instance.firstMonday), a2 = Le(n2, e2.instance.firstMonday);
  return Ue(e2, s2, i2, a2);
};
var Be = (e2, s2) => s2.ListeTravauxAFaire.V.map((s3) => _e(s3, e2));
var qe = async (e2, s2, t2) => {
  let n2;
  switch (s2) {
    case V.brouillon:
      n2 = { commande: s2, brouillon: "number" == typeof t2.id ? { E: k.CREATION, N: t2.id } : { E: k.MODIFICATION, N: t2.id }, contenu: t2.content, messagePourReponse: { G: 0, N: t2.replyMessageID }, listeDestinataires: [], listeFichiers: [], objet: "" };
      break;
    case "":
      n2 = { commande: s2, bouton: { N: 0, G: t2.button }, brouillon: { N: t2.id }, contenu: t2.content, listeDestinataires: [], listeFichiers: [], messagePourReponse: { G: 0, N: t2.replyMessageID } };
      break;
    default:
      n2 = { commande: s2, listePossessionsMessages: t2.possessions };
  }
  const i2 = W(e2), a2 = new Y(e2, "SaisieMessage", { [i2.signature]: { onglet: G.Discussions }, [i2.data]: n2 });
  await a2.send();
};
function je(e2) {
  const s2 = /* @__PURE__ */ new Date(), t2 = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"], n2 = e2.match(/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)?\s*(\d{1,2})h(\d{2})/i);
  if (n2) {
    const [, e3, i3, a3] = n2, r2 = parseInt(i3), o2 = parseInt(a3), c2 = new Date(s2);
    if (e3) {
      let n3 = t2.indexOf(e3.toLowerCase()) - s2.getDay();
      c2.setDate(s2.getDate() + n3);
    }
    return c2.setHours(r2, o2, 0, 0), c2;
  }
  const i2 = e2.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (i2) {
    let [e3, s3, t3, n3] = i2, a3 = parseInt(n3);
    return a3 < 100 && (a3 += 2e3), new Date(a3, parseInt(t3) - 1, parseInt(s3));
  }
  const a2 = e2.match(/(\d{1,2})\/(\d{1,2})/);
  if (a2) {
    let [e3, t3, n3] = a2;
    const i3 = new Date(s2.getFullYear(), parseInt(n3) - 1, parseInt(t3));
    return i3 > s2 && i3.getTime() - s2.getTime() > 2592e5 && i3.setFullYear(i3.getFullYear() - 1), i3;
  }
  throw new Error("Couldn't convert this label to a date, please open an issue with the label to improve this function.");
}
var $e = (e2) => ({ id: e2.N, name: e2.L, kind: e2.G });
var He = async (e2, s2 = { _: [] }) => {
  const t2 = W(e2), n2 = new Y(e2, "ListeMessagerie", { [t2.signature]: { onglet: G.Discussions }, [t2.data]: { avecLu: true, avecMessage: true, possessionMessageDiscussionUnique: null } }), i2 = (await n2.send()).data[t2.data], a2 = i2.listeEtiquettes.V.map($e), r2 = i2.listeMessagerie.V.filter((e3) => {
    const s3 = 0 === (e3.profondeur || 0), t3 = e3.messagePourParticipants?.V.N;
    return e3.estUneDiscussion && t3 && s3;
  }).map((e3) => ((e4, s3, t3) => ({ cache: t3, creator: e4.initiateur, date: je(e4.libelleDate), recipientName: e4.public, participantsMessageID: e4.messagePourParticipants.V.N, possessions: e4.listePossessionsMessages.V, numberOfDrafts: e4.nbBrouillons ?? 0, subject: e4.objet ?? "", numberOfMessages: e4.nombreMessages ?? 0, numberOfMessagesUnread: e4.nbNonLus ?? 0, closed: e4.ferme ?? false, folders: e4.listeEtiquettes?.V.map((e5) => s3.find((s4) => s4.id === e5.N)).filter(Boolean) ?? [] }))(e3, a2, s2));
  s2._.length = 0, s2._.push(...r2);
  for (const e3 of s2._) e3.participantsMessageID in s2 ? Object.assign(s2[e3.participantsMessageID], e3) : s2[e3.participantsMessageID] = e3;
  for (const e3 in s2) "_" !== e3 && (s2._.find((s3) => s3.participantsMessageID === e3) || delete s2[e3]);
  return { folders: a2, items: s2._ };
};
var Ke = (e2) => {
  const s2 = e2.estHTML ?? false;
  return { possessionID: e2.possessionMessage.V.N, replyMessageID: e2.messageSource.V.N, content: s2 ? e2.contenu.V : e2.contenu, isHTML: s2 };
};
var Je = (e2) => {
  let s2;
  switch (e2) {
    case "Professeur":
      s2 = T.Teacher;
      break;
    case "Personnel":
      s2 = T.Personal;
      break;
    default:
      s2 = T.Student;
  }
  return s2;
};
var Qe = (e2, s2) => {
  let t2, n2;
  return "Moi" !== e2.public_gauche && (t2 = { name: e2.public_gauche, kind: Je(e2.hint_gauche) }), "Moi" === e2.public_droite ? n2 = void 0 : "string" == typeof e2.public_droite && (n2 = { name: e2.public_droite, kind: Je(e2.hint_droite) }), { id: e2.N, content: e2.estHTML ? e2.contenu.V : e2.contenu, creationDate: te(e2.date.V), author: t2, receiver: n2, partialVisibility: e2.estUnAparte, amountOfRecipients: (e2.nbPublic ?? 1) + 1, files: e2.listeDocumentsJoints?.V.map((e3) => ue(e3, s2)) ?? [] };
};
var We = (e2, s2, t2) => {
  const n2 = [], i2 = e2.messageSource.V.N;
  if (e2.listeMessagesPourContexte) for (const t3 of e2.listeMessagesPourContexte.V) {
    const e3 = Qe(t3, s2);
    n2.push(e3);
  }
  let a2 = t2.find((e3) => e3.id === i2);
  return { ...Qe(e2, s2), transferredMessages: n2, replyMessageID: i2, replyingTo: a2 };
};
var ze = async (e2, s2, t2 = false) => {
  const n2 = W(e2), i2 = new Y(e2, "ListeMessages", { [n2.signature]: { onglet: G.Discussions }, [n2.data]: { listePossessionsMessages: s2.possessions, marquerCommeLu: t2, nbMessagesVus: 0 } }), a2 = ((e3, s3) => {
    const t3 = e3.brouillon, n3 = [], i3 = [], a3 = e3.messagePourReponse.V.N;
    for (const t4 of e3.listeMessages.V) t4.brouillon ? i3.push(Ke(t4)) : n3.push(We(t4, s3, n3));
    if (n3.sort((e4, s4) => s4.creationDate.getTime() - e4.creationDate.getTime()), t3) {
      const e4 = t3.V.estHTML ?? false;
      i3.push({ isHTML: e4, content: e4 ? t3.V.contenu : t3.V.contenu.V, possessionID: t3.V.N, replyMessageID: a3 });
    }
    const r2 = e3.listeBoutons.V.find((e4) => e4.L.startsWith("Envoyer"))?.G;
    return { sents: n3, drafts: i3, defaultReplyMessageID: a3, sendAction: r2, canIncludeStudentsAndParents: r2 === S.ReplyEveryoneExceptParentsAndStudents || r2 === S.SendEveryoneExceptParentsAndStudents };
  })((await i2.send()).data[n2.data], e2);
  return s2.messages ? Object.assign(s2.messages, a2) : s2.messages = a2, a2;
};
var Ye = (e2) => ({ id: e2.N, name: e2.L, kind: e2.G, disallowMessages: e2.refusMess ?? false });
var Ze = (e2, s2) => (e2 === S.SendEveryoneExceptParentsAndStudents && s2 && (e2 = S.SendEveryone), e2 === S.ReplyEveryoneExceptParentsAndStudents && s2 && (e2 = S.ReplyEveryone), e2);
var Xe = (e2) => ({ id: e2.N, level: e2.L, abbreviation: e2.abbreviation, coefficient: e2.coefficient, domainID: e2.domaine.V.N, domainName: e2.domaine.V.L, itemID: e2.item?.V.N, itemName: e2.item?.V.L, order: e2.ordre, pillarID: e2.pilier.V.N, pillarName: e2.pilier.V.L, pillarPrefixes: e2.pilier.V.strPrefixes.split(",").map((e3) => e3.trim()) });
var es = (e2) => {
  const s2 = e2.listeNiveauxDAcquisitions.V.map(Xe);
  return s2.sort((e3, s3) => e3.order - s3.order), { skills: s2, name: e2.L, id: e2.N, teacher: e2.individu.V.L, coefficient: e2.coefficient, description: e2.descriptif, subject: Oe(e2.matiere.V), levels: e2.listePaliers.V.map((e3) => e3.L), date: te(e2.date.V) };
};
var ss = (e2) => ({ N: e2.id, G: e2.kind, L: e2.name });
var ts = (e2) => e2 * Math.PI / 180;
var ns = (e2) => ((e3) => e3 * e3)(Math.sin(e2 / 2));
var is = (e2, s2) => {
  const t2 = ts(e2[0]), n2 = ts(s2[0]), i2 = ts(e2[1]), a2 = ts(s2[1]), r2 = ns(n2 - t2) + Math.cos(t2) * Math.cos(n2) * ns(a2 - i2);
  return 12756274 * Math.asin(Math.sqrt(r2));
};
var as = async (e2, s2) => {
  const t2 = W(e2), n2 = new Y(e2, "GenerationPDF", { [t2.data]: { avecCodeCompetences: false, genreGenerationPDF: 2, options: { adapterHauteurService: false, desEleves: false, gererRectoVerso: false, hauteurServiceMax: 15, hauteurServiceMin: 10, piedMonobloc: true, portrait: true, taillePolice: 6.5, taillePoliceMin: 5, taillePolicePied: 6.5, taillePolicePiedMin: 5 }, periode: ss(s2) }, [t2.signature]: { onglet: G.Gradebook } }), i2 = await n2.send();
  return e2.information.url + "/" + encodeURI(i2.data[t2.data].url.V);
};
var rs = (e2) => {
  let s2, t2 = O.Grade;
  if ("string" == typeof e2) e2.split("|").length >= 2 && (t2 = parseInt(e2.split("|")[1])), s2 = parseFloat(e2.replace(",", ".")), t2 !== O.AbsentZero && t2 !== O.UnreturnedZero || (s2 = 0);
  else {
    if ("number" != typeof e2) throw new v("decodeGradeValue");
    s2 = e2;
  }
  return { kind: t2, points: s2 };
};
var os = (e2) => ({ student: e2.moyEleve && rs(e2.moyEleve.V), outOf: e2.baremeMoyEleve && rs(e2.baremeMoyEleve.V), defaultOutOf: e2.baremeMoyEleveParDefaut && rs(e2.baremeMoyEleveParDefaut.V), class_average: e2.moyClasse && rs(e2.moyClasse.V), min: e2.moyMin && rs(e2.moyMin.V), max: e2.moyMax && rs(e2.moyMax.V), subject: Oe(e2), backgroundColor: e2.couleur });
var cs = (e2, s2) => ({ grades: e2.listeDevoirs.V.map((e3) => ((e4, s3) => {
  const t2 = e4.N, n2 = e4.estBonus, i2 = (n3, i3) => e4[n3] && ue({ G: x.File, L: e4[n3], N: t2 }, s3, { G: i3 });
  return { id: t2, value: rs(e4.note.V), outOf: rs(e4.bareme.V), defaultOutOf: rs(e4.baremeParDefaut.V), date: te(e4.date.V), subject: Oe(e4.service.V), average: e4.moyenne && rs(e4.moyenne.V), max: e4.noteMax && rs(e4.noteMax.V), min: e4.noteMin && rs(e4.noteMin.V), coefficient: e4.coefficient, comment: e4.commentaire, commentaireSurNote: e4.commentaireSurNote, isBonus: n2, isOptional: e4.estFacultatif && !n2, isOutOf20: e4.estRamenerSur20, subjectFile: i2("libelleSujet", "DevoirSujet"), correctionFile: i2("libelleCorrige", "DevoirCorrige") };
})(e3, s2)), subjectsAverages: e2.listeServices.V.map(os), classAverage: e2.moyGeneraleClasse && rs(e2.moyGeneraleClasse.V), overallAverage: e2.moyGenerale && rs(e2.moyGenerale.V) });
var us = (e2) => `${e2.getDate()}/${e2.getMonth() + 1}/${e2.getFullYear()} ${e2.getHours()}:${e2.getMinutes()}:${e2.getSeconds()}`;
var ls = (e2) => ({ description: e2.commentaire, name: e2.L, url: e2.url });
var ds = (e2) => ({ name: e2.libellePorteMonnaie, description: e2.hintPorteMonnaie, warning: e2.avecWarning, balance: parseInt(e2.valeurSolde.replace(",", ".")), balanceDescription: e2.hintSolde });
var ps = (e2) => ({ sso: e2.SSO });
var ms = (e2) => {
  const s2 = [];
  let t2, n2;
  var i2;
  "partenaireARD" in e2 && (i2 = e2.partenaireARD, n2 = { ...ps(i2), canRefreshData: i2.avecActualisation, wallets: i2.porteMonnaie.V.map(ds) });
  for (const n3 of e2.lienUtile.listeLiens.V) "SSO" in n3 ? "TURBOSELF" === n3.SSO.codePartenaire && (t2 = ps(n3)) : s2.push(ls(n3));
  return { partnerARD: n2, partnerTurboself: t2, links: s2 };
};
var fs = (e2) => ({ name: e2.L, color: e2.couleur });
var hs = (e2) => ({ name: e2.L, color: e2.couleur });
var gs = (e2) => ({ name: e2.L, allergens: e2.listeAllergenesAlimentaire.V.map(fs), labels: e2.listeLabelsAlimentaires.V.map(hs) });
var Ds = (e2) => {
  let s2 = e2.ListeRepas.V.reduce((e3, s3) => {
    let t2;
    switch (s3.G) {
      case F.Lunch:
        t2 = "lunch";
        break;
      case F.Dinner:
        t2 = "dinner";
        break;
      default:
        throw new v("decodeMenu");
    }
    return e3[t2] = ((e4) => {
      const s4 = e4.ListePlats.V.reduce((e5, s5) => {
        let t3;
        switch (s5.G) {
          case N.Entry:
            t3 = "entry";
            break;
          case N.Main:
            t3 = "main";
            break;
          case N.Side:
            t3 = "side";
            break;
          case N.Drink:
            t3 = "drink";
            break;
          case N.Fromage:
            t3 = "fromage";
            break;
          case N.Dessert:
            t3 = "dessert";
            break;
          default:
            throw new v("decodeMeal");
        }
        return e5[t3] = s5.ListeAliments.V.map(gs), e5;
      }, {});
      return { name: e4.L, ...s4 };
    })(s3), e3;
  }, {});
  return { date: te(e2.Date.V), ...s2 };
};
var bs = (e2) => ({ id: e2.N, name: e2.L, from: e2.libelleMatiere });
var ws = (e2, s2) => ({ id: e2.N, name: e2.L, sub: s2 });
var As = (e2) => {
  const s2 = [];
  if (e2.listeRessources) {
    const t3 = e2.listeRessources.V.filter((e3) => e3.estUneSousMatiere).map(bs);
    for (const n2 of e2.listeRessources.V) n2.estUneSousMatiere || s2.push(ws(n2, t3.filter((e3) => e3.from === n2.L)));
  }
  return { id: e2.N, name: e2.L, kind: e2.G, subjects: s2, function: e2.fonction && (t2 = e2.fonction.V, { id: t2.N, name: t2.L }), isPrincipal: e2.estPrincipal ?? false };
  var t2;
};
var Cs = (e2) => {
  if (0 === e2.length) return "[]";
  const s2 = [...e2].sort((e3, s3) => e3 - s3), t2 = [];
  let n2 = s2[0], i2 = n2;
  for (let e3 = 1; e3 < s2.length; e3++) s2[e3] - n2 !== 1 && (i2 === n2 ? t2.push(i2.toString()) : t2.push(`${i2}..${n2}`), i2 = s2[e3]), n2 = s2[e3];
  return i2 === n2 ? t2.push(i2.toString()) : t2.push(`${i2}..${n2}`), `[${t2.join(",")}]`;
};
var vs = async (e2, s2, t2 = { delete: false, markAsRead: true, onlyMarkAsRead: false }) => {
  const n2 = W(e2), i2 = t2.onlyMarkAsRead || t2.delete ? [] : "information" === s2.is ? [s2.question] : s2.questions, a2 = new Y(e2, "SaisieActualites", { [n2.signature]: { onglet: G.News }, [n2.data]: { listeActualites: [{ N: s2.id, L: s2.title ?? "", genrePublic: s2.public.G, public: s2.public, validationDirecte: true, listeQuestions: i2.map((e3) => ({ N: e3.id, L: e3.fullTitle, genreReponse: e3.kind, reponse: { N: parseInt(e3.answerID), Actif: true, valeurReponse: e3.kind === _.InformationText || e3.kind === _.TextInput ? e3.textInputAnswer ?? "" : { _T: 8, V: Cs(e3.selectedAnswers ?? []) }, valeurReponseLibre: e3.choices.filter((e4) => e4.isTextInput).length > 0 ? e3.textInputAnswer : void 0, avecReponse: e3.answered, estReponseAttendue: e3.shouldAnswer, _validationSaisie: true } })), marqueLueSeulement: !t2.delete && t2.onlyMarkAsRead, lue: !t2.delete && t2.markAsRead, supprimee: !t2.onlyMarkAsRead && t2.delete, saisieActualite: false }], saisieActualite: false } });
  await a2.send();
};
var Es = async (e2, s2, t2) => {
  s2.read !== t2 && (await vs(e2, s2, { onlyMarkAsRead: true, markAsRead: t2, delete: false }), s2.read = t2);
};
var ys = (e2, s2) => ({ id: e2.N, title: e2.L, category: s2.find((s3) => s3.id === e2.categorie.V.N), creationDate: te(e2.dateCreation.V), startDate: te(e2.dateDebut.V), endDate: te(e2.dateFin.V), author: e2.auteur, public: e2.public.V, read: e2.lue });
var Ms = (e2) => ({ value: e2.L, position: e2.rang, isTextInput: !!e2.estReponseLibre });
var Ps = (e2, s2) => {
  const t2 = e2.genreReponse, n2 = e2.reponse.V.avecReponse;
  let i2, a2;
  return n2 && e2.reponse.V.valeurReponse && ("string" == typeof e2.reponse.V.valeurReponse ? a2 = e2.reponse.V.valeurReponse : (i2 = m(e2.reponse.V.valeurReponse.V), a2 = e2.reponse.V.valeurReponseLibre)), { id: e2.N, fullTitle: e2.L, title: e2.titre, position: e2.rang, kind: t2, maximumLength: e2.tailleReponse, shouldRespectMaximumChoices: e2.avecMaximum, maximumChoices: e2.nombreReponsesMax, content: e2.texte.V, attachments: e2.listePiecesJointes.V.map((e3) => ue(e3, s2)), answerID: e2.reponse.V.N, answered: n2, shouldAnswer: e2.reponse.V.estReponseAttendue, answerDate: e2.reponse.V.reponduLe?.V && te(e2.reponse.V.reponduLe.V), choices: t2 === _.TextInput ? [] : e2.listeChoix.V.map(Ms), selectedAnswers: i2, textInputAnswer: a2 };
};
var xs = (e2, s2, t2) => ({ is: "information", ...ys(e2, t2), question: Ps(e2.listeQuestions.V[0], s2), get attachments() {
  return this.question.attachments;
}, get acknowledged() {
  return this.question.answered;
}, get acknowledgedDate() {
  return this.question.answerDate;
}, get needToAcknowledge() {
  return this.question.shouldAnswer;
}, get content() {
  return this.question.content;
} });
var Vs = (e2) => ({ id: e2.N, name: e2.L, default: e2.estDefaut ?? false });
var Ss = (e2, s2, t2) => ({ is: "survey", ...ys(e2, t2), questions: e2.listeQuestions.V.map((e3) => Ps(e3, s2)), isAnonymous: e2.reponseAnonyme });
var Ns = (e2) => {
  const [s2, t2] = e2.NbrHeures.split("h").map(Number), n2 = e2.estMotifNonEncoreConnu;
  return { id: e2.N, startDate: te(e2.dateDebut.V), endDate: te(e2.dateFin.V), justified: e2.justifie, opened: e2.ouverte, hoursMissed: s2, minutesMissed: t2, daysMissed: e2.NbrJours, shouldParentsJustify: e2.aJustifierParParents, administrativelyFixed: e2.reglee, isReasonUnknown: n2, reason: !n2 && e2.listeMotifs.V[0].L };
};
var Is = (e2) => {
  const s2 = e2.estMotifNonEncoreConnu, t2 = e2.justifie;
  return { id: e2.N, date: te(e2.date.V), minutes: e2.duree, justified: t2, justification: t2 && e2.justification, shouldParentsJustify: e2.aJustifierParParents, administrativelyFixed: e2.reglee, isReasonUnknown: s2, reason: !s2 && e2.listeMotifs.V[0].L };
};
var Ls = (e2, s2) => ({ id: e2.N, title: e2.nature.V.L, reasons: e2.listeMotifs.V.map((e3) => e3.L), exclusion: e2.estUneExclusion, isDuringLesson: !e2.horsCours, workToDo: e2.travailAFaire, workToDoDocuments: e2.documentsTAF.V.map((e3) => ue(e3, s2)), circumstances: e2.circonstances, circumstancesDocuments: e2.documentsCirconstances.V.map((e3) => ue(e3, s2)), giver: e2.demandeur.V.L, dateGiven: te(e2.dateDemande.V), durationMinutes: e2.duree });
var Rs = (e2) => {
  let s2;
  return "L" in e2.matiere.V && "0" !== e2.matiere.V.N && (s2 = Oe(e2.matiere.V)), { id: e2.N, date: te(e2.date.V), opened: e2.estLue, shouldParentsJustify: e2.avecARObservation, name: e2.L, kind: e2.genreObservation, sectionID: e2.rubrique.V.N, subject: s2, reason: e2.commentaire };
};
var Ts = (e2, s2) => ({ id: e2.N, title: e2.nature.V.L, comments: e2.commentaire, reasons: e2.listeMotifs.V.map((e3) => e3.L), exclusion: e2.estUneExclusion, circumstances: e2.circonstances, circumstancesDocuments: e2.documentsCirconstances.V.map((e3) => ue(e3, s2)), decisionMaker: e2.decideur.V.L, giver: e2.demandeur.V.L, dateGiven: te(e2.dateDemande.V), startDate: te(e2.dateDebut.V), endDate: te(e2.dateFin.V), disallowedAccesses: m(e2.interditAcces.V) });
var ks = (e2, s2) => ({ id: e2.N, startDate: te(e2.Date.V), endDate: te(e2.DateFin.V), subject: Oe(e2.Matiere.V), haveAssignment: void 0 !== e2.dateTAF, assignmentDeadline: e2.dateTAF?.V && te(e2.dateTAF.V), teachers: e2.listeProfesseurs.V.map((e3) => e3.L), groups: e2.listeGroupes.V.map((e3) => e3.L), backgroundColor: e2.CouleurFond, contents: e2.listeContenus.V.map((e3) => ((e4, s3) => ({ id: e4.N, title: e4.L, description: e4.descriptif.V, category: e4.categorie.V.G, categoryText: e4.categorie.V.L, files: e4.ListePieceJointe.V.map((e5) => ue(e5, s3)), themes: e4.ListeThemes.V.map((e5) => Fe(e5)), educativeValue: e4.parcoursEducatif }))(e3, s2)) });
var Os = (e2, s2) => s2.ListeCahierDeTextes.V.map((s3) => ks(s3, e2));
var Fs = (e2, s2) => ({ [e2]: s2, [e2[0].toUpperCase() + e2.substring(1)]: s2 });
var _s = (e2, s2) => {
  const t2 = te(e2.DateDuCours.V), n2 = e2.place, i2 = e2.duree;
  let a2;
  if ("string" == typeof e2.DateDuCoursFin?.V) a2 = te(e2.DateDuCoursFin.V);
  else {
    const e3 = (({ instance: { endings: e4 } }, s3) => {
      s3 > e4.length && (s3 %= e4.length - 1);
      const t3 = e4[s3], [n3, i3] = t3.split("h").map(Number);
      return { hours: n3, minutes: i3 };
    })(s2, n2 % s2.instance.blocksPerDay + i2 - 1);
    a2 = new Date(t2), a2.setHours(e3.hours, e3.minutes);
  }
  return { id: e2.N, backgroundColor: e2.CouleurFond, notes: e2.memo, startDate: t2, endDate: a2, blockLength: i2, blockPosition: n2, weekNumber: Le(t2, s2.instance.firstMonday) };
};
var Us = (e2, s2) => ({ absences: e2.absences, withCanceledClasses: e2.avecCoursAnnule ?? true, classes: (e2.ListeCours ?? []).map((e3) => ((e4) => "estSortiePedagogique" in e4 && e4.estSortiePedagogique)(e3) ? ((e4, s3) => ({ is: "activity", ..._s(e4, s3), title: e4.motif, attendants: e4.accompagnateurs, resourceTypeName: e4.strGenreRess, resourceValue: e4.strRess }))(e3, s2) : ((e4) => "estRetenue" in e4 && void 0 !== e4.estRetenue)(e3) ? ((e4, s3) => {
  let t2;
  const n2 = [], i2 = [], a2 = [];
  if ("ListeContenus" in e4) for (const s4 of e4.ListeContenus.V) {
    const e5 = s4.L;
    if (s4.estHoraire) t2 = e5;
    else if ("G" in s4) switch (s4.G) {
      case 3:
        i2.push(e5);
        break;
      case 34:
        n2.push(e5);
        break;
      case 17:
        a2.push(e5);
    }
  }
  return { is: "detention", ..._s(e4, s3), title: t2, personalNames: n2, teacherNames: i2, classrooms: a2 };
})(e3, s2) : ((e4, s3) => {
  const t2 = [], n2 = [], i2 = [], a2 = [], r2 = [];
  let o2, c2;
  if (e4.listeVisios) for (const s4 of e4.listeVisios.V) t2.push(s4.url);
  if (e4.ListeContenus) for (const s4 of e4.ListeContenus.V) switch (s4.G) {
    case 16:
      o2 = Oe(s4);
      break;
    case 3:
      n2.push(s4.L);
      break;
    case 34:
      i2.push(s4.L);
      break;
    case 17:
      a2.push(s4.L);
      break;
    case 2:
      r2.push(s4.L);
  }
  return e4.AvecCdT && e4.cahierDeTextes && (c2 = e4.cahierDeTextes.V.N), { is: "lesson", ..._s(e4, s3), kind: e4.G, status: e4.Statut, canceled: e4.estAnnule ?? false, exempted: e4.dispenseEleve ?? false, test: e4.cahierDeTextes?.V.estDevoir ?? false, virtualClassrooms: t2, personalNames: i2, teacherNames: n2, classrooms: a2, groupNames: r2, subject: o2, lessonResourceID: c2 };
})(e3, s2)).sort((e3, s3) => e3.startDate.getTime() - s3.startDate.getTime()) });
var Gs = async (e2, s2 = {}) => {
  const t2 = W(e2);
  const resObj = e2.userResource
    ? { G: e2.userResource.kind, L: e2.userResource.name, N: e2.userResource.id }
    : { G: e2.information.accountKind, L: e2.user?.name || "Vie Scolaire", N: 0 };
  const n2 = new Y(e2, "PageEmploiDuTemps", {
    [t2.signature]: { onglet: G.Timetable },
    [t2.data]: {
      estEDTAnnuel: false,
      estEDTPermanence: false,
      avecAbsencesEleve: false,
      avecRessourcesLibrePiedHoraire: false,
      avecAbsencesRessource: true,
      avecInfosPrefsGrille: true,
      avecConseilDeClasse: true,
      avecCoursSortiePeda: true,
      avecDisponibilites: true,
      avecRetenuesEleve: true,
      edt: { G: 16, L: "Emploi du temps" },
      ...Fs("ressource", resObj),
      ...s2
    }
  });
  const a2 = await n2.send();
  return Us(a2.data[t2.data], e2);
};
exports.AccessDeniedError = u, exports.AccountDisabledError = l, exports.AccountKind = M, exports.AssignmentDifficulty = { None: 0, Easy: 1, Medium: 2, Hard: 3 }, exports.AssignmentReturnKind = P, exports.AttachmentKind = x, exports.AuthenticateError = c, exports.BadCredentialsError = o, exports.BusyPageError = w, exports.DiscussionActionError = d, exports.DiscussionCommand = V, exports.DiscussionFolderKind = { OCEM_Utilisateur: 0, OCEM_Pre_Reception: 1, OCEM_Pre_Archive: 2, OCEM_Pre_Envoye: 3, OCEM_Pre_Brouillon: 4, OCEM_Pre_Poubelle: 5, OCEM_Pre_Signalement: 6, OCEM_Expl_Bleu: 7, OCEM_Expl_Vert: 8, OCEM_Expl_Rouge: 9, OCEM_Pre_CarnetLiaison: 10, OCEM_Pre_Alerte: 11, OCEM_Pre_ContactVS: 12, OCEM_Pre_Conversation: 13, OCEM_Pre_InvisiblePlageDesactivee: 14 }, exports.DiscussionMessagesMissingError = p, exports.DiscussionSendAction = S, exports.DishKind = N, exports.DocumentFileFormat = { UNKNOWN: 0, TEXT: 1, PDF: 2, EXCEL: 3, ARCHIVE: 4, IMAGE: 5, SOUND: 6, VIDEO: 7, DIAPORAMA: 8, GEOGEBRA: 9 }, exports.DocumentKind = I, exports.DoubleAuthClientAction = L, exports.DoubleAuthMode = { MGDA_PasEncoreChoisi: 0, MGDA_Inactive: 1, MGDA_NotificationSeulement: 2, MGDA_SaisieCodePIN: 3 }, exports.DoubleAuthServerAction = R, exports.EntityKind = T, exports.EntityState = k, exports.GradeKind = O, exports.MealKind = F, exports.NewsQuestionKind = _, exports.NewsView = { Reception: 0, Broadcast: 1, Draft: 2, Template: 3 }, exports.NotebookObservationKind = { LogBookIssue: 0, Observation: 1, Encouragement: 2, Other: 3 }, exports.PageUnavailableError = b, exports.RateLimitedError = A, exports.ResourceContentCategory = { NONE: 0, LESSON: 1, CORRECTION: 2, DST: 3, ORAL_INTERROGATION: 4, TD: 5, TP: 6, EVALUATION_COMPETENCES: 7, EPI: 8, AP: 9, VISIO: 12 }, exports.SecurityError = f, exports.SecuritySourceTooLongError = h, exports.ServerSideError = C, exports.SessionAccessKind = U, exports.SessionExpiredError = D, exports.SuspendedIPError = g, exports.TabLocation = G, exports.UnreachableError = v, exports.UploadFailedError = y, exports.UploadSizeError = E, exports.account = async (e2) => {
  const s2 = W(e2), t2 = new Y(e2, "PageInfosPerso", { [s2.signature]: { onglet: G.Account } });
  return ((e3, s3) => {
    const t3 = e3.Informations;
    let n2;
    return s3.instance.version[0] >= 2024 && (n2 = e3.iCal?.liste.V[0]?.paramICal), { address: [t3.adresse1, t3.adresse2, t3.adresse3, t3.adresse4], postalCode: t3.codePostal, province: t3.province, country: t3.pays, city: t3.ville, email: t3.eMail, phone: `+${t3.indicatifTel}${t3.telephonePortable}`, INE: t3.numeroINE, iCalToken: n2 };
  })((await t2.send()).data[s2.data], e2);
}, exports.assignmentRemoveFile = async (e2, s2) => {
  const t2 = W(e2), n2 = new Y(e2, "SaisieTAFARendreEleve", { [t2.signature]: { onglet: G.Assignments }, [t2.data]: { listeFichiers: [{ E: k.DELETION, TAF: { N: s2 } }] } });
  await n2.send();
}, exports.assignmentStatus = async (e2, s2, t2) => {
  const n2 = W(e2), i2 = new Y(e2, "SaisieTAFFaitEleve", { [n2.signature]: { onglet: G.Assignments }, [n2.data]: { listeTAF: [{ E: k.MODIFICATION, TAFFait: t2, N: s2 }] } });
  await i2.send();
}, exports.assignmentUploadFile = async (e2, s2, t2, n2) => {
  const i2 = t2.size || t2.byteLength, a2 = e2.user.authorizations.maxAssignmentFileUploadSize;
  if ("number" == typeof i2 && i2 > a2) throw new E(a2);
  const r2 = new ke(e2, "SaisieTAFARendreEleve", t2, n2);
  await r2.send();
  const o2 = W(e2), c2 = new Y(e2, "SaisieTAFARendreEleve", { [o2.signature]: { onglet: G.Assignments }, [o2.data]: { listeFichiers: [{ E: k.CREATION, G: I.FILE, L: n2, N: Te(), idFichier: r2.id, TAF: { N: s2 } }] } });
  await c2.send();
}, exports.assignmentsFromIntervals = async (e2, s2, t2) => {
  const n2 = await Ge(e2, G.Assignments, s2, t2);
  return Be(e2, n2).filter((e3) => s2 <= e3.deadline && e3.deadline <= t2);
}, exports.assignmentsFromWeek = async (e2, s2, t2) => {
  try {
    const n2 = await Ue(e2, G.Assignments, s2, t2);
    return Be(e2, n2);
  } catch (err) {
    try {
      const cdt = await exports.resourcesFromWeek(e2, s2, t2);
      const hwList = [];
      for (const item of cdt || []) {
        if (item.haveAssignment && item.id) {
          try {
            const hws = await exports.resourceAssignments(e2, item.id);
            if (Array.isArray(hws)) {
              for (const hw of hws) {
                if (!hw.themes || hw.themes.length === 0) {
                  hw.themes = (item.groups || []).map((g) => ({ name: g }));
                }
                hwList.push(hw);
              }
            }
          } catch (ignHw) {}
        }
      }
      return hwList;
    } catch (cdtErr) {
      throw err;
    }
  }
}, exports.cleanURL = r, exports.clearPresenceInterval = Ve, exports.createSessionHandle = (s2 = e.defaultFetcher) => ({ information: null, instance: null, user: null, queue: new Se(), fetcher: s2, presence: null }), exports.discussionCreateDraft = async (e2, s2, t2, n2 = s2.messages?.defaultReplyMessageID) => {
  await qe(e2, V.brouillon, { id: Te(), content: t2, replyMessageID: n2 }), await He(e2, s2.cache), await ze(e2, s2);
}, exports.discussionDelete = async (e2, s2) => {
  await qe(e2, V.Delete, { possessions: s2.possessions }), await He(e2, s2.cache);
}, exports.discussionMessages = ze, exports.discussionRead = async (e2, s2) => {
  await ze(e2, s2, true);
}, exports.discussionRecipients = async (e2, s2) => {
  const t2 = W(e2), n2 = new Y(e2, "SaisiePublicMessage", { [t2.signature]: { onglet: G.Discussions }, [t2.data]: { message: { N: s2.participantsMessageID }, estPublicParticipant: true, estDestinatairesReponse: false } });
  return (await n2.send()).data[t2.data].listeDest.V.map(Ye);
}, exports.discussionRemoteMutateDraft = async (e2, s2, t2) => {
  await qe(e2, V.brouillon, { id: t2.possessionID, content: t2.content, replyMessageID: t2.replyMessageID }), await He(e2, s2.cache), await ze(e2, s2);
}, exports.discussionRemoveDraft = async (e2, s2, t2) => {
  await qe(e2, V.Delete, { possessions: [{ N: t2.possessionID }] }), await He(e2, s2.cache), await ze(e2, s2);
}, exports.discussionRestoreTrash = async (e2, s2) => {
  await qe(e2, V.Restore, { possessions: s2.possessions }), await He(e2, s2.cache);
}, exports.discussionSendDraft = async (e2, s2, t2, n2 = false) => {
  if (void 0 === s2.messages?.sendAction) throw new d();
  await qe(e2, "", { button: Ze(s2.messages.sendAction, n2), content: t2.content, id: t2.possessionID, replyMessageID: t2.replyMessageID }), await He(e2, s2.cache), await ze(e2, s2);
}, exports.discussionSendMessage = async (e2, s2, t2, n2 = false, i2 = s2.messages?.defaultReplyMessageID) => {
  if (!s2.messages) throw new p();
  if (void 0 === s2.messages.sendAction) throw new d();
  const a2 = W(e2), r2 = Ze(s2.messages.sendAction, n2), o2 = new Y(e2, "SaisieMessage", { [a2.data]: { contenu: e2.user.authorizations.hasAdvancedDiscussionEditor ? { _T: 21, V: t2 } : t2, bouton: { N: 0, G: r2 }, brouillon: { N: Te(), E: k.CREATION }, genreDiscussion: 0, messagePourReponse: { G: 0, N: i2 }, listeFichiers: [] }, [a2.signature]: { onglet: G.Discussions } });
  await o2.send(), await He(e2, s2.cache), await ze(e2, s2);
}, exports.discussionTrash = async (e2, s2) => {
  await qe(e2, V.Trash, { possessions: s2.possessions }), await He(e2, s2.cache);
}, exports.discussions = He, exports.evaluations = async (e2, s2) => {
  const t2 = W(e2), n2 = new Y(e2, "DernieresEvaluations", { [t2.signature]: { onglet: G.Evaluations }, [t2.data]: { periode: ss(s2) } });
  return (await n2.send()).data[t2.data].listeEvaluations.V.map(es);
}, exports.finishLoginManually = ve, exports.frequency = (e2, s2) => e2.instance.weekFrequencies.get(s2), exports.geolocation = async (s2, t2 = e.defaultFetcher) => {
  const n2 = `data={"nomFonction":"geoLoc","lat":"${s2.latitude}","long":"${s2.longitude}"}`, i2 = await t2({ url: new URL("https://www.index-education.com/swie/geoloc.php"), method: "POST", content: n2, headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" } });
  if ("{}" === i2.content) return [];
  const a2 = JSON.parse(i2.content).map((e2) => ((e3, s3) => {
    const t3 = parseFloat(e3.lat), n3 = parseFloat(e3.long);
    return { url: e3.url.toLowerCase(), name: e3.nomEtab.trim().replace("COLLEGE", "COLL\xC8GE").replace("LYCEE", "LYC\xC9E"), latitude: t3, longitude: n3, postalCode: parseInt(e3.cp), distance: is(s3, [t3, n3]) };
  })(e2, [s2.latitude, s2.longitude]));
  return a2.sort((e2, s3) => e2.distance > s3.distance ? 1 : e2.distance < s3.distance ? -1 : e2.name > s3.name ? 1 : e2.name < s3.name ? -1 : 0), a2;
}, exports.gradebook = async (e2, s2) => {
  const t2 = W(e2);
  s2 = { ...s2, kind: 2 };
  const n2 = new Y(e2, "PageBulletins", { [t2.data]: { classe: {}, eleve: {}, periode: ss(s2) }, [t2.signature]: { onglet: G.Gradebook } }), i2 = await n2.send();
  return await (async (e3, s3, t3) => {
    if (0 == Object.keys(t3).length || t3.message) throw new b();
    let n3 = t3.ObjetListeAppreciations.V.ListeAppreciations.V.map((e4) => ({ name: e4.Intitule, value: e4.L }));
    const i3 = t3.ListeServices.V.map((e4) => ({ subject: Oe(e4.Matiere?.V), subjectGroup: e4.SurMatiere.V, coef: parseInt(e4.Coefficient.V), averages: { student: parseFloat(e4.MoyenneEleve.V.replace(",", ".")), classOverall: parseFloat(e4.MoyenneClasse.V.replace(",", ".")), max: parseFloat(e4.MoyenneSup.V.replace(",", ".")), min: parseFloat(e4.MoyenneInf.V.replace(",", ".")) }, assessments: e4.ListeAppreciations.V.map((e5) => e5.L), teachers: e4.ListeElements?.V.map((e5) => e5.ListeProfesseurs?.V.map((e6) => e6.L)) ?? e4.ListeProfesseurs?.V.map((e5) => e5.L) ?? [] }));
    return { overallAssessments: n3, graph: t3?.graphe?.replace("\\n", ""), subjects: i3, url: await as(e3, s3) };
  })(e2, s2, i2.data[t2.data]);
}, exports.gradebookPDF = as, exports.gradesOverview = async (e2, s2) => {
  const t2 = W(e2), n2 = new Y(e2, "DernieresNotes", { [t2.signature]: { onglet: G.Grades }, [t2.data]: { Periode: ss(s2) } }), i2 = await n2.send();
  return cs(i2.data[t2.data], e2);
}, exports.homepage = async (e2, s2 = e2.instance.nextBusinessDay) => {
  const t2 = W(e2), n2 = Le(s2, e2.instance.firstMonday), i2 = us(s2), a2 = new Y(e2, "PageAccueil", { [t2.signature]: { onglet: G.Presence }, [t2.data]: { avecConseilDeClasse: true, dateGrille: { _T: 7, V: i2 }, numeroSemaine: n2, coursNonAssures: { numeroSemaine: n2 }, personnelsAbsents: { numeroSemaine: n2 }, incidents: { numeroSemaine: n2 }, exclusions: { numeroSemaine: n2 }, donneesVS: { numeroSemaine: n2 }, registreAppel: { date: { _T: 7, V: i2 } }, previsionnelAbsServiceAnnexe: { date: { _T: 7, V: i2 } }, donneesProfs: { numeroSemaine: n2 }, EDT: { numeroSemaine: n2 }, TAFARendre: { date: { _T: 7, V: i2 } }, TAFEtActivites: { date: { _T: 7, V: i2 } }, partenaireCDI: { CDI: {} }, tableauDeBord: { date: { _T: 7, V: i2 } }, modificationsEDT: { date: { _T: 7, V: i2 } } } }), r2 = await a2.send();
  return ms(r2.data[t2.data]);
}, exports.instance = async (s2, t2 = e.defaultFetcher) => {
  s2 = r(s2), s2 += "/infoMobileApp.json?id=0D264427-EEFC-4810-A9E9-346942A862A4";
  const n2 = { url: new URL(s2) }, i2 = await t2(n2);
  return ((e2) => {
    let s3, t3;
    return e2.CAS.actif && (s3 = e2.CAS.casURL, t3 = e2.CAS.jetonCAS), { name: e2.nomEtab, version: e2.version, date: new Date(e2.date), accounts: e2.espaces.map((e3) => ({ name: e3.nom, path: e3.URL })), casURL: s3, casToken: t3 };
  })(JSON.parse(i2.content));
}, exports.loginCredentials = async (e2, s2) => {
  const t2 = r(s2.url), { information: n2, version: i2 } = await K({ base: t2, kind: s2.kind, cookies: [], params: { ...fe, bydlg: "A6ABB224-12DD-4E31-AD3E-8A39A1C2C335" } }, e2.fetcher);
  e2.information = n2, e2.instance = { version: i2 }, e2.instance = await ae(e2, s2.navigatorIdentifier);
  const a2 = await re(e2, { username: s2.username, deviceUUID: s2.deviceUUID, requestFirstMobileAuthentication: true, reuseMobileAuthentication: false, requestFromQRCode: false, useCAS: false });
  be(s2, "password", a2);
  const o2 = De(a2, s2.username, s2.password), c2 = we(e2, a2, o2), u2 = await oe(e2, c2);
  return Ae(e2, u2, o2), Ce(u2) ? ge(e2, { token: u2.jetonConnexionAppliMobile, username: a2.login ?? s2.username, deviceUUID: s2.deviceUUID }) : ve(e2, u2, a2, s2.username);
}, exports.loginQrCode = async (e2, s2) => {
  const t2 = ((e3) => {
    const s3 = e3.url, t3 = s3.lastIndexOf("/") + 1, n3 = s3.substring(0, t3 - 1), i2 = s3.substring(t3);
    return { kind: pe(i2), url: n3, token: e3.jeton, username: e3.login };
  })(s2.qr), n2 = i.default.util.createBuffer(s2.pin), a2 = (e3) => J.decrypt(i.default.util.encodeUtf8(t2[e3]), n2, i.default.util.createBuffer()), r2 = { username: a2("username"), token: a2("token") }, { information: o2, version: c2 } = await K({ base: t2.url, kind: t2.kind, cookies: ["appliMobile=1"], params: fe }, e2.fetcher);
  e2.information = o2, e2.instance = { version: c2 }, e2.instance = await ae(e2, s2.navigatorIdentifier);
  const u2 = await re(e2, { username: r2.username, deviceUUID: s2.deviceUUID, requestFirstMobileAuthentication: true, reuseMobileAuthentication: false, requestFromQRCode: true, useCAS: false });
  be(r2, "token", u2);
  const l2 = De(u2, r2.username, r2.token), d2 = we(e2, u2, l2), p2 = await oe(e2, d2);
  return Ae(e2, p2, l2), Ce(p2) ? ge(e2, { token: p2.jetonConnexionAppliMobile, username: u2.login ?? r2.username, deviceUUID: s2.deviceUUID }) : ve(e2, p2, u2, r2.username);
}, exports.loginToken = he, exports.menus = async (e2, s2 = /* @__PURE__ */ new Date()) => {
  const t2 = W(e2), n2 = new Y(e2, "PageMenus", { [t2.signature]: { onglet: G.Menus }, [t2.data]: { date: { _T: 7, V: us(s2) } } }), i2 = await n2.send();
  return { containsLunch: (a2 = i2.data[t2.data]).AvecRepasMidi, containsDinner: a2.AvecRepasSoir, days: a2.ListeJours.V.map(Ds), weeks: m(a2.DomaineDePresence.V), allergens: a2.ListeAllergenes.V.map(fs), labels: a2.Listelabels.V.map(hs) };
  var a2;
}, exports.newDiscussion = async (e2, s2, t2, n2) => {
  const i2 = W(e2), a2 = new Y(e2, "SaisieMessage", { [i2.signature]: { onglet: G.Discussions }, [i2.data]: { contenu: e2.user.authorizations.hasAdvancedDiscussionEditor ? { _T: 21, V: t2 } : t2, objet: s2, estCreationCarnetLiaison: false, listeFichiers: [], listeDestinataires: n2.map((e3) => ({ E: k.MODIFICATION, G: e3.kind, N: e3.id })) } });
  await a2.send();
}, exports.newDiscussionRecipients = async (e2, s2) => {
  const t2 = W(e2), n2 = e2.userResource, i2 = new Y(e2, "ListeRessourcesPourCommunication", { [t2.signature]: { onglet: G.Discussions }, [t2.data]: { filtreElement: { G: n2.kind, L: n2.name, N: n2.id }, onglet: { N: 0, G: s2 } } });
  return (await i2.send()).data[t2.data].listeRessourcesPourCommunication.V.filter((e3) => e3.avecDiscussion).map(As);
}, exports.news = async (e2, requestedModes) => {
  const s2 = W(e2);
  const modesToTry = requestedModes ? [requestedModes] : [[0], [1], [0, 1]];
  let lastErr = null;
  for (const modes of modesToTry) {
    try {
      const t2 = new Y(e2, "PageActualites", { [s2.signature]: { onglet: G.News }, [s2.data]: { modesAffActus: { _T: 26, V: Cs(modes) } } });
      const resp = await t2.send();
      const e3 = resp.data[s2.data];
      if (!e3) continue;
      const t3 = (e3.listeCategories?.V || e3.listeCategories || []).map(Vs);
      const allItems = [];
      const modesAffList = e3.listeModesAff || [];
      for (const m of modesAffList) {
        const actList = m.listeActualites?.V || m.listeActualites || [];
        for (const e4 of actList) {
          let n2;
          if (e4.estInformation) n2 = xs;
          else if (e4.estSondage) n2 = Ss;
          else continue;
          allItems.push(n2(e4, e2, t3));
        }
      }
      return { categories: t3, items: allItems };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}, exports.newsDelete = async (e2, s2) => {
  await vs(e2, s2, { onlyMarkAsRead: false, markAsRead: false, delete: true });
}, exports.newsInformationAcknowledge = async (e2, s2, t2 = true) => {
  if (!s2.needToAcknowledge || s2.acknowledged) return Es(e2, s2, t2);
  Ee(s2.question, ""), await vs(e2, s2, { markAsRead: t2, onlyMarkAsRead: false, delete: false }), t2 && (s2.read = true);
}, exports.newsQuestionLocalMutate = Ee, exports.newsRead = Es, exports.newsSurveySend = async (e2, s2, t2 = true) => {
  await vs(e2, s2, { markAsRead: t2, onlyMarkAsRead: false, delete: false }), t2 && (s2.read = true);
}, exports.notebook = async (e2, s2) => {
  const t2 = W(e2), n2 = new Y(e2, "PagePresence", { [t2.signature]: { onglet: G.Notebook }, [t2.data]: { periode: ss(s2), DateDebut: { _T: 7, V: us(s2.startDate) }, DateFin: { _T: 7, V: us(s2.endDate) } } });
  return ((e3, s3) => {
    const t3 = [], n3 = [], i2 = [], a2 = [], r2 = [];
    for (const o2 of e3.listeAbsences.V) switch (o2.G) {
      case 13:
        t3.push(Ns(o2));
        break;
      case 14:
        n3.push(Is(o2));
        break;
      case 41:
        i2.push(Ls(o2, s3));
        break;
      case 46:
        a2.push(Rs(o2));
        break;
      case 72:
        r2.push(Ts(o2, s3));
    }
    return { absences: t3, delays: n3, punishments: i2, observations: a2, precautionaryMeasures: r2 };
  })((await n2.send()).data[t2.data], e2);
}, exports.parseTimetable = (e2, s2, { withSuperposedCanceledClasses: t2 = false, withCanceledClasses: n2 = s2.withCanceledClasses, withPlannedClasses: i2 = true }) => {
  const a2 = s2.classes;
  if (!n2) for (const e3 of a2) "lesson" === e3.is && e3.canceled && (e3._visible = false);
  if (!i2) for (const e3 of a2) "lesson" === e3.is && false !== e3._visible && !e3.canceled && [0, 3, 4].includes(e3.kind) && (e3._visible = false);
  if (n2 && !t2) {
    let s3 = true;
    for (; s3; ) s3 = Pe(e2, a2);
  }
  s2.classes = a2.filter((e3) => false !== e3._visible);
  for (const e3 of a2) delete e3._visible;
}, exports.partnerURL = async (e2, s2) => {
  const t2 = W(e2), n2 = new Y(e2, "SaisieURLPartenaire", { [t2.signature]: { onglet: G.Presence }, [t2.data]: { SSO: s2.sso } });
  return (await n2.send()).data.RapportSaisie.urlSSO.V;
}, exports.presence = xe, exports.resource = async (e2, s2) => {
  const t2 = W(e2), n2 = new Y(e2, "donneesContenusCDT", { [t2.signature]: { onglet: G.Resources }, [t2.data]: { cahierDeTextes: { N: s2 } } }), i2 = (await n2.send()).data[t2.data].ListeCahierDeTextes.V[0];
  return ks(i2, e2);
}, exports.resourceAssignments = async (e2, s2) => {
  const t2 = W(e2), n2 = new Y(e2, "donneesContenusCDT", { [t2.signature]: { onglet: G.Resources }, [t2.data]: { pourTAF: true, cahierDeTextes: { N: s2 } } });
  return (await n2.send()).data[t2.data].ListeCahierDeTextes.V[0].ListeTravailAFaire.V.map((s3) => _e(s3, e2));
}, exports.resourcesFromIntervals = async (e2, s2, t2) => {
  const n2 = await Ge(e2, G.Resources, s2, t2);
  return Os(e2, n2).filter((e3) => s2 <= e3.endDate && e3.endDate <= t2);
}, exports.resourcesFromWeek = async (e2, s2, t2) => {
  const n2 = await Ue(e2, G.Resources, s2, t2);
  return Os(e2, n2);
}, exports.securityCheckCustomPassword = async (e2, s2) => {
  const t2 = W(e2), n2 = Q(e2), i2 = new Y(e2, "SecurisationCompteDoubleAuth", { [t2.data]: { action: R.csch_VerifierMotDePassePersonnalise, nouveauMDP: J.encrypt(s2, n2.key, n2.iv) } });
  return (await i2.send()).data[t2.data].result;
}, exports.securityCheckPIN = async (e2, s2) => {
  const t2 = W(e2), n2 = Q(e2), i2 = new Y(e2, "SecurisationCompteDoubleAuth", { [t2.data]: { action: R.csch_VerifierPIN, codePin: J.encrypt(s2, n2.key, n2.iv) } });
  return (await i2.send()).data[t2.data].result;
}, exports.securitySave = async (e2, s2, t2) => {
  const n2 = { action: R.csch_EnregistrerChoixUtilisateur }, i2 = Q(e2);
  "number" == typeof t2.mode && (n2.mode = t2.mode), t2.password && (n2.nouveauMDP = J.encrypt(t2.password, i2.key, i2.iv)), t2.pin && (n2.codePin = J.encrypt(t2.pin, i2.key, i2.iv)), t2.deviceName && (n2.avecIdentification = true, n2.strIdentification = t2.deviceName);
  const a2 = W(e2), r2 = new Y(e2, "SecurisationCompteDoubleAuth", { [a2.data]: n2 }), o2 = (await r2.send()).data[a2.data].jetonConnexionAppliMobile;
  o2 && (s2.context.authentication.jetonConnexionAppliMobile = o2);
}, exports.securitySource = async (e2, s2) => {
  if (s2.length > 30) throw new h(30);
  const t2 = W(e2), n2 = new Y(e2, "SecurisationCompteDoubleAuth", { [t2.data]: { action: R.csch_LibellesSourceConnexionDejaConnus, libelle: s2 } });
  return (await n2.send()).data[t2.data].dejaConnu;
}, exports.sessionInformation = K, exports.startPresenceInterval = (e2, s2 = 12e4) => {
  Ve(e2), e2.presence = setInterval(() => xe(e2), s2);
}, exports.timetableFromIntervals = async (e2, s2, t2) => Gs(e2, { ...Fs("dateDebut", { _T: 7, V: us(s2) }), ...t2 && Fs("dateFin", { _T: 7, V: us(t2) }) }), exports.timetableFromWeek = async (e2, s2) => Gs(e2, Fs("numeroSemaine", s2)), exports.timetableICalURL = (e2, s2, t2 = "timetable") => {
  const n2 = e2.instance.version.join(".");
  return `${e2.information.url}/ical/${t2}.ics?icalsecurise=${s2}&version=${n2}&param=266f3d32`;
}, exports.translateToWeekNumber = Le, exports.use = me;
