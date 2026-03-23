(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  18438,
  (e) => {
    'use strict';
    var t = e.i(14983);
    let s = (0, e.i(75863).resolveApiRoot)(),
      a = async (e, a = {}) => {
        let l = (0, t.getSession)(),
          i = { 'Content-Type': 'application/json', ...a.headers };
        if (!l) throw Error('No active session');
        i.Authorization = `Bearer ${l.accessToken}`;
        let r = await fetch(`${s}${e}`, { ...a, headers: i });
        if (!r.ok)
          throw (
            401 === r.status && ((0, t.clearSession)(), (window.location.href = '/login')),
            Error((await r.text()) || 'Request failed')
          );
        if (204 !== r.status) return await r.json();
      };
    e.s([
      'auditApi',
      0,
      {
        list: (e) => {
          let t = new URLSearchParams();
          (e?.userId && t.set('userId', e.userId),
            e?.eventType && t.set('eventType', e.eventType),
            e?.limit && t.set('limit', String(e.limit)));
          let s = t.toString() ? `?${t.toString()}` : '';
          return a(`/audit${s}`);
        },
      },
    ]);
  },
  94297,
  (e) => {
    'use strict';
    var t = e.i(43476),
      s = e.i(71645),
      a = e.i(18438);
    function l() {
      let [e, l] = (0, s.useState)([]),
        [i, r] = (0, s.useState)(''),
        [n, d] = (0, s.useState)(!1),
        [o, c] = (0, s.useState)(null),
        x = async () => {
          (d(!0), c(null));
          try {
            let e = await a.auditApi.list({ eventType: i.trim() || void 0, limit: 100 });
            l(e);
          } catch (e) {
            c(e?.message ?? 'Failed to load audit logs');
          } finally {
            d(!1);
          }
        };
      return (
        (0, s.useEffect)(() => {
          x();
        }, []),
        (0, t.jsxs)('main', {
          className: 'mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6',
          children: [
            (0, t.jsxs)('header', {
              className: 'flex items-center justify-between',
              children: [
                (0, t.jsxs)('div', {
                  children: [
                    (0, t.jsx)('h1', {
                      className: 'text-2xl font-semibold text-slate-900',
                      children: 'My Audit Logs',
                    }),
                    (0, t.jsx)('p', {
                      className: 'text-sm text-slate-600',
                      children: 'Only events related to your account are shown.',
                    }),
                  ],
                }),
                (0, t.jsx)('button', {
                  type: 'button',
                  onClick: x,
                  className:
                    'rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800',
                  disabled: n,
                  children: n ? 'Refreshing…' : 'Refresh',
                }),
              ],
            }),
            (0, t.jsxs)('section', {
              className: 'grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
              children: [
                (0, t.jsxs)('div', {
                  className: 'grid gap-3 sm:grid-cols-3',
                  children: [
                    (0, t.jsxs)('label', {
                      className: 'flex flex-col text-sm font-semibold text-slate-700',
                      children: [
                        'Event type',
                        (0, t.jsx)('input', {
                          value: i,
                          onChange: (e) => r(e.target.value),
                          placeholder: 'guard.token.rotate',
                          className: 'mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm',
                        }),
                      ],
                    }),
                    (0, t.jsx)('div', {
                      className: 'flex items-end gap-2 sm:col-span-2',
                      children: (0, t.jsx)('button', {
                        type: 'button',
                        onClick: x,
                        className:
                          'rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600',
                        disabled: n,
                        children: 'Apply Filters',
                      }),
                    }),
                  ],
                }),
                o && (0, t.jsx)('p', { className: 'text-sm text-rose-600', children: o }),
              ],
            }),
            (0, t.jsxs)('section', {
              className: 'grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
              children: [
                (0, t.jsxs)('div', {
                  className:
                    'grid grid-cols-5 gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
                  children: [
                    (0, t.jsx)('span', { className: 'col-span-2', children: 'Event' }),
                    (0, t.jsx)('span', { children: 'Actor' }),
                    (0, t.jsx)('span', { children: 'When' }),
                    (0, t.jsx)('span', { children: 'Details' }),
                  ],
                }),
                (0, t.jsxs)('div', {
                  className: 'divide-y divide-slate-100',
                  children: [
                    e.map((e) =>
                      (0, t.jsxs)(
                        'div',
                        {
                          className: 'grid grid-cols-5 gap-3 py-3 text-sm text-slate-800',
                          children: [
                            (0, t.jsxs)('div', {
                              className: 'col-span-2',
                              children: [
                                (0, t.jsx)('p', {
                                  className: 'font-semibold',
                                  children: e.eventType,
                                }),
                                e.description &&
                                  (0, t.jsx)('p', {
                                    className: 'text-xs text-slate-600',
                                    children: e.description,
                                  }),
                              ],
                            }),
                            (0, t.jsxs)('div', {
                              children: [
                                (0, t.jsx)('p', {
                                  className: 'font-mono text-xs text-slate-700',
                                  children: e.actorId ?? 'self',
                                }),
                                e.actorType &&
                                  (0, t.jsx)('p', {
                                    className: 'text-xs text-slate-500',
                                    children: e.actorType,
                                  }),
                              ],
                            }),
                            (0, t.jsx)('div', {
                              children: (0, t.jsx)('p', {
                                className: 'text-xs text-slate-700',
                                children: new Date(e.createdAt).toLocaleString(),
                              }),
                            }),
                            (0, t.jsx)('div', {
                              children: e.metadata
                                ? (0, t.jsx)('pre', {
                                    className:
                                      'overflow-x-auto rounded bg-slate-50 p-2 text-[11px] leading-tight text-slate-700',
                                    children: JSON.stringify(e.metadata, null, 2),
                                  })
                                : (0, t.jsx)('span', {
                                    className: 'text-xs text-slate-500',
                                    children: '—',
                                  }),
                            }),
                          ],
                        },
                        e.auditId
                      )
                    ),
                    0 === e.length &&
                      !n &&
                      (0, t.jsx)('p', {
                        className: 'py-6 text-center text-sm text-slate-600',
                        children: 'No audit entries found.',
                      }),
                    n &&
                      (0, t.jsx)('p', {
                        className: 'py-6 text-center text-sm text-slate-600',
                        children: 'Loading…',
                      }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    }
    e.s(['default', () => l]);
  },
]);
