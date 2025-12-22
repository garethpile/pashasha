'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminApi } from '../../../lib/api/admin';

type AdministratorProfile = {
  username: string;
  firstName: string;
  familyName: string;
  emailLower?: string;
  phoneNumber?: string;
  createdAt?: string;
};

export default function AdministratorManagementPage() {
  const [form, setForm] = useState({
    firstName: '',
    familyName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [admins, setAdmins] = useState<AdministratorProfile[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadAdmins = async () => {
    try {
      const data = await adminApi.listAdministrators();
      setAdmins((data as AdministratorProfile[]) ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load administrators.');
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await adminApi.createAdministrator({
        ...form,
        phoneNumber: form.phoneNumber || undefined,
        password: form.password || undefined,
      });
      setMessage(`Administrator created. Temporary password: ${response.temporaryPassword}`);
      setForm({ firstName: '', familyName: '', email: '', phoneNumber: '', password: '' });
      await loadAdmins();
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to create administrator.');
    }
  };

  const handleDelete = async (username: string) => {
    if (!confirm('Delete this administrator?')) return;
    try {
      await adminApi.deleteAdministrator(username);
      setAdmins((prev) => prev.filter((user) => user.username !== username));
      setMessage('Administrator deleted.');
    } catch (err: any) {
      setError(err?.message ?? 'Unable to delete administrator.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        >
          <span className="text-lg leading-none">＋</span> Add administrator
        </button>
      </div>

      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {message && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Administrators</h3>
          <span className="text-sm text-slate-500">{admins.length} total</span>
        </div>
        <ul>
          {admins.map((admin) => (
            <li
              key={admin.username}
              className="flex items-center justify-between border-b border-slate-100 px-6 py-4 last:border-b-0"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {admin.firstName} {admin.familyName}
                </p>
                <p className="text-sm text-slate-500">{admin.username}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(admin.username)}
                className="btn-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Delete
              </button>
            </li>
          ))}
          {admins.length === 0 && (
            <li className="px-6 py-8 text-center text-sm text-slate-500">No administrators yet.</li>
          )}
        </ul>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Create administrator</h3>
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setShowCreateModal(false)}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-600">
                  First name
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-600">
                  Family name
                  <input
                    required
                    value={form.familyName}
                    onChange={(e) => setForm((prev) => ({ ...prev, familyName: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </label>
              </div>
              <label className="text-sm font-semibold text-slate-600">
                Email / username
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </label>
              <label className="text-sm font-semibold text-slate-600">
                Password (optional)
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="Leave blank to auto-generate"
                />
              </label>
              <label className="text-sm font-semibold text-slate-600">
                Phone
                <input
                  value={form.phoneNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </label>
              <button
                type="submit"
                className="btn-primary px-6 py-3 text-base font-semibold text-white"
              >
                Create administrator
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
