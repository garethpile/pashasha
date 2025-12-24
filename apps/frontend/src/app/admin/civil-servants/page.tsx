'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../../lib/api/admin';
import Image from 'next/image';
import {
  DashboardNameCard,
  DashboardPaymentsCard,
  DashboardTransaction,
} from '../../../components/dashboard/cards';
import { CivilServantProfileCard } from '../../../components/dashboard/civil-servant-profile-card';
import { mapDashboardTransactions } from '../../../components/dashboard/transactions';
import { DashboardKycCard } from '../../../components/dashboard/kyc-card';

type WalletInfo = {
  balance: number;
  availableBalance?: number;
  currentBalance?: number;
  currency?: string;
};

type CivilServant = {
  civilServantId: string;
  accountNumber: string;
  firstName: string;
  familyName: string;
  email: string;
  phoneNumber?: string;
  occupation?: string;
  primarySite?: string;
  address?: string;
  homeAddress?: string;
  guardToken?: string;
  qrCodeKey?: string;
  status?: string;
  eclipseCustomerId?: string;
  eclipseWalletId?: string;
};

export default function CivilServantManagementPage() {
  const [creation, setCreation] = useState({
    firstName: '',
    familyName: '',
    email: '',
    phoneNumber: '',
    occupation: '',
    address: '',
  });
  const [searchCriteria, setSearchCriteria] = useState({
    accountNumber: '',
    familyName: '',
  });
  const [results, setResults] = useState<CivilServant[]>([]);
  const [selected, setSelected] = useState<CivilServant | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [reservations, setReservations] = useState<DashboardTransaction[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [profileCollapsed, setProfileCollapsed] = useState(false);
  const [paymentsCollapsed, setPaymentsCollapsed] = useState(false);
  const [reservationsCollapsed, setReservationsCollapsed] = useState(true);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    familyName: '',
    email: '',
    phoneNumber: '',
    occupation: '',
    primarySite: '',
    address: '',
    homeAddress: '',
  });

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      if (!creation.email.trim()) {
        setError('Email is required');
        return;
      }
      const duplicate = await adminApi.checkEmail(creation.email.trim());
      if (duplicate.exists) {
        setError(
          `The email address is already registered as a ${duplicate.type ?? 'user'}, please choose another address.`
        );
        return;
      }
      await adminApi.createCivilServant({
        ...creation,
        phoneNumber: creation.phoneNumber || undefined,
        occupation: creation.occupation || undefined,
        address: creation.address || undefined,
      });
      setMessage('Civil servant provisioning started. You will receive credentials once ready.');
      setCreation({
        firstName: '',
        familyName: '',
        email: '',
        phoneNumber: '',
        occupation: '',
        address: '',
      });
      setSelected(null);
      setResults((prev) => prev);
      setQrPreview(null);
      setQrUrl(null);
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to create civil servant.');
    }
  };

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSelected(null);
    setLoading(true);
    try {
      const data = (await adminApi.searchCivilServants(searchCriteria)) as CivilServant[];
      setResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to search.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this civil servant?')) return;
    setError(null);
    try {
      await adminApi.deleteCivilServant(id);
      setResults((prev) => prev.filter((item) => item.civilServantId !== id));
      if (selected?.civilServantId === id) {
        setSelected(null);
      }
      setMessage('Civil servant deleted.');
      setQrPreview(null);
      setQrUrl(null);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to delete civil servant.');
    }
  };

  const regenerateQr = async (id: string) => {
    setError(null);
    setMessage(null);
    try {
      const updated = (await adminApi.generateCivilServantQr(id)) as CivilServant;
      setSelected(updated);
      setResults((prev) =>
        prev.map((servant) =>
          servant.civilServantId === updated.civilServantId ? updated : servant
        )
      );
      setMessage('QR code regenerated and uploaded.');
      setQrPreview(null);
      setQrUrl(null);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to generate QR code.');
    }
  };

  const fetchQrUrl = async (id: string, openModal = false) => {
    setQrLoading(true);
    try {
      const response = await adminApi.getCivilServantQr(id);
      setQrUrl(response.url);
      if (openModal) {
        setQrPreview(response.url);
      }
    } catch (err: any) {
      if (openModal) {
        setError(err?.message ?? 'Unable to load QR code.');
      }
      setQrUrl(null);
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (selected?.civilServantId && selected.qrCodeKey) {
      fetchQrUrl(selected.civilServantId);
    } else {
      setQrUrl(null);
    }
    if (selected) {
      setProfileForm({
        firstName: selected.firstName ?? '',
        familyName: selected.familyName ?? '',
        email: selected.email ?? '',
        phoneNumber: selected.phoneNumber ?? '',
        occupation: selected.occupation ?? '',
        primarySite: selected.primarySite ?? selected.address ?? '',
        address: selected.address ?? '',
        homeAddress: selected.homeAddress ?? selected.address ?? '',
      });
      setProfileEditing(false);
      setProfileSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.civilServantId, selected?.qrCodeKey]);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!selected?.civilServantId) {
        setTransactions([]);
        setReservations([]);
        setWalletInfo(null);
        return;
      }
      setTxLoading(true);
      setReservationsLoading(true);
      try {
        const [history, pending, payout] = await Promise.all([
          adminApi.getCivilServantTransactions(selected.civilServantId) as Promise<any[]>,
          adminApi.getCivilServantPendingTransactions(selected.civilServantId, {
            limit: 25,
            offset: 0,
          }) as Promise<any[]>,
          adminApi.getCivilServantPayout(selected.civilServantId) as Promise<WalletInfo>,
        ]);
        setTransactions(mapDashboardTransactions(history ?? []));
        setReservations(mapDashboardTransactions(pending ?? []));
        setWalletInfo(payout ?? null);
      } catch (err: any) {
        setError(err?.message ?? 'Unable to load transactions.');
        setTransactions([]);
        setReservations([]);
        setWalletInfo(null);
      } finally {
        setTxLoading(false);
        setReservationsLoading(false);
      }
    };
    loadTransactions();
  }, [selected?.civilServantId]);

  const pendingReservationsTotal = reservations.reduce((sum, row) => {
    const value = Number(row.amount ?? 0);
    return sum + (Number.isNaN(value) ? 0 : Math.abs(value));
  }, 0);

  const renderCreateForm = () => (
    <form onSubmit={handleCreate} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-600">
          First name
          <input
            required
            value={creation.firstName}
            onChange={(e) => setCreation((prev) => ({ ...prev, firstName: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>
        <label className="text-sm font-semibold text-slate-600">
          Family name
          <input
            required
            value={creation.familyName}
            onChange={(e) => setCreation((prev) => ({ ...prev, familyName: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>
      </div>
      <label className="text-sm font-semibold text-slate-600">
        Email
        <input
          required
          type="email"
          value={creation.email}
          onChange={(e) => setCreation((prev) => ({ ...prev, email: e.target.value }))}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </label>
      <label className="text-sm font-semibold text-slate-600">
        Occupation
        <input
          value={creation.occupation}
          onChange={(e) => setCreation((prev) => ({ ...prev, occupation: e.target.value }))}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
          placeholder="e.g. Security Guard"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-600">
          Phone
          <input
            value={creation.phoneNumber}
            onChange={(e) => setCreation((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>
        <label className="text-sm font-semibold text-slate-600">
          Primary site / address
          <input
            value={creation.address}
            onChange={(e) => setCreation((prev) => ({ ...prev, address: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>
      </div>
      <button type="submit" className="btn-primary px-6 py-3 text-base font-semibold text-white">
        Create civil servant
      </button>
    </form>
  );

  const safeResults = useMemo(() => {
    const arrayResults = Array.isArray(results) ? results : [];
    return arrayResults.filter((servant): servant is CivilServant =>
      Boolean(servant?.civilServantId)
    );
  }, [results]);

  const resetProfileForm = () => {
    if (!selected) return;
    setProfileForm({
      firstName: selected.firstName ?? '',
      familyName: selected.familyName ?? '',
      email: selected.email ?? '',
      phoneNumber: selected.phoneNumber ?? '',
      occupation: selected.occupation ?? '',
      primarySite: selected.primarySite ?? selected.address ?? '',
      address: selected.address ?? '',
      homeAddress: selected.homeAddress ?? selected.address ?? '',
    });
  };

  const handleProfileFieldChange = (field: string, value: string) => {
    setProfileForm((prev) => {
      if (field in prev) {
        return { ...prev, [field]: value } as typeof prev;
      }
      return prev;
    });
  };

  const saveProfile = async () => {
    if (!selected) return;
    setProfileSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = (await adminApi.updateCivilServant(selected.civilServantId, {
        firstName: profileForm.firstName,
        familyName: profileForm.familyName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber || undefined,
        occupation: profileForm.occupation || undefined,
        primarySite: profileForm.primarySite || undefined,
        address: profileForm.address || undefined,
        homeAddress: profileForm.homeAddress || undefined,
      })) as CivilServant;
      setSelected(updated);
      setResults((prev) =>
        prev.map((c) => (c.civilServantId === updated.civilServantId ? updated : c))
      );
      setProfileEditing(false);
      setMessage('Profile updated.');
    } catch (err: any) {
      setError(err?.message ?? 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm"
        >
          <span className="text-lg leading-none">＋</span> Add civil servant
        </button>
      </div>

      <form
        onSubmit={handleSearch}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900">Search civil servants</h2>
        <label className="text-sm font-semibold text-slate-600">
          Account number
          <input
            value={searchCriteria.accountNumber}
            onChange={(e) =>
              setSearchCriteria((prev) => ({ ...prev, accountNumber: e.target.value }))
            }
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>
        <label className="text-sm font-semibold text-slate-600">
          Family name
          <input
            value={searchCriteria.familyName}
            onChange={(e) => setSearchCriteria((prev) => ({ ...prev, familyName: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>
        <button
          type="submit"
          className="btn-primary px-6 py-3 text-base font-semibold text-white"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Results</h3>
          <span className="text-sm text-slate-500">{safeResults.length} records</span>
        </div>
        <ul>
          {safeResults.map((servant) => {
            const id = servant.civilServantId;
            return (
              <li
                key={id}
                className={`flex items-center justify-between border-b border-slate-100 px-6 py-4 ${selected?.civilServantId === id ? 'bg-orange-50' : ''}`}
              >
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {servant.firstName} {servant.familyName}
                  </p>
                  <p className="text-sm text-slate-500">{servant.accountNumber}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(servant);
                      fetchQrUrl(id);
                    }}
                    className="btn-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(id)}
                    className="btn-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
          {safeResults.length === 0 && (
            <li className="px-6 py-10 text-center text-sm text-slate-500">
              No civil servants found.
            </li>
          )}
        </ul>
      </div>

      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {message && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      )}

      {selected && (
        <div className="space-y-6">
          <DashboardNameCard
            name={`${selected.firstName} ${selected.familyName}`}
            status={selected.status ?? 'active'}
            accountNumber={selected.accountNumber}
          />

          <CivilServantProfileCard
            data={{
              firstName: profileForm.firstName,
              familyName: profileForm.familyName,
              occupation: profileForm.occupation,
              primarySite: profileForm.primarySite,
              email: profileForm.email,
              phoneNumber: profileForm.phoneNumber,
              homeAddress: profileForm.homeAddress,
              accountNumber: selected.accountNumber ?? null,
              walletId: selected.eclipseWalletId ?? null,
              guardToken: selected.guardToken ?? null,
              eclipseCustomerId: selected.eclipseCustomerId ?? null,
              eclipseWalletId: selected.eclipseWalletId ?? null,
              qrUrl: qrUrl ?? null,
            }}
            collapsed={profileCollapsed}
            onToggle={() => setProfileCollapsed((v) => !v)}
            editing={profileEditing}
            onEditToggle={() => setProfileEditing((v) => !v)}
            onFieldChange={handleProfileFieldChange}
            onCancel={() => {
              resetProfileForm();
              setProfileEditing(false);
            }}
            onSave={saveProfile}
            saving={profileSaving}
            feedback={message}
            showWorkFields
            showEclipseAccount
            onViewQr={() => selected?.civilServantId && fetchQrUrl(selected.civilServantId, true)}
            onGenerateQr={() => selected?.civilServantId && regenerateQr(selected.civilServantId)}
            qrLoading={qrLoading}
            canViewQr={Boolean(selected?.qrCodeKey)}
          />

          <DashboardKycCard profileType="civil-servant" profileId={selected.civilServantId} />

          <DashboardPaymentsCard
            title="Transaction history"
            collapsed={paymentsCollapsed}
            onToggle={() => setPaymentsCollapsed((v) => !v)}
            transactions={transactions}
            loading={txLoading}
            metrics={
              walletInfo
                ? [
                    {
                      label: 'Balance',
                      value: walletInfo.currentBalance ?? walletInfo.balance ?? 0,
                    },
                    {
                      label: 'Available Balance',
                      value:
                        walletInfo.availableBalance ??
                        walletInfo.currentBalance ??
                        walletInfo.balance ??
                        0,
                    },
                  ]
                : undefined
            }
            actions={
              <span className="text-xs text-slate-500">
                Wallet: {selected.eclipseWalletId ?? '—'}
              </span>
            }
          />

          <DashboardPaymentsCard
            title="Reservations"
            collapsed={reservationsCollapsed}
            onToggle={() => setReservationsCollapsed((v) => !v)}
            transactions={reservations}
            loading={reservationsLoading}
            emptyLabel="No reservations."
            metrics={
              walletInfo
                ? [
                    {
                      label: 'Balance',
                      value: walletInfo.currentBalance ?? walletInfo.balance ?? 0,
                    },
                    { label: 'Pending Reservations', value: pendingReservationsTotal },
                    {
                      label: 'Available Balance',
                      value:
                        walletInfo.availableBalance ??
                        walletInfo.currentBalance ??
                        walletInfo.balance ??
                        0,
                    },
                  ]
                : [{ label: 'Pending Reservations', value: pendingReservationsTotal }]
            }
            actions={
              <span className="text-xs text-slate-500">
                Wallet: {selected.eclipseWalletId ?? '—'}
              </span>
            }
            showBalanceColumn={false}
            showExpiresColumn
          />
        </div>
      )}

      {qrPreview && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
          role="button"
          tabIndex={-1}
          onClick={() => setQrPreview(null)}
          onKeyDown={(e) => e.key === 'Escape' && setQrPreview(null)}
        >
          <div
            className="relative rounded-2xl bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQrPreview(null)}
              className="absolute right-2 top-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <Image
              src={qrPreview}
              alt="QR preview"
              width={288}
              height={288}
              className="h-72 w-72 rounded-lg object-contain"
            />
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Create civil servant</h3>
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setShowCreateModal(false)}
              >
                Close
              </button>
            </div>
            {renderCreateForm()}
          </div>
        </div>
      )}
    </div>
  );
}
