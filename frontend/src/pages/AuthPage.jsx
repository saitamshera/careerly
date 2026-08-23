import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Lock, Mail, User, KeyRound, CheckCircle2, RotateCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
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

  const { register, handleSubmit } = useForm({
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
              setAuthError(`Google Sign-In error: ${response.error_description || response.error}`);
            }
          },
          onerror: (error) => {
            setAuthError(`Google Sign-In failed: ${error.message || 'Popup closed or blocked'}`);
          }
        });
        client.requestCode();
      } catch (err) {
        setAuthError(err.message || 'Failed to open Google Sign-In prompt');
      }
    } else {
      setAuthError('Google Sign-In SDK is loading. Please try again in a few seconds.');
    }
  }

  function handleFormSubmit(data) {
    setAuthError('');
    if (onSubmit) {
      onSubmit(data);
    }
  }

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
      setAuthError(err.response?.data?.message || 'Failed to send OTP. Please check the email and try again.');
    } finally {
      setStepLoading(false);
    }
  }

  async function handleResendOtp() {
    setStepLoading(true);
    setAuthError('');
    setOtpResent(false);
    try {
      await forgotPassword({ email: resetEmail });
      setOtpResent(true);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setStepLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!resetOtp || resetOtp.length < 6) {
      setAuthError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }
    setStepLoading(true);
    setAuthError('');
    try {
      const res = await verifyResetOtp({ email: resetEmail, otp: resetOtp });
      if (res.data?.data?.resetToken) {
        setResetToken(res.data.data.resetToken);
        setResetStep(3);
      } else {
        setAuthError('Invalid verification response from server.');
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setStepLoading(false);
    }
  }

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
    <main className="flex min-h-screen w-full items-center justify-center p-6 bg-[#F8F6F0] text-[#20211E] animate-fadeIn">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-5 border border-[#E3DED3] bg-[#FFFDF8]">
        {/* Header & Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center">
            <Logo />
          </Link>

          <h1 className="text-lg sm:text-xl font-bold text-[#20211E] mt-3">
            {mode === 'forgot-password'
              ? resetStep === 4
                ? 'Password Reset Complete'
                : 'Reset your password'
              : title}
          </h1>

          <p className="text-xs text-[#5F625C] mt-0.5">
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
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#FDECEB] border border-[#F7CBC9] text-[#B83A35] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* FORGOT PASSWORD FLOW */}
        {mode === 'forgot-password' ? (
          <div className="space-y-3.5 text-xs">
            {resetStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block font-bold text-[#20211E] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#74766F]" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="student@example.com"
                      required
                      className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] py-2 pl-8 pr-3 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <Button type="submit" size="md" className="w-full" isLoading={stepLoading} icon={ArrowRight}>
                    Send OTP
                  </Button>
                </div>

                <div className="pt-1 text-center">
                  <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-[#5F625C] hover:text-[#315B45] transition">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div>
                  <label className="block font-bold text-[#20211E] mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#74766F]" />
                    <input
                      type="text"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      required
                      className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] py-2 pl-8 pr-3 text-sm tracking-widest font-mono text-center font-bold text-[#20211E] outline-none focus:border-[#315B45]"
                    />
                  </div>
                </div>

                {otpResent && (
                  <p className="text-[11px] text-[#315B45] font-semibold text-center">
                    A fresh 6-digit OTP has been sent to your email.
                  </p>
                )}

                <div className="pt-1">
                  <Button type="submit" size="md" className="w-full" isLoading={stepLoading} icon={ArrowRight}>
                    Verify OTP
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="inline-flex items-center gap-1 font-semibold text-[#5F625C] hover:text-[#20211E] transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={stepLoading}
                    className="inline-flex items-center gap-1 font-semibold text-[#315B45] hover:underline cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Resend OTP
                  </button>
                </div>
              </form>
            )}

            {resetStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="block font-bold text-[#20211E] mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#74766F]" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] py-2 pl-8 pr-3 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#20211E] mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#74766F]" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] py-2 pl-8 pr-3 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <Button type="submit" size="md" className="w-full" isLoading={stepLoading} icon={ArrowRight}>
                    Reset Password
                  </Button>
                </div>
              </form>
            )}

            {resetStep === 4 && (
              <div className="text-center py-3 space-y-3">
                <div className="w-10 h-10 bg-[#E8F0EA] text-[#315B45] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#5F625C]">
                  Your password has been changed successfully. You can now log in using your new credentials.
                </p>
                <div className="pt-1">
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
          /* NORMAL LOGIN / REGISTER FLOW */
          <div className="space-y-3.5 text-xs">
            {/* Google Sign-in Button */}
            <div>
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#E3DED3] bg-[#FFFDF8] py-2 px-3.5 text-xs font-semibold text-[#20211E] hover:bg-[#F7F4ED] transition cursor-pointer"
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
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-[#E3DED3] w-full" />
              <span className="bg-[#FFFDF8] px-2.5 text-[10px] uppercase font-bold text-[#74766F] shrink-0">
                or with email
              </span>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3.5 text-xs">
              {mode === 'register' && (
                <div>
                  <label className="block font-bold text-[#20211E] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#74766F]" />
                    <input
                      {...register('name', { required: true })}
                      type="text"
                      placeholder="Candidate Name"
                      className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] py-2 pl-8 pr-3 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#20211E] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#74766F]" />
                  <input
                    {...register('email', { required: true })}
                    type="email"
                    placeholder="student@example.com"
                    className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] py-2 pl-8 pr-3 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#20211E]">
                    Password
                  </label>
                  {mode === 'login' && (
                    <Link
                      to="/forgot-password"
                      className="font-semibold text-[#315B45] hover:underline text-[11px]"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#74766F]" />
                  <input
                    {...register('password', { required: true })}
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] py-2 pl-8 pr-3 text-xs text-[#20211E] outline-none focus:border-[#315B45]"
                  />
                </div>
              </div>

              <div className="pt-1">
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

              <div className="pt-1 text-center text-xs text-[#5F625C]">
                {mode === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <Link to="/register" className="font-bold text-[#315B45] hover:underline">
                      Create Account
                    </Link>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-[#315B45] hover:underline">
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