'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { guardsClient } from '../../lib/guards-client';
import type { GuardProfile } from '@pashashapay/contracts';
import QRCode from 'qrcode';
import { resolveApiRoot } from '../../lib/api/config';

export const dynamic = 'force-static';
export const dynamicParams = true;

export default function GuardPublicPage() {
  const [token, setToken] = useState('');
  const [guard, setGuard] = useState<GuardProfile | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [scanToPayQr, setScanToPayQr] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get('token') ?? '';
    setToken(current);
    setTokenLoaded(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    setFeedback(null);
    setSuccessMessage(null);
    const apiRoot = resolveApiRoot();
    const load = async () => {
      try {
        const profile = await guardsClient.getGuard(token);
        setGuard(profile);
        setSelectedPreset(profile.quickAmounts[0] ?? null);
        setFeedback(null);
        return;
      } catch (error) {
        console.warn('Guard lookup via client failed, attempting direct fetch', error);
      }
      try {
        const response = await fetch(`${apiRoot}/guards/${encodeURIComponent(token)}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Fallback fetch failed with status ${response.status}`);
        }
        const profile = (await response.json()) as GuardProfile;
        setGuard(profile);
        setSelectedPreset(profile.quickAmounts[0] ?? null);
        setFeedback(null);
      } catch (error) {
        console.error('Guard lookup failed', error);
        setGuard(null);
        setFeedback('Guard not found.');
      }
    };
    void load();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const apiRoot = resolveApiRoot();
    setScanToPayQr(`${apiRoot}/guards/${encodeURIComponent(token)}/qr`);

    const url = `https://main.d2vxflzymkt19g.amplifyapp.com/g?token=${encodeURIComponent(token)}`;
    QRCode.toDataURL(url, { width: 160, margin: 1 })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch(() => setQrDataUrl(null));
  }, [token]);

  const presetAmounts = guard?.quickAmounts ?? [];

  const parsedCustom = useMemo(() => {
    if (!customAmount.trim()) return null;
    const sanitized = customAmount.replace(/[^\d.,]/g, '').replace(',', '.');
    const value = Number.parseFloat(sanitized);
    if (Number.isNaN(value)) return Number.NaN;
    return Math.round(value * 100) / 100;
  }, [customAmount]);

  const activeAmount = parsedCustom ?? selectedPreset;

  let helperText = 'Select or enter an amount to continue.';
  let amountIsValid = false;
  if (activeAmount !== null && !Number.isNaN(activeAmount)) {
    if (activeAmount < 5) helperText = 'Minimum tip is R5.';
    else if (activeAmount > 2000) helperText = 'Maximum tip is R2000.';
    else {
      amountIsValid = true;
      helperText = `Ready to tip R${activeAmount}`;
    }
  } else if (activeAmount !== null && Number.isNaN(activeAmount)) {
    helperText = 'Enter a valid rand amount.';
  }

  const handleInitiateTip = () => {
    if (!guard || !amountIsValid || activeAmount === null) return;
    const apiRoot = resolveApiRoot();

    const parseErrorMessage = (payload: unknown, status: number) => {
      if (typeof payload === 'string' && payload.trim().length > 0) return payload;
      if (payload && typeof payload === 'object') {
        const maybeObj = payload as Record<string, unknown>;
        if (typeof maybeObj.message === 'string') return maybeObj.message;
        if (typeof maybeObj.error === 'string') return maybeObj.error;
      }
      return `Request failed (${status})`;
    };

    const run = async () => {
      setProcessing(true);
      setFeedback(null);
      setSuccessMessage(null);
      setAuthorizationUrl(null);
      setPaymentId(null);
      setPaymentStatus(null);

      try {
        const response = await fetch(
          `${apiRoot}/guards/${encodeURIComponent(token)}/topup-sandbox`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: activeAmount, currency: 'ZAR' }),
          }
        );

        const text = await response.text();
        let payload: unknown = text;
        try {
          payload = text ? JSON.parse(text) : null;
        } catch {
          payload = text;
        }

        if (!response.ok) {
          throw new Error(parseErrorMessage(payload, response.status));
        }

        const result = (payload || {}) as {
          paymentId?: string;
          authorizationUrl?: string | null;
          status?: string;
        };

        if (result.paymentId) {
          setPaymentId(result.paymentId);
        }
        if (result.status) {
          setPaymentStatus(result.status);
        }

        setSuccessMessage(
          `Top-up initiated${result.paymentId ? ` · Ref ${result.paymentId}` : ''}.` +
            (result.status ? ` Status: ${result.status}.` : '')
        );

        if (result.authorizationUrl) {
          setAuthorizationUrl(result.authorizationUrl);
          window.open(result.authorizationUrl, '_blank', 'noopener,noreferrer');
        }
      } catch (error) {
        console.error('topup failed', error);
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Payment could not be started. Please try again.';
        setFeedback(message || 'Payment could not be started. Please try again.');
      } finally {
        setProcessing(false);
      }
    };

    void run();
  };

  const pollPaymentStatus = async (id: string) => {
    const apiRoot = resolveApiRoot();
    try {
      const resp = await fetch(`${apiRoot}/payments/eclipse/${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      if (!resp.ok) return;
      const data = (await resp.json()) as { status?: string; completionUrl?: string };
      if (data.status) {
        setPaymentStatus(data.status);
        setSuccessMessage(
          `Top-up ${id} · Status: ${data.status}${
            data.completionUrl ? ' (you can close the payment tab)' : ''
          }`
        );
      }
    } catch {
      // ignore
    }
  };

  // Poll payment status when we have a paymentId.
  useEffect(() => {
    if (!paymentId) return;
    const timer = setInterval(async () => {
      await pollPaymentStatus(paymentId);
      if (paymentStatus?.toUpperCase() === 'SUCCESSFUL') {
        clearInterval(timer);
      }
    }, 5000);
    void pollPaymentStatus(paymentId);
    return () => clearInterval(timer);
  }, [paymentId, paymentStatus]);

  if (!tokenLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950/5 px-4">
        <p className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-slate-600">
          Loading guard token…
        </p>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950/5 px-4">
        <p className="rounded-3xl border border-rose-200 bg-white px-6 py-4 text-rose-600">
          Missing guard token.
        </p>
      </main>
    );
  }

  if (feedback) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950/5 px-4">
        <p className="rounded-3xl border border-rose-200 bg-white px-6 py-4 text-rose-600">
          {feedback}
        </p>
      </main>
    );
  }

  if (!guard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950/5 px-4">
        <p className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-slate-600">
          Loading guard profile…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-orange-100 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-orange-100 bg-white/95 p-6 shadow-lg shadow-orange-100/70 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-500">Security Guard</p>
            <h1 className="text-3xl font-semibold text-slate-900">{guard.name}</h1>
            <p className="text-sm text-slate-600">{guard.location}</p>
          </div>
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-orange-100 bg-orange-50 p-3">
              <Image
                src={qrDataUrl}
                alt={`${guard.name} QR`}
                width={112}
                height={112}
                className="h-28 w-28 rounded-xl border border-orange-100 object-contain"
              />
              <p className="text-xs text-amber-700">Scan to return</p>
            </div>
          )}
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8 rounded-3xl border border-orange-100 bg-white p-8 shadow-lg shadow-orange-100/60">
            <header className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900">
                Choose an amount to tip {guard.name.split(' ').slice(-1)[0]}
              </h2>
              <p className="text-sm text-slate-700">
                100% of your tip goes directly to the guard. Select a quick amount or enter a custom
                value between R5 and R2000.
              </p>
            </header>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Quick amounts
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {presetAmounts.map((amount) => {
                  const isSelected = customAmount.trim() === '' && selectedPreset === amount;
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(amount);
                        setCustomAmount('');
                      }}
                      className={`rounded-2xl border px-4 py-3 text-lg font-semibold transition ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500 text-white shadow-sm shadow-orange-200'
                          : 'border-orange-100 bg-orange-50 text-slate-900 hover:border-orange-300 hover:bg-orange-100'
                      }`}
                    >
                      R{amount}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Custom amount
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-200">
                  <span className="text-lg font-semibold text-amber-600">R</span>
                  <input
                    inputMode="decimal"
                    type="number"
                    min={5}
                    max={2000}
                    step="1"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(event) => {
                      setCustomAmount(event.target.value);
                      if (event.target.value.trim().length > 0) {
                        setSelectedPreset(null);
                      }
                    }}
                    className="flex-1 bg-transparent text-2xl font-semibold text-slate-900 placeholder:text-orange-200 focus:outline-none"
                  />
                </div>
              </label>
              <p className={`text-sm ${amountIsValid ? 'text-slate-700' : 'text-rose-600'}`}>
                {helperText}
              </p>
              {successMessage && (
                <div className="space-y-1 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <p>{successMessage}</p>
                  {paymentId && (
                    <p className="text-xs text-emerald-700">
                      Latest status: {paymentStatus ?? 'pending…'} ·{' '}
                      <button
                        className="underline"
                        type="button"
                        onClick={() => {
                          if (paymentId) {
                            void pollPaymentStatus(paymentId);
                          }
                        }}
                      >
                        refresh now
                      </button>
                    </p>
                  )}
                  {paymentStatus?.toUpperCase() === 'SUCCESSFUL' && (
                    <p className="text-xs text-emerald-700">
                      Payment confirmed. You can safely close the payment tab and continue here.
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!amountIsValid || processing}
              onClick={handleInitiateTip}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-300/50 transition hover:from-orange-500 hover:to-amber-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {processing
                ? 'Starting payment...'
                : amountIsValid
                  ? 'Continue to secure payment'
                  : 'Select an amount'}
            </button>
            <p className="text-xs text-slate-700">
              {feedback
                ? feedback
                : 'You can log in during checkout to track your tips, or pay as a guest.'}
              {authorizationUrl && (
                <span className="block">
                  If the payment page did not open,{' '}
                  <a
                    className="text-orange-600 underline"
                    href={authorizationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    click here
                  </a>
                  .
                </span>
              )}
            </p>
          </div>

          <aside className="space-y-6 rounded-3xl border border-orange-100 bg-white p-8 shadow-lg shadow-orange-100/60">
            <h3 className="text-lg font-semibold text-slate-900">About this guard</h3>
            <dl className="space-y-4 text-sm text-slate-700">
              <div>
                <dt className="text-amber-700">Location</dt>
                <dd className="font-semibold text-slate-900">{guard.location}</dd>
              </div>
              <div>
                <dt className="text-amber-700">Shift</dt>
                <dd>{guard.shift}</dd>
              </div>
              <div>
                <dt className="text-amber-700">Years of service</dt>
                <dd>{guard.yearsOfService}+ years</dd>
              </div>
              <div>
                <dt className="text-amber-700">Motto</dt>
                <dd className="italic">&ldquo;{guard.motto}&rdquo;</dd>
              </div>
            </dl>
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-700">Scan to pay</p>
              <p className="mt-1 text-sm text-slate-700">
                Open your banking app or Scan to Pay app, and scan this code to complete the tip
                without entering card details.
              </p>
              {scanToPayQr ? (
                <div className="mt-3 flex justify-center">
                  <Image
                    src={scanToPayQr}
                    alt="Scan to Pay QR"
                    width={160}
                    height={160}
                    className="h-40 w-40 rounded-xl border border-orange-200 bg-white p-2 object-contain"
                  />
                </div>
              ) : (
                <p className="mt-2 text-xs text-rose-600">QR not available.</p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
