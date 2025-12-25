'use client';

import { useEffect, useState } from 'react';
import { auditApi, type AuditLog } from '../../lib/api/audit';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [eventType, setEventType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditApi.list({
        eventType: eventType.trim() || undefined,
        limit: 100,
      });
      setLogs(result);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Audit Logs</h1>
          <p className="text-sm text-slate-600">Only events related to your account are shown.</p>
        </div>
        <button
          type="button"
          onClick={fetchLogs}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col text-sm font-semibold text-slate-700">
            Event type
            <input
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="guard.token.rotate"
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={fetchLogs}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600"
              disabled={loading}
            >
              Apply Filters
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </section>

      <section className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-5 gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span className="col-span-2">Event</span>
          <span>Actor</span>
          <span>When</span>
          <span>Details</span>
        </div>
        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.auditId} className="grid grid-cols-5 gap-3 py-3 text-sm text-slate-800">
              <div className="col-span-2">
                <p className="font-semibold">{log.eventType}</p>
                {log.description && <p className="text-xs text-slate-600">{log.description}</p>}
              </div>
              <div>
                <p className="font-mono text-xs text-slate-700">{log.actorId ?? 'self'}</p>
                {log.actorType && <p className="text-xs text-slate-500">{log.actorType}</p>}
              </div>
              <div>
                <p className="text-xs text-slate-700">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
              <div>
                {log.metadata ? (
                  <pre className="overflow-x-auto rounded bg-slate-50 p-2 text-[11px] leading-tight text-slate-700">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                ) : (
                  <span className="text-xs text-slate-500">—</span>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && !loading && (
            <p className="py-6 text-center text-sm text-slate-600">No audit entries found.</p>
          )}
          {loading && <p className="py-6 text-center text-sm text-slate-600">Loading…</p>}
        </div>
      </section>
    </main>
  );
}
