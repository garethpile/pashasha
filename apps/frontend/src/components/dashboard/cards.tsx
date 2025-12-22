'use client';

import { ReactNode } from 'react';

export type DashboardTransaction = {
  id: string;
  amount: number;
  status: string;
  createdAt?: string;
  expiresAt?: string;
  paymentType?: string;
  externalId?: string;
  balance?: number;
  availableBalance?: number;
  description?: string;
  reference?: string;
};

export type DashboardProfileField = {
  label: string;
  id?: string;
  value?: string | number | null;
  mono?: boolean;
  span?: 1 | 2;
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export function DashboardNameCard({
  name,
  status,
  accountNumber,
  extra,
}: {
  name: string;
  status?: string | null;
  accountNumber?: string | null;
  extra?: ReactNode;
}) {
  const statusIsInactive = (status ?? '').toLowerCase() === 'inactive';
  return (
    <div className="w-full max-w-4xl self-center rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">{name}</p>
          {accountNumber && (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {accountNumber}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status && (
            <span
              className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                statusIsInactive ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              Status: {status}
            </span>
          )}
          {extra}
        </div>
      </div>
    </div>
  );
}

export function DashboardProfileCard({
  title = 'Profile',
  collapsed,
  onToggle,
  fields,
  children,
  actions,
  editing,
  onFieldChange,
  footer,
}: {
  title?: string;
  collapsed: boolean;
  onToggle: () => void;
  fields: DashboardProfileField[];
  children?: ReactNode;
  actions?: ReactNode;
  editing?: boolean;
  onFieldChange?: (fieldId: string, value: string) => void;
  footer?: ReactNode;
}) {
  const isEditing = editing ?? false;
  return (
    <section className="w-full max-w-4xl self-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{title}</p>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={onToggle}
            className="text-sm font-semibold text-orange-600"
          >
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field, index) => (
              <div
                key={`${field.id ?? field.label}-${index}`}
                className={`flex flex-col ${field.span === 2 ? 'md:col-span-2' : ''}`}
              >
                <span className="text-xs font-semibold text-slate-600">{field.label}</span>
                <input
                  value={
                    field.value === null || field.value === undefined || field.value === ''
                      ? '—'
                      : String(field.value)
                  }
                  disabled={!isEditing}
                  onChange={
                    isEditing && onFieldChange && (field.id ?? field.label)
                      ? (e) => onFieldChange(field.id ?? field.label, e.target.value)
                      : undefined
                  }
                  className={`mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${
                    isEditing ? 'bg-white' : 'bg-slate-50'
                  } ${field.mono ? 'font-mono' : ''}`}
                />
              </div>
            ))}
          </div>
          {footer}
          {children}
        </div>
      )}
    </section>
  );
}

export function DashboardPaymentsCard({
  title = 'Payments',
  collapsed,
  onToggle,
  balance,
  availableBalance,
  metrics,
  actions,
  rightActions,
  transactions,
  loading,
  emptyLabel = 'No transactions yet.',
  pagination,
  showBalanceColumn = true,
  showExpiresColumn = false,
  showAvailableBalanceColumn = false,
}: {
  title?: ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  balance?: number;
  availableBalance?: number;
  metrics?: { label: string; value: number }[];
  actions?: ReactNode;
  rightActions?: ReactNode;
  transactions: DashboardTransaction[];
  loading?: boolean;
  emptyLabel?: string;
  pagination?: {
    onPrev?: () => void;
    onNext?: () => void;
    hasPrev: boolean;
    hasNext: boolean;
    disabled?: boolean;
  };
  showBalanceColumn?: boolean;
  showExpiresColumn?: boolean;
  showAvailableBalanceColumn?: boolean;
}) {
  const resolvedMetrics =
    metrics && metrics.length > 0
      ? metrics
      : [
          ...(balance !== undefined ? [{ label: 'Balance', value: balance }] : []),
          ...(availableBalance !== undefined
            ? [{ label: 'Available Balance', value: availableBalance }]
            : []),
        ];

  const totalColumns =
    7 +
    (showBalanceColumn ? 1 : 0) +
    (showAvailableBalanceColumn ? 1 : 0) +
    (showExpiresColumn ? 1 : 0);

  return (
    <section className="w-full max-w-4xl self-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="grid items-center gap-3 border-b border-slate-100 pb-3 sm:grid-cols-[1fr_auto_1fr]">
        <p className="whitespace-pre-line text-xs uppercase tracking-[0.35em] text-slate-400">
          {title}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {resolvedMetrics.map((metric) => (
            <div key={metric.label} className="flex flex-col items-center text-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {metric.label}
              </span>
              <span className="text-lg font-semibold text-slate-900">
                {formatCurrency(metric.value)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {actions}
          {rightActions}
          <button
            type="button"
            onClick={onToggle}
            className="text-sm font-semibold text-orange-600"
          >
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  {showBalanceColumn && <th className="px-4 py-3">Balance</th>}
                  {showAvailableBalanceColumn && <th className="px-4 py-3">Available</th>}
                  <th className="px-4 py-3">Id</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Reference</th>
                  {showExpiresColumn && <th className="px-4 py-3">Expires</th>}
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading && (
                  <tr>
                    <td colSpan={totalColumns} className="px-4 py-4 text-sm text-slate-500">
                      Loading transactions...
                    </td>
                  </tr>
                )}
                {!loading && transactions.length === 0 && (
                  <tr>
                    <td colSpan={totalColumns} className="px-4 py-4 text-sm text-slate-500">
                      {emptyLabel}
                    </td>
                  </tr>
                )}
                {!loading &&
                  transactions.map((payment) => {
                    const statusUpper = (payment.status ?? '').toUpperCase();
                    const statusClass =
                      statusUpper === 'SUCCESSFUL'
                        ? 'bg-emerald-100 text-emerald-700'
                        : statusUpper.includes('PEND')
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-sky-100 text-sky-700';
                    return (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 text-slate-600">
                          {payment.createdAt
                            ? new Date(payment.createdAt).toLocaleString('en-ZA', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        {showBalanceColumn && (
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {payment.balance !== undefined ? formatCurrency(payment.balance) : '—'}
                          </td>
                        )}
                        {showAvailableBalanceColumn && (
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {payment.availableBalance !== undefined
                              ? formatCurrency(payment.availableBalance)
                              : '—'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-slate-800">
                          <p className="font-semibold">{payment.id}</p>
                          <p className="text-xs text-slate-500">
                            {payment.externalId ?? payment.reference ?? ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-800">{payment.paymentType ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{payment.description ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {payment.reference ?? payment.externalId ?? '—'}
                        </td>
                        {showExpiresColumn && (
                          <td className="px-4 py-3 text-slate-600">
                            {payment.expiresAt
                              ? new Date(payment.expiresAt).toLocaleString('en-ZA', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                          >
                            {payment.status ?? 'unknown'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {pagination && (
              <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-600">
                <button
                  type="button"
                  onClick={pagination.onPrev}
                  className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50"
                  disabled={!pagination.hasPrev || pagination.disabled}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={pagination.onNext}
                  className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50"
                  disabled={!pagination.hasNext || pagination.disabled}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
