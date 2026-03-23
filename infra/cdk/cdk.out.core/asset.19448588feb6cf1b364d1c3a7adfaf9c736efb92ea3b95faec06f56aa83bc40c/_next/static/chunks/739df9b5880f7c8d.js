(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  26048,
  (e) => {
    'use strict';
    var t = e.i(14983);
    let s = (0, e.i(75863).resolveAppApiRoot)(),
      r = async (e, r = {}, i = !0) => {
        let a = (0, t.getSession)(),
          n = { 'Content-Type': 'application/json', ...r.headers };
        if (i) {
          if (!a) throw Error('No active session');
          n.Authorization = `Bearer ${a.accessToken}`;
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
          let i = s.toString() ? `?${s.toString()}` : '';
          return r(`/civil-servants/${e}/transactions/pending${i}`);
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
          let i = s.toString() ? `?${s.toString()}` : '';
          return r(`/customers/${e}/transactions${i}`);
        },
        getCustomerPendingTransactions: (e, t) => {
          let s = new URLSearchParams();
          (t?.offset !== void 0 && s.set('offset', String(t.offset)),
            t?.limit !== void 0 && s.set('limit', String(t.limit)));
          let i = s.toString() ? `?${s.toString()}` : '';
          return r(`/customers/${e}/transactions/pending${i}`);
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
  13995,
  (e) => {
    'use strict';
    var t = e.i(43476),
      s = e.i(71645),
      r = e.i(26048);
    let i = "You've been gifted a R50 Shoprite, Checkers, Usave voucher. BARCODE: 9300525147320593",
      a = (e, t) =>
        new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: t,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(e);
    function n() {
      let [e, n] = (0, s.useState)(''),
        [l, o] = (0, s.useState)([]),
        [c, d] = (0, s.useState)(!1),
        [m, u] = (0, s.useState)(!1),
        [h, x] = (0, s.useState)(null),
        [p, g] = (0, s.useState)(null),
        y = async () => {
          (d(!0), g(null));
          try {
            let e = await r.adminApi.listVouchers({ limit: 25 });
            o(e ?? []);
          } catch (e) {
            g(e?.message ?? 'Unable to load vouchers.');
          } finally {
            d(!1);
          }
        };
      (0, s.useEffect)(() => {
        y();
      }, []);
      let v = (0, s.useMemo)(() => {
          let e = l.reduce((e, t) => e + t.amountMinor, 0) / 100;
          return { count: l.length, total: e };
        }, [l]),
        b = async (t) => {
          (t.preventDefault(), u(!0), g(null), x(null));
          try {
            let t = await r.adminApi.ingestShopriteCheckersVoucher({ smsText: e });
            (x(`Voucher ingested: ${a(t.amount, t.currency)} \xb7 ${t.barcodeMasked}`),
              n(''),
              await y());
          } catch (e) {
            g(e?.message ?? 'Unable to ingest voucher.');
          } finally {
            u(!1);
          }
        };
      return (0, t.jsxs)('div', {
        className: 'space-y-6',
        children: [
          (0, t.jsxs)('section', {
            className: 'grid gap-4 md:grid-cols-3',
            children: [
              (0, t.jsxs)('div', {
                className: 'rounded-2xl border border-slate-200 bg-white p-5',
                children: [
                  (0, t.jsx)('p', {
                    className: 'text-xs font-semibold uppercase tracking-[0.25em] text-slate-500',
                    children: 'Admin flow',
                  }),
                  (0, t.jsx)('p', {
                    className: 'mt-3 text-lg font-semibold text-slate-900',
                    children: 'PashashaPayBot → Vouchers',
                  }),
                  (0, t.jsx)('p', {
                    className: 'mt-2 text-sm text-slate-600',
                    children:
                      'Admin flow: /admin → vouchers → Shoprite Checkers → paste SMS → secure ingest.',
                  }),
                ],
              }),
              (0, t.jsxs)('div', {
                className: 'rounded-2xl border border-slate-200 bg-white p-5',
                children: [
                  (0, t.jsx)('p', {
                    className: 'text-xs font-semibold uppercase tracking-[0.25em] text-slate-500',
                    children: 'Recent ingests',
                  }),
                  (0, t.jsx)('p', {
                    className: 'mt-3 text-3xl font-semibold text-slate-900',
                    children: v.count,
                  }),
                  (0, t.jsx)('p', {
                    className: 'mt-2 text-sm text-slate-600',
                    children: 'Last 25 vouchers currently visible here.',
                  }),
                ],
              }),
              (0, t.jsxs)('div', {
                className: 'rounded-2xl border border-slate-200 bg-white p-5',
                children: [
                  (0, t.jsx)('p', {
                    className: 'text-xs font-semibold uppercase tracking-[0.25em] text-slate-500',
                    children: 'Inventory value',
                  }),
                  (0, t.jsx)('p', {
                    className: 'mt-3 text-3xl font-semibold text-slate-900',
                    children: a(v.total, 'ZAR'),
                  }),
                  (0, t.jsx)('p', {
                    className: 'mt-2 text-sm text-slate-600',
                    children: 'Masked-only view. Full barcodes stay encrypted.',
                  }),
                ],
              }),
            ],
          }),
          (0, t.jsxs)('section', {
            className: 'grid gap-6 lg:grid-cols-[1.15fr_0.85fr]',
            children: [
              (0, t.jsxs)('form', {
                onSubmit: b,
                className: 'rounded-2xl border border-slate-200 bg-white p-6',
                children: [
                  (0, t.jsxs)('div', {
                    className: 'flex items-start justify-between gap-4',
                    children: [
                      (0, t.jsxs)('div', {
                        children: [
                          (0, t.jsx)('h2', {
                            className: 'text-lg font-semibold text-slate-900',
                            children: 'Ingest Shoprite Checkers SMS',
                          }),
                          (0, t.jsx)('p', {
                            className: 'mt-2 text-sm text-slate-600',
                            children:
                              'Paste the voucher SMS exactly as received. The full barcode is encrypted immediately; only the last 4 digits are shown back to admins.',
                          }),
                        ],
                      }),
                      (0, t.jsx)('button', {
                        type: 'button',
                        onClick: () => n(i),
                        className:
                          'rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50',
                        children: 'Use example',
                      }),
                    ],
                  }),
                  (0, t.jsxs)('label', {
                    className: 'mt-5 block text-sm font-semibold text-slate-700',
                    children: [
                      'Voucher SMS',
                      (0, t.jsx)('textarea', {
                        required: !0,
                        minLength: 20,
                        maxLength: 4e3,
                        rows: 8,
                        value: e,
                        onChange: (e) => n(e.target.value),
                        placeholder: i,
                        className:
                          'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-inner outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100',
                      }),
                    ],
                  }),
                  (0, t.jsxs)('div', {
                    className: 'mt-4 flex flex-wrap items-center gap-3',
                    children: [
                      (0, t.jsx)('button', {
                        type: 'submit',
                        disabled: m,
                        className:
                          'btn-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60',
                        children: m ? 'Ingesting...' : 'Ingest voucher',
                      }),
                      (0, t.jsx)('button', {
                        type: 'button',
                        onClick: () => n(''),
                        className:
                          'rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50',
                        children: 'Clear',
                      }),
                    ],
                  }),
                ],
              }),
              (0, t.jsxs)('section', {
                className: 'rounded-2xl border border-slate-200 bg-white p-6',
                children: [
                  (0, t.jsx)('h2', {
                    className: 'text-lg font-semibold text-slate-900',
                    children: 'Telegram admin notes',
                  }),
                  (0, t.jsxs)('ol', {
                    className: 'mt-4 space-y-3 text-sm text-slate-600',
                    children: [
                      (0, t.jsx)('li', {
                        children:
                          '1. PashashaPayBot should expose only the admin voucher ingest flow first.',
                      }),
                      (0, t.jsx)('li', {
                        children: '2. Ask the admin to paste the full SMS exactly as received.',
                      }),
                      (0, t.jsx)('li', {
                        children:
                          '3. Send the SMS to the backend ingest endpoint using administrator auth.',
                      }),
                      (0, t.jsx)('li', {
                        children: '4. Reply with amount, supplier, and masked barcode only.',
                      }),
                      (0, t.jsx)('li', {
                        children:
                          '5. Do not echo tokens, raw barcodes, or full SMS text into logs.',
                      }),
                    ],
                  }),
                  (0, t.jsx)('div', {
                    className:
                      'mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900',
                    children:
                      'Current repo scope: web admin is implemented here; Telegram runtime still needs a token, webhook/polling process, and deployment wiring outside this repo.',
                  }),
                ],
              }),
            ],
          }),
          p &&
            (0, t.jsx)('p', {
              className: 'rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700',
              children: p,
            }),
          h &&
            (0, t.jsx)('p', {
              className: 'rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700',
              children: h,
            }),
          (0, t.jsxs)('section', {
            className: 'rounded-2xl border border-slate-200 bg-white',
            children: [
              (0, t.jsxs)('div', {
                className: 'flex items-center justify-between border-b border-slate-100 px-6 py-4',
                children: [
                  (0, t.jsxs)('div', {
                    children: [
                      (0, t.jsx)('h3', {
                        className: 'text-lg font-semibold text-slate-900',
                        children: 'Recent voucher ingests',
                      }),
                      (0, t.jsx)('p', {
                        className: 'text-sm text-slate-500',
                        children: 'Latest encrypted inventory records.',
                      }),
                    ],
                  }),
                  (0, t.jsx)('button', {
                    type: 'button',
                    onClick: () => void y(),
                    disabled: c,
                    className:
                      'rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60',
                    children: c ? 'Refreshing...' : 'Refresh',
                  }),
                ],
              }),
              (0, t.jsx)('div', {
                className: 'overflow-x-auto',
                children: (0, t.jsxs)('table', {
                  className: 'min-w-full divide-y divide-slate-100 text-sm',
                  children: [
                    (0, t.jsx)('thead', {
                      className:
                        'bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
                      children: (0, t.jsxs)('tr', {
                        children: [
                          (0, t.jsx)('th', { className: 'px-6 py-3', children: 'When' }),
                          (0, t.jsx)('th', { className: 'px-6 py-3', children: 'Supplier' }),
                          (0, t.jsx)('th', { className: 'px-6 py-3', children: 'Amount' }),
                          (0, t.jsx)('th', { className: 'px-6 py-3', children: 'Barcode' }),
                          (0, t.jsx)('th', { className: 'px-6 py-3', children: 'Source' }),
                          (0, t.jsx)('th', { className: 'px-6 py-3', children: 'Actor' }),
                          (0, t.jsx)('th', { className: 'px-6 py-3', children: 'Status' }),
                        ],
                      }),
                    }),
                    (0, t.jsxs)('tbody', {
                      className: 'divide-y divide-slate-100 bg-white',
                      children: [
                        l.map((e) =>
                          (0, t.jsxs)(
                            'tr',
                            {
                              children: [
                                (0, t.jsx)('td', {
                                  className: 'px-6 py-4 text-slate-600',
                                  children: new Date(e.ingestedAt).toLocaleString('en-ZA'),
                                }),
                                (0, t.jsx)('td', {
                                  className: 'px-6 py-4 text-slate-900',
                                  children: e.supplier,
                                }),
                                (0, t.jsx)('td', {
                                  className: 'px-6 py-4 font-semibold text-slate-900',
                                  children: a(e.amount, e.currency),
                                }),
                                (0, t.jsx)('td', {
                                  className: 'px-6 py-4 font-mono text-slate-700',
                                  children: e.barcodeMasked,
                                }),
                                (0, t.jsx)('td', {
                                  className: 'px-6 py-4 text-slate-600',
                                  children: e.source,
                                }),
                                (0, t.jsx)('td', {
                                  className: 'px-6 py-4 text-slate-600',
                                  children: e.ingestedByActorId ?? e.ingestedByUserId,
                                }),
                                (0, t.jsx)('td', {
                                  className: 'px-6 py-4',
                                  children: (0, t.jsx)('span', {
                                    className:
                                      'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700',
                                    children: e.status,
                                  }),
                                }),
                              ],
                            },
                            e.voucherId
                          )
                        ),
                        !c &&
                          0 === l.length &&
                          (0, t.jsx)('tr', {
                            children: (0, t.jsx)('td', {
                              colSpan: 7,
                              className: 'px-6 py-10 text-center text-sm text-slate-500',
                              children: 'No vouchers ingested yet.',
                            }),
                          }),
                        c &&
                          (0, t.jsx)('tr', {
                            children: (0, t.jsx)('td', {
                              colSpan: 7,
                              className: 'px-6 py-10 text-center text-sm text-slate-500',
                              children: 'Loading vouchers...',
                            }),
                          }),
                      ],
                    }),
                  ],
                }),
              }),
            ],
          }),
        ],
      });
    }
    e.s(['default', () => n]);
  },
]);
