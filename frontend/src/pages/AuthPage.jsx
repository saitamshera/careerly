import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Lock, Mail, User, KeyRound, CheckCircle2, RotateCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { forgotPassword, verifyResetOtp, resetPassword } from '../services/auth.api';

export function AuthPage({ title, mode = 'login', onSubmit, onGoogleAuth, loading = false }) {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot Password Wizard States: 1 (Email) -> 2 (OTP) -> 3 (New Password) -> 4 (Success)
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stepLoading, setStepLoading] = useState(false);
  const [otpResent, setOtpResent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });

  // Google Identity Services (GIS) initialization
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    const scriptId = 'google-gis-script';
    let script = document.getElementById(scriptId);

    function initGis() {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response.credential && onGoogleAuth) {
              setGoogleLoading(true);
              setAuthError('');
              try {
                await onGoogleAuth({ credential: response.credential });
              } catch (err) {
                setAuthError(err.response?.data?.message || 'Google authentication failed');
              } finally {
                setGoogleLoading(false);
              }
            }
          }
        });
      }
    }

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGis;
      document.body.appendChild(script);
    } else {
      initGis();
    }
  }, [onGoogleAuth]);

  async function handleGoogleClick() {
    setAuthError('');
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      setAuthError('Google Sign-In is configured on the backend. To enable browser popups, set VITE_GOOGLE_CLIENT_ID in frontend/.env.');
      return;
    }

    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: googleClientId,
          scope: 'openid email profile',
          ux_mode: 'popup',
          callback: async (response) => {
            if (response.code && onGoogleAuth) {
              setGoogleLoading(true);
              setAuthError('');
              try {
                await onGoogleAuth({ code: response.code });
              } catch (err) {
                setAuthError(err.response?.data?.message || 'Google authentication failed');
              } finally {
                setGoogleLoading(false);
              }
            } else if (response.error) {
              setAuthError(`Google authentication cancelled or blocked: ${response.error}`);
            }
          }
        });
        client.requestCode();
        return;
      } catch (err) {
        console.warn('OAuth2 code client error, falling back to One Tap prompt:', err);
      }
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google One Tap suppressed or dismissed');
        }
      });
    } else {
      setAuthError('Connecting to Google Identity Services... Please try again in a moment.');
    }
  }

  async function handleFormSubmit(data) {
    setAuthError('');
    try {
      const sanitizedData = {
        ...data,
        email: String(data.email || '').trim().toLowerCase(),
        name: String(data.name || '').trim()
      };
      await onSubmit(sanitizedData);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    }
  }

  // Step 1: Send OTP
  async function handleSendOtp(e) {
    e.preventDefault();
    if (!resetEmail) {
      setAuthError('Please enter your registered email address.');
      return;
    }
    setStepLoading(true);
    setAuthError('');
    try {
      await forgotPassword({ email: resetEmail });
      setResetStep(2);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setStepLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    const cleanOtp = resetOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setAuthError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setStepLoading(true);
    setAuthError('');
    try {
      const data = await verifyResetOtp({ email: resetEmail, otp: cleanOtp });
      setResetToken(data.resetToken);
      setResetStep(3);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setStepLoading(false);
    }
  }

  // Resend OTP handler
  async function handleResendOtp() {
    setStepLoading(true);
    setAuthError('');
    try {
      await forgotPassword({ email: resetEmail });
      setOtpResent(true);
      setTimeout(() => setOtpResent(false), 5000);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Could not resend OTP. Please try again.');
    } finally {
      setStepLoading(false);
    }
  }

  // Step 3: Set New Password
  async function handleResetPassword(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    setStepLoading(true);
    setAuthError('');
    try {
      await resetPassword({ resetToken, newPassword });
      setResetStep(4);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Failed to reset password. Session may have expired.');
    } finally {
      setStepLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-6 bg-[#fafaf9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 animate-fadeIn">
      <Card className="w-full max-w-md p-8 sm:p-9 space-y-6 shadow-md border border-slate-200/80 dark:border-slate-800">
        {/* Header & Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-sm shadow-xs">
              C
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Careerly
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-0.5" />
            </div>
          </Link>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-4">
            {mode === 'forgot-password'
              ? resetStep === 4
                ? 'Password Reset Complete'
                : 'Reset your password'
              : title}
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            {mode === 'forgot-password' ? (
              resetStep === 1 ? 'Enter your email to receive a 6-digit verification code.' :
              resetStep === 2 ? `Enter the 6-digit OTP sent to ${resetEmail}.` :
              resetStep === 3 ? 'Choose a strong new password for your account.' :
              'Your password has been successfully updated.'
            ) : mode === 'login' ? (
              'Sign in to access your placement preparation workspace.'
            ) : (
              'Create your account to start managing your placement prep.'
            )}
          </p>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* ================= FORGOT PASSWORD FLOW ================= */}
        {mode === 'forgot-password' ? (
          <div className="space-y-4 text-xs">
            {resetStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="student@example.com"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" size="md" className="w-full" isLoading={stepLoading} icon={ArrowRight}>
                    Send OTP
                  </Button>
                </div>

                <div className="pt-1 text-center">
                  <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-emerald-600 transition">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-sm tracking-widest font-mono text-center font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {otpResent && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold text-center">
                    A fresh 6-digit OTP has been sent to your email.
                  </p>
                )}

                <div className="pt-2">
                  <Button type="submit" size="md" className="w-full" isLoading={stepLoading} icon={ArrowRight}>
                    Verify OTP
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={stepLoading}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Resend OTP
                  </button>
                </div>
              </form>
            )}

            {resetStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" size="md" className="w-full" isLoading={stepLoading} icon={ArrowRight}>
                    Reset Password
                  </Button>
                </div>
              </form>
            )}

            {resetStep === 4 && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Your password has been changed successfully. You can now log in using your new credentials.
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    size="md"
                    className="w-full"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= NORMAL LOGIN / REGISTER FLOW ================= */
          <div className="space-y-4 text-xs">
            {/* Google Sign-in Button */}
            <div>
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'Connecting with Google...' : 'Continue with Google'}</span>
              </button>
            </div>

            {/* Subtle Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-400 shrink-0">
                or with email
              </span>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-xs">
              {mode === 'register' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      {...register('name', { required: true })}
                      type="text"
                      placeholder="Candidate Name"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    {...register('email', { required: true })}
                    type="email"
                    placeholder="student@example.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <Link
                      to="/forgot-password"
                      className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline text-[11px]"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    {...register('password', { required: true })}
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="md"
                  className="w-full"
                  isLoading={loading}
                  icon={ArrowRight}
                >
                  {loading
                    ? 'Authenticating...'
                    : mode === 'login'
                    ? 'Sign In to Workspace'
                    : 'Create Student Account'}
                </Button>
              </div>

              <div className="pt-2 text-center text-xs text-slate-500">
                {mode === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <Link to="/register" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                      Create Account
                    </Link>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                      Sign In
                    </Link>
                  </p>
                )}
              </div>
            </form>
          </div>
        )}
      </Card>
    </main>
  );
}