'use client';

import { FormEvent, useState } from 'react';
import { checkEmailPublic, signup as signupAccount, SignupRequest } from '../../lib/api/signup';

export default function SignupPage() {
  const [form, setForm] = useState<SignupRequest>({
    firstName: '',
    familyName: '',
    email: '',
    phoneNumber: '',
    address: '',
    occupation: '',
    otherOccupation: '',
    password: '',
    role: 'CIVIL_SERVANT',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isCustomer = form.role === 'CUSTOMER';
  const occupationIsOther = (form.occupation ?? '').toLowerCase() === 'other';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (!form.password.trim()) {
        setError('Password is required.');
        return;
      }

      const emailValue = form.email?.trim() ?? '';
      const phoneValue = form.phoneNumber?.trim() ?? '';
      if (!emailValue && !phoneValue) {
        setError('Please provide at least an email or a phone number.');
        return;
      }

      const password = form.password.trim();
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordPattern.test(password)) {
        setError('Password must be at least 8 characters and include upper, lower, and a number.');
        return;
      }

      if (password !== confirmPassword.trim()) {
        setError('Passwords do not match.');
        return;
      }

      if (!isCustomer) {
        if (!form.occupation?.trim()) {
          setError('Occupation is required for civil servants.');
          return;
        }
        if (occupationIsOther && !form.otherOccupation?.trim()) {
          setError('Please enter your occupation.');
          return;
        }
      }

      if (emailValue) {
        const duplicate = await checkEmailPublic(emailValue);
        if (duplicate.exists) {
          setError(
            `This email is already registered${duplicate.type ? ` as a ${duplicate.type}` : ''}. Please use another address or reset credentials.`
          );
          return;
        }
      }

      const payload: SignupRequest = {
        ...form,
        phoneNumber: form.phoneNumber?.trim() || undefined,
        email: form.email?.trim() || undefined,
        address: form.address?.trim() || undefined,
        occupation: isCustomer ? undefined : form.occupation?.trim(),
        otherOccupation:
          isCustomer || !occupationIsOther ? undefined : form.otherOccupation?.trim(),
        password,
      };
      await signupAccount(payload);
      setMessage(
        'Signup received. Provisioning has started and you will be notified once credentials are ready.'
      );
      setShowSuccessModal(true);
      setForm({
        firstName: '',
        familyName: '',
        email: '',
        phoneNumber: '',
        address: '',
        occupation: '',
        otherOccupation: '',
        password: '',
        role: 'CIVIL_SERVANT',
      });
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message ?? 'Unable to complete signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-5xl rounded-[32px] bg-white/80 p-6 sm:p-10 shadow-2xl backdrop-blur-sm ring-1 ring-orange-100/80">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              {isCustomer ? 'Create a Customer Account' : 'Create a Civil Servant Account'}
            </h1>
            <p className="text-base text-slate-600 sm:text-lg">
              {isCustomer
                ? 'A customer account will allow you to easily pay civil servants and track the progress of those payments. Complete your details below.'
                : 'A civil servant account will allow you to be easily paid for your services. You will also be able to track payments to you and payouts. Complete your details below.'}
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex rounded-full border border-orange-200 bg-orange-50 px-1 py-1 shadow-sm shadow-orange-100">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isCustomer ? 'bg-white text-orange-600 shadow' : 'text-slate-700'
                }`}
                onClick={() => setForm((prev) => ({ ...prev, role: 'CUSTOMER' }))}
              >
                Customer
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  !isCustomer ? 'bg-white text-orange-600 shadow' : 'text-slate-700'
                }`}
                onClick={() => setForm((prev) => ({ ...prev, role: 'CIVIL_SERVANT' }))}
              >
                Civil servant
              </button>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-10 space-y-4 sm:space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-600">
              First name <span className="text-rose-600">*</span>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Family name <span className="text-rose-600">*</span>
              <input
                required
                value={form.familyName}
                onChange={(e) => setForm((prev) => ({ ...prev, familyName: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>
          </div>

          <div className="relative grid gap-4 md:grid-cols-2 md:items-center">
            <label className="text-sm font-semibold text-slate-600">
              Email <span className="text-rose-600">*</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="you@example.com"
              />
            </label>

            <label className="text-sm font-semibold text-slate-600">
              Mobile <span className="text-rose-600">*</span>
              <input
                value={form.phoneNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="+27..."
              />
            </label>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 shadow-sm">
                AND / OR
              </span>
            </div>
          </div>

          <label className="text-sm font-semibold text-slate-600">
            Home address <span className="text-rose-600">*</span>
            <input
              required
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </label>

          {!isCustomer && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-600">
                Occupation
                <select
                  required
                  value={form.occupation}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      occupation: e.target.value,
                      otherOccupation: e.target.value === 'Other' ? prev.otherOccupation : '',
                    }))
                  }
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">Select occupation</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Parking Attendant">Parking Attendant</option>
                  <option value="Golf Caddy">Golf Caddy</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              {occupationIsOther && (
                <label className="text-sm font-semibold text-slate-600">
                  Please specify
                  <input
                    required
                    value={form.otherOccupation}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, otherOccupation: e.target.value }))
                    }
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="Enter your occupation"
                  />
                </label>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-600">
              Password <span className="text-rose-600">*</span>
              <div className="relative mt-1">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="Minimum 8 chars, upper/lower/number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Confirm password <span className="text-rose-600">*</span>
              <div className="relative mt-1">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 shadow-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-white shadow-lg transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-green-700">{message}</p>
        )}
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</p>}
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">Signup received</h3>
            <p className="mt-2 text-sm text-slate-600">
              Provisioning has started and you will be notified once credentials are ready.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.href = '/login';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
