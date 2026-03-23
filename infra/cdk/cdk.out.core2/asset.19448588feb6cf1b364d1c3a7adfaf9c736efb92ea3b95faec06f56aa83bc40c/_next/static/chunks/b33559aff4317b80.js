(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  34582,
  (e, t, r) => {
    'use strict';
    ((r.byteLength = function (e) {
      var t = f(e),
        r = t[0],
        n = t[1];
      return ((r + n) * 3) / 4 - n;
    }),
      (r.toByteArray = function (e) {
        var t,
          r,
          n = f(e),
          s = n[0],
          a = n[1],
          u = new o(((s + a) * 3) / 4 - a),
          h = 0,
          c = a > 0 ? s - 4 : s;
        for (r = 0; r < c; r += 4)
          ((t =
            (i[e.charCodeAt(r)] << 18) |
            (i[e.charCodeAt(r + 1)] << 12) |
            (i[e.charCodeAt(r + 2)] << 6) |
            i[e.charCodeAt(r + 3)]),
            (u[h++] = (t >> 16) & 255),
            (u[h++] = (t >> 8) & 255),
            (u[h++] = 255 & t));
        return (
          2 === a &&
            ((t = (i[e.charCodeAt(r)] << 2) | (i[e.charCodeAt(r + 1)] >> 4)), (u[h++] = 255 & t)),
          1 === a &&
            ((t =
              (i[e.charCodeAt(r)] << 10) |
              (i[e.charCodeAt(r + 1)] << 4) |
              (i[e.charCodeAt(r + 2)] >> 2)),
            (u[h++] = (t >> 8) & 255),
            (u[h++] = 255 & t)),
          u
        );
      }),
      (r.fromByteArray = function (e) {
        for (var t, r = e.length, i = r % 3, o = [], s = 0, a = r - i; s < a; s += 16383)
          o.push(
            (function (e, t, r) {
              for (var i, o = [], s = t; s < r; s += 3)
                ((i = ((e[s] << 16) & 0xff0000) + ((e[s + 1] << 8) & 65280) + (255 & e[s + 2])),
                  o.push(n[(i >> 18) & 63] + n[(i >> 12) & 63] + n[(i >> 6) & 63] + n[63 & i]));
              return o.join('');
            })(e, s, s + 16383 > a ? a : s + 16383)
          );
        return (
          1 === i
            ? o.push(n[(t = e[r - 1]) >> 2] + n[(t << 4) & 63] + '==')
            : 2 === i &&
              o.push(
                n[(t = (e[r - 2] << 8) + e[r - 1]) >> 10] +
                  n[(t >> 4) & 63] +
                  n[(t << 2) & 63] +
                  '='
              ),
          o.join('')
        );
      }));
    for (
      var n = [],
        i = [],
        o = 'undefined' != typeof Uint8Array ? Uint8Array : Array,
        s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
        a = 0,
        u = s.length;
      a < u;
      ++a
    )
      ((n[a] = s[a]), (i[s.charCodeAt(a)] = a));
    function f(e) {
      var t = e.length;
      if (t % 4 > 0) throw Error('Invalid string. Length must be a multiple of 4');
      var r = e.indexOf('=');
      -1 === r && (r = t);
      var n = r === t ? 0 : 4 - (r % 4);
      return [r, n];
    }
    ((i[45] = 62), (i[95] = 63));
  },
  38492,
  (e, t, r) => {
    ((r.read = function (e, t, r, n, i) {
      var o,
        s,
        a = 8 * i - n - 1,
        u = (1 << a) - 1,
        f = u >> 1,
        h = -7,
        c = r ? i - 1 : 0,
        l = r ? -1 : 1,
        d = e[t + c];
      for (
        c += l, o = d & ((1 << -h) - 1), d >>= -h, h += a;
        h > 0;
        o = 256 * o + e[t + c], c += l, h -= 8
      );
      for (
        s = o & ((1 << -h) - 1), o >>= -h, h += n;
        h > 0;
        s = 256 * s + e[t + c], c += l, h -= 8
      );
      if (0 === o) o = 1 - f;
      else {
        if (o === u) return s ? NaN : (1 / 0) * (d ? -1 : 1);
        ((s += Math.pow(2, n)), (o -= f));
      }
      return (d ? -1 : 1) * s * Math.pow(2, o - n);
    }),
      (r.write = function (e, t, r, n, i, o) {
        var s,
          a,
          u,
          f = 8 * o - i - 1,
          h = (1 << f) - 1,
          c = h >> 1,
          l = 5960464477539062e-23 * (23 === i),
          d = n ? 0 : o - 1,
          p = n ? 1 : -1,
          g = +(t < 0 || (0 === t && 1 / t < 0));
        for (
          isNaN((t = Math.abs(t))) || t === 1 / 0
            ? ((a = +!!isNaN(t)), (s = h))
            : ((s = Math.floor(Math.log(t) / Math.LN2)),
              t * (u = Math.pow(2, -s)) < 1 && (s--, (u *= 2)),
              s + c >= 1 ? (t += l / u) : (t += l * Math.pow(2, 1 - c)),
              t * u >= 2 && (s++, (u /= 2)),
              s + c >= h
                ? ((a = 0), (s = h))
                : s + c >= 1
                  ? ((a = (t * u - 1) * Math.pow(2, i)), (s += c))
                  : ((a = t * Math.pow(2, c - 1) * Math.pow(2, i)), (s = 0)));
          i >= 8;
          e[r + d] = 255 & a, d += p, a /= 256, i -= 8
        );
        for (s = (s << i) | a, f += i; f > 0; e[r + d] = 255 & s, d += p, s /= 256, f -= 8);
        e[r + d - p] |= 128 * g;
      }));
  },
  49947,
  (e, t, r) => {
    var n = {}.toString;
    t.exports =
      Array.isArray ||
      function (e) {
        return '[object Array]' == n.call(e);
      };
  },
  43943,
  (e, t, r) => {
    'use strict';
    var n = e.r(34582),
      i = e.r(38492),
      o = e.r(49947);
    function s() {
      return u.TYPED_ARRAY_SUPPORT ? 0x7fffffff : 0x3fffffff;
    }
    function a(e, t) {
      if (s() < t) throw RangeError('Invalid typed array length');
      return (
        u.TYPED_ARRAY_SUPPORT
          ? ((e = new Uint8Array(t)).__proto__ = u.prototype)
          : (null === e && (e = new u(t)), (e.length = t)),
        e
      );
    }
    function u(e, t, r) {
      if (!u.TYPED_ARRAY_SUPPORT && !(this instanceof u)) return new u(e, t, r);
      if ('number' == typeof e) {
        if ('string' == typeof t)
          throw Error('If encoding is specified then the first argument must be a string');
        return c(this, e);
      }
      return f(this, e, t, r);
    }
    function f(e, t, r, n) {
      if ('number' == typeof t) throw TypeError('"value" argument must not be a number');
      return 'undefined' != typeof ArrayBuffer && t instanceof ArrayBuffer
        ? (function (e, t, r, n) {
            if ((t.byteLength, r < 0 || t.byteLength < r))
              throw RangeError("'offset' is out of bounds");
            if (t.byteLength < r + (n || 0)) throw RangeError("'length' is out of bounds");
            return (
              (t =
                void 0 === r && void 0 === n
                  ? new Uint8Array(t)
                  : void 0 === n
                    ? new Uint8Array(t, r)
                    : new Uint8Array(t, r, n)),
              u.TYPED_ARRAY_SUPPORT ? ((e = t).__proto__ = u.prototype) : (e = l(e, t)),
              e
            );
          })(e, t, r, n)
        : 'string' == typeof t
          ? (function (e, t, r) {
              if ((('string' != typeof r || '' === r) && (r = 'utf8'), !u.isEncoding(r)))
                throw TypeError('"encoding" must be a valid string encoding');
              var n = 0 | p(t, r),
                i = (e = a(e, n)).write(t, r);
              return (i !== n && (e = e.slice(0, i)), e);
            })(e, t, r)
          : (function (e, t) {
              if (u.isBuffer(t)) {
                var r,
                  n = 0 | d(t.length);
                return (0 === (e = a(e, n)).length || t.copy(e, 0, 0, n), e);
              }
              if (t) {
                if (
                  ('undefined' != typeof ArrayBuffer && t.buffer instanceof ArrayBuffer) ||
                  'length' in t
                ) {
                  return 'number' != typeof t.length || (r = t.length) != r ? a(e, 0) : l(e, t);
                }
                if ('Buffer' === t.type && o(t.data)) return l(e, t.data);
              }
              throw TypeError(
                'First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.'
              );
            })(e, t);
    }
    function h(e) {
      if ('number' != typeof e) throw TypeError('"size" argument must be a number');
      if (e < 0) throw RangeError('"size" argument must not be negative');
    }
    function c(e, t) {
      if ((h(t), (e = a(e, t < 0 ? 0 : 0 | d(t))), !u.TYPED_ARRAY_SUPPORT))
        for (var r = 0; r < t; ++r) e[r] = 0;
      return e;
    }
    function l(e, t) {
      var r = t.length < 0 ? 0 : 0 | d(t.length);
      e = a(e, r);
      for (var n = 0; n < r; n += 1) e[n] = 255 & t[n];
      return e;
    }
    function d(e) {
      if (e >= s())
        throw RangeError(
          'Attempt to allocate Buffer larger than maximum size: 0x' + s().toString(16) + ' bytes'
        );
      return 0 | e;
    }
    function p(e, t) {
      if (u.isBuffer(e)) return e.length;
      if (
        'undefined' != typeof ArrayBuffer &&
        'function' == typeof ArrayBuffer.isView &&
        (ArrayBuffer.isView(e) || e instanceof ArrayBuffer)
      )
        return e.byteLength;
      'string' != typeof e && (e = '' + e);
      var r = e.length;
      if (0 === r) return 0;
      for (var n = !1; ; )
        switch (t) {
          case 'ascii':
          case 'latin1':
          case 'binary':
            return r;
          case 'utf8':
          case 'utf-8':
          case void 0:
            return I(e).length;
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return 2 * r;
          case 'hex':
            return r >>> 1;
          case 'base64':
            return _(e).length;
          default:
            if (n) return I(e).length;
            ((t = ('' + t).toLowerCase()), (n = !0));
        }
    }
    function g(e, t, r) {
      var i,
        o,
        s,
        a = !1;
      if (
        ((void 0 === t || t < 0) && (t = 0),
        t > this.length ||
          ((void 0 === r || r > this.length) && (r = this.length),
          r <= 0 || (r >>>= 0) <= (t >>>= 0)))
      )
        return '';
      for (e || (e = 'utf8'); ; )
        switch (e) {
          case 'hex':
            return (function (e, t, r) {
              var n,
                i = e.length;
              ((!t || t < 0) && (t = 0), (!r || r < 0 || r > i) && (r = i));
              for (var o = '', s = t; s < r; ++s) {
                o += (n = e[s]) < 16 ? '0' + n.toString(16) : n.toString(16);
              }
              return o;
            })(this, t, r);
          case 'utf8':
          case 'utf-8':
            return S(this, t, r);
          case 'ascii':
            return (function (e, t, r) {
              var n = '';
              r = Math.min(e.length, r);
              for (var i = t; i < r; ++i) n += String.fromCharCode(127 & e[i]);
              return n;
            })(this, t, r);
          case 'latin1':
          case 'binary':
            return (function (e, t, r) {
              var n = '';
              r = Math.min(e.length, r);
              for (var i = t; i < r; ++i) n += String.fromCharCode(e[i]);
              return n;
            })(this, t, r);
          case 'base64':
            return (
              (i = this),
              (o = t),
              (s = r),
              0 === o && s === i.length ? n.fromByteArray(i) : n.fromByteArray(i.slice(o, s))
            );
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return (function (e, t, r) {
              for (var n = e.slice(t, r), i = '', o = 0; o < n.length; o += 2)
                i += String.fromCharCode(n[o] + 256 * n[o + 1]);
              return i;
            })(this, t, r);
          default:
            if (a) throw TypeError('Unknown encoding: ' + e);
            ((e = (e + '').toLowerCase()), (a = !0));
        }
    }
    function y(e, t, r) {
      var n = e[t];
      ((e[t] = e[r]), (e[r] = n));
    }
    function m(e, t, r, n, i) {
      if (0 === e.length) return -1;
      if (
        ('string' == typeof r
          ? ((n = r), (r = 0))
          : r > 0x7fffffff
            ? (r = 0x7fffffff)
            : r < -0x80000000 && (r = -0x80000000),
        isNaN((r *= 1)) && (r = i ? 0 : e.length - 1),
        r < 0 && (r = e.length + r),
        r >= e.length)
      )
        if (i) return -1;
        else r = e.length - 1;
      else if (r < 0)
        if (!i) return -1;
        else r = 0;
      if (('string' == typeof t && (t = u.from(t, n)), u.isBuffer(t)))
        return 0 === t.length ? -1 : v(e, t, r, n, i);
      if ('number' == typeof t) {
        if (
          ((t &= 255), u.TYPED_ARRAY_SUPPORT && 'function' == typeof Uint8Array.prototype.indexOf)
        )
          if (i) return Uint8Array.prototype.indexOf.call(e, t, r);
          else return Uint8Array.prototype.lastIndexOf.call(e, t, r);
        return v(e, [t], r, n, i);
      }
      throw TypeError('val must be string, number or Buffer');
    }
    function v(e, t, r, n, i) {
      var o,
        s = 1,
        a = e.length,
        u = t.length;
      if (
        void 0 !== n &&
        ('ucs2' === (n = String(n).toLowerCase()) ||
          'ucs-2' === n ||
          'utf16le' === n ||
          'utf-16le' === n)
      ) {
        if (e.length < 2 || t.length < 2) return -1;
        ((s = 2), (a /= 2), (u /= 2), (r /= 2));
      }
      function f(e, t) {
        return 1 === s ? e[t] : e.readUInt16BE(t * s);
      }
      if (i) {
        var h = -1;
        for (o = r; o < a; o++)
          if (f(e, o) === f(t, -1 === h ? 0 : o - h)) {
            if ((-1 === h && (h = o), o - h + 1 === u)) return h * s;
          } else (-1 !== h && (o -= o - h), (h = -1));
      } else
        for (r + u > a && (r = a - u), o = r; o >= 0; o--) {
          for (var c = !0, l = 0; l < u; l++)
            if (f(e, o + l) !== f(t, l)) {
              c = !1;
              break;
            }
          if (c) return o;
        }
      return -1;
    }
    ((r.Buffer = u),
      (r.SlowBuffer = function (e) {
        return (+e != e && (e = 0), u.alloc(+e));
      }),
      (r.INSPECT_MAX_BYTES = 50),
      (u.TYPED_ARRAY_SUPPORT =
        void 0 !== e.g.TYPED_ARRAY_SUPPORT
          ? e.g.TYPED_ARRAY_SUPPORT
          : (function () {
              try {
                var e = new Uint8Array(1);
                return (
                  (e.__proto__ = {
                    __proto__: Uint8Array.prototype,
                    foo: function () {
                      return 42;
                    },
                  }),
                  42 === e.foo() &&
                    'function' == typeof e.subarray &&
                    0 === e.subarray(1, 1).byteLength
                );
              } catch (e) {
                return !1;
              }
            })()),
      (r.kMaxLength = s()),
      (u.poolSize = 8192),
      (u._augment = function (e) {
        return ((e.__proto__ = u.prototype), e);
      }),
      (u.from = function (e, t, r) {
        return f(null, e, t, r);
      }),
      u.TYPED_ARRAY_SUPPORT &&
        ((u.prototype.__proto__ = Uint8Array.prototype),
        (u.__proto__ = Uint8Array),
        'undefined' != typeof Symbol &&
          Symbol.species &&
          u[Symbol.species] === u &&
          Object.defineProperty(u, Symbol.species, { value: null, configurable: !0 })),
      (u.alloc = function (e, t, r) {
        return (h(e), e <= 0)
          ? a(null, e)
          : void 0 !== t
            ? 'string' == typeof r
              ? a(null, e).fill(t, r)
              : a(null, e).fill(t)
            : a(null, e);
      }),
      (u.allocUnsafe = function (e) {
        return c(null, e);
      }),
      (u.allocUnsafeSlow = function (e) {
        return c(null, e);
      }),
      (u.isBuffer = function (e) {
        return !!(null != e && e._isBuffer);
      }),
      (u.compare = function (e, t) {
        if (!u.isBuffer(e) || !u.isBuffer(t)) throw TypeError('Arguments must be Buffers');
        if (e === t) return 0;
        for (var r = e.length, n = t.length, i = 0, o = Math.min(r, n); i < o; ++i)
          if (e[i] !== t[i]) {
            ((r = e[i]), (n = t[i]));
            break;
          }
        return r < n ? -1 : +(n < r);
      }),
      (u.isEncoding = function (e) {
        switch (String(e).toLowerCase()) {
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
            return !0;
          default:
            return !1;
        }
      }),
      (u.concat = function (e, t) {
        if (!o(e)) throw TypeError('"list" argument must be an Array of Buffers');
        if (0 === e.length) return u.alloc(0);
        if (void 0 === t) for (r = 0, t = 0; r < e.length; ++r) t += e[r].length;
        var r,
          n = u.allocUnsafe(t),
          i = 0;
        for (r = 0; r < e.length; ++r) {
          var s = e[r];
          if (!u.isBuffer(s)) throw TypeError('"list" argument must be an Array of Buffers');
          (s.copy(n, i), (i += s.length));
        }
        return n;
      }),
      (u.byteLength = p),
      (u.prototype._isBuffer = !0),
      (u.prototype.swap16 = function () {
        var e = this.length;
        if (e % 2 != 0) throw RangeError('Buffer size must be a multiple of 16-bits');
        for (var t = 0; t < e; t += 2) y(this, t, t + 1);
        return this;
      }),
      (u.prototype.swap32 = function () {
        var e = this.length;
        if (e % 4 != 0) throw RangeError('Buffer size must be a multiple of 32-bits');
        for (var t = 0; t < e; t += 4) (y(this, t, t + 3), y(this, t + 1, t + 2));
        return this;
      }),
      (u.prototype.swap64 = function () {
        var e = this.length;
        if (e % 8 != 0) throw RangeError('Buffer size must be a multiple of 64-bits');
        for (var t = 0; t < e; t += 8)
          (y(this, t, t + 7), y(this, t + 1, t + 6), y(this, t + 2, t + 5), y(this, t + 3, t + 4));
        return this;
      }),
      (u.prototype.toString = function () {
        var e = 0 | this.length;
        return 0 === e ? '' : 0 == arguments.length ? S(this, 0, e) : g.apply(this, arguments);
      }),
      (u.prototype.equals = function (e) {
        if (!u.isBuffer(e)) throw TypeError('Argument must be a Buffer');
        return this === e || 0 === u.compare(this, e);
      }),
      (u.prototype.inspect = function () {
        var e = '',
          t = r.INSPECT_MAX_BYTES;
        return (
          this.length > 0 &&
            ((e = this.toString('hex', 0, t).match(/.{2}/g).join(' ')),
            this.length > t && (e += ' ... ')),
          '<Buffer ' + e + '>'
        );
      }),
      (u.prototype.compare = function (e, t, r, n, i) {
        if (!u.isBuffer(e)) throw TypeError('Argument must be a Buffer');
        if (
          (void 0 === t && (t = 0),
          void 0 === r && (r = e ? e.length : 0),
          void 0 === n && (n = 0),
          void 0 === i && (i = this.length),
          t < 0 || r > e.length || n < 0 || i > this.length)
        )
          throw RangeError('out of range index');
        if (n >= i && t >= r) return 0;
        if (n >= i) return -1;
        if (t >= r) return 1;
        if (((t >>>= 0), (r >>>= 0), (n >>>= 0), (i >>>= 0), this === e)) return 0;
        for (
          var o = i - n,
            s = r - t,
            a = Math.min(o, s),
            f = this.slice(n, i),
            h = e.slice(t, r),
            c = 0;
          c < a;
          ++c
        )
          if (f[c] !== h[c]) {
            ((o = f[c]), (s = h[c]));
            break;
          }
        return o < s ? -1 : +(s < o);
      }),
      (u.prototype.includes = function (e, t, r) {
        return -1 !== this.indexOf(e, t, r);
      }),
      (u.prototype.indexOf = function (e, t, r) {
        return m(this, e, t, r, !0);
      }),
      (u.prototype.lastIndexOf = function (e, t, r) {
        return m(this, e, t, r, !1);
      }));
    function S(e, t, r) {
      r = Math.min(e.length, r);
      for (var n = [], i = t; i < r; ) {
        var o,
          s,
          a,
          u,
          f = e[i],
          h = null,
          c = f > 239 ? 4 : f > 223 ? 3 : f > 191 ? 2 : 1;
        if (i + c <= r)
          switch (c) {
            case 1:
              f < 128 && (h = f);
              break;
            case 2:
              (192 & (o = e[i + 1])) == 128 && (u = ((31 & f) << 6) | (63 & o)) > 127 && (h = u);
              break;
            case 3:
              ((o = e[i + 1]),
                (s = e[i + 2]),
                (192 & o) == 128 &&
                  (192 & s) == 128 &&
                  (u = ((15 & f) << 12) | ((63 & o) << 6) | (63 & s)) > 2047 &&
                  (u < 55296 || u > 57343) &&
                  (h = u));
              break;
            case 4:
              ((o = e[i + 1]),
                (s = e[i + 2]),
                (a = e[i + 3]),
                (192 & o) == 128 &&
                  (192 & s) == 128 &&
                  (192 & a) == 128 &&
                  (u = ((15 & f) << 18) | ((63 & o) << 12) | ((63 & s) << 6) | (63 & a)) > 65535 &&
                  u < 1114112 &&
                  (h = u));
          }
        (null === h
          ? ((h = 65533), (c = 1))
          : h > 65535 &&
            ((h -= 65536), n.push(((h >>> 10) & 1023) | 55296), (h = 56320 | (1023 & h))),
          n.push(h),
          (i += c));
      }
      var l = n,
        d = l.length;
      if (d <= 4096) return String.fromCharCode.apply(String, l);
      for (var p = '', g = 0; g < d; )
        p += String.fromCharCode.apply(String, l.slice(g, (g += 4096)));
      return p;
    }
    function w(e, t, r) {
      if (e % 1 != 0 || e < 0) throw RangeError('offset is not uint');
      if (e + t > r) throw RangeError('Trying to access beyond buffer length');
    }
    function b(e, t, r, n, i, o) {
      if (!u.isBuffer(e)) throw TypeError('"buffer" argument must be a Buffer instance');
      if (t > i || t < o) throw RangeError('"value" argument is out of bounds');
      if (r + n > e.length) throw RangeError('Index out of range');
    }
    function A(e, t, r, n) {
      t < 0 && (t = 65535 + t + 1);
      for (var i = 0, o = Math.min(e.length - r, 2); i < o; ++i)
        e[r + i] = (t & (255 << (8 * (n ? i : 1 - i)))) >>> ((n ? i : 1 - i) * 8);
    }
    function C(e, t, r, n) {
      t < 0 && (t = 0xffffffff + t + 1);
      for (var i = 0, o = Math.min(e.length - r, 4); i < o; ++i)
        e[r + i] = (t >>> ((n ? i : 3 - i) * 8)) & 255;
    }
    function E(e, t, r, n, i, o) {
      if (r + n > e.length || r < 0) throw RangeError('Index out of range');
    }
    function U(e, t, r, n, o) {
      return (
        o || E(e, t, r, 4, 34028234663852886e22, -34028234663852886e22),
        i.write(e, t, r, n, 23, 4),
        r + 4
      );
    }
    function T(e, t, r, n, o) {
      return (
        o || E(e, t, r, 8, 17976931348623157e292, -17976931348623157e292),
        i.write(e, t, r, n, 52, 8),
        r + 8
      );
    }
    ((u.prototype.write = function (e, t, r, n) {
      if (void 0 === t) ((n = 'utf8'), (r = this.length), (t = 0));
      else if (void 0 === r && 'string' == typeof t) ((n = t), (r = this.length), (t = 0));
      else if (isFinite(t))
        ((t |= 0),
          isFinite(r) ? ((r |= 0), void 0 === n && (n = 'utf8')) : ((n = r), (r = void 0)));
      else throw Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
      var i,
        o,
        s,
        a,
        u,
        f,
        h,
        c,
        l = this.length - t;
      if (
        ((void 0 === r || r > l) && (r = l), (e.length > 0 && (r < 0 || t < 0)) || t > this.length)
      )
        throw RangeError('Attempt to write outside buffer bounds');
      n || (n = 'utf8');
      for (var d = !1; ; )
        switch (n) {
          case 'hex':
            return (function (e, t, r, n) {
              r = Number(r) || 0;
              var i = e.length - r;
              n ? (n = Number(n)) > i && (n = i) : (n = i);
              var o = t.length;
              if (o % 2 != 0) throw TypeError('Invalid hex string');
              n > o / 2 && (n = o / 2);
              for (var s = 0; s < n; ++s) {
                var a = parseInt(t.substr(2 * s, 2), 16);
                if (isNaN(a)) break;
                e[r + s] = a;
              }
              return s;
            })(this, e, t, r);
          case 'utf8':
          case 'utf-8':
            return ((i = t), (o = r), R(I(e, this.length - i), this, i, o));
          case 'ascii':
            return ((s = t), (a = r), R(D(e), this, s, a));
          case 'latin1':
          case 'binary':
            return (function (e, t, r, n) {
              return R(D(t), e, r, n);
            })(this, e, t, r);
          case 'base64':
            return ((u = t), (f = r), R(_(e), this, u, f));
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return (
              (h = t),
              (c = r),
              R(
                (function (e, t) {
                  for (var r, n, i = [], o = 0; o < e.length && !((t -= 2) < 0); ++o)
                    ((n = (r = e.charCodeAt(o)) >> 8), i.push(r % 256), i.push(n));
                  return i;
                })(e, this.length - h),
                this,
                h,
                c
              )
            );
          default:
            if (d) throw TypeError('Unknown encoding: ' + n);
            ((n = ('' + n).toLowerCase()), (d = !0));
        }
    }),
      (u.prototype.toJSON = function () {
        return { type: 'Buffer', data: Array.prototype.slice.call(this._arr || this, 0) };
      }),
      (u.prototype.slice = function (e, t) {
        var r,
          n = this.length;
        if (
          ((e = ~~e),
          (t = void 0 === t ? n : ~~t),
          e < 0 ? (e += n) < 0 && (e = 0) : e > n && (e = n),
          t < 0 ? (t += n) < 0 && (t = 0) : t > n && (t = n),
          t < e && (t = e),
          u.TYPED_ARRAY_SUPPORT)
        )
          (r = this.subarray(e, t)).__proto__ = u.prototype;
        else {
          var i = t - e;
          r = new u(i, void 0);
          for (var o = 0; o < i; ++o) r[o] = this[o + e];
        }
        return r;
      }),
      (u.prototype.readUIntLE = function (e, t, r) {
        ((e |= 0), (t |= 0), r || w(e, t, this.length));
        for (var n = this[e], i = 1, o = 0; ++o < t && (i *= 256); ) n += this[e + o] * i;
        return n;
      }),
      (u.prototype.readUIntBE = function (e, t, r) {
        ((e |= 0), (t |= 0), r || w(e, t, this.length));
        for (var n = this[e + --t], i = 1; t > 0 && (i *= 256); ) n += this[e + --t] * i;
        return n;
      }),
      (u.prototype.readUInt8 = function (e, t) {
        return (t || w(e, 1, this.length), this[e]);
      }),
      (u.prototype.readUInt16LE = function (e, t) {
        return (t || w(e, 2, this.length), this[e] | (this[e + 1] << 8));
      }),
      (u.prototype.readUInt16BE = function (e, t) {
        return (t || w(e, 2, this.length), (this[e] << 8) | this[e + 1]);
      }),
      (u.prototype.readUInt32LE = function (e, t) {
        return (
          t || w(e, 4, this.length),
          (this[e] | (this[e + 1] << 8) | (this[e + 2] << 16)) + 0x1000000 * this[e + 3]
        );
      }),
      (u.prototype.readUInt32BE = function (e, t) {
        return (
          t || w(e, 4, this.length),
          0x1000000 * this[e] + ((this[e + 1] << 16) | (this[e + 2] << 8) | this[e + 3])
        );
      }),
      (u.prototype.readIntLE = function (e, t, r) {
        ((e |= 0), (t |= 0), r || w(e, t, this.length));
        for (var n = this[e], i = 1, o = 0; ++o < t && (i *= 256); ) n += this[e + o] * i;
        return (n >= (i *= 128) && (n -= Math.pow(2, 8 * t)), n);
      }),
      (u.prototype.readIntBE = function (e, t, r) {
        ((e |= 0), (t |= 0), r || w(e, t, this.length));
        for (var n = t, i = 1, o = this[e + --n]; n > 0 && (i *= 256); ) o += this[e + --n] * i;
        return (o >= (i *= 128) && (o -= Math.pow(2, 8 * t)), o);
      }),
      (u.prototype.readInt8 = function (e, t) {
        return (t || w(e, 1, this.length), 128 & this[e]) ? -((255 - this[e] + 1) * 1) : this[e];
      }),
      (u.prototype.readInt16LE = function (e, t) {
        t || w(e, 2, this.length);
        var r = this[e] | (this[e + 1] << 8);
        return 32768 & r ? 0xffff0000 | r : r;
      }),
      (u.prototype.readInt16BE = function (e, t) {
        t || w(e, 2, this.length);
        var r = this[e + 1] | (this[e] << 8);
        return 32768 & r ? 0xffff0000 | r : r;
      }),
      (u.prototype.readInt32LE = function (e, t) {
        return (
          t || w(e, 4, this.length),
          this[e] | (this[e + 1] << 8) | (this[e + 2] << 16) | (this[e + 3] << 24)
        );
      }),
      (u.prototype.readInt32BE = function (e, t) {
        return (
          t || w(e, 4, this.length),
          (this[e] << 24) | (this[e + 1] << 16) | (this[e + 2] << 8) | this[e + 3]
        );
      }),
      (u.prototype.readFloatLE = function (e, t) {
        return (t || w(e, 4, this.length), i.read(this, e, !0, 23, 4));
      }),
      (u.prototype.readFloatBE = function (e, t) {
        return (t || w(e, 4, this.length), i.read(this, e, !1, 23, 4));
      }),
      (u.prototype.readDoubleLE = function (e, t) {
        return (t || w(e, 8, this.length), i.read(this, e, !0, 52, 8));
      }),
      (u.prototype.readDoubleBE = function (e, t) {
        return (t || w(e, 8, this.length), i.read(this, e, !1, 52, 8));
      }),
      (u.prototype.writeUIntLE = function (e, t, r, n) {
        if (((e *= 1), (t |= 0), (r |= 0), !n)) {
          var i = Math.pow(2, 8 * r) - 1;
          b(this, e, t, r, i, 0);
        }
        var o = 1,
          s = 0;
        for (this[t] = 255 & e; ++s < r && (o *= 256); ) this[t + s] = (e / o) & 255;
        return t + r;
      }),
      (u.prototype.writeUIntBE = function (e, t, r, n) {
        if (((e *= 1), (t |= 0), (r |= 0), !n)) {
          var i = Math.pow(2, 8 * r) - 1;
          b(this, e, t, r, i, 0);
        }
        var o = r - 1,
          s = 1;
        for (this[t + o] = 255 & e; --o >= 0 && (s *= 256); ) this[t + o] = (e / s) & 255;
        return t + r;
      }),
      (u.prototype.writeUInt8 = function (e, t, r) {
        return (
          (e *= 1),
          (t |= 0),
          r || b(this, e, t, 1, 255, 0),
          u.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)),
          (this[t] = 255 & e),
          t + 1
        );
      }),
      (u.prototype.writeUInt16LE = function (e, t, r) {
        return (
          (e *= 1),
          (t |= 0),
          r || b(this, e, t, 2, 65535, 0),
          u.TYPED_ARRAY_SUPPORT
            ? ((this[t] = 255 & e), (this[t + 1] = e >>> 8))
            : A(this, e, t, !0),
          t + 2
        );
      }),
      (u.prototype.writeUInt16BE = function (e, t, r) {
        return (
          (e *= 1),
          (t |= 0),
          r || b(this, e, t, 2, 65535, 0),
          u.TYPED_ARRAY_SUPPORT
            ? ((this[t] = e >>> 8), (this[t + 1] = 255 & e))
            : A(this, e, t, !1),
          t + 2
        );
      }),
      (u.prototype.writeUInt32LE = function (e, t, r) {
        return (
          (e *= 1),
          (t |= 0),
          r || b(this, e, t, 4, 0xffffffff, 0),
          u.TYPED_ARRAY_SUPPORT
            ? ((this[t + 3] = e >>> 24),
              (this[t + 2] = e >>> 16),
              (this[t + 1] = e >>> 8),
              (this[t] = 255 & e))
            : C(this, e, t, !0),
          t + 4
        );
      }),
      (u.prototype.writeUInt32BE = function (e, t, r) {
        return (
          (e *= 1),
          (t |= 0),
          r || b(this, e, t, 4, 0xffffffff, 0),
          u.TYPED_ARRAY_SUPPORT
            ? ((this[t] = e >>> 24),
              (this[t + 1] = e >>> 16),
              (this[t + 2] = e >>> 8),
              (this[t + 3] = 255 & e))
            : C(this, e, t, !1),
          t + 4
        );
      }),
      (u.prototype.writeIntLE = function (e, t, r, n) {
        if (((e *= 1), (t |= 0), !n)) {
          var i = Math.pow(2, 8 * r - 1);
          b(this, e, t, r, i - 1, -i);
        }
        var o = 0,
          s = 1,
          a = 0;
        for (this[t] = 255 & e; ++o < r && (s *= 256); )
          (e < 0 && 0 === a && 0 !== this[t + o - 1] && (a = 1),
            (this[t + o] = (((e / s) | 0) - a) & 255));
        return t + r;
      }),
      (u.prototype.writeIntBE = function (e, t, r, n) {
        if (((e *= 1), (t |= 0), !n)) {
          var i = Math.pow(2, 8 * r - 1);
          b(this, e, t, r, i - 1, -i);
        }
        var o = r - 1,
          s = 1,
          a = 0;
        for (this[t + o] = 255 & e; --o >= 0 && (s *= 256); )
          (e < 0 && 0 === a && 0 !== this[t + o + 1] && (a = 1),
            (this[t + o] = (((e / s) | 0) - a) & 255));
        return t + r;
      }),
      (u.prototype.writeInt8 = function (e, t, r) {
        return (
          (e *= 1),
          (t |= 0),
          r || b(this, e, t, 1, 127, -128),
          u.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)),
          e < 0 && (e = 255 + e + 1),
          (this[t] = 255 & e),
          t + 1
        );
      }),
      (u.prototype.writeInt16LE = function (e, t, r) {
        return (
          (e *= 1),
          (t |= 0),
          r || b(this, e, t, 2, 32767, -32768),
          u.TYPED_ARRAY_SUPPORT
            ? ((this[t] = 255 & e), (this[t + 1] = e >>> 8))
            : A(this, e, t, !0),
          t + 2
        );
      }),
      (u.prototype.writeInt16BE = function (e, t, r) {
        return (
          (e *= 1),
          (t |= 0),
          r || b(this, e, t, 2, 32767, -32768),
          u.TYPED_ARRAY_SUPPORT
            ? ((this[t] = e >>> 8), (this[t + 1] = 255 & e))
            : A(this, e, t, !1),
          t + 2
        );
      }),
      (u.prototype.writeInt32LE = function (e, t, r) {
        return (
          (e *= 1),
          (t |= 0),
          r || b(this, e, t, 4, 0x7fffffff, -0x80000000),
          u.TYPED_ARRAY_SUPPORT
            ? ((this[t] = 255 & e),
              (this[t + 1] = e >>> 8),
              (this[t + 2] = e >>> 16),
              (this[t + 3] = e >>> 24))
            : C(this, e, t, !0),
          t + 4
        );
      }),
      (u.prototype.writeInt32BE = function (e, t, r) {
        return (
          (e *= 1),
          (t |= 0),
          r || b(this, e, t, 4, 0x7fffffff, -0x80000000),
          e < 0 && (e = 0xffffffff + e + 1),
          u.TYPED_ARRAY_SUPPORT
            ? ((this[t] = e >>> 24),
              (this[t + 1] = e >>> 16),
              (this[t + 2] = e >>> 8),
              (this[t + 3] = 255 & e))
            : C(this, e, t, !1),
          t + 4
        );
      }),
      (u.prototype.writeFloatLE = function (e, t, r) {
        return U(this, e, t, !0, r);
      }),
      (u.prototype.writeFloatBE = function (e, t, r) {
        return U(this, e, t, !1, r);
      }),
      (u.prototype.writeDoubleLE = function (e, t, r) {
        return T(this, e, t, !0, r);
      }),
      (u.prototype.writeDoubleBE = function (e, t, r) {
        return T(this, e, t, !1, r);
      }),
      (u.prototype.copy = function (e, t, r, n) {
        if (
          (r || (r = 0),
          n || 0 === n || (n = this.length),
          t >= e.length && (t = e.length),
          t || (t = 0),
          n > 0 && n < r && (n = r),
          n === r || 0 === e.length || 0 === this.length)
        )
          return 0;
        if (t < 0) throw RangeError('targetStart out of bounds');
        if (r < 0 || r >= this.length) throw RangeError('sourceStart out of bounds');
        if (n < 0) throw RangeError('sourceEnd out of bounds');
        (n > this.length && (n = this.length), e.length - t < n - r && (n = e.length - t + r));
        var i,
          o = n - r;
        if (this === e && r < t && t < n) for (i = o - 1; i >= 0; --i) e[i + t] = this[i + r];
        else if (o < 1e3 || !u.TYPED_ARRAY_SUPPORT) for (i = 0; i < o; ++i) e[i + t] = this[i + r];
        else Uint8Array.prototype.set.call(e, this.subarray(r, r + o), t);
        return o;
      }),
      (u.prototype.fill = function (e, t, r, n) {
        if ('string' == typeof e) {
          if (
            ('string' == typeof t
              ? ((n = t), (t = 0), (r = this.length))
              : 'string' == typeof r && ((n = r), (r = this.length)),
            1 === e.length)
          ) {
            var i,
              o = e.charCodeAt(0);
            o < 256 && (e = o);
          }
          if (void 0 !== n && 'string' != typeof n) throw TypeError('encoding must be a string');
          if ('string' == typeof n && !u.isEncoding(n)) throw TypeError('Unknown encoding: ' + n);
        } else 'number' == typeof e && (e &= 255);
        if (t < 0 || this.length < t || this.length < r) throw RangeError('Out of range index');
        if (r <= t) return this;
        if (
          ((t >>>= 0),
          (r = void 0 === r ? this.length : r >>> 0),
          e || (e = 0),
          'number' == typeof e)
        )
          for (i = t; i < r; ++i) this[i] = e;
        else {
          var s = u.isBuffer(e) ? e : I(new u(e, n).toString()),
            a = s.length;
          for (i = 0; i < r - t; ++i) this[i + t] = s[i % a];
        }
        return this;
      }));
    var x = /[^+\/0-9A-Za-z-_]/g;
    function I(e, t) {
      t = t || 1 / 0;
      for (var r, n = e.length, i = null, o = [], s = 0; s < n; ++s) {
        if ((r = e.charCodeAt(s)) > 55295 && r < 57344) {
          if (!i) {
            if (r > 56319 || s + 1 === n) {
              (t -= 3) > -1 && o.push(239, 191, 189);
              continue;
            }
            i = r;
            continue;
          }
          if (r < 56320) {
            ((t -= 3) > -1 && o.push(239, 191, 189), (i = r));
            continue;
          }
          r = (((i - 55296) << 10) | (r - 56320)) + 65536;
        } else i && (t -= 3) > -1 && o.push(239, 191, 189);
        if (((i = null), r < 128)) {
          if ((t -= 1) < 0) break;
          o.push(r);
        } else if (r < 2048) {
          if ((t -= 2) < 0) break;
          o.push((r >> 6) | 192, (63 & r) | 128);
        } else if (r < 65536) {
          if ((t -= 3) < 0) break;
          o.push((r >> 12) | 224, ((r >> 6) & 63) | 128, (63 & r) | 128);
        } else if (r < 1114112) {
          if ((t -= 4) < 0) break;
          o.push((r >> 18) | 240, ((r >> 12) & 63) | 128, ((r >> 6) & 63) | 128, (63 & r) | 128);
        } else throw Error('Invalid code point');
      }
      return o;
    }
    function D(e) {
      for (var t = [], r = 0; r < e.length; ++r) t.push(255 & e.charCodeAt(r));
      return t;
    }
    function _(e) {
      return n.toByteArray(
        (function (e) {
          var t;
          if (
            (e = ((t = e).trim ? t.trim() : t.replace(/^\s+|\s+$/g, '')).replace(x, '')).length < 2
          )
            return '';
          for (; e.length % 4 != 0; ) e += '=';
          return e;
        })(e)
      );
    }
    function R(e, t, r, n) {
      for (var i = 0; i < n && !(i + r >= t.length) && !(i >= e.length); ++i) t[i + r] = e[i];
      return i;
    }
  },
  38902,
  (e) => {
    'use strict';
    var t = function (e, r) {
      return (t =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (e, t) {
            e.__proto__ = t;
          }) ||
        function (e, t) {
          for (var r in t) t.hasOwnProperty(r) && (e[r] = t[r]);
        })(e, r);
    };
    function r(e, r) {
      function n() {
        this.constructor = e;
      }
      (t(e, r),
        (e.prototype = null === r ? Object.create(r) : ((n.prototype = r.prototype), new n())));
    }
    var n = function () {
      return (n =
        Object.assign ||
        function (e) {
          for (var t, r = 1, n = arguments.length; r < n; r++)
            for (var i in (t = arguments[r]))
              Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
          return e;
        }).apply(this, arguments);
    };
    function i(e, t) {
      var r = {};
      for (var n in e)
        Object.prototype.hasOwnProperty.call(e, n) && 0 > t.indexOf(n) && (r[n] = e[n]);
      if (null != e && 'function' == typeof Object.getOwnPropertySymbols)
        for (var i = 0, n = Object.getOwnPropertySymbols(e); i < n.length; i++)
          0 > t.indexOf(n[i]) &&
            Object.prototype.propertyIsEnumerable.call(e, n[i]) &&
            (r[n[i]] = e[n[i]]);
      return r;
    }
    function o(e, t, r, n) {
      var i,
        o = arguments.length,
        s = o < 3 ? t : null === n ? (n = Object.getOwnPropertyDescriptor(t, r)) : n;
      if ('object' == typeof Reflect && 'function' == typeof Reflect.decorate)
        s = Reflect.decorate(e, t, r, n);
      else
        for (var a = e.length - 1; a >= 0; a--)
          (i = e[a]) && (s = (o < 3 ? i(s) : o > 3 ? i(t, r, s) : i(t, r)) || s);
      return (o > 3 && s && Object.defineProperty(t, r, s), s);
    }
    function s(e, t) {
      return function (r, n) {
        t(r, n, e);
      };
    }
    function a(e, t) {
      if ('object' == typeof Reflect && 'function' == typeof Reflect.metadata)
        return Reflect.metadata(e, t);
    }
    function u(e, t, r, n) {
      return new (r || (r = Promise))(function (i, o) {
        function s(e) {
          try {
            u(n.next(e));
          } catch (e) {
            o(e);
          }
        }
        function a(e) {
          try {
            u(n.throw(e));
          } catch (e) {
            o(e);
          }
        }
        function u(e) {
          var t;
          e.done
            ? i(e.value)
            : ((t = e.value) instanceof r
                ? t
                : new r(function (e) {
                    e(t);
                  })
              ).then(s, a);
        }
        u((n = n.apply(e, t || [])).next());
      });
    }
    function f(e, t) {
      var r,
        n,
        i,
        o,
        s = {
          label: 0,
          sent: function () {
            if (1 & i[0]) throw i[1];
            return i[1];
          },
          trys: [],
          ops: [],
        };
      return (
        (o = { next: a(0), throw: a(1), return: a(2) }),
        'function' == typeof Symbol &&
          (o[Symbol.iterator] = function () {
            return this;
          }),
        o
      );
      function a(o) {
        return function (a) {
          var u = [o, a];
          if (r) throw TypeError('Generator is already executing.');
          for (; s; )
            try {
              if (
                ((r = 1),
                n &&
                  (i =
                    2 & u[0]
                      ? n.return
                      : u[0]
                        ? n.throw || ((i = n.return) && i.call(n), 0)
                        : n.next) &&
                  !(i = i.call(n, u[1])).done)
              )
                return i;
              switch (((n = 0), i && (u = [2 & u[0], i.value]), u[0])) {
                case 0:
                case 1:
                  i = u;
                  break;
                case 4:
                  return (s.label++, { value: u[1], done: !1 });
                case 5:
                  (s.label++, (n = u[1]), (u = [0]));
                  continue;
                case 7:
                  ((u = s.ops.pop()), s.trys.pop());
                  continue;
                default:
                  if (
                    !(i = (i = s.trys).length > 0 && i[i.length - 1]) &&
                    (6 === u[0] || 2 === u[0])
                  ) {
                    s = 0;
                    continue;
                  }
                  if (3 === u[0] && (!i || (u[1] > i[0] && u[1] < i[3]))) {
                    s.label = u[1];
                    break;
                  }
                  if (6 === u[0] && s.label < i[1]) {
                    ((s.label = i[1]), (i = u));
                    break;
                  }
                  if (i && s.label < i[2]) {
                    ((s.label = i[2]), s.ops.push(u));
                    break;
                  }
                  (i[2] && s.ops.pop(), s.trys.pop());
                  continue;
              }
              u = t.call(e, s);
            } catch (e) {
              ((u = [6, e]), (n = 0));
            } finally {
              r = i = 0;
            }
          if (5 & u[0]) throw u[1];
          return { value: u[0] ? u[1] : void 0, done: !0 };
        };
      }
    }
    function h(e, t, r, n) {
      (void 0 === n && (n = r), (e[n] = t[r]));
    }
    function c(e, t) {
      for (var r in e) 'default' === r || t.hasOwnProperty(r) || (t[r] = e[r]);
    }
    function l(e) {
      var t = 'function' == typeof Symbol && Symbol.iterator,
        r = t && e[t],
        n = 0;
      if (r) return r.call(e);
      if (e && 'number' == typeof e.length)
        return {
          next: function () {
            return (e && n >= e.length && (e = void 0), { value: e && e[n++], done: !e });
          },
        };
      throw TypeError(t ? 'Object is not iterable.' : 'Symbol.iterator is not defined.');
    }
    function d(e, t) {
      var r = 'function' == typeof Symbol && e[Symbol.iterator];
      if (!r) return e;
      var n,
        i,
        o = r.call(e),
        s = [];
      try {
        for (; (void 0 === t || t-- > 0) && !(n = o.next()).done; ) s.push(n.value);
      } catch (e) {
        i = { error: e };
      } finally {
        try {
          n && !n.done && (r = o.return) && r.call(o);
        } finally {
          if (i) throw i.error;
        }
      }
      return s;
    }
    function p() {
      for (var e = [], t = 0; t < arguments.length; t++) e = e.concat(d(arguments[t]));
      return e;
    }
    function g() {
      for (var e = 0, t = 0, r = arguments.length; t < r; t++) e += arguments[t].length;
      for (var n = Array(e), i = 0, t = 0; t < r; t++)
        for (var o = arguments[t], s = 0, a = o.length; s < a; s++, i++) n[i] = o[s];
      return n;
    }
    function y(e) {
      return this instanceof y ? ((this.v = e), this) : new y(e);
    }
    function m(e, t, r) {
      if (!Symbol.asyncIterator) throw TypeError('Symbol.asyncIterator is not defined.');
      var n,
        i = r.apply(e, t || []),
        o = [];
      return (
        (n = {}),
        s('next'),
        s('throw'),
        s('return'),
        (n[Symbol.asyncIterator] = function () {
          return this;
        }),
        n
      );
      function s(e) {
        i[e] &&
          (n[e] = function (t) {
            return new Promise(function (r, n) {
              o.push([e, t, r, n]) > 1 || a(e, t);
            });
          });
      }
      function a(e, t) {
        try {
          var r;
          (r = i[e](t)).value instanceof y ? Promise.resolve(r.value.v).then(u, f) : h(o[0][2], r);
        } catch (e) {
          h(o[0][3], e);
        }
      }
      function u(e) {
        a('next', e);
      }
      function f(e) {
        a('throw', e);
      }
      function h(e, t) {
        (e(t), o.shift(), o.length && a(o[0][0], o[0][1]));
      }
    }
    function v(e) {
      var t, r;
      return (
        (t = {}),
        n('next'),
        n('throw', function (e) {
          throw e;
        }),
        n('return'),
        (t[Symbol.iterator] = function () {
          return this;
        }),
        t
      );
      function n(n, i) {
        t[n] = e[n]
          ? function (t) {
              return (r = !r) ? { value: y(e[n](t)), done: 'return' === n } : i ? i(t) : t;
            }
          : i;
      }
    }
    function S(e) {
      if (!Symbol.asyncIterator) throw TypeError('Symbol.asyncIterator is not defined.');
      var t,
        r = e[Symbol.asyncIterator];
      return r
        ? r.call(e)
        : ((e = l(e)),
          (t = {}),
          n('next'),
          n('throw'),
          n('return'),
          (t[Symbol.asyncIterator] = function () {
            return this;
          }),
          t);
      function n(r) {
        t[r] =
          e[r] &&
          function (t) {
            return new Promise(function (n, i) {
              var o, s, a;
              ((o = n),
                (s = i),
                (a = (t = e[r](t)).done),
                Promise.resolve(t.value).then(function (e) {
                  o({ value: e, done: a });
                }, s));
            });
          };
      }
    }
    function w(e, t) {
      return (
        Object.defineProperty ? Object.defineProperty(e, 'raw', { value: t }) : (e.raw = t),
        e
      );
    }
    function b(e) {
      if (e && e.__esModule) return e;
      var t = {};
      if (null != e) for (var r in e) Object.hasOwnProperty.call(e, r) && (t[r] = e[r]);
      return ((t.default = e), t);
    }
    function A(e) {
      return e && e.__esModule ? e : { default: e };
    }
    function C(e, t) {
      if (!t.has(e)) throw TypeError('attempted to get private field on non-instance');
      return t.get(e);
    }
    function E(e, t, r) {
      if (!t.has(e)) throw TypeError('attempted to set private field on non-instance');
      return (t.set(e, r), r);
    }
    e.s([
      '__assign',
      () => n,
      '__asyncDelegator',
      () => v,
      '__asyncGenerator',
      () => m,
      '__asyncValues',
      () => S,
      '__await',
      () => y,
      '__awaiter',
      () => u,
      '__classPrivateFieldGet',
      () => C,
      '__classPrivateFieldSet',
      () => E,
      '__createBinding',
      () => h,
      '__decorate',
      () => o,
      '__exportStar',
      () => c,
      '__extends',
      () => r,
      '__generator',
      () => f,
      '__importDefault',
      () => A,
      '__importStar',
      () => b,
      '__makeTemplateObject',
      () => w,
      '__metadata',
      () => a,
      '__param',
      () => s,
      '__read',
      () => d,
      '__rest',
      () => i,
      '__spread',
      () => p,
      '__spreadArrays',
      () => g,
      '__values',
      () => l,
    ]);
  },
  62570,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      (r.MAX_HASHABLE_LENGTH = r.INIT = r.KEY = r.DIGEST_LENGTH = r.BLOCK_SIZE = void 0),
      (r.BLOCK_SIZE = 64),
      (r.DIGEST_LENGTH = 32),
      (r.KEY = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0xfc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x6ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
      ])),
      (r.INIT = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
      ]),
      (r.MAX_HASHABLE_LENGTH = 0x1fffffffffffff));
  },
  37601,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }), (r.RawSha256 = void 0));
    var n = e.r(62570);
    r.RawSha256 = (function () {
      function e() {
        ((this.state = Int32Array.from(n.INIT)),
          (this.temp = new Int32Array(64)),
          (this.buffer = new Uint8Array(64)),
          (this.bufferLength = 0),
          (this.bytesHashed = 0),
          (this.finished = !1));
      }
      return (
        (e.prototype.update = function (e) {
          if (this.finished) throw Error('Attempted to update an already finished hash.');
          var t = 0,
            r = e.byteLength;
          if (((this.bytesHashed += r), 8 * this.bytesHashed > n.MAX_HASHABLE_LENGTH))
            throw Error('Cannot hash more than 2^53 - 1 bits');
          for (; r > 0; )
            ((this.buffer[this.bufferLength++] = e[t++]),
              r--,
              this.bufferLength === n.BLOCK_SIZE && (this.hashBuffer(), (this.bufferLength = 0)));
        }),
        (e.prototype.digest = function () {
          if (!this.finished) {
            var e = 8 * this.bytesHashed,
              t = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength),
              r = this.bufferLength;
            if ((t.setUint8(this.bufferLength++, 128), r % n.BLOCK_SIZE >= n.BLOCK_SIZE - 8)) {
              for (var i = this.bufferLength; i < n.BLOCK_SIZE; i++) t.setUint8(i, 0);
              (this.hashBuffer(), (this.bufferLength = 0));
            }
            for (var i = this.bufferLength; i < n.BLOCK_SIZE - 8; i++) t.setUint8(i, 0);
            (t.setUint32(n.BLOCK_SIZE - 8, Math.floor(e / 0x100000000), !0),
              t.setUint32(n.BLOCK_SIZE - 4, e),
              this.hashBuffer(),
              (this.finished = !0));
          }
          for (var o = new Uint8Array(n.DIGEST_LENGTH), i = 0; i < 8; i++)
            ((o[4 * i] = (this.state[i] >>> 24) & 255),
              (o[4 * i + 1] = (this.state[i] >>> 16) & 255),
              (o[4 * i + 2] = (this.state[i] >>> 8) & 255),
              (o[4 * i + 3] = (this.state[i] >>> 0) & 255));
          return o;
        }),
        (e.prototype.hashBuffer = function () {
          for (
            var e = this.buffer,
              t = this.state,
              r = t[0],
              i = t[1],
              o = t[2],
              s = t[3],
              a = t[4],
              u = t[5],
              f = t[6],
              h = t[7],
              c = 0;
            c < n.BLOCK_SIZE;
            c++
          ) {
            if (c < 16)
              this.temp[c] =
                ((255 & e[4 * c]) << 24) |
                ((255 & e[4 * c + 1]) << 16) |
                ((255 & e[4 * c + 2]) << 8) |
                (255 & e[4 * c + 3]);
            else {
              var l = this.temp[c - 2],
                d = ((l >>> 17) | (l << 15)) ^ ((l >>> 19) | (l << 13)) ^ (l >>> 10),
                p =
                  (((l = this.temp[c - 15]) >>> 7) | (l << 25)) ^
                  ((l >>> 18) | (l << 14)) ^
                  (l >>> 3);
              this.temp[c] = ((d + this.temp[c - 7]) | 0) + ((p + this.temp[c - 16]) | 0);
            }
            var g =
                ((((((a >>> 6) | (a << 26)) ^ ((a >>> 11) | (a << 21)) ^ ((a >>> 25) | (a << 7))) +
                  ((a & u) ^ (~a & f))) |
                  0) +
                  ((h + ((n.KEY[c] + this.temp[c]) | 0)) | 0)) |
                0,
              y =
                ((((r >>> 2) | (r << 30)) ^ ((r >>> 13) | (r << 19)) ^ ((r >>> 22) | (r << 10))) +
                  ((r & i) ^ (r & o) ^ (i & o))) |
                0;
            ((h = f),
              (f = u),
              (u = a),
              (a = (s + g) | 0),
              (s = o),
              (o = i),
              (i = r),
              (r = (g + y) | 0));
          }
          ((t[0] += r),
            (t[1] += i),
            (t[2] += o),
            (t[3] += s),
            (t[4] += a),
            (t[5] += u),
            (t[6] += f),
            (t[7] += h));
        }),
        e
      );
    })();
  },
  67034,
  (e, t, r) => {
    var n = {
        675: function (e, t) {
          'use strict';
          ((t.byteLength = function (e) {
            var t = u(e),
              r = t[0],
              n = t[1];
            return ((r + n) * 3) / 4 - n;
          }),
            (t.toByteArray = function (e) {
              var t,
                r,
                o = u(e),
                s = o[0],
                a = o[1],
                f = new i(((s + a) * 3) / 4 - a),
                h = 0,
                c = a > 0 ? s - 4 : s;
              for (r = 0; r < c; r += 4)
                ((t =
                  (n[e.charCodeAt(r)] << 18) |
                  (n[e.charCodeAt(r + 1)] << 12) |
                  (n[e.charCodeAt(r + 2)] << 6) |
                  n[e.charCodeAt(r + 3)]),
                  (f[h++] = (t >> 16) & 255),
                  (f[h++] = (t >> 8) & 255),
                  (f[h++] = 255 & t));
              return (
                2 === a &&
                  ((t = (n[e.charCodeAt(r)] << 2) | (n[e.charCodeAt(r + 1)] >> 4)),
                  (f[h++] = 255 & t)),
                1 === a &&
                  ((t =
                    (n[e.charCodeAt(r)] << 10) |
                    (n[e.charCodeAt(r + 1)] << 4) |
                    (n[e.charCodeAt(r + 2)] >> 2)),
                  (f[h++] = (t >> 8) & 255),
                  (f[h++] = 255 & t)),
                f
              );
            }),
            (t.fromByteArray = function (e) {
              for (var t, n = e.length, i = n % 3, o = [], s = 0, a = n - i; s < a; s += 16383)
                o.push(
                  (function (e, t, n) {
                    for (var i, o = [], s = t; s < n; s += 3)
                      ((i =
                        ((e[s] << 16) & 0xff0000) + ((e[s + 1] << 8) & 65280) + (255 & e[s + 2])),
                        o.push(
                          r[(i >> 18) & 63] + r[(i >> 12) & 63] + r[(i >> 6) & 63] + r[63 & i]
                        ));
                    return o.join('');
                  })(e, s, s + 16383 > a ? a : s + 16383)
                );
              return (
                1 === i
                  ? o.push(r[(t = e[n - 1]) >> 2] + r[(t << 4) & 63] + '==')
                  : 2 === i &&
                    o.push(
                      r[(t = (e[n - 2] << 8) + e[n - 1]) >> 10] +
                        r[(t >> 4) & 63] +
                        r[(t << 2) & 63] +
                        '='
                    ),
                o.join('')
              );
            }));
          for (
            var r = [],
              n = [],
              i = 'undefined' != typeof Uint8Array ? Uint8Array : Array,
              o = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
              s = 0,
              a = o.length;
            s < a;
            ++s
          )
            ((r[s] = o[s]), (n[o.charCodeAt(s)] = s));
          function u(e) {
            var t = e.length;
            if (t % 4 > 0) throw Error('Invalid string. Length must be a multiple of 4');
            var r = e.indexOf('=');
            -1 === r && (r = t);
            var n = r === t ? 0 : 4 - (r % 4);
            return [r, n];
          }
          ((n[45] = 62), (n[95] = 63));
        },
        72: function (e, t, r) {
          'use strict';
          var n = r(675),
            i = r(783),
            o =
              'function' == typeof Symbol && 'function' == typeof Symbol.for
                ? Symbol.for('nodejs.util.inspect.custom')
                : null;
          function s(e) {
            if (e > 0x7fffffff)
              throw RangeError('The value "' + e + '" is invalid for option "size"');
            var t = new Uint8Array(e);
            return (Object.setPrototypeOf(t, a.prototype), t);
          }
          function a(e, t, r) {
            if ('number' == typeof e) {
              if ('string' == typeof t)
                throw TypeError(
                  'The "string" argument must be of type string. Received type number'
                );
              return h(e);
            }
            return u(e, t, r);
          }
          function u(e, t, r) {
            if ('string' == typeof e) {
              var n = e,
                i = t;
              if ((('string' != typeof i || '' === i) && (i = 'utf8'), !a.isEncoding(i)))
                throw TypeError('Unknown encoding: ' + i);
              var o = 0 | d(n, i),
                u = s(o),
                f = u.write(n, i);
              return (f !== o && (u = u.slice(0, f)), u);
            }
            if (ArrayBuffer.isView(e)) return c(e);
            if (null == e)
              throw TypeError(
                'The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ' +
                  typeof e
              );
            if (
              D(e, ArrayBuffer) ||
              (e && D(e.buffer, ArrayBuffer)) ||
              ('undefined' != typeof SharedArrayBuffer &&
                (D(e, SharedArrayBuffer) || (e && D(e.buffer, SharedArrayBuffer))))
            )
              return (function (e, t, r) {
                var n;
                if (t < 0 || e.byteLength < t)
                  throw RangeError('"offset" is outside of buffer bounds');
                if (e.byteLength < t + (r || 0))
                  throw RangeError('"length" is outside of buffer bounds');
                return (
                  Object.setPrototypeOf(
                    (n =
                      void 0 === t && void 0 === r
                        ? new Uint8Array(e)
                        : void 0 === r
                          ? new Uint8Array(e, t)
                          : new Uint8Array(e, t, r)),
                    a.prototype
                  ),
                  n
                );
              })(e, t, r);
            if ('number' == typeof e)
              throw TypeError(
                'The "value" argument must not be of type number. Received type number'
              );
            var h = e.valueOf && e.valueOf();
            if (null != h && h !== e) return a.from(h, t, r);
            var p = (function (e) {
              if (a.isBuffer(e)) {
                var t = 0 | l(e.length),
                  r = s(t);
                return (0 === r.length || e.copy(r, 0, 0, t), r);
              }
              return void 0 !== e.length
                ? 'number' != typeof e.length ||
                  (function (e) {
                    return e != e;
                  })(e.length)
                  ? s(0)
                  : c(e)
                : 'Buffer' === e.type && Array.isArray(e.data)
                  ? c(e.data)
                  : void 0;
            })(e);
            if (p) return p;
            if (
              'undefined' != typeof Symbol &&
              null != Symbol.toPrimitive &&
              'function' == typeof e[Symbol.toPrimitive]
            )
              return a.from(e[Symbol.toPrimitive]('string'), t, r);
            throw TypeError(
              'The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ' +
                typeof e
            );
          }
          function f(e) {
            if ('number' != typeof e) throw TypeError('"size" argument must be of type number');
            if (e < 0) throw RangeError('The value "' + e + '" is invalid for option "size"');
          }
          function h(e) {
            return (f(e), s(e < 0 ? 0 : 0 | l(e)));
          }
          function c(e) {
            for (var t = e.length < 0 ? 0 : 0 | l(e.length), r = s(t), n = 0; n < t; n += 1)
              r[n] = 255 & e[n];
            return r;
          }
          ((t.Buffer = a),
            (t.SlowBuffer = function (e) {
              return (+e != e && (e = 0), a.alloc(+e));
            }),
            (t.INSPECT_MAX_BYTES = 50),
            (t.kMaxLength = 0x7fffffff),
            (a.TYPED_ARRAY_SUPPORT = (function () {
              try {
                var e = new Uint8Array(1),
                  t = {
                    foo: function () {
                      return 42;
                    },
                  };
                return (
                  Object.setPrototypeOf(t, Uint8Array.prototype),
                  Object.setPrototypeOf(e, t),
                  42 === e.foo()
                );
              } catch (e) {
                return !1;
              }
            })()),
            a.TYPED_ARRAY_SUPPORT ||
              'undefined' == typeof console ||
              'function' != typeof console.error ||
              console.error(
                'This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
              ),
            Object.defineProperty(a.prototype, 'parent', {
              enumerable: !0,
              get: function () {
                if (a.isBuffer(this)) return this.buffer;
              },
            }),
            Object.defineProperty(a.prototype, 'offset', {
              enumerable: !0,
              get: function () {
                if (a.isBuffer(this)) return this.byteOffset;
              },
            }),
            (a.poolSize = 8192),
            (a.from = function (e, t, r) {
              return u(e, t, r);
            }),
            Object.setPrototypeOf(a.prototype, Uint8Array.prototype),
            Object.setPrototypeOf(a, Uint8Array),
            (a.alloc = function (e, t, r) {
              return (f(e), e <= 0)
                ? s(e)
                : void 0 !== t
                  ? 'string' == typeof r
                    ? s(e).fill(t, r)
                    : s(e).fill(t)
                  : s(e);
            }),
            (a.allocUnsafe = function (e) {
              return h(e);
            }),
            (a.allocUnsafeSlow = function (e) {
              return h(e);
            }));
          function l(e) {
            if (e >= 0x7fffffff)
              throw RangeError(
                'Attempt to allocate Buffer larger than maximum size: 0x7fffffff bytes'
              );
            return 0 | e;
          }
          function d(e, t) {
            if (a.isBuffer(e)) return e.length;
            if (ArrayBuffer.isView(e) || D(e, ArrayBuffer)) return e.byteLength;
            if ('string' != typeof e)
              throw TypeError(
                'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' +
                  typeof e
              );
            var r = e.length,
              n = arguments.length > 2 && !0 === arguments[2];
            if (!n && 0 === r) return 0;
            for (var i = !1; ; )
              switch (t) {
                case 'ascii':
                case 'latin1':
                case 'binary':
                  return r;
                case 'utf8':
                case 'utf-8':
                  return U(e).length;
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return 2 * r;
                case 'hex':
                  return r >>> 1;
                case 'base64':
                  return x(e).length;
                default:
                  if (i) return n ? -1 : U(e).length;
                  ((t = ('' + t).toLowerCase()), (i = !0));
              }
          }
          function p(e, t, r) {
            var i,
              o,
              s,
              a = !1;
            if (
              ((void 0 === t || t < 0) && (t = 0),
              t > this.length ||
                ((void 0 === r || r > this.length) && (r = this.length),
                r <= 0 || (r >>>= 0) <= (t >>>= 0)))
            )
              return '';
            for (e || (e = 'utf8'); ; )
              switch (e) {
                case 'hex':
                  return (function (e, t, r) {
                    var n = e.length;
                    ((!t || t < 0) && (t = 0), (!r || r < 0 || r > n) && (r = n));
                    for (var i = '', o = t; o < r; ++o) i += _[e[o]];
                    return i;
                  })(this, t, r);
                case 'utf8':
                case 'utf-8':
                  return v(this, t, r);
                case 'ascii':
                  return (function (e, t, r) {
                    var n = '';
                    r = Math.min(e.length, r);
                    for (var i = t; i < r; ++i) n += String.fromCharCode(127 & e[i]);
                    return n;
                  })(this, t, r);
                case 'latin1':
                case 'binary':
                  return (function (e, t, r) {
                    var n = '';
                    r = Math.min(e.length, r);
                    for (var i = t; i < r; ++i) n += String.fromCharCode(e[i]);
                    return n;
                  })(this, t, r);
                case 'base64':
                  return (
                    (i = this),
                    (o = t),
                    (s = r),
                    0 === o && s === i.length ? n.fromByteArray(i) : n.fromByteArray(i.slice(o, s))
                  );
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return (function (e, t, r) {
                    for (var n = e.slice(t, r), i = '', o = 0; o < n.length; o += 2)
                      i += String.fromCharCode(n[o] + 256 * n[o + 1]);
                    return i;
                  })(this, t, r);
                default:
                  if (a) throw TypeError('Unknown encoding: ' + e);
                  ((e = (e + '').toLowerCase()), (a = !0));
              }
          }
          function g(e, t, r) {
            var n = e[t];
            ((e[t] = e[r]), (e[r] = n));
          }
          function y(e, t, r, n, i) {
            var o;
            if (0 === e.length) return -1;
            if (
              ('string' == typeof r
                ? ((n = r), (r = 0))
                : r > 0x7fffffff
                  ? (r = 0x7fffffff)
                  : r < -0x80000000 && (r = -0x80000000),
              (o = r *= 1) != o && (r = i ? 0 : e.length - 1),
              r < 0 && (r = e.length + r),
              r >= e.length)
            )
              if (i) return -1;
              else r = e.length - 1;
            else if (r < 0)
              if (!i) return -1;
              else r = 0;
            if (('string' == typeof t && (t = a.from(t, n)), a.isBuffer(t)))
              return 0 === t.length ? -1 : m(e, t, r, n, i);
            if ('number' == typeof t) {
              if (((t &= 255), 'function' == typeof Uint8Array.prototype.indexOf))
                if (i) return Uint8Array.prototype.indexOf.call(e, t, r);
                else return Uint8Array.prototype.lastIndexOf.call(e, t, r);
              return m(e, [t], r, n, i);
            }
            throw TypeError('val must be string, number or Buffer');
          }
          function m(e, t, r, n, i) {
            var o,
              s = 1,
              a = e.length,
              u = t.length;
            if (
              void 0 !== n &&
              ('ucs2' === (n = String(n).toLowerCase()) ||
                'ucs-2' === n ||
                'utf16le' === n ||
                'utf-16le' === n)
            ) {
              if (e.length < 2 || t.length < 2) return -1;
              ((s = 2), (a /= 2), (u /= 2), (r /= 2));
            }
            function f(e, t) {
              return 1 === s ? e[t] : e.readUInt16BE(t * s);
            }
            if (i) {
              var h = -1;
              for (o = r; o < a; o++)
                if (f(e, o) === f(t, -1 === h ? 0 : o - h)) {
                  if ((-1 === h && (h = o), o - h + 1 === u)) return h * s;
                } else (-1 !== h && (o -= o - h), (h = -1));
            } else
              for (r + u > a && (r = a - u), o = r; o >= 0; o--) {
                for (var c = !0, l = 0; l < u; l++)
                  if (f(e, o + l) !== f(t, l)) {
                    c = !1;
                    break;
                  }
                if (c) return o;
              }
            return -1;
          }
          ((a.isBuffer = function (e) {
            return null != e && !0 === e._isBuffer && e !== a.prototype;
          }),
            (a.compare = function (e, t) {
              if (
                (D(e, Uint8Array) && (e = a.from(e, e.offset, e.byteLength)),
                D(t, Uint8Array) && (t = a.from(t, t.offset, t.byteLength)),
                !a.isBuffer(e) || !a.isBuffer(t))
              )
                throw TypeError(
                  'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
                );
              if (e === t) return 0;
              for (var r = e.length, n = t.length, i = 0, o = Math.min(r, n); i < o; ++i)
                if (e[i] !== t[i]) {
                  ((r = e[i]), (n = t[i]));
                  break;
                }
              return r < n ? -1 : +(n < r);
            }),
            (a.isEncoding = function (e) {
              switch (String(e).toLowerCase()) {
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
                  return !0;
                default:
                  return !1;
              }
            }),
            (a.concat = function (e, t) {
              if (!Array.isArray(e)) throw TypeError('"list" argument must be an Array of Buffers');
              if (0 === e.length) return a.alloc(0);
              if (void 0 === t) for (r = 0, t = 0; r < e.length; ++r) t += e[r].length;
              var r,
                n = a.allocUnsafe(t),
                i = 0;
              for (r = 0; r < e.length; ++r) {
                var o = e[r];
                if ((D(o, Uint8Array) && (o = a.from(o)), !a.isBuffer(o)))
                  throw TypeError('"list" argument must be an Array of Buffers');
                (o.copy(n, i), (i += o.length));
              }
              return n;
            }),
            (a.byteLength = d),
            (a.prototype._isBuffer = !0),
            (a.prototype.swap16 = function () {
              var e = this.length;
              if (e % 2 != 0) throw RangeError('Buffer size must be a multiple of 16-bits');
              for (var t = 0; t < e; t += 2) g(this, t, t + 1);
              return this;
            }),
            (a.prototype.swap32 = function () {
              var e = this.length;
              if (e % 4 != 0) throw RangeError('Buffer size must be a multiple of 32-bits');
              for (var t = 0; t < e; t += 4) (g(this, t, t + 3), g(this, t + 1, t + 2));
              return this;
            }),
            (a.prototype.swap64 = function () {
              var e = this.length;
              if (e % 8 != 0) throw RangeError('Buffer size must be a multiple of 64-bits');
              for (var t = 0; t < e; t += 8)
                (g(this, t, t + 7),
                  g(this, t + 1, t + 6),
                  g(this, t + 2, t + 5),
                  g(this, t + 3, t + 4));
              return this;
            }),
            (a.prototype.toString = function () {
              var e = this.length;
              return 0 === e
                ? ''
                : 0 == arguments.length
                  ? v(this, 0, e)
                  : p.apply(this, arguments);
            }),
            (a.prototype.toLocaleString = a.prototype.toString),
            (a.prototype.equals = function (e) {
              if (!a.isBuffer(e)) throw TypeError('Argument must be a Buffer');
              return this === e || 0 === a.compare(this, e);
            }),
            (a.prototype.inspect = function () {
              var e = '',
                r = t.INSPECT_MAX_BYTES;
              return (
                (e = this.toString('hex', 0, r)
                  .replace(/(.{2})/g, '$1 ')
                  .trim()),
                this.length > r && (e += ' ... '),
                '<Buffer ' + e + '>'
              );
            }),
            o && (a.prototype[o] = a.prototype.inspect),
            (a.prototype.compare = function (e, t, r, n, i) {
              if ((D(e, Uint8Array) && (e = a.from(e, e.offset, e.byteLength)), !a.isBuffer(e)))
                throw TypeError(
                  'The "target" argument must be one of type Buffer or Uint8Array. Received type ' +
                    typeof e
                );
              if (
                (void 0 === t && (t = 0),
                void 0 === r && (r = e ? e.length : 0),
                void 0 === n && (n = 0),
                void 0 === i && (i = this.length),
                t < 0 || r > e.length || n < 0 || i > this.length)
              )
                throw RangeError('out of range index');
              if (n >= i && t >= r) return 0;
              if (n >= i) return -1;
              if (t >= r) return 1;
              if (((t >>>= 0), (r >>>= 0), (n >>>= 0), (i >>>= 0), this === e)) return 0;
              for (
                var o = i - n,
                  s = r - t,
                  u = Math.min(o, s),
                  f = this.slice(n, i),
                  h = e.slice(t, r),
                  c = 0;
                c < u;
                ++c
              )
                if (f[c] !== h[c]) {
                  ((o = f[c]), (s = h[c]));
                  break;
                }
              return o < s ? -1 : +(s < o);
            }),
            (a.prototype.includes = function (e, t, r) {
              return -1 !== this.indexOf(e, t, r);
            }),
            (a.prototype.indexOf = function (e, t, r) {
              return y(this, e, t, r, !0);
            }),
            (a.prototype.lastIndexOf = function (e, t, r) {
              return y(this, e, t, r, !1);
            }));
          function v(e, t, r) {
            r = Math.min(e.length, r);
            for (var n = [], i = t; i < r; ) {
              var o,
                s,
                a,
                u,
                f = e[i],
                h = null,
                c = f > 239 ? 4 : f > 223 ? 3 : f > 191 ? 2 : 1;
              if (i + c <= r)
                switch (c) {
                  case 1:
                    f < 128 && (h = f);
                    break;
                  case 2:
                    (192 & (o = e[i + 1])) == 128 &&
                      (u = ((31 & f) << 6) | (63 & o)) > 127 &&
                      (h = u);
                    break;
                  case 3:
                    ((o = e[i + 1]),
                      (s = e[i + 2]),
                      (192 & o) == 128 &&
                        (192 & s) == 128 &&
                        (u = ((15 & f) << 12) | ((63 & o) << 6) | (63 & s)) > 2047 &&
                        (u < 55296 || u > 57343) &&
                        (h = u));
                    break;
                  case 4:
                    ((o = e[i + 1]),
                      (s = e[i + 2]),
                      (a = e[i + 3]),
                      (192 & o) == 128 &&
                        (192 & s) == 128 &&
                        (192 & a) == 128 &&
                        (u = ((15 & f) << 18) | ((63 & o) << 12) | ((63 & s) << 6) | (63 & a)) >
                          65535 &&
                        u < 1114112 &&
                        (h = u));
                }
              (null === h
                ? ((h = 65533), (c = 1))
                : h > 65535 &&
                  ((h -= 65536), n.push(((h >>> 10) & 1023) | 55296), (h = 56320 | (1023 & h))),
                n.push(h),
                (i += c));
            }
            var l = n,
              d = l.length;
            if (d <= 4096) return String.fromCharCode.apply(String, l);
            for (var p = '', g = 0; g < d; )
              p += String.fromCharCode.apply(String, l.slice(g, (g += 4096)));
            return p;
          }
          function S(e, t, r) {
            if (e % 1 != 0 || e < 0) throw RangeError('offset is not uint');
            if (e + t > r) throw RangeError('Trying to access beyond buffer length');
          }
          function w(e, t, r, n, i, o) {
            if (!a.isBuffer(e)) throw TypeError('"buffer" argument must be a Buffer instance');
            if (t > i || t < o) throw RangeError('"value" argument is out of bounds');
            if (r + n > e.length) throw RangeError('Index out of range');
          }
          function b(e, t, r, n, i, o) {
            if (r + n > e.length || r < 0) throw RangeError('Index out of range');
          }
          function A(e, t, r, n, o) {
            return (
              (t *= 1),
              (r >>>= 0),
              o || b(e, t, r, 4, 34028234663852886e22, -34028234663852886e22),
              i.write(e, t, r, n, 23, 4),
              r + 4
            );
          }
          function C(e, t, r, n, o) {
            return (
              (t *= 1),
              (r >>>= 0),
              o || b(e, t, r, 8, 17976931348623157e292, -17976931348623157e292),
              i.write(e, t, r, n, 52, 8),
              r + 8
            );
          }
          ((a.prototype.write = function (e, t, r, n) {
            if (void 0 === t) ((n = 'utf8'), (r = this.length), (t = 0));
            else if (void 0 === r && 'string' == typeof t) ((n = t), (r = this.length), (t = 0));
            else if (isFinite(t))
              ((t >>>= 0),
                isFinite(r) ? ((r >>>= 0), void 0 === n && (n = 'utf8')) : ((n = r), (r = void 0)));
            else
              throw Error(
                'Buffer.write(string, encoding, offset[, length]) is no longer supported'
              );
            var i,
              o,
              s,
              a,
              u,
              f,
              h,
              c,
              l = this.length - t;
            if (
              ((void 0 === r || r > l) && (r = l),
              (e.length > 0 && (r < 0 || t < 0)) || t > this.length)
            )
              throw RangeError('Attempt to write outside buffer bounds');
            n || (n = 'utf8');
            for (var d = !1; ; )
              switch (n) {
                case 'hex':
                  return (function (e, t, r, n) {
                    r = Number(r) || 0;
                    var i = e.length - r;
                    n ? (n = Number(n)) > i && (n = i) : (n = i);
                    var o = t.length;
                    n > o / 2 && (n = o / 2);
                    for (var s = 0; s < n; ++s) {
                      var a,
                        u = parseInt(t.substr(2 * s, 2), 16);
                      if ((a = u) != a) break;
                      e[r + s] = u;
                    }
                    return s;
                  })(this, e, t, r);
                case 'utf8':
                case 'utf-8':
                  return ((i = t), (o = r), I(U(e, this.length - i), this, i, o));
                case 'ascii':
                  return ((s = t), (a = r), I(T(e), this, s, a));
                case 'latin1':
                case 'binary':
                  return (function (e, t, r, n) {
                    return I(T(t), e, r, n);
                  })(this, e, t, r);
                case 'base64':
                  return ((u = t), (f = r), I(x(e), this, u, f));
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return (
                    (h = t),
                    (c = r),
                    I(
                      (function (e, t) {
                        for (var r, n, i = [], o = 0; o < e.length && !((t -= 2) < 0); ++o)
                          ((n = (r = e.charCodeAt(o)) >> 8), i.push(r % 256), i.push(n));
                        return i;
                      })(e, this.length - h),
                      this,
                      h,
                      c
                    )
                  );
                default:
                  if (d) throw TypeError('Unknown encoding: ' + n);
                  ((n = ('' + n).toLowerCase()), (d = !0));
              }
          }),
            (a.prototype.toJSON = function () {
              return { type: 'Buffer', data: Array.prototype.slice.call(this._arr || this, 0) };
            }),
            (a.prototype.slice = function (e, t) {
              var r = this.length;
              ((e = ~~e),
                (t = void 0 === t ? r : ~~t),
                e < 0 ? (e += r) < 0 && (e = 0) : e > r && (e = r),
                t < 0 ? (t += r) < 0 && (t = 0) : t > r && (t = r),
                t < e && (t = e));
              var n = this.subarray(e, t);
              return (Object.setPrototypeOf(n, a.prototype), n);
            }),
            (a.prototype.readUIntLE = function (e, t, r) {
              ((e >>>= 0), (t >>>= 0), r || S(e, t, this.length));
              for (var n = this[e], i = 1, o = 0; ++o < t && (i *= 256); ) n += this[e + o] * i;
              return n;
            }),
            (a.prototype.readUIntBE = function (e, t, r) {
              ((e >>>= 0), (t >>>= 0), r || S(e, t, this.length));
              for (var n = this[e + --t], i = 1; t > 0 && (i *= 256); ) n += this[e + --t] * i;
              return n;
            }),
            (a.prototype.readUInt8 = function (e, t) {
              return ((e >>>= 0), t || S(e, 1, this.length), this[e]);
            }),
            (a.prototype.readUInt16LE = function (e, t) {
              return ((e >>>= 0), t || S(e, 2, this.length), this[e] | (this[e + 1] << 8));
            }),
            (a.prototype.readUInt16BE = function (e, t) {
              return ((e >>>= 0), t || S(e, 2, this.length), (this[e] << 8) | this[e + 1]);
            }),
            (a.prototype.readUInt32LE = function (e, t) {
              return (
                (e >>>= 0),
                t || S(e, 4, this.length),
                (this[e] | (this[e + 1] << 8) | (this[e + 2] << 16)) + 0x1000000 * this[e + 3]
              );
            }),
            (a.prototype.readUInt32BE = function (e, t) {
              return (
                (e >>>= 0),
                t || S(e, 4, this.length),
                0x1000000 * this[e] + ((this[e + 1] << 16) | (this[e + 2] << 8) | this[e + 3])
              );
            }),
            (a.prototype.readIntLE = function (e, t, r) {
              ((e >>>= 0), (t >>>= 0), r || S(e, t, this.length));
              for (var n = this[e], i = 1, o = 0; ++o < t && (i *= 256); ) n += this[e + o] * i;
              return (n >= (i *= 128) && (n -= Math.pow(2, 8 * t)), n);
            }),
            (a.prototype.readIntBE = function (e, t, r) {
              ((e >>>= 0), (t >>>= 0), r || S(e, t, this.length));
              for (var n = t, i = 1, o = this[e + --n]; n > 0 && (i *= 256); )
                o += this[e + --n] * i;
              return (o >= (i *= 128) && (o -= Math.pow(2, 8 * t)), o);
            }),
            (a.prototype.readInt8 = function (e, t) {
              return ((e >>>= 0), t || S(e, 1, this.length), 128 & this[e])
                ? -((255 - this[e] + 1) * 1)
                : this[e];
            }),
            (a.prototype.readInt16LE = function (e, t) {
              ((e >>>= 0), t || S(e, 2, this.length));
              var r = this[e] | (this[e + 1] << 8);
              return 32768 & r ? 0xffff0000 | r : r;
            }),
            (a.prototype.readInt16BE = function (e, t) {
              ((e >>>= 0), t || S(e, 2, this.length));
              var r = this[e + 1] | (this[e] << 8);
              return 32768 & r ? 0xffff0000 | r : r;
            }),
            (a.prototype.readInt32LE = function (e, t) {
              return (
                (e >>>= 0),
                t || S(e, 4, this.length),
                this[e] | (this[e + 1] << 8) | (this[e + 2] << 16) | (this[e + 3] << 24)
              );
            }),
            (a.prototype.readInt32BE = function (e, t) {
              return (
                (e >>>= 0),
                t || S(e, 4, this.length),
                (this[e] << 24) | (this[e + 1] << 16) | (this[e + 2] << 8) | this[e + 3]
              );
            }),
            (a.prototype.readFloatLE = function (e, t) {
              return ((e >>>= 0), t || S(e, 4, this.length), i.read(this, e, !0, 23, 4));
            }),
            (a.prototype.readFloatBE = function (e, t) {
              return ((e >>>= 0), t || S(e, 4, this.length), i.read(this, e, !1, 23, 4));
            }),
            (a.prototype.readDoubleLE = function (e, t) {
              return ((e >>>= 0), t || S(e, 8, this.length), i.read(this, e, !0, 52, 8));
            }),
            (a.prototype.readDoubleBE = function (e, t) {
              return ((e >>>= 0), t || S(e, 8, this.length), i.read(this, e, !1, 52, 8));
            }),
            (a.prototype.writeUIntLE = function (e, t, r, n) {
              if (((e *= 1), (t >>>= 0), (r >>>= 0), !n)) {
                var i = Math.pow(2, 8 * r) - 1;
                w(this, e, t, r, i, 0);
              }
              var o = 1,
                s = 0;
              for (this[t] = 255 & e; ++s < r && (o *= 256); ) this[t + s] = (e / o) & 255;
              return t + r;
            }),
            (a.prototype.writeUIntBE = function (e, t, r, n) {
              if (((e *= 1), (t >>>= 0), (r >>>= 0), !n)) {
                var i = Math.pow(2, 8 * r) - 1;
                w(this, e, t, r, i, 0);
              }
              var o = r - 1,
                s = 1;
              for (this[t + o] = 255 & e; --o >= 0 && (s *= 256); ) this[t + o] = (e / s) & 255;
              return t + r;
            }),
            (a.prototype.writeUInt8 = function (e, t, r) {
              return (
                (e *= 1),
                (t >>>= 0),
                r || w(this, e, t, 1, 255, 0),
                (this[t] = 255 & e),
                t + 1
              );
            }),
            (a.prototype.writeUInt16LE = function (e, t, r) {
              return (
                (e *= 1),
                (t >>>= 0),
                r || w(this, e, t, 2, 65535, 0),
                (this[t] = 255 & e),
                (this[t + 1] = e >>> 8),
                t + 2
              );
            }),
            (a.prototype.writeUInt16BE = function (e, t, r) {
              return (
                (e *= 1),
                (t >>>= 0),
                r || w(this, e, t, 2, 65535, 0),
                (this[t] = e >>> 8),
                (this[t + 1] = 255 & e),
                t + 2
              );
            }),
            (a.prototype.writeUInt32LE = function (e, t, r) {
              return (
                (e *= 1),
                (t >>>= 0),
                r || w(this, e, t, 4, 0xffffffff, 0),
                (this[t + 3] = e >>> 24),
                (this[t + 2] = e >>> 16),
                (this[t + 1] = e >>> 8),
                (this[t] = 255 & e),
                t + 4
              );
            }),
            (a.prototype.writeUInt32BE = function (e, t, r) {
              return (
                (e *= 1),
                (t >>>= 0),
                r || w(this, e, t, 4, 0xffffffff, 0),
                (this[t] = e >>> 24),
                (this[t + 1] = e >>> 16),
                (this[t + 2] = e >>> 8),
                (this[t + 3] = 255 & e),
                t + 4
              );
            }),
            (a.prototype.writeIntLE = function (e, t, r, n) {
              if (((e *= 1), (t >>>= 0), !n)) {
                var i = Math.pow(2, 8 * r - 1);
                w(this, e, t, r, i - 1, -i);
              }
              var o = 0,
                s = 1,
                a = 0;
              for (this[t] = 255 & e; ++o < r && (s *= 256); )
                (e < 0 && 0 === a && 0 !== this[t + o - 1] && (a = 1),
                  (this[t + o] = (((e / s) | 0) - a) & 255));
              return t + r;
            }),
            (a.prototype.writeIntBE = function (e, t, r, n) {
              if (((e *= 1), (t >>>= 0), !n)) {
                var i = Math.pow(2, 8 * r - 1);
                w(this, e, t, r, i - 1, -i);
              }
              var o = r - 1,
                s = 1,
                a = 0;
              for (this[t + o] = 255 & e; --o >= 0 && (s *= 256); )
                (e < 0 && 0 === a && 0 !== this[t + o + 1] && (a = 1),
                  (this[t + o] = (((e / s) | 0) - a) & 255));
              return t + r;
            }),
            (a.prototype.writeInt8 = function (e, t, r) {
              return (
                (e *= 1),
                (t >>>= 0),
                r || w(this, e, t, 1, 127, -128),
                e < 0 && (e = 255 + e + 1),
                (this[t] = 255 & e),
                t + 1
              );
            }),
            (a.prototype.writeInt16LE = function (e, t, r) {
              return (
                (e *= 1),
                (t >>>= 0),
                r || w(this, e, t, 2, 32767, -32768),
                (this[t] = 255 & e),
                (this[t + 1] = e >>> 8),
                t + 2
              );
            }),
            (a.prototype.writeInt16BE = function (e, t, r) {
              return (
                (e *= 1),
                (t >>>= 0),
                r || w(this, e, t, 2, 32767, -32768),
                (this[t] = e >>> 8),
                (this[t + 1] = 255 & e),
                t + 2
              );
            }),
            (a.prototype.writeInt32LE = function (e, t, r) {
              return (
                (e *= 1),
                (t >>>= 0),
                r || w(this, e, t, 4, 0x7fffffff, -0x80000000),
                (this[t] = 255 & e),
                (this[t + 1] = e >>> 8),
                (this[t + 2] = e >>> 16),
                (this[t + 3] = e >>> 24),
                t + 4
              );
            }),
            (a.prototype.writeInt32BE = function (e, t, r) {
              return (
                (e *= 1),
                (t >>>= 0),
                r || w(this, e, t, 4, 0x7fffffff, -0x80000000),
                e < 0 && (e = 0xffffffff + e + 1),
                (this[t] = e >>> 24),
                (this[t + 1] = e >>> 16),
                (this[t + 2] = e >>> 8),
                (this[t + 3] = 255 & e),
                t + 4
              );
            }),
            (a.prototype.writeFloatLE = function (e, t, r) {
              return A(this, e, t, !0, r);
            }),
            (a.prototype.writeFloatBE = function (e, t, r) {
              return A(this, e, t, !1, r);
            }),
            (a.prototype.writeDoubleLE = function (e, t, r) {
              return C(this, e, t, !0, r);
            }),
            (a.prototype.writeDoubleBE = function (e, t, r) {
              return C(this, e, t, !1, r);
            }),
            (a.prototype.copy = function (e, t, r, n) {
              if (!a.isBuffer(e)) throw TypeError('argument should be a Buffer');
              if (
                (r || (r = 0),
                n || 0 === n || (n = this.length),
                t >= e.length && (t = e.length),
                t || (t = 0),
                n > 0 && n < r && (n = r),
                n === r || 0 === e.length || 0 === this.length)
              )
                return 0;
              if (t < 0) throw RangeError('targetStart out of bounds');
              if (r < 0 || r >= this.length) throw RangeError('Index out of range');
              if (n < 0) throw RangeError('sourceEnd out of bounds');
              (n > this.length && (n = this.length),
                e.length - t < n - r && (n = e.length - t + r));
              var i = n - r;
              if (this === e && 'function' == typeof Uint8Array.prototype.copyWithin)
                this.copyWithin(t, r, n);
              else if (this === e && r < t && t < n)
                for (var o = i - 1; o >= 0; --o) e[o + t] = this[o + r];
              else Uint8Array.prototype.set.call(e, this.subarray(r, n), t);
              return i;
            }),
            (a.prototype.fill = function (e, t, r, n) {
              if ('string' == typeof e) {
                if (
                  ('string' == typeof t
                    ? ((n = t), (t = 0), (r = this.length))
                    : 'string' == typeof r && ((n = r), (r = this.length)),
                  void 0 !== n && 'string' != typeof n)
                )
                  throw TypeError('encoding must be a string');
                if ('string' == typeof n && !a.isEncoding(n))
                  throw TypeError('Unknown encoding: ' + n);
                if (1 === e.length) {
                  var i,
                    o = e.charCodeAt(0);
                  (('utf8' === n && o < 128) || 'latin1' === n) && (e = o);
                }
              } else 'number' == typeof e ? (e &= 255) : 'boolean' == typeof e && (e = Number(e));
              if (t < 0 || this.length < t || this.length < r)
                throw RangeError('Out of range index');
              if (r <= t) return this;
              if (
                ((t >>>= 0),
                (r = void 0 === r ? this.length : r >>> 0),
                e || (e = 0),
                'number' == typeof e)
              )
                for (i = t; i < r; ++i) this[i] = e;
              else {
                var s = a.isBuffer(e) ? e : a.from(e, n),
                  u = s.length;
                if (0 === u)
                  throw TypeError('The value "' + e + '" is invalid for argument "value"');
                for (i = 0; i < r - t; ++i) this[i + t] = s[i % u];
              }
              return this;
            }));
          var E = /[^+/0-9A-Za-z-_]/g;
          function U(e, t) {
            t = t || 1 / 0;
            for (var r, n = e.length, i = null, o = [], s = 0; s < n; ++s) {
              if ((r = e.charCodeAt(s)) > 55295 && r < 57344) {
                if (!i) {
                  if (r > 56319 || s + 1 === n) {
                    (t -= 3) > -1 && o.push(239, 191, 189);
                    continue;
                  }
                  i = r;
                  continue;
                }
                if (r < 56320) {
                  ((t -= 3) > -1 && o.push(239, 191, 189), (i = r));
                  continue;
                }
                r = (((i - 55296) << 10) | (r - 56320)) + 65536;
              } else i && (t -= 3) > -1 && o.push(239, 191, 189);
              if (((i = null), r < 128)) {
                if ((t -= 1) < 0) break;
                o.push(r);
              } else if (r < 2048) {
                if ((t -= 2) < 0) break;
                o.push((r >> 6) | 192, (63 & r) | 128);
              } else if (r < 65536) {
                if ((t -= 3) < 0) break;
                o.push((r >> 12) | 224, ((r >> 6) & 63) | 128, (63 & r) | 128);
              } else if (r < 1114112) {
                if ((t -= 4) < 0) break;
                o.push(
                  (r >> 18) | 240,
                  ((r >> 12) & 63) | 128,
                  ((r >> 6) & 63) | 128,
                  (63 & r) | 128
                );
              } else throw Error('Invalid code point');
            }
            return o;
          }
          function T(e) {
            for (var t = [], r = 0; r < e.length; ++r) t.push(255 & e.charCodeAt(r));
            return t;
          }
          function x(e) {
            return n.toByteArray(
              (function (e) {
                if ((e = (e = e.split('=')[0]).trim().replace(E, '')).length < 2) return '';
                for (; e.length % 4 != 0; ) e += '=';
                return e;
              })(e)
            );
          }
          function I(e, t, r, n) {
            for (var i = 0; i < n && !(i + r >= t.length) && !(i >= e.length); ++i) t[i + r] = e[i];
            return i;
          }
          function D(e, t) {
            return (
              e instanceof t ||
              (null != e &&
                null != e.constructor &&
                null != e.constructor.name &&
                e.constructor.name === t.name)
            );
          }
          var _ = (function () {
            for (var e = '0123456789abcdef', t = Array(256), r = 0; r < 16; ++r)
              for (var n = 16 * r, i = 0; i < 16; ++i) t[n + i] = e[r] + e[i];
            return t;
          })();
        },
        783: function (e, t) {
          ((t.read = function (e, t, r, n, i) {
            var o,
              s,
              a = 8 * i - n - 1,
              u = (1 << a) - 1,
              f = u >> 1,
              h = -7,
              c = r ? i - 1 : 0,
              l = r ? -1 : 1,
              d = e[t + c];
            for (
              c += l, o = d & ((1 << -h) - 1), d >>= -h, h += a;
              h > 0;
              o = 256 * o + e[t + c], c += l, h -= 8
            );
            for (
              s = o & ((1 << -h) - 1), o >>= -h, h += n;
              h > 0;
              s = 256 * s + e[t + c], c += l, h -= 8
            );
            if (0 === o) o = 1 - f;
            else {
              if (o === u) return s ? NaN : (1 / 0) * (d ? -1 : 1);
              ((s += Math.pow(2, n)), (o -= f));
            }
            return (d ? -1 : 1) * s * Math.pow(2, o - n);
          }),
            (t.write = function (e, t, r, n, i, o) {
              var s,
                a,
                u,
                f = 8 * o - i - 1,
                h = (1 << f) - 1,
                c = h >> 1,
                l = 5960464477539062e-23 * (23 === i),
                d = n ? 0 : o - 1,
                p = n ? 1 : -1,
                g = +(t < 0 || (0 === t && 1 / t < 0));
              for (
                isNaN((t = Math.abs(t))) || t === 1 / 0
                  ? ((a = +!!isNaN(t)), (s = h))
                  : ((s = Math.floor(Math.log(t) / Math.LN2)),
                    t * (u = Math.pow(2, -s)) < 1 && (s--, (u *= 2)),
                    s + c >= 1 ? (t += l / u) : (t += l * Math.pow(2, 1 - c)),
                    t * u >= 2 && (s++, (u /= 2)),
                    s + c >= h
                      ? ((a = 0), (s = h))
                      : s + c >= 1
                        ? ((a = (t * u - 1) * Math.pow(2, i)), (s += c))
                        : ((a = t * Math.pow(2, c - 1) * Math.pow(2, i)), (s = 0)));
                i >= 8;
                e[r + d] = 255 & a, d += p, a /= 256, i -= 8
              );
              for (s = (s << i) | a, f += i; f > 0; e[r + d] = 255 & s, d += p, s /= 256, f -= 8);
              e[r + d - p] |= 128 * g;
            }));
        },
      },
      i = {};
    function o(e) {
      var t = i[e];
      if (void 0 !== t) return t.exports;
      var r = (i[e] = { exports: {} }),
        s = !0;
      try {
        (n[e](r, r.exports, o), (s = !1));
      } finally {
        s && delete i[e];
      }
      return r.exports;
    }
    ((o.ab = '/ROOT/node_modules/next/dist/compiled/buffer/'), (t.exports = o(72)));
  },
  99585,
  (e) => {
    'use strict';
    e.s(
      [
        'fromUtf8',
        0,
        (e) =>
          'function' == typeof TextEncoder
            ? new TextEncoder().encode(e)
            : ((e) => {
                let t = [];
                for (let r = 0, n = e.length; r < n; r++) {
                  let n = e.charCodeAt(r);
                  if (n < 128) t.push(n);
                  else if (n < 2048) t.push((n >> 6) | 192, (63 & n) | 128);
                  else if (
                    r + 1 < e.length &&
                    (64512 & n) == 55296 &&
                    (64512 & e.charCodeAt(r + 1)) == 56320
                  ) {
                    let i = 65536 + ((1023 & n) << 10) + (1023 & e.charCodeAt(++r));
                    t.push(
                      (i >> 18) | 240,
                      ((i >> 12) & 63) | 128,
                      ((i >> 6) & 63) | 128,
                      (63 & i) | 128
                    );
                  } else t.push((n >> 12) | 224, ((n >> 6) & 63) | 128, (63 & n) | 128);
                }
                return Uint8Array.from(t);
              })(e),
        'toUtf8',
        0,
        (e) =>
          'function' == typeof TextDecoder
            ? new TextDecoder('utf-8').decode(e)
            : ((e) => {
                let t = '';
                for (let r = 0, n = e.length; r < n; r++) {
                  let n = e[r];
                  n < 128
                    ? (t += String.fromCharCode(n))
                    : 192 <= n && n < 224
                      ? (t += String.fromCharCode(((31 & n) << 6) | (63 & e[++r])))
                      : 240 <= n && n < 365
                        ? (t += decodeURIComponent(
                            '%' + [n, e[++r], e[++r], e[++r]].map((e) => e.toString(16)).join('%')
                          ))
                        : (t += String.fromCharCode(
                            ((15 & n) << 12) | ((63 & e[++r]) << 6) | (63 & e[++r])
                          ));
                }
                return t;
              })(e),
      ],
      99585
    );
  },
  9494,
  (e, t, r) => {
    'use strict';
    var n = e.i(67034);
    (Object.defineProperty(r, '__esModule', { value: !0 }), (r.convertToBuffer = void 0));
    var i = e.r(99585),
      o =
        void 0 !== n.Buffer && n.Buffer.from
          ? function (e) {
              return n.Buffer.from(e, 'utf8');
            }
          : i.fromUtf8;
    r.convertToBuffer = function (e) {
      return e instanceof Uint8Array
        ? e
        : 'string' == typeof e
          ? o(e)
          : ArrayBuffer.isView(e)
            ? new Uint8Array(e.buffer, e.byteOffset, e.byteLength / Uint8Array.BYTES_PER_ELEMENT)
            : new Uint8Array(e);
    };
  },
  1564,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      (r.isEmptyData = void 0),
      (r.isEmptyData = function (e) {
        return 'string' == typeof e ? 0 === e.length : 0 === e.byteLength;
      }));
  },
  70312,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      (r.numToUint8 = void 0),
      (r.numToUint8 = function (e) {
        return new Uint8Array([
          (0xff000000 & e) >> 24,
          (0xff0000 & e) >> 16,
          (65280 & e) >> 8,
          255 & e,
        ]);
      }));
  },
  81,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      (r.uint32ArrayFrom = void 0),
      (r.uint32ArrayFrom = function (e) {
        if (!Array.from) {
          for (var t = new Uint32Array(e.length); 0 < e.length; ) t[0] = e[0];
          return t;
        }
        return Uint32Array.from(e);
      }));
  },
  27201,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      (r.uint32ArrayFrom = r.numToUint8 = r.isEmptyData = r.convertToBuffer = void 0));
    var n = e.r(9494);
    Object.defineProperty(r, 'convertToBuffer', {
      enumerable: !0,
      get: function () {
        return n.convertToBuffer;
      },
    });
    var i = e.r(1564);
    Object.defineProperty(r, 'isEmptyData', {
      enumerable: !0,
      get: function () {
        return i.isEmptyData;
      },
    });
    var o = e.r(70312);
    Object.defineProperty(r, 'numToUint8', {
      enumerable: !0,
      get: function () {
        return o.numToUint8;
      },
    });
    var s = e.r(81);
    Object.defineProperty(r, 'uint32ArrayFrom', {
      enumerable: !0,
      get: function () {
        return s.uint32ArrayFrom;
      },
    });
  },
  22284,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }), (r.Sha256 = void 0));
    var n = e.r(38902),
      i = e.r(62570),
      o = e.r(37601),
      s = e.r(27201);
    r.Sha256 = (function () {
      function e(e) {
        if (((this.hash = new o.RawSha256()), e)) {
          this.outer = new o.RawSha256();
          var t = (function (e) {
              var t = (0, s.convertToBuffer)(e);
              if (t.byteLength > i.BLOCK_SIZE) {
                var r = new o.RawSha256();
                (r.update(t), (t = r.digest()));
              }
              var n = new Uint8Array(i.BLOCK_SIZE);
              return (n.set(t), n);
            })(e),
            r = new Uint8Array(i.BLOCK_SIZE);
          r.set(t);
          for (var n = 0; n < i.BLOCK_SIZE; n++) ((t[n] ^= 54), (r[n] ^= 92));
          (this.hash.update(t), this.outer.update(r));
          for (var n = 0; n < t.byteLength; n++) t[n] = 0;
        }
      }
      return (
        (e.prototype.update = function (e) {
          if (!(0, s.isEmptyData)(e) && !this.error)
            try {
              this.hash.update((0, s.convertToBuffer)(e));
            } catch (e) {
              this.error = e;
            }
        }),
        (e.prototype.digestSync = function () {
          if (this.error) throw this.error;
          return this.outer
            ? (this.outer.finished || this.outer.update(this.hash.digest()), this.outer.digest())
            : this.hash.digest();
        }),
        (e.prototype.digest = function () {
          return (0, n.__awaiter)(this, void 0, void 0, function () {
            return (0, n.__generator)(this, function (e) {
              return [2, this.digestSync()];
            });
          });
        }),
        e
      );
    })();
  },
  90528,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      (0, e.r(38902).__exportStar)(e.r(22284), r));
  },
  79600,
  (e, t, r) => {
    'use strict';
    ((t.exports = self.fetch.bind(self)), (t.exports.default = t.exports));
  },
  19447,
  (e, t, r) => {
    var n = function () {
      function e() {
        for (var e = 0, t = {}; e < arguments.length; e++) {
          var r = arguments[e];
          for (var n in r) t[n] = r[n];
        }
        return t;
      }
      function t(e) {
        return e.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
      }
      return (function r(n) {
        function i() {}
        function o(t, r, o) {
          if ('undefined' != typeof document) {
            ('number' == typeof (o = e({ path: '/' }, i.defaults, o)).expires &&
              (o.expires = new Date(new Date() * 1 + 864e5 * o.expires)),
              (o.expires = o.expires ? o.expires.toUTCString() : ''));
            try {
              var s = JSON.stringify(r);
              /^[\{\[]/.test(s) && (r = s);
            } catch (e) {}
            ((r = n.write
              ? n.write(r, t)
              : encodeURIComponent(String(r)).replace(
                  /%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,
                  decodeURIComponent
                )),
              (t = encodeURIComponent(String(t))
                .replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)
                .replace(/[\(\)]/g, escape)));
            var a = '';
            for (var u in o)
              o[u] && ((a += '; ' + u), !0 !== o[u] && (a += '=' + o[u].split(';')[0]));
            return (document.cookie = t + '=' + r + a);
          }
        }
        function s(e, r) {
          if ('undefined' != typeof document) {
            for (
              var i = {}, o = document.cookie ? document.cookie.split('; ') : [], s = 0;
              s < o.length;
              s++
            ) {
              var a = o[s].split('='),
                u = a.slice(1).join('=');
              r || '"' !== u.charAt(0) || (u = u.slice(1, -1));
              try {
                var f = t(a[0]);
                if (((u = (n.read || n)(u, f) || t(u)), r))
                  try {
                    u = JSON.parse(u);
                  } catch (e) {}
                if (((i[f] = u), e === f)) break;
              } catch (e) {}
            }
            return e ? i[e] : i;
          }
        }
        return (
          (i.set = o),
          (i.get = function (e) {
            return s(e, !1);
          }),
          (i.getJSON = function (e) {
            return s(e, !0);
          }),
          (i.remove = function (t, r) {
            o(t, '', e(r, { expires: -1 }));
          }),
          (i.defaults = {}),
          (i.withConverter = r),
          i
        );
      })(function () {});
    };
    if ('function' == typeof define && define.amd) {
      let i;
      void 0 !== (i = n(e.r, r, t)) && e.v(i);
    }
    t.exports = n();
  },
  53731,
  (e) => {
    'use strict';
    e.i(47167);
    var t,
      r,
      n,
      i,
      o = e.i(43476),
      s = e.i(71645),
      a = e.i(18566),
      u = (function () {
        function e(e) {
          var t = e || {},
            r = t.ValidationData,
            n = t.Username,
            i = t.Password,
            o = t.AuthParameters,
            s = t.ClientMetadata;
          ((this.validationData = r || {}),
            (this.authParameters = o || {}),
            (this.clientMetadata = s || {}),
            (this.username = n),
            (this.password = i));
        }
        var t = e.prototype;
        return (
          (t.getUsername = function () {
            return this.username;
          }),
          (t.getPassword = function () {
            return this.password;
          }),
          (t.getValidationData = function () {
            return this.validationData;
          }),
          (t.getAuthParameters = function () {
            return this.authParameters;
          }),
          (t.getClientMetadata = function () {
            return this.clientMetadata;
          }),
          e
        );
      })(),
      f = e.i(43943);
    if (
      ('undefined' != typeof window && window.crypto && (t = window.crypto),
      !t && 'undefined' != typeof window && window.msCrypto && (t = window.msCrypto),
      !t && e.g.crypto && (t = e.g.crypto),
      !t)
    )
      try {
        t = {};
      } catch (e) {}
    var h = (function () {
        function e(e, t) {
          ((e = this.words = e || []),
            void 0 != t ? (this.sigBytes = t) : (this.sigBytes = 4 * e.length));
        }
        var r = e.prototype;
        return (
          (r.random = function (r) {
            for (var n = [], i = 0; i < r; i += 4)
              n.push(
                (function () {
                  if (t) {
                    if ('function' == typeof t.getRandomValues)
                      try {
                        return t.getRandomValues(new Uint32Array(1))[0];
                      } catch (e) {}
                    if ('function' == typeof t.randomBytes)
                      try {
                        return t.randomBytes(4).readInt32LE();
                      } catch (e) {}
                  }
                  throw Error(
                    'Native crypto module could not be used to get secure random number.'
                  );
                })()
              );
            return new e(n, r);
          }),
          (r.toString = function () {
            return (function (e) {
              for (var t = e.words, r = e.sigBytes, n = [], i = 0; i < r; i++) {
                var o = (t[i >>> 2] >>> (24 - (i % 4) * 8)) & 255;
                (n.push((o >>> 4).toString(16)), n.push((15 & o).toString(16)));
              }
              return n.join('');
            })(this);
          }),
          e
        );
      })(),
      c = e.i(90528);
    function l(e, t) {
      null != e && this.fromString(e, t);
    }
    function d() {
      return new l(null);
    }
    var p = 'undefined' != typeof navigator;
    (p && 'Microsoft Internet Explorer' == navigator.appName
      ? ((l.prototype.am = function (e, t, r, n, i, o) {
          for (var s = 32767 & t, a = t >> 15; --o >= 0; ) {
            var u = 32767 & this[e],
              f = this[e++] >> 15,
              h = a * u + f * s;
            ((i =
              ((u = s * u + ((32767 & h) << 15) + r[n] + (0x3fffffff & i)) >>> 30) +
              (h >>> 15) +
              a * f +
              (i >>> 30)),
              (r[n++] = 0x3fffffff & u));
          }
          return i;
        }),
        (r = 30))
      : p && 'Netscape' != navigator.appName
        ? ((l.prototype.am = function (e, t, r, n, i, o) {
            for (; --o >= 0; ) {
              var s = t * this[e++] + r[n] + i;
              ((i = Math.floor(s / 0x4000000)), (r[n++] = 0x3ffffff & s));
            }
            return i;
          }),
          (r = 26))
        : ((l.prototype.am = function (e, t, r, n, i, o) {
            for (var s = 16383 & t, a = t >> 14; --o >= 0; ) {
              var u = 16383 & this[e],
                f = this[e++] >> 14,
                h = a * u + f * s;
              ((i = ((u = s * u + ((16383 & h) << 14) + r[n] + i) >> 28) + (h >> 14) + a * f),
                (r[n++] = 0xfffffff & u));
            }
            return i;
          }),
          (r = 28)),
      (l.prototype.DB = r),
      (l.prototype.DM = (1 << r) - 1),
      (l.prototype.DV = 1 << r),
      (l.prototype.FV = 0x10000000000000),
      (l.prototype.F1 = 52 - r),
      (l.prototype.F2 = 2 * r - 52));
    var g = [];
    for (i = 0, n = 48; i <= 9; ++i) g[n++] = i;
    for (i = 10, n = 97; i < 36; ++i) g[n++] = i;
    for (i = 10, n = 65; i < 36; ++i) g[n++] = i;
    function y(e) {
      return '0123456789abcdefghijklmnopqrstuvwxyz'.charAt(e);
    }
    function m(e) {
      var t = d();
      return (t.fromInt(e), t);
    }
    function v(e) {
      var t,
        r = 1;
      return (
        0 != (t = e >>> 16) && ((e = t), (r += 16)),
        0 != (t = e >> 8) && ((e = t), (r += 8)),
        0 != (t = e >> 4) && ((e = t), (r += 4)),
        0 != (t = e >> 2) && ((e = t), (r += 2)),
        0 != (t = e >> 1) && ((e = t), (r += 1)),
        r
      );
    }
    function S(e) {
      ((this.m = e),
        (this.mp = e.invDigit()),
        (this.mpl = 32767 & this.mp),
        (this.mph = this.mp >> 15),
        (this.um = (1 << (e.DB - 15)) - 1),
        (this.mt2 = 2 * e.t));
    }
    function w(e) {
      return f.Buffer.from(new h().random(e).toString(), 'hex');
    }
    ((S.prototype.convert = function (e) {
      var t = d();
      return (
        e.abs().dlShiftTo(this.m.t, t),
        t.divRemTo(this.m, null, t),
        e.s < 0 && t.compareTo(l.ZERO) > 0 && this.m.subTo(t, t),
        t
      );
    }),
      (S.prototype.revert = function (e) {
        var t = d();
        return (e.copyTo(t), this.reduce(t), t);
      }),
      (S.prototype.reduce = function (e) {
        for (; e.t <= this.mt2; ) e[e.t++] = 0;
        for (var t = 0; t < this.m.t; ++t) {
          var r = 32767 & e[t],
            n =
              (r * this.mpl + (((r * this.mph + (e[t] >> 15) * this.mpl) & this.um) << 15)) & e.DM;
          for (r = t + this.m.t, e[r] += this.m.am(0, n, e, t, 0, this.m.t); e[r] >= e.DV; )
            ((e[r] -= e.DV), e[++r]++);
        }
        (e.clamp(), e.drShiftTo(this.m.t, e), e.compareTo(this.m) >= 0 && e.subTo(this.m, e));
      }),
      (S.prototype.mulTo = function (e, t, r) {
        (e.multiplyTo(t, r), this.reduce(r));
      }),
      (S.prototype.sqrTo = function (e, t) {
        (e.squareTo(t), this.reduce(t));
      }),
      (l.prototype.copyTo = function (e) {
        for (var t = this.t - 1; t >= 0; --t) e[t] = this[t];
        ((e.t = this.t), (e.s = this.s));
      }),
      (l.prototype.fromInt = function (e) {
        ((this.t = 1),
          (this.s = e < 0 ? -1 : 0),
          e > 0 ? (this[0] = e) : e < -1 ? (this[0] = e + this.DV) : (this.t = 0));
      }),
      (l.prototype.fromString = function (e, t) {
        if (16 == t) r = 4;
        else if (8 == t) r = 3;
        else if (2 == t) r = 1;
        else if (32 == t) r = 5;
        else if (4 == t) r = 2;
        else throw Error('Only radix 2, 4, 8, 16, 32 are supported');
        ((this.t = 0), (this.s = 0));
        for (var r, n = e.length, i = !1, o = 0; --n >= 0; ) {
          var s = (function (e, t) {
            var r = g[e.charCodeAt(t)];
            return null == r ? -1 : r;
          })(e, n);
          if (s < 0) {
            '-' == e.charAt(n) && (i = !0);
            continue;
          }
          ((i = !1),
            0 == o
              ? (this[this.t++] = s)
              : o + r > this.DB
                ? ((this[this.t - 1] |= (s & ((1 << (this.DB - o)) - 1)) << o),
                  (this[this.t++] = s >> (this.DB - o)))
                : (this[this.t - 1] |= s << o),
            (o += r) >= this.DB && (o -= this.DB));
        }
        (this.clamp(), i && l.ZERO.subTo(this, this));
      }),
      (l.prototype.clamp = function () {
        for (var e = this.s & this.DM; this.t > 0 && this[this.t - 1] == e; ) --this.t;
      }),
      (l.prototype.dlShiftTo = function (e, t) {
        var r;
        for (r = this.t - 1; r >= 0; --r) t[r + e] = this[r];
        for (r = e - 1; r >= 0; --r) t[r] = 0;
        ((t.t = this.t + e), (t.s = this.s));
      }),
      (l.prototype.drShiftTo = function (e, t) {
        for (var r = e; r < this.t; ++r) t[r - e] = this[r];
        ((t.t = Math.max(this.t - e, 0)), (t.s = this.s));
      }),
      (l.prototype.lShiftTo = function (e, t) {
        var r,
          n = e % this.DB,
          i = this.DB - n,
          o = (1 << i) - 1,
          s = Math.floor(e / this.DB),
          a = (this.s << n) & this.DM;
        for (r = this.t - 1; r >= 0; --r)
          ((t[r + s + 1] = (this[r] >> i) | a), (a = (this[r] & o) << n));
        for (r = s - 1; r >= 0; --r) t[r] = 0;
        ((t[s] = a), (t.t = this.t + s + 1), (t.s = this.s), t.clamp());
      }),
      (l.prototype.rShiftTo = function (e, t) {
        t.s = this.s;
        var r = Math.floor(e / this.DB);
        if (r >= this.t) {
          t.t = 0;
          return;
        }
        var n = e % this.DB,
          i = this.DB - n,
          o = (1 << n) - 1;
        t[0] = this[r] >> n;
        for (var s = r + 1; s < this.t; ++s)
          ((t[s - r - 1] |= (this[s] & o) << i), (t[s - r] = this[s] >> n));
        (n > 0 && (t[this.t - r - 1] |= (this.s & o) << i), (t.t = this.t - r), t.clamp());
      }),
      (l.prototype.subTo = function (e, t) {
        for (var r = 0, n = 0, i = Math.min(e.t, this.t); r < i; )
          ((n += this[r] - e[r]), (t[r++] = n & this.DM), (n >>= this.DB));
        if (e.t < this.t) {
          for (n -= e.s; r < this.t; ) ((n += this[r]), (t[r++] = n & this.DM), (n >>= this.DB));
          n += this.s;
        } else {
          for (n += this.s; r < e.t; ) ((n -= e[r]), (t[r++] = n & this.DM), (n >>= this.DB));
          n -= e.s;
        }
        ((t.s = n < 0 ? -1 : 0),
          n < -1 ? (t[r++] = this.DV + n) : n > 0 && (t[r++] = n),
          (t.t = r),
          t.clamp());
      }),
      (l.prototype.multiplyTo = function (e, t) {
        var r = this.abs(),
          n = e.abs(),
          i = r.t;
        for (t.t = i + n.t; --i >= 0; ) t[i] = 0;
        for (i = 0; i < n.t; ++i) t[i + r.t] = r.am(0, n[i], t, i, 0, r.t);
        ((t.s = 0), t.clamp(), this.s != e.s && l.ZERO.subTo(t, t));
      }),
      (l.prototype.squareTo = function (e) {
        for (var t = this.abs(), r = (e.t = 2 * t.t); --r >= 0; ) e[r] = 0;
        for (r = 0; r < t.t - 1; ++r) {
          var n = t.am(r, t[r], e, 2 * r, 0, 1);
          (e[r + t.t] += t.am(r + 1, 2 * t[r], e, 2 * r + 1, n, t.t - r - 1)) >= t.DV &&
            ((e[r + t.t] -= t.DV), (e[r + t.t + 1] = 1));
        }
        (e.t > 0 && (e[e.t - 1] += t.am(r, t[r], e, 2 * r, 0, 1)), (e.s = 0), e.clamp());
      }),
      (l.prototype.divRemTo = function (e, t, r) {
        var n = e.abs();
        if (!(n.t <= 0)) {
          var i = this.abs();
          if (i.t < n.t) {
            (null != t && t.fromInt(0), null != r && this.copyTo(r));
            return;
          }
          null == r && (r = d());
          var o = d(),
            s = this.s,
            a = e.s,
            u = this.DB - v(n[n.t - 1]);
          u > 0 ? (n.lShiftTo(u, o), i.lShiftTo(u, r)) : (n.copyTo(o), i.copyTo(r));
          var f = o.t,
            h = o[f - 1];
          if (0 != h) {
            var c = h * (1 << this.F1) + (f > 1 ? o[f - 2] >> this.F2 : 0),
              p = this.FV / c,
              g = (1 << this.F1) / c,
              y = 1 << this.F2,
              m = r.t,
              S = m - f,
              w = null == t ? d() : t;
            for (
              o.dlShiftTo(S, w),
                r.compareTo(w) >= 0 && ((r[r.t++] = 1), r.subTo(w, r)),
                l.ONE.dlShiftTo(f, w),
                w.subTo(o, o);
              o.t < f;
            )
              o[o.t++] = 0;
            for (; --S >= 0; ) {
              var b = r[--m] == h ? this.DM : Math.floor(r[m] * p + (r[m - 1] + y) * g);
              if ((r[m] += o.am(0, b, r, S, 0, f)) < b)
                for (o.dlShiftTo(S, w), r.subTo(w, r); r[m] < --b; ) r.subTo(w, r);
            }
            (null != t && (r.drShiftTo(f, t), s != a && l.ZERO.subTo(t, t)),
              (r.t = f),
              r.clamp(),
              u > 0 && r.rShiftTo(u, r),
              s < 0 && l.ZERO.subTo(r, r));
          }
        }
      }),
      (l.prototype.invDigit = function () {
        if (this.t < 1) return 0;
        var e = this[0];
        if ((1 & e) == 0) return 0;
        var t = 3 & e;
        return (t =
          ((t =
            ((t = ((t = (t * (2 - (15 & e) * t)) & 15) * (2 - (255 & e) * t)) & 255) *
              (2 - (((65535 & e) * t) & 65535))) &
            65535) *
            (2 - ((e * t) % this.DV))) %
          this.DV) > 0
          ? this.DV - t
          : -t;
      }),
      (l.prototype.addTo = function (e, t) {
        for (var r = 0, n = 0, i = Math.min(e.t, this.t); r < i; )
          ((n += this[r] + e[r]), (t[r++] = n & this.DM), (n >>= this.DB));
        if (e.t < this.t) {
          for (n += e.s; r < this.t; ) ((n += this[r]), (t[r++] = n & this.DM), (n >>= this.DB));
          n += this.s;
        } else {
          for (n += this.s; r < e.t; ) ((n += e[r]), (t[r++] = n & this.DM), (n >>= this.DB));
          n += e.s;
        }
        ((t.s = n < 0 ? -1 : 0),
          n > 0 ? (t[r++] = n) : n < -1 && (t[r++] = this.DV + n),
          (t.t = r),
          t.clamp());
      }),
      (l.prototype.toString = function (e) {
        if (this.s < 0) return '-' + this.negate().toString(e);
        if (16 == e) t = 4;
        else if (8 == e) t = 3;
        else if (2 == e) t = 1;
        else if (32 == e) t = 5;
        else if (4 == e) t = 2;
        else throw Error('Only radix 2, 4, 8, 16, 32 are supported');
        var t,
          r,
          n = (1 << t) - 1,
          i = !1,
          o = '',
          s = this.t,
          a = this.DB - ((s * this.DB) % t);
        if (s-- > 0)
          for (a < this.DB && (r = this[s] >> a) > 0 && ((i = !0), (o = y(r))); s >= 0; )
            (a < t
              ? (r = ((this[s] & ((1 << a) - 1)) << (t - a)) | (this[--s] >> (a += this.DB - t)))
              : ((r = (this[s] >> (a -= t)) & n), a <= 0 && ((a += this.DB), --s)),
              r > 0 && (i = !0),
              i && (o += y(r)));
        return i ? o : '0';
      }),
      (l.prototype.negate = function () {
        var e = d();
        return (l.ZERO.subTo(this, e), e);
      }),
      (l.prototype.abs = function () {
        return this.s < 0 ? this.negate() : this;
      }),
      (l.prototype.compareTo = function (e) {
        var t = this.s - e.s;
        if (0 != t) return t;
        var r = this.t;
        if (0 != (t = r - e.t)) return this.s < 0 ? -t : t;
        for (; --r >= 0; ) if (0 != (t = this[r] - e[r])) return t;
        return 0;
      }),
      (l.prototype.bitLength = function () {
        return this.t <= 0 ? 0 : this.DB * (this.t - 1) + v(this[this.t - 1] ^ (this.s & this.DM));
      }),
      (l.prototype.mod = function (e) {
        var t = d();
        return (
          this.abs().divRemTo(e, null, t),
          this.s < 0 && t.compareTo(l.ZERO) > 0 && e.subTo(t, t),
          t
        );
      }),
      (l.prototype.equals = function (e) {
        return 0 == this.compareTo(e);
      }),
      (l.prototype.add = function (e) {
        var t = d();
        return (this.addTo(e, t), t);
      }),
      (l.prototype.subtract = function (e) {
        var t = d();
        return (this.subTo(e, t), t);
      }),
      (l.prototype.multiply = function (e) {
        var t = d();
        return (this.multiplyTo(e, t), t);
      }),
      (l.prototype.divide = function (e) {
        var t = d();
        return (this.divRemTo(e, t, null), t);
      }),
      (l.prototype.modPow = function (e, t, r) {
        var n,
          i = e.bitLength(),
          o = m(1),
          s = new S(t);
        if (i <= 0) return o;
        var a = [],
          u = 3,
          f = (n = i < 18 ? 1 : i < 48 ? 3 : i < 144 ? 4 : i < 768 ? 5 : 6) - 1,
          h = (1 << n) - 1;
        if (((a[1] = s.convert(this)), n > 1)) {
          var c = d();
          for (s.sqrTo(a[1], c); u <= h; ) ((a[u] = d()), s.mulTo(c, a[u - 2], a[u]), (u += 2));
        }
        var l,
          p,
          g = e.t - 1,
          y = !0,
          w = d();
        for (i = v(e[g]) - 1; g >= 0; ) {
          for (
            i >= f
              ? (l = (e[g] >> (i - f)) & h)
              : ((l = (e[g] & ((1 << (i + 1)) - 1)) << (f - i)),
                g > 0 && (l |= e[g - 1] >> (this.DB + i - f))),
              u = n;
            (1 & l) == 0;
          )
            ((l >>= 1), --u);
          if (((i -= u) < 0 && ((i += this.DB), --g), y)) (a[l].copyTo(o), (y = !1));
          else {
            for (; u > 1; ) (s.sqrTo(o, w), s.sqrTo(w, o), (u -= 2));
            (u > 0 ? s.sqrTo(o, w) : ((p = o), (o = w), (w = p)), s.mulTo(w, a[l], o));
          }
          for (; g >= 0 && (e[g] & (1 << i)) == 0; )
            (s.sqrTo(o, w), (p = o), (o = w), (w = p), --i < 0 && ((i = this.DB - 1), --g));
        }
        var b = s.revert(o);
        return (r(null, b), b);
      }),
      (l.ZERO = m(0)),
      (l.ONE = m(1)));
    var b = /^[89a-f]/i,
      A = (function () {
        function e(e) {
          ((this.N = new l(
            'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF',
            16
          )),
            (this.g = new l('2', 16)),
            (this.k = new l(this.hexHash('' + this.padHex(this.N) + this.padHex(this.g)), 16)),
            (this.smallAValue = this.generateRandomSmallA()),
            this.getLargeAValue(function () {}),
            (this.infoBits = f.Buffer.from('Caldera Derived Key', 'utf8')),
            (this.poolName = e));
        }
        var t = e.prototype;
        return (
          (t.getSmallAValue = function () {
            return this.smallAValue;
          }),
          (t.getLargeAValue = function (e) {
            var t = this;
            this.largeAValue
              ? e(null, this.largeAValue)
              : this.calculateA(this.smallAValue, function (r, n) {
                  (r && e(r, null), (t.largeAValue = n), e(null, t.largeAValue));
                });
          }),
          (t.generateRandomSmallA = function () {
            return new l(w(128).toString('hex'), 16);
          }),
          (t.generateRandomString = function () {
            return w(40).toString('base64');
          }),
          (t.getRandomPassword = function () {
            return this.randomPassword;
          }),
          (t.getSaltDevices = function () {
            return this.SaltToHashDevices;
          }),
          (t.getVerifierDevices = function () {
            return this.verifierDevices;
          }),
          (t.generateHashDevice = function (e, t, r) {
            var n = this;
            this.randomPassword = this.generateRandomString();
            var i = '' + e + t + ':' + this.randomPassword,
              o = this.hash(i),
              s = w(16).toString('hex');
            ((this.SaltToHashDevices = this.padHex(new l(s, 16))),
              this.g.modPow(
                new l(this.hexHash(this.SaltToHashDevices + o), 16),
                this.N,
                function (e, t) {
                  (e && r(e, null), (n.verifierDevices = n.padHex(t)), r(null, null));
                }
              ));
          }),
          (t.calculateA = function (e, t) {
            var r = this;
            this.g.modPow(e, this.N, function (e, n) {
              (e && t(e, null),
                n.mod(r.N).equals(l.ZERO) &&
                  t(Error('Illegal paramater. A mod N cannot be 0.'), null),
                t(null, n));
            });
          }),
          (t.calculateU = function (e, t) {
            return (
              (this.UHexHash = this.hexHash(this.padHex(e) + this.padHex(t))),
              new l(this.UHexHash, 16)
            );
          }),
          (t.hash = function (e) {
            var t = new c.Sha256();
            t.update(e);
            var r = t.digestSync(),
              n = f.Buffer.from(r).toString('hex');
            return Array(64 - n.length).join('0') + n;
          }),
          (t.hexHash = function (e) {
            return this.hash(f.Buffer.from(e, 'hex'));
          }),
          (t.computehkdf = function (e, t) {
            var r = f.Buffer.concat([this.infoBits, f.Buffer.from('\x01', 'utf8')]),
              n = new c.Sha256(t);
            n.update(e);
            var i = n.digestSync(),
              o = new c.Sha256(i);
            return (o.update(r), o.digestSync().slice(0, 16));
          }),
          (t.getPasswordAuthenticationKey = function (e, t, r, n, i) {
            var o = this;
            if (r.mod(this.N).equals(l.ZERO)) throw Error('B cannot be zero.');
            if (((this.UValue = this.calculateU(this.largeAValue, r)), this.UValue.equals(l.ZERO)))
              throw Error('U cannot be zero.');
            var s = '' + this.poolName + e + ':' + t,
              a = this.hash(s),
              u = new l(this.hexHash(this.padHex(n) + a), 16);
            this.calculateS(u, r, function (e, t) {
              (e && i(e, null),
                i(
                  null,
                  o.computehkdf(
                    f.Buffer.from(o.padHex(t), 'hex'),
                    f.Buffer.from(o.padHex(o.UValue), 'hex')
                  )
                ));
            });
          }),
          (t.calculateS = function (e, t, r) {
            var n = this;
            this.g.modPow(e, this.N, function (i, o) {
              (i && r(i, null),
                t
                  .subtract(n.k.multiply(o))
                  .modPow(n.smallAValue.add(n.UValue.multiply(e)), n.N, function (e, t) {
                    (e && r(e, null), r(null, t.mod(n.N)));
                  }));
            });
          }),
          (t.getNewPasswordRequiredChallengeUserAttributePrefix = function () {
            return 'userAttributes.';
          }),
          (t.padHex = function (e) {
            if (!(e instanceof l)) throw Error('Not a BigInteger');
            var t = 0 > e.compareTo(l.ZERO),
              r = e.abs().toString(16);
            return (
              (r = r.length % 2 != 0 ? '0' + r : r),
              (r = b.test(r) ? '00' + r : r),
              t &&
                (r = new l(
                  r
                    .split('')
                    .map(function (e) {
                      var t = 15 & ~parseInt(e, 16);
                      return '0123456789ABCDEF'.charAt(t);
                    })
                    .join(''),
                  16
                )
                  .add(l.ONE)
                  .toString(16))
                  .toUpperCase()
                  .startsWith('FF8') &&
                (r = r.substring(2)),
              r
            );
          }),
          e
        );
      })(),
      C = (function () {
        function e(e) {
          ((this.jwtToken = e || ''), (this.payload = this.decodePayload()));
        }
        var t = e.prototype;
        return (
          (t.getJwtToken = function () {
            return this.jwtToken;
          }),
          (t.getExpiration = function () {
            return this.payload.exp;
          }),
          (t.getIssuedAt = function () {
            return this.payload.iat;
          }),
          (t.decodePayload = function () {
            var e = this.jwtToken.split('.')[1];
            try {
              return JSON.parse(f.Buffer.from(e, 'base64').toString('utf8'));
            } catch (e) {
              return {};
            }
          }),
          e
        );
      })();
    function E(e, t) {
      return (E = Object.setPrototypeOf
        ? Object.setPrototypeOf.bind()
        : function (e, t) {
            return ((e.__proto__ = t), e);
          })(e, t);
    }
    var U = (function (e) {
      function t(t) {
        var r = (void 0 === t ? {} : t).AccessToken;
        return e.call(this, r || '') || this;
      }
      return (
        (t.prototype = Object.create(e.prototype)),
        (t.prototype.constructor = t),
        E(t, e),
        t
      );
    })(C);
    function T(e, t) {
      return (T = Object.setPrototypeOf
        ? Object.setPrototypeOf.bind()
        : function (e, t) {
            return ((e.__proto__ = t), e);
          })(e, t);
    }
    var x = (function (e) {
        function t(t) {
          var r = (void 0 === t ? {} : t).IdToken;
          return e.call(this, r || '') || this;
        }
        return (
          (t.prototype = Object.create(e.prototype)),
          (t.prototype.constructor = t),
          T(t, e),
          t
        );
      })(C),
      I = (function () {
        function e(e) {
          var t = (void 0 === e ? {} : e).RefreshToken;
          this.token = t || '';
        }
        return (
          (e.prototype.getToken = function () {
            return this.token;
          }),
          e
        );
      })(),
      D = {
        userAgent: 'aws-amplify/5.0.4',
        isReactNative: 'undefined' != typeof navigator && 'ReactNative' === navigator.product,
      },
      _ = (function () {
        function e(e) {
          var t = void 0 === e ? {} : e,
            r = t.IdToken,
            n = t.RefreshToken,
            i = t.AccessToken,
            o = t.ClockDrift;
          if (null == i || null == r) throw Error('Id token and Access Token must be present.');
          ((this.idToken = r),
            (this.refreshToken = n),
            (this.accessToken = i),
            (this.clockDrift = void 0 === o ? this.calculateClockDrift() : o));
        }
        var t = e.prototype;
        return (
          (t.getIdToken = function () {
            return this.idToken;
          }),
          (t.getRefreshToken = function () {
            return this.refreshToken;
          }),
          (t.getAccessToken = function () {
            return this.accessToken;
          }),
          (t.getClockDrift = function () {
            return this.clockDrift;
          }),
          (t.calculateClockDrift = function () {
            return (
              Math.floor(new Date() / 1e3) -
              Math.min(this.accessToken.getIssuedAt(), this.idToken.getIssuedAt())
            );
          }),
          (t.isValid = function () {
            var e = Math.floor(new Date() / 1e3) - this.clockDrift;
            return e < this.accessToken.getExpiration() && e < this.idToken.getExpiration();
          }),
          e
        );
      })(),
      R = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      P = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      B = (function () {
        function e() {}
        return (
          (e.prototype.getNowString = function () {
            var e = new Date(),
              t = P[e.getUTCDay()],
              r = R[e.getUTCMonth()],
              n = e.getUTCDate(),
              i = e.getUTCHours();
            i < 10 && (i = '0' + i);
            var o = e.getUTCMinutes();
            o < 10 && (o = '0' + o);
            var s = e.getUTCSeconds();
            return (
              s < 10 && (s = '0' + s),
              t + ' ' + r + ' ' + n + ' ' + i + ':' + o + ':' + s + ' UTC ' + e.getUTCFullYear()
            );
          }),
          e
        );
      })(),
      k = (function () {
        function e(e) {
          var t = void 0 === e ? {} : e,
            r = t.Name,
            n = t.Value;
          ((this.Name = r || ''), (this.Value = n || ''));
        }
        var t = e.prototype;
        return (
          (t.getValue = function () {
            return this.Value;
          }),
          (t.setValue = function (e) {
            return ((this.Value = e), this);
          }),
          (t.getName = function () {
            return this.Name;
          }),
          (t.setName = function (e) {
            return ((this.Name = e), this);
          }),
          (t.toString = function () {
            return JSON.stringify(this);
          }),
          (t.toJSON = function () {
            return { Name: this.Name, Value: this.Value };
          }),
          e
        );
      })(),
      O = {},
      N = (function () {
        function e() {}
        return (
          (e.setItem = function (e, t) {
            return ((O[e] = t), O[e]);
          }),
          (e.getItem = function (e) {
            return Object.prototype.hasOwnProperty.call(O, e) ? O[e] : void 0;
          }),
          (e.removeItem = function (e) {
            return delete O[e];
          }),
          (e.clear = function () {
            return (O = {});
          }),
          e
        );
      })(),
      F = (function () {
        function e() {
          try {
            ((this.storageWindow = window.localStorage),
              this.storageWindow.setItem('aws.cognito.test-ls', 1),
              this.storageWindow.removeItem('aws.cognito.test-ls'));
          } catch (e) {
            this.storageWindow = N;
          }
        }
        return (
          (e.prototype.getStorage = function () {
            return this.storageWindow;
          }),
          e
        );
      })(),
      M =
        'undefined' != typeof navigator
          ? D.isReactNative
            ? 'react-native'
            : navigator.userAgent
          : 'nodejs',
      L = (function () {
        function e(e) {
          if (null == e || null == e.Username || null == e.Pool)
            throw Error('Username and Pool information are required.');
          ((this.username = e.Username || ''),
            (this.pool = e.Pool),
            (this.Session = null),
            (this.client = e.Pool.client),
            (this.signInUserSession = null),
            (this.authenticationFlowType = 'USER_SRP_AUTH'),
            (this.storage = e.Storage || new F().getStorage()),
            (this.keyPrefix = 'CognitoIdentityServiceProvider.' + this.pool.getClientId()),
            (this.userDataKey = this.keyPrefix + '.' + this.username + '.userData'));
        }
        var t = e.prototype;
        return (
          (t.setSignInUserSession = function (e) {
            (this.clearCachedUserData(), (this.signInUserSession = e), this.cacheTokens());
          }),
          (t.getSignInUserSession = function () {
            return this.signInUserSession;
          }),
          (t.getUsername = function () {
            return this.username;
          }),
          (t.getAuthenticationFlowType = function () {
            return this.authenticationFlowType;
          }),
          (t.setAuthenticationFlowType = function (e) {
            this.authenticationFlowType = e;
          }),
          (t.initiateAuth = function (e, t) {
            var r = this,
              n = e.getAuthParameters();
            n.USERNAME = this.username;
            var i =
                0 !== Object.keys(e.getValidationData()).length
                  ? e.getValidationData()
                  : e.getClientMetadata(),
              o = {
                AuthFlow: 'CUSTOM_AUTH',
                ClientId: this.pool.getClientId(),
                AuthParameters: n,
                ClientMetadata: i,
              };
            (this.getUserContextData() && (o.UserContextData = this.getUserContextData()),
              this.client.request('InitiateAuth', o, function (e, n) {
                if (e) return t.onFailure(e);
                var i = n.ChallengeName,
                  o = n.ChallengeParameters;
                return 'CUSTOM_CHALLENGE' === i
                  ? ((r.Session = n.Session), t.customChallenge(o))
                  : ((r.signInUserSession = r.getCognitoUserSession(n.AuthenticationResult)),
                    r.cacheTokens(),
                    t.onSuccess(r.signInUserSession));
              }));
          }),
          (t.authenticateUser = function (e, t) {
            return 'USER_PASSWORD_AUTH' === this.authenticationFlowType
              ? this.authenticateUserPlainUsernamePassword(e, t)
              : 'USER_SRP_AUTH' === this.authenticationFlowType ||
                  'CUSTOM_AUTH' === this.authenticationFlowType
                ? this.authenticateUserDefaultAuth(e, t)
                : t.onFailure(Error('Authentication flow type is invalid.'));
          }),
          (t.authenticateUserDefaultAuth = function (e, t) {
            var r,
              n,
              i = this,
              o = new A(this.pool.getUserPoolName()),
              s = new B(),
              a = {};
            (null != this.deviceKey && (a.DEVICE_KEY = this.deviceKey),
              (a.USERNAME = this.username),
              o.getLargeAValue(function (u, h) {
                (u && t.onFailure(u),
                  (a.SRP_A = h.toString(16)),
                  'CUSTOM_AUTH' === i.authenticationFlowType && (a.CHALLENGE_NAME = 'SRP_A'));
                var d =
                    0 !== Object.keys(e.getValidationData()).length
                      ? e.getValidationData()
                      : e.getClientMetadata(),
                  p = {
                    AuthFlow: i.authenticationFlowType,
                    ClientId: i.pool.getClientId(),
                    AuthParameters: a,
                    ClientMetadata: d,
                  };
                (i.getUserContextData(i.username) &&
                  (p.UserContextData = i.getUserContextData(i.username)),
                  i.client.request('InitiateAuth', p, function (a, u) {
                    if (a) return t.onFailure(a);
                    var h = u.ChallengeParameters;
                    ((i.username = h.USER_ID_FOR_SRP),
                      (i.userDataKey = i.keyPrefix + '.' + i.username + '.userData'),
                      (r = new l(h.SRP_B, 16)),
                      (n = new l(h.SALT, 16)),
                      i.getCachedDeviceKeyAndPassword(),
                      o.getPasswordAuthenticationKey(
                        i.username,
                        e.getPassword(),
                        r,
                        n,
                        function (e, r) {
                          e && t.onFailure(e);
                          var n = s.getNowString(),
                            a = f.Buffer.concat([
                              f.Buffer.from(i.pool.getUserPoolName(), 'utf8'),
                              f.Buffer.from(i.username, 'utf8'),
                              f.Buffer.from(h.SECRET_BLOCK, 'base64'),
                              f.Buffer.from(n, 'utf8'),
                            ]),
                            l = new c.Sha256(r);
                          l.update(a);
                          var p = l.digestSync(),
                            g = f.Buffer.from(p).toString('base64'),
                            y = {};
                          ((y.USERNAME = i.username),
                            (y.PASSWORD_CLAIM_SECRET_BLOCK = h.SECRET_BLOCK),
                            (y.TIMESTAMP = n),
                            (y.PASSWORD_CLAIM_SIGNATURE = g),
                            null != i.deviceKey && (y.DEVICE_KEY = i.deviceKey));
                          var m = function (e, t) {
                              return i.client.request('RespondToAuthChallenge', e, function (r, n) {
                                return r &&
                                  'ResourceNotFoundException' === r.code &&
                                  -1 !== r.message.toLowerCase().indexOf('device')
                                  ? ((y.DEVICE_KEY = null),
                                    (i.deviceKey = null),
                                    (i.randomPassword = null),
                                    (i.deviceGroupKey = null),
                                    i.clearCachedDeviceKeyAndPassword(),
                                    m(e, t))
                                  : t(r, n);
                              });
                            },
                            v = {
                              ChallengeName: 'PASSWORD_VERIFIER',
                              ClientId: i.pool.getClientId(),
                              ChallengeResponses: y,
                              Session: u.Session,
                              ClientMetadata: d,
                            };
                          (i.getUserContextData() && (v.UserContextData = i.getUserContextData()),
                            m(v, function (e, r) {
                              return e ? t.onFailure(e) : i.authenticateUserInternal(r, o, t);
                            }));
                        }
                      ));
                  }));
              }));
          }),
          (t.authenticateUserPlainUsernamePassword = function (e, t) {
            var r = this,
              n = {};
            if (((n.USERNAME = this.username), (n.PASSWORD = e.getPassword()), !n.PASSWORD))
              return void t.onFailure(Error('PASSWORD parameter is required'));
            var i = new A(this.pool.getUserPoolName());
            (this.getCachedDeviceKeyAndPassword(),
              null != this.deviceKey && (n.DEVICE_KEY = this.deviceKey));
            var o =
                0 !== Object.keys(e.getValidationData()).length
                  ? e.getValidationData()
                  : e.getClientMetadata(),
              s = {
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: this.pool.getClientId(),
                AuthParameters: n,
                ClientMetadata: o,
              };
            (this.getUserContextData(this.username) &&
              (s.UserContextData = this.getUserContextData(this.username)),
              this.client.request('InitiateAuth', s, function (e, n) {
                return e ? t.onFailure(e) : r.authenticateUserInternal(n, i, t);
              }));
          }),
          (t.authenticateUserInternal = function (e, t, r) {
            var n = this,
              i = e.ChallengeName,
              o = e.ChallengeParameters;
            if ('SMS_MFA' === i) return ((this.Session = e.Session), r.mfaRequired(i, o));
            if ('SELECT_MFA_TYPE' === i) return ((this.Session = e.Session), r.selectMFAType(i, o));
            if ('MFA_SETUP' === i) return ((this.Session = e.Session), r.mfaSetup(i, o));
            if ('SOFTWARE_TOKEN_MFA' === i)
              return ((this.Session = e.Session), r.totpRequired(i, o));
            if ('CUSTOM_CHALLENGE' === i) return ((this.Session = e.Session), r.customChallenge(o));
            if ('NEW_PASSWORD_REQUIRED' === i) {
              this.Session = e.Session;
              var s = null,
                a = null,
                u = [],
                h = t.getNewPasswordRequiredChallengeUserAttributePrefix();
              if (
                (o &&
                  ((s = JSON.parse(e.ChallengeParameters.userAttributes)),
                  (a = JSON.parse(e.ChallengeParameters.requiredAttributes))),
                a)
              )
                for (var c = 0; c < a.length; c++) u[c] = a[c].substr(h.length);
              return r.newPasswordRequired(s, u);
            }
            if ('DEVICE_SRP_AUTH' === i) {
              ((this.Session = e.Session), this.getDeviceResponse(r));
              return;
            }
            ((this.signInUserSession = this.getCognitoUserSession(e.AuthenticationResult)),
              (this.challengeName = i),
              this.cacheTokens());
            var l = e.AuthenticationResult.NewDeviceMetadata;
            if (null == l) return r.onSuccess(this.signInUserSession);
            t.generateHashDevice(
              e.AuthenticationResult.NewDeviceMetadata.DeviceGroupKey,
              e.AuthenticationResult.NewDeviceMetadata.DeviceKey,
              function (i) {
                if (i) return r.onFailure(i);
                var o = {
                  Salt: f.Buffer.from(t.getSaltDevices(), 'hex').toString('base64'),
                  PasswordVerifier: f.Buffer.from(t.getVerifierDevices(), 'hex').toString('base64'),
                };
                ((n.verifierDevices = o.PasswordVerifier),
                  (n.deviceGroupKey = l.DeviceGroupKey),
                  (n.randomPassword = t.getRandomPassword()),
                  n.client.request(
                    'ConfirmDevice',
                    {
                      DeviceKey: l.DeviceKey,
                      AccessToken: n.signInUserSession.getAccessToken().getJwtToken(),
                      DeviceSecretVerifierConfig: o,
                      DeviceName: M,
                    },
                    function (t, i) {
                      return t
                        ? r.onFailure(t)
                        : ((n.deviceKey = e.AuthenticationResult.NewDeviceMetadata.DeviceKey),
                            n.cacheDeviceKeyAndPassword(),
                            !0 === i.UserConfirmationNecessary)
                          ? r.onSuccess(n.signInUserSession, i.UserConfirmationNecessary)
                          : r.onSuccess(n.signInUserSession);
                    }
                  ));
              }
            );
          }),
          (t.completeNewPasswordChallenge = function (e, t, r, n) {
            var i = this;
            if (!e) return r.onFailure(Error('New password is required.'));
            var o = new A(this.pool.getUserPoolName()),
              s = o.getNewPasswordRequiredChallengeUserAttributePrefix(),
              a = {};
            (t &&
              Object.keys(t).forEach(function (e) {
                a[s + e] = t[e];
              }),
              (a.NEW_PASSWORD = e),
              (a.USERNAME = this.username));
            var u = {
              ChallengeName: 'NEW_PASSWORD_REQUIRED',
              ClientId: this.pool.getClientId(),
              ChallengeResponses: a,
              Session: this.Session,
              ClientMetadata: n,
            };
            (this.getUserContextData() && (u.UserContextData = this.getUserContextData()),
              this.client.request('RespondToAuthChallenge', u, function (e, t) {
                return e ? r.onFailure(e) : i.authenticateUserInternal(t, o, r);
              }));
          }),
          (t.getDeviceResponse = function (e, t) {
            var r = this,
              n = new A(this.deviceGroupKey),
              i = new B(),
              o = {};
            ((o.USERNAME = this.username),
              (o.DEVICE_KEY = this.deviceKey),
              n.getLargeAValue(function (s, a) {
                (s && e.onFailure(s), (o.SRP_A = a.toString(16)));
                var u = {
                  ChallengeName: 'DEVICE_SRP_AUTH',
                  ClientId: r.pool.getClientId(),
                  ChallengeResponses: o,
                  ClientMetadata: t,
                  Session: r.Session,
                };
                (r.getUserContextData() && (u.UserContextData = r.getUserContextData()),
                  r.client.request('RespondToAuthChallenge', u, function (t, o) {
                    if (t) return e.onFailure(t);
                    var s = o.ChallengeParameters,
                      a = new l(s.SRP_B, 16),
                      u = new l(s.SALT, 16);
                    n.getPasswordAuthenticationKey(
                      r.deviceKey,
                      r.randomPassword,
                      a,
                      u,
                      function (t, n) {
                        if (t) return e.onFailure(t);
                        var a = i.getNowString(),
                          u = f.Buffer.concat([
                            f.Buffer.from(r.deviceGroupKey, 'utf8'),
                            f.Buffer.from(r.deviceKey, 'utf8'),
                            f.Buffer.from(s.SECRET_BLOCK, 'base64'),
                            f.Buffer.from(a, 'utf8'),
                          ]),
                          h = new c.Sha256(n);
                        h.update(u);
                        var l = h.digestSync(),
                          d = f.Buffer.from(l).toString('base64'),
                          p = {};
                        ((p.USERNAME = r.username),
                          (p.PASSWORD_CLAIM_SECRET_BLOCK = s.SECRET_BLOCK),
                          (p.TIMESTAMP = a),
                          (p.PASSWORD_CLAIM_SIGNATURE = d),
                          (p.DEVICE_KEY = r.deviceKey));
                        var g = {
                          ChallengeName: 'DEVICE_PASSWORD_VERIFIER',
                          ClientId: r.pool.getClientId(),
                          ChallengeResponses: p,
                          Session: o.Session,
                        };
                        (r.getUserContextData() && (g.UserContextData = r.getUserContextData()),
                          r.client.request('RespondToAuthChallenge', g, function (t, n) {
                            return t
                              ? e.onFailure(t)
                              : ((r.signInUserSession = r.getCognitoUserSession(
                                  n.AuthenticationResult
                                )),
                                r.cacheTokens(),
                                e.onSuccess(r.signInUserSession));
                          }));
                      }
                    );
                  }));
              }));
          }),
          (t.confirmRegistration = function (e, t, r, n) {
            var i = {
              ClientId: this.pool.getClientId(),
              ConfirmationCode: e,
              Username: this.username,
              ForceAliasCreation: t,
              ClientMetadata: n,
            };
            (this.getUserContextData() && (i.UserContextData = this.getUserContextData()),
              this.client.request('ConfirmSignUp', i, function (e) {
                return e ? r(e, null) : r(null, 'SUCCESS');
              }));
          }),
          (t.sendCustomChallengeAnswer = function (e, t, r) {
            var n = this,
              i = {};
            ((i.USERNAME = this.username), (i.ANSWER = e));
            var o = new A(this.pool.getUserPoolName());
            (this.getCachedDeviceKeyAndPassword(),
              null != this.deviceKey && (i.DEVICE_KEY = this.deviceKey));
            var s = {
              ChallengeName: 'CUSTOM_CHALLENGE',
              ChallengeResponses: i,
              ClientId: this.pool.getClientId(),
              Session: this.Session,
              ClientMetadata: r,
            };
            (this.getUserContextData() && (s.UserContextData = this.getUserContextData()),
              this.client.request('RespondToAuthChallenge', s, function (e, r) {
                return e ? t.onFailure(e) : n.authenticateUserInternal(r, o, t);
              }));
          }),
          (t.sendMFACode = function (e, t, r, n) {
            var i = this,
              o = {};
            ((o.USERNAME = this.username), (o.SMS_MFA_CODE = e));
            var s = r || 'SMS_MFA';
            ('SOFTWARE_TOKEN_MFA' === s && (o.SOFTWARE_TOKEN_MFA_CODE = e),
              null != this.deviceKey && (o.DEVICE_KEY = this.deviceKey));
            var a = {
              ChallengeName: s,
              ChallengeResponses: o,
              ClientId: this.pool.getClientId(),
              Session: this.Session,
              ClientMetadata: n,
            };
            (this.getUserContextData() && (a.UserContextData = this.getUserContextData()),
              this.client.request('RespondToAuthChallenge', a, function (e, r) {
                if (e) return t.onFailure(e);
                if ('DEVICE_SRP_AUTH' === r.ChallengeName) return void i.getDeviceResponse(t);
                if (
                  ((i.signInUserSession = i.getCognitoUserSession(r.AuthenticationResult)),
                  i.cacheTokens(),
                  null == r.AuthenticationResult.NewDeviceMetadata)
                )
                  return t.onSuccess(i.signInUserSession);
                var n = new A(i.pool.getUserPoolName());
                n.generateHashDevice(
                  r.AuthenticationResult.NewDeviceMetadata.DeviceGroupKey,
                  r.AuthenticationResult.NewDeviceMetadata.DeviceKey,
                  function (e) {
                    if (e) return t.onFailure(e);
                    var o = {
                      Salt: f.Buffer.from(n.getSaltDevices(), 'hex').toString('base64'),
                      PasswordVerifier: f.Buffer.from(n.getVerifierDevices(), 'hex').toString(
                        'base64'
                      ),
                    };
                    ((i.verifierDevices = o.PasswordVerifier),
                      (i.deviceGroupKey = r.AuthenticationResult.NewDeviceMetadata.DeviceGroupKey),
                      (i.randomPassword = n.getRandomPassword()),
                      i.client.request(
                        'ConfirmDevice',
                        {
                          DeviceKey: r.AuthenticationResult.NewDeviceMetadata.DeviceKey,
                          AccessToken: i.signInUserSession.getAccessToken().getJwtToken(),
                          DeviceSecretVerifierConfig: o,
                          DeviceName: M,
                        },
                        function (e, n) {
                          return e
                            ? t.onFailure(e)
                            : ((i.deviceKey = r.AuthenticationResult.NewDeviceMetadata.DeviceKey),
                                i.cacheDeviceKeyAndPassword(),
                                !0 === n.UserConfirmationNecessary)
                              ? t.onSuccess(i.signInUserSession, n.UserConfirmationNecessary)
                              : t.onSuccess(i.signInUserSession);
                        }
                      ));
                  }
                );
              }));
          }),
          (t.changePassword = function (e, t, r, n) {
            if (!(null != this.signInUserSession && this.signInUserSession.isValid()))
              return r(Error('User is not authenticated'), null);
            this.client.request(
              'ChangePassword',
              {
                PreviousPassword: e,
                ProposedPassword: t,
                AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
                ClientMetadata: n,
              },
              function (e) {
                return e ? r(e, null) : r(null, 'SUCCESS');
              }
            );
          }),
          (t.enableMFA = function (e) {
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return e(Error('User is not authenticated'), null);
            var t = [];
            (t.push({ DeliveryMedium: 'SMS', AttributeName: 'phone_number' }),
              this.client.request(
                'SetUserSettings',
                {
                  MFAOptions: t,
                  AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
                },
                function (t) {
                  return t ? e(t, null) : e(null, 'SUCCESS');
                }
              ));
          }),
          (t.setUserMfaPreference = function (e, t, r) {
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return r(Error('User is not authenticated'), null);
            this.client.request(
              'SetUserMFAPreference',
              {
                SMSMfaSettings: e,
                SoftwareTokenMfaSettings: t,
                AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
              },
              function (e) {
                return e ? r(e, null) : r(null, 'SUCCESS');
              }
            );
          }),
          (t.disableMFA = function (e) {
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return e(Error('User is not authenticated'), null);
            this.client.request(
              'SetUserSettings',
              {
                MFAOptions: [],
                AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
              },
              function (t) {
                return t ? e(t, null) : e(null, 'SUCCESS');
              }
            );
          }),
          (t.deleteUser = function (e, t) {
            var r = this;
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return e(Error('User is not authenticated'), null);
            this.client.request(
              'DeleteUser',
              {
                AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
                ClientMetadata: t,
              },
              function (t) {
                return t ? e(t, null) : (r.clearCachedUser(), e(null, 'SUCCESS'));
              }
            );
          }),
          (t.updateAttributes = function (e, t, r) {
            var n = this;
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return t(Error('User is not authenticated'), null);
            this.client.request(
              'UpdateUserAttributes',
              {
                AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
                UserAttributes: e,
                ClientMetadata: r,
              },
              function (e, r) {
                return e
                  ? t(e, null)
                  : n.getUserData(
                      function () {
                        return t(null, 'SUCCESS', r);
                      },
                      { bypassCache: !0 }
                    );
              }
            );
          }),
          (t.getUserAttributes = function (e) {
            if (!(null != this.signInUserSession && this.signInUserSession.isValid()))
              return e(Error('User is not authenticated'), null);
            this.client.request(
              'GetUser',
              { AccessToken: this.signInUserSession.getAccessToken().getJwtToken() },
              function (t, r) {
                if (t) return e(t, null);
                for (var n = [], i = 0; i < r.UserAttributes.length; i++) {
                  var o = new k({
                    Name: r.UserAttributes[i].Name,
                    Value: r.UserAttributes[i].Value,
                  });
                  n.push(o);
                }
                return e(null, n);
              }
            );
          }),
          (t.getMFAOptions = function (e) {
            if (!(null != this.signInUserSession && this.signInUserSession.isValid()))
              return e(Error('User is not authenticated'), null);
            this.client.request(
              'GetUser',
              { AccessToken: this.signInUserSession.getAccessToken().getJwtToken() },
              function (t, r) {
                return t ? e(t, null) : e(null, r.MFAOptions);
              }
            );
          }),
          (t.createGetUserRequest = function () {
            return this.client.promisifyRequest('GetUser', {
              AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
            });
          }),
          (t.refreshSessionIfPossible = function (e) {
            var t = this;
            return (
              void 0 === e && (e = {}),
              new Promise(function (r) {
                var n = t.signInUserSession.getRefreshToken();
                n && n.getToken() ? t.refreshSession(n, r, e.clientMetadata) : r();
              })
            );
          }),
          (t.getUserData = function (e, t) {
            var r = this;
            if (!(null != this.signInUserSession && this.signInUserSession.isValid()))
              return (this.clearCachedUserData(), e(Error('User is not authenticated'), null));
            var n = this.getUserDataFromCache();
            if (!n)
              return void this.fetchUserData()
                .then(function (t) {
                  e(null, t);
                })
                .catch(e);
            if (this.isFetchUserDataAndTokenRequired(t))
              return void this.fetchUserData()
                .then(function (e) {
                  return r.refreshSessionIfPossible(t).then(function () {
                    return e;
                  });
                })
                .then(function (t) {
                  return e(null, t);
                })
                .catch(e);
            try {
              e(null, JSON.parse(n));
              return;
            } catch (t) {
              (this.clearCachedUserData(), e(t, null));
              return;
            }
          }),
          (t.getUserDataFromCache = function () {
            return this.storage.getItem(this.userDataKey);
          }),
          (t.isFetchUserDataAndTokenRequired = function (e) {
            var t = (e || {}).bypassCache;
            return void 0 !== t && t;
          }),
          (t.fetchUserData = function () {
            var e = this;
            return this.createGetUserRequest().then(function (t) {
              return (e.cacheUserData(t), t);
            });
          }),
          (t.deleteAttributes = function (e, t) {
            var r = this;
            if (!(null != this.signInUserSession && this.signInUserSession.isValid()))
              return t(Error('User is not authenticated'), null);
            this.client.request(
              'DeleteUserAttributes',
              {
                UserAttributeNames: e,
                AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
              },
              function (e) {
                return e
                  ? t(e, null)
                  : r.getUserData(
                      function () {
                        return t(null, 'SUCCESS');
                      },
                      { bypassCache: !0 }
                    );
              }
            );
          }),
          (t.resendConfirmationCode = function (e, t) {
            var r = {
              ClientId: this.pool.getClientId(),
              Username: this.username,
              ClientMetadata: t,
            };
            this.client.request('ResendConfirmationCode', r, function (t, r) {
              return t ? e(t, null) : e(null, r);
            });
          }),
          (t.getSession = function (e, t) {
            if ((void 0 === t && (t = {}), null == this.username))
              return e(Error('Username is null. Cannot retrieve a new session'), null);
            if (null != this.signInUserSession && this.signInUserSession.isValid())
              return e(null, this.signInUserSession);
            var r =
                'CognitoIdentityServiceProvider.' + this.pool.getClientId() + '.' + this.username,
              n = r + '.idToken';
            if (this.storage.getItem(n)) {
              var i = new x({ IdToken: this.storage.getItem(n) }),
                o = new U({ AccessToken: this.storage.getItem(r + '.accessToken') }),
                s = new I({ RefreshToken: this.storage.getItem(r + '.refreshToken') }),
                a = new _({
                  IdToken: i,
                  AccessToken: o,
                  RefreshToken: s,
                  ClockDrift: parseInt(this.storage.getItem(r + '.clockDrift'), 0) || 0,
                });
              if (a.isValid())
                return ((this.signInUserSession = a), e(null, this.signInUserSession));
              if (!s.getToken())
                return e(Error('Cannot retrieve a new session. Please authenticate.'), null);
              this.refreshSession(s, e, t.clientMetadata);
            } else e(Error('Local storage is missing an ID Token, Please authenticate'), null);
          }),
          (t.refreshSession = function (e, t, r) {
            var n = this,
              i = this.pool.wrapRefreshSessionCallback
                ? this.pool.wrapRefreshSessionCallback(t)
                : t,
              o = {};
            o.REFRESH_TOKEN = e.getToken();
            var s = 'CognitoIdentityServiceProvider.' + this.pool.getClientId(),
              a = s + '.LastAuthUser';
            if (this.storage.getItem(a)) {
              this.username = this.storage.getItem(a);
              var u = s + '.' + this.username + '.deviceKey';
              ((this.deviceKey = this.storage.getItem(u)), (o.DEVICE_KEY = this.deviceKey));
            }
            var f = {
              ClientId: this.pool.getClientId(),
              AuthFlow: 'REFRESH_TOKEN_AUTH',
              AuthParameters: o,
              ClientMetadata: r,
            };
            (this.getUserContextData() && (f.UserContextData = this.getUserContextData()),
              this.client.requestWithRetry('InitiateAuth', f, function (t, r) {
                if (t)
                  return ('NotAuthorizedException' === t.code && n.clearCachedUser(), i(t, null));
                if (r) {
                  var o = r.AuthenticationResult;
                  return (
                    Object.prototype.hasOwnProperty.call(o, 'RefreshToken') ||
                      (o.RefreshToken = e.getToken()),
                    (n.signInUserSession = n.getCognitoUserSession(o)),
                    n.cacheTokens(),
                    i(null, n.signInUserSession)
                  );
                }
              }));
          }),
          (t.cacheTokens = function () {
            var e = 'CognitoIdentityServiceProvider.' + this.pool.getClientId(),
              t = e + '.' + this.username + '.idToken',
              r = e + '.' + this.username + '.accessToken',
              n = e + '.' + this.username + '.refreshToken',
              i = e + '.' + this.username + '.clockDrift';
            (this.storage.setItem(t, this.signInUserSession.getIdToken().getJwtToken()),
              this.storage.setItem(r, this.signInUserSession.getAccessToken().getJwtToken()),
              this.storage.setItem(n, this.signInUserSession.getRefreshToken().getToken()),
              this.storage.setItem(i, '' + this.signInUserSession.getClockDrift()),
              this.storage.setItem(e + '.LastAuthUser', this.username));
          }),
          (t.cacheUserData = function (e) {
            this.storage.setItem(this.userDataKey, JSON.stringify(e));
          }),
          (t.clearCachedUserData = function () {
            this.storage.removeItem(this.userDataKey);
          }),
          (t.clearCachedUser = function () {
            (this.clearCachedTokens(), this.clearCachedUserData());
          }),
          (t.cacheDeviceKeyAndPassword = function () {
            var e =
              'CognitoIdentityServiceProvider.' + this.pool.getClientId() + '.' + this.username;
            (this.storage.setItem(e + '.deviceKey', this.deviceKey),
              this.storage.setItem(e + '.randomPasswordKey', this.randomPassword),
              this.storage.setItem(e + '.deviceGroupKey', this.deviceGroupKey));
          }),
          (t.getCachedDeviceKeyAndPassword = function () {
            var e =
                'CognitoIdentityServiceProvider.' + this.pool.getClientId() + '.' + this.username,
              t = e + '.deviceKey';
            this.storage.getItem(t) &&
              ((this.deviceKey = this.storage.getItem(t)),
              (this.randomPassword = this.storage.getItem(e + '.randomPasswordKey')),
              (this.deviceGroupKey = this.storage.getItem(e + '.deviceGroupKey')));
          }),
          (t.clearCachedDeviceKeyAndPassword = function () {
            var e =
              'CognitoIdentityServiceProvider.' + this.pool.getClientId() + '.' + this.username;
            (this.storage.removeItem(e + '.deviceKey'),
              this.storage.removeItem(e + '.randomPasswordKey'),
              this.storage.removeItem(e + '.deviceGroupKey'));
          }),
          (t.clearCachedTokens = function () {
            var e = 'CognitoIdentityServiceProvider.' + this.pool.getClientId(),
              t = e + '.' + this.username + '.idToken',
              r = e + '.' + this.username + '.accessToken',
              n = e + '.' + this.username + '.refreshToken',
              i = e + '.' + this.username + '.clockDrift';
            (this.storage.removeItem(t),
              this.storage.removeItem(r),
              this.storage.removeItem(n),
              this.storage.removeItem(e + '.LastAuthUser'),
              this.storage.removeItem(i));
          }),
          (t.getCognitoUserSession = function (e) {
            return new _({ IdToken: new x(e), AccessToken: new U(e), RefreshToken: new I(e) });
          }),
          (t.forgotPassword = function (e, t) {
            var r = {
              ClientId: this.pool.getClientId(),
              Username: this.username,
              ClientMetadata: t,
            };
            (this.getUserContextData() && (r.UserContextData = this.getUserContextData()),
              this.client.request('ForgotPassword', r, function (t, r) {
                return t
                  ? e.onFailure(t)
                  : 'function' == typeof e.inputVerificationCode
                    ? e.inputVerificationCode(r)
                    : e.onSuccess(r);
              }));
          }),
          (t.confirmPassword = function (e, t, r, n) {
            var i = {
              ClientId: this.pool.getClientId(),
              Username: this.username,
              ConfirmationCode: e,
              Password: t,
              ClientMetadata: n,
            };
            (this.getUserContextData() && (i.UserContextData = this.getUserContextData()),
              this.client.request('ConfirmForgotPassword', i, function (e) {
                return e ? r.onFailure(e) : r.onSuccess('SUCCESS');
              }));
          }),
          (t.getAttributeVerificationCode = function (e, t, r) {
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return t.onFailure(Error('User is not authenticated'));
            this.client.request(
              'GetUserAttributeVerificationCode',
              {
                AttributeName: e,
                AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
                ClientMetadata: r,
              },
              function (e, r) {
                return e
                  ? t.onFailure(e)
                  : 'function' == typeof t.inputVerificationCode
                    ? t.inputVerificationCode(r)
                    : t.onSuccess('SUCCESS');
              }
            );
          }),
          (t.verifyAttribute = function (e, t, r) {
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return r.onFailure(Error('User is not authenticated'));
            this.client.request(
              'VerifyUserAttribute',
              {
                AttributeName: e,
                Code: t,
                AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
              },
              function (e) {
                return e ? r.onFailure(e) : r.onSuccess('SUCCESS');
              }
            );
          }),
          (t.getDevice = function (e) {
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return e.onFailure(Error('User is not authenticated'));
            this.client.request(
              'GetDevice',
              {
                AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
                DeviceKey: this.deviceKey,
              },
              function (t, r) {
                return t ? e.onFailure(t) : e.onSuccess(r);
              }
            );
          }),
          (t.forgetSpecificDevice = function (e, t) {
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return t.onFailure(Error('User is not authenticated'));
            this.client.request(
              'ForgetDevice',
              { AccessToken: this.signInUserSession.getAccessToken().getJwtToken(), DeviceKey: e },
              function (e) {
                return e ? t.onFailure(e) : t.onSuccess('SUCCESS');
              }
            );
          }),
          (t.forgetDevice = function (e) {
            var t = this;
            this.forgetSpecificDevice(this.deviceKey, {
              onFailure: e.onFailure,
              onSuccess: function (r) {
                return (
                  (t.deviceKey = null),
                  (t.deviceGroupKey = null),
                  (t.randomPassword = null),
                  t.clearCachedDeviceKeyAndPassword(),
                  e.onSuccess(r)
                );
              },
            });
          }),
          (t.setDeviceStatusRemembered = function (e) {
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return e.onFailure(Error('User is not authenticated'));
            this.client.request(
              'UpdateDeviceStatus',
              {
                AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
                DeviceKey: this.deviceKey,
                DeviceRememberedStatus: 'remembered',
              },
              function (t) {
                return t ? e.onFailure(t) : e.onSuccess('SUCCESS');
              }
            );
          }),
          (t.setDeviceStatusNotRemembered = function (e) {
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return e.onFailure(Error('User is not authenticated'));
            this.client.request(
              'UpdateDeviceStatus',
              {
                AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
                DeviceKey: this.deviceKey,
                DeviceRememberedStatus: 'not_remembered',
              },
              function (t) {
                return t ? e.onFailure(t) : e.onSuccess('SUCCESS');
              }
            );
          }),
          (t.listDevices = function (e, t, r) {
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return r.onFailure(Error('User is not authenticated'));
            var n = {
              AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
              Limit: e,
            };
            (t && (n.PaginationToken = t),
              this.client.request('ListDevices', n, function (e, t) {
                return e ? r.onFailure(e) : r.onSuccess(t);
              }));
          }),
          (t.globalSignOut = function (e) {
            var t = this;
            if (null == this.signInUserSession || !this.signInUserSession.isValid())
              return e.onFailure(Error('User is not authenticated'));
            this.client.request(
              'GlobalSignOut',
              { AccessToken: this.signInUserSession.getAccessToken().getJwtToken() },
              function (r) {
                return r ? e.onFailure(r) : (t.clearCachedUser(), e.onSuccess('SUCCESS'));
              }
            );
          }),
          (t.signOut = function (e) {
            var t = this;
            e && 'function' == typeof e
              ? this.getSession(function (r, n) {
                  if (r) return e(r);
                  t.revokeTokens(function (r) {
                    (t.cleanClientData(), e(r));
                  });
                })
              : this.cleanClientData();
          }),
          (t.revokeTokens = function (e) {
            if ((void 0 === e && (e = function () {}), 'function' != typeof e))
              throw Error('Invalid revokeTokenCallback. It should be a function.');
            if (!this.signInUserSession) return e(Error('User is not authenticated'));
            if (!this.signInUserSession.getAccessToken())
              return e(Error('No Access token available'));
            var t = this.signInUserSession.getRefreshToken().getToken(),
              r = this.signInUserSession.getAccessToken();
            if (this.isSessionRevocable(r) && t) return this.revokeToken({ token: t, callback: e });
            e();
          }),
          (t.isSessionRevocable = function (e) {
            if (e && 'function' == typeof e.decodePayload)
              try {
                return !!e.decodePayload().origin_jti;
              } catch (e) {}
            return !1;
          }),
          (t.cleanClientData = function () {
            ((this.signInUserSession = null), this.clearCachedUser());
          }),
          (t.revokeToken = function (e) {
            var t = e.token,
              r = e.callback;
            this.client.requestWithRetry(
              'RevokeToken',
              { Token: t, ClientId: this.pool.getClientId() },
              function (e) {
                if (e) return r(e);
                r();
              }
            );
          }),
          (t.sendMFASelectionAnswer = function (e, t) {
            var r = this,
              n = {};
            ((n.USERNAME = this.username), (n.ANSWER = e));
            var i = {
              ChallengeName: 'SELECT_MFA_TYPE',
              ChallengeResponses: n,
              ClientId: this.pool.getClientId(),
              Session: this.Session,
            };
            (this.getUserContextData() && (i.UserContextData = this.getUserContextData()),
              this.client.request('RespondToAuthChallenge', i, function (n, i) {
                return n
                  ? t.onFailure(n)
                  : ((r.Session = i.Session), 'SMS_MFA' === e)
                    ? t.mfaRequired(i.ChallengeName, i.ChallengeParameters)
                    : 'SOFTWARE_TOKEN_MFA' === e
                      ? t.totpRequired(i.ChallengeName, i.ChallengeParameters)
                      : void 0;
              }));
          }),
          (t.getUserContextData = function () {
            return this.pool.getUserContextData(this.username);
          }),
          (t.associateSoftwareToken = function (e) {
            var t = this;
            null != this.signInUserSession && this.signInUserSession.isValid()
              ? this.client.request(
                  'AssociateSoftwareToken',
                  { AccessToken: this.signInUserSession.getAccessToken().getJwtToken() },
                  function (t, r) {
                    return t ? e.onFailure(t) : e.associateSecretCode(r.SecretCode);
                  }
                )
              : this.client.request(
                  'AssociateSoftwareToken',
                  { Session: this.Session },
                  function (r, n) {
                    return r
                      ? e.onFailure(r)
                      : ((t.Session = n.Session), e.associateSecretCode(n.SecretCode));
                  }
                );
          }),
          (t.verifySoftwareToken = function (e, t, r) {
            var n = this;
            null != this.signInUserSession && this.signInUserSession.isValid()
              ? this.client.request(
                  'VerifySoftwareToken',
                  {
                    AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
                    UserCode: e,
                    FriendlyDeviceName: t,
                  },
                  function (e, t) {
                    return e ? r.onFailure(e) : r.onSuccess(t);
                  }
                )
              : this.client.request(
                  'VerifySoftwareToken',
                  { Session: this.Session, UserCode: e, FriendlyDeviceName: t },
                  function (e, t) {
                    if (e) return r.onFailure(e);
                    n.Session = t.Session;
                    var i = {};
                    i.USERNAME = n.username;
                    var o = {
                      ChallengeName: 'MFA_SETUP',
                      ClientId: n.pool.getClientId(),
                      ChallengeResponses: i,
                      Session: n.Session,
                    };
                    (n.getUserContextData() && (o.UserContextData = n.getUserContextData()),
                      n.client.request('RespondToAuthChallenge', o, function (e, t) {
                        return e
                          ? r.onFailure(e)
                          : ((n.signInUserSession = n.getCognitoUserSession(
                              t.AuthenticationResult
                            )),
                            n.cacheTokens(),
                            r.onSuccess(n.signInUserSession));
                      }));
                  }
                );
          }),
          e
        );
      })();
    function j() {}
    (e.i(79600), (j.prototype.userAgent = D.userAgent));
    var K = function (e) {
      var t = j.category ? ' ' + j.category : '',
        r = j.framework ? ' framework/' + j.framework : '';
      return '' + j.prototype.userAgent + t + r;
    };
    function V(e) {
      var t = 'function' == typeof Map ? new Map() : void 0;
      return (V = function (e) {
        if (
          null === e ||
          !(function (e) {
            try {
              return -1 !== Function.toString.call(e).indexOf('[native code]');
            } catch (t) {
              return 'function' == typeof e;
            }
          })(e)
        )
          return e;
        if ('function' != typeof e)
          throw TypeError('Super expression must either be null or a function');
        if (void 0 !== t) {
          if (t.has(e)) return t.get(e);
          t.set(e, r);
        }
        function r() {
          return (function (e, t, r) {
            if (q()) return Reflect.construct.apply(null, arguments);
            var n = [null];
            n.push.apply(n, t);
            var i = new (e.bind.apply(e, n))();
            return (r && Y(i, r.prototype), i);
          })(e, arguments, H(this).constructor);
        }
        return (
          (r.prototype = Object.create(e.prototype, {
            constructor: { value: r, enumerable: !1, writable: !0, configurable: !0 },
          })),
          Y(r, e)
        );
      })(e);
    }
    function q() {
      try {
        var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      } catch (e) {}
      return (q = function () {
        return !!e;
      })();
    }
    function Y(e, t) {
      return (Y = Object.setPrototypeOf
        ? Object.setPrototypeOf.bind()
        : function (e, t) {
            return ((e.__proto__ = t), e);
          })(e, t);
    }
    function H(e) {
      return (H = Object.setPrototypeOf
        ? Object.getPrototypeOf.bind()
        : function (e) {
            return e.__proto__ || Object.getPrototypeOf(e);
          })(e);
    }
    var J = (function (e) {
        function t(t, r, n, i) {
          var o;
          return (((o = e.call(this, t) || this).code = r), (o.name = n), (o.statusCode = i), o);
        }
        return (
          (t.prototype = Object.create(e.prototype)),
          (t.prototype.constructor = t),
          Y(t, e),
          t
        );
      })(V(Error)),
      G = (function () {
        function e(e, t, r) {
          this.endpoint = t || 'https://cognito-idp.' + e + '.amazonaws.com/';
          var n = (r || {}).credentials;
          this.fetchOptions = n ? { credentials: n } : {};
        }
        var t = e.prototype;
        return (
          (t.promisifyRequest = function (e, t) {
            var r = this;
            return new Promise(function (n, i) {
              r.request(e, t, function (e, t) {
                e ? i(new J(e.message, e.code, e.name, e.statusCode)) : n(t);
              });
            });
          }),
          (t.requestWithRetry = function (e, t, r) {
            var n,
              i,
              o = this;
            ((n = 5e3),
            (function e(t, r, n, i) {
              if ((void 0 === i && (i = 1), 'function' != typeof t))
                throw Error('functionToRetry must be a function');
              return (
                W(t.name + ' attempt #' + i + ' with args: ' + JSON.stringify(r)),
                t.apply(void 0, r).catch(function (o) {
                  if ((W('error on ' + t.name, o), o && o.nonRetryable))
                    throw (W(t.name + ' non retryable error', o), o);
                  var s = n(i, r, o);
                  if ((W(t.name + ' retrying in ' + s + ' ms'), !1 !== s))
                    return new Promise(function (e) {
                      return setTimeout(e, s);
                    }).then(function () {
                      return e(t, r, n, i + 1);
                    });
                  throw o;
                })
              );
            })(
              function (t) {
                return new Promise(function (r, n) {
                  o.request(e, t, function (e, t) {
                    e ? n(e) : r(t);
                  });
                });
              },
              [t],
              ((i = n),
              function (e) {
                var t = 100 * Math.pow(2, e) + 100 * Math.random();
                return !(t > i) && t;
              })
            ))
              .then(function (e) {
                return r(null, e);
              })
              .catch(function (e) {
                return r(e);
              });
          }),
          (t.request = function (e, t, r) {
            var n,
              i = {
                'Content-Type': 'application/x-amz-json-1.1',
                'X-Amz-Target': 'AWSCognitoIdentityProviderService.' + e,
                'X-Amz-User-Agent': K(),
                'Cache-Control': 'no-store',
              },
              o = Object.assign({}, this.fetchOptions, {
                headers: i,
                method: 'POST',
                mode: 'cors',
                body: JSON.stringify(t),
              });
            fetch(this.endpoint, o)
              .then(
                function (e) {
                  return ((n = e), e);
                },
                function (e) {
                  if (e instanceof TypeError) throw Error('Network error');
                  throw e;
                }
              )
              .then(function (e) {
                return e.json().catch(function () {
                  return {};
                });
              })
              .then(function (e) {
                if (n.ok) return r(null, e);
                var t = (e.__type || e.code).split('#').pop(),
                  i = Error(e.message || e.Message || null);
                return ((i.name = t), (i.code = t), r(i));
              })
              .catch(function (e) {
                if (n && n.headers && n.headers.get('x-amzn-errortype'))
                  try {
                    var t = n.headers.get('x-amzn-errortype').split(':')[0],
                      i = Error(n.status ? n.status.toString() : null);
                    return ((i.code = t), (i.name = t), (i.statusCode = n.status), r(i));
                  } catch (e) {}
                else
                  e instanceof Error && 'Network error' === e.message && (e.code = 'NetworkError');
                return r(e);
              });
          }),
          e
        );
      })(),
      W = function () {},
      z = (function () {
        function e(e, t) {
          var r = e || {},
            n = r.UserPoolId,
            i = r.ClientId,
            o = r.endpoint,
            s = r.fetchOptions,
            a = r.AdvancedSecurityDataCollectionFlag;
          if (!n || !i) throw Error('Both UserPoolId and ClientId are required.');
          if (n.length > 55 || !/^[\w-]+_[0-9a-zA-Z]+$/.test(n))
            throw Error('Invalid UserPoolId format.');
          var u = n.split('_')[0];
          ((this.userPoolId = n),
            (this.clientId = i),
            (this.client = new G(u, o, s)),
            (this.advancedSecurityDataCollectionFlag = !1 !== a),
            (this.storage = e.Storage || new F().getStorage()),
            t && (this.wrapRefreshSessionCallback = t));
        }
        var t = e.prototype;
        return (
          (t.getUserPoolId = function () {
            return this.userPoolId;
          }),
          (t.getUserPoolName = function () {
            return this.getUserPoolId().split('_')[1];
          }),
          (t.getClientId = function () {
            return this.clientId;
          }),
          (t.signUp = function (e, t, r, n, i, o) {
            var s = this,
              a = {
                ClientId: this.clientId,
                Username: e,
                Password: t,
                UserAttributes: r,
                ValidationData: n,
                ClientMetadata: o,
              };
            (this.getUserContextData(e) && (a.UserContextData = this.getUserContextData(e)),
              this.client.request('SignUp', a, function (t, r) {
                return t
                  ? i(t, null)
                  : i(null, {
                      user: new L({ Username: e, Pool: s, Storage: s.storage }),
                      userConfirmed: r.UserConfirmed,
                      userSub: r.UserSub,
                      codeDeliveryDetails: r.CodeDeliveryDetails,
                    });
              }));
          }),
          (t.getCurrentUser = function () {
            var e = 'CognitoIdentityServiceProvider.' + this.clientId + '.LastAuthUser',
              t = this.storage.getItem(e);
            return t ? new L({ Username: t, Pool: this, Storage: this.storage }) : null;
          }),
          (t.getUserContextData = function (e) {
            if ('undefined' != typeof AmazonCognitoAdvancedSecurityData) {
              var t = AmazonCognitoAdvancedSecurityData;
              if (this.advancedSecurityDataCollectionFlag) {
                var r = t.getData(e, this.userPoolId, this.clientId);
                if (r) return { EncodedData: r };
              }
              return {};
            }
          }),
          e
        );
      })();
    e.i(19447);
    var Z = e.i(66746),
      X = e.i(14983);
    function Q() {
      let e = 'af-south-1_nr4JyQzqA',
        t = '3haprclofctups3or94j19vbub',
        r = (0, s.useMemo)(() => new z({ UserPoolId: e, ClientId: t }), [e, t]),
        [n, i] = (0, s.useState)(''),
        [f, h] = (0, s.useState)(''),
        [c, l] = (0, s.useState)('login'),
        [d, p] = (0, s.useState)(null),
        [g, y] = (0, s.useState)(!1),
        [m, v] = (0, s.useState)(null),
        [S, w] = (0, s.useState)({}),
        [b, A] = (0, s.useState)([]),
        [C, E] = (0, s.useState)(''),
        [U, T] = (0, s.useState)(''),
        [x, I] = (0, s.useState)(''),
        [D, _] = (0, s.useState)(''),
        [R, P] = (0, s.useState)(null),
        [B, k] = (0, s.useState)(''),
        [O, N] = (0, s.useState)(''),
        F = (0, a.useRouter)();
      if (!r)
        return (0, o.jsx)('main', {
          className:
            'mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 pb-16 pt-24 sm:px-6 lg:px-8',
          children: (0, o.jsxs)('header', {
            className: 'space-y-2 text-center',
            children: [
              (0, o.jsx)('h1', {
                className: 'text-3xl font-semibold text-slate-900',
                children: 'Configuration missing',
              }),
              (0, o.jsx)('p', {
                className: 'text-sm text-slate-600',
                children:
                  'Cognito settings are not available. Please set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID.',
              }),
            ],
          }),
        });
      let M = (e) => {
        let t = e.getIdToken().getJwtToken(),
          r = e.getAccessToken().getJwtToken(),
          n = e.getRefreshToken()?.getToken(),
          i = e.getIdToken().payload['cognito:groups'] ?? [];
        ((0, X.persistSession)({ accessToken: r, idToken: t, refreshToken: n ?? null, groups: i }),
          y(!1),
          l('login'));
        let o = (0, Z.isAdminGroup)(i) ? '/admin' : '/';
        F.push(o);
      };
      return (0, o.jsxs)('main', {
        className:
          'mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 pb-16 pt-24 sm:px-6 lg:px-8',
        children: [
          (0, o.jsxs)('header', {
            className: 'space-y-2 text-center',
            children: [
              (0, o.jsx)('h1', {
                className: 'text-3xl font-semibold text-slate-900',
                children: 'Welcome back',
              }),
              (0, o.jsx)('p', {
                className: 'text-sm text-slate-600',
                children: 'Sign in with your email or username.',
              }),
            ],
          }),
          'login' === c &&
            (0, o.jsxs)('form', {
              onSubmit: (e) => {
                (e.preventDefault(), p(null), y(!0));
                try {
                  let e = new L({ Username: n, Pool: r }),
                    t = new u({ Username: n, Password: f });
                  e.authenticateUser(t, {
                    onSuccess: (e) => {
                      M(e);
                    },
                    newPasswordRequired: (t, r) => {
                      let n,
                        i =
                          ((n = { ...(t ?? {}) }),
                          delete n.email_verified,
                          delete n.phone_number_verified,
                          delete n.sub,
                          n);
                      (v(e),
                        w(i),
                        A(r ?? []),
                        I(i.given_name ?? ''),
                        _(i.family_name ?? ''),
                        l('forceChange'),
                        y(!1),
                        p('Please set a new password before continuing.'));
                    },
                    onFailure: (e) => {
                      (y(!1), p(e.message ?? 'Login failed'));
                    },
                  });
                } catch (e) {
                  (y(!1), p(e?.message ?? 'Login failed'));
                }
              },
              className: 'space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm',
              children: [
                (0, o.jsxs)('label', {
                  className: 'text-sm font-semibold text-slate-600',
                  children: [
                    'Username, email or phone',
                    (0, o.jsx)('input', {
                      required: !0,
                      value: n,
                      onChange: (e) => i(e.target.value),
                      className:
                        'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-inner focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200',
                      placeholder: 'you@example.com or +27...',
                    }),
                  ],
                }),
                (0, o.jsxs)('label', {
                  className: 'text-sm font-semibold text-slate-600',
                  children: [
                    'Password',
                    (0, o.jsx)('input', {
                      required: !0,
                      type: 'password',
                      value: f,
                      onChange: (e) => h(e.target.value),
                      className:
                        'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-inner focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200',
                    }),
                  ],
                }),
                (0, o.jsx)('div', {
                  className: 'flex items-center justify-between text-sm',
                  children: (0, o.jsx)('button', {
                    type: 'button',
                    onClick: () => {
                      (l('forgotRequest'), p(null));
                    },
                    className: 'font-semibold text-orange-600 hover:underline',
                    children: 'Forgot password?',
                  }),
                }),
                (0, o.jsx)('button', {
                  type: 'submit',
                  disabled: g,
                  className:
                    'btn-primary w-full px-6 py-3 text-base font-semibold disabled:cursor-wait',
                  children: g ? 'Signing in...' : 'Sign in',
                }),
              ],
            }),
          'forceChange' === c &&
            (0, o.jsxs)('form', {
              onSubmit: (e) => {
                if ((e.preventDefault(), !m)) return;
                if (C !== U) return void p('Passwords do not match.');
                let t = {
                  ...S,
                  ...(b.includes('given_name') || x ? { given_name: x.trim() } : {}),
                  ...(b.includes('family_name') || D ? { family_name: D.trim() } : {}),
                };
                b.includes('given_name') && !t.given_name
                  ? p('First name is required.')
                  : b.includes('family_name') && !t.family_name
                    ? p('Last name is required.')
                    : (y(!0),
                      m.completeNewPasswordChallenge(C, t, {
                        onSuccess: (e) => {
                          (E(''), T(''), w({}), A([]), I(''), _(''), M(e));
                        },
                        onFailure: (e) => {
                          (y(!1), p(e.message ?? 'Unable to update password.'));
                        },
                      }));
              },
              className: 'space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm',
              children: [
                (0, o.jsx)('p', {
                  className: 'text-sm text-slate-600',
                  children: 'Enter a new password to complete your first-time sign-in.',
                }),
                (b.includes('given_name') || b.includes('family_name')) &&
                  (0, o.jsxs)('div', {
                    className: 'grid gap-4 sm:grid-cols-2',
                    children: [
                      (0, o.jsxs)('label', {
                        className: 'text-sm font-semibold text-slate-600',
                        children: [
                          'First name',
                          (0, o.jsx)('input', {
                            required: b.includes('given_name'),
                            value: x,
                            onChange: (e) => I(e.target.value),
                            className: 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3',
                          }),
                        ],
                      }),
                      (0, o.jsxs)('label', {
                        className: 'text-sm font-semibold text-slate-600',
                        children: [
                          'Last name',
                          (0, o.jsx)('input', {
                            required: b.includes('family_name'),
                            value: D,
                            onChange: (e) => _(e.target.value),
                            className: 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3',
                          }),
                        ],
                      }),
                    ],
                  }),
                (0, o.jsxs)('label', {
                  className: 'text-sm font-semibold text-slate-600',
                  children: [
                    'New password',
                    (0, o.jsx)('input', {
                      required: !0,
                      type: 'password',
                      value: C,
                      onChange: (e) => E(e.target.value),
                      className: 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3',
                    }),
                  ],
                }),
                (0, o.jsxs)('label', {
                  className: 'text-sm font-semibold text-slate-600',
                  children: [
                    'Confirm password',
                    (0, o.jsx)('input', {
                      required: !0,
                      type: 'password',
                      value: U,
                      onChange: (e) => T(e.target.value),
                      className: 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3',
                    }),
                  ],
                }),
                (0, o.jsx)('button', {
                  type: 'submit',
                  disabled: g,
                  className: 'btn-primary w-full px-6 py-3 text-base font-semibold',
                  children: g ? 'Updating...' : 'Set password',
                }),
              ],
            }),
          'forgotRequest' === c &&
            (0, o.jsxs)('form', {
              onSubmit: (e) => {
                if ((e.preventDefault(), p(null), !n))
                  return void p('Enter the username or email first.');
                try {
                  let e = new L({ Username: n, Pool: r });
                  (y(!0),
                    e.forgotPassword({
                      onSuccess: () => {
                        (y(!1),
                          P(e),
                          l('forgotConfirm'),
                          p('Verification code sent. Check your email or SMS.'));
                      },
                      onFailure: (e) => {
                        (y(!1), p(e.message ?? 'Unable to start reset.'));
                      },
                      inputVerificationCode: () => {
                        (y(!1),
                          P(e),
                          l('forgotConfirm'),
                          p('Verification code sent. Check your email or SMS.'));
                      },
                    }));
                } catch (e) {
                  p(e?.message ?? 'Unable to start reset.');
                }
              },
              className: 'space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm',
              children: [
                (0, o.jsx)('p', {
                  className: 'text-sm text-slate-600',
                  children:
                    "Enter your username or email and we'll send you a verification code to reset your password.",
                }),
                (0, o.jsxs)('label', {
                  className: 'text-sm font-semibold text-slate-600',
                  children: [
                    'Username or email',
                    (0, o.jsx)('input', {
                      required: !0,
                      value: n,
                      onChange: (e) => i(e.target.value),
                      className: 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3',
                    }),
                  ],
                }),
                (0, o.jsxs)('div', {
                  className: 'flex gap-3',
                  children: [
                    (0, o.jsx)('button', {
                      type: 'button',
                      onClick: () => {
                        (l('login'), p(null));
                      },
                      className:
                        'w-1/3 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600',
                      children: 'Back',
                    }),
                    (0, o.jsx)('button', {
                      type: 'submit',
                      disabled: g,
                      className: 'btn-primary w-2/3 px-6 py-3 text-base font-semibold',
                      children: g ? 'Sending...' : 'Send reset code',
                    }),
                  ],
                }),
              ],
            }),
          'forgotConfirm' === c &&
            (0, o.jsxs)('form', {
              onSubmit: (e) => {
                (e.preventDefault(), R)
                  ? (y(!0),
                    R.confirmPassword(B, O, {
                      onSuccess: () => {
                        (y(!1), l('login'), p('Password updated. Please sign in.'), k(''), N(''));
                      },
                      onFailure: (e) => {
                        (y(!1), p(e.message ?? 'Unable to reset password.'));
                      },
                    }))
                  : p('Start the reset flow first.');
              },
              className: 'space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm',
              children: [
                (0, o.jsx)('p', {
                  className: 'text-sm text-slate-600',
                  children:
                    'Enter the verification code you received along with your new password.',
                }),
                (0, o.jsxs)('label', {
                  className: 'text-sm font-semibold text-slate-600',
                  children: [
                    'Verification code',
                    (0, o.jsx)('input', {
                      required: !0,
                      value: B,
                      onChange: (e) => k(e.target.value),
                      className: 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3',
                    }),
                  ],
                }),
                (0, o.jsxs)('label', {
                  className: 'text-sm font-semibold text-slate-600',
                  children: [
                    'New password',
                    (0, o.jsx)('input', {
                      required: !0,
                      type: 'password',
                      value: O,
                      onChange: (e) => N(e.target.value),
                      className: 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3',
                    }),
                  ],
                }),
                (0, o.jsxs)('div', {
                  className: 'flex gap-3',
                  children: [
                    (0, o.jsx)('button', {
                      type: 'button',
                      onClick: () => {
                        (l('login'), p(null));
                      },
                      className:
                        'w-1/3 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600',
                      children: 'Back',
                    }),
                    (0, o.jsx)('button', {
                      type: 'submit',
                      disabled: g,
                      className: 'btn-primary w-2/3 px-6 py-3 text-base font-semibold',
                      children: g ? 'Updating...' : 'Reset password',
                    }),
                  ],
                }),
              ],
            }),
          d &&
            (0, o.jsx)('p', {
              className:
                'rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600',
              children: d,
            }),
        ],
      });
    }
    e.s(['default', () => Q], 53731);
  },
]);
