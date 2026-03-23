(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  38750,
  (e, t, r) => {
    t.exports = function () {
      return 'function' == typeof Promise && Promise.prototype && Promise.prototype.then;
    };
  },
  87201,
  (e, t, r) => {
    let n,
      o = [
        0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901,
        991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185, 2323, 2465, 2611,
        2761, 2876, 3034, 3196, 3362, 3532, 3706,
      ];
    ((r.getSymbolSize = function (e) {
      if (!e) throw Error('"version" cannot be null or undefined');
      if (e < 1 || e > 40) throw Error('"version" should be in range from 1 to 40');
      return 4 * e + 17;
    }),
      (r.getSymbolTotalCodewords = function (e) {
        return o[e];
      }),
      (r.getBCHDigit = function (e) {
        let t = 0;
        for (; 0 !== e; ) (t++, (e >>>= 1));
        return t;
      }),
      (r.setToSJISFunction = function (e) {
        if ('function' != typeof e) throw Error('"toSJISFunc" is not a valid function.');
        n = e;
      }),
      (r.isKanjiModeEnabled = function () {
        return void 0 !== n;
      }),
      (r.toSJIS = function (e) {
        return n(e);
      }));
  },
  73133,
  (e, t, r) => {
    ((r.L = { bit: 1 }),
      (r.M = { bit: 0 }),
      (r.Q = { bit: 3 }),
      (r.H = { bit: 2 }),
      (r.isValid = function (e) {
        return e && void 0 !== e.bit && e.bit >= 0 && e.bit < 4;
      }),
      (r.from = function (e, t) {
        if (r.isValid(e)) return e;
        try {
          if ('string' != typeof e) throw Error('Param is not a string');
          switch (e.toLowerCase()) {
            case 'l':
            case 'low':
              return r.L;
            case 'm':
            case 'medium':
              return r.M;
            case 'q':
            case 'quartile':
              return r.Q;
            case 'h':
            case 'high':
              return r.H;
            default:
              throw Error('Unknown EC Level: ' + e);
          }
        } catch (e) {
          return t;
        }
      }));
  },
  73666,
  (e, t, r) => {
    function n() {
      ((this.buffer = []), (this.length = 0));
    }
    ((n.prototype = {
      get: function (e) {
        let t = Math.floor(e / 8);
        return ((this.buffer[t] >>> (7 - (e % 8))) & 1) == 1;
      },
      put: function (e, t) {
        for (let r = 0; r < t; r++) this.putBit(((e >>> (t - r - 1)) & 1) == 1);
      },
      getLengthInBits: function () {
        return this.length;
      },
      putBit: function (e) {
        let t = Math.floor(this.length / 8);
        (this.buffer.length <= t && this.buffer.push(0),
          e && (this.buffer[t] |= 128 >>> (this.length % 8)),
          this.length++);
      },
    }),
      (t.exports = n));
  },
  11421,
  (e, t, r) => {
    function n(e) {
      if (!e || e < 1) throw Error('BitMatrix size must be defined and greater than 0');
      ((this.size = e),
        (this.data = new Uint8Array(e * e)),
        (this.reservedBit = new Uint8Array(e * e)));
    }
    ((n.prototype.set = function (e, t, r, n) {
      let o = e * this.size + t;
      ((this.data[o] = r), n && (this.reservedBit[o] = !0));
    }),
      (n.prototype.get = function (e, t) {
        return this.data[e * this.size + t];
      }),
      (n.prototype.xor = function (e, t, r) {
        this.data[e * this.size + t] ^= r;
      }),
      (n.prototype.isReserved = function (e, t) {
        return this.reservedBit[e * this.size + t];
      }),
      (t.exports = n));
  },
  20637,
  (e, t, r) => {
    let n = e.r(87201).getSymbolSize;
    ((r.getRowColCoords = function (e) {
      if (1 === e) return [];
      let t = Math.floor(e / 7) + 2,
        r = n(e),
        o = 145 === r ? 26 : 2 * Math.ceil((r - 13) / (2 * t - 2)),
        i = [r - 7];
      for (let e = 1; e < t - 1; e++) i[e] = i[e - 1] - o;
      return (i.push(6), i.reverse());
    }),
      (r.getPositions = function (e) {
        let t = [],
          n = r.getRowColCoords(e),
          o = n.length;
        for (let e = 0; e < o; e++)
          for (let r = 0; r < o; r++)
            (0 !== e || 0 !== r) &&
              (0 !== e || r !== o - 1) &&
              (e !== o - 1 || 0 !== r) &&
              t.push([n[e], n[r]]);
        return t;
      }));
  },
  14002,
  (e, t, r) => {
    let n = e.r(87201).getSymbolSize;
    r.getPositions = function (e) {
      let t = n(e);
      return [
        [0, 0],
        [t - 7, 0],
        [0, t - 7],
      ];
    };
  },
  37692,
  (e, t, r) => {
    r.Patterns = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7,
    };
    ((r.isValid = function (e) {
      return null != e && '' !== e && !isNaN(e) && e >= 0 && e <= 7;
    }),
      (r.from = function (e) {
        return r.isValid(e) ? parseInt(e, 10) : void 0;
      }),
      (r.getPenaltyN1 = function (e) {
        let t = e.size,
          r = 0,
          n = 0,
          o = 0,
          i = null,
          a = null;
        for (let s = 0; s < t; s++) {
          ((n = o = 0), (i = a = null));
          for (let l = 0; l < t; l++) {
            let t = e.get(s, l);
            (t === i ? n++ : (n >= 5 && (r += 3 + (n - 5)), (i = t), (n = 1)),
              (t = e.get(l, s)) === a ? o++ : (o >= 5 && (r += 3 + (o - 5)), (a = t), (o = 1)));
          }
          (n >= 5 && (r += 3 + (n - 5)), o >= 5 && (r += 3 + (o - 5)));
        }
        return r;
      }),
      (r.getPenaltyN2 = function (e) {
        let t = e.size,
          r = 0;
        for (let n = 0; n < t - 1; n++)
          for (let o = 0; o < t - 1; o++) {
            let t = e.get(n, o) + e.get(n, o + 1) + e.get(n + 1, o) + e.get(n + 1, o + 1);
            (4 === t || 0 === t) && r++;
          }
        return 3 * r;
      }),
      (r.getPenaltyN3 = function (e) {
        let t = e.size,
          r = 0,
          n = 0,
          o = 0;
        for (let i = 0; i < t; i++) {
          n = o = 0;
          for (let a = 0; a < t; a++)
            ((n = ((n << 1) & 2047) | e.get(i, a)),
              a >= 10 && (1488 === n || 93 === n) && r++,
              (o = ((o << 1) & 2047) | e.get(a, i)),
              a >= 10 && (1488 === o || 93 === o) && r++);
        }
        return 40 * r;
      }),
      (r.getPenaltyN4 = function (e) {
        let t = 0,
          r = e.data.length;
        for (let n = 0; n < r; n++) t += e.data[n];
        return 10 * Math.abs(Math.ceil((100 * t) / r / 5) - 10);
      }),
      (r.applyMask = function (e, t) {
        let n = t.size;
        for (let o = 0; o < n; o++)
          for (let i = 0; i < n; i++)
            t.isReserved(i, o) ||
              t.xor(
                i,
                o,
                (function (e, t, n) {
                  switch (e) {
                    case r.Patterns.PATTERN000:
                      return (t + n) % 2 == 0;
                    case r.Patterns.PATTERN001:
                      return t % 2 == 0;
                    case r.Patterns.PATTERN010:
                      return n % 3 == 0;
                    case r.Patterns.PATTERN011:
                      return (t + n) % 3 == 0;
                    case r.Patterns.PATTERN100:
                      return (Math.floor(t / 2) + Math.floor(n / 3)) % 2 == 0;
                    case r.Patterns.PATTERN101:
                      return ((t * n) % 2) + ((t * n) % 3) == 0;
                    case r.Patterns.PATTERN110:
                      return (((t * n) % 2) + ((t * n) % 3)) % 2 == 0;
                    case r.Patterns.PATTERN111:
                      return (((t * n) % 3) + ((t + n) % 2)) % 2 == 0;
                    default:
                      throw Error('bad maskPattern:' + e);
                  }
                })(e, i, o)
              );
      }),
      (r.getBestMask = function (e, t) {
        let n = Object.keys(r.Patterns).length,
          o = 0,
          i = 1 / 0;
        for (let a = 0; a < n; a++) {
          (t(a), r.applyMask(a, e));
          let n = r.getPenaltyN1(e) + r.getPenaltyN2(e) + r.getPenaltyN3(e) + r.getPenaltyN4(e);
          (r.applyMask(a, e), n < i && ((i = n), (o = a)));
        }
        return o;
      }));
  },
  48125,
  (e, t, r) => {
    let n = e.r(73133),
      o = [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 2, 2, 4, 1, 2, 4, 4, 2, 4, 4, 4, 2, 4, 6, 5, 2, 4, 6,
        6, 2, 5, 8, 8, 4, 5, 8, 8, 4, 5, 8, 11, 4, 8, 10, 11, 4, 9, 12, 16, 4, 9, 16, 16, 6, 10, 12,
        18, 6, 10, 17, 16, 6, 11, 16, 19, 6, 13, 18, 21, 7, 14, 21, 25, 8, 16, 20, 25, 8, 17, 23,
        25, 9, 17, 23, 34, 9, 18, 25, 30, 10, 20, 27, 32, 12, 21, 29, 35, 12, 23, 34, 37, 12, 25,
        34, 40, 13, 26, 35, 42, 14, 28, 38, 45, 15, 29, 40, 48, 16, 31, 43, 51, 17, 33, 45, 54, 18,
        35, 48, 57, 19, 37, 51, 60, 19, 38, 53, 63, 20, 40, 56, 66, 21, 43, 59, 70, 22, 45, 62, 74,
        24, 47, 65, 77, 25, 49, 68, 81,
      ],
      i = [
        7, 10, 13, 17, 10, 16, 22, 28, 15, 26, 36, 44, 20, 36, 52, 64, 26, 48, 72, 88, 36, 64, 96,
        112, 40, 72, 108, 130, 48, 88, 132, 156, 60, 110, 160, 192, 72, 130, 192, 224, 80, 150, 224,
        264, 96, 176, 260, 308, 104, 198, 288, 352, 120, 216, 320, 384, 132, 240, 360, 432, 144,
        280, 408, 480, 168, 308, 448, 532, 180, 338, 504, 588, 196, 364, 546, 650, 224, 416, 600,
        700, 224, 442, 644, 750, 252, 476, 690, 816, 270, 504, 750, 900, 300, 560, 810, 960, 312,
        588, 870, 1050, 336, 644, 952, 1110, 360, 700, 1020, 1200, 390, 728, 1050, 1260, 420, 784,
        1140, 1350, 450, 812, 1200, 1440, 480, 868, 1290, 1530, 510, 924, 1350, 1620, 540, 980,
        1440, 1710, 570, 1036, 1530, 1800, 570, 1064, 1590, 1890, 600, 1120, 1680, 1980, 630, 1204,
        1770, 2100, 660, 1260, 1860, 2220, 720, 1316, 1950, 2310, 750, 1372, 2040, 2430,
      ];
    ((r.getBlocksCount = function (e, t) {
      switch (t) {
        case n.L:
          return o[(e - 1) * 4 + 0];
        case n.M:
          return o[(e - 1) * 4 + 1];
        case n.Q:
          return o[(e - 1) * 4 + 2];
        case n.H:
          return o[(e - 1) * 4 + 3];
        default:
          return;
      }
    }),
      (r.getTotalCodewordsCount = function (e, t) {
        switch (t) {
          case n.L:
            return i[(e - 1) * 4 + 0];
          case n.M:
            return i[(e - 1) * 4 + 1];
          case n.Q:
            return i[(e - 1) * 4 + 2];
          case n.H:
            return i[(e - 1) * 4 + 3];
          default:
            return;
        }
      }));
  },
  54232,
  (e, t, r) => {
    let n = new Uint8Array(512),
      o = new Uint8Array(256),
      i = 1;
    for (let e = 0; e < 255; e++) ((n[e] = i), (o[i] = e), 256 & (i <<= 1) && (i ^= 285));
    for (let e = 255; e < 512; e++) n[e] = n[e - 255];
    ((r.log = function (e) {
      if (e < 1) throw Error('log(' + e + ')');
      return o[e];
    }),
      (r.exp = function (e) {
        return n[e];
      }),
      (r.mul = function (e, t) {
        return 0 === e || 0 === t ? 0 : n[o[e] + o[t]];
      }));
  },
  50677,
  (e, t, r) => {
    let n = e.r(54232);
    ((r.mul = function (e, t) {
      let r = new Uint8Array(e.length + t.length - 1);
      for (let o = 0; o < e.length; o++)
        for (let i = 0; i < t.length; i++) r[o + i] ^= n.mul(e[o], t[i]);
      return r;
    }),
      (r.mod = function (e, t) {
        let r = new Uint8Array(e);
        for (; r.length - t.length >= 0; ) {
          let e = r[0];
          for (let o = 0; o < t.length; o++) r[o] ^= n.mul(t[o], e);
          let o = 0;
          for (; o < r.length && 0 === r[o]; ) o++;
          r = r.slice(o);
        }
        return r;
      }),
      (r.generateECPolynomial = function (e) {
        let t = new Uint8Array([1]);
        for (let o = 0; o < e; o++) t = r.mul(t, new Uint8Array([1, n.exp(o)]));
        return t;
      }));
  },
  62458,
  (e, t, r) => {
    let n = e.r(50677);
    function o(e) {
      ((this.genPoly = void 0), (this.degree = e), this.degree && this.initialize(this.degree));
    }
    ((o.prototype.initialize = function (e) {
      ((this.degree = e), (this.genPoly = n.generateECPolynomial(this.degree)));
    }),
      (o.prototype.encode = function (e) {
        if (!this.genPoly) throw Error('Encoder not initialized');
        let t = new Uint8Array(e.length + this.degree);
        t.set(e);
        let r = n.mod(t, this.genPoly),
          o = this.degree - r.length;
        if (o > 0) {
          let e = new Uint8Array(this.degree);
          return (e.set(r, o), e);
        }
        return r;
      }),
      (t.exports = o));
  },
  67483,
  (e, t, r) => {
    r.isValid = function (e) {
      return !isNaN(e) && e >= 1 && e <= 40;
    };
  },
  96592,
  (e, t, r) => {
    let n = '[0-9]+',
      o =
        '(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+',
      i = '(?:(?![A-Z0-9 $%*+\\-./:]|' + (o = o.replace(/u/g, '\\u')) + ')(?:.|[\r\n]))+';
    ((r.KANJI = RegExp(o, 'g')),
      (r.BYTE_KANJI = RegExp('[^A-Z0-9 $%*+\\-./:]+', 'g')),
      (r.BYTE = RegExp(i, 'g')),
      (r.NUMERIC = RegExp(n, 'g')),
      (r.ALPHANUMERIC = RegExp('[A-Z $%*+\\-./:]+', 'g')));
    let a = RegExp('^' + o + '$'),
      s = RegExp('^' + n + '$'),
      l = RegExp('^[A-Z0-9 $%*+\\-./:]+$');
    ((r.testKanji = function (e) {
      return a.test(e);
    }),
      (r.testNumeric = function (e) {
        return s.test(e);
      }),
      (r.testAlphanumeric = function (e) {
        return l.test(e);
      }));
  },
  50882,
  (e, t, r) => {
    let n = e.r(67483),
      o = e.r(96592);
    ((r.NUMERIC = { id: 'Numeric', bit: 1, ccBits: [10, 12, 14] }),
      (r.ALPHANUMERIC = { id: 'Alphanumeric', bit: 2, ccBits: [9, 11, 13] }),
      (r.BYTE = { id: 'Byte', bit: 4, ccBits: [8, 16, 16] }),
      (r.KANJI = { id: 'Kanji', bit: 8, ccBits: [8, 10, 12] }),
      (r.MIXED = { bit: -1 }),
      (r.getCharCountIndicator = function (e, t) {
        if (!e.ccBits) throw Error('Invalid mode: ' + e);
        if (!n.isValid(t)) throw Error('Invalid version: ' + t);
        return t >= 1 && t < 10 ? e.ccBits[0] : t < 27 ? e.ccBits[1] : e.ccBits[2];
      }),
      (r.getBestModeForData = function (e) {
        return o.testNumeric(e)
          ? r.NUMERIC
          : o.testAlphanumeric(e)
            ? r.ALPHANUMERIC
            : o.testKanji(e)
              ? r.KANJI
              : r.BYTE;
      }),
      (r.toString = function (e) {
        if (e && e.id) return e.id;
        throw Error('Invalid mode');
      }),
      (r.isValid = function (e) {
        return e && e.bit && e.ccBits;
      }),
      (r.from = function (e, t) {
        if (r.isValid(e)) return e;
        try {
          if ('string' != typeof e) throw Error('Param is not a string');
          switch (e.toLowerCase()) {
            case 'numeric':
              return r.NUMERIC;
            case 'alphanumeric':
              return r.ALPHANUMERIC;
            case 'kanji':
              return r.KANJI;
            case 'byte':
              return r.BYTE;
            default:
              throw Error('Unknown mode: ' + e);
          }
        } catch (e) {
          return t;
        }
      }));
  },
  93547,
  (e, t, r) => {
    let n = e.r(87201),
      o = e.r(48125),
      i = e.r(73133),
      a = e.r(50882),
      s = e.r(67483),
      l = n.getBCHDigit(7973);
    function c(e, t) {
      return a.getCharCountIndicator(e, t) + 4;
    }
    ((r.from = function (e, t) {
      return s.isValid(e) ? parseInt(e, 10) : t;
    }),
      (r.getCapacity = function (e, t, r) {
        if (!s.isValid(e)) throw Error('Invalid QR Code version');
        void 0 === r && (r = a.BYTE);
        let i = (n.getSymbolTotalCodewords(e) - o.getTotalCodewordsCount(e, t)) * 8;
        if (r === a.MIXED) return i;
        let l = i - c(r, e);
        switch (r) {
          case a.NUMERIC:
            return Math.floor((l / 10) * 3);
          case a.ALPHANUMERIC:
            return Math.floor((l / 11) * 2);
          case a.KANJI:
            return Math.floor(l / 13);
          case a.BYTE:
          default:
            return Math.floor(l / 8);
        }
      }),
      (r.getBestVersionForData = function (e, t) {
        let n,
          o = i.from(t, i.M);
        if (Array.isArray(e)) {
          if (e.length > 1) {
            for (let t = 1; t <= 40; t++)
              if (
                (function (e, t) {
                  let r = 0;
                  return (
                    e.forEach(function (e) {
                      let n = c(e.mode, t);
                      r += n + e.getBitsLength();
                    }),
                    r
                  );
                })(e, t) <= r.getCapacity(t, o, a.MIXED)
              )
                return t;
            return;
          }
          if (0 === e.length) return 1;
          n = e[0];
        } else n = e;
        return (function (e, t, n) {
          for (let o = 1; o <= 40; o++) if (t <= r.getCapacity(o, n, e)) return o;
        })(n.mode, n.getLength(), o);
      }),
      (r.getEncodedBits = function (e) {
        if (!s.isValid(e) || e < 7) throw Error('Invalid QR Code version');
        let t = e << 12;
        for (; n.getBCHDigit(t) - l >= 0; ) t ^= 7973 << (n.getBCHDigit(t) - l);
        return (e << 12) | t;
      }));
  },
  57655,
  (e, t, r) => {
    let n = e.r(87201),
      o = n.getBCHDigit(1335);
    r.getEncodedBits = function (e, t) {
      let r = (e.bit << 3) | t,
        i = r << 10;
      for (; n.getBCHDigit(i) - o >= 0; ) i ^= 1335 << (n.getBCHDigit(i) - o);
      return ((r << 10) | i) ^ 21522;
    };
  },
  94097,
  (e, t, r) => {
    let n = e.r(50882);
    function o(e) {
      ((this.mode = n.NUMERIC), (this.data = e.toString()));
    }
    ((o.getBitsLength = function (e) {
      return 10 * Math.floor(e / 3) + (e % 3 ? (e % 3) * 3 + 1 : 0);
    }),
      (o.prototype.getLength = function () {
        return this.data.length;
      }),
      (o.prototype.getBitsLength = function () {
        return o.getBitsLength(this.data.length);
      }),
      (o.prototype.write = function (e) {
        let t, r;
        for (t = 0; t + 3 <= this.data.length; t += 3)
          ((r = parseInt(this.data.substr(t, 3), 10)), e.put(r, 10));
        let n = this.data.length - t;
        n > 0 && ((r = parseInt(this.data.substr(t), 10)), e.put(r, 3 * n + 1));
      }),
      (t.exports = o));
  },
  12553,
  (e, t, r) => {
    let n = e.r(50882),
      o = [
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z',
        ' ',
        '$',
        '%',
        '*',
        '+',
        '-',
        '.',
        '/',
        ':',
      ];
    function i(e) {
      ((this.mode = n.ALPHANUMERIC), (this.data = e));
    }
    ((i.getBitsLength = function (e) {
      return 11 * Math.floor(e / 2) + (e % 2) * 6;
    }),
      (i.prototype.getLength = function () {
        return this.data.length;
      }),
      (i.prototype.getBitsLength = function () {
        return i.getBitsLength(this.data.length);
      }),
      (i.prototype.write = function (e) {
        let t;
        for (t = 0; t + 2 <= this.data.length; t += 2) {
          let r = 45 * o.indexOf(this.data[t]);
          ((r += o.indexOf(this.data[t + 1])), e.put(r, 11));
        }
        this.data.length % 2 && e.put(o.indexOf(this.data[t]), 6);
      }),
      (t.exports = i));
  },
  82257,
  (e, t, r) => {
    let n = e.r(50882);
    function o(e) {
      ((this.mode = n.BYTE),
        'string' == typeof e
          ? (this.data = new TextEncoder().encode(e))
          : (this.data = new Uint8Array(e)));
    }
    ((o.getBitsLength = function (e) {
      return 8 * e;
    }),
      (o.prototype.getLength = function () {
        return this.data.length;
      }),
      (o.prototype.getBitsLength = function () {
        return o.getBitsLength(this.data.length);
      }),
      (o.prototype.write = function (e) {
        for (let t = 0, r = this.data.length; t < r; t++) e.put(this.data[t], 8);
      }),
      (t.exports = o));
  },
  22644,
  (e, t, r) => {
    let n = e.r(50882),
      o = e.r(87201);
    function i(e) {
      ((this.mode = n.KANJI), (this.data = e));
    }
    ((i.getBitsLength = function (e) {
      return 13 * e;
    }),
      (i.prototype.getLength = function () {
        return this.data.length;
      }),
      (i.prototype.getBitsLength = function () {
        return i.getBitsLength(this.data.length);
      }),
      (i.prototype.write = function (e) {
        let t;
        for (t = 0; t < this.data.length; t++) {
          let r = o.toSJIS(this.data[t]);
          if (r >= 33088 && r <= 40956) r -= 33088;
          else if (r >= 57408 && r <= 60351) r -= 49472;
          else
            throw Error(
              'Invalid SJIS character: ' + this.data[t] + '\nMake sure your charset is UTF-8'
            );
          ((r = ((r >>> 8) & 255) * 192 + (255 & r)), e.put(r, 13));
        }
      }),
      (t.exports = i));
  },
  45953,
  (e, t, r) => {
    'use strict';
    var n = {
      single_source_shortest_paths: function (e, t, r) {
        var o,
          i,
          a,
          s,
          l,
          c,
          u,
          d = {},
          h = {};
        h[t] = 0;
        var f = n.PriorityQueue.make();
        for (f.push(t, 0); !f.empty(); )
          for (a in ((i = (o = f.pop()).value), (s = o.cost), (l = e[i] || {})))
            l.hasOwnProperty(a) &&
              ((c = s + l[a]),
              (u = h[a]),
              (void 0 === h[a] || u > c) && ((h[a] = c), f.push(a, c), (d[a] = i)));
        if (void 0 !== r && void 0 === h[r])
          throw Error('Could not find a path from ' + t + ' to ' + r + '.');
        return d;
      },
      extract_shortest_path_from_predecessor_list: function (e, t) {
        for (var r = [], n = t; n; ) (r.push(n), e[n], (n = e[n]));
        return (r.reverse(), r);
      },
      find_path: function (e, t, r) {
        var o = n.single_source_shortest_paths(e, t, r);
        return n.extract_shortest_path_from_predecessor_list(o, r);
      },
      PriorityQueue: {
        make: function (e) {
          var t,
            r = n.PriorityQueue,
            o = {};
          for (t in ((e = e || {}), r)) r.hasOwnProperty(t) && (o[t] = r[t]);
          return ((o.queue = []), (o.sorter = e.sorter || r.default_sorter), o);
        },
        default_sorter: function (e, t) {
          return e.cost - t.cost;
        },
        push: function (e, t) {
          (this.queue.push({ value: e, cost: t }), this.queue.sort(this.sorter));
        },
        pop: function () {
          return this.queue.shift();
        },
        empty: function () {
          return 0 === this.queue.length;
        },
      },
    };
    t.exports = n;
  },
  97930,
  (e, t, r) => {
    let n = e.r(50882),
      o = e.r(94097),
      i = e.r(12553),
      a = e.r(82257),
      s = e.r(22644),
      l = e.r(96592),
      c = e.r(87201),
      u = e.r(45953);
    function d(e) {
      return unescape(encodeURIComponent(e)).length;
    }
    function h(e, t, r) {
      let n,
        o = [];
      for (; null !== (n = e.exec(r)); )
        o.push({ data: n[0], index: n.index, mode: t, length: n[0].length });
      return o;
    }
    function f(e) {
      let t,
        r,
        o = h(l.NUMERIC, n.NUMERIC, e),
        i = h(l.ALPHANUMERIC, n.ALPHANUMERIC, e);
      return (
        c.isKanjiModeEnabled()
          ? ((t = h(l.BYTE, n.BYTE, e)), (r = h(l.KANJI, n.KANJI, e)))
          : ((t = h(l.BYTE_KANJI, n.BYTE, e)), (r = [])),
        o
          .concat(i, t, r)
          .sort(function (e, t) {
            return e.index - t.index;
          })
          .map(function (e) {
            return { data: e.data, mode: e.mode, length: e.length };
          })
      );
    }
    function g(e, t) {
      switch (t) {
        case n.NUMERIC:
          return o.getBitsLength(e);
        case n.ALPHANUMERIC:
          return i.getBitsLength(e);
        case n.KANJI:
          return s.getBitsLength(e);
        case n.BYTE:
          return a.getBitsLength(e);
      }
    }
    function m(e, t) {
      let r,
        l = n.getBestModeForData(e);
      if ((r = n.from(t, l)) !== n.BYTE && r.bit < l.bit)
        throw Error(
          '"' +
            e +
            '" cannot be encoded with mode ' +
            n.toString(r) +
            '.\n Suggested mode is: ' +
            n.toString(l)
        );
      switch ((r === n.KANJI && !c.isKanjiModeEnabled() && (r = n.BYTE), r)) {
        case n.NUMERIC:
          return new o(e);
        case n.ALPHANUMERIC:
          return new i(e);
        case n.KANJI:
          return new s(e);
        case n.BYTE:
          return new a(e);
      }
    }
    ((r.fromArray = function (e) {
      return e.reduce(function (e, t) {
        return ('string' == typeof t ? e.push(m(t, null)) : t.data && e.push(m(t.data, t.mode)), e);
      }, []);
    }),
      (r.fromString = function (e, t) {
        let o = (function (e, t) {
            let r = {},
              o = { start: {} },
              i = ['start'];
            for (let a = 0; a < e.length; a++) {
              let s = e[a],
                l = [];
              for (let e = 0; e < s.length; e++) {
                let c = s[e],
                  u = '' + a + e;
                (l.push(u), (r[u] = { node: c, lastCount: 0 }), (o[u] = {}));
                for (let e = 0; e < i.length; e++) {
                  let a = i[e];
                  r[a] && r[a].node.mode === c.mode
                    ? ((o[a][u] = g(r[a].lastCount + c.length, c.mode) - g(r[a].lastCount, c.mode)),
                      (r[a].lastCount += c.length))
                    : (r[a] && (r[a].lastCount = c.length),
                      (o[a][u] = g(c.length, c.mode) + 4 + n.getCharCountIndicator(c.mode, t)));
                }
              }
              i = l;
            }
            for (let e = 0; e < i.length; e++) o[i[e]].end = 0;
            return { map: o, table: r };
          })(
            (function (e) {
              let t = [];
              for (let r = 0; r < e.length; r++) {
                let o = e[r];
                switch (o.mode) {
                  case n.NUMERIC:
                    t.push([
                      o,
                      { data: o.data, mode: n.ALPHANUMERIC, length: o.length },
                      { data: o.data, mode: n.BYTE, length: o.length },
                    ]);
                    break;
                  case n.ALPHANUMERIC:
                    t.push([o, { data: o.data, mode: n.BYTE, length: o.length }]);
                    break;
                  case n.KANJI:
                    t.push([o, { data: o.data, mode: n.BYTE, length: d(o.data) }]);
                    break;
                  case n.BYTE:
                    t.push([{ data: o.data, mode: n.BYTE, length: d(o.data) }]);
                }
              }
              return t;
            })(f(e, c.isKanjiModeEnabled())),
            t
          ),
          i = u.find_path(o.map, 'start', 'end'),
          a = [];
        for (let e = 1; e < i.length - 1; e++) a.push(o.table[i[e]].node);
        return r.fromArray(
          a.reduce(function (e, t) {
            let r = e.length - 1 >= 0 ? e[e.length - 1] : null;
            return (r && r.mode === t.mode ? (e[e.length - 1].data += t.data) : e.push(t), e);
          }, [])
        );
      }),
      (r.rawSplit = function (e) {
        return r.fromArray(f(e, c.isKanjiModeEnabled()));
      }));
  },
  30671,
  (e, t, r) => {
    let n = e.r(87201),
      o = e.r(73133),
      i = e.r(73666),
      a = e.r(11421),
      s = e.r(20637),
      l = e.r(14002),
      c = e.r(37692),
      u = e.r(48125),
      d = e.r(62458),
      h = e.r(93547),
      f = e.r(57655),
      g = e.r(50882),
      m = e.r(97930);
    function p(e, t, r) {
      let n,
        o,
        i = e.size,
        a = f.getEncodedBits(t, r);
      for (n = 0; n < 15; n++)
        ((o = ((a >> n) & 1) == 1),
          n < 6 ? e.set(n, 8, o, !0) : n < 8 ? e.set(n + 1, 8, o, !0) : e.set(i - 15 + n, 8, o, !0),
          n < 8
            ? e.set(8, i - n - 1, o, !0)
            : n < 9
              ? e.set(8, 15 - n - 1 + 1, o, !0)
              : e.set(8, 15 - n - 1, o, !0));
      e.set(i - 8, 8, 1, !0);
    }
    r.create = function (e, t) {
      let r, f;
      if (void 0 === e || '' === e) throw Error('No input text');
      let x = o.M;
      return (
        void 0 !== t &&
          ((x = o.from(t.errorCorrectionLevel, o.M)),
          (r = h.from(t.version)),
          (f = c.from(t.maskPattern)),
          t.toSJISFunc && n.setToSJISFunction(t.toSJISFunc)),
        (function (e, t, r, o) {
          let f;
          if (Array.isArray(e)) f = m.fromArray(e);
          else if ('string' == typeof e) {
            let n = t;
            if (!n) {
              let t = m.rawSplit(e);
              n = h.getBestVersionForData(t, r);
            }
            f = m.fromString(e, n || 40);
          } else throw Error('Invalid data');
          let x = h.getBestVersionForData(f, r);
          if (!x) throw Error('The amount of data is too big to be stored in a QR Code');
          if (t) {
            if (t < x)
              throw Error(
                '\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: ' +
                  x +
                  '.\n'
              );
          } else t = x;
          let b = (function (e, t, r) {
              let o = new i();
              r.forEach(function (t) {
                (o.put(t.mode.bit, 4),
                  o.put(t.getLength(), g.getCharCountIndicator(t.mode, e)),
                  t.write(o));
              });
              let a = (n.getSymbolTotalCodewords(e) - u.getTotalCodewordsCount(e, t)) * 8;
              for (o.getLengthInBits() + 4 <= a && o.put(0, 4); o.getLengthInBits() % 8 != 0; )
                o.putBit(0);
              let s = (a - o.getLengthInBits()) / 8;
              for (let e = 0; e < s; e++) o.put(e % 2 ? 17 : 236, 8);
              return (function (e, t, r) {
                let o,
                  i,
                  a = n.getSymbolTotalCodewords(t),
                  s = a - u.getTotalCodewordsCount(t, r),
                  l = u.getBlocksCount(t, r),
                  c = a % l,
                  h = l - c,
                  f = Math.floor(a / l),
                  g = Math.floor(s / l),
                  m = g + 1,
                  p = f - g,
                  x = new d(p),
                  b = 0,
                  y = Array(l),
                  w = Array(l),
                  N = 0,
                  v = new Uint8Array(e.buffer);
                for (let e = 0; e < l; e++) {
                  let t = e < h ? g : m;
                  ((y[e] = v.slice(b, b + t)),
                    (w[e] = x.encode(y[e])),
                    (b += t),
                    (N = Math.max(N, t)));
                }
                let E = new Uint8Array(a),
                  A = 0;
                for (o = 0; o < N; o++)
                  for (i = 0; i < l; i++) o < y[i].length && (E[A++] = y[i][o]);
                for (o = 0; o < p; o++) for (i = 0; i < l; i++) E[A++] = w[i][o];
                return E;
              })(o, e, t);
            })(t, r, f),
            y = new a(n.getSymbolSize(t));
          !(function (e, t) {
            let r = e.size,
              n = l.getPositions(t);
            for (let t = 0; t < n.length; t++) {
              let o = n[t][0],
                i = n[t][1];
              for (let t = -1; t <= 7; t++)
                if (!(o + t <= -1) && !(r <= o + t))
                  for (let n = -1; n <= 7; n++)
                    i + n <= -1 ||
                      r <= i + n ||
                      ((t >= 0 && t <= 6 && (0 === n || 6 === n)) ||
                      (n >= 0 && n <= 6 && (0 === t || 6 === t)) ||
                      (t >= 2 && t <= 4 && n >= 2 && n <= 4)
                        ? e.set(o + t, i + n, !0, !0)
                        : e.set(o + t, i + n, !1, !0));
            }
          })(y, t);
          let w = y.size;
          for (let e = 8; e < w - 8; e++) {
            let t = e % 2 == 0;
            (y.set(e, 6, t, !0), y.set(6, e, t, !0));
          }
          return (
            !(function (e, t) {
              let r = s.getPositions(t);
              for (let t = 0; t < r.length; t++) {
                let n = r[t][0],
                  o = r[t][1];
                for (let t = -2; t <= 2; t++)
                  for (let r = -2; r <= 2; r++)
                    -2 === t || 2 === t || -2 === r || 2 === r || (0 === t && 0 === r)
                      ? e.set(n + t, o + r, !0, !0)
                      : e.set(n + t, o + r, !1, !0);
              }
            })(y, t),
            p(y, r, 0),
            t >= 7 &&
              (function (e, t) {
                let r,
                  n,
                  o,
                  i = e.size,
                  a = h.getEncodedBits(t);
                for (let t = 0; t < 18; t++)
                  ((r = Math.floor(t / 3)),
                    (n = (t % 3) + i - 8 - 3),
                    (o = ((a >> t) & 1) == 1),
                    e.set(r, n, o, !0),
                    e.set(n, r, o, !0));
              })(y, t),
            !(function (e, t) {
              let r = e.size,
                n = -1,
                o = r - 1,
                i = 7,
                a = 0;
              for (let s = r - 1; s > 0; s -= 2)
                for (6 === s && s--; ; ) {
                  for (let r = 0; r < 2; r++)
                    if (!e.isReserved(o, s - r)) {
                      let n = !1;
                      (a < t.length && (n = ((t[a] >>> i) & 1) == 1),
                        e.set(o, s - r, n),
                        -1 == --i && (a++, (i = 7)));
                    }
                  if ((o += n) < 0 || r <= o) {
                    ((o -= n), (n = -n));
                    break;
                  }
                }
            })(y, b),
            isNaN(o) && (o = c.getBestMask(y, p.bind(null, y, r))),
            c.applyMask(o, y),
            p(y, r, o),
            { modules: y, version: t, errorCorrectionLevel: r, maskPattern: o, segments: f }
          );
        })(e, r, x, f)
      );
    };
  },
  25950,
  (e, t, r) => {
    function n(e) {
      if (('number' == typeof e && (e = e.toString()), 'string' != typeof e))
        throw Error('Color should be defined as hex string');
      let t = e.slice().replace('#', '').split('');
      if (t.length < 3 || 5 === t.length || t.length > 8) throw Error('Invalid hex color: ' + e);
      ((3 === t.length || 4 === t.length) &&
        (t = Array.prototype.concat.apply(
          [],
          t.map(function (e) {
            return [e, e];
          })
        )),
        6 === t.length && t.push('F', 'F'));
      let r = parseInt(t.join(''), 16);
      return {
        r: (r >> 24) & 255,
        g: (r >> 16) & 255,
        b: (r >> 8) & 255,
        a: 255 & r,
        hex: '#' + t.slice(0, 6).join(''),
      };
    }
    ((r.getOptions = function (e) {
      (e || (e = {}), e.color || (e.color = {}));
      let t = void 0 === e.margin || null === e.margin || e.margin < 0 ? 4 : e.margin,
        r = e.width && e.width >= 21 ? e.width : void 0,
        o = e.scale || 4;
      return {
        width: r,
        scale: r ? 4 : o,
        margin: t,
        color: { dark: n(e.color.dark || '#000000ff'), light: n(e.color.light || '#ffffffff') },
        type: e.type,
        rendererOpts: e.rendererOpts || {},
      };
    }),
      (r.getScale = function (e, t) {
        return t.width && t.width >= e + 2 * t.margin ? t.width / (e + 2 * t.margin) : t.scale;
      }),
      (r.getImageWidth = function (e, t) {
        let n = r.getScale(e, t);
        return Math.floor((e + 2 * t.margin) * n);
      }),
      (r.qrToImageData = function (e, t, n) {
        let o = t.modules.size,
          i = t.modules.data,
          a = r.getScale(o, n),
          s = Math.floor((o + 2 * n.margin) * a),
          l = n.margin * a,
          c = [n.color.light, n.color.dark];
        for (let t = 0; t < s; t++)
          for (let r = 0; r < s; r++) {
            let u = (t * s + r) * 4,
              d = n.color.light;
            (t >= l &&
              r >= l &&
              t < s - l &&
              r < s - l &&
              (d = c[+!!i[Math.floor((t - l) / a) * o + Math.floor((r - l) / a)]]),
              (e[u++] = d.r),
              (e[u++] = d.g),
              (e[u++] = d.b),
              (e[u] = d.a));
          }
      }));
  },
  63037,
  (e, t, r) => {
    let n = e.r(25950);
    ((r.render = function (e, t, r) {
      var o;
      let i = r,
        a = t;
      (void 0 !== i || (t && t.getContext) || ((i = t), (t = void 0)),
        t ||
          (a = (function () {
            try {
              return document.createElement('canvas');
            } catch (e) {
              throw Error('You need to specify a canvas element');
            }
          })()),
        (i = n.getOptions(i)));
      let s = n.getImageWidth(e.modules.size, i),
        l = a.getContext('2d'),
        c = l.createImageData(s, s);
      return (
        n.qrToImageData(c.data, e, i),
        (o = a),
        l.clearRect(0, 0, o.width, o.height),
        o.style || (o.style = {}),
        (o.height = s),
        (o.width = s),
        (o.style.height = s + 'px'),
        (o.style.width = s + 'px'),
        l.putImageData(c, 0, 0),
        a
      );
    }),
      (r.renderToDataURL = function (e, t, n) {
        let o = n;
        (void 0 !== o || (t && t.getContext) || ((o = t), (t = void 0)), o || (o = {}));
        let i = r.render(e, t, o),
          a = o.type || 'image/png',
          s = o.rendererOpts || {};
        return i.toDataURL(a, s.quality);
      }));
  },
  10891,
  (e, t, r) => {
    let n = e.r(25950);
    function o(e, t) {
      let r = e.a / 255,
        n = t + '="' + e.hex + '"';
      return r < 1 ? n + ' ' + t + '-opacity="' + r.toFixed(2).slice(1) + '"' : n;
    }
    function i(e, t, r) {
      let n = e + t;
      return (void 0 !== r && (n += ' ' + r), n);
    }
    r.render = function (e, t, r) {
      let a = n.getOptions(t),
        s = e.modules.size,
        l = e.modules.data,
        c = s + 2 * a.margin,
        u = a.color.light.a
          ? '<path ' + o(a.color.light, 'fill') + ' d="M0 0h' + c + 'v' + c + 'H0z"/>'
          : '',
        d =
          '<path ' +
          o(a.color.dark, 'stroke') +
          ' d="' +
          (function (e, t, r) {
            let n = '',
              o = 0,
              a = !1,
              s = 0;
            for (let l = 0; l < e.length; l++) {
              let c = Math.floor(l % t),
                u = Math.floor(l / t);
              (c || a || (a = !0),
                e[l]
                  ? (s++,
                    (l > 0 && c > 0 && e[l - 1]) ||
                      ((n += a ? i('M', c + r, 0.5 + u + r) : i('m', o, 0)), (o = 0), (a = !1)),
                    (c + 1 < t && e[l + 1]) || ((n += i('h', s)), (s = 0)))
                  : o++);
            }
            return n;
          })(l, s, a.margin) +
          '"/>',
        h =
          '<svg xmlns="http://www.w3.org/2000/svg" ' +
          (a.width ? 'width="' + a.width + '" height="' + a.width + '" ' : '') +
          ('viewBox="0 0 ' + c + ' ') +
          c +
          '" shape-rendering="crispEdges">' +
          u +
          d +
          '</svg>\n';
      return ('function' == typeof r && r(null, h), h);
    };
  },
  73134,
  (e, t, r) => {
    let n = e.r(38750),
      o = e.r(30671),
      i = e.r(63037),
      a = e.r(10891);
    function s(e, t, r, i, a) {
      let s = [].slice.call(arguments, 1),
        l = s.length,
        c = 'function' == typeof s[l - 1];
      if (!c && !n()) throw Error('Callback required as last argument');
      if (c) {
        if (l < 2) throw Error('Too few arguments provided');
        2 === l
          ? ((a = r), (r = t), (t = i = void 0))
          : 3 === l &&
            (t.getContext && void 0 === a
              ? ((a = i), (i = void 0))
              : ((a = i), (i = r), (r = t), (t = void 0)));
      } else {
        if (l < 1) throw Error('Too few arguments provided');
        return (
          1 === l
            ? ((r = t), (t = i = void 0))
            : 2 !== l || t.getContext || ((i = r), (r = t), (t = void 0)),
          new Promise(function (n, a) {
            try {
              let a = o.create(r, i);
              n(e(a, t, i));
            } catch (e) {
              a(e);
            }
          })
        );
      }
      try {
        let n = o.create(r, i);
        a(null, e(n, t, i));
      } catch (e) {
        a(e);
      }
    }
    ((r.create = o.create),
      (r.toCanvas = s.bind(null, i.render)),
      (r.toDataURL = s.bind(null, i.renderToDataURL)),
      (r.toString = s.bind(null, function (e, t, r) {
        return a.render(e, r);
      })));
  },
  42215,
  (e) => {
    'use strict';
    var t = e.i(43476),
      r = e.i(71645),
      n = e.i(57688),
      o = e.i(73134),
      i = e.i(80090);
    let a = (e) =>
      new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(e);
    function s() {
      let [e, s] = (0, r.useState)(''),
        [l, c] = (0, r.useState)(null),
        [u, d] = (0, r.useState)(null),
        [h, f] = (0, r.useState)(null),
        [g, m] = (0, r.useState)(null),
        [p, x] = (0, r.useState)(null),
        [b, y] = (0, r.useState)(!1),
        [w, N] = (0, r.useState)(!1),
        [v, E] = (0, r.useState)(null),
        [A, C] = (0, r.useState)(null);
      ((0, r.useEffect)(() => {
        (s(new URLSearchParams(window.location.search).get('token') ?? ''), N(!0));
      }, []),
        (0, r.useEffect)(() => {
          e &&
            (m(null),
            x(null),
            (async () => {
              try {
                let t = await i.corePublicApi.lookupCivilServant(e);
                (c(t.recipient), f(t.recipient.availableVoucherDenominations[0] ?? null), m(null));
              } catch (e) {
                (console.error('Civil servant lookup failed', e),
                  c(null),
                  m(e instanceof Error && e.message ? e.message : 'Civil servant not found.'));
              }
            })());
        }, [e]),
        (0, r.useEffect)(() => {
          if (!e) return;
          let t = window.location.origin,
            r = `${t}/g?token=${encodeURIComponent(e)}`;
          o.default
            .toDataURL(r, { width: 160, margin: 1 })
            .then((e) => d(e))
            .catch(() => d(null));
        }, [e]));
      let I = l?.availableVoucherDenominations ?? [],
        j = null !== h && l?.availableVoucherDenominations.includes(h),
        P = [l?.occupation, l?.primarySite]
          .map((e) => ('string' == typeof e ? e.trim() : ''))
          .filter(Boolean)
          .join(' · '),
        B = {
          voucherAmount: h ?? 0,
          ozowFeeAmount: 1.5,
          platformFeeAmount: 1,
          totalCharge: Number(((h ?? 0) + 1.5 + 1).toFixed(2)),
        },
        T = async (e) => {
          try {
            let t = await i.corePublicApi.getPaymentIntent(e);
            (E(t), C(t.status));
          } catch {}
        };
      return ((0, r.useEffect)(() => {
        let e = v?.paymentIntentId;
        if (!e) return;
        let t = setInterval(async () => {
          (await T(e),
            ['paid', 'completed', 'successful'].includes((A ?? '').toLowerCase()) &&
              clearInterval(t));
        }, 5e3);
        return (T(e), () => clearInterval(t));
      }, [v?.paymentIntentId, A]),
      w)
        ? e
          ? g
            ? (0, t.jsx)('main', {
                className: 'flex min-h-screen items-center justify-center bg-slate-950/5 px-4',
                children: (0, t.jsx)('p', {
                  className: 'rounded-3xl border border-rose-200 bg-white px-6 py-4 text-rose-600',
                  children: g,
                }),
              })
            : l
              ? (0, t.jsx)('main', {
                  className:
                    'min-h-screen bg-[radial-gradient(circle_at_top,_#fff3e8,_#fde6bd_45%,_#fff8ef_100%)] px-4 pb-12 pt-10 sm:px-6',
                  children: (0, t.jsxs)('div', {
                    className: 'mx-auto max-w-5xl space-y-6',
                    children: [
                      (0, t.jsxs)('header', {
                        className:
                          'flex flex-col gap-4 rounded-[2rem] border border-orange-200/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(234,88,12,0.10)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-7',
                        children: [
                          (0, t.jsxs)('div', {
                            children: [
                              (0, t.jsx)('p', {
                                className: 'text-xs uppercase tracking-[0.35em] text-amber-600',
                                children: 'Civil Servant',
                              }),
                              (0, t.jsx)('h1', {
                                className: 'text-3xl font-semibold text-slate-900 sm:text-4xl',
                                children: l.displayName,
                              }),
                              P &&
                                (0, t.jsx)('p', {
                                  className: 'mt-1 text-xs text-slate-500',
                                  children: P,
                                }),
                              (0, t.jsx)('p', {
                                className: 'mt-2 text-sm text-slate-600',
                                children:
                                  [l.department, l.station].filter(Boolean).join(' · ') ||
                                  'Recipient ready to receive a voucher tip',
                              }),
                            ],
                          }),
                          u &&
                            (0, t.jsxs)('div', {
                              className:
                                'flex flex-col items-center gap-1 rounded-3xl border border-orange-100 bg-orange-50/90 p-3',
                              children: [
                                (0, t.jsx)(n.default, {
                                  src: u,
                                  alt: `${l.displayName} QR`,
                                  width: 112,
                                  height: 112,
                                  className:
                                    'h-28 w-28 rounded-xl border border-orange-100 object-contain',
                                }),
                                (0, t.jsx)('p', {
                                  className: 'text-xs text-amber-700',
                                  children: 'Share this recipient link',
                                }),
                              ],
                            }),
                        ],
                      }),
                      (0, t.jsxs)('section', {
                        className: 'grid gap-6 lg:grid-cols-[1.1fr_0.9fr]',
                        children: [
                          (0, t.jsxs)('div', {
                            className:
                              'space-y-8 rounded-[2rem] border border-orange-100 bg-white/95 p-5 shadow-[0_20px_60px_rgba(245,158,11,0.12)] sm:p-8',
                            children: [
                              (0, t.jsx)('header', {
                                className: 'space-y-2',
                                children: (0, t.jsx)('h2', {
                                  className: 'text-2xl font-semibold text-slate-900',
                                  children: 'Choose a voucher',
                                }),
                              }),
                              (0, t.jsxs)('div', {
                                className: 'space-y-4',
                                children: [
                                  (0, t.jsxs)('div', {
                                    className: 'space-y-2',
                                    children: [
                                      (0, t.jsx)('p', {
                                        className:
                                          'text-xs font-semibold uppercase tracking-wide text-amber-600',
                                        children: 'Voucher type',
                                      }),
                                      (0, t.jsxs)('button', {
                                        type: 'button',
                                        disabled: !0,
                                        className:
                                          'inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700',
                                        children: [
                                          (0, t.jsx)(n.default, {
                                            src: '/pashasha-checkers-logo.png',
                                            alt: 'Shoprite Checkers',
                                            width: 18,
                                            height: 18,
                                            className:
                                              'h-[18px] w-[18px] rounded-full object-contain',
                                          }),
                                          (0, t.jsx)('span', { children: 'Shoprite Checkers' }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, t.jsxs)('div', {
                                    className:
                                      'rounded-3xl border border-orange-100 bg-orange-50 p-4',
                                    children: [
                                      (0, t.jsx)('p', {
                                        className:
                                          'text-xs uppercase tracking-[0.3em] text-amber-700',
                                        children: 'How It Works',
                                      }),
                                      (0, t.jsxs)('ol', {
                                        className: 'mt-3 space-y-3 text-sm text-slate-700',
                                        children: [
                                          (0, t.jsx)('li', {
                                            children:
                                              '1. Choose a Shoprite Checkers voucher denomination.',
                                          }),
                                          (0, t.jsx)('li', {
                                            children: '2. Pay securely through OZOW.',
                                          }),
                                          (0, t.jsx)('li', {
                                            children:
                                              '3. After payment confirmation, a Shoprite Checkers voucher is allocated and sent by SMS.',
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  (0, t.jsxs)('div', {
                                    className: 'space-y-3',
                                    children: [
                                      (0, t.jsx)('p', {
                                        className:
                                          'text-xs font-semibold uppercase tracking-wide text-amber-600',
                                        children: 'Voucher denominations',
                                      }),
                                      (0, t.jsx)('div', {
                                        className: 'grid grid-cols-2 gap-3 sm:grid-cols-3',
                                        children: I.map((e) => {
                                          let r = h === e;
                                          return (0, t.jsx)(
                                            'button',
                                            {
                                              type: 'button',
                                              onClick: () => f(e),
                                              className: `rounded-3xl border px-4 py-4 text-lg font-semibold transition ${r ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200' : 'border-orange-100 bg-orange-50 text-slate-900 hover:border-orange-300 hover:bg-orange-100'}`,
                                              children: new Intl.NumberFormat('en-ZA', {
                                                style: 'currency',
                                                currency: 'ZAR',
                                                maximumFractionDigits: 0,
                                              }).format(e),
                                            },
                                            e
                                          );
                                        }),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, t.jsx)('button', {
                                type: 'button',
                                disabled: !j || b,
                                onClick: () => {
                                  if (!l || !j || null === h) return;
                                  let e = window.open('', '_blank');
                                  (async () => {
                                    (y(!0), x(null), C(null), E(null));
                                    try {
                                      let t = await i.corePublicApi.createPaymentIntent({
                                        civilServantId: l.civilServantId,
                                        voucherDenomination: h,
                                        paymentEngine: 'ozow',
                                      });
                                      (E(t),
                                        C(t.status),
                                        t.redirectUrl
                                          ? e
                                            ? (e.location.href = t.redirectUrl)
                                            : (window.location.href = t.redirectUrl)
                                          : e && e.close());
                                    } catch (t) {
                                      (e && e.close(),
                                        console.error('payment initiation failed', t),
                                        x(
                                          (t instanceof Error
                                            ? t.message
                                            : 'string' == typeof t
                                              ? t
                                              : 'Payment could not be started. Please try again.') ||
                                            'Payment could not be started. Please try again.'
                                        ));
                                    } finally {
                                      y(!1);
                                    }
                                  })();
                                },
                                className:
                                  'w-full rounded-3xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-300/50 transition hover:from-orange-500 hover:to-amber-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500',
                                children: b
                                  ? 'Starting payment...'
                                  : j
                                    ? 'Pay now'
                                    : 'Select a voucher amount',
                              }),
                              j &&
                                (0, t.jsxs)('div', {
                                  className: 'rounded-3xl border border-slate-200 bg-slate-50 p-4',
                                  children: [
                                    (0, t.jsx)('p', {
                                      className:
                                        'text-xs font-semibold uppercase tracking-wide text-slate-500',
                                      children: 'Payment summary',
                                    }),
                                    (0, t.jsxs)('div', {
                                      className: 'mt-3 space-y-2 text-sm text-slate-700',
                                      children: [
                                        (0, t.jsxs)('div', {
                                          className: 'flex items-center justify-between gap-4',
                                          children: [
                                            (0, t.jsx)('span', { children: 'Voucher amount' }),
                                            (0, t.jsx)('span', {
                                              className: 'font-semibold text-slate-900',
                                              children: a(B.voucherAmount),
                                            }),
                                          ],
                                        }),
                                        (0, t.jsxs)('div', {
                                          className: 'flex items-center justify-between gap-4',
                                          children: [
                                            (0, t.jsx)('span', { children: 'OZOW fee' }),
                                            (0, t.jsx)('span', {
                                              className: 'font-semibold text-slate-900',
                                              children: a(B.ozowFeeAmount),
                                            }),
                                          ],
                                        }),
                                        (0, t.jsxs)('div', {
                                          className: 'flex items-center justify-between gap-4',
                                          children: [
                                            (0, t.jsx)('span', { children: 'Pashasha fee' }),
                                            (0, t.jsx)('span', {
                                              className: 'font-semibold text-slate-900',
                                              children: a(B.platformFeeAmount),
                                            }),
                                          ],
                                        }),
                                        (0, t.jsxs)('div', {
                                          className:
                                            'flex items-center justify-between gap-4 border-t border-slate-200 pt-2',
                                          children: [
                                            (0, t.jsx)('span', {
                                              className: 'font-semibold text-slate-900',
                                              children: 'Total charge',
                                            }),
                                            (0, t.jsx)('span', {
                                              className: 'font-semibold text-slate-900',
                                              children: a(B.totalCharge),
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              (0, t.jsx)('p', {
                                className: 'text-xs text-slate-700',
                                children:
                                  p ??
                                  'Payment opens in a new tab. This page will keep polling the transaction status.',
                              }),
                            ],
                          }),
                          (0, t.jsxs)('aside', {
                            className:
                              'space-y-5 rounded-[2rem] border border-orange-100 bg-white/95 p-5 shadow-[0_20px_60px_rgba(245,158,11,0.12)] sm:p-8',
                            children: [
                              (0, t.jsxs)('div', {
                                className: `rounded-3xl border p-4 ${((e) => {
                                  switch ((e ?? '').toLowerCase()) {
                                    case 'completed':
                                    case 'successful':
                                    case 'paid':
                                      return 'border-emerald-200 bg-emerald-50 text-emerald-900';
                                    case 'failed':
                                    case 'cancelled':
                                      return 'border-rose-200 bg-rose-50 text-rose-900';
                                    default:
                                      return 'border-rose-200 bg-rose-50 text-rose-700';
                                  }
                                })(A)}`,
                                children: [
                                  (0, t.jsx)('p', {
                                    className: 'text-xs uppercase tracking-[0.3em]',
                                    children: 'Payment Status',
                                  }),
                                  (0, t.jsx)('p', {
                                    className: 'mt-2 text-2xl font-semibold capitalize',
                                    children: A?.replace(/-/g, ' ') ?? 'Awaiting payment',
                                  }),
                                  v?.paymentIntentId &&
                                    (0, t.jsxs)('p', {
                                      className: 'mt-2 text-xs',
                                      children: [
                                        'Ref ',
                                        v.paymentIntentId,
                                        ' ',
                                        (0, t.jsx)('button', {
                                          className: 'underline',
                                          type: 'button',
                                          onClick: () => void T(v.paymentIntentId),
                                          children: 'refresh now',
                                        }),
                                      ],
                                    }),
                                ],
                              }),
                              v?.paymentIntentId &&
                                (0, t.jsxs)('div', {
                                  className:
                                    'rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700',
                                  children: [
                                    (0, t.jsx)('p', {
                                      className: 'font-semibold text-slate-900',
                                      children: 'Fulfilment',
                                    }),
                                    (0, t.jsxs)('p', {
                                      className: 'mt-2',
                                      children: [
                                        'Voucher allocation:',
                                        ' ',
                                        (0, t.jsx)('span', {
                                          className: 'font-semibold capitalize',
                                          children: v.voucherAllocation?.status ?? 'pending',
                                        }),
                                      ],
                                    }),
                                    (0, t.jsxs)('p', {
                                      className: 'mt-1',
                                      children: [
                                        'SMS delivery:',
                                        ' ',
                                        (0, t.jsx)('span', {
                                          className: 'font-semibold capitalize',
                                          children:
                                            v.voucherAllocation?.deliveryStatus ?? 'pending',
                                        }),
                                      ],
                                    }),
                                    v.redirectUrl &&
                                      (0, t.jsx)('a', {
                                        className: 'mt-3 inline-block text-orange-700 underline',
                                        href: v.redirectUrl,
                                        target: '_blank',
                                        rel: 'noreferrer',
                                        children: 'Open payment page again',
                                      }),
                                  ],
                                }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                })
              : (0, t.jsx)('main', {
                  className: 'flex min-h-screen items-center justify-center bg-slate-950/5 px-4',
                  children: (0, t.jsx)('p', {
                    className:
                      'rounded-3xl border border-slate-200 bg-white px-6 py-4 text-slate-600',
                    children: 'Loading civil servant profile…',
                  }),
                })
          : (0, t.jsx)('main', {
              className: 'flex min-h-screen items-center justify-center bg-slate-950/5 px-4',
              children: (0, t.jsx)('p', {
                className: 'rounded-3xl border border-rose-200 bg-white px-6 py-4 text-rose-600',
                children: 'Missing civil servant QR token.',
              }),
            })
        : (0, t.jsx)('main', {
            className: 'flex min-h-screen items-center justify-center bg-slate-950/5 px-4',
            children: (0, t.jsx)('p', {
              className: 'rounded-3xl border border-slate-200 bg-white px-6 py-4 text-slate-600',
              children: 'Loading recipient…',
            }),
          });
    }
    e.s(['default', () => s, 'dynamic', 0, 'force-static', 'dynamicParams', 0, !0]);
  },
]);
