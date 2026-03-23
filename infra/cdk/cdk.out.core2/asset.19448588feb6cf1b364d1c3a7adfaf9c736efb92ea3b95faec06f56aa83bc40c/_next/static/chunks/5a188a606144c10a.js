(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  68250,
  (e) => {
    'use strict';
    var s = e.i(43476),
      t = e.i(71645),
      i = e.i(18566),
      r = e.i(22016),
      l = e.i(14983),
      o = e.i(66746);
    function n() {
      let e = (0, i.useRouter)(),
        [n, u] = (0, t.useState)(null);
      return (
        (0, t.useEffect)(() => {
          let s,
            t = (s = (0, l.getSession)())
              ? (0, o.isAdminGroup)(s.groups)
                ? '/admin/civil-servants'
                : ((0, o.isCivilServantGroup)(s.groups) || (0, o.isCustomerGroup)(s.groups), '/')
              : '/login';
          (u(t), e.replace(t));
        }, [e]),
        (0, s.jsxs)('main', {
          className:
            'mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-4 px-4 pb-16 pt-20 sm:px-6 lg:px-8',
          children: [
            (0, s.jsx)('p', {
              className: 'text-sm text-slate-600',
              children: 'Redirecting to your profile…',
            }),
            n &&
              (0, s.jsx)(r.default, {
                href: n,
                className:
                  'rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700',
                children: 'Continue',
              }),
          ],
        })
      );
    }
    e.s(['default', () => n]);
  },
]);
