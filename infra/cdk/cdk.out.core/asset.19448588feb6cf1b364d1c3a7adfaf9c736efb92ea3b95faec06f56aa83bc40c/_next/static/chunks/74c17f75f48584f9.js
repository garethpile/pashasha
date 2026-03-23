(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  73974,
  (e) => {
    'use strict';
    var t = e.i(43476),
      a = e.i(71645),
      s = e.i(18566);
    let r = (0, e.i(75863).resolveApiRoot)(),
      o = async (e) => {
        try {
          let t = await e.json();
          if (Array.isArray(t?.message)) return t.message.join(' • ');
          if ('string' == typeof t?.message) return t.message;
          return JSON.stringify(t);
        } catch {
          return e.statusText || 'Request failed';
        }
      },
      n = async (e) => {
        let t = await fetch(`${r}/auth/check-email?email=${encodeURIComponent(e)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!t.ok) throw Error((await o(t)) || 'Unable to check email');
        return await t.json();
      },
      i = async (e) => {
        let t = await fetch(`${r}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(e),
        });
        if (!t.ok) throw Error((await o(t)) || 'Unable to complete signup');
        return await t.json();
      },
      l = async (e) => {
        let t = await fetch(`${r}/auth/confirm-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(e),
        });
        if (!t.ok) throw Error((await o(t)) || 'Unable to confirm signup');
        return await t.json();
      },
      d = async (e) => {
        let t = await fetch(`${r}/auth/resend-signup-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: e }),
        });
        if (!t.ok) throw Error((await o(t)) || 'Unable to resend verification code');
        return await t.json();
      };
    function c() {
      let e = (0, s.useRouter)(),
        [r, o] = (0, a.useState)({
          firstName: '',
          familyName: '',
          email: '',
          phoneNumber: '',
          address: '',
          occupation: '',
          otherOccupation: '',
          primarySite: '',
          password: '',
          role: 'CIVIL_SERVANT',
        }),
        [c, u] = (0, a.useState)(''),
        [m, p] = (0, a.useState)(!1),
        [x, h] = (0, a.useState)(!1),
        [f, g] = (0, a.useState)(null),
        [b, y] = (0, a.useState)(null),
        [v, w] = (0, a.useState)(''),
        [N, j] = (0, a.useState)(''),
        [C, S] = (0, a.useState)(''),
        [O, k] = (0, a.useState)(!1),
        [T, A] = (0, a.useState)(!1),
        P = 'CUSTOMER' === r.role,
        E = 'other' === (r.occupation ?? '').toLowerCase(),
        U = C.toLowerCase().includes('@') ? 'email' : 'mobile',
        q = async (e) => {
          (e.preventDefault(), y(null), g(null), h(!0));
          try {
            if (!r.password.trim()) return void y('Password is required.');
            let e = r.email?.trim() ?? '',
              t = r.phoneNumber?.trim() ?? '';
            if (!e && !t) return void y('Please provide at least an email or a phone number.');
            let a = r.password.trim();
            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(a))
              return void y(
                'Password must be at least 8 characters and include upper, lower, a number, and a symbol.'
              );
            if (a !== c.trim()) return void y('Passwords do not match.');
            if (!P) {
              if (!r.occupation?.trim())
                return void y('Occupation is required for civil servants.');
              if (!r.primarySite?.trim())
                return void y('Primary site is required for civil servants.');
              if (E && !r.otherOccupation?.trim()) return void y('Please enter your occupation.');
            }
            if (e) {
              let t = await n(e);
              if (t.exists)
                return void y(
                  `This email is already registered${t.type ? ` as a ${t.type}` : ''}. Please use another address or reset credentials.`
                );
            }
            let s = {
                ...r,
                phoneNumber: r.phoneNumber?.trim() || void 0,
                email: r.email?.trim() || void 0,
                address: r.address?.trim() || void 0,
                occupation: P ? void 0 : r.occupation?.trim(),
                otherOccupation: P || !E ? void 0 : r.otherOccupation?.trim(),
                primarySite: P ? void 0 : r.primarySite?.trim(),
                password: a,
              },
              o = await i(s),
              l = o.username ?? s.email?.trim() ?? s.phoneNumber?.trim() ?? '',
              d = o.codeDelivery?.destination ?? s.email?.trim() ?? s.phoneNumber?.trim() ?? '',
              u = o.codeDelivery?.medium?.toLowerCase();
            (j(l),
              S(d),
              g(
                `We sent a verification code by ${'sms' === u ? 'SMS' : 'email' === u ? 'email' : 'your selected contact method'}. Enter it below to finish registration.`
              ));
          } catch (e) {
            y(e?.message ?? 'Unable to complete signup.');
          } finally {
            h(!1);
          }
        },
        R = async (t) => {
          if ((t.preventDefault(), y(null), g(null), !N || !v.trim()))
            return void y('Enter the verification code you received.');
          A(!0);
          try {
            (await l({ username: N, confirmationCode: v.trim() }),
              e.push('/login?message=verified'));
          } catch (e) {
            y(e?.message ?? 'Unable to verify code.');
          } finally {
            A(!1);
          }
        },
        $ = async () => {
          if (N) {
            (y(null), g(null), k(!0));
            try {
              let e = await d(N),
                t = e.codeDelivery?.destination ?? C;
              (t && S(t), g('A new verification code has been sent.'));
            } catch (e) {
              y(e?.message ?? 'Unable to resend verification code.');
            } finally {
              k(!1);
            }
          }
        };
      return (0, t.jsx)('main', {
        className:
          'min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4 py-10 md:py-16',
        children: (0, t.jsxs)('div', {
          className:
            'mx-auto max-w-5xl rounded-[32px] bg-white/80 p-6 sm:p-10 shadow-2xl backdrop-blur-sm ring-1 ring-orange-100/80',
          children: [
            (0, t.jsxs)('div', {
              className: 'flex flex-col gap-6 md:flex-row md:items-center md:justify-between',
              children: [
                (0, t.jsxs)('div', {
                  className: 'max-w-2xl space-y-2',
                  children: [
                    (0, t.jsx)('h1', {
                      className: 'text-3xl font-bold text-slate-900 sm:text-4xl',
                      children: P ? 'Create a Customer Account' : 'Create a Civil Servant Account',
                    }),
                    (0, t.jsx)('p', {
                      className: 'text-base text-slate-600 sm:text-lg',
                      children: P
                        ? 'A customer account will allow you to easily pay civil servants and track the progress of those payments. Complete your details below.'
                        : 'A civil servant account will allow you to be easily paid for your services. You will also be able to track payments to you and payouts. Complete your details below.',
                    }),
                  ],
                }),
                (0, t.jsx)('div', {
                  className: 'flex items-center justify-center',
                  children: (0, t.jsxs)('div', {
                    className:
                      'flex rounded-full border border-orange-200 bg-orange-50 px-1 py-1 shadow-sm shadow-orange-100',
                    children: [
                      (0, t.jsx)('button', {
                        type: 'button',
                        className: `rounded-full px-4 py-2 text-sm font-semibold transition ${P ? 'bg-white text-orange-600 shadow' : 'text-slate-700'}`,
                        onClick: () => o((e) => ({ ...e, role: 'CUSTOMER' })),
                        children: 'Customer',
                      }),
                      (0, t.jsx)('button', {
                        type: 'button',
                        className: `rounded-full px-4 py-2 text-sm font-semibold transition ${!P ? 'bg-white text-orange-600 shadow' : 'text-slate-700'}`,
                        onClick: () => o((e) => ({ ...e, role: 'CIVIL_SERVANT' })),
                        children: 'Civil servant',
                      }),
                    ],
                  }),
                }),
              ],
            }),
            N
              ? (0, t.jsxs)('form', {
                  onSubmit: R,
                  className: 'mt-10 space-y-6',
                  children: [
                    (0, t.jsxs)('div', {
                      className:
                        'rounded-3xl border border-orange-200 bg-orange-50/70 p-5 text-slate-700',
                      children: [
                        (0, t.jsx)('h2', {
                          className: 'text-xl font-semibold text-slate-900',
                          children: 'Verify your account',
                        }),
                        (0, t.jsxs)('p', {
                          className: 'mt-2 text-sm leading-6',
                          children: [
                            'Enter the verification code sent to your ',
                            U,
                            C ? ` (${C})` : '',
                            '. Once confirmed, you will return to login.',
                          ],
                        }),
                      ],
                    }),
                    (0, t.jsxs)('label', {
                      className: 'block text-sm font-semibold text-slate-600',
                      children: [
                        'Verification code',
                        (0, t.jsx)('input', {
                          required: !0,
                          inputMode: 'numeric',
                          autoComplete: 'one-time-code',
                          value: v,
                          onChange: (e) => w(e.target.value),
                          className:
                            'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100',
                          placeholder: 'Enter the code',
                        }),
                      ],
                    }),
                    (0, t.jsxs)('div', {
                      className: 'flex flex-col gap-3 sm:flex-row',
                      children: [
                        (0, t.jsx)('button', {
                          type: 'submit',
                          disabled: T,
                          className:
                            'flex-1 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-white shadow-lg transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-60',
                          children: T ? 'Verifying...' : 'Verify code',
                        }),
                        (0, t.jsx)('button', {
                          type: 'button',
                          disabled: O,
                          onClick: $,
                          className:
                            'rounded-2xl border border-orange-200 bg-white px-6 py-3 font-semibold text-orange-600 transition hover:bg-orange-50 disabled:opacity-60',
                          children: O ? 'Resending...' : 'Resend code',
                        }),
                      ],
                    }),
                  ],
                })
              : (0, t.jsxs)('form', {
                  onSubmit: q,
                  className: 'mt-10 space-y-4 sm:space-y-5',
                  children: [
                    (0, t.jsxs)('div', {
                      className: 'grid gap-4 md:grid-cols-2',
                      children: [
                        (0, t.jsxs)('label', {
                          className: 'text-sm font-semibold text-slate-600',
                          children: [
                            'First name ',
                            (0, t.jsx)('span', { className: 'text-rose-600', children: '*' }),
                            (0, t.jsx)('input', {
                              required: !0,
                              value: r.firstName,
                              onChange: (e) => o((t) => ({ ...t, firstName: e.target.value })),
                              className:
                                'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100',
                            }),
                          ],
                        }),
                        (0, t.jsxs)('label', {
                          className: 'text-sm font-semibold text-slate-600',
                          children: [
                            'Family name ',
                            (0, t.jsx)('span', { className: 'text-rose-600', children: '*' }),
                            (0, t.jsx)('input', {
                              required: !0,
                              value: r.familyName,
                              onChange: (e) => o((t) => ({ ...t, familyName: e.target.value })),
                              className:
                                'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100',
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, t.jsxs)('div', {
                      className: 'relative grid gap-4 md:grid-cols-2 md:items-center',
                      children: [
                        (0, t.jsxs)('label', {
                          className: 'text-sm font-semibold text-slate-600',
                          children: [
                            'Email',
                            (0, t.jsx)('input', {
                              type: 'email',
                              value: r.email,
                              onChange: (e) => o((t) => ({ ...t, email: e.target.value })),
                              className:
                                'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100',
                              placeholder: 'you@example.com',
                            }),
                          ],
                        }),
                        (0, t.jsxs)('label', {
                          className: 'text-sm font-semibold text-slate-600',
                          children: [
                            'Mobile',
                            (0, t.jsx)('input', {
                              value: r.phoneNumber,
                              onChange: (e) => o((t) => ({ ...t, phoneNumber: e.target.value })),
                              className:
                                'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100',
                              placeholder: '+27...',
                            }),
                          ],
                        }),
                        (0, t.jsx)('div', {
                          className:
                            'pointer-events-none absolute inset-0 flex items-center justify-center',
                          children: (0, t.jsx)('span', {
                            className:
                              'rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 shadow-sm',
                            children: 'AND / OR',
                          }),
                        }),
                      ],
                    }),
                    (0, t.jsxs)('label', {
                      className: 'text-sm font-semibold text-slate-600',
                      children: [
                        'Home address ',
                        (0, t.jsx)('span', { className: 'text-rose-600', children: '*' }),
                        (0, t.jsx)('input', {
                          required: !0,
                          value: r.address,
                          onChange: (e) => o((t) => ({ ...t, address: e.target.value })),
                          className:
                            'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100',
                        }),
                      ],
                    }),
                    !P &&
                      (0, t.jsxs)('div', {
                        className: 'grid gap-4 md:grid-cols-2',
                        children: [
                          (0, t.jsxs)('label', {
                            className: 'text-sm font-semibold text-slate-600',
                            children: [
                              'Occupation',
                              (0, t.jsxs)('select', {
                                required: !0,
                                value: r.occupation,
                                onChange: (e) =>
                                  o((t) => ({
                                    ...t,
                                    occupation: e.target.value,
                                    otherOccupation:
                                      'Other' === e.target.value ? t.otherOccupation : '',
                                  })),
                                className:
                                  'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100',
                                children: [
                                  (0, t.jsx)('option', {
                                    value: '',
                                    children: 'Select occupation',
                                  }),
                                  (0, t.jsx)('option', {
                                    value: 'Security Guard',
                                    children: 'Security Guard',
                                  }),
                                  (0, t.jsx)('option', {
                                    value: 'Parking Attendant',
                                    children: 'Parking Attendant',
                                  }),
                                  (0, t.jsx)('option', {
                                    value: 'Golf Caddy',
                                    children: 'Golf Caddy',
                                  }),
                                  (0, t.jsx)('option', {
                                    value: 'Unemployed',
                                    children: 'Unemployed',
                                  }),
                                  (0, t.jsx)('option', { value: 'Other', children: 'Other' }),
                                ],
                              }),
                            ],
                          }),
                          (0, t.jsxs)('label', {
                            className: 'text-sm font-semibold text-slate-600',
                            children: [
                              'Primary Site ',
                              (0, t.jsx)('span', { className: 'text-rose-600', children: '*' }),
                              (0, t.jsx)('input', {
                                required: !0,
                                value: r.primarySite,
                                onChange: (e) => o((t) => ({ ...t, primarySite: e.target.value })),
                                className:
                                  'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100',
                                placeholder: 'Where do you mainly work?',
                              }),
                            ],
                          }),
                          E &&
                            (0, t.jsxs)('label', {
                              className: 'text-sm font-semibold text-slate-600',
                              children: [
                                'Please specify',
                                (0, t.jsx)('input', {
                                  required: !0,
                                  value: r.otherOccupation,
                                  onChange: (e) =>
                                    o((t) => ({ ...t, otherOccupation: e.target.value })),
                                  className:
                                    'mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100',
                                  placeholder: 'Enter your occupation',
                                }),
                              ],
                            }),
                        ],
                      }),
                    (0, t.jsxs)('div', {
                      className: 'grid gap-4 md:grid-cols-2',
                      children: [
                        (0, t.jsxs)('label', {
                          className: 'text-sm font-semibold text-slate-600',
                          children: [
                            'Password ',
                            (0, t.jsx)('span', { className: 'text-rose-600', children: '*' }),
                            (0, t.jsxs)('div', {
                              className: 'relative mt-1',
                              children: [
                                (0, t.jsx)('input', {
                                  required: !0,
                                  type: m ? 'text' : 'password',
                                  value: r.password,
                                  onChange: (e) => o((t) => ({ ...t, password: e.target.value })),
                                  className:
                                    'w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100',
                                  placeholder: 'Minimum 8 chars, upper/lower/number',
                                }),
                                (0, t.jsx)('button', {
                                  type: 'button',
                                  onClick: () => p((e) => !e),
                                  className:
                                    'absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700',
                                  'aria-label': m ? 'Hide password' : 'Show password',
                                  children: m ? '🙈' : '👁️',
                                }),
                              ],
                            }),
                          ],
                        }),
                        (0, t.jsxs)('label', {
                          className: 'text-sm font-semibold text-slate-600',
                          children: [
                            'Confirm password ',
                            (0, t.jsx)('span', { className: 'text-rose-600', children: '*' }),
                            (0, t.jsxs)('div', {
                              className: 'relative mt-1',
                              children: [
                                (0, t.jsx)('input', {
                                  required: !0,
                                  type: m ? 'text' : 'password',
                                  value: c,
                                  onChange: (e) => u(e.target.value),
                                  className:
                                    'w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100',
                                }),
                                (0, t.jsx)('button', {
                                  type: 'button',
                                  onClick: () => p((e) => !e),
                                  className:
                                    'absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700',
                                  'aria-label': m ? 'Hide passwords' : 'Show passwords',
                                  children: m ? '🙈' : '👁️',
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, t.jsx)('button', {
                      type: 'submit',
                      disabled: x,
                      className:
                        'w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-white shadow-lg transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-60',
                      children: x ? 'Submitting...' : 'Submit',
                    }),
                  ],
                }),
            f &&
              (0, t.jsx)('p', {
                className: 'mt-4 rounded-xl bg-green-50 px-4 py-3 text-green-700',
                children: f,
              }),
            b &&
              (0, t.jsx)('p', {
                className: 'mt-4 rounded-xl bg-red-50 px-4 py-3 text-red-700',
                children: b,
              }),
          ],
        }),
      });
    }
    e.s(['default', () => c], 73974);
  },
]);
