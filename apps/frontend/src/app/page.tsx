'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DashboardNameCard,
  DashboardPaymentsCard,
  DashboardTransaction,
  formatCurrency,
} from '../components/dashboard/cards';
import { mapDashboardTransactions } from '../components/dashboard/transactions';
import { guardApi } from '../lib/api/guard';
import { customerApi } from '../lib/api/customer';
import { resolveApiRoot } from '../lib/api/config';
import { getSession, sessionEventName } from '../lib/auth/session';
import { guardsClient } from '../lib/guards-client';
import {
  DashboardCivilServantKycCard,
  DashboardCustomerKycCard,
} from '../components/dashboard/kyc-card';
import { CivilServantProfileCard } from '../components/dashboard/civil-servant-profile-card';

type GuardProfile = {
  civilServantId: string;
  accountNumber: string;
  firstName: string;
  familyName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  status?: string;
  guardToken?: string;
  occupation?: string;
  primarySite?: string;
  homeAddress?: string;
  eclipseCustomerId?: string;
  eclipseWalletId?: string;
};

type CustomerProfile = {
  customerId: string;
  accountNumber: string;
  firstName: string;
  familyName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  status?: string;
  eclipseCustomerId?: string;
  eclipseWalletId?: string;
};

type WalletInfo = {
  walletId?: string;
  balance: number;
  availableBalance?: number;
  currentBalance?: number;
  currency: string;
};

const MarketingScreen = () => (
  <main className="min-h-screen bg-[#f77720] px-4 py-10">
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-10">
      <div className="relative w-full overflow-hidden rounded-3xl shadow-lg ring-1 ring-orange-300/60">
        <Image
          src="/Pashasha-Slogan-Background.png"
          alt="Pashasha Pay slogan"
          width={1920}
          height={1080}
          className="h-auto w-full object-contain"
          priority
        />
      </div>
      <div className="w-full max-w-3xl rounded-3xl border border-orange-100 bg-white/90 p-8 text-center shadow-lg backdrop-blur">
        <p className="text-lg font-semibold text-slate-900">
          Sign in to view your Dashboard or register a new account
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-600"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-orange-300 bg-white px-6 py-3 text-sm font-semibold text-orange-600 shadow-lg transition hover:bg-orange-50"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  </main>
);

const LoadingPanel = ({ text }: { text: string }) => (
  <main className="flex min-h-screen items-center justify-center bg-amber-50 px-4">
    <p className="rounded-3xl border border-orange-100 bg-white px-6 py-4 text-slate-600">{text}</p>
  </main>
);

const ErrorPanel = ({ text }: { text: string }) => (
  <main className="flex min-h-screen items-center justify-center bg-amber-50 px-4">
    <p className="rounded-3xl border border-rose-200 bg-white px-6 py-4 text-rose-600">{text}</p>
  </main>
);

const QrModal = ({ qrUrl, onClose }: { qrUrl: string; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4"
    role="button"
    tabIndex={-1}
    onClick={onClose}
    onKeyDown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      className="relative rounded-3xl bg-white p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Close
      </button>
      <Image
        src={qrUrl}
        alt="QR code preview"
        className="h-64 w-64 object-contain"
        width={256}
        height={256}
      />
    </div>
  </div>
);

const PayoutSuccessModal = ({ onClose }: { onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
    role="dialog"
    aria-modal="true"
    onClick={onClose}
    onKeyDown={(e) => e.key === 'Escape' && onClose()}
    tabIndex={-1}
  >
    <div
      className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-xl font-semibold text-slate-900">Payout requested</h3>
      <p className="mt-2 text-sm text-slate-600">Your payout request was submitted successfully.</p>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

function CivilServantDashboard() {
  const [profile, setProfile] = useState<GuardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [sentTransactions, setSentTransactions] = useState<DashboardTransaction[]>([]);
  const [txOffset, setTxOffset] = useState(0);
  const [txHasMore, setTxHasMore] = useState(false);
  const [sentOffset, setSentOffset] = useState(0);
  const [sentHasMore, setSentHasMore] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [sentLoading, setSentLoading] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<DashboardTransaction[]>([]);
  const [pendingOffset, setPendingOffset] = useState(0);
  const [pendingHasMore, setPendingHasMore] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingCollapsed, setPendingCollapsed] = useState(true);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutInfo, setPayoutInfo] = useState<WalletInfo | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'ATM_CASH' | 'PNP_CASH' | 'PNP_SPEND'>(
    'ATM_CASH'
  );
  const [payoutFeedback, setPayoutFeedback] = useState<string | null>(null);
  const [payoutPending, setPayoutPending] = useState(false);
  const [payoutSuccessOpen, setPayoutSuccessOpen] = useState(false);
  const [profileCollapsed, setProfileCollapsed] = useState(false);
  const [paymentsCollapsed, setPaymentsCollapsed] = useState(false);
  const [guardProfileForm, setGuardProfileForm] = useState({
    firstName: '',
    familyName: '',
    occupation: '',
    primarySite: '',
    phoneNumber: '',
    email: '',
    homeAddress: '',
  });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  const loadTransactions = useCallback(async (offset = 0, currentBalance?: number) => {
    setTxLoading(true);
    try {
      const tx = await guardApi.getTransactions({ offset, limit: 20 });
      const mapped = mapDashboardTransactions(tx ?? []);
      const withBalances = (() => {
        if (currentBalance === undefined) return mapped;
        let runningDelta = 0;
        return mapped.map((row) => {
          const existing = row.balance;
          if (existing !== undefined && existing !== null) {
            runningDelta += Number(row.amount ?? 0);
            return row;
          }
          const derived = currentBalance - runningDelta;
          runningDelta += Number(row.amount ?? 0);
          return { ...row, balance: derived };
        });
      })();
      setTransactions(withBalances);
      setTxOffset(offset);
      setTxHasMore((tx ?? []).length === 14);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load transactions.');
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }, []);

  const loadPendingTransactions = useCallback(async (offset = 0) => {
    setPendingLoading(true);
    try {
      const tx = await guardApi.getPendingTransactions({ offset, limit: 20 });
      const mapped = mapDashboardTransactions(tx ?? []);
      setPendingTransactions(mapped);
      setPendingOffset(offset);
      setPendingHasMore((tx ?? []).length === 14);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load pending payouts.');
      setPendingTransactions([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const loadPayoutInfo = useCallback(async (): Promise<WalletInfo | undefined> => {
    try {
      const info = await guardApi.getPayoutInfo();
      const wallet: WalletInfo = {
        balance: info.balance,
        availableBalance: info.availableBalance ?? info.balance,
        currentBalance: info.currentBalance ?? info.balance,
        currency: info.currency,
      };
      setPayoutInfo(wallet);
      return wallet;
    } catch {
      // ignore payout info errors; keep existing state
      return undefined;
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await guardApi.getProfile();
        setProfile(data);
        setGuardProfileForm({
          firstName: data.firstName ?? '',
          familyName: data.familyName ?? '',
          occupation: data.occupation ?? 'Civil Servant',
          primarySite: data.primarySite ?? data.address ?? '',
          phoneNumber: data.phoneNumber ?? '',
          email: data.email ?? '',
          homeAddress: data.homeAddress ?? data.address ?? '',
        });
        setProfileEditing(false);
        setProfileFeedback(null);
        const apiRoot = resolveApiRoot();
        if (data.guardToken) {
          setQrUrl(`${apiRoot}/guards/${encodeURIComponent(data.guardToken)}/qr`);
        } else {
          setQrUrl(null);
        }
        const walletInfo = await loadPayoutInfo();
        const currentBalance =
          walletInfo?.currentBalance ?? walletInfo?.balance ?? walletInfo?.availableBalance;
        await Promise.all([loadTransactions(0, currentBalance), loadPendingTransactions(0)]);
      } catch (err: any) {
        setError(err?.message ?? 'Unable to load profile.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, [loadPendingTransactions, loadPayoutInfo, loadTransactions]);

  useEffect(() => {
    if (!profile?.guardToken) {
      setQrUrl(null);
      return;
    }
    const apiRoot = resolveApiRoot();
    setQrUrl(`${apiRoot}/guards/${encodeURIComponent(profile.guardToken)}/qr`);
  }, [profile?.guardToken]);

  useEffect(() => {
    if (!profile?.eclipseWalletId) return;
    void loadPayoutInfo();
  }, [loadPayoutInfo, profile?.eclipseWalletId]);

  useEffect(() => {
    const balanceFromTx = transactions.find(
      (t) => t.balance !== undefined && !Number.isNaN(Number(t.balance))
    )?.balance;
    const availableFromTx = transactions.find(
      (t) => t.availableBalance !== undefined && !Number.isNaN(Number(t.availableBalance))
    )?.availableBalance;
    if (balanceFromTx === undefined && availableFromTx === undefined) return;
    setPayoutInfo((prev) => {
      const existing = prev?.balance ?? prev?.currentBalance ?? prev?.availableBalance;
      const shouldUpdate = existing === undefined || existing === null || Number(existing) === 0;
      if (!shouldUpdate) return prev;
      return {
        walletId: prev?.walletId,
        balance: balanceFromTx ?? availableFromTx ?? existing ?? 0,
        currentBalance: balanceFromTx ?? existing ?? availableFromTx ?? 0,
        availableBalance: availableFromTx ?? balanceFromTx ?? existing ?? 0,
        currency: prev?.currency ?? 'ZAR',
      };
    });
  }, [transactions]);

  useEffect(() => {
    if (!payoutOpen) return;
    setPayoutFeedback(null);
    void loadPayoutInfo();
  }, [loadPayoutInfo, payoutOpen]);

  const totals = useMemo(() => {
    const received = transactions
      .filter((p) => (p.status ?? '').toUpperCase() === 'SUCCESSFUL')
      .reduce((acc, payment) => acc + (payment.amount ?? 0), 0);
    const pending = transactions
      .filter((p) => (p.status ?? '').toUpperCase().includes('PEND'))
      .reduce((acc, payment) => acc + (payment.amount ?? 0), 0);
    const paidOut = 0;
    return { received, pending, paidOut };
  }, [transactions]);

  const resetGuardProfileForm = useCallback(
    (next?: GuardProfile | null) => {
      const source = next ?? profile;
      if (!source) return;
      setGuardProfileForm({
        firstName: source.firstName ?? '',
        familyName: source.familyName ?? '',
        occupation: source.occupation ?? 'Civil Servant',
        primarySite: source.primarySite ?? source.address ?? '',
        phoneNumber: source.phoneNumber ?? '',
        email: source.email ?? '',
        homeAddress: source.homeAddress ?? source.address ?? '',
      });
      setProfileFeedback(null);
    },
    [profile]
  );

  const handleGuardProfileSave = async () => {
    setProfileSaving(true);
    setProfileFeedback(null);
    try {
      await guardApi.updateProfile({
        firstName: guardProfileForm.firstName,
        familyName: guardProfileForm.familyName,
        occupation: guardProfileForm.occupation,
        primarySite: guardProfileForm.primarySite,
        address: guardProfileForm.primarySite,
        homeAddress: guardProfileForm.homeAddress,
        phoneNumber: guardProfileForm.phoneNumber,
        email: guardProfileForm.email,
      });
      const refreshed = await guardApi.getProfile();
      setProfile(refreshed);
      resetGuardProfileForm(refreshed);
      setProfileEditing(false);
      setProfileFeedback('Profile updated.');
    } catch (err: any) {
      setProfileFeedback(err?.message ?? 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePayoutSubmit = async () => {
    setPayoutFeedback(null);
    const amount = Number(payoutAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setPayoutFeedback('Enter a valid amount.');
      return;
    }
    const maxAvailable = payoutInfo?.availableBalance ?? payoutInfo?.balance;
    if (maxAvailable !== undefined && amount > maxAvailable) {
      setPayoutFeedback('Amount exceeds available balance.');
      return;
    }
    setPayoutPending(true);
    try {
      const payoutResult = await guardApi.requestPayout({ amount, method: payoutMethod });
      const redirect =
        payoutResult?.withdrawal?.redirectUrl ||
        payoutResult?.withdrawal?.authorizationUrl ||
        payoutResult?.withdrawal?.completionUrl ||
        payoutResult?.withdrawal?.voucherUrl;
      setPayoutAmount('');
      setPayoutMethod('ATM_CASH');
      setPayoutOpen(false);
      setPayoutSuccessOpen(true);
      if (redirect && typeof window !== 'undefined') {
        window.location.assign(redirect as string);
      }
    } catch (err: any) {
      setPayoutFeedback(err?.message ?? 'Unable to request payout.');
    } finally {
      setPayoutPending(false);
    }
  };

  const handlePayoutSuccessClose = async () => {
    setPayoutSuccessOpen(false);
    const walletInfo = await loadPayoutInfo();
    const currentBalance =
      walletInfo?.currentBalance ?? walletInfo?.balance ?? walletInfo?.availableBalance;
    await Promise.all([loadTransactions(0, currentBalance), loadPendingTransactions(0)]);
  };

  const handleTransactionsRefresh = async () => {
    const walletInfo = await loadPayoutInfo();
    const currentBalance =
      walletInfo?.currentBalance ?? walletInfo?.balance ?? walletInfo?.availableBalance;
    await loadTransactions(0, currentBalance);
  };

  const handleReservationsRefresh = async () => {
    await Promise.all([loadPayoutInfo(), loadPendingTransactions(0)]);
  };

  if (loading) return <LoadingPanel text="Loading your profile…" />;
  if (error) return <ErrorPanel text={error} />;
  if (!profile) return null;

  const firstTxnBalance = transactions.find(
    (t) => t.balance !== undefined && !Number.isNaN(Number(t.balance))
  )?.balance;
  const firstTxnAvailable = transactions.find(
    (t) => t.availableBalance !== undefined && !Number.isNaN(Number(t.availableBalance))
  )?.availableBalance;

  const payoutBalanceRaw =
    payoutInfo?.currentBalance ?? payoutInfo?.balance ?? payoutInfo?.availableBalance;
  const availableBalanceRaw =
    payoutInfo?.availableBalance ?? payoutInfo?.currentBalance ?? payoutInfo?.balance;

  const payoutBalance =
    payoutBalanceRaw && payoutBalanceRaw !== 0
      ? payoutBalanceRaw
      : firstTxnBalance || firstTxnAvailable || 0;
  const availableBalance =
    availableBalanceRaw && availableBalanceRaw !== 0
      ? availableBalanceRaw
      : firstTxnAvailable || firstTxnBalance || 0;

  const pendingReservationsTotal = pendingTransactions.reduce((sum, row) => {
    const value = Number(row.amount ?? 0);
    return sum + (Number.isNaN(value) ? 0 : Math.abs(value));
  }, 0);

  const reservationMetrics = [
    { label: 'Balance', value: payoutBalance },
    { label: 'Reservations', value: pendingReservationsTotal },
    { label: 'Available Balance', value: availableBalance },
  ];

  const transactionMetrics = [
    { label: 'Balance', value: payoutBalance },
    { label: 'Available Balance', value: availableBalance },
  ];

  return (
    <main className="min-h-screen bg-amber-50 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <DashboardNameCard
          name={`${profile.firstName} ${profile.familyName}`}
          status={profile.status ?? 'active'}
          accountNumber={profile.accountNumber}
        />

        <CivilServantProfileCard
          data={{
            firstName: guardProfileForm.firstName,
            familyName: guardProfileForm.familyName,
            occupation: guardProfileForm.occupation,
            primarySite: guardProfileForm.primarySite,
            email: guardProfileForm.email,
            phoneNumber: guardProfileForm.phoneNumber,
            homeAddress: guardProfileForm.homeAddress,
            accountNumber: profile.accountNumber,
            walletId: profile.eclipseWalletId,
            guardToken: profile.guardToken,
            eclipseCustomerId: profile.eclipseCustomerId,
            eclipseWalletId: profile.eclipseWalletId,
            qrUrl,
          }}
          collapsed={profileCollapsed}
          onToggle={() => setProfileCollapsed((v) => !v)}
          editing={profileEditing}
          onEditToggle={() => {
            if (profileEditing) {
              resetGuardProfileForm();
            }
            setProfileEditing((v) => !v);
          }}
          onFieldChange={(field, value) =>
            setGuardProfileForm((prev) => ({ ...prev, [field]: value }))
          }
          onCancel={() => {
            resetGuardProfileForm();
            setProfileEditing(false);
          }}
          onSave={handleGuardProfileSave}
          saving={profileSaving}
          feedback={profileFeedback}
          showWorkFields
          onViewQr={() => setShowQrModal(true)}
        />

        <DashboardCivilServantKycCard />

        <DashboardPaymentsCard
          title={
            <div className="whitespace-pre leading-tight">
              <span className="block">TRANSACTIONS</span>
            </div>
          }
          collapsed={paymentsCollapsed}
          onToggle={() => setPaymentsCollapsed((v) => !v)}
          metrics={transactionMetrics}
          rightActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadTransactions(txOffset, payoutBalance)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                aria-label="Refresh transactions"
                title="Refresh"
              >
                ⟳
              </button>
              <button
                type="button"
                onClick={() => setPayoutOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                Payout
              </button>
            </div>
          }
          transactions={transactions}
          loading={txLoading}
          showBalanceColumn
          pagination={{
            onPrev: async () => {
              if (txOffset <= 0) return;
              await loadTransactions(Math.max(0, txOffset - 14), payoutBalance);
            },
            onNext: async () => {
              await loadTransactions(txOffset + 14, payoutBalance);
            },
            hasPrev: txOffset > 0,
            hasNext: txHasMore,
            disabled: txLoading,
          }}
        />

        <DashboardPaymentsCard
          title={
            <div className="whitespace-pre leading-tight">
              <span className="block">RESERVATIONS</span>
            </div>
          }
          collapsed={pendingCollapsed}
          onToggle={() => setPendingCollapsed((v) => !v)}
          metrics={reservationMetrics}
          rightActions={
            <button
              type="button"
              onClick={handleReservationsRefresh}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              aria-label="Refresh reservations"
              title="Refresh"
            >
              ⟳
            </button>
          }
          transactions={pendingTransactions}
          loading={pendingLoading}
          emptyLabel="No reservations."
          showBalanceColumn={false}
          showExpiresColumn
          pagination={{
            onPrev: async () => {
              if (pendingOffset <= 0) return;
              await loadPendingTransactions(Math.max(0, pendingOffset - 14));
            },
            onNext: async () => {
              await loadPendingTransactions(pendingOffset + 14);
            },
            hasPrev: pendingOffset > 0,
            hasNext: pendingHasMore,
            disabled: pendingLoading,
          }}
        />
      </div>

      {showQrModal && qrUrl && <QrModal qrUrl={qrUrl} onClose={() => setShowQrModal(false)} />}
      {payoutSuccessOpen && <PayoutSuccessModal onClose={handlePayoutSuccessClose} />}

      {payoutOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4"
          role="button"
          tabIndex={-1}
          onClick={() => setPayoutOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setPayoutOpen(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPayoutOpen(false)}
              className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <h3 className="text-xl font-semibold text-slate-900">Request payout</h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose a payout method and amount. A 1% platform fee will be collected to the tenant
              wallet.
            </p>

            <div className="mt-4 space-y-3">
              <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Available Balance</p>
                  <p className="text-lg font-bold">
                    {payoutInfo
                      ? formatCurrency(payoutInfo.availableBalance ?? payoutInfo.balance)
                      : 'Loading...'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Amount to Withdraw</p>
                  <p className="text-base font-semibold text-slate-900">
                    {payoutAmount ? formatCurrency(Number(payoutAmount)) : '—'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-amber-800">
                  <p className="font-semibold">Estimated Fee (1%)</p>
                  <p className="text-base font-semibold">
                    {payoutAmount ? formatCurrency(Number(payoutAmount) * 0.01) : '—'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Total Deduction</p>
                  <p className="text-base font-semibold text-slate-900">
                    {payoutAmount
                      ? formatCurrency(Number(payoutAmount) + Number(payoutAmount) * 0.01)
                      : '—'}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Balance After Withdrawal</p>
                  <p className="text-base font-semibold text-slate-900">
                    {payoutInfo && payoutAmount
                      ? formatCurrency(
                          (payoutInfo.availableBalance ?? payoutInfo.balance) -
                            (Number(payoutAmount) + Number(payoutAmount) * 0.01)
                        )
                      : '—'}
                  </p>
                </div>
              </div>

              <label className="text-sm font-semibold text-slate-600">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="Enter amount"
                />
              </label>

              <label className="text-sm font-semibold text-slate-600">
                Method
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as any)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <option value="ATM_CASH">ATM cash</option>
                  <option value="PNP_CASH">Pick n Pay cash</option>
                  <option value="PNP_SPEND">Pick n Pay spending</option>
                </select>
              </label>

              {payoutFeedback && <p className="text-sm text-rose-600">{payoutFeedback}</p>}

              <button
                type="button"
                onClick={handlePayoutSubmit}
                disabled={payoutPending}
                className="w-full rounded-2xl bg-orange-500 px-6 py-3 text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-60"
              >
                {payoutPending ? 'Submitting...' : 'Submit payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CustomerDashboard() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [sentTransactions, setSentTransactions] = useState<DashboardTransaction[]>([]);
  const [txOffset, setTxOffset] = useState(0);
  const [txHasMore, setTxHasMore] = useState(false);
  const [sentOffset, setSentOffset] = useState(0);
  const [sentHasMore, setSentHasMore] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [sentLoading, setSentLoading] = useState(false);
  const [profileCollapsed, setProfileCollapsed] = useState(false);
  const [paymentsCollapsed, setPaymentsCollapsed] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paySearch, setPaySearch] = useState({
    firstName: '',
    familyName: '',
    occupation: '',
    site: '',
  });
  const [payResults, setPayResults] = useState<
    {
      civilServantId: string;
      firstName: string;
      familyName: string;
      occupation: string;
      primarySite: string;
      guardToken?: string;
      accountNumber?: string;
      status?: string;
    }[]
  >([]);
  const [payLoading, setPayLoading] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<{
    civilServantId: string;
    guardToken: string;
    firstName: string;
    familyName: string;
    occupation: string;
    primarySite: string;
  } | null>(null);
  const [guardProfile, setGuardProfile] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [yourReference, setYourReference] = useState('');
  const [theirReference, setTheirReference] = useState('');
  const [payFeedback, setPayFeedback] = useState<string | null>(null);
  const [payPending, setPayPending] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    familyName: '',
    email: '',
    phoneNumber: '',
    address: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  const loadTransactions = async (offset = 0) => {
    setTxLoading(true);
    try {
      const tx = await customerApi.getTransactions({ offset, limit: 20 });
      setTransactions(mapDashboardTransactions(tx ?? []));
      setTxOffset(offset);
      setTxHasMore((tx ?? []).length === 14);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load transactions.');
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  const loadSentTransactions = async (offset = 0) => {
    setSentLoading(true);
    try {
      const tx = await customerApi.getSentTransactions({ offset, limit: 20 });
      setSentTransactions(mapDashboardTransactions(tx ?? []));
      setSentOffset(offset);
      setSentHasMore((tx ?? []).length === 14);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load sent payments.');
      setSentTransactions([]);
    } finally {
      setSentLoading(false);
    }
  };

  const loadWallet = async () => {
    try {
      const info = await customerApi.getWalletInfo();
      setWallet({
        walletId: info.walletId,
        balance: info.balance,
        availableBalance: info.availableBalance ?? info.balance,
        currentBalance: info.currentBalance ?? info.balance,
        currency: info.currency,
      });
    } catch {
      // ignore wallet failures; keep existing value
    }
  };

  const handleSearchGuards = async () => {
    setPayLoading(true);
    setPayFeedback(null);
    try {
      const data = await customerApi.searchCivilServants(paySearch);
      setPayResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setPayFeedback(err?.message ?? 'Unable to search civil servants.');
      setPayResults([]);
    } finally {
      setPayLoading(false);
    }
  };

  const handleSelectGuard = async (guard: {
    civilServantId: string;
    guardToken?: string;
    firstName: string;
    familyName: string;
    occupation: string;
    primarySite: string;
  }) => {
    if (!guard.guardToken) {
      setPayFeedback('This guard is not ready for payments yet.');
      return;
    }
    const guardToken = `${guard.guardToken}`.trim();
    if (!guardToken) {
      setPayFeedback('This guard is not ready for payments yet.');
      return;
    }
    setSelectedGuard({
      civilServantId: guard.civilServantId,
      guardToken,
      firstName: guard.firstName,
      familyName: guard.familyName,
      occupation: guard.occupation,
      primarySite: guard.primarySite,
    });
    setYourReference(`${guard.firstName ?? ''} ${guard.occupation || 'Civil Servant'}`.trim());
    setTheirReference(`${profile?.firstName ?? ''} ${profile?.familyName ?? ''}`.trim());
    setPayFeedback(null);
    try {
      const profile = await guardsClient.getGuard(guardToken);
      setGuardProfile(profile);
      if (profile.quickAmounts?.length) {
        setPayAmount(profile.quickAmounts[0]);
      }
    } catch (err: any) {
      setPayFeedback(err?.message ?? 'Unable to load guard profile.');
      setGuardProfile(null);
    }
  };

  const parsedCustomAmount = useMemo(() => {
    if (!customAmount.trim()) return null;
    const sanitized = customAmount.replace(/[^\d.,]/g, '').replace(',', '.');
    const value = Number.parseFloat(sanitized);
    if (Number.isNaN(value)) return Number.NaN;
    return Math.round(value * 100) / 100;
  }, [customAmount]);

  const activeAmount = parsedCustomAmount ?? payAmount ?? null;

  const handleSubmitPayment = async () => {
    if (!selectedGuard?.guardToken) return;
    setPayFeedback(null);
    const amount = activeAmount;
    if (amount === null || Number.isNaN(amount) || amount <= 0) {
      setPayFeedback('Choose or enter a valid amount.');
      return;
    }
    if (amount < 5 || amount > 2000) {
      setPayFeedback('Amount must be between R5 and R2000.');
      return;
    }
    setPayPending(true);
    try {
      const token = `${selectedGuard.guardToken}`.trim();
      const intent = await guardsClient.createTipIntent(token, {
        amount,
        currency: 'ZAR',
        returnUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        guardToken: token,
        yourReference: yourReference || undefined,
        theirReference: theirReference || undefined,
      });
      setPayFeedback('Payment initiated. Opening payment page...');
      if (intent.authorizationUrl) {
        window.open(intent.authorizationUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setPayFeedback(err?.message ?? 'Unable to start payment.');
    } finally {
      setPayPending(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await customerApi.getProfile();
        setProfile(data);
        setProfileForm({
          firstName: data.firstName ?? '',
          familyName: data.familyName ?? '',
          email: data.email ?? '',
          phoneNumber: data.phoneNumber ?? '',
          address: data.address ?? '',
        });
        await Promise.all([loadTransactions(0), loadSentTransactions(0), loadWallet()]);
      } catch (err: any) {
        setError(err?.message ?? 'Unable to load profile.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const totals = useMemo(() => {
    const received = transactions
      .filter((p) => (p.status ?? '').toUpperCase() === 'SUCCESSFUL')
      .reduce((acc, payment) => acc + (payment.amount ?? 0), 0);
    const pending = transactions
      .filter((p) => (p.status ?? '').toUpperCase().includes('PEND'))
      .reduce((acc, payment) => acc + (payment.amount ?? 0), 0);
    const paidOut = 0;
    return { received, pending, paidOut };
  }, [transactions]);

  if (loading) return <LoadingPanel text="Loading your profile…" />;
  if (error) return <ErrorPanel text={error} />;
  if (!profile) return null;

  const balanceValue =
    wallet?.currentBalance ?? wallet?.balance ?? wallet?.availableBalance ?? totals.received;
  const availableBalance =
    wallet?.availableBalance ?? wallet?.currentBalance ?? wallet?.balance ?? totals.received;

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileFeedback(null);
    try {
      await customerApi.updateProfile({
        firstName: profileForm.firstName,
        familyName: profileForm.familyName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
        address: profileForm.address,
      });
      const refreshed = await customerApi.getProfile();
      setProfile(refreshed);
      setProfileFeedback('Profile updated.');
    } catch (err: any) {
      setProfileFeedback(err?.message ?? 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-amber-50 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <DashboardNameCard
          name={`${profile.firstName} ${profile.familyName}`}
          status={profile.status ?? 'active'}
          accountNumber={profile.accountNumber}
        />

        <section className="w-full max-w-4xl self-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Profile</p>
            <button
              type="button"
              onClick={() => setProfileCollapsed((v) => !v)}
              className="text-sm font-semibold text-orange-600"
            >
              {profileCollapsed ? '▼' : '▲'}
            </button>
          </header>
          {!profileCollapsed && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  First Name
                  <input
                    value={profileForm.firstName}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Last Name
                  <input
                    value={profileForm.familyName}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, familyName: e.target.value }))
                    }
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  Email
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Phone
                  <input
                    value={profileForm.phoneNumber}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                    }
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                  />
                </label>
              </div>

              <label className="text-xs font-semibold text-slate-600">
                Address
                <input
                  value={profileForm.address}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  Pashasha Account
                  <input
                    value={profile.accountNumber}
                    disabled
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Wallet ID
                  <input
                    value={profile.eclipseWalletId ?? 'Not linked'}
                    disabled
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {profileFeedback && (
                  <p
                    className={`text-sm ${profileFeedback.includes('updated') ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {profileFeedback}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="btn-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {profileSaving ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </div>
          )}
        </section>

        <DashboardCustomerKycCard />

        <DashboardPaymentsCard
          title="Payments"
          collapsed={paymentsCollapsed}
          onToggle={() => setPaymentsCollapsed((v) => !v)}
          balance={balanceValue}
          availableBalance={availableBalance}
          transactions={transactions}
          loading={txLoading}
          rightActions={
            <button
              type="button"
              onClick={() => {
                setPayModalOpen(true);
                setPayFeedback(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
            >
              Pay Civil Servant
            </button>
          }
          pagination={{
            onPrev: async () => {
              if (txOffset <= 0) return;
              await loadTransactions(Math.max(0, txOffset - 14));
            },
            onNext: async () => {
              await loadTransactions(txOffset + 14);
            },
            hasPrev: txOffset > 0,
            hasNext: txHasMore,
            disabled: txLoading,
          }}
        />

        <DashboardPaymentsCard
          title="Sent payments"
          collapsed={paymentsCollapsed}
          onToggle={() => setPaymentsCollapsed((v) => !v)}
          balance={balanceValue}
          availableBalance={availableBalance}
          transactions={sentTransactions}
          loading={sentLoading}
          emptyLabel="No sent payments yet."
          actions={
            <span className="text-xs text-slate-500">Wallet: {wallet?.walletId ?? '—'}</span>
          }
          pagination={{
            onPrev: async () => {
              if (sentOffset <= 0) return;
              await loadSentTransactions(Math.max(0, sentOffset - 14));
            },
            onNext: async () => {
              await loadSentTransactions(sentOffset + 14);
            },
            hasPrev: sentOffset > 0,
            hasNext: sentHasMore,
            disabled: sentLoading,
          }}
        />
      </div>

      {payModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4"
          role="button"
          tabIndex={-1}
          onClick={() => setPayModalOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setPayModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPayModalOpen(false)}
              className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <h3 className="text-xl font-semibold text-slate-900">Pay a Civil Servant</h3>
            <p className="mt-1 text-sm text-slate-600">
              Search for a civil servant and send a payment without scanning a QR code.
            </p>

            <div className="mt-4 space-y-4">
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-900">Search</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-600">
                    First name
                    <input
                      value={paySearch.firstName}
                      onChange={(e) =>
                        setPaySearch((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2"
                      placeholder="e.g. John"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Last name
                    <input
                      value={paySearch.familyName}
                      onChange={(e) =>
                        setPaySearch((prev) => ({ ...prev, familyName: e.target.value }))
                      }
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2"
                      placeholder="e.g. Doe"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Occupation
                    <input
                      value={paySearch.occupation}
                      onChange={(e) =>
                        setPaySearch((prev) => ({ ...prev, occupation: e.target.value }))
                      }
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2"
                      placeholder="e.g. Guard"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Site
                    <input
                      value={paySearch.site}
                      onChange={(e) => setPaySearch((prev) => ({ ...prev, site: e.target.value }))}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2"
                      placeholder="e.g. Mall"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleSearchGuards}
                  disabled={payLoading}
                  className="btn-primary w-full px-4 py-2 text-sm font-semibold text-white"
                >
                  {payLoading ? 'Searching...' : 'Search'}
                </button>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {payResults.map((result) => (
                    <button
                      key={result.civilServantId}
                      type="button"
                      onClick={() => handleSelectGuard(result)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedGuard?.civilServantId === result.civilServantId
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-slate-200 bg-white hover:border-orange-200'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {result.firstName} {result.familyName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {result.occupation} · {result.primarySite || 'Assigned site'}
                      </p>
                    </button>
                  ))}
                  {!payLoading && payResults.length === 0 && (
                    <p className="text-xs text-slate-500">No results yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-slate-900">Payment</h4>
                {selectedGuard ? (
                  <>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedGuard.firstName} {selectedGuard.familyName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedGuard.occupation} · {selectedGuard.primarySite || 'Assigned site'}
                    </p>
                    <div className="grid gap-3 pt-2 md:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-600">
                        Your reference
                        <input
                          value={yourReference}
                          onChange={(e) => setYourReference(e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2"
                          placeholder={`${selectedGuard.firstName} ${selectedGuard.occupation}`}
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Their reference
                        <input
                          value={theirReference}
                          onChange={(e) => setTheirReference(e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2"
                          placeholder={`${profile.firstName} ${profile.familyName}`}
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(guardProfile?.quickAmounts ?? [20, 50, 100, 150]).map((amt: number) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setPayAmount(amt);
                            setCustomAmount('');
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            activeAmount === amt
                              ? 'bg-orange-500 text-white'
                              : 'border border-slate-200 bg-slate-50 text-slate-800 hover:border-orange-200'
                          }`}
                        >
                          {formatCurrency(amt)}
                        </button>
                      ))}
                    </div>
                    <label className="text-xs font-semibold text-slate-600">
                      Custom amount (ZAR)
                      <input
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2"
                        placeholder="Enter amount"
                      />
                    </label>
                    {payFeedback && <p className="text-xs text-rose-600">{payFeedback}</p>}
                    <button
                      type="button"
                      onClick={handleSubmitPayment}
                      disabled={payPending}
                      className="btn-primary w-full px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {payPending ? 'Processing...' : 'Pay now'}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">
                    Select a civil servant to start a payment.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  const [session, setSession] = useState(() => getSession());
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  const normalizedGroups = (session?.groups ?? []).map((g) =>
    g.toLowerCase().replace(/[\s_-]/g, '')
  );
  const hasGroup = (...targets: string[]) =>
    normalizedGroups.some((g) => targets.some((t) => g === t.toLowerCase().replace(/[\s_-]/g, '')));

  const isCivilServant = hasGroup('civilservants', 'civilservant');
  const isCustomer = hasGroup('customers', 'customer');
  const isAdmin = hasGroup('administrators', 'administrator');

  useEffect(() => {
    setSession(getSession());
    setSessionReady(true);
  }, []);

  useEffect(() => {
    const handleSessionChange = () => setSession(getSession());
    window.addEventListener(sessionEventName, handleSessionChange);
    return () => {
      window.removeEventListener(sessionEventName, handleSessionChange);
    };
  }, []);

  useEffect(() => {
    if (sessionReady && session && isAdmin) {
      router.replace('/admin');
    }
  }, [isAdmin, router, session, sessionReady]);

  if (!sessionReady) {
    return <LoadingPanel text="Loading…" />;
  }

  if (!session) {
    return <MarketingScreen />;
  }

  if (isAdmin) {
    return null;
  }

  if (isCivilServant) {
    return <CivilServantDashboard />;
  }

  // Default to customer dashboard for non-admin accounts.
  return <CustomerDashboard />;
}
