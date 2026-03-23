(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  26048,
  (e) => {
    'use strict';
    var t = e.i(14983);
    let s = (0, e.i(75863).resolveAppApiRoot)(),
      r = async (e, r = {}, a = !0) => {
        let i = (0, t.getSession)(),
          n = { 'Content-Type': 'application/json', ...r.headers };
        if (a) {
          if (!i) throw Error('No active session');
          n.Authorization = `Bearer ${i.accessToken}`;
        }
        let l = await fetch(`${s}${e}`, { ...r, headers: n });
        if (!l.ok)
          throw (
            401 === l.status && ((0, t.clearSession)(), (window.location.href = '/login')),
            Error((await l.text()) || 'Request failed')
          );
        if (204 !== l.status) return await l.json();
      };
    e.s([
      'adminApi',
      0,
      {
        searchCivilServants: (e) => {
          let t = new URLSearchParams();
          (e.accountNumber && t.set('accountNumber', e.accountNumber),
            e.familyName && t.set('familyName', e.familyName));
          let s = t.toString() ? `?${t.toString()}` : '';
          return r(`/civil-servants${s}`);
        },
        getCivilServant: (e) => r(`/civil-servants/${e}`),
        createCivilServant: (e) =>
          r('/admin/users/civil-servants', { method: 'POST', body: JSON.stringify(e) }),
        checkEmail: (e) => {
          let t = new URLSearchParams({ email: e });
          return r(`/admin/users/check-email?${t}`);
        },
        deleteCivilServant: (e) => r(`/admin/users/civil-servants/${e}`, { method: 'DELETE' }),
        generateCivilServantQr: (e) => r(`/civil-servants/${e}/guard-token`, { method: 'POST' }),
        getCivilServantQr: (e) => r(`/civil-servants/${e}/qr-code`),
        getCivilServantPayout: (e) => r(`/civil-servants/${e}/payout`),
        getCivilServantTransactions: (e) => r(`/civil-servants/${e}/transactions`),
        getCivilServantPendingTransactions: (e, t) => {
          let s = new URLSearchParams();
          (t?.offset !== void 0 && s.set('offset', String(t.offset)),
            t?.limit !== void 0 && s.set('limit', String(t.limit)));
          let a = s.toString() ? `?${s.toString()}` : '';
          return r(`/civil-servants/${e}/transactions/pending${a}`);
        },
        updateCivilServant: (e, t) =>
          r(`/civil-servants/${e}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          }),
        getCustomerTransactions: (e, t) => {
          let s = new URLSearchParams();
          (t?.offset !== void 0 && s.set('offset', String(t.offset)),
            t?.limit !== void 0 && s.set('limit', String(t.limit)));
          let a = s.toString() ? `?${s.toString()}` : '';
          return r(`/customers/${e}/transactions${a}`);
        },
        getCustomerPendingTransactions: (e, t) => {
          let s = new URLSearchParams();
          (t?.offset !== void 0 && s.set('offset', String(t.offset)),
            t?.limit !== void 0 && s.set('limit', String(t.limit)));
          let a = s.toString() ? `?${s.toString()}` : '';
          return r(`/customers/${e}/transactions/pending${a}`);
        },
        updateCustomer: (e, t) =>
          r(`/customers/${e}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          }),
        searchCustomers: (e) => {
          let t = new URLSearchParams();
          (e.accountNumber && t.set('accountNumber', e.accountNumber),
            e.familyName && t.set('familyName', e.familyName));
          let s = t.toString() ? `?${t.toString()}` : '';
          return r(`/customers${s}`);
        },
        getCustomer: (e) => r(`/customers/${e}`),
        createCustomer: (e) =>
          r('/admin/users/customers', { method: 'POST', body: JSON.stringify(e) }),
        deleteCustomer: (e) => r(`/admin/users/customers/${e}`, { method: 'DELETE' }),
        getCustomerWallet: (e) => r(`/customers/${e}/wallet`),
        listAdministrators: () => r('/admin/users/administrators'),
        createAdministrator: (e) =>
          r('/admin/users/administrators', { method: 'POST', body: JSON.stringify(e) }),
        deleteAdministrator: (e) =>
          r(`/admin/users/administrators/${encodeURIComponent(e)}`, { method: 'DELETE' }),
        listVouchers: (e) => {
          let t = new URLSearchParams();
          e?.limit !== void 0 && t.set('limit', String(e.limit));
          let s = t.toString() ? `?${t.toString()}` : '';
          return r(`/admin/vouchers${s}`);
        },
        ingestShopriteCheckersVoucher: (e) =>
          r('/admin/vouchers/suppliers/shoprite-checkers/ingest', {
            method: 'POST',
            body: JSON.stringify(e),
          }),
        getCustomerKyc: (e) => r(`/customers/${e}/kyc`),
        presignCustomerKycDocument: (e, t, s) =>
          r(`/customers/${e}/kyc/documents/${t}/presign`, {
            method: 'POST',
            body: JSON.stringify(s),
          }),
        confirmCustomerKycDocument: (e, t, s) =>
          r(`/customers/${e}/kyc/documents/${t}/confirm`, {
            method: 'POST',
            body: JSON.stringify(s),
          }),
        getCustomerKycDocumentUrl: (e, t) => r(`/customers/${e}/kyc/documents/${t}`),
        deleteCustomerKycDocument: (e, t) =>
          r(`/customers/${e}/kyc/documents/${t}`, { method: 'DELETE' }),
        getCivilServantKyc: (e) => r(`/civil-servants/${e}/kyc`),
        presignCivilServantKycDocument: (e, t, s) =>
          r(`/civil-servants/${e}/kyc/documents/${t}/presign`, {
            method: 'POST',
            body: JSON.stringify(s),
          }),
        confirmCivilServantKycDocument: (e, t, s) =>
          r(`/civil-servants/${e}/kyc/documents/${t}/confirm`, {
            method: 'POST',
            body: JSON.stringify(s),
          }),
        getCivilServantKycDocumentUrl: (e, t) => r(`/civil-servants/${e}/kyc/documents/${t}`),
        deleteCivilServantKycDocument: (e, t) =>
          r(`/civil-servants/${e}/kyc/documents/${t}`, { method: 'DELETE' }),
      },
    ]);
  },
  95791,
  (e) => {
    'use strict';
    var t = e.i(43476),
      s = e.i(71645),
      r = e.i(26048);
    function a() {
      let [e, a] = (0, s.useState)({
          firstName: '',
          familyName: '',
          email: '',
          phoneNumber: '',
          password: '',
        }),
        [i, n] = (0, s.useState)([]),
        [l, o] = (0, s.useState)(null),
        [m, c] = (0, s.useState)(null),
        [d, u] = (0, s.useState)(!1),
        p = async () => {
          try {
            let e = await r.adminApi.listAdministrators();
            n(e ?? []);
          } catch (e) {
            c(e?.message ?? 'Failed to load administrators.');
          }
        };
      (0, s.useEffect)(() => {
        let e = !1;
        return (
          (async () => {
            try {
              let t = await r.adminApi.listAdministrators();
              e || n(t ?? []);
            } catch (t) {
              e || c(t?.message ?? 'Failed to load administrators.');
            }
          })(),
          () => {
            e = !0;
          }
        );
      }, []);
      let x = async (t) => {
          (t.preventDefault(), c(null));
          try {
            let t = await r.adminApi.createAdministrator({
              ...e,
              phoneNumber: e.phoneNumber || void 0,
              password: e.password || void 0,
            });
            (o(`Administrator created. Temporary password: ${t.temporaryPassword}`),
              a({ firstName: '', familyName: '', email: '', phoneNumber: '', password: '' }),
              await p(),
              u(!1));
          } catch (e) {
            c(e?.message ?? 'Unable to create administrator.');
          }
        },
        h = async (e) => {
          if (confirm('Delete this administrator?'))
            try {
              (await r.adminApi.deleteAdministrator(e),
                n((t) => t.filter((t) => t.username !== e)),
                o('Administrator deleted.'));
            } catch (e) {
              c(e?.message ?? 'Unable to delete administrator.');
            }
        };
      return (0, t.jsxs)('div', {
        className: 'space-y-6',
        children: [
          (0, t.jsx)('div', {
            className: 'flex items-center justify-end',
            children: (0, t.jsxs)('button', {
              type: 'button',
              onClick: () => u(!0),
              className: 'btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold',
              children: [
                (0, t.jsx)('span', { className: 'text-lg leading-none', children: '＋' }),
                ' Add administrator',
              ],
            }),
          }),
          m &&
            (0, t.jsx)('p', {
              className: 'rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700',
              children: m,
            }),
          l &&
            (0, t.jsx)('p', {
              className: 'rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700',
              children: l,
            }),
          (0, t.jsxs)('div', {
            className: 'rounded-2xl border border-slate-200 bg-white',
            children: [
              (0, t.jsxs)('div', {
                className: 'flex items-center justify-between border-b border-slate-100 px-6 py-4',
                children: [
                  (0, t.jsx)('h3', {
                    className: 'text-lg font-semibold text-slate-900',
                    children: 'Administrators',
                  }),
                  (0, t.jsxs)('span', {
                    className: 'text-sm text-slate-500',
                    children: [i.length, ' total'],
                  }),
                ],
              }),
              (0, t.jsxs)('ul', {
                children: [
                  i.map((e) =>
                    (0, t.jsxs)(
                      'li',
                      {
                        className:
                          'flex items-center justify-between border-b border-slate-100 px-6 py-4 last:border-b-0',
                        children: [
                          (0, t.jsxs)('div', {
                            children: [
                              (0, t.jsxs)('p', {
                                className: 'text-base font-semibold text-slate-900',
                                children: [e.firstName, ' ', e.familyName],
                              }),
                              (0, t.jsx)('p', {
                                className: 'text-sm text-slate-500',
                                children: e.username,
                              }),
                            ],
                          }),
                          (0, t.jsx)('button', {
                            type: 'button',
                            onClick: () => h(e.username),
                            className: 'btn-primary px-4 py-2 text-sm font-semibold text-white',
                            children: 'Delete',
                          }),
                        ],
                      },
                      e.username
                    )
                  ),
                  0 === i.length &&
                    (0, t.jsx)('li', {
                      className: 'px-6 py-8 text-center text-sm text-slate-500',
                      children: 'No administrators yet.',
                    }),
                ],
              }),
            ],
          }),
          d &&
            (0, t.jsx)('div', {
              className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4',
              children: (0, t.jsxs)('div', {
                className: 'w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl',
                children: [
                  (0, t.jsxs)('div', {
                    className: 'mb-4 flex items-center justify-between',
                    children: [
                      (0, t.jsx)('h3', {
                        className: 'text-xl font-semibold text-slate-900',
                        children: 'Create administrator',
                      }),
                      (0, t.jsx)('button', {
                        type: 'button',
                        className: 'btn-primary px-4 py-2 text-sm font-semibold text-white',
                        onClick: () => u(!1),
                        children: 'Close',
                      }),
                    ],
                  }),
                  (0, t.jsxs)('form', {
                    onSubmit: x,
                    className: 'space-y-4',
                    children: [
                      (0, t.jsxs)('div', {
                        className: 'grid gap-4 md:grid-cols-2',
                        children: [
                          (0, t.jsxs)('label', {
                            className: 'text-sm font-semibold text-slate-600',
                            children: [
                              'First name',
                              (0, t.jsx)('input', {
                                required: !0,
                                value: e.firstName,
                                onChange: (e) => a((t) => ({ ...t, firstName: e.target.value })),
                                className:
                                  'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                              }),
                            ],
                          }),
                          (0, t.jsxs)('label', {
                            className: 'text-sm font-semibold text-slate-600',
                            children: [
                              'Family name',
                              (0, t.jsx)('input', {
                                required: !0,
                                value: e.familyName,
                                onChange: (e) => a((t) => ({ ...t, familyName: e.target.value })),
                                className:
                                  'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, t.jsxs)('label', {
                        className: 'text-sm font-semibold text-slate-600',
                        children: [
                          'Email / username',
                          (0, t.jsx)('input', {
                            required: !0,
                            type: 'email',
                            value: e.email,
                            onChange: (e) => a((t) => ({ ...t, email: e.target.value })),
                            className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                          }),
                        ],
                      }),
                      (0, t.jsxs)('label', {
                        className: 'text-sm font-semibold text-slate-600',
                        children: [
                          'Password (optional)',
                          (0, t.jsx)('input', {
                            type: 'password',
                            value: e.password,
                            onChange: (e) => a((t) => ({ ...t, password: e.target.value })),
                            className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                            placeholder: 'Leave blank to auto-generate',
                          }),
                        ],
                      }),
                      (0, t.jsxs)('label', {
                        className: 'text-sm font-semibold text-slate-600',
                        children: [
                          'Phone',
                          (0, t.jsx)('input', {
                            value: e.phoneNumber,
                            onChange: (e) => a((t) => ({ ...t, phoneNumber: e.target.value })),
                            className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                          }),
                        ],
                      }),
                      (0, t.jsx)('button', {
                        type: 'submit',
                        className: 'btn-primary px-6 py-3 text-base font-semibold text-white',
                        children: 'Create administrator',
                      }),
                    ],
                  }),
                ],
              }),
            }),
        ],
      });
    }
    e.s(['default', () => a]);
  },
]);
