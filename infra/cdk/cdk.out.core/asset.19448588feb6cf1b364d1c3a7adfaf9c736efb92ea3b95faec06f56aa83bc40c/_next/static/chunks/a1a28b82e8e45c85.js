(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  96345,
  (e) => {
    'use strict';
    var a = e.i(43476),
      t = e.i(57688),
      s = e.i(22016),
      l = e.i(71645),
      n = e.i(18566),
      r = e.i(9035),
      i = e.i(36484),
      o = e.i(28339),
      c = e.i(80090),
      d = e.i(85351),
      u = e.i(14983);
    let m = (0, e.i(75863).resolveVoucherApiRoot)(),
      x = async (e, a = {}) => {
        let t = (0, u.getSession)(),
          s = { ...a.headers };
        t?.accessToken && (s.Authorization = `Bearer ${t.accessToken}`);
        let l = await fetch(`${m}${e}`, { ...a, headers: s });
        if (!l.ok) {
          let e = await l.text(),
            a = e || 'Request failed';
          try {
            let t = JSON.parse(e);
            a = t.error || t.message || a;
          } catch {}
          409 === l.status && (a = 'Insufficient balance.');
          let t = Error(a);
          throw ((t.status = l.status), t);
        }
        if (204 !== l.status) return await l.json();
      };
    var b = e.i(66746),
      p = e.i(10584),
      h = e.i(41421);
    let f = () =>
        (0, a.jsx)('main', {
          className: 'min-h-screen bg-[#f77720] px-4 py-10',
          children: (0, a.jsxs)('div', {
            className: 'mx-auto flex max-w-4xl flex-col items-center gap-10',
            children: [
              (0, a.jsx)('div', {
                className:
                  'relative w-full overflow-hidden rounded-3xl shadow-lg ring-1 ring-orange-300/60',
                children: (0, a.jsx)(t.default, {
                  src: '/Pashasha-Slogan-Background.png',
                  alt: 'Pashasha Pay slogan',
                  width: 1920,
                  height: 1080,
                  className: 'h-auto w-full object-contain',
                  priority: !0,
                }),
              }),
              (0, a.jsxs)('div', {
                className:
                  'w-full max-w-3xl rounded-3xl border border-orange-100 bg-white/90 p-8 text-center shadow-lg backdrop-blur',
                children: [
                  (0, a.jsx)('p', {
                    className: 'text-lg font-semibold text-slate-900',
                    children: 'Sign in to view your Dashboard or register a new account',
                  }),
                  (0, a.jsxs)('div', {
                    className: 'mt-6 flex flex-wrap justify-center gap-3',
                    children: [
                      (0, a.jsx)(s.default, {
                        href: '/login',
                        className:
                          'rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-600',
                        children: 'Log in',
                      }),
                      (0, a.jsx)(s.default, {
                        href: '/signup',
                        className:
                          'rounded-full border border-orange-300 bg-white px-6 py-3 text-sm font-semibold text-orange-600 shadow-lg transition hover:bg-orange-50',
                        children: 'Register',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      g = ({ text: e }) =>
        (0, a.jsx)('main', {
          className: 'flex min-h-screen items-center justify-center bg-amber-50 px-4',
          children: (0, a.jsx)('p', {
            className: 'rounded-3xl border border-orange-100 bg-white px-6 py-4 text-slate-600',
            children: e,
          }),
        }),
      v = ({ text: e }) =>
        (0, a.jsx)('main', {
          className: 'flex min-h-screen items-center justify-center bg-amber-50 px-4',
          children: (0, a.jsx)('p', {
            className: 'rounded-3xl border border-rose-200 bg-white px-6 py-4 text-rose-600',
            children: e,
          }),
        }),
      y = ({ qrUrl: e, onClose: s }) =>
        (0, a.jsx)('div', {
          className: 'fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4',
          role: 'button',
          tabIndex: -1,
          onClick: s,
          onKeyDown: (e) => 'Escape' === e.key && s(),
          children: (0, a.jsxs)('div', {
            className: 'relative rounded-3xl bg-white p-6 shadow-2xl',
            onClick: (e) => e.stopPropagation(),
            children: [
              (0, a.jsx)('button', {
                type: 'button',
                onClick: s,
                className:
                  'absolute right-3 top-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50',
                children: 'Close',
              }),
              (0, a.jsx)(t.default, {
                src: e,
                alt: 'QR code preview',
                className: 'h-64 w-64 object-contain',
                width: 256,
                height: 256,
              }),
            ],
          }),
        }),
      N = ({ onClose: e }) =>
        (0, a.jsx)('div', {
          className: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4',
          role: 'dialog',
          'aria-modal': 'true',
          onClick: e,
          onKeyDown: (a) => 'Escape' === a.key && e(),
          tabIndex: -1,
          children: (0, a.jsxs)('div', {
            className: 'relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl',
            onClick: (e) => e.stopPropagation(),
            children: [
              (0, a.jsx)('h3', {
                className: 'text-xl font-semibold text-slate-900',
                children: 'Payout requested',
              }),
              (0, a.jsx)('p', {
                className: 'mt-2 text-sm text-slate-600',
                children: 'Your payout request was submitted successfully.',
              }),
              (0, a.jsx)('div', {
                className: 'mt-6 flex justify-end',
                children: (0, a.jsx)('button', {
                  type: 'button',
                  onClick: e,
                  className:
                    'rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600',
                  children: 'Close',
                }),
              }),
            ],
          }),
        });
    function w() {
      let [e, t] = (0, l.useState)(null),
        [s, n] = (0, l.useState)(!0),
        [c, d] = (0, l.useState)(null),
        [u, m] = (0, l.useState)(null),
        [b, f] = (0, l.useState)(!1),
        [w, j] = (0, l.useState)([]),
        [S, C] = (0, l.useState)([]),
        [P, I] = (0, l.useState)(0),
        [A, k] = (0, l.useState)(!1),
        [B, E] = (0, l.useState)(0),
        [L, U] = (0, l.useState)(!1),
        [T, D] = (0, l.useState)(!1),
        [R, O] = (0, l.useState)(!1),
        [$, F] = (0, l.useState)([]),
        [V, W] = (0, l.useState)(0),
        [M, z] = (0, l.useState)(!1),
        [K, G] = (0, l.useState)(!1),
        [q, H] = (0, l.useState)(!0),
        [Q, Z] = (0, l.useState)(!1),
        [J, _] = (0, l.useState)(null),
        [Y, X] = (0, l.useState)(''),
        [ee, ea] = (0, l.useState)('1VOUCHER'),
        [et, es] = (0, l.useState)(null),
        [el, en] = (0, l.useState)(!1),
        [er, ei] = (0, l.useState)(!1),
        [eo, ec] = (0, l.useState)(!1),
        [ed, eu] = (0, l.useState)(!1),
        [em, ex] = (0, l.useState)({
          firstName: '',
          familyName: '',
          occupation: '',
          primarySite: '',
          phoneNumber: '',
          email: '',
          homeAddress: '',
        }),
        [eb, ep] = (0, l.useState)(!1),
        [eh, ef] = (0, l.useState)(!1),
        [eg, ev] = (0, l.useState)(null),
        ey = (0, p.eclipseEnabled)(),
        [eN, ew] = (0, l.useState)(!1),
        ej = (0, l.useCallback)(async (e = 0, a) => {
          D(!0);
          try {
            let t = await o.guardApi.getTransactions({ offset: e, limit: 20 }),
              s = (0, i.mapDashboardTransactions)(t ?? []),
              l = (() => {
                if (void 0 === a) return s;
                let e = 0;
                return s.map((t) => {
                  let s = t.balance;
                  if (null != s) return ((e += Number(t.amount ?? 0)), t);
                  let l = a - e;
                  return ((e += Number(t.amount ?? 0)), { ...t, balance: l });
                });
              })();
            (j(l), I(e), k(14 === (t ?? []).length));
          } catch (e) {
            (d(e?.message ?? 'Unable to load transactions.'), j([]));
          } finally {
            D(!1);
          }
        }, []),
        eS = (0, l.useCallback)(async (e = 0) => {
          G(!0);
          try {
            let a = await o.guardApi.getPendingTransactions({ offset: e, limit: 20 }),
              t = (0, i.mapDashboardTransactions)(a ?? []);
            (F(t), W(e), z(14 === (a ?? []).length));
          } catch (e) {
            (d(e?.message ?? 'Unable to load pending payouts.'), F([]));
          } finally {
            G(!1);
          }
        }, []),
        eC = (0, l.useCallback)(
          async (e) => {
            if (ey)
              try {
                let e = await o.guardApi.getPayoutInfo(),
                  a = {
                    balance: e.balance,
                    availableBalance: e.availableBalance ?? e.balance,
                    currentBalance: e.currentBalance ?? e.balance,
                    currency: e.currency,
                  };
                return (_(a), a);
              } catch {
                return;
              }
            if (!e) return void _(null);
            try {
              let a,
                t = await ((a = e), x(`/recipients/${encodeURIComponent(a)}/balance`)),
                s = t.availableBalance ?? 0,
                l = {
                  balance: s,
                  availableBalance: s,
                  currentBalance: s,
                  currency: t.currency ?? 'ZAR',
                };
              return (_(l), l);
            } catch {
              let e = { balance: 0, availableBalance: 0, currentBalance: 0, currency: 'ZAR' };
              return (_(e), e);
            }
          },
          [ey]
        ),
        eP = (0, l.useCallback)(
          async (e) => {
            let a = e?.silent ?? !1;
            (a || n(!0), d(null));
            try {
              let e = await o.guardApi.getProfile();
              if (
                (t(e),
                ex({
                  firstName: e.firstName ?? '',
                  familyName: e.familyName ?? '',
                  occupation: e.occupation ?? 'Civil Servant',
                  primarySite: e.primarySite ?? e.address ?? '',
                  phoneNumber: e.phoneNumber ?? '',
                  email: e.email ?? '',
                  homeAddress: e.homeAddress ?? e.address ?? '',
                }),
                ep(!1),
                ev(null),
                e.qrCodeKey)
              )
                try {
                  let e = await o.guardApi.getQrCode();
                  m(e.url);
                } catch {
                  m(null);
                }
              else m(null);
              if (ey) {
                let e = await eC(),
                  a = e?.currentBalance ?? e?.balance ?? e?.availableBalance;
                await Promise.all([ej(0, a), eS(0)]);
              } else {
                let a = await eC(e.civilServantId),
                  t = a?.currentBalance ?? a?.balance ?? a?.availableBalance;
                (await ej(0, t), F([]));
              }
            } catch (e) {
              (d(e?.message ?? 'Unable to load profile.'), t(null));
            } finally {
              a || n(!1);
            }
          },
          [ey, eS, eC, ej]
        );
      ((0, l.useEffect)(() => {
        eP();
      }, [eP]),
        (0, l.useEffect)(() => {
          e?.qrCodeKey
            ? o.guardApi
                .getQrCode()
                .then((e) => m(e.url))
                .catch(() => m(null))
            : m(null);
        }, [e?.qrCodeKey]),
        (0, l.useEffect)(() => {
          ey && e?.eclipseWalletId && eC();
        }, [ey, eC, e?.eclipseWalletId]),
        (0, l.useEffect)(() => {
          let e = w.find((e) => void 0 !== e.balance && !Number.isNaN(Number(e.balance)))?.balance,
            a = w.find(
              (e) => void 0 !== e.availableBalance && !Number.isNaN(Number(e.availableBalance))
            )?.availableBalance;
          (void 0 !== e || void 0 !== a) &&
            _((t) => {
              let s = t?.balance ?? t?.currentBalance ?? t?.availableBalance;
              return null != s && 0 !== Number(s)
                ? t
                : {
                    walletId: t?.walletId,
                    balance: e ?? a ?? s ?? 0,
                    currentBalance: e ?? s ?? a ?? 0,
                    availableBalance: a ?? e ?? s ?? 0,
                    currency: t?.currency ?? 'ZAR',
                  };
            });
        }, [w]),
        (0, l.useEffect)(() => {
          Q && (es(null), eC(e?.civilServantId));
        }, [ey, eC, Q, e?.civilServantId]),
        (0, l.useMemo)(() => {
          let e = w
            .filter((e) => 'SUCCESSFUL' === (e.status ?? '').toUpperCase())
            .reduce((e, a) => e + (a.amount ?? 0), 0);
          return {
            received: e,
            pending: w
              .filter((e) => (e.status ?? '').toUpperCase().includes('PEND'))
              .reduce((e, a) => e + (a.amount ?? 0), 0),
            paidOut: 0,
          };
        }, [w]));
      let eI = (0, l.useCallback)(
          (a) => {
            let t = a ?? e;
            t &&
              (ex({
                firstName: t.firstName ?? '',
                familyName: t.familyName ?? '',
                occupation: t.occupation ?? 'Civil Servant',
                primarySite: t.primarySite ?? t.address ?? '',
                phoneNumber: t.phoneNumber ?? '',
                email: t.email ?? '',
                homeAddress: t.homeAddress ?? t.address ?? '',
              }),
              ev(null));
          },
          [e]
        ),
        eA = async () => {
          (ef(!0), ev(null));
          try {
            await o.guardApi.updateProfile({
              firstName: em.firstName,
              familyName: em.familyName,
              occupation: em.occupation,
              primarySite: em.primarySite,
              address: em.primarySite,
              homeAddress: em.homeAddress,
              phoneNumber: em.phoneNumber,
              email: em.email,
            });
            let e = await o.guardApi.getProfile();
            (t(e), eI(e), ep(!1), ev('Profile updated.'));
          } catch (e) {
            ev(e?.message ?? 'Unable to update profile.');
          } finally {
            ef(!1);
          }
        },
        ek = async () => {
          es(null);
          let a = Number(Y);
          if (Number.isNaN(a) || a <= 0) return void es('Enter a valid amount.');
          let t = J?.availableBalance ?? J?.balance;
          if (void 0 !== t && a > t) return void es('Amount exceeds available balance.');
          if (!e?.civilServantId) return void es('Missing recipient.');
          en(!0);
          try {
            let t,
              s = ey
                ? await o.guardApi.requestPayout({ amount: a, method: ee })
                : await ((t = {
                    recipientId: e.civilServantId,
                    amount: a,
                    reference: e.accountNumber ?? void 0,
                    method: ee,
                  }),
                  x('/payouts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(t),
                  })),
              l =
                s?.withdrawal?.redirectUrl ||
                s?.withdrawal?.authorizationUrl ||
                s?.withdrawal?.completionUrl ||
                s?.withdrawal?.voucherUrl,
              n = await eC(e.civilServantId),
              r = n?.currentBalance ?? n?.balance ?? n?.availableBalance;
            (await ej(0, r),
              ey && (await eS(0)),
              X(''),
              ea('1VOUCHER'),
              Z(!1),
              ei(!0),
              l && window.location.assign(l));
          } catch (e) {
            es(e?.message ?? 'Unable to request payout.');
          } finally {
            en(!1);
          }
        },
        eB = async () => {
          ei(!1);
          let a = await eC(e?.civilServantId),
            t = a?.currentBalance ?? a?.balance ?? a?.availableBalance;
          (await ej(0, t), ey && (await eS(0)));
        },
        eE = async () => {
          await Promise.all([eC(), eS(0)]);
        };
      if (s) return (0, a.jsx)(g, { text: 'Loading your profile…' });
      if (c) return (0, a.jsx)(v, { text: c });
      if (!e) return null;
      let eL = w.find((e) => void 0 !== e.balance && !Number.isNaN(Number(e.balance)))?.balance,
        eU = w.find(
          (e) => void 0 !== e.availableBalance && !Number.isNaN(Number(e.availableBalance))
        )?.availableBalance,
        eT = J?.currentBalance ?? J?.balance ?? J?.availableBalance,
        eD = J?.availableBalance ?? J?.currentBalance ?? J?.balance,
        eR = eT && 0 !== eT ? eT : eL || eU || 0,
        eO = eD && 0 !== eD ? eD : eU || eL || 0,
        e$ = [
          { label: 'Balance', value: eR },
          {
            label: 'Reservations',
            value: $.reduce((e, a) => {
              let t = Number(a.amount ?? 0);
              return e + (Number.isNaN(t) ? 0 : Math.abs(t));
            }, 0),
          },
          { label: 'Available Balance', value: eO },
        ],
        eF = [
          { label: 'Balance', value: eR },
          { label: 'Available Balance', value: eO },
        ];
      return (0, a.jsxs)('main', {
        className: 'min-h-screen bg-amber-50 px-4 pb-16 pt-24 sm:px-6 lg:px-8',
        children: [
          (0, a.jsxs)('div', {
            className: 'mx-auto flex max-w-6xl flex-col gap-8',
            children: [
              (0, a.jsx)(r.DashboardNameCard, {
                name: `${e.firstName} ${e.familyName}`,
                status: e.status ?? 'active',
                accountNumber: e.accountNumber,
              }),
              (0, a.jsx)(h.CivilServantProfileCard, {
                data: {
                  firstName: em.firstName,
                  familyName: em.familyName,
                  occupation: em.occupation,
                  primarySite: em.primarySite,
                  email: em.email,
                  phoneNumber: em.phoneNumber,
                  homeAddress: em.homeAddress,
                  accountNumber: e.accountNumber,
                  walletId: ey ? e.eclipseWalletId : void 0,
                  guardToken: e.guardToken,
                  eclipseCustomerId: ey ? e.eclipseCustomerId : void 0,
                  eclipseWalletId: ey ? e.eclipseWalletId : void 0,
                  qrUrl: u,
                },
                collapsed: eo,
                onToggle: () => ec((e) => !e),
                editing: eb,
                onEditToggle: () => {
                  (eb && eI(), ep((e) => !e));
                },
                onRefresh: async () => {
                  ew(!0);
                  try {
                    await eP({ silent: !0 });
                  } finally {
                    ew(!1);
                  }
                },
                refreshing: eN,
                onFieldChange: (e, a) => ex((t) => ({ ...t, [e]: a })),
                onCancel: () => {
                  (eI(), ep(!1));
                },
                onSave: eA,
                saving: eh,
                feedback: eg,
                showWorkFields: !0,
                showWalletId: ey,
                onViewQr: () => f(!0),
              }),
              (0, a.jsx)(r.DashboardPaymentsCard, {
                title: (0, a.jsx)('div', {
                  className: 'whitespace-pre leading-tight',
                  children: (0, a.jsx)('span', {
                    className: 'block',
                    children: 'TRANSACTION HISTORY',
                  }),
                }),
                collapsed: ed,
                onToggle: () => eu((e) => !e),
                metrics: eF,
                rightActions: (0, a.jsxs)('div', {
                  className: 'flex items-center gap-2',
                  children: [
                    (0, a.jsx)('button', {
                      type: 'button',
                      onClick: () => ej(P, eR),
                      className:
                        'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50',
                      'aria-label': 'Refresh transactions',
                      title: 'Refresh',
                      children: '⟳',
                    }),
                    (0, a.jsx)('button', {
                      type: 'button',
                      onClick: () => Z(!0),
                      className:
                        'inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600',
                      children: ey ? 'Payout' : 'Withdraw',
                    }),
                  ],
                }),
                transactions: w,
                loading: T,
                showBalanceColumn: !0,
                pagination: {
                  onPrev: async () => {
                    P <= 0 || (await ej(Math.max(0, P - 14), eR));
                  },
                  onNext: async () => {
                    await ej(P + 14, eR);
                  },
                  hasPrev: P > 0,
                  hasNext: A,
                  disabled: T,
                },
              }),
              ey &&
                (0, a.jsx)(a.Fragment, {
                  children: (0, a.jsx)(r.DashboardPaymentsCard, {
                    title: (0, a.jsx)('div', {
                      className: 'whitespace-pre leading-tight',
                      children: (0, a.jsx)('span', {
                        className: 'block',
                        children: 'RESERVATIONS',
                      }),
                    }),
                    collapsed: q,
                    onToggle: () => H((e) => !e),
                    metrics: e$,
                    rightActions: (0, a.jsx)('button', {
                      type: 'button',
                      onClick: eE,
                      className:
                        'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50',
                      'aria-label': 'Refresh reservations',
                      title: 'Refresh',
                      children: '⟳',
                    }),
                    transactions: $,
                    loading: K,
                    emptyLabel: 'No reservations.',
                    showBalanceColumn: !1,
                    showExpiresColumn: !0,
                    pagination: {
                      onPrev: async () => {
                        V <= 0 || (await eS(Math.max(0, V - 14)));
                      },
                      onNext: async () => {
                        await eS(V + 14);
                      },
                      hasPrev: V > 0,
                      hasNext: M,
                      disabled: K,
                    },
                  }),
                }),
            ],
          }),
          b && u && (0, a.jsx)(y, { qrUrl: u, onClose: () => f(!1) }),
          er && (0, a.jsx)(N, { onClose: eB }),
          Q &&
            (0, a.jsx)('div', {
              className: 'fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4',
              role: 'button',
              tabIndex: -1,
              onClick: () => Z(!1),
              onKeyDown: (e) => 'Escape' === e.key && Z(!1),
              children: (0, a.jsxs)('div', {
                className: 'relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl',
                onClick: (e) => e.stopPropagation(),
                children: [
                  (0, a.jsx)('button', {
                    type: 'button',
                    onClick: () => Z(!1),
                    className:
                      'absolute right-3 top-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50',
                    children: 'Close',
                  }),
                  (0, a.jsx)('h3', {
                    className: 'text-xl font-semibold text-slate-900',
                    children: 'Request payout',
                  }),
                  (0, a.jsx)('p', {
                    className: 'mt-1 text-sm text-slate-500',
                    children: ey
                      ? 'Choose a payout method and amount. A 1% platform fee will be collected to the tenant wallet.'
                      : 'Choose a payout amount. The 1% platform fee is included in this amount and the remaining value is issued as a voucher.',
                  }),
                  (0, a.jsxs)('div', {
                    className: 'mt-4 space-y-3',
                    children: [
                      (0, a.jsxs)('div', {
                        className:
                          'space-y-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700',
                        children: [
                          (0, a.jsxs)('div', {
                            className: 'flex items-center justify-between',
                            children: [
                              (0, a.jsx)('p', {
                                className: 'font-semibold',
                                children: 'Available Balance',
                              }),
                              (0, a.jsx)('p', {
                                className: 'text-lg font-bold',
                                children: J
                                  ? (0, r.formatCurrency)(J.availableBalance ?? J.balance)
                                  : 'Loading...',
                              }),
                            ],
                          }),
                          (0, a.jsxs)('div', {
                            className: 'flex items-center justify-between',
                            children: [
                              (0, a.jsx)('p', {
                                className: 'font-semibold',
                                children: 'Amount to Withdraw',
                              }),
                              (0, a.jsx)('p', {
                                className: 'text-base font-semibold text-slate-900',
                                children: Y ? (0, r.formatCurrency)(Number(Y)) : '—',
                              }),
                            ],
                          }),
                          (0, a.jsxs)('div', {
                            className: 'flex items-center justify-between text-amber-800',
                            children: [
                              (0, a.jsx)('p', {
                                className: 'font-semibold',
                                children: 'Estimated Fee (1%)',
                              }),
                              (0, a.jsx)('p', {
                                className: 'text-base font-semibold',
                                children: Y ? (0, r.formatCurrency)(0.01 * Number(Y)) : '—',
                              }),
                            ],
                          }),
                          (0, a.jsxs)('div', {
                            className: 'flex items-center justify-between',
                            children: [
                              (0, a.jsx)('p', {
                                className: 'font-semibold',
                                children: 'Voucher Amount (After Fee)',
                              }),
                              (0, a.jsx)('p', {
                                className: 'text-base font-semibold text-slate-900',
                                children: Y
                                  ? (0, r.formatCurrency)(Number(Y) - 0.01 * Number(Y))
                                  : '—',
                              }),
                            ],
                          }),
                          (0, a.jsxs)('div', {
                            className: 'flex items-center justify-between',
                            children: [
                              (0, a.jsx)('p', {
                                className: 'font-semibold',
                                children: 'Balance After Withdrawal',
                              }),
                              (0, a.jsx)('p', {
                                className: 'text-base font-semibold text-slate-900',
                                children:
                                  J && Y
                                    ? (0, r.formatCurrency)(
                                        (J.availableBalance ?? J.balance) - Number(Y)
                                      )
                                    : '—',
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, a.jsxs)('label', {
                        className: 'text-sm font-semibold text-slate-600',
                        children: [
                          'Amount',
                          (0, a.jsx)('input', {
                            type: 'number',
                            min: '0',
                            step: '0.01',
                            value: Y,
                            onChange: (e) => X(e.target.value),
                            className: 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3',
                            placeholder: 'Enter amount',
                          }),
                        ],
                      }),
                      (0, a.jsxs)('label', {
                        className: 'text-sm font-semibold text-slate-600',
                        children: [
                          'Payout Method',
                          (0, a.jsxs)('select', {
                            value: ee,
                            onChange: (e) => ea(e.target.value),
                            className: 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3',
                            children: [
                              (0, a.jsx)('option', {
                                value: '1VOUCHER',
                                children: '1Voucher (SMS code)',
                              }),
                              (0, a.jsx)('option', {
                                value: 'CASH_OUT_PIN',
                                disabled: !0,
                                children: 'Cash-Out PIN (coming soon)',
                              }),
                              (0, a.jsx)('option', {
                                value: 'FLASH_TOKEN',
                                disabled: !0,
                                children: 'Flash Token (coming soon)',
                              }),
                            ],
                          }),
                        ],
                      }),
                      et && (0, a.jsx)('p', { className: 'text-sm text-rose-600', children: et }),
                      (0, a.jsx)('button', {
                        type: 'button',
                        onClick: ek,
                        disabled: el,
                        className:
                          'w-full rounded-2xl bg-orange-500 px-6 py-3 text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-60',
                        children: el ? 'Submitting...' : 'Submit payout',
                      }),
                    ],
                  }),
                ],
              }),
            }),
        ],
      });
    }
    let j = ({ civilServantName: e, amount: t, totalCharge: s, onClose: l }) =>
      (0, a.jsx)('div', {
        className: 'fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 px-4',
        role: 'dialog',
        'aria-modal': 'true',
        onClick: l,
        onKeyDown: (e) => 'Escape' === e.key && l(),
        tabIndex: -1,
        children: (0, a.jsxs)('div', {
          className: 'w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl',
          onClick: (e) => e.stopPropagation(),
          children: [
            (0, a.jsx)('h3', {
              className: 'text-2xl font-semibold text-emerald-700',
              children: 'Payment Successful!',
            }),
            (0, a.jsxs)('p', {
              className: 'mt-3 text-sm text-slate-700',
              children: [
                'PashashaPay has sent ',
                e,
                ' a ',
                (0, r.formatCurrency)(t),
                ' Shoprite Checkers voucher.',
              ],
            }),
            (0, a.jsxs)('p', {
              className: 'mt-2 text-sm text-slate-600',
              children: [
                'Total charged: ',
                (0, a.jsx)('span', {
                  className: 'font-semibold text-slate-900',
                  children: (0, r.formatCurrency)(s),
                }),
              ],
            }),
            (0, a.jsx)('div', {
              className: 'mt-6 flex justify-end',
              children: (0, a.jsx)('button', {
                type: 'button',
                onClick: l,
                className:
                  'rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600',
                children: 'Close',
              }),
            }),
          ],
        }),
      });
    function S() {
      let [e, s] = (0, l.useState)(null),
        [n, o] = (0, l.useState)(null),
        [u, m] = (0, l.useState)(!0),
        [x, b] = (0, l.useState)(null),
        [h, f] = (0, l.useState)([]),
        [y, N] = (0, l.useState)([]),
        [w, S] = (0, l.useState)(0),
        [C, P] = (0, l.useState)(!1),
        [I, A] = (0, l.useState)(0),
        [k, B] = (0, l.useState)(!1),
        [E, L] = (0, l.useState)(!1),
        [U, T] = (0, l.useState)(!1),
        [D, R] = (0, l.useState)(!1),
        [O, $] = (0, l.useState)(!1),
        [F, V] = (0, l.useState)(!1),
        [W, M] = (0, l.useState)({ firstName: '', familyName: '', occupation: '', site: '' }),
        [z, K] = (0, l.useState)([]),
        [G, q] = (0, l.useState)(!1),
        [H, Q] = (0, l.useState)(null),
        [Z, J] = (0, l.useState)(null),
        [_, Y] = (0, l.useState)(null),
        [X, ee] = (0, l.useState)(null),
        [ea, et] = (0, l.useState)(null),
        [es, el] = (0, l.useState)(!1),
        [en, er] = (0, l.useState)(!1),
        [ei, eo] = (0, l.useState)(!1),
        [ec, ed] = (0, l.useState)(null),
        [eu, em] = (0, l.useState)({
          firstName: '',
          familyName: '',
          email: '',
          phoneNumber: '',
          address: '',
        }),
        [ex, eb] = (0, l.useState)(!1),
        [ep, eh] = (0, l.useState)(!1),
        [ef, eg] = (0, l.useState)(null),
        [ev, ey] = (0, l.useState)('ALL'),
        [eN, ew] = (0, l.useState)(''),
        ej = (0, p.eclipseEnabled)(),
        eS = async (e = 0) => {
          L(!0);
          try {
            let a = await d.customerApi.getTransactions({ offset: e, limit: 20 });
            (f((0, i.mapDashboardTransactions)(a ?? [])), S(e), P(14 === (a ?? []).length));
          } catch (e) {
            (b(e?.message ?? 'Unable to load transactions.'), f([]));
          } finally {
            L(!1);
          }
        },
        eC = async (e = 0) => {
          T(!0);
          try {
            let a = await d.customerApi.getSentTransactions({ offset: e, limit: 20 });
            (N((0, i.mapDashboardTransactions)(a ?? [])), A(e), B(14 === (a ?? []).length));
          } catch (e) {
            (b(e?.message ?? 'Unable to load sent payments.'), N([]));
          } finally {
            T(!1);
          }
        },
        eP = async () => {
          try {
            let e = await d.customerApi.getWalletInfo();
            o({
              walletId: e.walletId,
              balance: e.balance,
              availableBalance: e.availableBalance ?? e.balance,
              currentBalance: e.currentBalance ?? e.balance,
              currency: e.currency,
            });
          } catch {}
        },
        eI = async () => {
          (q(!0), et(null));
          try {
            let e = await d.customerApi.searchCivilServants(W);
            K(Array.isArray(e) ? e : []);
          } catch (e) {
            (et(e?.message ?? 'Unable to search civil servants.'), K([]));
          } finally {
            q(!1);
          }
        },
        eA = async (e) => {
          (Q({
            civilServantId: e.civilServantId,
            firstName: e.firstName,
            familyName: e.familyName,
            occupation: e.occupation,
            primarySite: e.primarySite,
          }),
            J(null),
            Y(null),
            ee(null),
            et(null));
          try {
            let a = await c.corePublicApi.lookupCivilServantById(e.civilServantId);
            (J(a.recipient),
              a.recipient.availableVoucherDenominations?.length &&
                ee(a.recipient.availableVoucherDenominations[0]),
              er(!0));
          } catch (e) {
            (et(e?.message ?? 'Unable to load civil servant payment profile.'), J(null), er(!1));
          }
        },
        ek = X ?? null,
        eB = (0, l.useMemo)(() => {
          let e = ek ?? 0,
            a = Number((e + 1.5 + 1).toFixed(2));
          return { voucherAmount: e, ozowFeeAmount: 1.5, platformFeeAmount: 1, totalCharge: a };
        }, [ek]),
        eE = (e) => {
          let a = e?.voucherAmount ?? eB.voucherAmount,
            t = e?.customerChargeAmount ?? eB.totalCharge;
          (Y(e ?? _),
            et('Payment Successful!'),
            el(!1),
            er(!1),
            V(!1),
            ed({
              civilServantName:
                `${H?.firstName ?? ''} ${H?.familyName ?? ''}`.trim() || 'Civil Servant',
              amount: a,
              totalCharge: t,
            }),
            eo(!0),
            eC(0));
        };
      ((0, l.useEffect)(() => {
        let e = _?.paymentIntentId;
        if (!e) return;
        let a = async () => {
          try {
            let a = await c.corePublicApi.getPaymentIntent(e);
            Y(a);
            let t = (a.status ?? '').toLowerCase();
            ['paid', 'completed', 'successful'].includes(t)
              ? eE(a)
              : ['failed', 'cancelled'].includes(t) && et(`Payment ${t}.`);
          } catch {}
        };
        a();
        let t = setInterval(() => {
          a();
        }, 5e3);
        return () => clearInterval(t);
      }, [_?.paymentIntentId]),
        (0, l.useEffect)(() => {
          let e = _?.paymentIntentId;
          if (!e) return;
          let a = async () => {
              try {
                let a = await c.corePublicApi.getPaymentIntent(e);
                Y(a);
                let t = (a.status ?? '').toLowerCase();
                ['paid', 'completed', 'successful'].includes(t)
                  ? eE(a)
                  : ['failed', 'cancelled'].includes(t) && et(`Payment ${t}.`);
              } catch {}
            },
            t = () => {
              a();
            },
            s = () => {
              'visible' === document.visibilityState && a();
            };
          return (
            window.addEventListener('focus', t),
            document.addEventListener('visibilitychange', s),
            () => {
              (window.removeEventListener('focus', t),
                document.removeEventListener('visibilitychange', s));
            }
          );
        }, [_?.paymentIntentId]),
        (0, l.useEffect)(() => {
          let e = (e, a) => {
              if (!a || a !== _?.paymentIntentId) return;
              let t = (e ?? '').toLowerCase();
              if ('success' === t) {
                let e = _ && _.paymentIntentId === a ? { ..._, status: 'successful' } : null;
                e ? eE(e) : et('Payment Successful!');
              } else
                'cancelled' === t
                  ? et('Payment cancelled.')
                  : 'error' === t && et('Payment error.');
            },
            a = (a) => {
              let t = a.data;
              t?.type === 'pashasha-payment-return' && e(t.status, t.paymentIntentId);
            },
            t = (a) => {
              if ('pashasha-payment-return' === a.key && a.newValue)
                try {
                  let t = JSON.parse(a.newValue);
                  e(t.status, t.paymentIntentId);
                } catch {}
            };
          return (
            window.addEventListener('message', a),
            window.addEventListener('storage', t),
            () => {
              (window.removeEventListener('message', a), window.removeEventListener('storage', t));
            }
          );
        }, [_?.paymentIntentId]));
      let eL = async () => {
        if (!H?.civilServantId || !Z) return;
        if ((et(null), Y(null), null === ek)) return void et('Choose a voucher denomination.');
        if (!Z.availableVoucherDenominations.includes(ek))
          return void et(
            'This voucher denomination is not available for the selected civil servant.'
          );
        let a = window.open('', '_blank');
        el(!0);
        try {
          let t = await c.corePublicApi.createPaymentIntent({
            civilServantId: H.civilServantId,
            voucherDenomination: ek,
            paymentEngine: 'ozow',
            customer: {
              customerId: e?.customerId,
              firstName: e?.firstName,
              familyName: e?.familyName,
              email: e?.email,
              phoneNumber: e?.phoneNumber,
            },
          });
          (Y(t),
            et('Payment initiated. Opening OZOW in a new tab...'),
            t.redirectUrl
              ? a
                ? (a.location.href = t.redirectUrl)
                : (window.location.href = t.redirectUrl)
              : a && a.close());
        } catch (e) {
          (a && a.close(), et(e?.message ?? 'Unable to start payment.'));
        } finally {
          el(!1);
        }
      };
      (0, l.useEffect)(() => {
        (async () => {
          (m(!0), b(null));
          try {
            let e = await d.customerApi.getProfile();
            (s(e),
              em({
                firstName: e.firstName ?? '',
                familyName: e.familyName ?? '',
                email: e.email ?? '',
                phoneNumber: e.phoneNumber ?? '',
                address: e.address ?? '',
              }),
              ej ? await Promise.all([eS(0), eC(0), eP()]) : (await eC(0), f([]), o(null)));
          } catch (e) {
            (b(e?.message ?? 'Unable to load profile.'), s(null));
          } finally {
            m(!1);
          }
        })();
      }, [ej]);
      let eU = (0, l.useMemo)(() => {
          let e = h
            .filter((e) => 'SUCCESSFUL' === (e.status ?? '').toUpperCase())
            .reduce((e, a) => e + (a.amount ?? 0), 0);
          return {
            received: e,
            pending: h
              .filter((e) => (e.status ?? '').toUpperCase().includes('PEND'))
              .reduce((e, a) => e + (a.amount ?? 0), 0),
            paidOut: 0,
          };
        }, [h]),
        eT =
          ea ??
          (['paid', 'completed', 'successful'].includes((_?.status ?? '').toLowerCase())
            ? 'Payment Successful!'
            : null),
        eD = (0, l.useMemo)(() => {
          let e = eN.trim().toLowerCase();
          return y.filter((a) => {
            let t = (a.status ?? '').toUpperCase();
            return (
              ('ALL' === ev || t === ev.toUpperCase()) &&
              (!e ||
                [a.civilServantName, a.civilServantId, a.description, a.reference, a.id]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase()
                  .includes(e))
            );
          });
        }, [eN, ev, y]);
      if (u) return (0, a.jsx)(g, { text: 'Loading your profile…' });
      if (x) return (0, a.jsx)(v, { text: x });
      if (!e) return null;
      let eR = n?.currentBalance ?? n?.balance ?? n?.availableBalance ?? eU.received,
        eO = n?.availableBalance ?? n?.currentBalance ?? n?.balance ?? eU.received,
        e$ = async () => {
          (eh(!0), eg(null));
          try {
            await d.customerApi.updateProfile({
              firstName: eu.firstName,
              familyName: eu.familyName,
              email: eu.email,
              phoneNumber: eu.phoneNumber,
              address: eu.address,
            });
            let e = await d.customerApi.getProfile();
            (s(e), eg('Profile updated.'));
          } catch (e) {
            eg(e?.message ?? 'Unable to update profile.');
          } finally {
            eh(!1);
          }
        };
      return (0, a.jsxs)('main', {
        className: 'min-h-screen bg-amber-50 px-4 pb-16 pt-24 sm:px-6 lg:px-8',
        children: [
          (0, a.jsxs)('div', {
            className: 'mx-auto flex max-w-6xl flex-col gap-8',
            children: [
              (0, a.jsx)(r.DashboardNameCard, {
                name: `${e.firstName} ${e.familyName}`,
                status: e.status ?? 'active',
                accountNumber: e.accountNumber,
              }),
              (0, a.jsxs)('section', {
                className:
                  'w-full max-w-4xl self-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm',
                children: [
                  (0, a.jsxs)('header', {
                    className:
                      'flex items-center justify-between gap-3 border-b border-slate-100 pb-3',
                    children: [
                      (0, a.jsx)('p', {
                        className: 'text-xs uppercase tracking-[0.35em] text-slate-400',
                        children: 'Profile',
                      }),
                      (0, a.jsxs)('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          (0, a.jsx)('button', {
                            type: 'button',
                            onClick: () => {
                              (ex &&
                                em({
                                  firstName: e.firstName,
                                  familyName: e.familyName,
                                  email: e.email,
                                  phoneNumber: e.phoneNumber ?? '',
                                  address: e.address ?? '',
                                }),
                                eb((e) => !e));
                            },
                            className:
                              'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50',
                            'aria-label': 'Edit profile',
                            title: 'Edit profile',
                            children: '✎',
                          }),
                          (0, a.jsx)('button', {
                            type: 'button',
                            onClick: () => R((e) => !e),
                            className: 'text-sm font-semibold text-orange-600',
                            children: D ? '▼' : '▲',
                          }),
                        ],
                      }),
                    ],
                  }),
                  !D &&
                    (0, a.jsxs)('div', {
                      className: 'mt-6 space-y-4',
                      children: [
                        (0, a.jsxs)('div', {
                          className: 'grid gap-4 md:grid-cols-2',
                          children: [
                            (0, a.jsxs)('label', {
                              className: 'text-xs font-semibold text-slate-600',
                              children: [
                                'First Name',
                                (0, a.jsx)('input', {
                                  value: eu.firstName,
                                  onChange: (e) => em((a) => ({ ...a, firstName: e.target.value })),
                                  disabled: !ex,
                                  className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${ex ? 'bg-white' : 'bg-slate-50'}`,
                                }),
                              ],
                            }),
                            (0, a.jsxs)('label', {
                              className: 'text-xs font-semibold text-slate-600',
                              children: [
                                'Last Name',
                                (0, a.jsx)('input', {
                                  value: eu.familyName,
                                  onChange: (e) =>
                                    em((a) => ({ ...a, familyName: e.target.value })),
                                  disabled: !ex,
                                  className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${ex ? 'bg-white' : 'bg-slate-50'}`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        (0, a.jsxs)('div', {
                          className: 'grid gap-4 md:grid-cols-2',
                          children: [
                            (0, a.jsxs)('label', {
                              className: 'text-xs font-semibold text-slate-600',
                              children: [
                                'Email',
                                (0, a.jsx)('input', {
                                  type: 'email',
                                  value: eu.email,
                                  onChange: (e) => em((a) => ({ ...a, email: e.target.value })),
                                  disabled: !ex,
                                  className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${ex ? 'bg-white' : 'bg-slate-50'}`,
                                }),
                              ],
                            }),
                            (0, a.jsxs)('label', {
                              className: 'text-xs font-semibold text-slate-600',
                              children: [
                                'Phone',
                                (0, a.jsx)('input', {
                                  value: eu.phoneNumber,
                                  onChange: (e) =>
                                    em((a) => ({ ...a, phoneNumber: e.target.value })),
                                  disabled: !ex,
                                  className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${ex ? 'bg-white' : 'bg-slate-50'}`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        (0, a.jsxs)('label', {
                          className: 'text-xs font-semibold text-slate-600',
                          children: [
                            'Address',
                            (0, a.jsx)('input', {
                              value: eu.address,
                              onChange: (e) => em((a) => ({ ...a, address: e.target.value })),
                              disabled: !ex,
                              className: `mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${ex ? 'bg-white' : 'bg-slate-50'}`,
                            }),
                          ],
                        }),
                        (0, a.jsxs)('div', {
                          className: 'grid gap-4 md:grid-cols-2',
                          children: [
                            (0, a.jsxs)('label', {
                              className: 'text-xs font-semibold text-slate-600',
                              children: [
                                'Pashasha Account',
                                (0, a.jsx)('input', {
                                  value: e.accountNumber,
                                  disabled: !0,
                                  className:
                                    'mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700',
                                }),
                              ],
                            }),
                            ej &&
                              (0, a.jsxs)('label', {
                                className: 'text-xs font-semibold text-slate-600',
                                children: [
                                  'Wallet ID',
                                  (0, a.jsx)('input', {
                                    value: e.eclipseWalletId ?? 'Not linked',
                                    disabled: !0,
                                    className:
                                      'mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700',
                                  }),
                                ],
                              }),
                          ],
                        }),
                        (0, a.jsxs)('div', {
                          className: 'flex flex-wrap items-center justify-between gap-3',
                          children: [
                            ef &&
                              (0, a.jsx)('p', {
                                className: `text-sm ${ef.includes('updated') ? 'text-emerald-600' : 'text-rose-600'}`,
                                children: ef,
                              }),
                            ex &&
                              (0, a.jsxs)('div', {
                                className: 'flex items-center gap-2',
                                children: [
                                  (0, a.jsx)('button', {
                                    type: 'button',
                                    onClick: () => {
                                      (em({
                                        firstName: e.firstName,
                                        familyName: e.familyName,
                                        email: e.email,
                                        phoneNumber: e.phoneNumber ?? '',
                                        address: e.address ?? '',
                                      }),
                                        eb(!1),
                                        eg(null));
                                    },
                                    className:
                                      'rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50',
                                    children: 'Cancel',
                                  }),
                                  (0, a.jsx)('button', {
                                    type: 'button',
                                    onClick: e$,
                                    disabled: ep,
                                    className:
                                      'btn-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60',
                                    children: ep ? 'Saving...' : 'Save profile',
                                  }),
                                ],
                              }),
                          ],
                        }),
                      ],
                    }),
                ],
              }),
              !ej &&
                (0, a.jsx)('section', {
                  className:
                    'w-full max-w-4xl self-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm',
                  children: (0, a.jsxs)('div', {
                    className: 'flex flex-wrap items-center justify-between gap-3',
                    children: [
                      (0, a.jsxs)('div', {
                        children: [
                          (0, a.jsx)('p', {
                            className: 'text-xs uppercase tracking-[0.35em] text-slate-400',
                            children: 'Payments',
                          }),
                          (0, a.jsx)('p', {
                            className: 'mt-1 text-sm text-slate-600',
                            children: 'Send digital voucher to Civil Servant.',
                          }),
                        ],
                      }),
                      (0, a.jsx)('button', {
                        type: 'button',
                        onClick: () => {
                          (V(!0), et(null));
                        },
                        className:
                          'inline-flex items-center gap-2 rounded-full border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50',
                        children: 'Send digital voucher to Civil Servant',
                      }),
                    ],
                  }),
                }),
              ej &&
                (0, a.jsx)(r.DashboardPaymentsCard, {
                  title: 'Payments',
                  collapsed: O,
                  onToggle: () => $((e) => !e),
                  balance: eR,
                  availableBalance: eO,
                  transactions: h,
                  loading: E,
                  rightActions: (0, a.jsx)('button', {
                    type: 'button',
                    onClick: () => {
                      (V(!0), et(null));
                    },
                    className:
                      'inline-flex items-center gap-2 rounded-full border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50',
                    children: 'Send digital voucher to Civil Servant',
                  }),
                  pagination: {
                    onPrev: async () => {
                      w <= 0 || (await eS(Math.max(0, w - 14)));
                    },
                    onNext: async () => {
                      await eS(w + 14);
                    },
                    hasPrev: w > 0,
                    hasNext: C,
                    disabled: E,
                  },
                }),
              (0, a.jsx)(r.DashboardPaymentsCard, {
                title: 'Sent payments',
                collapsed: O,
                onToggle: () => $((e) => !e),
                balance: eR,
                availableBalance: eO,
                transactions: eD,
                loading: U,
                emptyLabel: 'No sent payments match this filter.',
                showBalanceColumn: !1,
                actions: (0, a.jsxs)('div', {
                  className: 'flex flex-wrap items-center gap-2',
                  children: [
                    (0, a.jsx)('input', {
                      value: eN,
                      onChange: (e) => ew(e.target.value),
                      placeholder: 'Filter by civil servant',
                      className:
                        'rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700',
                    }),
                    (0, a.jsxs)('select', {
                      value: ev,
                      onChange: (e) => ey(e.target.value),
                      className:
                        'rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700',
                      children: [
                        (0, a.jsx)('option', { value: 'ALL', children: 'All statuses' }),
                        (0, a.jsx)('option', { value: 'SUCCESSFUL', children: 'Successful' }),
                        (0, a.jsx)('option', { value: 'PENDING', children: 'Pending' }),
                        (0, a.jsx)('option', { value: 'FAILED', children: 'Failed' }),
                      ],
                    }),
                    ej &&
                      (0, a.jsxs)('span', {
                        className: 'text-xs text-slate-500',
                        children: ['Wallet: ', n?.walletId ?? '—'],
                      }),
                  ],
                }),
                pagination: {
                  onPrev: async () => {
                    I <= 0 || (await eC(Math.max(0, I - 14)));
                  },
                  onNext: async () => {
                    await eC(I + 14);
                  },
                  hasPrev: I > 0,
                  hasNext: k,
                  disabled: U,
                },
              }),
            ],
          }),
          F &&
            (0, a.jsx)('div', {
              className: 'fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4',
              role: 'button',
              tabIndex: -1,
              onClick: () => V(!1),
              onKeyDown: (e) => 'Escape' === e.key && V(!1),
              children: (0, a.jsxs)('div', {
                className: 'relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl',
                onClick: (e) => e.stopPropagation(),
                children: [
                  (0, a.jsx)('button', {
                    type: 'button',
                    onClick: () => V(!1),
                    className:
                      'absolute right-3 top-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50',
                    children: 'Close',
                  }),
                  (0, a.jsx)('h3', {
                    className: 'text-xl font-semibold text-slate-900',
                    children: 'Pay a Civil Servant',
                  }),
                  (0, a.jsx)('p', {
                    className: 'mt-1 text-sm text-slate-600',
                    children:
                      'Search for a civil servant and send a payment without scanning a QR code.',
                  }),
                  (0, a.jsx)('div', {
                    className: 'mt-4 space-y-4',
                    children: (0, a.jsxs)('div', {
                      className: 'space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4',
                      children: [
                        (0, a.jsx)('h4', {
                          className: 'text-sm font-semibold text-slate-900',
                          children: 'Search',
                        }),
                        (0, a.jsxs)('div', {
                          className: 'grid gap-3 md:grid-cols-2',
                          children: [
                            (0, a.jsxs)('label', {
                              className: 'text-xs font-semibold text-slate-600',
                              children: [
                                'First name',
                                (0, a.jsx)('input', {
                                  value: W.firstName,
                                  onChange: (e) => M((a) => ({ ...a, firstName: e.target.value })),
                                  className:
                                    'mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2',
                                  placeholder: 'e.g. John',
                                }),
                              ],
                            }),
                            (0, a.jsxs)('label', {
                              className: 'text-xs font-semibold text-slate-600',
                              children: [
                                'Last name',
                                (0, a.jsx)('input', {
                                  value: W.familyName,
                                  onChange: (e) => M((a) => ({ ...a, familyName: e.target.value })),
                                  className:
                                    'mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2',
                                  placeholder: 'e.g. Doe',
                                }),
                              ],
                            }),
                            (0, a.jsxs)('label', {
                              className: 'text-xs font-semibold text-slate-600',
                              children: [
                                'Occupation',
                                (0, a.jsx)('input', {
                                  value: W.occupation,
                                  onChange: (e) => M((a) => ({ ...a, occupation: e.target.value })),
                                  className:
                                    'mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2',
                                  placeholder: 'e.g. Guard',
                                }),
                              ],
                            }),
                            (0, a.jsxs)('label', {
                              className: 'text-xs font-semibold text-slate-600',
                              children: [
                                'Site',
                                (0, a.jsx)('input', {
                                  value: W.site,
                                  onChange: (e) => M((a) => ({ ...a, site: e.target.value })),
                                  className:
                                    'mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2',
                                  placeholder: 'e.g. Mall',
                                }),
                              ],
                            }),
                          ],
                        }),
                        (0, a.jsx)('button', {
                          type: 'button',
                          onClick: eI,
                          disabled: G,
                          className:
                            'btn-primary w-full px-4 py-2 text-sm font-semibold text-white',
                          children: G ? 'Searching...' : 'Search',
                        }),
                        (0, a.jsxs)('div', {
                          className: 'max-h-64 space-y-2 overflow-y-auto',
                          children: [
                            z.map((e) =>
                              (0, a.jsxs)(
                                'button',
                                {
                                  type: 'button',
                                  onClick: () => eA(e),
                                  className: `w-full rounded-2xl border px-4 py-3 text-left transition ${H?.civilServantId === e.civilServantId ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'}`,
                                  children: [
                                    (0, a.jsxs)('p', {
                                      className: 'text-sm font-semibold text-slate-900',
                                      children: [e.firstName, ' ', e.familyName],
                                    }),
                                    (0, a.jsxs)('p', {
                                      className: 'text-xs text-slate-500',
                                      children: [
                                        e.occupation,
                                        ' · ',
                                        e.primarySite || 'Assigned site',
                                      ],
                                    }),
                                  ],
                                },
                                e.civilServantId
                              )
                            ),
                            !G &&
                              0 === z.length &&
                              (0, a.jsx)('p', {
                                className: 'text-xs text-slate-500',
                                children: 'No results yet.',
                              }),
                          ],
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            }),
          F &&
            en &&
            H &&
            (0, a.jsx)('div', {
              className: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4',
              role: 'button',
              tabIndex: -1,
              onClick: () => er(!1),
              onKeyDown: (e) => 'Escape' === e.key && er(!1),
              children: (0, a.jsxs)('div', {
                className: 'relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl',
                onClick: (e) => e.stopPropagation(),
                children: [
                  (0, a.jsx)('button', {
                    type: 'button',
                    onClick: () => er(!1),
                    className:
                      'absolute right-3 top-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50',
                    children: 'Close',
                  }),
                  (0, a.jsxs)('div', {
                    className: 'space-y-3 rounded-2xl border border-slate-200 bg-white p-1',
                    children: [
                      (0, a.jsx)('h4', {
                        className: 'text-sm font-semibold text-slate-900',
                        children: 'Payment',
                      }),
                      (0, a.jsxs)('p', {
                        className: 'text-sm font-semibold text-slate-800',
                        children: [H.firstName, ' ', H.familyName],
                      }),
                      (0, a.jsxs)('p', {
                        className: 'text-xs text-slate-500',
                        children: [H.occupation, ' · ', H.primarySite || 'Assigned site pending'],
                      }),
                      (0, a.jsxs)('div', {
                        className: 'rounded-2xl border border-slate-200 bg-slate-50 p-4',
                        children: [
                          (0, a.jsx)('p', {
                            className:
                              'text-xs font-semibold uppercase tracking-wide text-slate-500',
                            children: 'Voucher type',
                          }),
                          (0, a.jsx)('div', {
                            className: 'mt-3',
                            children: (0, a.jsxs)('button', {
                              type: 'button',
                              className:
                                'inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 shadow-sm',
                              children: [
                                (0, a.jsx)(t.default, {
                                  src: '/pashasha-checkers-logo.png',
                                  alt: 'Checkers',
                                  width: 18,
                                  height: 18,
                                  className: 'h-[18px] w-[18px] rounded-full object-contain',
                                }),
                                'Shoprite Checkers',
                              ],
                            }),
                          }),
                          (0, a.jsx)('p', {
                            className: 'mt-3 text-sm text-slate-700',
                            children:
                              'Choose a Shoprite Checkers voucher denomination below. Once payment is confirmed, a Shoprite Checkers voucher code is allocated securely and delivered to the civil servant by SMS.',
                          }),
                        ],
                      }),
                      (0, a.jsx)('div', {
                        className: 'flex flex-wrap gap-2',
                        children: (Z?.availableVoucherDenominations ?? []).map((e) =>
                          (0, a.jsx)(
                            'button',
                            {
                              type: 'button',
                              onClick: () => ee(e),
                              className: `rounded-full px-4 py-2 text-sm font-semibold transition ${ek === e ? 'bg-orange-500 text-white' : 'border border-slate-200 bg-slate-50 text-slate-800 hover:border-orange-200'}`,
                              children: (0, r.formatCurrency)(e),
                            },
                            e
                          )
                        ),
                      }),
                      null !== ek &&
                        (0, a.jsxs)('div', {
                          className: 'rounded-2xl border border-slate-200 bg-slate-50 p-4',
                          children: [
                            (0, a.jsx)('p', {
                              className:
                                'text-xs font-semibold uppercase tracking-wide text-slate-500',
                              children: 'Payment summary',
                            }),
                            (0, a.jsxs)('div', {
                              className: 'mt-3 space-y-2 text-sm text-slate-700',
                              children: [
                                (0, a.jsxs)('div', {
                                  className: 'flex items-center justify-between gap-4',
                                  children: [
                                    (0, a.jsx)('span', { children: 'Voucher amount' }),
                                    (0, a.jsx)('span', {
                                      className: 'font-semibold text-slate-900',
                                      children: (0, r.formatCurrency)(eB.voucherAmount),
                                    }),
                                  ],
                                }),
                                (0, a.jsxs)('div', {
                                  className: 'flex items-center justify-between gap-4',
                                  children: [
                                    (0, a.jsx)('span', { children: 'OZOW fee' }),
                                    (0, a.jsx)('span', {
                                      className: 'font-semibold text-slate-900',
                                      children: (0, r.formatCurrency)(eB.ozowFeeAmount),
                                    }),
                                  ],
                                }),
                                (0, a.jsxs)('div', {
                                  className: 'flex items-center justify-between gap-4',
                                  children: [
                                    (0, a.jsx)('span', { children: 'Pashasha fee' }),
                                    (0, a.jsx)('span', {
                                      className: 'font-semibold text-slate-900',
                                      children: (0, r.formatCurrency)(eB.platformFeeAmount),
                                    }),
                                  ],
                                }),
                                (0, a.jsxs)('div', {
                                  className:
                                    'flex items-center justify-between gap-4 border-t border-slate-200 pt-2',
                                  children: [
                                    (0, a.jsx)('span', {
                                      className: 'font-semibold text-slate-900',
                                      children: 'Total charge',
                                    }),
                                    (0, a.jsx)('span', {
                                      className: 'font-semibold text-slate-900',
                                      children: (0, r.formatCurrency)(eB.totalCharge),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      _ &&
                        (0, a.jsxs)('div', {
                          className:
                            'rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900',
                          children: [
                            (0, a.jsxs)('p', {
                              children: [
                                'Payment reference: ',
                                (0, a.jsx)('span', {
                                  className: 'font-semibold',
                                  children: _.paymentIntentId,
                                }),
                              ],
                            }),
                            (0, a.jsxs)('p', {
                              className: 'mt-1',
                              children: [
                                'Status: ',
                                (0, a.jsx)('span', {
                                  className: 'font-semibold capitalize',
                                  children: _.status,
                                }),
                              ],
                            }),
                          ],
                        }),
                      eT &&
                        (0, a.jsx)('p', {
                          className: `text-xs font-semibold ${'Payment Successful!' === eT ? 'text-emerald-600' : eT.toLowerCase().includes('cancelled') || eT.toLowerCase().includes('error') || eT.toLowerCase().includes('unable') ? 'text-rose-600' : 'text-slate-600'}`,
                          children: eT,
                        }),
                      (0, a.jsx)('button', {
                        type: 'button',
                        onClick: eL,
                        disabled: es || !Z?.availableVoucherDenominations?.length,
                        className:
                          'btn-primary w-full px-4 py-3 text-sm font-semibold text-white disabled:opacity-60',
                        children: es ? 'Processing...' : 'Pay now',
                      }),
                    ],
                  }),
                ],
              }),
            }),
          ei &&
            ec &&
            (0, a.jsx)(j, {
              civilServantName: ec.civilServantName,
              amount: ec.amount,
              totalCharge: ec.totalCharge,
              onClose: () => {
                (eo(!1), ed(null), Y(null), et(null));
              },
            }),
        ],
      });
    }
    function C() {
      let [e, t] = (0, l.useState)(() => (0, u.getSession)()),
        s = (0, n.useRouter)(),
        [r, i] = (0, l.useState)(() => {
          let e = (0, u.getSession)()?.groups;
          return (0, b.isAdminGroup)(e)
            ? 'admin'
            : (0, b.isCivilServantGroup)(e)
              ? 'civil-servant'
              : (0, b.isCustomerGroup)(e)
                ? 'customer'
                : 'unknown';
        }),
        c = (0, b.isCivilServantGroup)(e?.groups),
        m = (0, b.isCustomerGroup)(e?.groups),
        x = (0, b.isAdminGroup)(e?.groups);
      return ((0, l.useEffect)(() => {
        let e = () => {
          let e = (0, u.getSession)();
          (t(e),
            (0, b.isAdminGroup)(e?.groups)
              ? i('admin')
              : (0, b.isCivilServantGroup)(e?.groups)
                ? i('civil-servant')
                : (0, b.isCustomerGroup)(e?.groups)
                  ? i('customer')
                  : i('unknown'));
        };
        return (
          window.addEventListener(u.sessionEventName, e),
          () => {
            window.removeEventListener(u.sessionEventName, e);
          }
        );
      }, []),
      (0, l.useEffect)(() => {
        e && x && s.replace('/admin');
      }, [x, s, e]),
      (0, l.useEffect)(() => {
        if (!e) return void i('unknown');
        if (x) return void i('admin');
        if (c) return void i('civil-servant');
        if (m) return void i('customer');
        let a = !1;
        return (
          (async () => {
            try {
              (await o.guardApi.getProfile(), a || i('civil-servant'));
              return;
            } catch {}
            try {
              (await d.customerApi.getProfile(), a || i('customer'));
              return;
            } catch {
              a || i('unknown');
            }
          })(),
          () => {
            a = !0;
          }
        );
      }, [x, c, m, e]),
      e)
        ? 'admin' === r
          ? null
          : 'civil-servant' === r
            ? (0, a.jsx)(w, {})
            : 'customer' === r
              ? (0, a.jsx)(S, {})
              : (0, a.jsx)(g, { text: 'Loading your dashboard…' })
        : (0, a.jsx)(f, {});
    }
    e.s(['default', () => C], 96345);
  },
]);
