import Image from 'next/image';

export type CivilServantProfileData = {
  firstName: string;
  familyName: string;
  occupation?: string;
  primarySite?: string;
  email?: string;
  phoneNumber?: string;
  homeAddress?: string;
  accountNumber?: string | null;
  walletId?: string | null;
  guardToken?: string | null;
  eclipseCustomerId?: string | null;
  eclipseWalletId?: string | null;
  qrUrl?: string | null;
};

export function CivilServantProfileCard({
  title = 'Profile',
  data,
  collapsed,
  onToggle,
  editing,
  onEditToggle,
  onFieldChange,
  onCancel,
  onSave,
  saving,
  feedback,
  showWorkFields = true,
  showPrimarySite = true,
  occupationOptions,
  showEclipseAccount = false,
  onViewQr,
  onGenerateQr,
  qrLoading,
  canViewQr,
  onRefresh,
  refreshing,
}: {
  title?: string;
  data: CivilServantProfileData;
  collapsed: boolean;
  onToggle: () => void;
  editing: boolean;
  onEditToggle: () => void;
  onFieldChange: (field: keyof CivilServantProfileData | string, value: string) => void;
  onCancel?: () => void;
  onSave?: () => void;
  saving?: boolean;
  feedback?: string | null;
  showWorkFields?: boolean;
  showPrimarySite?: boolean;
  occupationOptions?: { value: string; label: string }[];
  showEclipseAccount?: boolean;
  onViewQr?: () => void;
  onGenerateQr?: () => void;
  qrLoading?: boolean;
  canViewQr?: boolean;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
}) {
  const qrPresent = Boolean(data.qrUrl);
  const canView = onViewQr && (qrPresent || canViewQr);
  const occupationChoices =
    occupationOptions ??
    ([
      { value: '', label: 'Select occupation' },
      { value: 'Security Guard', label: 'Security Guard' },
      { value: 'Parking Attendant', label: 'Parking Attendant' },
      { value: 'Golf Caddy', label: 'Golf Caddy' },
      { value: 'Unemployed', label: 'Unemployed' },
      { value: 'Other', label: 'Other' },
    ] as const);

  return (
    <section className="w-full max-w-4xl self-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              aria-label="Refresh profile"
              title="Refresh profile"
            >
              {refreshing ? '⟳' : '⟲'}
            </button>
          )}
          <button
            type="button"
            onClick={onEditToggle}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            aria-label="Edit profile"
            title="Edit profile"
          >
            ✎
          </button>
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
            <label className="text-xs font-semibold text-slate-600">
              First Name
              <input
                value={data.firstName}
                onChange={(e) => onFieldChange('firstName', e.target.value)}
                disabled={!editing}
                className={`mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${
                  editing ? 'bg-white' : 'bg-slate-50'
                }`}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Last Name
              <input
                value={data.familyName}
                onChange={(e) => onFieldChange('familyName', e.target.value)}
                disabled={!editing}
                className={`mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${
                  editing ? 'bg-white' : 'bg-slate-50'
                }`}
              />
            </label>
          </div>

          {(showWorkFields || showPrimarySite) && (
            <div className="grid gap-4 md:grid-cols-2">
              {showWorkFields && (
                <label className="text-xs font-semibold text-slate-600">
                  Occupation
                  <select
                    value={data.occupation ?? ''}
                    onChange={(e) => onFieldChange('occupation', e.target.value)}
                    disabled={!editing}
                    className={`mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${
                      editing ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    {occupationChoices.map((option) => (
                      <option key={option.value || option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {showPrimarySite && (
                <label className="text-xs font-semibold text-slate-600">
                  Primary Site
                  <input
                    value={data.primarySite ?? ''}
                    onChange={(e) => onFieldChange('primarySite', e.target.value)}
                    disabled={!editing}
                    className={`mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${
                      editing ? 'bg-white' : 'bg-slate-50'
                    }`}
                  />
                </label>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Email
              <input
                type="email"
                value={data.email ?? ''}
                onChange={(e) => onFieldChange('email', e.target.value)}
                disabled={!editing}
                className={`mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${
                  editing ? 'bg-white' : 'bg-slate-50'
                }`}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Phone
              <input
                value={data.phoneNumber ?? ''}
                onChange={(e) => onFieldChange('phoneNumber', e.target.value)}
                disabled={!editing}
                className={`mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${
                  editing ? 'bg-white' : 'bg-slate-50'
                }`}
              />
            </label>
          </div>

          <label className="text-xs font-semibold text-slate-600">
            Home Address
            <input
              value={data.homeAddress ?? ''}
              onChange={(e) => onFieldChange('homeAddress', e.target.value)}
              disabled={!editing}
              className={`mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 ${
                editing ? 'bg-white' : 'bg-slate-50'
              }`}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">
              Pashasha Account
              <input
                value={data.accountNumber ?? 'Not issued'}
                disabled
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Pashasha Wallet ID
              <input
                value={data.walletId ?? 'Not linked'}
                disabled
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Pashasha Token
              <input
                value={data.guardToken ?? 'Not issued'}
                disabled
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700"
              />
            </label>
          </div>

          {(editing || onSave || onCancel || feedback) && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {feedback && (
                <p
                  className={`text-sm ${feedback.includes('updated') ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {feedback}
                </p>
              )}
              {editing && (
                <div className="flex items-center gap-2">
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                  {onSave && (
                    <button
                      type="button"
                      onClick={onSave}
                      disabled={saving}
                      className="btn-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save profile'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">QR code</p>
            {qrPresent ? (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <button
                  type="button"
                  onClick={() => onViewQr && onViewQr()}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-sky-300"
                >
                  <Image
                    src={data.qrUrl as string}
                    alt="QR code"
                    className="h-32 w-32 rounded-xl border border-slate-100 object-contain"
                    width={128}
                    height={128}
                  />
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  {onViewQr && (
                    <button
                      type="button"
                      className="btn-primary px-4 py-2 text-sm font-semibold text-white"
                      onClick={() => onViewQr()}
                      disabled={!canView || Boolean(qrLoading)}
                    >
                      {qrLoading ? 'Loading...' : 'View QR image'}
                    </button>
                  )}
                  {onGenerateQr && (
                    <button
                      type="button"
                      className="btn-primary px-4 py-2 text-sm font-semibold text-white"
                      onClick={() => onGenerateQr()}
                    >
                      Generate QR code
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">QR code not generated yet.</p>
                <div className="flex flex-wrap gap-2">
                  {onGenerateQr && (
                    <button
                      type="button"
                      className="btn-primary px-4 py-2 text-sm font-semibold text-white"
                      onClick={() => onGenerateQr()}
                    >
                      Generate QR code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {showEclipseAccount && data.eclipseCustomerId && (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
                Eclipse account
              </p>
              <p className="text-sm font-semibold text-slate-800 md:text-base">
                {data.eclipseCustomerId}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
