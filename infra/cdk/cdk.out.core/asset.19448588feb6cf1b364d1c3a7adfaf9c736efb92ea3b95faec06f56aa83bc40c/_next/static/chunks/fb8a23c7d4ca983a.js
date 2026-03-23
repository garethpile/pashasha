(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  14718,
  (e) => {
    'use strict';
    var s = e.i(43476),
      t = e.i(71645),
      a = e.i(523),
      l = e.i(66746),
      r = e.i(14983),
      i = e.i(10584);
    let d = (e) => {
        if (!e) return '—';
        try {
          return new Date(e).toLocaleString('en-ZA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          return e;
        }
      },
      n = (e) =>
        'CLOSED' === (e ?? '').toUpperCase()
          ? 'bg-slate-200 text-slate-700'
          : 'bg-emerald-100 text-emerald-700';
    e.s([
      'default',
      0,
      () => {
        let e = (0, i.eclipseEnabled)(),
          [o, c] = (0, t.useState)('ACTIVE'),
          [m, x] = (0, t.useState)([]),
          [p, u] = (0, t.useState)(!1),
          [h, b] = (0, t.useState)(null),
          [f, j] = (0, t.useState)(null),
          [N, g] = (0, t.useState)(''),
          [y, w] = (0, t.useState)(!1),
          [v, C] = (0, t.useState)(!1),
          [A, k] = (0, t.useState)(''),
          [S, T] = (0, t.useState)(''),
          [E, I] = (0, t.useState)(!1);
        (0, t.useEffect)(() => {
          let e = (0, r.getSession)();
          C((0, l.isAdminGroup)(e?.groups));
        }, []);
        let U = (0, t.useCallback)(
          async (e) => {
            (u(!0), b(null));
            try {
              if (v) {
                let s = await a.supportApi.listTicketsAdmin(
                  e,
                  A.trim() || void 0,
                  S.trim() || void 0
                );
                x(s ?? []);
              } else {
                let s = await a.supportApi.listTickets(e);
                x(s.items ?? []);
              }
            } catch (e) {
              (b(e?.message ?? 'Unable to load support tickets.'), x([]));
            } finally {
              u(!1);
            }
          },
          [S, v, A]
        );
        (0, t.useEffect)(() => {
          U(o);
        }, [o, v, U]);
        let D = async (e) => {
            try {
              let s = v ? await a.supportApi.getTicketAdmin(e) : await a.supportApi.getTicket(e);
              j(s);
            } catch (e) {
              b(e?.message ?? 'Unable to load ticket details.');
            }
          },
          V = async () => {
            if (f && N.trim()) {
              (w(!0), b(null));
              try {
                let e = v
                  ? await a.supportApi.addCommentAdmin(f.supportCode, N.trim())
                  : await a.supportApi.addComment(f.supportCode, N.trim());
                (j(e), g(''), U(o));
              } catch (e) {
                b(e?.message ?? 'Unable to add comment.');
              } finally {
                w(!1);
              }
            }
          },
          L = async (e) => {
            if (f) {
              (I(!0), b(null));
              try {
                let s = v
                  ? await a.supportApi.updateStatusAdmin(f.supportCode, e)
                  : await a.supportApi.updateStatusUser(f.supportCode, e);
                (j(s), U(o));
              } catch (e) {
                b(e?.message ?? 'Unable to update status.');
              } finally {
                I(!1);
              }
            }
          },
          O = (0, t.useMemo)(
            () =>
              [...m].sort(
                (e, s) =>
                  new Date(s.updatedAt ?? s.createdAt ?? 0).getTime() -
                  new Date(e.updatedAt ?? e.createdAt ?? 0).getTime()
              ),
            [m]
          );
        return (0, s.jsxs)('main', {
          className: 'min-h-screen bg-amber-50 px-4 pb-16 pt-24 sm:px-6 lg:px-8',
          children: [
            (0, s.jsxs)('div', {
              className: 'mx-auto flex max-w-5xl flex-col gap-6',
              children: [
                (0, s.jsxs)('div', {
                  className: 'flex flex-wrap items-center justify-between gap-3',
                  children: [
                    (0, s.jsxs)('div', {
                      children: [
                        (0, s.jsx)('p', {
                          className: 'text-xs uppercase tracking-[0.35em] text-slate-400',
                          children: 'Support',
                        }),
                        (0, s.jsx)('h1', {
                          className: 'text-2xl font-semibold text-slate-900',
                          children: 'Your support tickets',
                        }),
                      ],
                    }),
                    (0, s.jsx)('div', {
                      className: 'flex gap-2',
                      children: ['ACTIVE', 'CLOSED'].map((e) =>
                        (0, s.jsx)(
                          'button',
                          {
                            type: 'button',
                            onClick: () => c(e),
                            className: `rounded-full px-4 py-2 text-sm font-semibold transition ${o === e ? 'bg-orange-500 text-white shadow' : 'border border-slate-200 bg-white text-slate-700'}`,
                            children: 'ACTIVE' === e ? 'Active' : 'Closed',
                          },
                          e
                        )
                      ),
                    }),
                  ],
                }),
                (0, s.jsxs)('section', {
                  className: 'rounded-3xl border border-slate-200 bg-white shadow-sm',
                  children: [
                    (0, s.jsxs)('header', {
                      className:
                        'flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4',
                      children: [
                        (0, s.jsx)('p', {
                          className: 'text-sm font-semibold text-slate-900',
                          children: 'Tickets',
                        }),
                        (0, s.jsxs)('div', {
                          className: 'flex flex-wrap items-center gap-2',
                          children: [
                            v &&
                              (0, s.jsxs)(s.Fragment, {
                                children: [
                                  (0, s.jsx)('input', {
                                    type: 'text',
                                    value: A,
                                    onChange: (e) => k(e.target.value),
                                    placeholder: 'Search by ticket #',
                                    className:
                                      'rounded-full border border-slate-200 px-3 py-2 text-xs',
                                  }),
                                  (0, s.jsx)('input', {
                                    type: 'text',
                                    value: S,
                                    onChange: (e) => T(e.target.value),
                                    placeholder: 'Search by last name',
                                    className:
                                      'rounded-full border border-slate-200 px-3 py-2 text-xs',
                                  }),
                                ],
                              }),
                            (0, s.jsx)('button', {
                              type: 'button',
                              onClick: () => U(o),
                              className:
                                'rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50',
                              children: 'Refresh',
                            }),
                            p &&
                              (0, s.jsx)('p', {
                                className: 'text-xs text-slate-500',
                                children: 'Loading…',
                              }),
                          ],
                        }),
                      ],
                    }),
                    h &&
                      (0, s.jsx)('p', {
                        className: 'px-6 py-3 text-sm text-rose-600',
                        children: h,
                      }),
                    !p &&
                      0 === O.length &&
                      (0, s.jsx)('p', {
                        className: 'px-6 py-6 text-sm text-slate-600',
                        children: 'No tickets in this view yet.',
                      }),
                    (0, s.jsx)('div', {
                      className: 'divide-y divide-slate-100',
                      children: O.map((e) =>
                        (0, s.jsxs)(
                          'button',
                          {
                            type: 'button',
                            onClick: () => D(e.supportCode),
                            className:
                              'flex w-full flex-col gap-1 px-6 py-4 text-left hover:bg-slate-50',
                            children: [
                              (0, s.jsxs)('div', {
                                className: 'flex items-center justify-between gap-3',
                                children: [
                                  (0, s.jsxs)('div', {
                                    className: 'flex items-center gap-3',
                                    children: [
                                      (0, s.jsx)('span', {
                                        className:
                                          'rounded-full bg-slate-100 px-3 py-1 text-xs font-mono font-semibold text-slate-700',
                                        children: e.supportCode,
                                      }),
                                      (0, s.jsx)('span', {
                                        className: `rounded-full px-3 py-1 text-xs font-semibold ${n(e.status)}`,
                                        children: e.status ?? 'ACTIVE',
                                      }),
                                    ],
                                  }),
                                  (0, s.jsxs)('p', {
                                    className: 'text-xs text-slate-500',
                                    children: ['Updated ', d(e.updatedAt ?? e.createdAt)],
                                  }),
                                ],
                              }),
                              (0, s.jsx)('p', {
                                className: 'text-sm text-slate-800 line-clamp-2',
                                children: e.summary,
                              }),
                            ],
                          },
                          e.supportCode
                        )
                      ),
                    }),
                  ],
                }),
              ],
            }),
            f &&
              (0, s.jsx)('div', {
                className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4',
                onClick: () => j(null),
                role: 'button',
                tabIndex: -1,
                onKeyDown: (e) => 'Escape' === e.key && j(null),
                children: (0, s.jsxs)('div', {
                  className: 'w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl',
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    (0, s.jsxs)('div', {
                      className: 'flex items-start justify-between gap-4',
                      children: [
                        (0, s.jsxs)('div', {
                          children: [
                            (0, s.jsx)('p', {
                              className: 'text-xs uppercase tracking-[0.3em] text-slate-400',
                              children: 'Support Ticket',
                            }),
                            (0, s.jsx)('h2', {
                              className: 'text-xl font-semibold text-slate-900',
                              children: f.supportCode,
                            }),
                            (0, s.jsxs)('p', {
                              className: 'text-sm text-slate-600',
                              children: ['Created ', d(f.createdAt)],
                            }),
                          ],
                        }),
                        (0, s.jsxs)('div', {
                          className: 'flex items-center gap-2',
                          children: [
                            (0, s.jsx)('span', {
                              className: `rounded-full px-3 py-1 text-xs font-semibold ${n(f.status)}`,
                              children: f.status,
                            }),
                            (v || 'ACTIVE' === f.status) &&
                              (0, s.jsx)('button', {
                                type: 'button',
                                onClick: () => L(v && 'CLOSED' === f.status ? 'ACTIVE' : 'CLOSED'),
                                disabled: E,
                                className:
                                  'rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60',
                                children: v
                                  ? `Mark ${'ACTIVE' === f.status ? 'Closed' : 'Active'}`
                                  : 'Mark Closed',
                              }),
                          ],
                        }),
                      ],
                    }),
                    (0, s.jsxs)('div', {
                      className: 'mt-4 grid gap-4 md:grid-cols-2',
                      children: [
                        (0, s.jsxs)('div', {
                          className: 'rounded-2xl border border-slate-100 bg-slate-50 p-4',
                          children: [
                            (0, s.jsx)('p', {
                              className:
                                'text-xs font-semibold uppercase tracking-wide text-slate-500',
                              children: 'Summary',
                            }),
                            (0, s.jsx)('p', {
                              className: 'mt-2 text-sm font-semibold text-slate-800',
                              children: f.summary,
                            }),
                            f.details &&
                              (0, s.jsx)('p', {
                                className: 'mt-2 whitespace-pre-wrap text-sm text-slate-700',
                                children: f.details,
                              }),
                            f.issueType &&
                              (0, s.jsxs)('p', {
                                className: 'mt-3 text-xs font-semibold text-slate-600',
                                children: [
                                  'Issue type: ',
                                  (0, s.jsx)('span', {
                                    className: 'text-slate-800',
                                    children: f.issueType,
                                  }),
                                ],
                              }),
                          ],
                        }),
                        (0, s.jsxs)('div', {
                          className: 'rounded-2xl border border-slate-100 bg-slate-50 p-4',
                          children: [
                            (0, s.jsx)('p', {
                              className:
                                'text-xs font-semibold uppercase tracking-wide text-slate-500',
                              children: 'Your details',
                            }),
                            (0, s.jsxs)('div', {
                              className: 'mt-2 space-y-1 text-sm text-slate-700',
                              children: [
                                v &&
                                  f.username &&
                                  (0, s.jsxs)('p', {
                                    children: [
                                      (0, s.jsx)('span', {
                                        className: 'font-semibold',
                                        children: 'Username: ',
                                      }),
                                      f.username,
                                    ],
                                  }),
                                v &&
                                  f.cognitoId &&
                                  (0, s.jsxs)('p', {
                                    children: [
                                      (0, s.jsx)('span', {
                                        className: 'font-semibold',
                                        children: 'Cognito ID: ',
                                      }),
                                      (0, s.jsx)('span', {
                                        className: 'font-mono',
                                        children: f.cognitoId,
                                      }),
                                    ],
                                  }),
                                f.user?.firstName ||
                                f.user?.familyName ||
                                f.firstName ||
                                f.familyName
                                  ? (0, s.jsxs)('p', {
                                      children: [
                                        (0, s.jsx)('span', {
                                          className: 'font-semibold',
                                          children: 'Name: ',
                                        }),
                                        [
                                          f.firstName ?? f.user?.firstName,
                                          f.familyName ?? f.user?.familyName,
                                        ]
                                          .filter(Boolean)
                                          .join(' '),
                                      ],
                                    })
                                  : null,
                                f.user?.email &&
                                  (0, s.jsxs)('p', {
                                    children: [
                                      (0, s.jsx)('span', {
                                        className: 'font-semibold',
                                        children: 'Email: ',
                                      }),
                                      f.user.email,
                                    ],
                                  }),
                                f.user?.accountNumber &&
                                  (0, s.jsxs)('p', {
                                    children: [
                                      (0, s.jsx)('span', {
                                        className: 'font-semibold',
                                        children: 'Account: ',
                                      }),
                                      (0, s.jsx)('span', {
                                        className: 'font-mono',
                                        children: f.user.accountNumber,
                                      }),
                                    ],
                                  }),
                                e &&
                                  f.user?.walletId &&
                                  (0, s.jsxs)('p', {
                                    children: [
                                      (0, s.jsx)('span', {
                                        className: 'font-semibold',
                                        children: 'Wallet: ',
                                      }),
                                      (0, s.jsx)('span', {
                                        className: 'font-mono',
                                        children: f.user.walletId,
                                      }),
                                    ],
                                  }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, s.jsxs)('div', {
                      className: 'mt-6 space-y-3',
                      children: [
                        (0, s.jsx)('p', {
                          className: 'text-xs font-semibold uppercase tracking-wide text-slate-500',
                          children: 'Conversation',
                        }),
                        (0, s.jsxs)('div', {
                          className:
                            'max-h-60 space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4',
                          children: [
                            (f.comments ?? []).map((e) =>
                              (0, s.jsxs)(
                                'div',
                                {
                                  className: 'rounded-xl bg-white p-3 shadow-sm',
                                  children: [
                                    (0, s.jsxs)('div', {
                                      className: 'flex items-center justify-between',
                                      children: [
                                        (0, s.jsx)('span', {
                                          className: 'text-sm font-semibold text-slate-800',
                                          children: e.authorName ?? e.authorType,
                                        }),
                                        (0, s.jsx)('span', {
                                          className: 'text-xs text-slate-500',
                                          children: d(e.createdAt),
                                        }),
                                      ],
                                    }),
                                    (0, s.jsx)('p', {
                                      className: 'mt-1 text-sm text-slate-700',
                                      children: e.message,
                                    }),
                                  ],
                                },
                                e.id
                              )
                            ),
                            (!f.comments || 0 === f.comments.length) &&
                              (0, s.jsx)('p', {
                                className: 'text-sm text-slate-600',
                                children: 'No comments yet.',
                              }),
                          ],
                        }),
                        (0, s.jsxs)('div', {
                          className: 'flex flex-col gap-2 md:flex-row md:items-center',
                          children: [
                            (0, s.jsx)('textarea', {
                              className:
                                'w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm',
                              rows: 2,
                              placeholder: 'Add a comment for support…',
                              value: N,
                              onChange: (e) => g(e.target.value),
                            }),
                            (0, s.jsx)('button', {
                              type: 'button',
                              onClick: V,
                              disabled: y || !N.trim(),
                              className:
                                'rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60',
                              children: y ? 'Sending…' : 'Add comment',
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, s.jsx)('div', {
                      className: 'mt-6 flex justify-end',
                      children: (0, s.jsx)('button', {
                        type: 'button',
                        onClick: () => j(null),
                        className:
                          'rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50',
                        children: 'Close',
                      }),
                    }),
                  ],
                }),
              }),
          ],
        });
      },
    ]);
  },
]);
