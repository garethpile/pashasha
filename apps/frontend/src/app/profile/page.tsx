export default function ProfilePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 pb-16 pt-20 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">My profile</p>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-600">
          Your profile page isn&apos;t available yet. Please use the admin dashboard to manage
          accounts or return to the home page.
        </p>
      </div>
      <div className="flex gap-3">
        <a
          href="/"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
        >
          Go home
        </a>
        <a
          href="/admin/civil-servants"
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700"
        >
          Go to admin
        </a>
      </div>
    </main>
  );
}
