(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  26048,
  (e) => {
    'use strict';
    var t = e.i(14983);
    let a = (0, e.i(75863).resolveAppApiRoot)(),
      s = async (e, s = {}, r = !0) => {
        let l = (0, t.getSession)(),
          i = { 'Content-Type': 'application/json', ...s.headers };
        if (r) {
          if (!l) throw Error('No active session');
          i.Authorization = `Bearer ${l.accessToken}`;
        }
        let n = await fetch(`${a}${e}`, { ...s, headers: i });
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
          let r = a.toString() ? `?${a.toString()}` : '';
          return s(`/civil-servants/${e}/transactions/pending${r}`);
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
          let r = a.toString() ? `?${a.toString()}` : '';
          return s(`/customers/${e}/transactions${r}`);
        },
        getCustomerPendingTransactions: (e, t) => {
          let a = new URLSearchParams();
          (t?.offset !== void 0 && a.set('offset', String(t.offset)),
            t?.limit !== void 0 && a.set('limit', String(t.limit)));
          let r = a.toString() ? `?${a.toString()}` : '';
          return s(`/customers/${e}/transactions/pending${r}`);
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
    function s({ name: e, status: a, accountNumber: s, extra: r }) {
      let l = 'inactive' === (a ?? '').toLowerCase(),
        i = (a ?? '').replace(/-/g, ' ').replace(/\b\w/g, (e) => e.toUpperCase());
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
                    className: `inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${l ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`,
                    children: ['Status: ', i],
                  }),
                r,
              ],
            }),
          ],
        }),
      });
    }
    function r({
      title: e = 'Profile',
      collapsed: a,
      onToggle: s,
      fields: r,
      children: l,
      actions: i,
      onRefresh: n,
      refreshing: o,
      editing: c,
      onFieldChange: d,
      footer: m,
    }) {
      let u = c ?? !1;
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
                  i,
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
                  children: r.map((e, a) =>
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
                              u && d && (e.id ?? e.label)
                                ? (t) => d(e.id ?? e.label, t.target.value)
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
                l,
              ],
            }),
        ],
      });
    }
    function l({
      title: e = 'Payments',
      collapsed: s,
      onToggle: r,
      balance: l,
      availableBalance: i,
      metrics: n,
      actions: o,
      rightActions: c,
      transactions: d,
      loading: m,
      emptyLabel: u = 'No transactions yet.',
      pagination: p,
      showBalanceColumn: x = !0,
      showExpiresColumn: b = !1,
      showAvailableBalanceColumn: f = !1,
    }) {
      let h =
          n && n.length > 0
            ? n
            : [
                ...(void 0 !== l ? [{ label: 'Balance', value: l }] : []),
                ...(void 0 !== i ? [{ label: 'Available Balance', value: i }] : []),
              ],
        y = 7 + +!!x + +!!f + +!!b,
        v = d.slice(0, 10);
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
                children: h.map((e) =>
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
                  c,
                  (0, t.jsx)('button', {
                    type: 'button',
                    onClick: r,
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
                              f &&
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
                                  colSpan: y,
                                  className: 'px-4 py-4 text-sm text-slate-500',
                                  children: 'Loading transactions...',
                                }),
                              }),
                            !m &&
                              0 === d.length &&
                              (0, t.jsx)('tr', {
                                children: (0, t.jsx)('td', {
                                  colSpan: y,
                                  className: 'px-4 py-4 text-sm text-slate-500',
                                  children: u,
                                }),
                              }),
                            !m &&
                              v.map((e) => {
                                let s = (e.status ?? '').toUpperCase(),
                                  r =
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
                                      f &&
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
                                          className: `rounded-full px-3 py-1 text-xs font-semibold ${r}`,
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
        () => l,
        'DashboardProfileCard',
        () => r,
        'formatCurrency',
        0,
        a,
      ],
      9035
    );
    let i = (e) => {
      if (null == e) return;
      if ('number' == typeof e && !Number.isNaN(e)) return e;
      if ('object' == typeof e) {
        if (void 0 !== e.value) return i(e.value);
        if (void 0 !== e.amount) return i(e.amount);
        if (void 0 !== e.balance) return i(e.balance);
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
              amount: i(e.amount) ?? 0,
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
                i(e.balance) ??
                i(e.raw?.balance) ??
                i(e.raw?.balanceAfter) ??
                i(e.raw?.balanceAmount) ??
                i(e.raw?.walletBalance) ??
                i(e.raw?.currentBalance) ??
                i(e.raw?.availableBalance),
              availableBalance:
                i(e.availableBalance) ??
                i(e.raw?.availableBalance) ??
                i(e.raw?.balanceAmountAvailable) ??
                i(e.raw?.currentBalance),
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
        let r = (0, t.getSession)();
        if (!r) throw Error('Not authenticated');
        let l = { ...s.headers, Authorization: `Bearer ${r.accessToken}` },
          i = await fetch(`${a}${e}`, { ...s, headers: l });
        if (!i.ok)
          throw (
            401 === i.status && ((0, t.clearSession)(), (window.location.href = '/login')),
            Error((await i.text()) || 'Request failed')
          );
        if (204 !== i.status) return await i.json();
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
        let r = (0, t.getSession)();
        if (!r) throw Error('Not authenticated');
        let l = { ...s.headers, Authorization: `Bearer ${r.accessToken}` },
          i = await fetch(`${a}${e}`, { ...s, headers: l });
        if (!i.ok)
          throw (
            401 === i.status && ((0, t.clearSession)(), (window.location.href = '/login')),
            Error((await i.text()) || 'Request failed')
          );
        if (204 !== i.status) return await i.json();
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
  53756,
  (e) => {
    'use strict';
    var t = e.i(43476),
      a = e.i(71645),
      s = e.i(26048);
    (e.i(85351), e.i(28339));
    var r = e.i(14983);
    let l = [
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
    function i(e) {
      if (!(0, r.getSession)()) throw Error('Not authenticated');
      let t = new URL('/kyc/document', window.location.origin);
      (t.searchParams.set('path', e), window.open(t.toString(), '_blank', 'noopener,noreferrer'));
    }
    function n({
      status: e,
      missingCount: s,
      totalCount: r,
      loading: l,
      error: i,
      onRefresh: n,
      children: o,
    }) {
      let [c, d] = (0, a.useState)(!1);
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
                      children: ['Missing: ', s, '/', r],
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
                    disabled: l,
                    children: l ? '…' : '⟳',
                  }),
                  (0, t.jsx)('button', {
                    type: 'button',
                    onClick: () => d((e) => !e),
                    className: 'text-sm font-semibold text-orange-600',
                    children: c ? '▼' : '▲',
                  }),
                ],
              }),
            ],
          }),
          i &&
            (0, t.jsx)('p', {
              className: 'mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700',
              children: i,
            }),
          !c && (0, t.jsx)('div', { className: 'mt-6', children: o }),
        ],
      });
    }
    function o({ profileType: e, profileId: r }) {
      let [o, c] = (0, a.useState)(null),
        [d, m] = (0, a.useState)(!1),
        [u, p] = (0, a.useState)(null),
        [x, b] = (0, a.useState)({}),
        [f, h] = (0, a.useState)({}),
        y = (0, a.useCallback)(async () => {
          (p(null), m(!0));
          try {
            let t =
              'customer' === e
                ? await s.adminApi.getCustomerKyc(r)
                : await s.adminApi.getCivilServantKyc(r);
            c(t);
          } catch (e) {
            (p(e?.message ?? 'Unable to load KYC.'), c(null));
          } finally {
            m(!1);
          }
        }, [r, e]);
      (0, a.useEffect)(() => {
        r && y();
      }, [y, r]);
      let v = o?.status ?? 'not_started',
        g = (0, a.useMemo)(() => {
          var e;
          let t, a, s, r;
          return (
            (e = o?.documents ?? {}),
            (t = !!e['country-id']?.key),
            (a = !!e.passport?.key),
            (s = !!e['proof-of-address']?.key),
            (r = []),
            s || r.push('Proof of address'),
            t || a || r.push('ID or Passport'),
            r
          );
        }, [o?.documents]),
        N = async (t) => {
          p(null);
          let a = f[t] ?? null;
          if (!a) return void p('Choose a file before uploading.');
          if (!a.type) return void p('Unsupported file: missing content type.');
          if (a.size > 0xa00000) return void p('File too large. Please keep uploads under 10MB.');
          b((e) => ({ ...e, [t]: !0 }));
          try {
            let l =
                'customer' === e
                  ? await s.adminApi.presignCustomerKycDocument(r, t, {
                      contentType: a.type,
                      fileName: a.name,
                    })
                  : await s.adminApi.presignCivilServantKycDocument(r, t, {
                      contentType: a.type,
                      fileName: a.name,
                    }),
              i = await fetch(l.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': a.type },
                body: a,
              });
            if (!i.ok) {
              let e = await i.text();
              throw Error(e || `Upload failed (${i.status})`);
            }
            ('customer' === e
              ? await s.adminApi.confirmCustomerKycDocument(r, t, {
                  bucket: l.bucket,
                  key: l.key,
                  contentType: a.type,
                  fileName: a.name,
                  size: a.size,
                })
              : await s.adminApi.confirmCivilServantKycDocument(r, t, {
                  bucket: l.bucket,
                  key: l.key,
                  contentType: a.type,
                  fileName: a.name,
                  size: a.size,
                }),
              h((e) => ({ ...e, [t]: null })),
              await y());
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
              ? await i(`/customers/${r}/kyc/documents/${t}`)
              : await i(`/civil-servants/${r}/kyc/documents/${t}`);
          } catch (e) {
            p(e?.message ?? 'Unable to open document.');
          }
        },
        w = async (t) => {
          (p(null), b((e) => ({ ...e, [t]: !0 })));
          try {
            ('customer' === e
              ? await s.adminApi.deleteCustomerKycDocument(r, t)
              : await s.adminApi.deleteCivilServantKycDocument(r, t),
              h((e) => ({ ...e, [t]: null })),
              await y());
          } catch (e) {
            p(e?.message ?? 'Unable to delete document.');
          } finally {
            b((e) => ({ ...e, [t]: !1 }));
          }
        };
      return (0, t.jsx)(n, {
        status: v,
        missingCount: g.length,
        totalCount: 2,
        loading: d,
        error: u,
        onRefresh: () => void y(),
        children: (0, t.jsxs)('div', {
          className: 'space-y-4',
          children: [
            l.map((e) => {
              let a = o?.documents?.[e.type],
                s = !!x[e.type],
                r = f[e.type] ?? null;
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
                                      (h((t) => ({ ...t, [e.type]: a })), (t.target.value = ''));
                                    },
                                    disabled: s,
                                  }),
                                  r ? 'Change file' : 'Choose file',
                                ],
                              }),
                              r?.name &&
                                (0, t.jsx)('p', {
                                  className:
                                    'mt-2 max-w-[240px] truncate text-xs font-medium text-slate-500',
                                  title: r.name,
                                  children: r.name,
                                }),
                            ],
                          }),
                          (0, t.jsx)('button', {
                            type: 'button',
                            onClick: () => void N(e.type),
                            className:
                              'btn-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60',
                            disabled: s || !r,
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
            !d &&
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
  14860,
  (e) => {
    'use strict';
    var t = e.i(43476),
      a = e.i(71645),
      s = e.i(26048),
      r = e.i(9035),
      l = e.i(36484),
      i = e.i(53756),
      n = e.i(10584);
    function o() {
      let e = (0, n.eclipseEnabled)(),
        [o, c] = (0, a.useState)({
          firstName: '',
          familyName: '',
          email: '',
          phoneNumber: '',
          address: '',
        }),
        [d, m] = (0, a.useState)({ accountNumber: '', familyName: '' }),
        [u, p] = (0, a.useState)([]),
        [x, b] = (0, a.useState)(null),
        [f, h] = (0, a.useState)(null),
        [y, v] = (0, a.useState)(null),
        [g, N] = (0, a.useState)(!1),
        [j, w] = (0, a.useState)([]),
        [S, C] = (0, a.useState)(!1),
        [$, k] = (0, a.useState)([]),
        [P, T] = (0, a.useState)(!1),
        [A, D] = (0, a.useState)(!1),
        [U, I] = (0, a.useState)(!1),
        [E, R] = (0, a.useState)(!0),
        [K, O] = (0, a.useState)(null),
        [B, L] = (0, a.useState)(!1),
        [J, q] = (0, a.useState)(!1),
        [F, W] = (0, a.useState)(!1),
        [z, G] = (0, a.useState)({
          firstName: '',
          familyName: '',
          email: '',
          phoneNumber: '',
          address: '',
        }),
        M = (0, a.useMemo)(() => {
          if (!x) return [];
          let t = [
            { id: 'firstName', label: 'First Name', value: z.firstName },
            { id: 'familyName', label: 'Last Name', value: z.familyName },
            { id: 'email', label: 'Email', value: z.email },
            { id: 'phoneNumber', label: 'Phone', value: z.phoneNumber ?? '—' },
            { id: 'address', label: 'Address', value: z.address ?? '—', span: 2 },
            { label: 'Pashasha Account', value: x.accountNumber, mono: !0 },
          ];
          return (
            e && t.push({ label: 'Wallet ID', value: x.eclipseWalletId ?? '—', mono: !0 }),
            t
          );
        }, [e, z, x]),
        Z = K?.currentBalance ?? K?.balance ?? K?.availableBalance ?? void 0,
        _ = K?.availableBalance ?? K?.currentBalance ?? K?.balance ?? void 0,
        Y = async (e) => {
          (e.preventDefault(), v(null));
          try {
            (await s.adminApi.createCustomer({
              ...o,
              phoneNumber: o.phoneNumber || void 0,
              address: o.address || void 0,
            }),
              h('Customer provisioning started. You will receive credentials once ready.'),
              p((e) => e),
              b(null),
              c({ firstName: '', familyName: '', email: '', phoneNumber: '', address: '' }),
              N(!1));
          } catch (e) {
            v(e?.message ?? 'Unable to create customer.');
          }
        },
        Q = async (e) => {
          (e.preventDefault(), v(null));
          try {
            let e = await s.adminApi.searchCustomers(d);
            p(Array.isArray(e) ? e : []);
          } catch (e) {
            v(e?.message ?? 'Unable to search.');
          }
        },
        V = async (e) => {
          if (confirm('Delete this customer?'))
            try {
              (await s.adminApi.deleteCustomer(e),
                p((t) => t.filter((t) => t.customerId !== e)),
                x?.customerId === e && b(null),
                h('Customer deleted.'));
            } catch (e) {
              v(e?.message ?? 'Unable to delete customer.');
            }
        },
        H = (0, a.useCallback)(async () => {
          if (!x?.customerId || !e) {
            (w([]), k([]), O(null));
            return;
          }
          (C(!0), T(!0));
          try {
            let [e, t, a] = await Promise.all([
              s.adminApi.getCustomerTransactions(x.customerId),
              s.adminApi.getCustomerPendingTransactions(x.customerId, { limit: 25, offset: 0 }),
              s.adminApi.getCustomerWallet(x.customerId),
            ]);
            (w((0, l.mapDashboardTransactions)(e ?? [])),
              k((0, l.mapDashboardTransactions)(t ?? [])),
              a
                ? O({
                    balance: a.balance,
                    availableBalance: a.availableBalance ?? a.balance,
                    currentBalance: a.currentBalance ?? a.balance,
                    currency: a.currency,
                  })
                : O(null));
          } catch (e) {
            v(e?.message ?? 'Unable to load financials.');
          } finally {
            (C(!1), T(!1));
          }
        }, [e, x?.customerId]),
        X = async () => {
          if (x?.customerId) {
            (W(!0), v(null));
            try {
              let e = await s.adminApi.getCustomer(x.customerId);
              (b(e),
                p((t) => t.map((t) => (t.customerId === e.customerId ? e : t))),
                G({
                  firstName: e.firstName ?? '',
                  familyName: e.familyName ?? '',
                  email: e.email ?? '',
                  phoneNumber: e.phoneNumber ?? '',
                  address: e.address ?? '',
                }));
            } catch (e) {
              v(e?.message ?? 'Unable to refresh profile.');
            } finally {
              W(!1);
            }
          }
        };
      (0, a.useEffect)(() => {
        (async () => {
          if (!x?.customerId) {
            (w([]), k([]), O(null));
            return;
          }
          (G({
            firstName: x.firstName ?? '',
            familyName: x.familyName ?? '',
            email: x.email ?? '',
            phoneNumber: x.phoneNumber ?? '',
            address: x.address ?? '',
          }),
            L(!1),
            q(!1),
            await H());
        })();
      }, [e, x?.customerId, x?.firstName, x?.familyName, x?.email, x?.phoneNumber, x?.address, H]);
      let ee = $.reduce((e, t) => {
        let a = Number(t.amount ?? 0);
        return e + (Number.isNaN(a) ? 0 : Math.abs(a));
      }, 0);
      return (0, t.jsxs)('div', {
        className: 'space-y-6',
        children: [
          (0, t.jsx)('div', {
            className: 'flex items-center justify-end',
            children: (0, t.jsxs)('button', {
              type: 'button',
              onClick: () => N(!0),
              className: 'btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold',
              children: [
                (0, t.jsx)('span', { className: 'text-lg leading-none', children: '＋' }),
                ' Add customer',
              ],
            }),
          }),
          (0, t.jsxs)('form', {
            onSubmit: Q,
            className: 'space-y-4 rounded-2xl border border-slate-200 bg-white p-6',
            children: [
              (0, t.jsx)('h2', {
                className: 'text-lg font-semibold text-slate-900',
                children: 'Search customers',
              }),
              (0, t.jsxs)('label', {
                className: 'text-sm font-semibold text-slate-600',
                children: [
                  'Account number',
                  (0, t.jsx)('input', {
                    value: d.accountNumber,
                    onChange: (e) => m((t) => ({ ...t, accountNumber: e.target.value })),
                    className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                  }),
                ],
              }),
              (0, t.jsxs)('label', {
                className: 'text-sm font-semibold text-slate-600',
                children: [
                  'Family name',
                  (0, t.jsx)('input', {
                    value: d.familyName,
                    onChange: (e) => m((t) => ({ ...t, familyName: e.target.value })),
                    className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                  }),
                ],
              }),
              (0, t.jsx)('button', {
                type: 'submit',
                className: 'btn-primary px-6 py-3 text-base font-semibold text-white',
                children: 'Search',
              }),
            ],
          }),
          y &&
            (0, t.jsx)('p', {
              className: 'rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700',
              children: y,
            }),
          f &&
            (0, t.jsx)('p', {
              className: 'rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700',
              children: f,
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
                    children: [u.length, ' records'],
                  }),
                ],
              }),
              (0, t.jsxs)('ul', {
                children: [
                  u.map((e) =>
                    (0, t.jsxs)(
                      'li',
                      {
                        className: `flex items-center justify-between px-6 py-4 ${x?.customerId === e.customerId ? 'bg-orange-50' : ''}`,
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
                                onClick: () => b(e),
                                className: 'btn-primary px-4 py-2 text-sm font-semibold text-white',
                                children: 'Details',
                              }),
                              (0, t.jsx)('button', {
                                type: 'button',
                                onClick: () => V(e.customerId),
                                className: 'btn-primary px-4 py-2 text-sm font-semibold text-white',
                                children: 'Delete',
                              }),
                            ],
                          }),
                        ],
                      },
                      e.customerId
                    )
                  ),
                  0 === u.length &&
                    (0, t.jsx)('li', {
                      className: 'px-6 py-10 text-center text-sm text-slate-500',
                      children: 'No customers found.',
                    }),
                ],
              }),
            ],
          }),
          x &&
            (0, t.jsxs)('div', {
              className: 'space-y-6',
              children: [
                (0, t.jsx)(r.DashboardNameCard, {
                  name: `${x.firstName} ${x.familyName}`,
                  status: x.status ?? 'active',
                  accountNumber: x.accountNumber,
                }),
                (0, t.jsx)(r.DashboardProfileCard, {
                  title: 'Profile',
                  collapsed: A,
                  onToggle: () => D((e) => !e),
                  fields: M,
                  onRefresh: X,
                  refreshing: F,
                  editing: B,
                  onFieldChange: (e, t) => G((a) => ({ ...a, [e]: t })),
                  actions: (0, t.jsx)('button', {
                    type: 'button',
                    onClick: () => L((e) => !e),
                    className:
                      'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50',
                    'aria-label': 'Edit profile',
                    title: 'Edit profile',
                    children: '✎',
                  }),
                  footer:
                    B &&
                    (0, t.jsxs)('div', {
                      className: 'mt-4 flex items-center justify-end gap-2',
                      children: [
                        (0, t.jsx)('button', {
                          type: 'button',
                          onClick: () => {
                            x &&
                              (G({
                                firstName: x.firstName ?? '',
                                familyName: x.familyName ?? '',
                                email: x.email ?? '',
                                phoneNumber: x.phoneNumber ?? '',
                                address: x.address ?? '',
                              }),
                              L(!1));
                          },
                          className:
                            'rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50',
                          children: 'Cancel',
                        }),
                        (0, t.jsx)('button', {
                          type: 'button',
                          disabled: J,
                          onClick: async () => {
                            if (x) {
                              q(!0);
                              try {
                                let e = await s.adminApi.updateCustomer(x.customerId, {
                                  firstName: z.firstName,
                                  familyName: z.familyName,
                                  email: z.email,
                                  phoneNumber: z.phoneNumber || void 0,
                                  address: z.address || void 0,
                                });
                                (b(e),
                                  p((t) => t.map((t) => (t.customerId === e.customerId ? e : t))),
                                  L(!1));
                              } catch (e) {
                                v(e?.message ?? 'Unable to update profile.');
                              } finally {
                                q(!1);
                              }
                            }
                          },
                          className:
                            'btn-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60',
                          children: J ? 'Saving...' : 'Save',
                        }),
                      ],
                    }),
                }),
                (0, t.jsx)(i.DashboardKycCard, {
                  profileType: 'customer',
                  profileId: x.customerId,
                }),
                e &&
                  (0, t.jsxs)(t.Fragment, {
                    children: [
                      (0, t.jsx)(r.DashboardPaymentsCard, {
                        title: 'Transaction history',
                        collapsed: U,
                        onToggle: () => I((e) => !e),
                        metrics:
                          void 0 !== Z && void 0 !== _
                            ? [
                                { label: 'Balance', value: Z },
                                { label: 'Available Balance', value: _ },
                              ]
                            : void 0,
                        transactions: j,
                        loading: S,
                        rightActions: (0, t.jsxs)('div', {
                          className: 'flex items-center gap-2',
                          children: [
                            (0, t.jsx)('button', {
                              type: 'button',
                              onClick: H,
                              disabled: S || P,
                              className:
                                'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50',
                              'aria-label': 'Refresh transactions',
                              title: 'Refresh transactions',
                              children: S ? '⟳' : '⟲',
                            }),
                            (0, t.jsxs)('span', {
                              className: 'text-xs text-slate-500',
                              children: ['Wallet: ', x.eclipseWalletId ?? '—'],
                            }),
                          ],
                        }),
                      }),
                      (0, t.jsx)(r.DashboardPaymentsCard, {
                        title: 'Reservations',
                        collapsed: E,
                        onToggle: () => R((e) => !e),
                        metrics: [
                          { label: 'Pending Reservations', value: ee },
                          ...(void 0 !== _ ? [{ label: 'Available Balance', value: _ }] : []),
                        ],
                        transactions: $,
                        loading: P,
                        emptyLabel: 'No reservations.',
                        rightActions: (0, t.jsxs)('div', {
                          className: 'flex items-center gap-2',
                          children: [
                            (0, t.jsx)('button', {
                              type: 'button',
                              onClick: H,
                              disabled: S || P,
                              className:
                                'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50',
                              'aria-label': 'Refresh reservations',
                              title: 'Refresh reservations',
                              children: P ? '⟳' : '⟲',
                            }),
                            (0, t.jsxs)('span', {
                              className: 'text-xs text-slate-500',
                              children: ['Wallet: ', x.eclipseWalletId ?? '—'],
                            }),
                          ],
                        }),
                        showBalanceColumn: !1,
                        showExpiresColumn: !0,
                      }),
                    ],
                  }),
              ],
            }),
          g &&
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
                        children: 'Create customer',
                      }),
                      (0, t.jsx)('button', {
                        type: 'button',
                        className: 'btn-primary px-4 py-2 text-sm font-semibold text-white',
                        onClick: () => N(!1),
                        children: 'Close',
                      }),
                    ],
                  }),
                  (0, t.jsxs)('form', {
                    onSubmit: Y,
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
                                value: o.firstName,
                                onChange: (e) => c((t) => ({ ...t, firstName: e.target.value })),
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
                                value: o.familyName,
                                onChange: (e) => c((t) => ({ ...t, familyName: e.target.value })),
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
                            value: o.email,
                            onChange: (e) => c((t) => ({ ...t, email: e.target.value })),
                            className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                          }),
                        ],
                      }),
                      (0, t.jsxs)('label', {
                        className: 'text-sm font-semibold text-slate-600',
                        children: [
                          'Phone',
                          (0, t.jsx)('input', {
                            value: o.phoneNumber,
                            onChange: (e) => c((t) => ({ ...t, phoneNumber: e.target.value })),
                            className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                          }),
                        ],
                      }),
                      (0, t.jsxs)('label', {
                        className: 'text-sm font-semibold text-slate-600',
                        children: [
                          'Address',
                          (0, t.jsx)('input', {
                            value: o.address,
                            onChange: (e) => c((t) => ({ ...t, address: e.target.value })),
                            className: 'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3',
                          }),
                        ],
                      }),
                      (0, t.jsx)('button', {
                        type: 'submit',
                        className: 'btn-primary px-6 py-3 text-base font-semibold text-white',
                        children: 'Create customer',
                      }),
                    ],
                  }),
                ],
              }),
            }),
        ],
      });
    }
    e.s(['default', () => o]);
  },
]);
