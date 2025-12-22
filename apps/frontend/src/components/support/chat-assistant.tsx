'use client';

import { useEffect, useState } from 'react';
import { supportApi, SupportUserInfo } from '../../lib/api/support';

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [issueType, setIssueType] = useState<'Account' | 'Technical' | 'Payments' | 'Withdrawal'>(
    'Account'
  );
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'loading'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [supportCode, setSupportCode] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<SupportUserInfo | null>(null);

  const loadContext = async () => {
    setStatus('loading');
    setError(null);
    try {
      const result = await supportApi.prepare();
      setSupportCode(result.supportCode);
      setUserInfo(result.user ?? null);
      setStatus('idle');
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load support details.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (open) {
      void loadContext();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!summary.trim()) {
      setError('Please provide a summary.');
      return;
    }
    setStatus('sending');
    setError(null);
    try {
      await supportApi.createTicket({
        summary: summary.trim(),
        details: details.trim() || undefined,
        issueType,
        supportCode: supportCode ?? undefined,
        metadata: userInfo ?? undefined,
      });
      setStatus('sent');
      setSummary('');
      setDetails('');
      setTimeout(() => {
        resetAndClose();
      }, 1200);
    } catch (err: any) {
      setStatus('error');
      setError(err?.message ?? 'Unable to submit your support ticket.');
    }
  };

  const resetAndClose = () => {
    setOpen(false);
    setStatus('idle');
    setError(null);
    setSummary('');
    setDetails('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-600"
      >
        Need help?
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Support ticket</p>
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            {status === 'loading' ? (
              <p className="text-sm text-slate-600">Preparing your support details…</p>
            ) : (
              <>
                <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">Support Code</span>
                    <span className="font-mono text-orange-600">
                      {supportCode ?? 'Generating…'}
                    </span>
                  </div>
                  {userInfo && (
                    <>
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold">Name</span>
                        <span>
                          {[userInfo.firstName, userInfo.familyName].filter(Boolean).join(' ') ||
                            userInfo.username ||
                            'Unknown'}
                        </span>
                      </div>
                      {userInfo.email && (
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold">Email</span>
                          <span>{userInfo.email}</span>
                        </div>
                      )}
                      {userInfo.accountNumber && (
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold">Account</span>
                          <span className="font-mono">{userInfo.accountNumber}</span>
                        </div>
                      )}
                      {userInfo.walletId && (
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold">Wallet</span>
                          <span className="font-mono">{userInfo.walletId}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  <label className="flex flex-col gap-1 text-xs text-slate-700">
                    <span className="font-semibold">Issue type</span>
                    <select
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                      value={issueType}
                      onChange={(e) =>
                        setIssueType(
                          e.target.value as 'Account' | 'Technical' | 'Payments' | 'Withdrawal'
                        )
                      }
                    >
                      <option value="Account">Account</option>
                      <option value="Technical">Technical</option>
                      <option value="Payments">Payments</option>
                      <option value="Withdrawal">Withdrawal</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-slate-700">
                    <span className="font-semibold">Summary</span>
                    <input
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Short summary..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-slate-700">
                    <span className="font-semibold">Details</span>
                    <textarea
                      className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                      rows={3}
                      placeholder="Provide details..."
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                    />
                  </label>
                </div>
                {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
                {status === 'sent' && (
                  <p className="mt-1 text-xs text-emerald-600">
                    Ticket logged. We will reach out soon.
                  </p>
                )}
                <div className="mt-3 flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={loadContext}
                    className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    New code
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={status === 'sending'}
                    className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60"
                  >
                    {status === 'sending' ? 'Submitting...' : 'Log ticket'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
