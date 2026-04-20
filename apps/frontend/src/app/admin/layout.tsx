'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isAdminGroup } from '../../lib/auth/groups';
import { getSession } from '../../lib/auth/session';
import { ChatAssistant } from '../../components/support/chat-assistant';
import { eclipseEnabled } from '../../lib/feature-flags';

const tabs = [
  { href: '/admin/civil-servants', label: 'Civil Servants' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/vouchers', label: 'Vouchers' },
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
    if (!isAdminGroup(session.groups)) {
      router.replace('/');
    }
  }, [router, session]);

  if (!session || !isAdminGroup(session.groups)) {
    return null;
  }

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-700">Administrators</p>
          <h1 className="text-3xl font-semibold text-slate-900">Operations Console</h1>
        </header>
        <nav className="mb-8 overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-3xl bg-white/90 p-1 shadow-sm sm:min-w-0 sm:flex-wrap">
            {tabs.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                    active ? 'bg-orange-500 text-white' : 'text-slate-700'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <section className="rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl">
          {children}
        </section>
      </main>
      <ChatAssistant />
    </>
  );
}
