'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminVoucher } from '../../../lib/api/admin';

const EXAMPLE_SMS = `You've been gifted a R50 Shoprite, Checkers, Usave voucher. BARCODE: 9300525147320593`;

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export default function AdminVoucherPage() {
  const [smsText, setSmsText] = useState('');
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadVouchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listVouchers({ limit: 25 });
      setVouchers(data ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVouchers();
  }, []);

  const stats = useMemo(() => {
    const total = vouchers.reduce((sum, voucher) => sum + voucher.amountMinor, 0) / 100;
    return {
      count: vouchers.length,
      total,
    };
  }, [vouchers]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const voucher = await adminApi.ingestShopriteCheckersVoucher({ smsText });
      setMessage(
        `Voucher ingested: ${formatCurrency(voucher.amount, voucher.currency)} · ${voucher.barcodeMasked}`
      );
      setSmsText('');
      await loadVouchers();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to ingest voucher.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Admin flow
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">PashashaPayBot → Vouchers</p>
          <p className="mt-2 text-sm text-slate-600">
            Admin flow: /admin → vouchers → Shoprite Checkers → paste SMS → secure ingest.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Recent ingests
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.count}</p>
          <p className="mt-2 text-sm text-slate-600">Last 25 vouchers currently visible here.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Inventory value
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {formatCurrency(stats.total, 'ZAR')}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Masked-only view. Full barcodes stay encrypted.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ingest Shoprite Checkers SMS</h2>
              <p className="mt-2 text-sm text-slate-600">
                Paste the voucher SMS exactly as received. The full barcode is encrypted
                immediately; only the last 4 digits are shown back to admins.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSmsText(EXAMPLE_SMS)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Use example
            </button>
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Voucher SMS
            <textarea
              required
              minLength={20}
              maxLength={4000}
              rows={8}
              value={smsText}
              onChange={(event) => setSmsText(event.target.value)}
              placeholder={EXAMPLE_SMS}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-inner outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Ingesting...' : 'Ingest voucher'}
            </button>
            <button
              type="button"
              onClick={() => setSmsText('')}
              className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Telegram admin notes</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li>1. PashashaPayBot should expose only the admin voucher ingest flow first.</li>
            <li>2. Ask the admin to paste the full SMS exactly as received.</li>
            <li>3. Send the SMS to the backend ingest endpoint using administrator auth.</li>
            <li>4. Reply with amount, supplier, and masked barcode only.</li>
            <li>5. Do not echo tokens, raw barcodes, or full SMS text into logs.</li>
          </ol>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Current repo scope: web admin is implemented here; Telegram runtime still needs a token,
            webhook/polling process, and deployment wiring outside this repo.
          </div>
        </section>
      </section>

      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {message && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recent voucher ingests</h3>
            <p className="text-sm text-slate-500">Latest encrypted inventory records.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadVouchers()}
            disabled={loading}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">When</th>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Barcode</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Actor</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {vouchers.map((voucher) => (
                <tr key={voucher.voucherId}>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(voucher.ingestedAt).toLocaleString('en-ZA')}
                  </td>
                  <td className="px-6 py-4 text-slate-900">{voucher.supplier}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {formatCurrency(voucher.amount, voucher.currency)}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-700">{voucher.barcodeMasked}</td>
                  <td className="px-6 py-4 text-slate-600">{voucher.source}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {voucher.ingestedByActorId ?? voucher.ingestedByUserId}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {voucher.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && vouchers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    No vouchers ingested yet.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    Loading vouchers...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
