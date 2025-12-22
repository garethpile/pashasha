'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AuthSession,
  SESSION_STORAGE_KEY,
  clearSession,
  getSession,
  sessionEventName,
} from '../lib/auth/session';

export const Header = () => {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const normalizedGroups = (session?.groups ?? []).map((g) =>
    g.toLowerCase().replace(/[\s_-]/g, '')
  );
  const hasGroup = (...targets: string[]) =>
    normalizedGroups.some((g) => targets.some((t) => g === t.toLowerCase().replace(/[\s_-]/g, '')));
  const isCivilServant = hasGroup('civilservants', 'civilservant');
  const isCustomer = hasGroup('customers', 'customer');
  const dashboardLabel = session
    ? isCivilServant
      ? 'Civil Servant Dashboard'
      : isCustomer
        ? 'Customer Dashboard'
        : null
    : null;

  useEffect(() => {
    setSession(getSession());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_STORAGE_KEY || event.key === null) {
        setSession(getSession());
      }
    };
    const handleSessionEvent = () => setSession(getSession());
    window.addEventListener('storage', handleStorage);
    window.addEventListener(sessionEventName, handleSessionEvent);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(sessionEventName, handleSessionEvent);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setProfileMenuOpen(false);
    router.push('/login');
  };

  const userMenu = session ? (
    <div className="relative" ref={profileMenuRef}>
      <button
        type="button"
        onClick={() => setProfileMenuOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white/70 text-sm font-semibold text-slate-800 hover:bg-white"
        aria-label="User menu"
      >
        <span className="text-base">👤</span>
      </button>
      {profileMenuOpen && (
        <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-white/15 bg-slate-900/95 text-white shadow-xl backdrop-blur">
          <button
            type="button"
            className="block w-full rounded-t-2xl px-4 py-3 text-left text-sm font-semibold hover:bg-white/10"
            onClick={() => {
              setProfileMenuOpen(false);
              router.push('/profile');
            }}
          >
            My Profile
          </button>
          <button
            type="button"
            className="block w-full px-4 py-3 text-left text-sm font-semibold hover:bg-white/10"
            onClick={() => {
              setProfileMenuOpen(false);
              router.push('/support');
            }}
          >
            Support
          </button>
          <button
            type="button"
            className="block w-full rounded-b-2xl px-4 py-3 text-left text-sm text-rose-200 hover:bg-white/10"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <nav className="hidden items-center gap-3 sm:flex">
        <Link
          href="/login"
          className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-full border border-orange-300 bg-orange-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
        >
          Register
        </Link>
      </nav>
      <div className="relative sm:hidden" ref={mobileMenuRef}>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-white"
          aria-label="Open menu"
        >
          Menu
          <span aria-hidden>▾</span>
        </button>
        {mobileMenuOpen && (
          <div className="absolute right-0 mt-3 w-44 rounded-2xl border border-white/20 bg-slate-900/95 text-white shadow-lg backdrop-blur">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-t-2xl px-4 py-3 text-left text-sm font-semibold hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-b-2xl px-4 py-3 text-left text-sm font-semibold text-orange-100 hover:bg-white/10"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-white/15 bg-gradient-to-r from-[#fffaf5] via-[#fff7ef] to-orange-500 text-slate-900 shadow-md backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-4 sm:gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-transparent bg-white/30 p-2 shadow-sm ring-1 ring-white/40">
            <Image
              src="/pashasha-pay-logo.png"
              alt="Pashasha Pay"
              width={56}
              height={56}
              className="h-12 w-12 object-contain"
              priority
            />
          </div>
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-[0.3em] text-white/80">Pashasha Pay</p>
            <p className="text-lg font-semibold tracking-tight">Tip with confidence</p>
            {dashboardLabel && (
              <p className="text-sm font-semibold text-slate-800/90">{dashboardLabel}</p>
            )}
          </div>
        </Link>

        {userMenu}
      </div>
    </header>
  );
};
