(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  15690,
  (e) => {
    'use strict';
    var t = e.i(43476),
      r = e.i(71645),
      s = e.i(14983),
      l = e.i(75863);
    let n =
      /^\/(customers|civil-servants)\/(me|[a-zA-Z0-9-]+)\/kyc\/documents\/(country-id|passport|proof-of-address)$/;
    function a() {
      let [e, a] = (0, r.useState)(null),
        [o, i] = (0, r.useState)(null),
        [c, u] = (0, r.useState)(null),
        [d, m] = (0, r.useState)(null),
        [x, w] = (0, r.useState)(!0),
        [f, h] = (0, r.useState)(null),
        p = (0, r.useRef)(null),
        b = (0, r.useRef)(null),
        g = (0, r.useCallback)(() => {
          b.current && (URL.revokeObjectURL(b.current), (b.current = null), a(null));
        }, []);
      ((0, r.useEffect)(() => {
        let e = () => {
            (g(), m('Session ended. Please log in again to view this document.'));
          },
          t = (t) => {
            t.key !== s.SESSION_STORAGE_KEY || t.newValue || e();
          };
        return (
          window.addEventListener(s.sessionEventName, e),
          window.addEventListener('storage', t),
          () => {
            (window.removeEventListener(s.sessionEventName, e),
              window.removeEventListener('storage', t));
          }
        );
      }, [g]),
        (0, r.useEffect)(() => {
          let e = new AbortController(),
            t = (0, l.resolveApiRoot)();
          return (
            (async () => {
              let r = new URLSearchParams(window.location.search).get('path')?.trim() ?? '';
              if (!r || !n.test(r)) {
                (h(null), m('Invalid document link.'), w(!1));
                return;
              }
              h(r);
              let l = (0, s.getSession)();
              if (!l) {
                (m('Not authenticated.'), w(!1));
                return;
              }
              (w(!0),
                m(null),
                g(),
                p.current && window.clearTimeout(p.current),
                (p.current = window.setTimeout(() => {
                  (m('Document request timed out. Please retry.'), w(!1));
                }, 15e3)));
              let o = await fetch(`${t}${r}`, {
                headers: { Authorization: `Bearer ${l.accessToken}` },
                credentials: 'include',
                signal: e.signal,
              });
              if (!o.ok) throw Error((await o.text()) || `Request failed (${o.status})`);
              let c = await o.blob(),
                d = URL.createObjectURL(c);
              ((b.current = d),
                a(d),
                i(o.headers.get('content-type')),
                u(
                  ((e) => {
                    if (!e) return null;
                    let t = /filename="([^"]+)"/i.exec(e);
                    return t?.[1] ?? null;
                  })(o.headers.get('content-disposition'))
                ),
                w(!1),
                p.current && (window.clearTimeout(p.current), (p.current = null)));
            })().catch((e) => {
              'AbortError' !== e.name && (m(e.message ?? 'Unable to load document.'), w(!1));
            }),
            () => {
              (p.current && (window.clearTimeout(p.current), (p.current = null)), e.abort(), g());
            }
          );
        }, [g]),
        (0, r.useEffect)(() => {
          c && (document.title = c);
        }, [c]));
      let v = o?.startsWith('image/') ?? !1,
        N = 'application/pdf' === o;
      return (0, t.jsxs)('main', {
        className: 'flex min-h-screen flex-col bg-slate-50 text-slate-900',
        children: [
          (0, t.jsx)('header', {
            className: 'border-b border-slate-200 bg-white px-6 py-4',
            children: (0, t.jsxs)('div', {
              className: 'mx-auto flex w-full max-w-5xl flex-col gap-1',
              children: [
                (0, t.jsx)('p', {
                  className: 'text-xs font-semibold uppercase tracking-[0.3em] text-slate-400',
                  children: 'Secure document viewer',
                }),
                (0, t.jsx)('h1', {
                  className: 'text-lg font-semibold text-slate-800',
                  children: c ?? 'KYC document',
                }),
              ],
            }),
          }),
          (0, t.jsxs)('section', {
            className: 'mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-6',
            children: [
              x &&
                (0, t.jsx)('div', {
                  className:
                    'rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600',
                  children: 'Loading document…',
                }),
              !x &&
                d &&
                (0, t.jsx)('div', {
                  className:
                    'rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700',
                  children: d,
                }),
              !x &&
                !d &&
                e &&
                (0, t.jsxs)('div', {
                  className:
                    'flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm',
                  children: [
                    v
                      ? (0, t.jsx)('img', {
                          src: e,
                          alt: c ?? 'KYC document',
                          className: 'h-auto w-full',
                        })
                      : (0, t.jsx)('embed', {
                          src: e,
                          type: o ?? 'application/octet-stream',
                          className: 'h-[80vh] w-full',
                        }),
                    !v &&
                      !N &&
                      (0, t.jsx)('p', {
                        className: 'p-4 text-sm text-slate-600',
                        children:
                          'This file type cannot be previewed here. Download it from your browser if prompted.',
                      }),
                  ],
                }),
            ],
          }),
        ],
      });
    }
    e.s(['default', () => a]);
  },
]);
