'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import {
  corePublicApi,
  type PublicCivilServantRecipient,
  type PublicPaymentIntentResponse,
} from '../../lib/api/core-public';

export const dynamic = 'force-static';
export const dynamicParams = true;
const voucherTypeLabel = 'Shoprite Checkers';
const OZOW_FEE_AMOUNT = 1.5;
const PLATFORM_FEE_AMOUNT = 1;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount);

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const getStatusTone = (status: string | null) => {
  switch ((status ?? '').toLowerCase()) {
    case 'completed':
    case 'successful':
    case 'paid':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    case 'pending-investigation':
      return 'border-amber-200 bg-amber-50 text-amber-900';
    case 'pending':
    case 'pending-payment':
      return 'border-amber-200 bg-amber-50 text-amber-900';
    case 'abandoned':
    case 'failed':
    case 'cancelled':
      return 'border-rose-200 bg-rose-50 text-rose-900';
    default:
      return 'border-rose-200 bg-rose-50 text-rose-700';
  }
};

export default function CivilServantPublicPage() {
  const [token, setToken] = useState('');
  const [recipient, setRecipient] = useState<PublicCivilServantRecipient | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PublicPaymentIntentResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get('token') ?? '';
    setToken(current);
    setTokenLoaded(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    setLookupFeedback(null);
    setFeedback(null);
    const load = async () => {
      try {
        const response = await corePublicApi.lookupCivilServant(token);
        setRecipient(response.recipient);
        setSelectedPreset(response.recipient.availableVoucherDenominations[0] ?? null);
        setLookupFeedback(null);
      } catch (error) {
        console.error('Civil servant lookup failed', error);
        setRecipient(null);
        setLookupFeedback(
          error instanceof Error && error.message ? error.message : 'Civil servant not found.'
        );
      }
    };
    void load();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const origin =
      typeof window === 'undefined' ? 'https://dev.pashasha.com' : window.location.origin;
    const url = `${origin}/g?token=${encodeURIComponent(token)}`;
    QRCode.toDataURL(url, { width: 160, margin: 1 })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch(() => setQrDataUrl(null));
  }, [token]);

  const presetAmounts = recipient?.availableVoucherDenominations ?? [];
  const activeAmount = selectedPreset;
  const amountIsValid =
    activeAmount !== null && recipient?.availableVoucherDenominations.includes(activeAmount);
  const recipientMeta = [recipient?.occupation, recipient?.primarySite]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .join(' · ');
  const feeSummary = {
    voucherAmount: activeAmount ?? 0,
    ozowFeeAmount: OZOW_FEE_AMOUNT,
    platformFeeAmount: PLATFORM_FEE_AMOUNT,
    totalCharge: Number(((activeAmount ?? 0) + OZOW_FEE_AMOUNT + PLATFORM_FEE_AMOUNT).toFixed(2)),
  };

  const handleInitiateTip = () => {
    if (!recipient || !amountIsValid || activeAmount === null) return;
    const checkoutWindow = typeof window !== 'undefined' ? window.open('', '_blank') : null;

    const run = async () => {
      setProcessing(true);
      setFeedback(null);
      setPaymentStatus(null);
      setPaymentIntent(null);

      try {
        const result = await corePublicApi.createPaymentIntent({
          civilServantId: recipient.civilServantId,
          voucherDenomination: activeAmount,
          paymentEngine: 'ozow',
        });

        setPaymentIntent(result);
        setPaymentStatus(result.status);

        if (result.redirectUrl) {
          if (checkoutWindow) {
            checkoutWindow.location.href = result.redirectUrl;
          } else if (typeof window !== 'undefined') {
            window.location.href = result.redirectUrl;
          }
        } else if (checkoutWindow) {
          checkoutWindow.close();
        }
      } catch (error) {
        if (checkoutWindow) checkoutWindow.close();
        console.error('payment initiation failed', error);
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

  const pollPaymentStatus = async (paymentIntentId: string) => {
    try {
      const data = await corePublicApi.getPaymentIntent(paymentIntentId);
      setPaymentIntent(data);
      setPaymentStatus(data.status);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const paymentIntentId = paymentIntent?.paymentIntentId;
    if (!paymentIntentId) return;
    const timer = setInterval(async () => {
      await pollPaymentStatus(paymentIntentId);
      if (['paid', 'completed', 'successful'].includes((paymentStatus ?? '').toLowerCase())) {
        clearInterval(timer);
      }
    }, 5000);
    void pollPaymentStatus(paymentIntentId);
    return () => clearInterval(timer);
  }, [paymentIntent?.paymentIntentId, paymentStatus]);

  if (!tokenLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950/5 px-4">
        <p className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-slate-600">
          Loading recipient…
        </p>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950/5 px-4">
        <p className="rounded-3xl border border-rose-200 bg-white px-6 py-4 text-rose-600">
          Missing civil servant QR token.
        </p>
      </main>
    );
  }

  if (lookupFeedback) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950/5 px-4">
        <p className="rounded-3xl border border-rose-200 bg-white px-6 py-4 text-rose-600">
          {lookupFeedback}
        </p>
      </main>
    );
  }

  if (!recipient) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950/5 px-4">
        <p className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-slate-600">
          Loading civil servant profile…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff3e8,_#fde6bd_45%,_#fff8ef_100%)] px-4 pb-12 pt-10 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-orange-200/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(234,88,12,0.10)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-600">Civil Servant</p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              {recipient.displayName}
            </h1>
            {recipientMeta && <p className="mt-1 text-xs text-slate-500">{recipientMeta}</p>}
            <p className="mt-2 text-sm text-slate-600">
              {[recipient.department, recipient.station].filter(Boolean).join(' · ') ||
                'Recipient ready to receive a voucher tip'}
            </p>
          </div>
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-1 rounded-3xl border border-orange-100 bg-orange-50/90 p-3">
              <Image
                src={qrDataUrl}
                alt={`${recipient.displayName} QR`}
                width={112}
                height={112}
                className="h-28 w-28 rounded-xl border border-orange-100 object-contain"
              />
              <p className="text-xs text-amber-700">Share this recipient link</p>
            </div>
          )}
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8 rounded-[2rem] border border-orange-100 bg-white/95 p-5 shadow-[0_20px_60px_rgba(245,158,11,0.12)] sm:p-8">
            <header className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900">Choose a voucher</h2>
            </header>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                  Voucher type
                </p>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700"
                >
                  <Image
                    src="/pashasha-checkers-logo.png"
                    alt="Shoprite Checkers"
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px] rounded-full object-contain"
                  />
                  <span>{voucherTypeLabel}</span>
                </button>
              </div>

              <div className="rounded-3xl border border-orange-100 bg-orange-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-700">How It Works</p>
                <ol className="mt-3 space-y-3 text-sm text-slate-700">
                  <li>1. Choose a voucher denomination.</li>
                  <li>2. Pay securely through OZOW.</li>
                  <li>3. After payment confirmation, a voucher is allocated and sent by SMS.</li>
                </ol>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                  Voucher denominations
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {presetAmounts.map((amount) => {
                    const isSelected = selectedPreset === amount;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setSelectedPreset(amount)}
                        className={`rounded-3xl border px-4 py-4 text-lg font-semibold transition ${
                          isSelected
                            ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200'
                            : 'border-orange-100 bg-orange-50 text-slate-900 hover:border-orange-300 hover:bg-orange-100'
                        }`}
                      >
                        {formatCurrency(amount)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!amountIsValid || processing}
              onClick={handleInitiateTip}
              className="w-full rounded-3xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-300/50 transition hover:from-orange-500 hover:to-amber-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {processing
                ? 'Starting payment...'
                : amountIsValid
                  ? 'Pay now'
                  : 'Select a voucher amount'}
            </button>
            {amountIsValid && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment summary
                </p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <span>Voucher amount</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(feeSummary.voucherAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>OZOW fee</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(feeSummary.ozowFeeAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Pashasha fee</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(feeSummary.platformFeeAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
                    <span className="font-semibold text-slate-900">Total charge</span>
                    <span className="font-semibold text-slate-900">
                      {formatMoney(feeSummary.totalCharge)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-700">
              {feedback ??
                'Payment opens in a new tab. This page will keep polling the transaction status.'}
            </p>
          </div>

          <aside className="space-y-5 rounded-[2rem] border border-orange-100 bg-white/95 p-5 shadow-[0_20px_60px_rgba(245,158,11,0.12)] sm:p-8">
            <div className={`rounded-3xl border p-4 ${getStatusTone(paymentStatus)}`}>
              <p className="text-xs uppercase tracking-[0.3em]">Payment Status</p>
              <p className="mt-2 text-2xl font-semibold capitalize">
                {paymentStatus?.replace(/-/g, ' ') ?? 'Awaiting payment'}
              </p>
              {paymentIntent?.paymentIntentId && (
                <p className="mt-2 text-xs">
                  Ref {paymentIntent.paymentIntentId}{' '}
                  <button
                    className="underline"
                    type="button"
                    onClick={() => void pollPaymentStatus(paymentIntent.paymentIntentId)}
                  >
                    refresh now
                  </button>
                </p>
              )}
            </div>

            {paymentIntent?.paymentIntentId && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Fulfilment</p>
                <p className="mt-2">
                  Voucher allocation:{' '}
                  <span className="font-semibold capitalize">
                    {paymentIntent.voucherAllocation?.status ?? 'pending'}
                  </span>
                </p>
                <p className="mt-1">
                  SMS delivery:{' '}
                  <span className="font-semibold capitalize">
                    {paymentIntent.voucherAllocation?.deliveryStatus ?? 'pending'}
                  </span>
                </p>
                {paymentIntent.redirectUrl && (
                  <a
                    className="mt-3 inline-block text-orange-700 underline"
                    href={paymentIntent.redirectUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open payment page again
                  </a>
                )}
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
