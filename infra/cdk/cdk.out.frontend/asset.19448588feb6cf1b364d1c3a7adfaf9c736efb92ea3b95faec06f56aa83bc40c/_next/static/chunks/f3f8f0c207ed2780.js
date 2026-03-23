(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  99826,
  (e) => {
    'use strict';
    var s = e.i(43476),
      t = e.i(22016),
      a = e.i(18566),
      l = e.i(71645),
      r = e.i(66746),
      i = e.i(14983),
      n = e.i(29034),
      o = e.i(10584);
    let d = [
      { href: '/admin/civil-servants', label: 'Civil Servants' },
      { href: '/admin/customers', label: 'Customers' },
      { href: '/admin/vouchers', label: 'Vouchers' },
      { href: '/admin/administrators', label: 'Administrators' },
    ];
    function c({ children: e }) {
      let c = (0, a.useRouter)(),
        m = (0, a.usePathname)(),
        h = (0, i.getSession)();
      return ((0, o.eclipseEnabled)(),
      (0, l.useEffect)(() => {
        h ? (0, r.isAdminGroup)(h.groups) || c.replace('/') : c.replace('/login');
      }, [c, h]),
      h && (0, r.isAdminGroup)(h.groups))
        ? (0, s.jsxs)(s.Fragment, {
            children: [
              (0, s.jsxs)('main', {
                className: 'mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8',
                children: [
                  (0, s.jsxs)('header', {
                    className: 'mb-8 space-y-2',
                    children: [
                      (0, s.jsx)('p', {
                        className: 'text-xs uppercase tracking-[0.35em] text-slate-700',
                        children: 'Administrators',
                      }),
                      (0, s.jsx)('h1', {
                        className: 'text-3xl font-semibold text-slate-900',
                        children: 'Operations Console',
                      }),
                    ],
                  }),
                  (0, s.jsx)('nav', {
                    className:
                      'mb-8 flex gap-2 overflow-x-auto rounded-full bg-white/90 p-1 shadow-sm',
                    children: d.map((e) => {
                      let a = m.startsWith(e.href);
                      return (0, s.jsx)(
                        t.default,
                        {
                          href: e.href,
                          className: `rounded-full px-4 py-2 text-sm font-semibold ${a ? 'bg-orange-500 text-white' : 'text-slate-700'}`,
                          children: e.label,
                        },
                        e.href
                      );
                    }),
                  }),
                  (0, s.jsx)('section', {
                    className: 'rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl',
                    children: e,
                  }),
                ],
              }),
              (0, s.jsx)(n.ChatAssistant, {}),
            ],
          })
        : null;
    }
    e.s(['default', () => c]);
  },
]);
