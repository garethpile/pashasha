(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  26048,
  (e) => {
    'use strict';
    var t = e.i(14983);
    let a = (0, e.i(75863).resolveAppApiRoot)(),
      s = async (e, s = {}, l = !0) => {
        let i = (0, t.getSession)(),
          r = { 'Content-Type': 'application/json', ...s.headers };
        if (l) {
          if (!i) throw Error('No active session');
          r.Authorization = `Bearer ${i.accessToken}`;
        }
        let n = await fetch(`${a}${e}`, { ...s, headers: r });
        if (!n.ok)
          throw (
            401 === n.status && ((0, t.clearSession)(), (window.location.href = '/login')),
            Error((await n.text()) || 'Request failed')
          );
        if (204 !== n.status) return await n.json();
      };
    e.s([
      'adminApi',
      0,
      {
        searchCivilServants: (e) => {
          let t = new URLSearchParams();
          (e.accountNumber && t.set('accountNumber', e.accountNumber),
            e.familyName && t.set('familyName', e.familyName));
          let a = t.toString() ? `?${t.toString()}` : '';
          return s(`/civil-servants${a}`);
        },
        getCivilServant: (e) => s(`/civil-servants/${e}`),
        createCivilServant: (e) =>
          s('/admin/users/civil-servants', { method: 'POST', body: JSON.stringify(e) }),
        checkEmail: (e) => {
          let t = new URLSearchParams({ email: e });
          return s(`/admin/users/check-email?${t}`);
        },
        deleteCivilServant: (e) => s(`/admin/users/civil-servants/${e}`, { method: 'DELETE' }),
        generateCivilServantQr: (e) => s(`/civil-servants/${e}/guard-token`, { method: 'POST' }),
        getCivilServantQr: (e) => s(`/civil-servants/${e}/qr-code`),
        getCivilServantPayout: (e) => s(`/civil-servants/${e}/payout`),
        getCivilServantTransactions: (e) => s(`/civil-servants/${e}/transactions`),
        getCivilServantPendingTransactions: (e, t) => {
          let a = new URLSearchParams();
          (t?.offset !== void 0 && a.set('offset', String(t.offset)),
            t?.limit !== void 0 && a.set('limit', String(t.limit)));
          let l = a.toString() ? `?${a.toString()}` : '';
          return s(`/civil-servants/${e}/transactions/pending${l}`);
        },
        updateCivilServant: (e, t) =>
          s(`/civil-servants/${e}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          }),
        getCustomerTransactions: (e, t) => {
          let a = new URLSearchParams();
          (t?.offset !== void 0 && a.set('offset', String(t.offset)),
            t?.limit !== void 0 && a.set('limit', String(t.limit)));
          let l = a.toString() ? `?${a.toString()}` : '';
          return s(`/customers/${e}/transactions${l}`);
        },
        getCustomerPendingTransactions: (e, t) => {
          let a = new URLSearchParams();
          (t?.offset !== void 0 && a.set('offset', String(t.offset)),
            t?.limit !== void 0 && a.set('limit', String(t.limit)));
          let l = a.toString() ? `?${a.toString()}` : '';
          return s(`/customers/${e}/transactions/pending${l}`);
        },
        updateCustomer: (e, t) =>
          s(`/customers/${e}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          }),
        searchCustomers: (e) => {
          let t = new URLSearchParams();
          (e.accountNumber && t.set('accountNumber', e.accountNumber),
            e.familyName && t.set('familyName', e.familyName));
          let a = t.toString() ? `?${t.toString()}` : '';
          return s(`/customers${a}`);
        },
        getCustomer: (e) => s(`/customers/${e}`),
        createCustomer: (e) =>
          s('/admin/users/customers', { method: 'POST', body: JSON.stringify(e) }),
        deleteCustomer: (e) => s(`/admin/users/customers/${e}`, { method: 'DELETE' }),
        getCustomerWallet: (e) => s(`/customers/${e}/wallet`),
        listAdministrators: () => s('/admin/users/administrators'),
        createAdministrator: (e) =>
          s('/admin/users/administrators', { method: 'POST', body: JSON.stringify(e) }),
        deleteAdministrator: (e) =>
          s(`/admin/users/administrators/${encodeURIComponent(e)}`, { method: 'DELETE' }),
        listVouchers: (e) => {
          let t = new URLSearchParams();
          e?.limit !== void 0 && t.set('limit', String(e.limit));
          let a = t.toString() ? `?${t.toString()}` : '';
          return s(`/admin/vouchers${a}`);
        },
        ingestShopriteCheckersVoucher: (e) =>
          s('/admin/vouchers/suppliers/shoprite-checkers/ingest', {
            method: 'POST',
            body: JSON.stringify(e),
          }),
        getCustomerKyc: (e) => s(`/customers/${e}/kyc`),
        presignCustomerKycDocument: (e, t, a) =>
          s(`/customers/${e}/kyc/documents/${t}/presign`, {
            method: 'POST',
            body: JSON.stringify(a),
          }),
        confirmCustomerKycDocument: (e, t, a) =>
          s(`/customers/${e}/kyc/documents/${t}/confirm`, {
            method: 'POST',
            body: JSON.stringify(a),
          }),
        getCustomerKycDocumentUrl: (e, t) => s(`/customers/${e}/kyc/documents/${t}`),
        deleteCustomerKycDocument: (e, t) =>
          s(`/customers/${e}/kyc/documents/${t}`, { method: 'DELETE' }),
        getCivilServantKyc: (e) => s(`/civil-servants/${e}/kyc`),
        presignCivilServantKycDocument: (e, t, a) =>
          s(`/civil-servants/${e}/kyc/documents/${t}/presign`, {
            method: 'POST',
            body: JSON.stringify(a),
          }),
        confirmCivilServantKycDocument: (e, t, a) =>
          s(`/civil-servants/${e}/kyc/documents/${t}/confirm`, {
            method: 'POST',
            body: JSON.stringify(a),
          }),
        getCivilServantKycDocumentUrl: (e, t) => s(`/civil-servants/${e}/kyc/documents/${t}`),
        deleteCivilServantKycDocument: (e, t) =>
          s(`/civil-servants/${e}/kyc/documents/${t}`, { method: 'DELETE' }),
      },
    ]);
  },
  53756,
  (e) => {
    'use strict';
    var t = e.i(43476),
      a = e.i(71645),
      s = e.i(26048);
    (e.i(85351), e.i(28339));
    var l = e.i(14983);
    let i = [
      {
        type: 'country-id',
        label: 'Country ID',
        hint: 'National ID card or equivalent (PDF/JPG/PNG). Upload ID or Passport (one required).',
      },
      {
        type: 'passport',
        label: 'Passport',
        hint: 'Passport scan/photo (PDF/JPG/PNG). Upload ID or Passport (one required).',
      },
      {
        type: 'proof-of-address',
        label: 'Proof of address',
        hint: 'Utility bill/bank statement (PDF/JPG/PNG). Required.',
      },
    ];
    function r(e) {
      if (!(0, l.getSession)()) throw Error('Not authenticated');
      let t = new URL('/kyc/document', window.location.origin);
      (t.searchParams.set('path', e), window.open(t.toString(), '_blank', 'noopener,noreferrer'));
    }
    function n({
      status: e,
      missingCount: s,
      totalCount: l,
      loading: i,
      error: r,
      onRefresh: n,
      children: o,
    }) {
      let [d, c] = (0, a.useState)(!1);
      return (0, t.jsxs)('section', {
        className:
          'w-full max-w-4xl self-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm',
        children: [
          (0, t.jsxs)('header', {
            className:
              'flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between',
            children: [
              (0, t.jsxs)('div', {
                className: 'flex items-center gap-3',
                children: [
                  (0, t.jsx)('p', {
                    className: 'text-xs uppercase tracking-[0.35em] text-slate-400',
                    children: 'KYC',
                  }),
                  (0, t.jsx)('span', {
                    className: `rounded-full px-3 py-1 text-xs font-semibold ${(function (e) {
                      switch (e) {
                        case 'approved':
                          return 'bg-emerald-100 text-emerald-700';
                        case 'rejected':
                          return 'bg-rose-100 text-rose-700';
                        case 'pending':
                          return 'bg-amber-100 text-amber-700';
                        default:
                          return 'bg-slate-100 text-slate-700';
                      }
                    })(e)}`,
                    children: (function (e) {
                      switch (e) {
                        case 'not_started':
                          return 'Not started';
                        case 'pending':
                          return 'Pending review';
                        case 'approved':
                          return 'Approved';
                        case 'rejected':
                          return 'Rejected';
                      }
                    })(e),
                  }),
                  s > 0 &&
                    (0, t.jsxs)('span', {
                      className: 'text-xs font-semibold text-slate-500',
                      children: ['Missing: ', s, '/', l],
                    }),
                ],
              }),
              (0, t.jsxs)('div', {
                className: 'flex items-center gap-2',
                children: [
                  (0, t.jsx)('button', {
                    type: 'button',
                    onClick: n,
                    className:
                      'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60',
                    title: 'Refresh',
                    'aria-label': 'Refresh',
                    disabled: i,
                    children: i ? '…' : '⟳',
                  }),
                  (0, t.jsx)('button', {
                    type: 'button',
                    onClick: () => c((e) => !e),
                    className: 'text-sm font-semibold text-orange-600',
                    children: d ? '▼' : '▲',
                  }),
                ],
              }),
            ],
          }),
          r &&
            (0, t.jsx)('p', {
              className: 'mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700',
              children: r,
            }),
          !d && (0, t.jsx)('div', { className: 'mt-6', children: o }),
        ],
      });
    }
    function o({ profileType: e, profileId: l }) {
      let [o, d] = (0, a.useState)(null),
        [c, m] = (0, a.useState)(!1),
        [u, p] = (0, a.useState)(null),
        [x, b] = (0, a.useState)({}),
        [h, f] = (0, a.useState)({}),
        v = (0, a.useCallback)(async () => {
          (p(null), m(!0));
          try {
            let t =
              'customer' === e
                ? await s.adminApi.getCustomerKyc(l)
                : await s.adminApi.getCivilServantKyc(l);
            d(t);
          } catch (e) {
            (p(e?.message ?? 'Unable to load KYC.'), d(null));
          } finally {
            m(!1);
          }
        }, [l, e]);
      (0, a.useEffect)(() => {
        l && v();
      }, [v, l]);
      let y = o?.status ?? 'not_started',
        g = (0, a.useMemo)(() => {
          var e;
          let t, a, s, l;
          return (
            (e = o?.documents ?? {}),
            (t = !!e['country-id']?.key),
            (a = !!e.passport?.key),
            (s = !!e['proof-of-address']?.key),
            (l = []),
            s || l.push('Proof of address'),
            t || a || l.push('ID or Passport'),
            l
          );
        }, [o?.documents]),
        N = async (t) => {
          p(null);
          let a = h[t] ?? null;
          if (!a) return void p('Choose a file before uploading.');
          if (!a.type) return void p('Unsupported file: missing content type.');
          if (a.size > 0xa00000) return void p('File too large. Please keep uploads under 10MB.');
          b((e) => ({ ...e, [t]: !0 }));
          try {
            let i =
                'customer' === e
                  ? await s.adminApi.presignCustomerKycDocument(l, t, {
                      contentType: a.type,
                      fileName: a.name,
                    })
                  : await s.adminApi.presignCivilServantKycDocument(l, t, {
                      contentType: a.type,
                      fileName: a.name,
                    }),
              r = await fetch(i.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': a.type },
                body: a,
              });
            if (!r.ok) {
              let e = await r.text();
              throw Error(e || `Upload failed (${r.status})`);
            }
            ('customer' === e
              ? await s.adminApi.confirmCustomerKycDocument(l, t, {
                  bucket: i.bucket,
                  key: i.key,
                  contentType: a.type,
                  fileName: a.name,
                  size: a.size,
                })
              : await s.adminApi.confirmCivilServantKycDocument(l, t, {
                  bucket: i.bucket,
                  key: i.key,
                  contentType: a.type,
                  fileName: a.name,
                  size: a.size,
                }),
              f((e) => ({ ...e, [t]: null })),
              await v());
          } catch (e) {
            p(e?.message ?? 'Unable to upload document.');
          } finally {
            b((e) => ({ ...e, [t]: !1 }));
          }
        },
        j = async (t) => {
          p(null);
          try {
            'customer' === e
              ? await r(`/customers/${l}/kyc/documents/${t}`)
              : await r(`/civil-servants/${l}/kyc/documents/${t}`);
          } catch (e) {
            p(e?.message ?? 'Unable to open document.');
          }
        },
        w = async (t) => {
          (p(null), b((e) => ({ ...e, [t]: !0 })));
          try {
            ('customer' === e
              ? await s.adminApi.deleteCustomerKycDocument(l, t)
              : await s.adminApi.deleteCivilServantKycDocument(l, t),
              f((e) => ({ ...e, [t]: null })),
              await v());
          } catch (e) {
            p(e?.message ?? 'Unable to delete document.');
          } finally {
            b((e) => ({ ...e, [t]: !1 }));
          }
        };
      return (0, t.jsx)(n, {
        status: y,
        missingCount: g.length,
        totalCount: 2,
        loading: c,
        error: u,
        onRefresh: () => void v(),
        children: (0, t.jsxs)('div', {
          className: 'space-y-4',
          children: [
            i.map((e) => {
              let a = o?.documents?.[e.type],
                s = !!x[e.type],
                l = h[e.type] ?? null;
              return (0, t.jsx)(
                'div',
                {
                  className: 'rounded-2xl border border-slate-100 bg-slate-50/50 p-4',
                  children: (0, t.jsxs)('div', {
                    className: 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
                    children: [
                      (0, t.jsxs)('div', {
                        className: 'space-y-1',
                        children: [
                          (0, t.jsx)('p', {
                            className: 'text-sm font-semibold text-slate-900',
                            children: e.label,
                          }),
                          (0, t.jsx)('p', {
                            className: 'text-xs text-slate-500',
                            children: e.hint,
                          }),
                          a?.uploadedAt
                            ? (0, t.jsxs)('p', {
                                className: 'text-xs text-slate-600',
                                children: [
                                  'Uploaded ',
                                  new Date(a.uploadedAt).toLocaleString('en-ZA'),
                                  a.fileName ? ` \xb7 ${a.fileName}` : '',
                                ],
                              })
                            : (0, t.jsx)('p', {
                                className: 'text-xs text-slate-600',
                                children: 'Not uploaded yet.',
                              }),
                        ],
                      }),
                      (0, t.jsxs)('div', {
                        className: 'flex flex-wrap items-center gap-2',
                        children: [
                          a?.key &&
                            (0, t.jsx)('button', {
                              type: 'button',
                              onClick: () => void j(e.type),
                              className:
                                'rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50',
                              children: 'View',
                            }),
                          (0, t.jsxs)('div', {
                            className: 'flex flex-col items-start',
                            children: [
                              (0, t.jsxs)('label', {
                                className:
                                  'cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50',
                                children: [
                                  (0, t.jsx)('input', {
                                    type: 'file',
                                    className: 'hidden',
                                    accept: 'application/pdf,image/jpeg,image/png',
                                    onChange: (t) => {
                                      let a = t.target.files?.[0] ?? null;
                                      (f((t) => ({ ...t, [e.type]: a })), (t.target.value = ''));
                                    },
                                    disabled: s,
                                  }),
                                  l ? 'Change file' : 'Choose file',
                                ],
                              }),
                              l?.name &&
                                (0, t.jsx)('p', {
                                  className:
                                    'mt-2 max-w-[240px] truncate text-xs font-medium text-slate-500',
                                  title: l.name,
                                  children: l.name,
                                }),
                            ],
                          }),
                          (0, t.jsx)('button', {
                            type: 'button',
                            onClick: () => void N(e.type),
                            className:
                              'btn-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60',
                            disabled: s || !l,
                            children: s ? 'Uploading...' : 'Upload',
                          }),
                          a?.key &&
                            (0, t.jsx)('button', {
                              type: 'button',
                              onClick: () => void w(e.type),
                              className:
                                'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50',
                              title: 'Delete document',
                              'aria-label': `Delete ${e.label}`,
                              disabled: s,
                              children: '🗑',
                            }),
                        ],
                      }),
                    ],
                  }),
                },
                e.type
              );
            }),
            !c &&
              !o &&
              (0, t.jsx)('p', {
                className: 'text-sm text-slate-500',
                children: 'KYC information is unavailable for this profile right now.',
              }),
          ],
        }),
      });
    }
    e.s(['DashboardKycCard', () => o]);
  },
  9035,
  36484,
  (e) => {
    'use strict';
    var t = e.i(43476);
    let a = (e) =>
      new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(e);
    function s({ name: e, status: a, accountNumber: s, extra: l }) {
      let i = 'inactive' === (a ?? '').toLowerCase(),
        r = (a ?? '').replace(/-/g, ' ').replace(/\b\w/g, (e) => e.toUpperCase());
      return (0, t.jsx)('div', {
        className:
          'w-full max-w-4xl self-center rounded-3xl border border-orange-100 bg-white p-6 shadow-sm',
        children: (0, t.jsxs)('div', {
          className: 'flex flex-col gap-3 md:flex-row md:items-center md:justify-between',
          children: [
            (0, t.jsxs)('div', {
              children: [
                (0, t.jsx)('p', { className: 'text-lg font-semibold text-slate-900', children: e }),
                s &&
                  (0, t.jsx)('p', {
                    className: 'text-xs font-semibold uppercase tracking-wide text-slate-500',
                    children: s,
                  }),
              ],
            }),
            (0, t.jsxs)('div', {
              className: 'flex flex-wrap items-center gap-2',
              children: [
                a &&
                  (0, t.jsxs)('span', {
                    className: `inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${i ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`,
                    children: ['Status: ', r],
                  }),
                l,
              ],
            }),
          ],
        }),
      });
    }
    function l({
      title: e = 'Profile',
      collapsed: a,
      onToggle: s,
      fields: l,
      children: i,
      actions: r,
      onRefresh: n,
      refreshing: o,
      editing: d,
      onFieldChange: c,
      footer: m,
    }) {
      let u = d ?? !1;
      return (0, t.jsxs)('section', {
        className:
          'w-full max-w-4xl self-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm',
        children: [
          (0, t.jsxs)('header', {
            className: 'flex items-center justify-between gap-3 border-b border-slate-100 pb-3',
            children: [
              (0, t.jsx)('p', {
                className: 'text-xs uppercase tracking-[0.35em] text-slate-400',
                children: e,
              }),
              (0, t.jsxs)('div', {
                className: 'flex items-center gap-2',
                children: [
                  n &&
                    (0, t.jsx)('button', {
                      type: 'button',
                      onClick: n,
                      disabled: o,
                      className:
                        'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50',
                      'aria-label': 'Refresh profile',
                      title: 'Refresh profile',
                      children: o ? '⟳' : '⟲',
                    }),
                  r,
                  (0, t.jsx)('button', {
                    type: 'button',
                    onClick: s,
                    className: 'text-sm font-semibold text-orange-600',
                    children: a ? '▼' : '▲',
                  }),
                ],
              }),
            ],
          }),
          !a &&
            (0, t.jsxs)('div', {
              className: 'mt-6 space-y-4',
              children: [
                (0, t.jsx)('div', {
                  className: 'grid gap-4 md:grid-cols-2',
                  children: l.map((e, a) =>
                    (0, t.jsxs)(
                      'div',
                      {
                        className: `flex flex-col ${2 === e.span ? 'md:col-span-2' : ''}`,
                        children: [
                          (0, t.jsx)('span', {
                            className: 'text-xs font-semibold text-slate-600',
                            children: e.label,
                          }),
                          (0, t.jsx)('input', {
                            value:
                              null === e.value || void 0 === e.value || '' === e.value
                                ? '—'
                                : String(e.value),
                            disabled: !u,
                            onChange:
                              u && c && (e.id ?? e.label)
                                ? (t) => c(e.id ?? e.label, t.target.value)
                                : void 0,
                            className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${u ? 'bg-white' : 'bg-slate-50'} ${e.mono ? 'font-mono' : ''}`,
                          }),
                        ],
                      },
                      `${e.id ?? e.label}-${a}`
                    )
                  ),
                }),
                m,
                i,
              ],
            }),
        ],
      });
    }
    function i({
      title: e = 'Payments',
      collapsed: s,
      onToggle: l,
      balance: i,
      availableBalance: r,
      metrics: n,
      actions: o,
      rightActions: d,
      transactions: c,
      loading: m,
      emptyLabel: u = 'No transactions yet.',
      pagination: p,
      showBalanceColumn: x = !0,
      showExpiresColumn: b = !1,
      showAvailableBalanceColumn: h = !1,
    }) {
      let f =
          n && n.length > 0
            ? n
            : [
                ...(void 0 !== i ? [{ label: 'Balance', value: i }] : []),
                ...(void 0 !== r ? [{ label: 'Available Balance', value: r }] : []),
              ],
        v = 7 + +!!x + +!!h + +!!b,
        y = c.slice(0, 10);
      return (0, t.jsxs)('section', {
        className:
          'w-full max-w-4xl self-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm',
        children: [
          (0, t.jsxs)('header', {
            className:
              'grid items-center gap-3 border-b border-slate-100 pb-3 sm:grid-cols-[1fr_auto_1fr]',
            children: [
              (0, t.jsx)('p', {
                className: 'whitespace-pre-line text-xs uppercase tracking-[0.35em] text-slate-400',
                children: e,
              }),
              (0, t.jsx)('div', {
                className: 'flex flex-wrap items-center justify-center gap-6',
                children: f.map((e) =>
                  (0, t.jsxs)(
                    'div',
                    {
                      className: 'flex flex-col items-center text-center',
                      children: [
                        (0, t.jsx)('span', {
                          className: 'text-xs font-semibold uppercase tracking-wide text-slate-500',
                          children: e.label,
                        }),
                        (0, t.jsx)('span', {
                          className: 'text-lg font-semibold text-slate-900',
                          children: a(e.value),
                        }),
                      ],
                    },
                    e.label
                  )
                ),
              }),
              (0, t.jsxs)('div', {
                className: 'flex flex-wrap items-center justify-end gap-2',
                children: [
                  o,
                  d,
                  (0, t.jsx)('button', {
                    type: 'button',
                    onClick: l,
                    className: 'text-sm font-semibold text-orange-600',
                    children: s ? '▼' : '▲',
                  }),
                ],
              }),
            ],
          }),
          !s &&
            (0, t.jsx)('div', {
              className: 'mt-6 overflow-hidden rounded-2xl border border-slate-100',
              children: (0, t.jsx)('div', {
                className: 'overflow-x-auto',
                children: (0, t.jsxs)('div', {
                  className: 'max-h-[520px] overflow-y-auto',
                  children: [
                    (0, t.jsxs)('table', {
                      className: 'min-w-full divide-y divide-slate-100 text-sm',
                      children: [
                        (0, t.jsx)('thead', {
                          className:
                            'bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
                          children: (0, t.jsxs)('tr', {
                            children: [
                              (0, t.jsx)('th', { className: 'px-4 py-3', children: 'Date' }),
                              (0, t.jsx)('th', { className: 'px-4 py-3', children: 'Amount' }),
                              x &&
                                (0, t.jsx)('th', { className: 'px-4 py-3', children: 'Balance' }),
                              h &&
                                (0, t.jsx)('th', { className: 'px-4 py-3', children: 'Available' }),
                              (0, t.jsx)('th', { className: 'px-4 py-3', children: 'Id' }),
                              (0, t.jsx)('th', { className: 'px-4 py-3', children: 'Type' }),
                              (0, t.jsx)('th', { className: 'px-4 py-3', children: 'Description' }),
                              (0, t.jsx)('th', { className: 'px-4 py-3', children: 'Reference' }),
                              b &&
                                (0, t.jsx)('th', { className: 'px-4 py-3', children: 'Expires' }),
                              (0, t.jsx)('th', { className: 'px-4 py-3', children: 'Status' }),
                            ],
                          }),
                        }),
                        (0, t.jsxs)('tbody', {
                          className: 'divide-y divide-slate-100 bg-white',
                          children: [
                            m &&
                              (0, t.jsx)('tr', {
                                children: (0, t.jsx)('td', {
                                  colSpan: v,
                                  className: 'px-4 py-4 text-sm text-slate-500',
                                  children: 'Loading transactions...',
                                }),
                              }),
                            !m &&
                              0 === c.length &&
                              (0, t.jsx)('tr', {
                                children: (0, t.jsx)('td', {
                                  colSpan: v,
                                  className: 'px-4 py-4 text-sm text-slate-500',
                                  children: u,
                                }),
                              }),
                            !m &&
                              y.map((e) => {
                                let s = (e.status ?? '').toUpperCase(),
                                  l =
                                    'SUCCESSFUL' === s
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : s.includes('PEND')
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-sky-100 text-sky-700';
                                return (0, t.jsxs)(
                                  'tr',
                                  {
                                    children: [
                                      (0, t.jsx)('td', {
                                        className: 'px-4 py-3 text-slate-600',
                                        children: e.createdAt
                                          ? new Date(e.createdAt).toLocaleString('en-ZA', {
                                              year: 'numeric',
                                              month: '2-digit',
                                              day: '2-digit',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })
                                          : '—',
                                      }),
                                      (0, t.jsx)('td', {
                                        className: 'px-4 py-3 font-semibold text-slate-900',
                                        children: a(e.amount),
                                      }),
                                      x &&
                                        (0, t.jsx)('td', {
                                          className: 'px-4 py-3 font-semibold text-slate-900',
                                          children: void 0 !== e.balance ? a(e.balance) : '—',
                                        }),
                                      h &&
                                        (0, t.jsx)('td', {
                                          className: 'px-4 py-3 font-semibold text-slate-900',
                                          children:
                                            void 0 !== e.availableBalance
                                              ? a(e.availableBalance)
                                              : '—',
                                        }),
                                      (0, t.jsxs)('td', {
                                        className: 'px-4 py-3 text-slate-800',
                                        children: [
                                          (0, t.jsx)('p', {
                                            className: 'font-semibold',
                                            children: e.id,
                                          }),
                                          (0, t.jsx)('p', {
                                            className: 'text-xs text-slate-500',
                                            children: e.externalId ?? e.reference ?? '',
                                          }),
                                        ],
                                      }),
                                      (0, t.jsx)('td', {
                                        className: 'px-4 py-3 text-slate-800',
                                        children: e.paymentType ?? '—',
                                      }),
                                      (0, t.jsx)('td', {
                                        className: 'px-4 py-3 text-slate-600',
                                        children: e.description ?? '—',
                                      }),
                                      (0, t.jsx)('td', {
                                        className: 'px-4 py-3 text-slate-600',
                                        children: e.reference ?? e.externalId ?? '—',
                                      }),
                                      b &&
                                        (0, t.jsx)('td', {
                                          className: 'px-4 py-3 text-slate-600',
                                          children: e.expiresAt
                                            ? new Date(e.expiresAt).toLocaleString('en-ZA', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })
                                            : '—',
                                        }),
                                      (0, t.jsx)('td', {
                                        className: 'px-4 py-3',
                                        children: (0, t.jsx)('span', {
                                          className: `rounded-full px-3 py-1 text-xs font-semibold ${l}`,
                                          children: e.status ?? 'unknown',
                                        }),
                                      }),
                                    ],
                                  },
                                  e.id
                                );
                              }),
                          ],
                        }),
                      ],
                    }),
                    p &&
                      (0, t.jsxs)('div', {
                        className:
                          'flex items-center justify-between px-4 py-3 text-sm text-slate-600',
                        children: [
                          (0, t.jsx)('button', {
                            type: 'button',
                            onClick: p.onPrev,
                            className:
                              'rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50',
                            disabled: !p.hasPrev || p.disabled,
                            children: 'Previous',
                          }),
                          (0, t.jsx)('button', {
                            type: 'button',
                            onClick: p.onNext,
                            className:
                              'rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50',
                            disabled: !p.hasNext || p.disabled,
                            children: 'Next',
                          }),
                        ],
                      }),
                  ],
                }),
              }),
            }),
        ],
      });
    }
    e.s(
      [
        'DashboardNameCard',
        () => s,
        'DashboardPaymentsCard',
        () => i,
        'DashboardProfileCard',
        () => l,
        'formatCurrency',
        0,
        a,
      ],
      9035
    );
    let r = (e) => {
      if (null == e) return;
      if ('number' == typeof e && !Number.isNaN(e)) return e;
      if ('object' == typeof e) {
        if (void 0 !== e.value) return r(e.value);
        if (void 0 !== e.amount) return r(e.amount);
        if (void 0 !== e.balance) return r(e.balance);
      }
      let t = String(e).match(/-?[\d.,]+/);
      if (!t) return;
      let a = Number(t[0].replace(/,/g, ''));
      return Number.isNaN(a) ? void 0 : a;
    };
    e.s(
      [
        'mapDashboardTransactions',
        0,
        (e = []) =>
          e.map((e) => {
            let t =
              e.metadata?.civilServantName ??
              e.raw?.civilServantName ??
              e.raw?.recipientName ??
              void 0;
            return {
              id: e.paymentId ?? e.externalId ?? crypto.randomUUID(),
              amount: r(e.amount) ?? 0,
              status: e.status ?? 'UNKNOWN',
              createdAt: e.createdAt ?? e.raw?.created,
              expiresAt:
                e.expiresAt ??
                e.expiryDate ??
                e.expiry ??
                e.raw?.expiresAt ??
                e.raw?.expiry ??
                e.raw?.expiresOn ??
                e.raw?.expiryDate,
              paymentType: e.paymentType ?? e.raw?.type,
              externalId: e.externalId ?? e.raw?.paymentReference ?? e.raw?.externalUniqueId,
              balance:
                r(e.balance) ??
                r(e.raw?.balance) ??
                r(e.raw?.balanceAfter) ??
                r(e.raw?.balanceAmount) ??
                r(e.raw?.walletBalance) ??
                r(e.raw?.currentBalance) ??
                r(e.raw?.availableBalance),
              availableBalance:
                r(e.availableBalance) ??
                r(e.raw?.availableBalance) ??
                r(e.raw?.balanceAmountAvailable) ??
                r(e.raw?.currentBalance),
              description:
                e.raw?.description ?? e.metadata?.description ?? (t ? `Payment to ${t}` : ''),
              reference:
                e.raw?.paymentReference ?? e.raw?.externalUniqueId ?? e.externalId ?? e.paymentId,
              civilServantId:
                e.civilServantId ?? e.metadata?.civilServantId ?? e.raw?.civilServantId ?? void 0,
              civilServantName: t,
            };
          }),
      ],
      36484
    );
  },
  85351,
  (e) => {
    'use strict';
    var t = e.i(14983);
    let a = (0, e.i(75863).resolveAppApiRoot)(),
      s = async (e, s = {}) => {
        let l = (0, t.getSession)();
        if (!l) throw Error('Not authenticated');
        let i = { ...s.headers, Authorization: `Bearer ${l.accessToken}` },
          r = await fetch(`${a}${e}`, { ...s, headers: i });
        if (!r.ok)
          throw (
            401 === r.status && ((0, t.clearSession)(), (window.location.href = '/login')),
            Error((await r.text()) || 'Request failed')
          );
        if (204 !== r.status) return await r.json();
      };
    e.s([
      'customerApi',
      0,
      {
        getProfile: () => s('/customers/me'),
        getTransactions: (e) => {
          let t = new URLSearchParams();
          (e?.offset !== void 0 && t.append('offset', String(e.offset)),
            e?.limit !== void 0 && t.append('limit', String(e.limit)));
          let a = t.toString() ? `?${t.toString()}` : '';
          return s(`/customers/me/transactions${a}`);
        },
        getSentTransactions: (e) => {
          let t = new URLSearchParams();
          (e?.offset !== void 0 && t.append('offset', String(e.offset)),
            e?.limit !== void 0 && t.append('limit', String(e.limit)));
          let a = t.toString() ? `?${t.toString()}` : '';
          return s(`/customers/me/transactions/sent${a}`);
        },
        getWalletInfo: () => s('/customers/me/wallet'),
        updateProfile: (e) =>
          s('/customers/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(e),
          }),
        searchCivilServants: (e) => {
          let t = new URLSearchParams();
          (e.firstName && t.append('firstName', e.firstName),
            e.familyName && t.append('familyName', e.familyName),
            e.occupation && t.append('occupation', e.occupation),
            e.site && t.append('site', e.site));
          let a = t.toString() ? `?${t.toString()}` : '';
          return s(`/civil-servants/lookup${a}`);
        },
        getKyc: () => s('/customers/me/kyc'),
        presignKycDocument: (e, t) =>
          s(`/customers/me/kyc/documents/${e}/presign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          }),
        confirmKycDocument: (e, t) =>
          s(`/customers/me/kyc/documents/${e}/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          }),
        getKycDocumentUrl: (e) => s(`/customers/me/kyc/documents/${e}`),
        deleteKycDocument: (e) => s(`/customers/me/kyc/documents/${e}`, { method: 'DELETE' }),
      },
    ]);
  },
  28339,
  (e) => {
    'use strict';
    var t = e.i(14983);
    let a = (0, e.i(75863).resolveAppApiRoot)(),
      s = async (e, s = {}) => {
        let l = (0, t.getSession)();
        if (!l) throw Error('Not authenticated');
        let i = { ...s.headers, Authorization: `Bearer ${l.accessToken}` },
          r = await fetch(`${a}${e}`, { ...s, headers: i });
        if (!r.ok)
          throw (
            401 === r.status && ((0, t.clearSession)(), (window.location.href = '/login')),
            Error((await r.text()) || 'Request failed')
          );
        if (204 !== r.status) return await r.json();
      };
    e.s([
      'guardApi',
      0,
      {
        getProfile: () => s('/civil-servants/me'),
        getQrCode: () => s('/civil-servants/me/qr-code'),
        getTransactions: (e) => {
          let t = new URLSearchParams();
          (e?.offset !== void 0 && t.append('offset', String(e.offset)),
            e?.limit !== void 0 && t.append('limit', String(e.limit)));
          let a = t.toString() ? `?${t.toString()}` : '';
          return s(`/civil-servants/me/transactions${a}`);
        },
        getPendingTransactions: (e) => {
          let t = new URLSearchParams();
          (e?.offset !== void 0 && t.append('offset', String(e.offset)),
            e?.limit !== void 0 && t.append('limit', String(e.limit)));
          let a = t.toString() ? `?${t.toString()}` : '';
          return s(`/civil-servants/me/transactions/pending${a}`);
        },
        getPayoutInfo: () => s('/civil-servants/me/payout'),
        updateProfile: (e) =>
          s('/civil-servants/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(e),
          }),
        requestPayout: (e) =>
          s('/civil-servants/me/payout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(e),
          }),
        getKyc: () => s('/civil-servants/me/kyc'),
        presignKycDocument: (e, t) =>
          s(`/civil-servants/me/kyc/documents/${e}/presign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          }),
        confirmKycDocument: (e, t) =>
          s(`/civil-servants/me/kyc/documents/${e}/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          }),
        getKycDocumentUrl: (e) => s(`/civil-servants/me/kyc/documents/${e}`),
        deleteKycDocument: (e) => s(`/civil-servants/me/kyc/documents/${e}`, { method: 'DELETE' }),
      },
    ]);
  },
  41421,
  (e) => {
    'use strict';
    var t = e.i(43476),
      a = e.i(57688);
    function s({
      title: e = 'Profile',
      data: s,
      collapsed: l,
      onToggle: i,
      editing: r,
      onEditToggle: n,
      onFieldChange: o,
      onCancel: d,
      onSave: c,
      saving: m,
      feedback: u,
      showWorkFields: p = !0,
      showPrimarySite: x = !0,
      occupationOptions: b,
      showWalletId: h = !0,
      showEclipseAccount: f = !1,
      onViewQr: v,
      onGenerateQr: y,
      qrLoading: g,
      canViewQr: N,
      onRefresh: j,
      refreshing: w,
    }) {
      let S = !!s.qrUrl,
        C = v && (S || N);
      return (0, t.jsxs)('section', {
        className:
          'w-full max-w-4xl self-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm',
        children: [
          (0, t.jsxs)('header', {
            className: 'flex items-center justify-between gap-3 border-b border-slate-100 pb-3',
            children: [
              (0, t.jsx)('div', {
                className: 'flex items-center gap-2',
                children: (0, t.jsx)('p', {
                  className: 'text-xs uppercase tracking-[0.35em] text-slate-400',
                  children: e,
                }),
              }),
              (0, t.jsxs)('div', {
                className: 'flex items-center gap-2',
                children: [
                  j &&
                    (0, t.jsx)('button', {
                      type: 'button',
                      onClick: j,
                      disabled: w,
                      className:
                        'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50',
                      'aria-label': 'Refresh profile',
                      title: 'Refresh profile',
                      children: w ? '⟳' : '⟲',
                    }),
                  (0, t.jsx)('button', {
                    type: 'button',
                    onClick: n,
                    className:
                      'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50',
                    'aria-label': 'Edit profile',
                    title: 'Edit profile',
                    children: '✎',
                  }),
                  (0, t.jsx)('button', {
                    type: 'button',
                    onClick: i,
                    className: 'text-sm font-semibold text-orange-600',
                    children: l ? '▼' : '▲',
                  }),
                ],
              }),
            ],
          }),
          !l &&
            (0, t.jsxs)('div', {
              className: 'mt-6 space-y-4',
              children: [
                (0, t.jsxs)('div', {
                  className: 'grid gap-4 md:grid-cols-2',
                  children: [
                    (0, t.jsxs)('label', {
                      className: 'text-xs font-semibold text-slate-600',
                      children: [
                        'First Name',
                        (0, t.jsx)('input', {
                          value: s.firstName,
                          onChange: (e) => o('firstName', e.target.value),
                          disabled: !r,
                          className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${r ? 'bg-white' : 'bg-slate-50'}`,
                        }),
                      ],
                    }),
                    (0, t.jsxs)('label', {
                      className: 'text-xs font-semibold text-slate-600',
                      children: [
                        'Last Name',
                        (0, t.jsx)('input', {
                          value: s.familyName,
                          onChange: (e) => o('familyName', e.target.value),
                          disabled: !r,
                          className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${r ? 'bg-white' : 'bg-slate-50'}`,
                        }),
                      ],
                    }),
                  ],
                }),
                (p || x) &&
                  (0, t.jsxs)('div', {
                    className: 'grid gap-4 md:grid-cols-2',
                    children: [
                      p &&
                        (0, t.jsxs)('label', {
                          className: 'text-xs font-semibold text-slate-600',
                          children: [
                            'Occupation',
                            (0, t.jsx)('select', {
                              value: s.occupation ?? '',
                              onChange: (e) => o('occupation', e.target.value),
                              disabled: !r,
                              className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${r ? 'bg-white' : 'bg-slate-50'}`,
                              children: (
                                b ?? [
                                  { value: '', label: 'Select occupation' },
                                  { value: 'Security Guard', label: 'Security Guard' },
                                  { value: 'Parking Attendant', label: 'Parking Attendant' },
                                  { value: 'Golf Caddy', label: 'Golf Caddy' },
                                  { value: 'Traffic Controller', label: 'Traffic Controller' },
                                  { value: 'Unemployed', label: 'Unemployed' },
                                  { value: 'Other', label: 'Other' },
                                ]
                              ).map((e) =>
                                (0, t.jsx)(
                                  'option',
                                  { value: e.value, children: e.label },
                                  e.value || e.label
                                )
                              ),
                            }),
                          ],
                        }),
                      x &&
                        (0, t.jsxs)('label', {
                          className: 'text-xs font-semibold text-slate-600',
                          children: [
                            'Primary Site',
                            (0, t.jsx)('input', {
                              value: s.primarySite ?? '',
                              onChange: (e) => o('primarySite', e.target.value),
                              disabled: !r,
                              className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${r ? 'bg-white' : 'bg-slate-50'}`,
                            }),
                          ],
                        }),
                    ],
                  }),
                (0, t.jsxs)('div', {
                  className: 'grid gap-4 md:grid-cols-2',
                  children: [
                    (0, t.jsxs)('label', {
                      className: 'text-xs font-semibold text-slate-600',
                      children: [
                        'Email',
                        (0, t.jsx)('input', {
                          type: 'email',
                          value: s.email ?? '',
                          onChange: (e) => o('email', e.target.value),
                          disabled: !r,
                          className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${r ? 'bg-white' : 'bg-slate-50'}`,
                        }),
                      ],
                    }),
                    (0, t.jsxs)('label', {
                      className: 'text-xs font-semibold text-slate-600',
                      children: [
                        'Phone',
                        (0, t.jsx)('input', {
                          value: s.phoneNumber ?? '',
                          onChange: (e) => o('phoneNumber', e.target.value),
                          disabled: !r,
                          className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${r ? 'bg-white' : 'bg-slate-50'}`,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, t.jsxs)('label', {
                  className: 'text-xs font-semibold text-slate-600',
                  children: [
                    'Home Address',
                    (0, t.jsx)('input', {
                      value: s.homeAddress ?? '',
                      onChange: (e) => o('homeAddress', e.target.value),
                      disabled: !r,
                      className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${r ? 'bg-white' : 'bg-slate-50'}`,
                    }),
                  ],
                }),
                (0, t.jsxs)('div', {
                  className: `grid gap-4 ${h ? 'md:grid-cols-3' : 'md:grid-cols-2'}`,
                  children: [
                    (0, t.jsxs)('label', {
                      className: 'text-xs font-semibold text-slate-600',
                      children: [
                        'Pashasha Account',
                        (0, t.jsx)('input', {
                          value: s.accountNumber ?? 'Not issued',
                          disabled: !0,
                          className:
                            'mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700',
                        }),
                      ],
                    }),
                    h &&
                      (0, t.jsxs)('label', {
                        className: 'text-xs font-semibold text-slate-600',
                        children: [
                          'Pashasha Wallet ID',
                          (0, t.jsx)('input', {
                            value: s.walletId ?? 'Not linked',
                            disabled: !0,
                            className:
                              'mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700',
                          }),
                        ],
                      }),
                    (0, t.jsxs)('label', {
                      className: 'text-xs font-semibold text-slate-600',
                      children: [
                        'Pashasha Token',
                        (0, t.jsx)('input', {
                          value: s.guardToken ?? 'Not issued',
                          disabled: !0,
                          className:
                            'mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700',
                        }),
                      ],
                    }),
                  ],
                }),
                (r || c || d || u) &&
                  (0, t.jsxs)('div', {
                    className: 'flex flex-wrap items-center justify-between gap-3',
                    children: [
                      u &&
                        (0, t.jsx)('p', {
                          className: `text-sm ${u.includes('updated') ? 'text-emerald-600' : 'text-rose-600'}`,
                          children: u,
                        }),
                      r &&
                        (0, t.jsxs)('div', {
                          className: 'flex items-center gap-2',
                          children: [
                            d &&
                              (0, t.jsx)('button', {
                                type: 'button',
                                onClick: d,
                                className:
                                  'rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50',
                                children: 'Cancel',
                              }),
                            c &&
                              (0, t.jsx)('button', {
                                type: 'button',
                                onClick: c,
                                disabled: m,
                                className:
                                  'btn-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60',
                                children: m ? 'Saving...' : 'Save profile',
                              }),
                          ],
                        }),
                    ],
                  }),
                (0, t.jsxs)('div', {
                  className: 'mt-2 rounded-2xl border border-slate-100 bg-slate-50 p-4',
                  children: [
                    (0, t.jsx)('p', {
                      className: 'text-xs font-semibold uppercase tracking-wide text-slate-500',
                      children: 'QR code',
                    }),
                    S
                      ? (0, t.jsxs)('div', {
                          className:
                            'mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4',
                          children: [
                            (0, t.jsx)('button', {
                              type: 'button',
                              onClick: () => v && v(),
                              className:
                                'inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-sky-300',
                              children: (0, t.jsx)(a.default, {
                                src: s.qrUrl,
                                alt: 'QR code',
                                className:
                                  'h-32 w-32 rounded-xl border border-slate-100 object-contain',
                                width: 128,
                                height: 128,
                              }),
                            }),
                            (0, t.jsxs)('div', {
                              className: 'flex flex-wrap items-center gap-2',
                              children: [
                                v &&
                                  (0, t.jsx)('button', {
                                    type: 'button',
                                    className:
                                      'btn-primary px-4 py-2 text-sm font-semibold text-white',
                                    onClick: () => v(),
                                    disabled: !C || !!g,
                                    children: g ? 'Loading...' : 'View QR image',
                                  }),
                                y &&
                                  (0, t.jsx)('button', {
                                    type: 'button',
                                    className:
                                      'btn-primary px-4 py-2 text-sm font-semibold text-white',
                                    onClick: () => y(),
                                    children: 'Generate QR code',
                                  }),
                              ],
                            }),
                          ],
                        })
                      : (0, t.jsxs)('div', {
                          className:
                            'mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
                          children: [
                            (0, t.jsx)('p', {
                              className: 'text-sm text-slate-600',
                              children: 'QR code not generated yet.',
                            }),
                            (0, t.jsx)('div', {
                              className: 'flex flex-wrap gap-2',
                              children:
                                y &&
                                (0, t.jsx)('button', {
                                  type: 'button',
                                  className:
                                    'btn-primary px-4 py-2 text-sm font-semibold text-white',
                                  onClick: () => y(),
                                  children: 'Generate QR code',
                                }),
                            }),
                          ],
                        }),
                  ],
                }),
                f &&
                  s.eclipseCustomerId &&
                  (0, t.jsxs)('div', {
                    className: 'space-y-1',
                    children: [
                      (0, t.jsx)('p', {
                        className: 'text-[11px] uppercase tracking-[0.15em] text-slate-500',
                        children: 'Eclipse account',
                      }),
                      (0, t.jsx)('p', {
                        className: 'text-sm font-semibold text-slate-800 md:text-base',
                        children: s.eclipseCustomerId,
                      }),
                    ],
                  }),
              ],
            }),
        ],
      });
    }
    e.s(['CivilServantProfileCard', () => s]);
  },
  96601,
  (e) => {
    'use strict';
    var t = e.i(43476),
      a = e.i(71645),
      s = e.i(26048),
      l = e.i(57688),
      i = e.i(9035),
      r = e.i(41421),
      n = e.i(36484),
      o = e.i(53756),
      d = e.i(10584);
    function c() {
      let e = (0, d.eclipseEnabled)(),
        [c, m] = (0, a.useState)({
          firstName: '',
          familyName: '',
          email: '',
          phoneNumber: '',
          occupation: '',
          address: '',
        }),
        [u, p] = (0, a.useState)({ accountNumber: '', familyName: '' }),
        [x, b] = (0, a.useState)([]),
        [h, f] = (0, a.useState)(null),
        [v, y] = (0, a.useState)(!1),
        [g, N] = (0, a.useState)(null),
        [j, w] = (0, a.useState)(null),
        [S, C] = (0, a.useState)(null),
        [k, $] = (0, a.useState)(null),
        [P, A] = (0, a.useState)(!1),
        [T, D] = (0, a.useState)(!1),
        [I, U] = (0, a.useState)([]),
        [R, E] = (0, a.useState)(!1),
        [K, O] = (0, a.useState)([]),
        [L, B] = (0, a.useState)(!1),
        [q, J] = (0, a.useState)(null),
        [Q, F] = (0, a.useState)(!1),
        [G, W] = (0, a.useState)(!1),
        [z, V] = (0, a.useState)(!0),
        [M, Z] = (0, a.useState)(!1),
        [_, Y] = (0, a.useState)(!1),
        [H, X] = (0, a.useState)(!1),
        [ee, et] = (0, a.useState)({
          firstName: '',
          familyName: '',
          email: '',
          phoneNumber: '',
          occupation: '',
          primarySite: '',
          address: '',
          homeAddress: '',
        }),
        ea = async (e) => {
          (e.preventDefault(), w(null), N(null));
          try {
            if (!c.email.trim()) return void w('Email is required');
            let e = await s.adminApi.checkEmail(c.email.trim());
            if (e.exists)
              return void w(
                `The email address is already registered as a ${e.type ?? 'user'}, please choose another address.`
              );
            (await s.adminApi.createCivilServant({
              ...c,
              phoneNumber: c.phoneNumber || void 0,
              occupation: c.occupation || void 0,
              address: c.address || void 0,
            }),
              N('Civil servant provisioning started. You will receive credentials once ready.'),
              m({
                firstName: '',
                familyName: '',
                email: '',
                phoneNumber: '',
                occupation: '',
                address: '',
              }),
              f(null),
              b((e) => e),
              C(null),
              $(null),
              D(!1));
          } catch (e) {
            w(e?.message ?? 'Unable to create civil servant.');
          }
        },
        es = async (e) => {
          (e.preventDefault(), w(null), f(null), y(!0));
          try {
            let e = await s.adminApi.searchCivilServants(u);
            b(Array.isArray(e) ? e : []);
          } catch (e) {
            w(e?.message ?? 'Unable to search.');
          } finally {
            y(!1);
          }
        },
        el = async (e) => {
          if (confirm('Delete this civil servant?')) {
            w(null);
            try {
              (await s.adminApi.deleteCivilServant(e),
                b((t) => t.filter((t) => t.civilServantId !== e)),
                h?.civilServantId === e && f(null),
                N('Civil servant deleted.'),
                C(null),
                $(null));
            } catch (e) {
              w(e?.message ?? 'Unable to delete civil servant.');
            }
          }
        },
        ei = async (e) => {
          (w(null), N(null));
          try {
            let t = await s.adminApi.generateCivilServantQr(e);
            (f(t),
              b((e) => e.map((e) => (e.civilServantId === t.civilServantId ? t : e))),
              N('QR code regenerated and uploaded.'),
              C(null),
              $(null));
          } catch (e) {
            w(e?.message ?? 'Unable to generate QR code.');
          }
        },
        er = async (e, t = !1) => {
          A(!0);
          try {
            let a = await s.adminApi.getCivilServantQr(e);
            ($(a.url), t && C(a.url));
          } catch (e) {
            (t && w(e?.message ?? 'Unable to load QR code.'), $(null));
          } finally {
            A(!1);
          }
        };
      ((0, a.useEffect)(() => {
        (h?.civilServantId && h.qrCodeKey ? er(h.civilServantId) : $(null),
          h &&
            (et({
              firstName: h.firstName ?? '',
              familyName: h.familyName ?? '',
              email: h.email ?? '',
              phoneNumber: h.phoneNumber ?? '',
              occupation: h.occupation ?? '',
              primarySite: h.primarySite ?? h.address ?? '',
              address: h.address ?? '',
              homeAddress: h.homeAddress ?? h.address ?? '',
            }),
            Z(!1),
            Y(!1)));
      }, [h?.civilServantId, h?.qrCodeKey]),
        (0, a.useEffect)(() => {
          (async () => {
            if (!h?.civilServantId || !e) {
              (U([]), O([]), J(null));
              return;
            }
            (E(!0), B(!0));
            try {
              let [e, t, a] = await Promise.all([
                s.adminApi.getCivilServantTransactions(h.civilServantId),
                s.adminApi.getCivilServantPendingTransactions(h.civilServantId, {
                  limit: 25,
                  offset: 0,
                }),
                s.adminApi.getCivilServantPayout(h.civilServantId),
              ]);
              (U((0, n.mapDashboardTransactions)(e ?? [])),
                O((0, n.mapDashboardTransactions)(t ?? [])),
                J(a ?? null));
            } catch (e) {
              (w(e?.message ?? 'Unable to load transactions.'), U([]), O([]), J(null));
            } finally {
              (E(!1), B(!1));
            }
          })();
        }, [e, h?.civilServantId]));
      let en = K.reduce((e, t) => {
          let a = Number(t.amount ?? 0);
          return e + (Number.isNaN(a) ? 0 : Math.abs(a));
        }, 0),
        eo = (0, a.useMemo)(
          () => (Array.isArray(x) ? x : []).filter((e) => !!e?.civilServantId),
          [x]
        ),
        ed = async () => {
          if (h) {
            (Y(!0), w(null), N(null));
            try {
              let e = await s.adminApi.updateCivilServant(h.civilServantId, {
                firstName: ee.firstName,
                familyName: ee.familyName,
                email: ee.email,
                phoneNumber: ee.phoneNumber || void 0,
                occupation: ee.occupation || void 0,
                primarySite: ee.primarySite || void 0,
                address: ee.address || void 0,
                homeAddress: ee.homeAddress || void 0,
              });
              (f(e),
                b((t) => t.map((t) => (t.civilServantId === e.civilServantId ? e : t))),
                Z(!1),
                N('Profile updated.'));
            } catch (e) {
              w(e?.message ?? 'Unable to update profile.');
            } finally {
              Y(!1);
            }
          }
        },
        ec = async () => {
          if (h?.civilServantId) {
            (X(!0), w(null));
            try {
              let e = await s.adminApi.getCivilServant(h.civilServantId);
              (f(e),
                b((t) => t.map((t) => (t.civilServantId === e.civilServantId ? e : t))),
                et({
                  firstName: e.firstName ?? '',
                  familyName: e.familyName ?? '',
                  email: e.email ?? '',
                  phoneNumber: e.phoneNumber ?? '',
                  occupation: e.occupation ?? '',
                  primarySite: e.primarySite ?? e.address ?? '',
                  address: e.address ?? '',
                  homeAddress: e.homeAddress ?? e.address ?? '',
                }));
            } catch (e) {
              w(e?.message ?? 'Unable to refresh profile.');
            } finally {
              X(!1);
            }
          }
        };
      return (0, t.jsxs)('div', {
        className: 'space-y-8',
        children: [
          (0, t.jsx)('div', {
            className: 'flex items-center justify-end',
            children: (0, t.jsxs)('button', {
              type: 'button',
              onClick: () => D(!0),
              className:
                'btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm',
              children: [
                (0, t.jsx)('span', { className: 'text-lg leading-none', children: '＋' }),
                ' Add civil servant',
              ],
            }),
          }),
          (0, t.jsxs)('form', {
            onSubmit: es,
            className: 'space-y-4 rounded-2xl border border-slate-200 bg-white p-6',
            children: [
              (0, t.jsx)('h2', {
                className: 'text-lg font-semibold text-slate-900',
                children: 'Search civil servants',
              }),
              (0, t.jsxs)('label', {
                className: 'text-sm font-semibold text-slate-600',
                children: [
                  'Account number',
                  (0, t.jsx)('input', {
                    value: u.accountNumber,
                    onChange: (e) => p((t) => ({ ...t, accountNumber: e.target.value })),
                    className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                  }),
                ],
              }),
              (0, t.jsxs)('label', {
                className: 'text-sm font-semibold text-slate-600',
                children: [
                  'Family name',
                  (0, t.jsx)('input', {
                    value: u.familyName,
                    onChange: (e) => p((t) => ({ ...t, familyName: e.target.value })),
                    className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                  }),
                ],
              }),
              (0, t.jsx)('button', {
                type: 'submit',
                className: 'btn-primary px-6 py-3 text-base font-semibold text-white',
                disabled: v,
                children: v ? 'Searching...' : 'Search',
              }),
            ],
          }),
          (0, t.jsxs)('div', {
            className: 'rounded-2xl border border-slate-200 bg-white',
            children: [
              (0, t.jsxs)('div', {
                className: 'flex items-center justify-between border-b border-slate-100 px-6 py-4',
                children: [
                  (0, t.jsx)('h3', {
                    className: 'text-lg font-semibold text-slate-900',
                    children: 'Results',
                  }),
                  (0, t.jsxs)('span', {
                    className: 'text-sm text-slate-500',
                    children: [eo.length, ' records'],
                  }),
                ],
              }),
              (0, t.jsxs)('ul', {
                children: [
                  eo.map((e) => {
                    let a = e.civilServantId;
                    return (0, t.jsxs)(
                      'li',
                      {
                        className: `flex items-center justify-between border-b border-slate-100 px-6 py-4 ${h?.civilServantId === a ? 'bg-orange-50' : ''}`,
                        children: [
                          (0, t.jsxs)('div', {
                            children: [
                              (0, t.jsxs)('p', {
                                className: 'text-base font-semibold text-slate-900',
                                children: [e.firstName, ' ', e.familyName],
                              }),
                              (0, t.jsx)('p', {
                                className: 'text-sm text-slate-500',
                                children: e.accountNumber,
                              }),
                            ],
                          }),
                          (0, t.jsxs)('div', {
                            className: 'flex gap-2',
                            children: [
                              (0, t.jsx)('button', {
                                type: 'button',
                                onClick: () => {
                                  (f(e), er(a));
                                },
                                className: 'btn-primary px-4 py-2 text-sm font-semibold text-white',
                                children: 'Details',
                              }),
                              (0, t.jsx)('button', {
                                type: 'button',
                                onClick: () => el(a),
                                className: 'btn-primary px-4 py-2 text-sm font-semibold text-white',
                                children: 'Delete',
                              }),
                            ],
                          }),
                        ],
                      },
                      a
                    );
                  }),
                  0 === eo.length &&
                    (0, t.jsx)('li', {
                      className: 'px-6 py-10 text-center text-sm text-slate-500',
                      children: 'No civil servants found.',
                    }),
                ],
              }),
            ],
          }),
          j &&
            (0, t.jsx)('p', {
              className: 'rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700',
              children: j,
            }),
          g &&
            (0, t.jsx)('p', {
              className: 'rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700',
              children: g,
            }),
          h &&
            (0, t.jsxs)('div', {
              className: 'space-y-6',
              children: [
                (0, t.jsx)(i.DashboardNameCard, {
                  name: `${h.firstName} ${h.familyName}`,
                  status: h.status ?? 'active',
                  accountNumber: h.accountNumber,
                }),
                (0, t.jsx)(r.CivilServantProfileCard, {
                  data: {
                    firstName: ee.firstName,
                    familyName: ee.familyName,
                    occupation: ee.occupation,
                    primarySite: ee.primarySite,
                    email: ee.email,
                    phoneNumber: ee.phoneNumber,
                    homeAddress: ee.homeAddress,
                    accountNumber: h.accountNumber ?? null,
                    walletId: e ? (h.eclipseWalletId ?? null) : null,
                    guardToken: h.guardToken ?? null,
                    eclipseCustomerId: e ? (h.eclipseCustomerId ?? null) : null,
                    eclipseWalletId: e ? (h.eclipseWalletId ?? null) : null,
                    qrUrl: k ?? null,
                  },
                  collapsed: Q,
                  onToggle: () => F((e) => !e),
                  editing: M,
                  onEditToggle: () => Z((e) => !e),
                  onFieldChange: (e, t) => {
                    et((a) => (e in a ? { ...a, [e]: t } : a));
                  },
                  onCancel: () => {
                    (h &&
                      et({
                        firstName: h.firstName ?? '',
                        familyName: h.familyName ?? '',
                        email: h.email ?? '',
                        phoneNumber: h.phoneNumber ?? '',
                        occupation: h.occupation ?? '',
                        primarySite: h.primarySite ?? h.address ?? '',
                        address: h.address ?? '',
                        homeAddress: h.homeAddress ?? h.address ?? '',
                      }),
                      Z(!1));
                  },
                  onSave: ed,
                  saving: _,
                  feedback: g,
                  showWorkFields: !0,
                  showEclipseAccount: e,
                  showWalletId: e,
                  onRefresh: ec,
                  refreshing: H,
                  onViewQr: () => h?.civilServantId && er(h.civilServantId, !0),
                  onGenerateQr: () => h?.civilServantId && ei(h.civilServantId),
                  qrLoading: P,
                  canViewQr: !!h?.qrCodeKey,
                }),
                (0, t.jsx)(o.DashboardKycCard, {
                  profileType: 'civil-servant',
                  profileId: h.civilServantId,
                }),
                e &&
                  (0, t.jsxs)(t.Fragment, {
                    children: [
                      (0, t.jsx)(i.DashboardPaymentsCard, {
                        title: 'Transaction history',
                        collapsed: G,
                        onToggle: () => W((e) => !e),
                        transactions: I,
                        loading: R,
                        metrics: q
                          ? [
                              { label: 'Balance', value: q.currentBalance ?? q.balance ?? 0 },
                              {
                                label: 'Available Balance',
                                value: q.availableBalance ?? q.currentBalance ?? q.balance ?? 0,
                              },
                            ]
                          : void 0,
                        actions: (0, t.jsxs)('span', {
                          className: 'text-xs text-slate-500',
                          children: ['Wallet: ', h.eclipseWalletId ?? '—'],
                        }),
                      }),
                      (0, t.jsx)(i.DashboardPaymentsCard, {
                        title: 'Reservations',
                        collapsed: z,
                        onToggle: () => V((e) => !e),
                        transactions: K,
                        loading: L,
                        emptyLabel: 'No reservations.',
                        metrics: q
                          ? [
                              { label: 'Balance', value: q.currentBalance ?? q.balance ?? 0 },
                              { label: 'Pending Reservations', value: en },
                              {
                                label: 'Available Balance',
                                value: q.availableBalance ?? q.currentBalance ?? q.balance ?? 0,
                              },
                            ]
                          : [{ label: 'Pending Reservations', value: en }],
                        actions: (0, t.jsxs)('span', {
                          className: 'text-xs text-slate-500',
                          children: ['Wallet: ', h.eclipseWalletId ?? '—'],
                        }),
                        showBalanceColumn: !1,
                        showExpiresColumn: !0,
                      }),
                    ],
                  }),
              ],
            }),
          S &&
            (0, t.jsx)('div', {
              className: 'fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4',
              role: 'button',
              tabIndex: -1,
              onClick: () => C(null),
              onKeyDown: (e) => 'Escape' === e.key && C(null),
              children: (0, t.jsxs)('div', {
                className: 'relative rounded-2xl bg-white p-4 shadow-lg',
                onClick: (e) => e.stopPropagation(),
                children: [
                  (0, t.jsx)('button', {
                    type: 'button',
                    onClick: () => C(null),
                    className:
                      'absolute right-2 top-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50',
                    children: 'Close',
                  }),
                  (0, t.jsx)(l.default, {
                    src: S,
                    alt: 'QR preview',
                    width: 288,
                    height: 288,
                    className: 'h-72 w-72 rounded-lg object-contain',
                  }),
                ],
              }),
            }),
          T &&
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
                        children: 'Create civil servant',
                      }),
                      (0, t.jsx)('button', {
                        type: 'button',
                        className: 'btn-primary px-4 py-2 text-sm font-semibold text-white',
                        onClick: () => D(!1),
                        children: 'Close',
                      }),
                    ],
                  }),
                  (0, t.jsxs)('form', {
                    onSubmit: ea,
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
                                value: c.firstName,
                                onChange: (e) => m((t) => ({ ...t, firstName: e.target.value })),
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
                                value: c.familyName,
                                onChange: (e) => m((t) => ({ ...t, familyName: e.target.value })),
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
                          'Email',
                          (0, t.jsx)('input', {
                            required: !0,
                            type: 'email',
                            value: c.email,
                            onChange: (e) => m((t) => ({ ...t, email: e.target.value })),
                            className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                          }),
                        ],
                      }),
                      (0, t.jsxs)('label', {
                        className: 'text-sm font-semibold text-slate-600',
                        children: [
                          'Occupation',
                          (0, t.jsx)('input', {
                            value: c.occupation,
                            onChange: (e) => m((t) => ({ ...t, occupation: e.target.value })),
                            className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                            placeholder: 'e.g. Security Guard',
                          }),
                        ],
                      }),
                      (0, t.jsxs)('div', {
                        className: 'grid gap-4 md:grid-cols-2',
                        children: [
                          (0, t.jsxs)('label', {
                            className: 'text-sm font-semibold text-slate-600',
                            children: [
                              'Phone',
                              (0, t.jsx)('input', {
                                value: c.phoneNumber,
                                onChange: (e) => m((t) => ({ ...t, phoneNumber: e.target.value })),
                                className:
                                  'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                              }),
                            ],
                          }),
                          (0, t.jsxs)('label', {
                            className: 'text-sm font-semibold text-slate-600',
                            children: [
                              'Primary site / address',
                              (0, t.jsx)('input', {
                                value: c.address,
                                onChange: (e) => m((t) => ({ ...t, address: e.target.value })),
                                className:
                                  'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, t.jsx)('button', {
                        type: 'submit',
                        className: 'btn-primary px-6 py-3 text-base font-semibold text-white',
                        children: 'Create civil servant',
                      }),
                    ],
                  }),
                ],
              }),
            }),
        ],
      });
    }
    e.s(['default', () => c]);
  },
]);
