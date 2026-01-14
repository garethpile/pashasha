import { Suspense } from 'react';
import KycDocumentViewer from './viewer';

export default function KycDocumentPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
          <header className="border-b border-slate-200 bg-white px-6 py-4">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Secure document viewer
              </p>
              <h1 className="text-lg font-semibold text-slate-800">KYC document</h1>
            </div>
          </header>
          <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Loading document…
            </div>
          </section>
        </main>
      }
    >
      <KycDocumentViewer />
    </Suspense>
  );
}
