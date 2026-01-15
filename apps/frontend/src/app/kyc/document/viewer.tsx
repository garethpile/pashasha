'use client';

import { useCallback, useEffect, useState } from 'react';
import { SESSION_STORAGE_KEY, getSession, sessionEventName } from '../../../lib/auth/session';
import { resolveApiRoot } from '../../../lib/api/config';

const ALLOWED_PATH =
  /^\/(customers|civil-servants)\/(me|[a-zA-Z0-9-]+)\/kyc\/documents\/(country-id|passport|proof-of-address)$/;

const parseFileName = (disposition: string | null) => {
  if (!disposition) return null;
  const match = /filename="([^"]+)"/i.exec(disposition);
  return match?.[1] ?? null;
};

export default function KycDocumentViewer() {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [path, setPath] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = new URLSearchParams(window.location.search).get('path')?.trim() ?? '';
    if (!raw || !ALLOWED_PATH.test(raw)) {
      setPath(null);
      setError('Invalid document link.');
      setLoading(false);
      return;
    }
    setPath(raw);
  }, []);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
  }, [objectUrl]);

  useEffect(() => {
    const handleSessionInvalidated = () => {
      revokeObjectUrl();
      setError('Session ended. Please log in again to view this document.');
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_STORAGE_KEY && !event.newValue) {
        handleSessionInvalidated();
      }
    };

    window.addEventListener(sessionEventName, handleSessionInvalidated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(sessionEventName, handleSessionInvalidated);
      window.removeEventListener('storage', handleStorage);
    };
  }, [revokeObjectUrl]);

  useEffect(() => {
    const controller = new AbortController();
    const apiRoot = resolveApiRoot();

    const load = async () => {
      const session = getSession();
      if (!session) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }

      if (!path) return;

      setLoading(true);
      setError(null);
      revokeObjectUrl();

      const resp = await fetch(`${apiRoot}${path}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        credentials: 'include',
        signal: controller.signal,
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Request failed (${resp.status})`);
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);
      setContentType(resp.headers.get('content-type'));
      setFileName(parseFileName(resp.headers.get('content-disposition')));
      setLoading(false);
    };

    load().catch((err: unknown) => {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message ?? 'Unable to load document.');
      setLoading(false);
    });

    return () => {
      controller.abort();
      revokeObjectUrl();
    };
  }, [path, revokeObjectUrl]);

  useEffect(() => {
    if (fileName) {
      document.title = fileName;
    }
  }, [fileName]);

  const isImage = contentType?.startsWith('image/') ?? false;
  const isPdf = contentType === 'application/pdf';

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Secure document viewer
          </p>
          <h1 className="text-lg font-semibold text-slate-800">{fileName ?? 'KYC document'}</h1>
        </div>
      </header>
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-6">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading document…
          </div>
        )}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        )}
        {!loading && !error && objectUrl && (
          <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {isImage ? (
              <img
                src={objectUrl}
                alt={fileName ?? 'KYC document'}
                className="h-full w-full object-contain"
              />
            ) : (
              <embed
                src={objectUrl}
                type={contentType ?? 'application/octet-stream'}
                className="h-full w-full"
              />
            )}
            {!isImage && !isPdf && (
              <p className="p-4 text-sm text-slate-600">
                This file type cannot be previewed here. Download it from your browser if prompted.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
