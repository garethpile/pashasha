'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSession } from '../../lib/auth/session';
import { ChatAssistant } from '../../components/support/chat-assistant';
import { eclipseEnabled } from '../../lib/feature-flags';

const tabs = [
  { href: '/admin/civil-servants', label: 'Civil Servants' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/administrators', label: 'Administrators' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = getSession();
  const eclipseActive = eclipseEnabled();

  useEffect(() => {
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!session.groups.includes('Administrators')) {
      router.replace('/');
    }
  }, [router, session]);

  if (!session || !session.groups.includes('Administrators')) {
    return null;
  }

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-700">Administrators</p>
          <h1 className="text-3xl font-semibold text-slate-900">Operations Console</h1>
        </header>
        <nav className="mb-8 flex gap-2 overflow-x-auto rounded-full bg-white/90 p-1 shadow-sm">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  active ? 'bg-orange-500 text-white' : 'text-slate-700'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        {!eclipseActive && (
          <section className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
            Voucher mode is active. Eclipse wallet balances, transaction history, and payouts are
            hidden during the pilot.
          </section>
        )}
        <section className="rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl">
          {children}
        </section>
      </main>
      <ChatAssistant />
    </>
  );
}
