import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2 } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'magiclink';

export const AuthPage: React.FC = () => {
  const { signIn, signUp, resetPassword, enterDemoMode, isConfigured } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        const data = await signUp(email.trim(), password, displayName.trim());
        if (data?.session) {
          return;
        }
        setSuccessMsg(
          'Account created! Please check your email to confirm your account (or disable "Confirm email" in Supabase to allow instant login).'
        );
      } else if (mode === 'forgot') {
        await resetPassword(email.trim());
        setSuccessMsg('Password reset instructions sent to your email.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = err?.message || 'Authentication failed. Please check your credentials.';
      if (message.toLowerCase().includes('email not confirmed')) {
        message =
          'Email not confirmed yet. Supabase requires email confirmation before login. Please check your inbox/spam, or turn off "Confirm email" in Supabase Authentication -> Providers -> Email to log in immediately without confirmation.';
      } else if (message.toLowerCase().includes('rate limit')) {
        message =
          'Supabase email sending limit exceeded (3/hr on free tier). Please disable "Confirm email" in Supabase Dashboard -> Authentication -> Providers -> Email to allow instant logins without emails.';
      }
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-elevated mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            My Day
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            {mode === 'signin' && 'Welcome back. Sign in to your planner.'}
            {mode === 'signup' && 'Create your private daily productivity space.'}
            {mode === 'forgot' && 'Reset your account password.'}
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-modal">
          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                placeholder="Alex Morgan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            {mode !== 'forgot' && (
              <div className="flex flex-col gap-1">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-right text-brand-600 dark:text-brand-400 hover:underline mt-1"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-secondary)]">
            {mode === 'signin' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Divider & One-Tap Guest Access */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-[var(--bg-surface)] px-2 text-[var(--text-muted)] font-semibold">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={enterDemoMode}
            className="w-full text-xs font-semibold"
          >
            Continue as Guest (Instant Local Mode)
          </Button>
        </div>

        {/* Bottom info */}
        <div className="text-center text-[11px] text-[var(--text-muted)]">
          Private & offline-first. Your planner data stays on your device.
        </div>
      </div>
    </div>
  );
};
