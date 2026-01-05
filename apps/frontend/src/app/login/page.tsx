'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';
import { persistSession } from '../../lib/auth/session';

type Stage = 'login' | 'forceChange' | 'forgotRequest' | 'forgotConfirm';

export default function LoginPage() {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '';
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';

  // Memoize pool creation to avoid repeated instantiation.
  const pool = useMemo(() => {
    if (!userPoolId || !clientId) return null;
    return new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId });
  }, [userPoolId, clientId]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState<Stage>('login');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [challengeUser, setChallengeUser] = useState<CognitoUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotUser, setForgotUser] = useState<CognitoUser | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const router = useRouter();

  // If config is missing at build or runtime, render a graceful message to avoid build failure.
  if (!pool) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Configuration missing</h1>
          <p className="text-sm text-slate-600">
            Cognito settings are not available. Please set NEXT_PUBLIC_COGNITO_USER_POOL_ID and
            NEXT_PUBLIC_COGNITO_CLIENT_ID.
          </p>
        </header>
      </main>
    );
  }

  const handleAuthSuccess = (result: any) => {
    const idToken = result.getIdToken().getJwtToken();
    const accessToken = result.getAccessToken().getJwtToken();
    const refreshToken = result.getRefreshToken()?.getToken();
    const groups = (result.getIdToken().payload['cognito:groups'] as string[] | undefined) ?? [];

    persistSession({
      accessToken,
      idToken,
      refreshToken: refreshToken ?? null,
      groups,
    });

    setPending(false);
    setStage('login');
    const target = groups.includes('Administrators') ? '/admin' : '/';
    router.push(target);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setPending(true);

    try {
      const user = new CognitoUser({ Username: username, Pool: pool });
      const authDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });
      user.authenticateUser(authDetails, {
        onSuccess: (result) => {
          handleAuthSuccess(result);
        },
        newPasswordRequired: () => {
          setChallengeUser(user);
          setStage('forceChange');
          setPending(false);
          setFeedback('Please set a new password before continuing.');
        },
        onFailure: (err) => {
          setPending(false);
          setFeedback(err.message ?? 'Login failed');
        },
      });
    } catch (err: any) {
      setPending(false);
      setFeedback(err?.message ?? 'Login failed');
    }
  };

  const handleCompleteNewPassword = (event: FormEvent) => {
    event.preventDefault();
    if (!challengeUser) return;
    if (newPassword !== confirmPassword) {
      setFeedback('Passwords do not match.');
      return;
    }
    setPending(true);
    challengeUser.completeNewPasswordChallenge(
      newPassword,
      {},
      {
        onSuccess: (result) => {
          setNewPassword('');
          setConfirmPassword('');
          handleAuthSuccess(result);
        },
        onFailure: (err) => {
          setPending(false);
          setFeedback(err.message ?? 'Unable to update password.');
        },
      }
    );
  };

  const handleForgotRequest = (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    if (!username) {
      setFeedback('Enter the username or email first.');
      return;
    }
    try {
      const user = new CognitoUser({ Username: username, Pool: pool });
      setPending(true);
      user.forgotPassword({
        onSuccess: () => {
          setPending(false);
          setForgotUser(user);
          setStage('forgotConfirm');
          setFeedback('Verification code sent. Check your email or SMS.');
        },
        onFailure: (err) => {
          setPending(false);
          setFeedback(err.message ?? 'Unable to start reset.');
        },
        inputVerificationCode: () => {
          setPending(false);
          setForgotUser(user);
          setStage('forgotConfirm');
          setFeedback('Verification code sent. Check your email or SMS.');
        },
      });
    } catch (err: any) {
      setFeedback(err?.message ?? 'Unable to start reset.');
    }
  };

  const handleForgotConfirm = (event: FormEvent) => {
    event.preventDefault();
    if (!forgotUser) {
      setFeedback('Start the reset flow first.');
      return;
    }
    setPending(true);
    forgotUser.confirmPassword(resetCode, resetPassword, {
      onSuccess: () => {
        setPending(false);
        setStage('login');
        setFeedback('Password updated. Please sign in.');
        setResetCode('');
        setResetPassword('');
      },
      onFailure: (err) => {
        setPending(false);
        setFeedback(err.message ?? 'Unable to reset password.');
      },
    });
  };

  const renderLoginForm = () => (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <label className="text-sm font-semibold text-slate-600">
        Username or email
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-inner focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          placeholder="you@example.com"
        />
      </label>
      <label className="text-sm font-semibold text-slate-600">
        Password
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base shadow-inner focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
      </label>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setStage('forgotRequest');
            setFeedback(null);
          }}
          className="font-semibold text-orange-600 hover:underline"
        >
          Forgot password?
        </button>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full px-6 py-3 text-base font-semibold disabled:cursor-wait"
      >
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );

  const renderForceChangeForm = () => (
    <form
      onSubmit={handleCompleteNewPassword}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <p className="text-sm text-slate-600">
        Enter a new password to complete your first-time sign-in.
      </p>
      <label className="text-sm font-semibold text-slate-600">
        New password
        <input
          required
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </label>
      <label className="text-sm font-semibold text-slate-600">
        Confirm password
        <input
          required
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full px-6 py-3 text-base font-semibold"
      >
        {pending ? 'Updating...' : 'Set password'}
      </button>
    </form>
  );

  const renderForgotRequest = () => (
    <form
      onSubmit={handleForgotRequest}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <p className="text-sm text-slate-600">
        Enter your username or email and we&apos;ll send you a verification code to reset your
        password.
      </p>
      <label className="text-sm font-semibold text-slate-600">
        Username or email
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setStage('login');
            setFeedback(null);
          }}
          className="w-1/3 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-2/3 px-6 py-3 text-base font-semibold"
        >
          {pending ? 'Sending...' : 'Send reset code'}
        </button>
      </div>
    </form>
  );

  const renderForgotConfirm = () => (
    <form
      onSubmit={handleForgotConfirm}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <p className="text-sm text-slate-600">
        Enter the verification code you received along with your new password.
      </p>
      <label className="text-sm font-semibold text-slate-600">
        Verification code
        <input
          required
          value={resetCode}
          onChange={(e) => setResetCode(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </label>
      <label className="text-sm font-semibold text-slate-600">
        New password
        <input
          required
          type="password"
          value={resetPassword}
          onChange={(e) => setResetPassword(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
        />
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setStage('login');
            setFeedback(null);
          }}
          className="w-1/3 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-2/3 px-6 py-3 text-base font-semibold"
        >
          {pending ? 'Updating...' : 'Reset password'}
        </button>
      </div>
    </form>
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-600">Sign in with your email or username.</p>
      </header>
      {stage === 'login' && renderLoginForm()}
      {stage === 'forceChange' && renderForceChangeForm()}
      {stage === 'forgotRequest' && renderForgotRequest()}
      {stage === 'forgotConfirm' && renderForgotConfirm()}
      {feedback && (
        <p className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
          {feedback}
        </p>
      )}
    </main>
  );
}
