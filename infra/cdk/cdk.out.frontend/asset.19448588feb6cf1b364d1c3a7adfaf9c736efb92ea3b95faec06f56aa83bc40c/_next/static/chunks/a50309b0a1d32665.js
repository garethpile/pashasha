(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  80090,
  (e) => {
    'use strict';
    let t = (0, e.i(75863).resolveCoreApiRoot)(),
      a = async (e, a = {}) => {
        let s = await fetch(`${t}${e}`, {
            ...a,
            headers: { 'Content-Type': 'application/json', ...a.headers },
            cache: 'no-store',
          }),
          l = await s.text(),
          r = null;
        try {
          r = l ? JSON.parse(l) : null;
        } catch {
          r = l;
        }
        if (!s.ok) {
          if (r && 'object' == typeof r && 'string' == typeof r.message) throw Error(r.message);
          if ('string' == typeof r && r.trim().length > 0) throw Error(r);
          throw Error(`Request failed (${s.status})`);
        }
        return r;
      };
    e.s([
      'corePublicApi',
      0,
      {
        lookupCivilServant: (e) =>
          a(`/api/public/civil-servants/lookup?qrToken=${encodeURIComponent(e)}`),
        lookupCivilServantById: (e) =>
          a(`/api/public/civil-servants/lookup?publicId=${encodeURIComponent(e)}`),
        createPaymentIntent: (e) =>
          a('/api/public/payment-intents', { method: 'POST', body: JSON.stringify(e) }),
        getPaymentIntent: (e) => a(`/api/public/payment-intents/${encodeURIComponent(e)}`),
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
    function s({ name: e, status: a, accountNumber: s, extra: l }) {
      let r = 'inactive' === (a ?? '').toLowerCase(),
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
                    className: `inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${r ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`,
                    children: ['Status: ', i],
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
      children: r,
      actions: i,
      onRefresh: n,
      refreshing: o,
      editing: d,
      onFieldChange: c,
      footer: m,
    }) {
      let x = d ?? !1;
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
                            disabled: !x,
                            onChange:
                              x && c && (e.id ?? e.label)
                                ? (t) => c(e.id ?? e.label, t.target.value)
                                : void 0,
                            className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${x ? 'bg-white' : 'bg-slate-50'} ${e.mono ? 'font-mono' : ''}`,
                          }),
                        ],
                      },
                      `${e.id ?? e.label}-${a}`
                    )
                  ),
                }),
                m,
                r,
              ],
            }),
        ],
      });
    }
    function r({
      title: e = 'Payments',
      collapsed: s,
      onToggle: l,
      balance: r,
      availableBalance: i,
      metrics: n,
      actions: o,
      rightActions: d,
      transactions: c,
      loading: m,
      emptyLabel: x = 'No transactions yet.',
      pagination: p,
      showBalanceColumn: u = !0,
      showExpiresColumn: b = !1,
      showAvailableBalanceColumn: h = !1,
    }) {
      let f =
          n && n.length > 0
            ? n
            : [
                ...(void 0 !== r ? [{ label: 'Balance', value: r }] : []),
                ...(void 0 !== i ? [{ label: 'Available Balance', value: i }] : []),
              ],
        y = 7 + +!!u + +!!h + +!!b,
        g = c.slice(0, 10);
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
                              u &&
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
                                  colSpan: y,
                                  className: 'px-4 py-4 text-sm text-slate-500',
                                  children: 'Loading transactions...',
                                }),
                              }),
                            !m &&
                              0 === c.length &&
                              (0, t.jsx)('tr', {
                                children: (0, t.jsx)('td', {
                                  colSpan: y,
                                  className: 'px-4 py-4 text-sm text-slate-500',
                                  children: x,
                                }),
                              }),
                            !m &&
                              g.map((e) => {
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
                                      u &&
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
        () => r,
        'DashboardProfileCard',
        () => l,
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
  28339,
  (e) => {
    'use strict';
    var t = e.i(14983);
    let a = (0, e.i(75863).resolveAppApiRoot)(),
      s = async (e, s = {}) => {
        let l = (0, t.getSession)();
        if (!l) throw Error('Not authenticated');
        let r = { ...s.headers, Authorization: `Bearer ${l.accessToken}` },
          i = await fetch(`${a}${e}`, { ...s, headers: r });
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
  85351,
  (e) => {
    'use strict';
    var t = e.i(14983);
    let a = (0, e.i(75863).resolveAppApiRoot)(),
      s = async (e, s = {}) => {
        let l = (0, t.getSession)();
        if (!l) throw Error('Not authenticated');
        let r = { ...s.headers, Authorization: `Bearer ${l.accessToken}` },
          i = await fetch(`${a}${e}`, { ...s, headers: r });
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
  41421,
  (e) => {
    'use strict';
    var t = e.i(43476),
      a = e.i(57688);
    function s({
      title: e = 'Profile',
      data: s,
      collapsed: l,
      onToggle: r,
      editing: i,
      onEditToggle: n,
      onFieldChange: o,
      onCancel: d,
      onSave: c,
      saving: m,
      feedback: x,
      showWorkFields: p = !0,
      showPrimarySite: u = !0,
      occupationOptions: b,
      showWalletId: h = !0,
      showEclipseAccount: f = !1,
      onViewQr: y,
      onGenerateQr: g,
      qrLoading: v,
      canViewQr: N,
      onRefresh: j,
      refreshing: w,
    }) {
      let S = !!s.qrUrl,
        C = y && (S || N);
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
                    onClick: r,
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
                          disabled: !i,
                          className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${i ? 'bg-white' : 'bg-slate-50'}`,
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
                          disabled: !i,
                          className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${i ? 'bg-white' : 'bg-slate-50'}`,
                        }),
                      ],
                    }),
                  ],
                }),
                (p || u) &&
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
                              disabled: !i,
                              className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${i ? 'bg-white' : 'bg-slate-50'}`,
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
                      u &&
                        (0, t.jsxs)('label', {
                          className: 'text-xs font-semibold text-slate-600',
                          children: [
                            'Primary Site',
                            (0, t.jsx)('input', {
                              value: s.primarySite ?? '',
                              onChange: (e) => o('primarySite', e.target.value),
                              disabled: !i,
                              className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${i ? 'bg-white' : 'bg-slate-50'}`,
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
                          disabled: !i,
                          className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${i ? 'bg-white' : 'bg-slate-50'}`,
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
                          disabled: !i,
                          className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${i ? 'bg-white' : 'bg-slate-50'}`,
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
                      disabled: !i,
                      className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${i ? 'bg-white' : 'bg-slate-50'}`,
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
                (i || c || d || x) &&
                  (0, t.jsxs)('div', {
                    className: 'flex flex-wrap items-center justify-between gap-3',
                    children: [
                      x &&
                        (0, t.jsx)('p', {
                          className: `text-sm ${x.includes('updated') ? 'text-emerald-600' : 'text-rose-600'}`,
                          children: x,
                        }),
                      i &&
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
                              onClick: () => y && y(),
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
                                y &&
                                  (0, t.jsx)('button', {
                                    type: 'button',
                                    className:
                                      'btn-primary px-4 py-2 text-sm font-semibold text-white',
                                    onClick: () => y(),
                                    disabled: !C || !!v,
                                    children: v ? 'Loading...' : 'View QR image',
                                  }),
                                g &&
                                  (0, t.jsx)('button', {
                                    type: 'button',
                                    className:
                                      'btn-primary px-4 py-2 text-sm font-semibold text-white',
                                    onClick: () => g(),
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
                                g &&
                                (0, t.jsx)('button', {
                                  type: 'button',
                                  className:
                                    'btn-primary px-4 py-2 text-sm font-semibold text-white',
                                  onClick: () => g(),
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
]);
