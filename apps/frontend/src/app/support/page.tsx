'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supportApi, SupportTicket } from '../../lib/api/support';
import { getSession } from '../../lib/auth/session';

const formatDate = (value?: string) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const statusBadgeClass = (status?: string) => {
  const upper = (status ?? '').toUpperCase();
  if (upper === 'CLOSED') return 'bg-slate-200 text-slate-700';
  return 'bg-emerald-100 text-emerald-700';
};

const SupportPage = () => {
  const [filter, setFilter] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [comment, setComment] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [supportCodeFilter, setSupportCodeFilter] = useState('');
  const [familyNameFilter, setFamilyNameFilter] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    const session = getSession();
    const groups = (session?.groups ?? []).map((g) => g.toLowerCase());
    setIsAdmin(groups.includes('administrators'));
  }, []);

  const loadTickets = useCallback(
    async (status?: 'ACTIVE' | 'CLOSED') => {
      setLoading(true);
      setError(null);
      try {
        if (isAdmin) {
          const items = await supportApi.listTicketsAdmin(
            status,
            supportCodeFilter.trim() || undefined,
            familyNameFilter.trim() || undefined
          );
          setTickets(items ?? []);
        } else {
          const result = await supportApi.listTickets(status);
          setTickets(result.items ?? []);
        }
      } catch (err: any) {
        setError(err?.message ?? 'Unable to load support tickets.');
        setTickets([]);
      } finally {
        setLoading(false);
      }
    },
    [familyNameFilter, isAdmin, supportCodeFilter]
  );

  useEffect(() => {
    void loadTickets(filter);
  }, [filter, isAdmin, loadTickets]);

  const handleSelect = async (code: string) => {
    try {
      const ticket = isAdmin
        ? await supportApi.getTicketAdmin(code)
        : await supportApi.getTicket(code);
      setSelected(ticket);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load ticket details.');
    }
  };

  const handleAddComment = async () => {
    if (!selected || !comment.trim()) return;
    setCommentSending(true);
    setError(null);
    try {
      const updated = isAdmin
        ? await supportApi.addCommentAdmin(selected.supportCode, comment.trim())
        : await supportApi.addComment(selected.supportCode, comment.trim());
      setSelected(updated);
      setComment('');
      // refresh list to show updated timestamps
      void loadTickets(filter);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to add comment.');
    } finally {
      setCommentSending(false);
    }
  };

  const handleStatusChange = async (nextStatus: 'ACTIVE' | 'CLOSED') => {
    if (!selected) return;
    setStatusUpdating(true);
    setError(null);
    try {
      const updated = isAdmin
        ? await supportApi.updateStatusAdmin(selected.supportCode, nextStatus)
        : await supportApi.updateStatusUser(selected.supportCode, nextStatus);
      setSelected(updated);
      void loadTickets(filter);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const sortedTickets = useMemo(
    () =>
      [...tickets].sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
          new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
      ),
    [tickets]
  );

  return (
    <main className="min-h-screen bg-amber-50 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Support</p>
            <h1 className="text-2xl font-semibold text-slate-900">Your support tickets</h1>
          </div>
          <div className="flex gap-2">
            {(['ACTIVE', 'CLOSED'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === key
                    ? 'bg-orange-500 text-white shadow'
                    : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {key === 'ACTIVE' ? 'Active' : 'Closed'}
              </button>
            ))}
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <p className="text-sm font-semibold text-slate-900">Tickets</p>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <>
                  <input
                    type="text"
                    value={supportCodeFilter}
                    onChange={(e) => setSupportCodeFilter(e.target.value)}
                    placeholder="Search by ticket #"
                    className="rounded-full border border-slate-200 px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={familyNameFilter}
                    onChange={(e) => setFamilyNameFilter(e.target.value)}
                    placeholder="Search by last name"
                    className="rounded-full border border-slate-200 px-3 py-2 text-xs"
                  />
                </>
              )}
              <button
                type="button"
                onClick={() => loadTickets(filter)}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
              {loading && <p className="text-xs text-slate-500">Loading…</p>}
            </div>
          </header>
          {error && <p className="px-6 py-3 text-sm text-rose-600">{error}</p>}
          {!loading && sortedTickets.length === 0 && (
            <p className="px-6 py-6 text-sm text-slate-600">No tickets in this view yet.</p>
          )}
          <div className="divide-y divide-slate-100">
            {sortedTickets.map((ticket) => (
              <button
                type="button"
                key={ticket.supportCode}
                onClick={() => handleSelect(ticket.supportCode)}
                className="flex w-full flex-col gap-1 px-6 py-4 text-left hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono font-semibold text-slate-700">
                      {ticket.supportCode}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(ticket.status)}`}
                    >
                      {ticket.status ?? 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Updated {formatDate(ticket.updatedAt ?? ticket.createdAt)}
                  </p>
                </div>
                <p className="text-sm text-slate-800 line-clamp-2">{ticket.summary}</p>
              </button>
            ))}
          </div>
        </section>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setSelected(null)}
          role="button"
          tabIndex={-1}
          onKeyDown={(e) => e.key === 'Escape' && setSelected(null)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Support Ticket</p>
                <h2 className="text-xl font-semibold text-slate-900">{selected.supportCode}</h2>
                <p className="text-sm text-slate-600">Created {formatDate(selected.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(selected.status)}`}
                >
                  {selected.status}
                </span>
                {(isAdmin || selected.status === 'ACTIVE') && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        isAdmin && selected.status === 'CLOSED' ? 'ACTIVE' : 'CLOSED'
                      )
                    }
                    disabled={statusUpdating}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {isAdmin
                      ? `Mark ${selected.status === 'ACTIVE' ? 'Closed' : 'Active'}`
                      : 'Mark Closed'}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Summary
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{selected.summary}</p>
                {selected.details && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {selected.details}
                  </p>
                )}
                {selected.issueType && (
                  <p className="mt-3 text-xs font-semibold text-slate-600">
                    Issue type: <span className="text-slate-800">{selected.issueType}</span>
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Your details
                </p>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  {isAdmin && selected.username && (
                    <p>
                      <span className="font-semibold">Username: </span>
                      {selected.username}
                    </p>
                  )}
                  {isAdmin && selected.cognitoId && (
                    <p>
                      <span className="font-semibold">Cognito ID: </span>
                      <span className="font-mono">{selected.cognitoId}</span>
                    </p>
                  )}
                  {selected.user?.firstName ||
                  selected.user?.familyName ||
                  selected.firstName ||
                  selected.familyName ? (
                    <p>
                      <span className="font-semibold">Name: </span>
                      {[
                        selected.firstName ?? selected.user?.firstName,
                        selected.familyName ?? selected.user?.familyName,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                  ) : null}
                  {selected.user?.email && (
                    <p>
                      <span className="font-semibold">Email: </span>
                      {selected.user.email}
                    </p>
                  )}
                  {selected.user?.accountNumber && (
                    <p>
                      <span className="font-semibold">Account: </span>
                      <span className="font-mono">{selected.user.accountNumber}</span>
                    </p>
                  )}
                  {selected.user?.walletId && (
                    <p>
                      <span className="font-semibold">Wallet: </span>
                      <span className="font-mono">{selected.user.walletId}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Conversation
              </p>
              <div className="max-h-60 space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4">
                {(selected.comments ?? []).map((comment) => (
                  <div key={comment.id} className="rounded-xl bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">
                        {comment.authorName ?? comment.authorType}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{comment.message}</p>
                  </div>
                ))}
                {(!selected.comments || selected.comments.length === 0) && (
                  <p className="text-sm text-slate-600">No comments yet.</p>
                )}
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <textarea
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Add a comment for support…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={commentSending || !comment.trim()}
                  className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60"
                >
                  {commentSending ? 'Sending…' : 'Add comment'}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SupportPage;
