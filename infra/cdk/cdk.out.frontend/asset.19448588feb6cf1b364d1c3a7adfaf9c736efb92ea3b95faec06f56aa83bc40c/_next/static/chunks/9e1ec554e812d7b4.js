(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  33525,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'warnOnce', {
        enumerable: !0,
        get: function () {
          return n;
        },
      }));
    let n = (e) => {};
  },
  18581,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'useMergedRef', {
        enumerable: !0,
        get: function () {
          return s;
        },
      }));
    let n = e.r(71645);
    function s(e, t) {
      let r = (0, n.useRef)(null),
        s = (0, n.useRef)(null);
      return (0, n.useCallback)(
        (n) => {
          if (null === n) {
            let e = r.current;
            e && ((r.current = null), e());
            let t = s.current;
            t && ((s.current = null), t());
          } else (e && (r.current = o(e, n)), t && (s.current = o(t, n)));
        },
        [e, t]
      );
    }
    function o(e, t) {
      if ('function' != typeof e)
        return (
          (e.current = t),
          () => {
            e.current = null;
          }
        );
      {
        let r = e(t);
        return 'function' == typeof r ? r : () => e(null);
      }
    }
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  18566,
  (e, t, r) => {
    t.exports = e.r(76562);
  },
  66746,
  (e) => {
    'use strict';
    let t = (e) => e.trim().toLowerCase(),
      r = (e, ...r) => {
        let n = (e ?? []).map(t),
          s = r.map(t);
        return n.some((e) => s.includes(e));
      };
    e.s([
      'isAdminGroup',
      0,
      (e) => r(e, 'administrators', 'admin'),
      'isCivilServantGroup',
      0,
      (e) => r(e, 'civilservants', 'civilservant'),
      'isCustomerGroup',
      0,
      (e) => r(e, 'customers', 'customer'),
    ]);
  },
  98183,
  (e, t, r) => {
    'use strict';
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = {
      assign: function () {
        return l;
      },
      searchParamsToUrlQuery: function () {
        return o;
      },
      urlQueryToSearchParams: function () {
        return a;
      },
    };
    for (var s in n) Object.defineProperty(r, s, { enumerable: !0, get: n[s] });
    function o(e) {
      let t = {};
      for (let [r, n] of e.entries()) {
        let e = t[r];
        void 0 === e ? (t[r] = n) : Array.isArray(e) ? e.push(n) : (t[r] = [e, n]);
      }
      return t;
    }
    function i(e) {
      return 'string' == typeof e
        ? e
        : ('number' != typeof e || isNaN(e)) && 'boolean' != typeof e
          ? ''
          : String(e);
    }
    function a(e) {
      let t = new URLSearchParams();
      for (let [r, n] of Object.entries(e))
        if (Array.isArray(n)) for (let e of n) t.append(r, i(e));
        else t.set(r, i(n));
      return t;
    }
    function l(e, ...t) {
      for (let r of t) {
        for (let t of r.keys()) e.delete(t);
        for (let [t, n] of r.entries()) e.append(t, n);
      }
      return e;
    }
  },
  95057,
  (e, t, r) => {
    'use strict';
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = {
      formatUrl: function () {
        return a;
      },
      formatWithValidation: function () {
        return u;
      },
      urlObjectKeys: function () {
        return l;
      },
    };
    for (var s in n) Object.defineProperty(r, s, { enumerable: !0, get: n[s] });
    let o = e.r(90809)._(e.r(98183)),
      i = /https?|ftp|gopher|file/;
    function a(e) {
      let { auth: t, hostname: r } = e,
        n = e.protocol || '',
        s = e.pathname || '',
        a = e.hash || '',
        l = e.query || '',
        u = !1;
      ((t = t ? encodeURIComponent(t).replace(/%3A/i, ':') + '@' : ''),
        e.host
          ? (u = t + e.host)
          : r && ((u = t + (~r.indexOf(':') ? `[${r}]` : r)), e.port && (u += ':' + e.port)),
        l && 'object' == typeof l && (l = String(o.urlQueryToSearchParams(l))));
      let c = e.search || (l && `?${l}`) || '';
      return (
        n && !n.endsWith(':') && (n += ':'),
        e.slashes || ((!n || i.test(n)) && !1 !== u)
          ? ((u = '//' + (u || '')), s && '/' !== s[0] && (s = '/' + s))
          : u || (u = ''),
        a && '#' !== a[0] && (a = '#' + a),
        c && '?' !== c[0] && (c = '?' + c),
        (s = s.replace(/[?#]/g, encodeURIComponent)),
        (c = c.replace('#', '%23')),
        `${n}${u}${s}${c}${a}`
      );
    }
    let l = [
      'auth',
      'hash',
      'host',
      'hostname',
      'href',
      'path',
      'pathname',
      'port',
      'protocol',
      'query',
      'search',
      'slashes',
    ];
    function u(e) {
      return a(e);
    }
  },
  18967,
  (e, t, r) => {
    'use strict';
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = {
      DecodeError: function () {
        return b;
      },
      MiddlewareNotFoundError: function () {
        return w;
      },
      MissingStaticPage: function () {
        return v;
      },
      NormalizeError: function () {
        return x;
      },
      PageNotFoundError: function () {
        return y;
      },
      SP: function () {
        return h;
      },
      ST: function () {
        return g;
      },
      WEB_VITALS: function () {
        return o;
      },
      execOnce: function () {
        return i;
      },
      getDisplayName: function () {
        return d;
      },
      getLocationOrigin: function () {
        return u;
      },
      getURL: function () {
        return c;
      },
      isAbsoluteUrl: function () {
        return l;
      },
      isResSent: function () {
        return f;
      },
      loadGetInitialProps: function () {
        return m;
      },
      normalizeRepeatedSlashes: function () {
        return p;
      },
      stringifyError: function () {
        return j;
      },
    };
    for (var s in n) Object.defineProperty(r, s, { enumerable: !0, get: n[s] });
    let o = ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'];
    function i(e) {
      let t,
        r = !1;
      return (...n) => (r || ((r = !0), (t = e(...n))), t);
    }
    let a = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/,
      l = (e) => a.test(e);
    function u() {
      let { protocol: e, hostname: t, port: r } = window.location;
      return `${e}//${t}${r ? ':' + r : ''}`;
    }
    function c() {
      let { href: e } = window.location,
        t = u();
      return e.substring(t.length);
    }
    function d(e) {
      return 'string' == typeof e ? e : e.displayName || e.name || 'Unknown';
    }
    function f(e) {
      return e.finished || e.headersSent;
    }
    function p(e) {
      let t = e.split('?');
      return (
        t[0].replace(/\\/g, '/').replace(/\/\/+/g, '/') + (t[1] ? `?${t.slice(1).join('?')}` : '')
      );
    }
    async function m(e, t) {
      let r = t.res || (t.ctx && t.ctx.res);
      if (!e.getInitialProps)
        return t.ctx && t.Component ? { pageProps: await m(t.Component, t.ctx) } : {};
      let n = await e.getInitialProps(t);
      if (r && f(r)) return n;
      if (!n)
        throw Object.defineProperty(
          Error(
            `"${d(e)}.getInitialProps()" should resolve to an object. But found "${n}" instead.`
          ),
          '__NEXT_ERROR_CODE',
          { value: 'E394', enumerable: !1, configurable: !0 }
        );
      return n;
    }
    let h = 'undefined' != typeof performance,
      g =
        h &&
        ['mark', 'measure', 'getEntriesByName'].every((e) => 'function' == typeof performance[e]);
    class b extends Error {}
    class x extends Error {}
    class y extends Error {
      constructor(e) {
        (super(),
          (this.code = 'ENOENT'),
          (this.name = 'PageNotFoundError'),
          (this.message = `Cannot find module for page: ${e}`));
      }
    }
    class v extends Error {
      constructor(e, t) {
        (super(), (this.message = `Failed to load static file for page: ${e} ${t}`));
      }
    }
    class w extends Error {
      constructor() {
        (super(), (this.code = 'ENOENT'), (this.message = 'Cannot find the middleware module'));
      }
    }
    function j(e) {
      return JSON.stringify({ message: e.message, stack: e.stack });
    }
  },
  73668,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'isLocalURL', {
        enumerable: !0,
        get: function () {
          return o;
        },
      }));
    let n = e.r(18967),
      s = e.r(52817);
    function o(e) {
      if (!(0, n.isAbsoluteUrl)(e)) return !0;
      try {
        let t = (0, n.getLocationOrigin)(),
          r = new URL(e, t);
        return r.origin === t && (0, s.hasBasePath)(r.pathname);
      } catch (e) {
        return !1;
      }
    }
  },
  84508,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'errorOnce', {
        enumerable: !0,
        get: function () {
          return n;
        },
      }));
    let n = (e) => {};
  },
  22016,
  (e, t, r) => {
    'use strict';
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = {
      default: function () {
        return b;
      },
      useLinkStatus: function () {
        return y;
      },
    };
    for (var s in n) Object.defineProperty(r, s, { enumerable: !0, get: n[s] });
    let o = e.r(90809),
      i = e.r(43476),
      a = o._(e.r(71645)),
      l = e.r(95057),
      u = e.r(8372),
      c = e.r(18581),
      d = e.r(18967),
      f = e.r(5550);
    e.r(33525);
    let p = e.r(91949),
      m = e.r(73668),
      h = e.r(9396);
    function g(e) {
      return 'string' == typeof e ? e : (0, l.formatUrl)(e);
    }
    function b(t) {
      var r;
      let n,
        s,
        o,
        [l, b] = (0, a.useOptimistic)(p.IDLE_LINK_STATUS),
        y = (0, a.useRef)(null),
        {
          href: v,
          as: w,
          children: j,
          prefetch: S = null,
          passHref: _,
          replace: P,
          shallow: N,
          scroll: E,
          onClick: C,
          onMouseEnter: O,
          onTouchStart: k,
          legacyBehavior: R = !1,
          onNavigate: T,
          ref: $,
          unstable_dynamicOnHover: A,
          ...I
        } = t;
      ((n = j),
        R &&
          ('string' == typeof n || 'number' == typeof n) &&
          (n = (0, i.jsx)('a', { children: n })));
      let M = a.default.useContext(u.AppRouterContext),
        L = !1 !== S,
        z =
          !1 !== S
            ? null === (r = S) || 'auto' === r
              ? h.FetchStrategy.PPR
              : h.FetchStrategy.Full
            : h.FetchStrategy.PPR,
        { href: U, as: D } = a.default.useMemo(() => {
          let e = g(v);
          return { href: e, as: w ? g(w) : e };
        }, [v, w]);
      if (R) {
        if (n?.$$typeof === Symbol.for('react.lazy'))
          throw Object.defineProperty(
            Error(
              "`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."
            ),
            '__NEXT_ERROR_CODE',
            { value: 'E863', enumerable: !1, configurable: !0 }
          );
        s = a.default.Children.only(n);
      }
      let F = R ? s && 'object' == typeof s && s.ref : $,
        B = a.default.useCallback(
          (e) => (
            null !== M && (y.current = (0, p.mountLinkInstance)(e, U, M, z, L, b)),
            () => {
              (y.current && ((0, p.unmountLinkForCurrentNavigation)(y.current), (y.current = null)),
                (0, p.unmountPrefetchableInstance)(e));
            }
          ),
          [L, U, M, z, b]
        ),
        G = {
          ref: (0, c.useMergedRef)(B, F),
          onClick(t) {
            (R || 'function' != typeof C || C(t),
              R && s.props && 'function' == typeof s.props.onClick && s.props.onClick(t),
              !M ||
                t.defaultPrevented ||
                (function (t, r, n, s, o, i, l) {
                  if ('undefined' != typeof window) {
                    let u,
                      { nodeName: c } = t.currentTarget;
                    if (
                      ('A' === c.toUpperCase() &&
                        (((u = t.currentTarget.getAttribute('target')) && '_self' !== u) ||
                          t.metaKey ||
                          t.ctrlKey ||
                          t.shiftKey ||
                          t.altKey ||
                          (t.nativeEvent && 2 === t.nativeEvent.which))) ||
                      t.currentTarget.hasAttribute('download')
                    )
                      return;
                    if (!(0, m.isLocalURL)(r)) {
                      o && (t.preventDefault(), location.replace(r));
                      return;
                    }
                    if ((t.preventDefault(), l)) {
                      let e = !1;
                      if (
                        (l({
                          preventDefault: () => {
                            e = !0;
                          },
                        }),
                        e)
                      )
                        return;
                    }
                    let { dispatchNavigateAction: d } = e.r(99781);
                    a.default.startTransition(() => {
                      d(n || r, o ? 'replace' : 'push', i ?? !0, s.current);
                    });
                  }
                })(t, U, D, y, P, E, T));
          },
          onMouseEnter(e) {
            (R || 'function' != typeof O || O(e),
              R && s.props && 'function' == typeof s.props.onMouseEnter && s.props.onMouseEnter(e),
              M && L && (0, p.onNavigationIntent)(e.currentTarget, !0 === A));
          },
          onTouchStart: function (e) {
            (R || 'function' != typeof k || k(e),
              R && s.props && 'function' == typeof s.props.onTouchStart && s.props.onTouchStart(e),
              M && L && (0, p.onNavigationIntent)(e.currentTarget, !0 === A));
          },
        };
      return (
        (0, d.isAbsoluteUrl)(D)
          ? (G.href = D)
          : (R && !_ && ('a' !== s.type || 'href' in s.props)) || (G.href = (0, f.addBasePath)(D)),
        (o = R ? a.default.cloneElement(s, G) : (0, i.jsx)('a', { ...I, ...G, children: n })),
        (0, i.jsx)(x.Provider, { value: l, children: o })
      );
    }
    e.r(84508);
    let x = (0, a.createContext)(p.IDLE_LINK_STATUS),
      y = () => (0, a.useContext)(x);
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  88143,
  (e, t, r) => {
    'use strict';
    function n({
      widthInt: e,
      heightInt: t,
      blurWidth: r,
      blurHeight: n,
      blurDataURL: s,
      objectFit: o,
    }) {
      let i = r ? 40 * r : e,
        a = n ? 40 * n : t,
        l = i && a ? `viewBox='0 0 ${i} ${a}'` : '';
      return `%3Csvg xmlns='http://www.w3.org/2000/svg' ${l}%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='${l ? 'none' : 'contain' === o ? 'xMidYMid' : 'cover' === o ? 'xMidYMid slice' : 'none'}' style='filter: url(%23b);' href='${s}'/%3E%3C/svg%3E`;
    }
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'getImageBlurSvg', {
        enumerable: !0,
        get: function () {
          return n;
        },
      }));
  },
  87690,
  (e, t, r) => {
    'use strict';
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = {
      VALID_LOADERS: function () {
        return o;
      },
      imageConfigDefault: function () {
        return i;
      },
    };
    for (var s in n) Object.defineProperty(r, s, { enumerable: !0, get: n[s] });
    let o = ['default', 'imgix', 'cloudinary', 'akamai', 'custom'],
      i = {
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [32, 48, 64, 96, 128, 256, 384],
        path: '/_next/image',
        loader: 'default',
        loaderFile: '',
        domains: [],
        disableStaticImages: !1,
        minimumCacheTTL: 14400,
        formats: ['image/webp'],
        maximumRedirects: 3,
        dangerouslyAllowLocalIP: !1,
        dangerouslyAllowSVG: !1,
        contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
        contentDispositionType: 'attachment',
        localPatterns: void 0,
        remotePatterns: [],
        qualities: [75],
        unoptimized: !1,
      };
  },
  8927,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'getImgProps', {
        enumerable: !0,
        get: function () {
          return u;
        },
      }),
      e.r(33525));
    let n = e.r(43369),
      s = e.r(88143),
      o = e.r(87690),
      i = ['-moz-initial', 'fill', 'none', 'scale-down', void 0];
    function a(e) {
      return void 0 !== e.default;
    }
    function l(e) {
      return void 0 === e
        ? e
        : 'number' == typeof e
          ? Number.isFinite(e)
            ? e
            : NaN
          : 'string' == typeof e && /^[0-9]+$/.test(e)
            ? parseInt(e, 10)
            : NaN;
    }
    function u(
      {
        src: e,
        sizes: t,
        unoptimized: r = !1,
        priority: u = !1,
        preload: c = !1,
        loading: d,
        className: f,
        quality: p,
        width: m,
        height: h,
        fill: g = !1,
        style: b,
        overrideSrc: x,
        onLoad: y,
        onLoadingComplete: v,
        placeholder: w = 'empty',
        blurDataURL: j,
        fetchPriority: S,
        decoding: _ = 'async',
        layout: P,
        objectFit: N,
        objectPosition: E,
        lazyBoundary: C,
        lazyRoot: O,
        ...k
      },
      R
    ) {
      var T;
      let $,
        A,
        I,
        { imgConf: M, showAltText: L, blurComplete: z, defaultLoader: U } = R,
        D = M || o.imageConfigDefault;
      if ('allSizes' in D) $ = D;
      else {
        let e = [...D.deviceSizes, ...D.imageSizes].sort((e, t) => e - t),
          t = D.deviceSizes.sort((e, t) => e - t),
          r = D.qualities?.sort((e, t) => e - t);
        $ = { ...D, allSizes: e, deviceSizes: t, qualities: r };
      }
      if (void 0 === U)
        throw Object.defineProperty(
          Error(
            'images.loaderFile detected but the file is missing default export.\nRead more: https://nextjs.org/docs/messages/invalid-images-config'
          ),
          '__NEXT_ERROR_CODE',
          { value: 'E163', enumerable: !1, configurable: !0 }
        );
      let F = k.loader || U;
      (delete k.loader, delete k.srcSet);
      let B = '__next_img_default' in F;
      if (B) {
        if ('custom' === $.loader)
          throw Object.defineProperty(
            Error(`Image with src "${e}" is missing "loader" prop.
Read more: https://nextjs.org/docs/messages/next-image-missing-loader`),
            '__NEXT_ERROR_CODE',
            { value: 'E252', enumerable: !1, configurable: !0 }
          );
      } else {
        let e = F;
        F = (t) => {
          let { config: r, ...n } = t;
          return e(n);
        };
      }
      if (P) {
        'fill' === P && (g = !0);
        let e = {
          intrinsic: { maxWidth: '100%', height: 'auto' },
          responsive: { width: '100%', height: 'auto' },
        }[P];
        e && (b = { ...b, ...e });
        let r = { responsive: '100vw', fill: '100vw' }[P];
        r && !t && (t = r);
      }
      let G = '',
        W = l(m),
        q = l(h);
      if ((T = e) && 'object' == typeof T && (a(T) || void 0 !== T.src)) {
        let t = a(e) ? e.default : e;
        if (!t.src)
          throw Object.defineProperty(
            Error(
              `An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ${JSON.stringify(t)}`
            ),
            '__NEXT_ERROR_CODE',
            { value: 'E460', enumerable: !1, configurable: !0 }
          );
        if (!t.height || !t.width)
          throw Object.defineProperty(
            Error(
              `An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ${JSON.stringify(t)}`
            ),
            '__NEXT_ERROR_CODE',
            { value: 'E48', enumerable: !1, configurable: !0 }
          );
        if (((A = t.blurWidth), (I = t.blurHeight), (j = j || t.blurDataURL), (G = t.src), !g))
          if (W || q) {
            if (W && !q) {
              let e = W / t.width;
              q = Math.round(t.height * e);
            } else if (!W && q) {
              let e = q / t.height;
              W = Math.round(t.width * e);
            }
          } else ((W = t.width), (q = t.height));
      }
      let J = !u && !c && ('lazy' === d || void 0 === d);
      ((!(e = 'string' == typeof e ? e : G) || e.startsWith('data:') || e.startsWith('blob:')) &&
        ((r = !0), (J = !1)),
        $.unoptimized && (r = !0),
        B && !$.dangerouslyAllowSVG && e.split('?', 1)[0].endsWith('.svg') && (r = !0));
      let K = l(p),
        X = Object.assign(
          g
            ? {
                position: 'absolute',
                height: '100%',
                width: '100%',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                objectFit: N,
                objectPosition: E,
              }
            : {},
          L ? {} : { color: 'transparent' },
          b
        ),
        V =
          z || 'empty' === w
            ? null
            : 'blur' === w
              ? `url("data:image/svg+xml;charset=utf-8,${(0, s.getImageBlurSvg)({ widthInt: W, heightInt: q, blurWidth: A, blurHeight: I, blurDataURL: j || '', objectFit: X.objectFit })}")`
              : `url("${w}")`,
        H = i.includes(X.objectFit)
          ? 'fill' === X.objectFit
            ? '100% 100%'
            : 'cover'
          : X.objectFit,
        Q = V
          ? {
              backgroundSize: H,
              backgroundPosition: X.objectPosition || '50% 50%',
              backgroundRepeat: 'no-repeat',
              backgroundImage: V,
            }
          : {},
        Y = (function ({
          config: e,
          src: t,
          unoptimized: r,
          width: s,
          quality: o,
          sizes: i,
          loader: a,
        }) {
          if (r) {
            let e = (0, n.getDeploymentId)();
            if (t.startsWith('/') && !t.startsWith('//') && e) {
              let r = t.includes('?') ? '&' : '?';
              t = `${t}${r}dpl=${e}`;
            }
            return { src: t, srcSet: void 0, sizes: void 0 };
          }
          let { widths: l, kind: u } = (function ({ deviceSizes: e, allSizes: t }, r, n) {
              if (n) {
                let r = /(^|\s)(1?\d?\d)vw/g,
                  s = [];
                for (let e; (e = r.exec(n)); ) s.push(parseInt(e[2]));
                if (s.length) {
                  let r = 0.01 * Math.min(...s);
                  return { widths: t.filter((t) => t >= e[0] * r), kind: 'w' };
                }
                return { widths: t, kind: 'w' };
              }
              return 'number' != typeof r
                ? { widths: e, kind: 'w' }
                : {
                    widths: [
                      ...new Set([r, 2 * r].map((e) => t.find((t) => t >= e) || t[t.length - 1])),
                    ],
                    kind: 'x',
                  };
            })(e, s, i),
            c = l.length - 1;
          return {
            sizes: i || 'w' !== u ? i : '100vw',
            srcSet: l
              .map(
                (r, n) =>
                  `${a({ config: e, src: t, quality: o, width: r })} ${'w' === u ? r : n + 1}${u}`
              )
              .join(', '),
            src: a({ config: e, src: t, quality: o, width: l[c] }),
          };
        })({ config: $, src: e, unoptimized: r, width: W, quality: K, sizes: t, loader: F }),
        Z = J ? 'lazy' : d;
      return {
        props: {
          ...k,
          loading: Z,
          fetchPriority: S,
          width: W,
          height: q,
          decoding: _,
          className: f,
          style: { ...X, ...Q },
          sizes: Y.sizes,
          srcSet: Y.srcSet,
          src: x || Y.src,
        },
        meta: { unoptimized: r, preload: c || u, placeholder: w, fill: g },
      };
    }
  },
  98879,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'default', {
        enumerable: !0,
        get: function () {
          return a;
        },
      }));
    let n = e.r(71645),
      s = 'undefined' == typeof window,
      o = s ? () => {} : n.useLayoutEffect,
      i = s ? () => {} : n.useEffect;
    function a(e) {
      let { headManager: t, reduceComponentsToState: r } = e;
      function a() {
        if (t && t.mountedInstances) {
          let e = n.Children.toArray(Array.from(t.mountedInstances).filter(Boolean));
          t.updateHead(r(e));
        }
      }
      return (
        s && (t?.mountedInstances?.add(e.children), a()),
        o(
          () => (
            t?.mountedInstances?.add(e.children),
            () => {
              t?.mountedInstances?.delete(e.children);
            }
          )
        ),
        o(
          () => (
            t && (t._pendingUpdate = a),
            () => {
              t && (t._pendingUpdate = a);
            }
          )
        ),
        i(
          () => (
            t && t._pendingUpdate && (t._pendingUpdate(), (t._pendingUpdate = null)),
            () => {
              t && t._pendingUpdate && (t._pendingUpdate(), (t._pendingUpdate = null));
            }
          )
        ),
        null
      );
    }
  },
  25633,
  (e, t, r) => {
    'use strict';
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = {
      default: function () {
        return h;
      },
      defaultHead: function () {
        return d;
      },
    };
    for (var s in n) Object.defineProperty(r, s, { enumerable: !0, get: n[s] });
    let o = e.r(55682),
      i = e.r(90809),
      a = e.r(43476),
      l = i._(e.r(71645)),
      u = o._(e.r(98879)),
      c = e.r(26027);
    function d() {
      return [
        (0, a.jsx)('meta', { charSet: 'utf-8' }, 'charset'),
        (0, a.jsx)('meta', { name: 'viewport', content: 'width=device-width' }, 'viewport'),
      ];
    }
    function f(e, t) {
      return 'string' == typeof t || 'number' == typeof t
        ? e
        : t.type === l.default.Fragment
          ? e.concat(
              l.default.Children.toArray(t.props.children).reduce(
                (e, t) => ('string' == typeof t || 'number' == typeof t ? e : e.concat(t)),
                []
              )
            )
          : e.concat(t);
    }
    e.r(33525);
    let p = ['name', 'httpEquiv', 'charSet', 'itemProp'];
    function m(e) {
      let t, r, n, s;
      return e
        .reduce(f, [])
        .reverse()
        .concat(d().reverse())
        .filter(
          ((t = new Set()),
          (r = new Set()),
          (n = new Set()),
          (s = {}),
          (e) => {
            let o = !0,
              i = !1;
            if (e.key && 'number' != typeof e.key && e.key.indexOf('$') > 0) {
              i = !0;
              let r = e.key.slice(e.key.indexOf('$') + 1);
              t.has(r) ? (o = !1) : t.add(r);
            }
            switch (e.type) {
              case 'title':
              case 'base':
                r.has(e.type) ? (o = !1) : r.add(e.type);
                break;
              case 'meta':
                for (let t = 0, r = p.length; t < r; t++) {
                  let r = p[t];
                  if (e.props.hasOwnProperty(r))
                    if ('charSet' === r) n.has(r) ? (o = !1) : n.add(r);
                    else {
                      let t = e.props[r],
                        n = s[r] || new Set();
                      ('name' !== r || !i) && n.has(t) ? (o = !1) : (n.add(t), (s[r] = n));
                    }
                }
            }
            return o;
          })
        )
        .reverse()
        .map((e, t) => {
          let r = e.key || t;
          return l.default.cloneElement(e, { key: r });
        });
    }
    let h = function ({ children: e }) {
      let t = (0, l.useContext)(c.HeadManagerContext);
      return (0, a.jsx)(u.default, { reduceComponentsToState: m, headManager: t, children: e });
    };
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  18556,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'ImageConfigContext', {
        enumerable: !0,
        get: function () {
          return o;
        },
      }));
    let n = e.r(55682)._(e.r(71645)),
      s = e.r(87690),
      o = n.default.createContext(s.imageConfigDefault);
  },
  65856,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'RouterContext', {
        enumerable: !0,
        get: function () {
          return n;
        },
      }));
    let n = e.r(55682)._(e.r(71645)).default.createContext(null);
  },
  70965,
  (e, t, r) => {
    'use strict';
    function n(e, t) {
      let r = e || 75;
      return t?.qualities?.length
        ? t.qualities.reduce((e, t) => (Math.abs(t - r) < Math.abs(e - r) ? t : e), 0)
        : r;
    }
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'findClosestQuality', {
        enumerable: !0,
        get: function () {
          return n;
        },
      }));
  },
  1948,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'default', {
        enumerable: !0,
        get: function () {
          return i;
        },
      }));
    let n = e.r(70965),
      s = e.r(43369);
    function o({ config: e, src: t, width: r, quality: o }) {
      if (
        t.startsWith('/') &&
        t.includes('?') &&
        e.localPatterns?.length === 1 &&
        '**' === e.localPatterns[0].pathname &&
        '' === e.localPatterns[0].search
      )
        throw Object.defineProperty(
          Error(`Image with src "${t}" is using a query string which is not configured in images.localPatterns.
Read more: https://nextjs.org/docs/messages/next-image-unconfigured-localpatterns`),
          '__NEXT_ERROR_CODE',
          { value: 'E871', enumerable: !1, configurable: !0 }
        );
      let i = (0, n.findClosestQuality)(o, e),
        a = (0, s.getDeploymentId)();
      return `${e.path}?url=${encodeURIComponent(t)}&w=${r}&q=${i}${t.startsWith('/') && a ? `&dpl=${a}` : ''}`;
    }
    o.__next_img_default = !0;
    let i = o;
  },
  5500,
  (e, t, r) => {
    'use strict';
    (Object.defineProperty(r, '__esModule', { value: !0 }),
      Object.defineProperty(r, 'Image', {
        enumerable: !0,
        get: function () {
          return v;
        },
      }));
    let n = e.r(55682),
      s = e.r(90809),
      o = e.r(43476),
      i = s._(e.r(71645)),
      a = n._(e.r(74080)),
      l = n._(e.r(25633)),
      u = e.r(8927),
      c = e.r(87690),
      d = e.r(18556);
    e.r(33525);
    let f = e.r(65856),
      p = n._(e.r(1948)),
      m = e.r(18581),
      h = {
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [32, 48, 64, 96, 128, 256, 384],
        qualities: [75],
        path: '/_next/image',
        loader: 'default',
        dangerouslyAllowSVG: !1,
        unoptimized: !0,
      };
    function g(e, t, r, n, s, o, i) {
      let a = e?.src;
      e &&
        e['data-loaded-src'] !== a &&
        ((e['data-loaded-src'] = a),
        ('decode' in e ? e.decode() : Promise.resolve())
          .catch(() => {})
          .then(() => {
            if (e.parentElement && e.isConnected) {
              if (('empty' !== t && s(!0), r?.current)) {
                let t = new Event('load');
                Object.defineProperty(t, 'target', { writable: !1, value: e });
                let n = !1,
                  s = !1;
                r.current({
                  ...t,
                  nativeEvent: t,
                  currentTarget: e,
                  target: e,
                  isDefaultPrevented: () => n,
                  isPropagationStopped: () => s,
                  persist: () => {},
                  preventDefault: () => {
                    ((n = !0), t.preventDefault());
                  },
                  stopPropagation: () => {
                    ((s = !0), t.stopPropagation());
                  },
                });
              }
              n?.current && n.current(e);
            }
          }));
    }
    function b(e) {
      return i.use ? { fetchPriority: e } : { fetchpriority: e };
    }
    'undefined' == typeof window && (globalThis.__NEXT_IMAGE_IMPORTED = !0);
    let x = (0, i.forwardRef)(
      (
        {
          src: e,
          srcSet: t,
          sizes: r,
          height: n,
          width: s,
          decoding: a,
          className: l,
          style: u,
          fetchPriority: c,
          placeholder: d,
          loading: f,
          unoptimized: p,
          fill: h,
          onLoadRef: x,
          onLoadingCompleteRef: y,
          setBlurComplete: v,
          setShowAltText: w,
          sizesInput: j,
          onLoad: S,
          onError: _,
          ...P
        },
        N
      ) => {
        let E = (0, i.useCallback)(
            (e) => {
              e && (_ && (e.src = e.src), e.complete && g(e, d, x, y, v, p, j));
            },
            [e, d, x, y, v, _, p, j]
          ),
          C = (0, m.useMergedRef)(N, E);
        return (0, o.jsx)('img', {
          ...P,
          ...b(c),
          loading: f,
          width: s,
          height: n,
          decoding: a,
          'data-nimg': h ? 'fill' : '1',
          className: l,
          style: u,
          sizes: r,
          srcSet: t,
          src: e,
          ref: C,
          onLoad: (e) => {
            g(e.currentTarget, d, x, y, v, p, j);
          },
          onError: (e) => {
            (w(!0), 'empty' !== d && v(!0), _ && _(e));
          },
        });
      }
    );
    function y({ isAppRouter: e, imgAttributes: t }) {
      let r = {
        as: 'image',
        imageSrcSet: t.srcSet,
        imageSizes: t.sizes,
        crossOrigin: t.crossOrigin,
        referrerPolicy: t.referrerPolicy,
        ...b(t.fetchPriority),
      };
      return e && a.default.preload
        ? (a.default.preload(t.src, r), null)
        : (0, o.jsx)(l.default, {
            children: (0, o.jsx)(
              'link',
              { rel: 'preload', href: t.srcSet ? void 0 : t.src, ...r },
              '__nimg-' + t.src + t.srcSet + t.sizes
            ),
          });
    }
    let v = (0, i.forwardRef)((e, t) => {
      let r = (0, i.useContext)(f.RouterContext),
        n = (0, i.useContext)(d.ImageConfigContext),
        s = (0, i.useMemo)(() => {
          let e = h || n || c.imageConfigDefault,
            t = [...e.deviceSizes, ...e.imageSizes].sort((e, t) => e - t),
            r = e.deviceSizes.sort((e, t) => e - t),
            s = e.qualities?.sort((e, t) => e - t);
          return {
            ...e,
            allSizes: t,
            deviceSizes: r,
            qualities: s,
            localPatterns: 'undefined' == typeof window ? n?.localPatterns : e.localPatterns,
          };
        }, [n]),
        { onLoad: a, onLoadingComplete: l } = e,
        m = (0, i.useRef)(a);
      (0, i.useEffect)(() => {
        m.current = a;
      }, [a]);
      let g = (0, i.useRef)(l);
      (0, i.useEffect)(() => {
        g.current = l;
      }, [l]);
      let [b, v] = (0, i.useState)(!1),
        [w, j] = (0, i.useState)(!1),
        { props: S, meta: _ } = (0, u.getImgProps)(e, {
          defaultLoader: p.default,
          imgConf: s,
          blurComplete: b,
          showAltText: w,
        });
      return (0, o.jsxs)(o.Fragment, {
        children: [
          (0, o.jsx)(x, {
            ...S,
            unoptimized: _.unoptimized,
            placeholder: _.placeholder,
            fill: _.fill,
            onLoadRef: m,
            onLoadingCompleteRef: g,
            setBlurComplete: v,
            setShowAltText: j,
            sizesInput: e.sizes,
            ref: t,
          }),
          _.preload ? (0, o.jsx)(y, { isAppRouter: !r, imgAttributes: S }) : null,
        ],
      });
    });
    ('function' == typeof r.default || ('object' == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, '__esModule', { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  94909,
  (e, t, r) => {
    'use strict';
    Object.defineProperty(r, '__esModule', { value: !0 });
    var n = {
      default: function () {
        return c;
      },
      getImageProps: function () {
        return u;
      },
    };
    for (var s in n) Object.defineProperty(r, s, { enumerable: !0, get: n[s] });
    let o = e.r(55682),
      i = e.r(8927),
      a = e.r(5500),
      l = o._(e.r(1948));
    function u(e) {
      let { props: t } = (0, i.getImgProps)(e, {
        defaultLoader: l.default,
        imgConf: {
          deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
          imageSizes: [32, 48, 64, 96, 128, 256, 384],
          qualities: [75],
          path: '/_next/image',
          loader: 'default',
          dangerouslyAllowSVG: !1,
          unoptimized: !0,
        },
      });
      for (let [e, r] of Object.entries(t)) void 0 === r && delete t[e];
      return { props: t };
    }
    let c = a.Image;
  },
  57688,
  (e, t, r) => {
    t.exports = e.r(94909);
  },
  75863,
  (e) => {
    'use strict';
    let t = () => 'https://e59bfkkr5g.execute-api.af-south-1.amazonaws.com';
    e.s([
      'resolveApiRoot',
      0,
      t,
      'resolveAppApiRoot',
      0,
      t,
      'resolveCoreApiRoot',
      0,
      t,
      'resolveVoucherApiRoot',
      0,
      () => 'https://129mgsjpi6.execute-api.af-south-1.amazonaws.com',
    ]);
  },
  14983,
  (e) => {
    'use strict';
    let t = 'pashashapay.auth.session',
      r = 'pp-id-token',
      n = 'pp-groups',
      s = 'pashashapay-auth-changed',
      o = () => {
        window.dispatchEvent(new Event(s));
      };
    e.s([
      'SESSION_STORAGE_KEY',
      0,
      t,
      'clearSession',
      0,
      () => {
        (window.localStorage.removeItem(t),
          (() => {
            if ('undefined' == typeof document) return;
            let e = 'Path=/; SameSite=Lax; Secure; Max-Age=0';
            ((document.cookie = `${r}=; ${e}`), (document.cookie = `${n}=; ${e}`));
          })(),
          o());
      },
      'getSession',
      0,
      () => {
        let e = window.localStorage.getItem(t);
        if (!e) return null;
        try {
          return JSON.parse(e);
        } catch {
          return null;
        }
      },
      'persistSession',
      0,
      (e) => {
        (window.localStorage.setItem(t, JSON.stringify(e)),
          ((e) => {
            if ('undefined' == typeof document) return;
            let t = ((e) => {
                try {
                  let [, t] = e.split('.');
                  if (!t) return null;
                  let r = t.replace(/-/g, '+').replace(/_/g, '/'),
                    n = r.padEnd(4 * Math.ceil(r.length / 4), '=');
                  if ('function' != typeof atob) return null;
                  let s = JSON.parse(atob(n));
                  return 'number' == typeof s?.exp ? s.exp : null;
                } catch {
                  return null;
                }
              })(e.idToken),
              s = t ? Math.max(t - Math.floor(Date.now() / 1e3), 0) : 3600,
              o = `Path=/; SameSite=Lax; Secure; Max-Age=${s}`;
            document.cookie = `${r}=${encodeURIComponent(e.idToken)}; ${o}`;
            let i = (e.groups ?? []).join(',');
            document.cookie = `${n}=${encodeURIComponent(i)}; ${o}`;
          })(e),
          o());
      },
      'sessionEventName',
      0,
      s,
    ]);
  },
  10584,
  (e) => {
    'use strict';
    var t = e.i(47167);
    e.s([
      'eclipseEnabled',
      0,
      () => {
        let e = t.default.env.NEXT_PUBLIC_ENABLE_ECLIPSE;
        return !!e && 'true' === e.toLowerCase();
      },
    ]);
  },
  523,
  (e) => {
    'use strict';
    var t = e.i(14983);
    let r = (0, e.i(75863).resolveApiRoot)(),
      n = async (e, n = {}) => {
        let s = (0, t.getSession)();
        if (!s) throw Error('Not authenticated');
        let o = {
            'Content-Type': 'application/json',
            ...n.headers,
            Authorization: `Bearer ${s.accessToken}`,
          },
          i = await fetch(`${r}${e}`, { ...n, headers: o });
        if (!i.ok)
          throw (
            401 === i.status && ((0, t.clearSession)(), (window.location.href = '/login')),
            Error((await i.text()) || 'Request failed')
          );
        if (204 !== i.status) return await i.json();
      };
    e.s([
      'supportApi',
      0,
      {
        prepare: () => n('/support/prepare'),
        createTicket: (e) => n('/support/tickets', { method: 'POST', body: JSON.stringify(e) }),
        listTickets: (e) => {
          let t = e ? `?status=${encodeURIComponent(e)}` : '';
          return n(`/support/tickets${t}`);
        },
        getTicket: (e) => n(`/support/tickets/${e}`),
        addComment: (e, t) =>
          n(`/support/tickets/${e}/comments`, {
            method: 'POST',
            body: JSON.stringify({ message: t }),
          }),
        listTicketsAdmin: (e, t, r) => {
          let s = new URLSearchParams();
          (e && s.append('status', e),
            t && s.append('supportCode', t),
            r && s.append('familyName', r));
          let o = s.toString() ? `?${s.toString()}` : '';
          return n(`/support/admin/tickets${o}`);
        },
        getTicketAdmin: (e) => n(`/support/admin/tickets/${e}`),
        addCommentAdmin: (e, t) =>
          n(`/support/admin/tickets/${e}/comments`, {
            method: 'POST',
            body: JSON.stringify({ message: t }),
          }),
        updateStatusAdmin: (e, t) =>
          n(`/support/admin/tickets/${e}/status`, {
            method: 'POST',
            body: JSON.stringify({ status: t }),
          }),
        updateStatusUser: (e, t) =>
          n(`/support/tickets/${e}/status`, {
            method: 'POST',
            body: JSON.stringify({ status: t }),
          }),
      },
    ]);
  },
  29034,
  (e) => {
    'use strict';
    var t = e.i(43476),
      r = e.i(71645),
      n = e.i(523),
      s = e.i(10584);
    function o() {
      let e = (0, s.eclipseEnabled)(),
        [o, i] = (0, r.useState)(!1),
        [a, l] = (0, r.useState)(''),
        [u, c] = (0, r.useState)(''),
        [d, f] = (0, r.useState)('Account'),
        [p, m] = (0, r.useState)('idle'),
        [h, g] = (0, r.useState)(null),
        [b, x] = (0, r.useState)(null),
        [y, v] = (0, r.useState)(null),
        w = async () => {
          (m('loading'), g(null));
          try {
            let e = await n.supportApi.prepare();
            (x(e.supportCode), v(e.user ?? null), m('idle'));
          } catch (e) {
            (g(e?.message ?? 'Unable to load support details.'), m('error'));
          }
        },
        j = async () => {
          if (!a.trim()) return void g('Please provide a summary.');
          (m('sending'), g(null));
          try {
            (await n.supportApi.createTicket({
              summary: a.trim(),
              details: u.trim() || void 0,
              issueType: d,
              supportCode: b ?? void 0,
              metadata: y ?? void 0,
            }),
              m('sent'),
              l(''),
              c(''),
              setTimeout(() => {
                S();
              }, 1200));
          } catch (e) {
            (m('error'), g(e?.message ?? 'Unable to submit your support ticket.'));
          }
        },
        S = () => {
          (i(!1), m('idle'), g(null), l(''), c(''));
        };
      return (0, t.jsxs)(t.Fragment, {
        children: [
          (0, t.jsx)('button', {
            type: 'button',
            onClick: () => {
              (i(!0), w());
            },
            className:
              'fixed bottom-4 right-4 z-40 rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-600',
            children: 'Need help?',
          }),
          o &&
            (0, t.jsx)('div', {
              className: 'fixed inset-0 z-50 flex items-end justify-end bg-black/20 p-4',
              children: (0, t.jsxs)('div', {
                className: 'w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl',
                children: [
                  (0, t.jsxs)('div', {
                    className: 'mb-2 flex items-center justify-between',
                    children: [
                      (0, t.jsx)('p', {
                        className: 'text-sm font-semibold text-slate-900',
                        children: 'Support ticket',
                      }),
                      (0, t.jsx)('button', {
                        type: 'button',
                        onClick: S,
                        className:
                          'rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50',
                        children: 'Close',
                      }),
                    ],
                  }),
                  'loading' === p
                    ? (0, t.jsx)('p', {
                        className: 'text-sm text-slate-600',
                        children: 'Preparing your support details…',
                      })
                    : (0, t.jsxs)(t.Fragment, {
                        children: [
                          (0, t.jsxs)('div', {
                            className:
                              'space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700',
                            children: [
                              (0, t.jsxs)('div', {
                                className: 'flex justify-between gap-2',
                                children: [
                                  (0, t.jsx)('span', {
                                    className: 'font-semibold',
                                    children: 'Support Code',
                                  }),
                                  (0, t.jsx)('span', {
                                    className: 'font-mono text-orange-600',
                                    children: b ?? 'Generating…',
                                  }),
                                ],
                              }),
                              y &&
                                (0, t.jsxs)(t.Fragment, {
                                  children: [
                                    (0, t.jsxs)('div', {
                                      className: 'flex justify-between gap-2',
                                      children: [
                                        (0, t.jsx)('span', {
                                          className: 'font-semibold',
                                          children: 'Name',
                                        }),
                                        (0, t.jsx)('span', {
                                          children:
                                            [y.firstName, y.familyName].filter(Boolean).join(' ') ||
                                            y.username ||
                                            'Unknown',
                                        }),
                                      ],
                                    }),
                                    y.email &&
                                      (0, t.jsxs)('div', {
                                        className: 'flex justify-between gap-2',
                                        children: [
                                          (0, t.jsx)('span', {
                                            className: 'font-semibold',
                                            children: 'Email',
                                          }),
                                          (0, t.jsx)('span', { children: y.email }),
                                        ],
                                      }),
                                    y.accountNumber &&
                                      (0, t.jsxs)('div', {
                                        className: 'flex justify-between gap-2',
                                        children: [
                                          (0, t.jsx)('span', {
                                            className: 'font-semibold',
                                            children: 'Account',
                                          }),
                                          (0, t.jsx)('span', {
                                            className: 'font-mono',
                                            children: y.accountNumber,
                                          }),
                                        ],
                                      }),
                                    e &&
                                      y.walletId &&
                                      (0, t.jsxs)('div', {
                                        className: 'flex justify-between gap-2',
                                        children: [
                                          (0, t.jsx)('span', {
                                            className: 'font-semibold',
                                            children: 'Wallet',
                                          }),
                                          (0, t.jsx)('span', {
                                            className: 'font-mono',
                                            children: y.walletId,
                                          }),
                                        ],
                                      }),
                                  ],
                                }),
                            ],
                          }),
                          (0, t.jsxs)('div', {
                            className: 'mt-3 space-y-2',
                            children: [
                              (0, t.jsxs)('label', {
                                className: 'flex flex-col gap-1 text-xs text-slate-700',
                                children: [
                                  (0, t.jsx)('span', {
                                    className: 'font-semibold',
                                    children: 'Issue type',
                                  }),
                                  (0, t.jsxs)('select', {
                                    className:
                                      'rounded-2xl border border-slate-200 px-3 py-2 text-sm',
                                    value: d,
                                    onChange: (e) => f(e.target.value),
                                    children: [
                                      (0, t.jsx)('option', {
                                        value: 'Account',
                                        children: 'Account',
                                      }),
                                      (0, t.jsx)('option', {
                                        value: 'Technical',
                                        children: 'Technical',
                                      }),
                                      (0, t.jsx)('option', {
                                        value: 'Payments',
                                        children: 'Payments',
                                      }),
                                      (0, t.jsx)('option', {
                                        value: 'Withdrawal',
                                        children: 'Withdrawal',
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, t.jsxs)('label', {
                                className: 'flex flex-col gap-1 text-xs text-slate-700',
                                children: [
                                  (0, t.jsx)('span', {
                                    className: 'font-semibold',
                                    children: 'Summary',
                                  }),
                                  (0, t.jsx)('input', {
                                    className:
                                      'rounded-2xl border border-slate-200 px-3 py-2 text-sm',
                                    placeholder: 'Short summary...',
                                    value: a,
                                    onChange: (e) => l(e.target.value),
                                  }),
                                ],
                              }),
                              (0, t.jsxs)('label', {
                                className: 'flex flex-col gap-1 text-xs text-slate-700',
                                children: [
                                  (0, t.jsx)('span', {
                                    className: 'font-semibold',
                                    children: 'Details',
                                  }),
                                  (0, t.jsx)('textarea', {
                                    className:
                                      'rounded-2xl border border-slate-200 px-3 py-2 text-sm',
                                    rows: 3,
                                    placeholder: 'Provide details...',
                                    value: u,
                                    onChange: (e) => c(e.target.value),
                                  }),
                                ],
                              }),
                            ],
                          }),
                          h &&
                            (0, t.jsx)('p', {
                              className: 'mt-1 text-xs text-rose-600',
                              children: h,
                            }),
                          'sent' === p &&
                            (0, t.jsx)('p', {
                              className: 'mt-1 text-xs text-emerald-600',
                              children: 'Ticket logged. We will reach out soon.',
                            }),
                          (0, t.jsxs)('div', {
                            className: 'mt-3 flex justify-between gap-2',
                            children: [
                              (0, t.jsx)('button', {
                                type: 'button',
                                onClick: w,
                                className:
                                  'rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50',
                                children: 'New code',
                              }),
                              (0, t.jsx)('button', {
                                type: 'button',
                                onClick: j,
                                disabled: 'sending' === p,
                                className:
                                  'rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60',
                                children: 'sending' === p ? 'Submitting...' : 'Log ticket',
                              }),
                            ],
                          }),
                        ],
                      }),
                ],
              }),
            }),
        ],
      });
    }
    e.s(['ChatAssistant', () => o]);
  },
  78648,
  (e) => {
    'use strict';
    var t = e.i(43476),
      r = e.i(22016),
      n = e.i(71645),
      s = e.i(57688),
      o = e.i(18566),
      i = e.i(14983),
      a = e.i(66746);
    e.s([
      'Header',
      0,
      () => {
        let e = (0, o.useRouter)(),
          [l, u] = (0, n.useState)(() => (0, i.getSession)()),
          [c, d] = (0, n.useState)(!1),
          [f, p] = (0, n.useState)(!1),
          m = (0, n.useRef)(null),
          h = (0, n.useRef)(null),
          g = (0, a.isCivilServantGroup)(l?.groups),
          b = (0, a.isCustomerGroup)(l?.groups),
          x = (0, a.isAdminGroup)(l?.groups),
          y = l ? (g ? 'Civil Servant Dashboard' : b ? 'Customer Dashboard' : null) : null,
          v = x ? '/admin/audit' : '/audit';
        (0, n.useEffect)(() => {
          let e = (e) => {
              (e.key === i.SESSION_STORAGE_KEY || null === e.key) && u((0, i.getSession)());
            },
            t = () => u((0, i.getSession)());
          (window.addEventListener('storage', e), window.addEventListener(i.sessionEventName, t));
          let r = (e) => {
            let t = e.target;
            (m.current && !m.current.contains(t) && d(!1),
              h.current && !h.current.contains(t) && p(!1));
          };
          return (
            document.addEventListener('mousedown', r),
            () => {
              (window.removeEventListener('storage', e),
                window.removeEventListener(i.sessionEventName, t),
                document.removeEventListener('mousedown', r));
            }
          );
        }, []);
        let w = l
          ? (0, t.jsxs)('div', {
              className: 'relative',
              ref: m,
              children: [
                (0, t.jsx)('button', {
                  type: 'button',
                  onClick: () => d((e) => !e),
                  className:
                    'flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white/70 text-sm font-semibold text-slate-800 hover:bg-white',
                  'aria-label': 'User menu',
                  children: (0, t.jsx)('span', { className: 'text-base', children: '👤' }),
                }),
                c &&
                  (0, t.jsxs)('div', {
                    className:
                      'absolute right-0 mt-3 w-48 rounded-2xl border border-white/15 bg-slate-900/95 text-white shadow-xl backdrop-blur',
                    children: [
                      (0, t.jsx)('button', {
                        type: 'button',
                        className:
                          'block w-full rounded-t-2xl px-4 py-3 text-left text-sm font-semibold hover:bg-white/10',
                        onClick: () => {
                          (d(!1), e.push('/profile'));
                        },
                        children: 'My Profile',
                      }),
                      (0, t.jsx)('button', {
                        type: 'button',
                        className:
                          'block w-full px-4 py-3 text-left text-sm font-semibold hover:bg-white/10',
                        onClick: () => {
                          (d(!1), e.push('/support'));
                        },
                        children: 'Support',
                      }),
                      (0, t.jsx)('button', {
                        type: 'button',
                        className:
                          'block w-full px-4 py-3 text-left text-sm font-semibold hover:bg-white/10',
                        onClick: () => {
                          (d(!1), e.push(v));
                        },
                        children: 'Audit Log',
                      }),
                      (0, t.jsx)('button', {
                        type: 'button',
                        className:
                          'block w-full rounded-b-2xl px-4 py-3 text-left text-sm text-rose-200 hover:bg-white/10',
                        onClick: () => {
                          ((0, i.clearSession)(), u(null), d(!1), e.push('/login'));
                        },
                        children: 'Log Out',
                      }),
                    ],
                  }),
              ],
            })
          : (0, t.jsxs)('div', {
              className: 'flex items-center gap-3',
              children: [
                (0, t.jsxs)('nav', {
                  className: 'hidden items-center gap-3 sm:flex',
                  children: [
                    (0, t.jsx)(r.default, {
                      href: '/login',
                      className:
                        'rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white',
                      children: 'Log in',
                    }),
                    (0, t.jsx)(r.default, {
                      href: '/signup',
                      className:
                        'rounded-full border border-orange-300 bg-orange-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500',
                      children: 'Register',
                    }),
                  ],
                }),
                (0, t.jsxs)('div', {
                  className: 'relative sm:hidden',
                  ref: h,
                  children: [
                    (0, t.jsxs)('button', {
                      type: 'button',
                      onClick: () => p((e) => !e),
                      className:
                        'flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-white',
                      'aria-label': 'Open menu',
                      children: ['Menu', (0, t.jsx)('span', { 'aria-hidden': !0, children: '▾' })],
                    }),
                    f &&
                      (0, t.jsxs)('div', {
                        className:
                          'absolute right-0 mt-3 w-44 rounded-2xl border border-white/20 bg-slate-900/95 text-white shadow-lg backdrop-blur',
                        children: [
                          (0, t.jsx)(r.default, {
                            href: '/login',
                            onClick: () => p(!1),
                            className:
                              'block rounded-t-2xl px-4 py-3 text-left text-sm font-semibold hover:bg-white/10',
                            children: 'Log in',
                          }),
                          (0, t.jsx)(r.default, {
                            href: '/signup',
                            onClick: () => p(!1),
                            className:
                              'block rounded-b-2xl px-4 py-3 text-left text-sm font-semibold text-orange-100 hover:bg-white/10',
                            children: 'Register',
                          }),
                        ],
                      }),
                  ],
                }),
              ],
            });
        return (0, t.jsx)('header', {
          className:
            'sticky top-0 z-20 border-b border-white/15 bg-gradient-to-r from-[#fffaf5] via-[#fff7ef] to-orange-500 text-slate-900 shadow-md backdrop-blur',
          children: (0, t.jsxs)('div', {
            className:
              'mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8',
            children: [
              (0, t.jsxs)(r.default, {
                href: '/',
                className: 'flex items-center gap-4 sm:gap-5',
                children: [
                  (0, t.jsx)('div', {
                    className:
                      'flex h-14 w-14 items-center justify-center rounded-full border border-transparent bg-white/30 p-2 shadow-sm ring-1 ring-white/40',
                    children: (0, t.jsx)(s.default, {
                      src: '/pashasha-pay-logo.png',
                      alt: 'Pashasha Pay',
                      width: 56,
                      height: 56,
                      className: 'h-12 w-12 object-contain',
                      priority: !0,
                    }),
                  }),
                  (0, t.jsxs)('div', {
                    className: 'leading-tight',
                    children: [
                      (0, t.jsx)('p', {
                        className: 'text-xs uppercase tracking-[0.3em] text-white/80',
                        children: 'Pashasha Pay',
                      }),
                      (0, t.jsx)('p', {
                        className: 'text-lg font-semibold tracking-tight',
                        children: 'Tip with confidence',
                      }),
                      y &&
                        (0, t.jsx)('p', {
                          className: 'text-sm font-semibold text-slate-800/90',
                          children: y,
                        }),
                    ],
                  }),
                ],
              }),
              w,
            ],
          }),
        });
      },
    ]);
  },
]);
