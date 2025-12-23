'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../lib/api/admin';
import { customerApi } from '../../lib/api/customer';
import { guardApi } from '../../lib/api/guard';
import { getSession } from '../../lib/auth/session';
import { resolveApiRoot } from '../../lib/api/config';

type KycStatus = 'not_started' | 'pending' | 'approved' | 'rejected';
type KycDocumentType = 'country-id' | 'passport' | 'proof-of-address';

type KycDocumentRecord = {
  bucket: string;
  key: string;
  contentType: string;
  fileName?: string;
  size?: number;
  uploadedAt: string;
};

type KycRecord = {
  status: KycStatus;
  documents: Partial<Record<KycDocumentType, KycDocumentRecord>>;
  updatedAt: string;
};

const DOCS: { type: KycDocumentType; label: string; hint: string }[] = [
  {
    type: 'country-id',
    label: 'Country ID',
    hint: 'National ID card or equivalent (PDF/JPG/PNG). Upload ID or Passport (one required).',
  },
  {
    type: 'passport',
    label: 'Passport',
    hint: 'Passport scan/photo (PDF/JPG/PNG). Upload ID or Passport (one required).',
  },
  {
    type: 'proof-of-address',
    label: 'Proof of address',
    hint: 'Utility bill/bank statement (PDF/JPG/PNG). Required.',
  },
];

const REQUIRED_TOTAL = 2; // Proof-of-address plus either ID or Passport

function computeMissing(docs: Partial<Record<KycDocumentType, KycDocumentRecord>>) {
  const hasId = Boolean(docs['country-id']?.key);
  const hasPassport = Boolean(docs['passport']?.key);
  const hasProof = Boolean(docs['proof-of-address']?.key);
  const missing: string[] = [];
  if (!hasProof) missing.push('Proof of address');
  if (!hasId && !hasPassport) missing.push('ID or Passport');
  return missing;
}

function statusBadge(status: KycStatus) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700';
    case 'rejected':
      return 'bg-rose-100 text-rose-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function statusLabel(status: KycStatus) {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'pending':
      return 'Pending review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
  }
}

async function openAuthenticatedDocument(path: string) {
  const session = getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  const apiRoot = resolveApiRoot();
  const resp = await fetch(`${apiRoot}${path}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    credentials: 'include',
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Request failed (${resp.status})`);
  }
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function KycCardShell({
  status,
  missingCount,
  totalCount,
  loading,
  error,
  onRefresh,
  children,
}: {
  status: KycStatus;
  missingCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="w-full max-w-4xl self-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">KYC</p>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(status)}`}>
            {statusLabel(status)}
          </span>
          {missingCount > 0 && (
            <span className="text-xs font-semibold text-slate-500">
              Missing: {missingCount}/{totalCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            title="Refresh"
            aria-label="Refresh"
            disabled={loading}
          >
            {loading ? '…' : '⟳'}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="text-sm font-semibold text-orange-600"
          >
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </header>

      {error && (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {!collapsed && <div className="mt-6">{children}</div>}
    </section>
  );
}

export function DashboardKycCard({
  profileType,
  profileId,
}: {
  profileType: 'customer' | 'civil-servant';
  profileId: string;
}) {
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Partial<Record<KycDocumentType, boolean>>>({});
  const [selectedFiles, setSelectedFiles] = useState<Partial<Record<KycDocumentType, File | null>>>(
    {}
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const record =
        profileType === 'customer'
          ? ((await adminApi.getCustomerKyc(profileId)) as KycRecord)
          : ((await adminApi.getCivilServantKyc(profileId)) as KycRecord);
      setKyc(record);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load KYC.');
      setKyc(null);
    } finally {
      setLoading(false);
    }
  }, [profileId, profileType]);

  useEffect(() => {
    if (!profileId) return;
    void load();
  }, [load, profileId]);

  const effectiveStatus = kyc?.status ?? 'not_started';

  const missingDocs = useMemo(() => computeMissing(kyc?.documents ?? {}), [kyc?.documents]);

  const upload = async (documentType: KycDocumentType) => {
    setError(null);
    const file = selectedFiles[documentType] ?? null;
    if (!file) {
      setError('Choose a file before uploading.');
      return;
    }
    if (!file.type) {
      setError('Unsupported file: missing content type.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Please keep uploads under 10MB.');
      return;
    }

    setBusy((prev) => ({ ...prev, [documentType]: true }));
    try {
      const presigned =
        profileType === 'customer'
          ? await adminApi.presignCustomerKycDocument(profileId, documentType, {
              contentType: file.type,
              fileName: file.name,
            })
          : await adminApi.presignCivilServantKycDocument(profileId, documentType, {
              contentType: file.type,
              fileName: file.name,
            });

      const uploadResp = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadResp.ok) {
        const message = await uploadResp.text();
        throw new Error(message || `Upload failed (${uploadResp.status})`);
      }

      if (profileType === 'customer') {
        await adminApi.confirmCustomerKycDocument(profileId, documentType, {
          bucket: presigned.bucket,
          key: presigned.key,
          contentType: file.type,
          fileName: file.name,
          size: file.size,
        });
      } else {
        await adminApi.confirmCivilServantKycDocument(profileId, documentType, {
          bucket: presigned.bucket,
          key: presigned.key,
          contentType: file.type,
          fileName: file.name,
          size: file.size,
        });
      }

      setSelectedFiles((prev) => ({ ...prev, [documentType]: null }));
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to upload document.');
    } finally {
      setBusy((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  const view = async (documentType: KycDocumentType) => {
    setError(null);
    try {
      if (profileType === 'customer') {
        await openAuthenticatedDocument(`/customers/${profileId}/kyc/documents/${documentType}`);
      } else {
        await openAuthenticatedDocument(
          `/civil-servants/${profileId}/kyc/documents/${documentType}`
        );
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unable to open document.');
    }
  };

  const remove = async (documentType: KycDocumentType) => {
    setError(null);
    setBusy((prev) => ({ ...prev, [documentType]: true }));
    try {
      if (profileType === 'customer') {
        await adminApi.deleteCustomerKycDocument(profileId, documentType);
      } else {
        await adminApi.deleteCivilServantKycDocument(profileId, documentType);
      }
      setSelectedFiles((prev) => ({ ...prev, [documentType]: null }));
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to delete document.');
    } finally {
      setBusy((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  return (
    <KycCardShell
      status={effectiveStatus}
      missingCount={missingDocs.length}
      totalCount={REQUIRED_TOTAL}
      loading={loading}
      error={error}
      onRefresh={() => void load()}
    >
      <div className="space-y-4">
        {DOCS.map((doc) => {
          const record = kyc?.documents?.[doc.type];
          const isBusy = Boolean(busy[doc.type]);
          const file = selectedFiles[doc.type] ?? null;
          return (
            <div key={doc.type} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{doc.label}</p>
                  <p className="text-xs text-slate-500">{doc.hint}</p>
                  {record?.uploadedAt ? (
                    <p className="text-xs text-slate-600">
                      Uploaded {new Date(record.uploadedAt).toLocaleString('en-ZA')}
                      {record.fileName ? ` · ${record.fileName}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600">Not uploaded yet.</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {record?.key && (
                    <button
                      type="button"
                      onClick={() => void view(doc.type)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </button>
                  )}

                  <div className="flex flex-col items-start">
                    <label className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={(e) => {
                          const selected = e.target.files?.[0] ?? null;
                          setSelectedFiles((prev) => ({ ...prev, [doc.type]: selected }));
                          e.target.value = '';
                        }}
                        disabled={isBusy}
                      />
                      {file ? 'Change file' : 'Choose file'}
                    </label>
                    {file?.name && (
                      <p
                        className="mt-2 max-w-[240px] truncate text-xs font-medium text-slate-500"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void upload(doc.type)}
                    className="btn-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    disabled={isBusy || !file}
                  >
                    {isBusy ? 'Uploading...' : 'Upload'}
                  </button>
                  {record?.key && (
                    <button
                      type="button"
                      onClick={() => void remove(doc.type)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      title="Delete document"
                      aria-label={`Delete ${doc.label}`}
                      disabled={isBusy}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!loading && !kyc && (
          <p className="text-sm text-slate-500">
            KYC information is unavailable for this profile right now.
          </p>
        )}
      </div>
    </KycCardShell>
  );
}

export function DashboardCustomerKycCard() {
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Partial<Record<KycDocumentType, boolean>>>({});
  const [selectedFiles, setSelectedFiles] = useState<Partial<Record<KycDocumentType, File | null>>>(
    {}
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const record = (await customerApi.getKyc()) as KycRecord;
      setKyc(record);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load KYC.');
      setKyc(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const effectiveStatus = kyc?.status ?? 'not_started';

  const missingDocs = useMemo(() => computeMissing(kyc?.documents ?? {}), [kyc?.documents]);

  const upload = async (documentType: KycDocumentType) => {
    setError(null);
    const file = selectedFiles[documentType] ?? null;
    if (!file) {
      setError('Choose a file before uploading.');
      return;
    }
    if (!file.type) {
      setError('Unsupported file: missing content type.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Please keep uploads under 10MB.');
      return;
    }

    setBusy((prev) => ({ ...prev, [documentType]: true }));
    try {
      const presigned = await customerApi.presignKycDocument(documentType, {
        contentType: file.type,
        fileName: file.name,
      });

      const uploadResp = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadResp.ok) {
        const message = await uploadResp.text();
        throw new Error(message || `Upload failed (${uploadResp.status})`);
      }

      await customerApi.confirmKycDocument(documentType, {
        bucket: presigned.bucket,
        key: presigned.key,
        contentType: file.type,
        fileName: file.name,
        size: file.size,
      });

      setSelectedFiles((prev) => ({ ...prev, [documentType]: null }));
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to upload document.');
    } finally {
      setBusy((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  const view = async (documentType: KycDocumentType) => {
    setError(null);
    try {
      await openAuthenticatedDocument(`/customers/me/kyc/documents/${documentType}`);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to open document.');
    }
  };

  const remove = async (documentType: KycDocumentType) => {
    setError(null);
    setBusy((prev) => ({ ...prev, [documentType]: true }));
    try {
      await customerApi.deleteKycDocument(documentType);
      setSelectedFiles((prev) => ({ ...prev, [documentType]: null }));
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to delete document.');
    } finally {
      setBusy((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  return (
    <KycCardShell
      status={effectiveStatus}
      missingCount={missingDocs.length}
      totalCount={REQUIRED_TOTAL}
      loading={loading}
      error={error}
      onRefresh={() => void load()}
    >
      <div className="space-y-4">
        {DOCS.map((doc) => {
          const record = kyc?.documents?.[doc.type];
          const isBusy = Boolean(busy[doc.type]);
          const file = selectedFiles[doc.type] ?? null;
          return (
            <div key={doc.type} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{doc.label}</p>
                  <p className="text-xs text-slate-500">{doc.hint}</p>
                  {record?.uploadedAt ? (
                    <p className="text-xs text-slate-600">
                      Uploaded {new Date(record.uploadedAt).toLocaleString('en-ZA')}
                      {record.fileName ? ` · ${record.fileName}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600">Not uploaded yet.</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {record?.key && (
                    <button
                      type="button"
                      onClick={() => void view(doc.type)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </button>
                  )}

                  <div className="flex flex-col items-start">
                    <label className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={(e) => {
                          const selected = e.target.files?.[0] ?? null;
                          setSelectedFiles((prev) => ({ ...prev, [doc.type]: selected }));
                          e.target.value = '';
                        }}
                        disabled={isBusy}
                      />
                      {file ? 'Change file' : 'Choose file'}
                    </label>
                    {file?.name && (
                      <p
                        className="mt-2 max-w-[240px] truncate text-xs font-medium text-slate-500"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void upload(doc.type)}
                    className="btn-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    disabled={isBusy || !file}
                  >
                    {isBusy ? 'Uploading...' : 'Upload'}
                  </button>
                  {record?.key && (
                    <button
                      type="button"
                      onClick={() => void remove(doc.type)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      title="Delete document"
                      aria-label={`Delete ${doc.label}`}
                      disabled={isBusy}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!loading && !kyc && (
          <p className="text-sm text-slate-500">
            KYC information is unavailable for your account right now.
          </p>
        )}
      </div>
    </KycCardShell>
  );
}

export function DashboardCivilServantKycCard() {
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Partial<Record<KycDocumentType, boolean>>>({});
  const [selectedFiles, setSelectedFiles] = useState<Partial<Record<KycDocumentType, File | null>>>(
    {}
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const record = (await guardApi.getKyc()) as KycRecord;
      setKyc(record);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load KYC.');
      setKyc(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const effectiveStatus = kyc?.status ?? 'not_started';

  const missingDocs = useMemo(() => computeMissing(kyc?.documents ?? {}), [kyc?.documents]);

  const upload = async (documentType: KycDocumentType) => {
    setError(null);
    const file = selectedFiles[documentType] ?? null;
    if (!file) {
      setError('Choose a file before uploading.');
      return;
    }
    if (!file.type) {
      setError('Unsupported file: missing content type.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Please keep uploads under 10MB.');
      return;
    }

    setBusy((prev) => ({ ...prev, [documentType]: true }));
    try {
      const presigned = await guardApi.presignKycDocument(documentType, {
        contentType: file.type,
        fileName: file.name,
      });

      const uploadResp = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadResp.ok) {
        const message = await uploadResp.text();
        throw new Error(message || `Upload failed (${uploadResp.status})`);
      }

      await guardApi.confirmKycDocument(documentType, {
        bucket: presigned.bucket,
        key: presigned.key,
        contentType: file.type,
        fileName: file.name,
        size: file.size,
      });

      setSelectedFiles((prev) => ({ ...prev, [documentType]: null }));
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to upload document.');
    } finally {
      setBusy((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  const view = async (documentType: KycDocumentType) => {
    setError(null);
    try {
      await openAuthenticatedDocument(`/civil-servants/me/kyc/documents/${documentType}`);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to open document.');
    }
  };

  const remove = async (documentType: KycDocumentType) => {
    setError(null);
    setBusy((prev) => ({ ...prev, [documentType]: true }));
    try {
      await guardApi.deleteKycDocument(documentType);
      setSelectedFiles((prev) => ({ ...prev, [documentType]: null }));
      await load();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to delete document.');
    } finally {
      setBusy((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  return (
    <KycCardShell
      status={effectiveStatus}
      missingCount={missingDocs.length}
      totalCount={REQUIRED_TOTAL}
      loading={loading}
      error={error}
      onRefresh={() => void load()}
    >
      <div className="space-y-4">
        {DOCS.map((doc) => {
          const record = kyc?.documents?.[doc.type];
          const isBusy = Boolean(busy[doc.type]);
          const file = selectedFiles[doc.type] ?? null;
          return (
            <div key={doc.type} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{doc.label}</p>
                  <p className="text-xs text-slate-500">{doc.hint}</p>
                  {record?.uploadedAt ? (
                    <p className="text-xs text-slate-600">
                      Uploaded {new Date(record.uploadedAt).toLocaleString('en-ZA')}
                      {record.fileName ? ` · ${record.fileName}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600">Not uploaded yet.</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {record?.key && (
                    <button
                      type="button"
                      onClick={() => void view(doc.type)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </button>
                  )}

                  <div className="flex flex-col items-start">
                    <label className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={(e) => {
                          const selected = e.target.files?.[0] ?? null;
                          setSelectedFiles((prev) => ({ ...prev, [doc.type]: selected }));
                          e.target.value = '';
                        }}
                        disabled={isBusy}
                      />
                      {file ? 'Change file' : 'Choose file'}
                    </label>
                    {file?.name && (
                      <p
                        className="mt-2 max-w-[240px] truncate text-xs font-medium text-slate-500"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void upload(doc.type)}
                    className="btn-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    disabled={isBusy || !file}
                  >
                    {isBusy ? 'Uploading...' : 'Upload'}
                  </button>
                  {record?.key && (
                    <button
                      type="button"
                      onClick={() => void remove(doc.type)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      title="Delete document"
                      aria-label={`Delete ${doc.label}`}
                      disabled={isBusy}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!loading && !kyc && (
          <p className="text-sm text-slate-500">
            KYC information is unavailable for your account right now.
          </p>
        )}
      </div>
    </KycCardShell>
  );
}
