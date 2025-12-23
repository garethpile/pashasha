'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../../lib/api/admin';
import {
  DashboardNameCard,
  DashboardPaymentsCard,
  DashboardProfileCard,
  DashboardProfileField,
  DashboardTransaction,
} from '../../../components/dashboard/cards';
import { mapDashboardTransactions } from '../../../components/dashboard/transactions';
import { DashboardKycCard } from '../../../components/dashboard/kyc-card';

type Customer = {
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
  balance: number;
  availableBalance?: number;
  currentBalance?: number;
  currency: string;
};

export default function CustomerManagementPage() {
  const [form, setForm] = useState({
    firstName: '',
    familyName: '',
    email: '',
    phoneNumber: '',
    address: '',
  });
  const [search, setSearch] = useState({ accountNumber: '', familyName: '' });
  const [results, setResults] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [reservations, setReservations] = useState<DashboardTransaction[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [profileCollapsed, setProfileCollapsed] = useState(false);
  const [paymentsCollapsed, setPaymentsCollapsed] = useState(false);
  const [reservationsCollapsed, setReservationsCollapsed] = useState(true);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    familyName: '',
    email: '',
    phoneNumber: '',
    address: '',
  });

  const selectedProfileFields: DashboardProfileField[] = useMemo(() => {
    if (!selected) return [];
    return [
      { id: 'firstName', label: 'First Name', value: profileForm.firstName },
      { id: 'familyName', label: 'Last Name', value: profileForm.familyName },
      { id: 'email', label: 'Email', value: profileForm.email },
      { id: 'phoneNumber', label: 'Phone', value: profileForm.phoneNumber ?? '—' },
      { id: 'address', label: 'Address', value: profileForm.address ?? '—', span: 2 },
      { label: 'Pashasha Account', value: selected.accountNumber, mono: true },
      { label: 'Wallet ID', value: selected.eclipseWalletId ?? '—', mono: true },
    ];
  }, [profileForm, selected]);

  const balanceValue =
    wallet?.currentBalance ?? wallet?.balance ?? wallet?.availableBalance ?? undefined;
  const availableBalanceValue =
    wallet?.availableBalance ?? wallet?.currentBalance ?? wallet?.balance ?? undefined;

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await adminApi.createCustomer({
        ...form,
        phoneNumber: form.phoneNumber || undefined,
        address: form.address || undefined,
      });
      setMessage('Customer provisioning started. You will receive credentials once ready.');
      setResults((prev) => prev);
      setSelected(null);
      setForm({ firstName: '', familyName: '', email: '', phoneNumber: '', address: '' });
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to create customer.');
    }
  };

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const data = (await adminApi.searchCustomers(search)) as Customer[];
      setResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to search.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await adminApi.deleteCustomer(id);
      setResults((prev) => prev.filter((c) => c.customerId !== id));
      if (selected?.customerId === id) setSelected(null);
      setMessage('Customer deleted.');
    } catch (err: any) {
      setError(err?.message ?? 'Unable to delete customer.');
    }
  };

  useEffect(() => {
    const loadDetails = async () => {
      if (!selected?.customerId) {
        setTransactions([]);
        setReservations([]);
        setWallet(null);
        return;
      }
      setProfileForm({
        firstName: selected.firstName ?? '',
        familyName: selected.familyName ?? '',
        email: selected.email ?? '',
        phoneNumber: selected.phoneNumber ?? '',
        address: selected.address ?? '',
      });
      setProfileEditing(false);
      setProfileSaving(false);
      setTxLoading(true);
      setReservationsLoading(true);
      try {
        const [tx, pending, walletInfo] = (await Promise.all([
          adminApi.getCustomerTransactions(selected.customerId),
          adminApi.getCustomerPendingTransactions(selected.customerId, { limit: 25, offset: 0 }),
          adminApi.getCustomerWallet(selected.customerId),
        ])) as [any, any, any];
        setTransactions(mapDashboardTransactions((tx as any[]) ?? []));
        setReservations(mapDashboardTransactions((pending as any[]) ?? []));
        if (walletInfo) {
          setWallet({
            balance: walletInfo.balance,
            availableBalance: walletInfo.availableBalance ?? walletInfo.balance,
            currentBalance: walletInfo.currentBalance ?? walletInfo.balance,
            currency: walletInfo.currency,
          });
        } else {
          setWallet(null);
        }
      } catch (err: any) {
        setError(err?.message ?? 'Unable to load customer details.');
        setTransactions([]);
        setReservations([]);
        setWallet(null);
      } finally {
        setTxLoading(false);
        setReservationsLoading(false);
      }
    };
    void loadDetails();
  }, [
    selected?.customerId,
    selected?.firstName,
    selected?.familyName,
    selected?.email,
    selected?.phoneNumber,
    selected?.address,
  ]);

  const pendingReservationsTotal = reservations.reduce((sum, row) => {
    const value = Number(row.amount ?? 0);
    return sum + (Number.isNaN(value) ? 0 : Math.abs(value));
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        >
          <span className="text-lg leading-none">＋</span> Add customer
        </button>
      </div>

      <form
        onSubmit={handleSearch}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900">Search customers</h2>
        <label className="text-sm font-semibold text-slate-600">
          Account number
          <input
            value={search.accountNumber}
            onChange={(e) => setSearch((prev) => ({ ...prev, accountNumber: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>
        <label className="text-sm font-semibold text-slate-600">
          Family name
          <input
            value={search.familyName}
            onChange={(e) => setSearch((prev) => ({ ...prev, familyName: e.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>
        <button type="submit" className="btn-primary px-6 py-3 text-base font-semibold text-white">
          Search
        </button>
      </form>

      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {message && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Results</h3>
          <span className="text-sm text-slate-500">{results.length} records</span>
        </div>
        <ul>
          {results.map((customer) => (
            <li
              key={customer.customerId}
              className={`flex items-center justify-between px-6 py-4 ${
                selected?.customerId === customer.customerId ? 'bg-orange-50' : ''
              }`}
            >
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {customer.firstName} {customer.familyName}
                </p>
                <p className="text-sm text-slate-500">{customer.accountNumber}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(customer)}
                  className="btn-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(customer.customerId)}
                  className="btn-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-6 py-10 text-center text-sm text-slate-500">No customers found.</li>
          )}
        </ul>
      </div>

      {selected && (
        <div className="space-y-6">
          <DashboardNameCard
            name={`${selected.firstName} ${selected.familyName}`}
            status={selected.status ?? 'active'}
            accountNumber={selected.accountNumber}
          />
          <DashboardProfileCard
            title="Profile"
            collapsed={profileCollapsed}
            onToggle={() => setProfileCollapsed((v) => !v)}
            fields={selectedProfileFields}
            editing={profileEditing}
            onFieldChange={(fieldId, value) =>
              setProfileForm((prev) => ({
                ...prev,
                [fieldId]: value,
              }))
            }
            actions={
              <button
                type="button"
                onClick={() => setProfileEditing((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                aria-label="Edit profile"
                title="Edit profile"
              >
                ✎
              </button>
            }
            footer={
              profileEditing && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!selected) return;
                      setProfileForm({
                        firstName: selected.firstName ?? '',
                        familyName: selected.familyName ?? '',
                        email: selected.email ?? '',
                        phoneNumber: selected.phoneNumber ?? '',
                        address: selected.address ?? '',
                      });
                      setProfileEditing(false);
                    }}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={profileSaving}
                    onClick={async () => {
                      if (!selected) return;
                      setProfileSaving(true);
                      try {
                        const updated = (await adminApi.updateCustomer(selected.customerId, {
                          firstName: profileForm.firstName,
                          familyName: profileForm.familyName,
                          email: profileForm.email,
                          phoneNumber: profileForm.phoneNumber || undefined,
                          address: profileForm.address || undefined,
                        })) as Customer;
                        setSelected(updated);
                        setResults((prev) =>
                          prev.map((c) => (c.customerId === updated.customerId ? updated : c))
                        );
                        setProfileEditing(false);
                      } catch (err: any) {
                        setError(err?.message ?? 'Unable to update profile.');
                      } finally {
                        setProfileSaving(false);
                      }
                    }}
                    className="btn-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {profileSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )
            }
          />
          <DashboardKycCard profileType="customer" profileId={selected.customerId} />
          <DashboardPaymentsCard
            title="Transaction history"
            collapsed={paymentsCollapsed}
            onToggle={() => setPaymentsCollapsed((v) => !v)}
            metrics={
              balanceValue !== undefined && availableBalanceValue !== undefined
                ? [
                    { label: 'Balance', value: balanceValue },
                    { label: 'Available Balance', value: availableBalanceValue },
                  ]
                : undefined
            }
            transactions={transactions}
            loading={txLoading}
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
            metrics={[
              { label: 'Pending Reservations', value: pendingReservationsTotal },
              ...(availableBalanceValue !== undefined
                ? [{ label: 'Available Balance', value: availableBalanceValue }]
                : []),
            ]}
            transactions={reservations}
            loading={reservationsLoading}
            emptyLabel="No reservations."
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

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Create customer</h3>
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setShowCreateModal(false)}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-600">
                  First name
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-600">
                  Family name
                  <input
                    required
                    value={form.familyName}
                    onChange={(e) => setForm((prev) => ({ ...prev, familyName: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </label>
              </div>
              <label className="text-sm font-semibold text-slate-600">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </label>
              <label className="text-sm font-semibold text-slate-600">
                Phone
                <input
                  value={form.phoneNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </label>
              <label className="text-sm font-semibold text-slate-600">
                Address
                <input
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </label>
              <button
                type="submit"
                className="btn-primary px-6 py-3 text-base font-semibold text-white"
              >
                Create customer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
