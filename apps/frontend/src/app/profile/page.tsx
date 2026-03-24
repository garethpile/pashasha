'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../lib/auth/session';
import { isAdminGroup, isCivilServantGroup, isCustomerGroup } from '../../lib/auth/groups';

const resolveProfileDestination = () => {
  const session = getSession();
  if (!session) return '/login';
  if (isAdminGroup(session.groups)) return '/admin/civil-servants';
  if (isCivilServantGroup(session.groups)) return '/';
  if (isCustomerGroup(session.groups)) return '/';
  return '/';
};

export default function ProfilePage() {
  const router = useRouter();
  const destination = resolveProfileDestination();

  useEffect(() => {
    router.replace(destination);
  }, [destination, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-4 px-4 pb-16 pt-20 sm:px-6 lg:px-8">
      <p className="text-sm text-slate-600">Redirecting to your profile…</p>
      <Link
        href={destination}
        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
      >
        Continue
      </Link>
    </main>
  );
}
