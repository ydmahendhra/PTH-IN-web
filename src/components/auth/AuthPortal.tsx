import React, { useState } from 'react';
import { Shield, Users, GraduationCap, Eye, EyeOff, ArrowRight, Lock, Mail, KeyRound, AlertCircle, Sparkles, Clock, CheckCircle, Terminal, ChevronDown, ChevronUp, ShieldCheck, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';

export const AuthPortal: React.FC = () => {
  const { login } = useApp();

  // Selected tab: 'admin' | 'staff' | 'intern'
  const [activeTab, setActiveTab] = useState<'admin' | 'staff' | 'intern'>('admin');

  // Admin form - clean empty initial inputs
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Intern form - clean empty initial inputs
  const [internIdentifier, setInternIdentifier] = useState('');
  const [internPassword, setInternPassword] = useState('');
  const [showInternPassword, setShowInternPassword] = useState(false);

  // Status & errors
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotModalRole, setForgotModalRole] = useState<'admin' | 'intern'>('admin');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Admin reset specific fields
  const [resetAdminId, setResetAdminId] = useState('');
  const [resetSecurityKey, setResetSecurityKey] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [showResetNewPass, setShowResetNewPass] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await login('admin', adminIdentifier.trim(), adminPassword);
      if (!res.success) {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInternSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await login('intern', internIdentifier.trim(), internPassword);
      if (!res.success) {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetAdminId.trim()) {
      setResetError('Please enter your Administrator ID or registered email.');
      return;
    }
    if (!resetNewPass || resetNewPass.length < 6) {
      setResetError('New password must contain at least 6 characters.');
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setResetError('New password and confirmation password do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await api.auth.resetAdminPassword({
        identifier: resetAdminId.trim(),
        securityKey: resetSecurityKey.trim() || undefined,
        newPassword: resetNewPass,
        confirmPassword: resetConfirmPass,
      });

      if (res.success) {
        setResetSuccess(res.message || 'Administrator password updated successfully and secured with bcrypt hashing.');
        setAdminIdentifier(resetAdminId.trim());
        setAdminPassword('');
        setResetNewPass('');
        setResetConfirmPass('');
        setTimeout(() => {
          setForgotModalOpen(false);
          setResetSuccess(null);
        }, 2200);
      } else {
        setResetError(res.message || 'Password update failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setResetError(err.message || 'A network error occurred. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleInternForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setForgotModalOpen(false);
      setForgotEmail('');
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_c321df86.png"
              alt="Phoenix Tech Solutions"
              className="w-10 h-10 rounded-xl object-contain shadow-lg shadow-orange-500/20 bg-slate-950 border border-slate-800"
            />
            <div>
              <span className="text-base font-bold tracking-tight text-white block">Phoenix Tech Solutions</span>
              <span className="text-xs text-orange-400 font-medium">
                Enterprise Project & Intern Management System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">System Operational</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative">
          
          {/* Header Title with Logo Badge */}
          <div className="text-center mb-6">
            <div className="inline-block p-1 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner mb-3">
              <img
                src="/assets/aistudio/image_c321df86.png"
                alt="Phoenix Tech Solutions"
                className="w-16 h-16 rounded-xl object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5">
              Phoenix Tech Solutions
            </h1>
            <p className="text-xs text-slate-400">
              Role-Based Access Portal · Select authorization role
            </p>
          </div>

          {/* Role Segmented Switcher */}
          <div className="grid grid-cols-3 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMessage('');
              }}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('staff');
                setErrorMessage('');
              }}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <div className="flex items-center gap-1">
                <span>Staff</span>
                <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-400 rounded">Soon</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('intern');
                setErrorMessage('');
              }}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'intern'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Intern</span>
            </button>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Success Message Box */}
          {successMessage && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* TAB 1: ADMIN LOGIN */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Admin User ID or Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    required
                    placeholder="mahendhra2005@gamil.com or PTS-CEO-001"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Admin Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotModalRole('admin');
                      setResetAdminId(adminIdentifier);
                      setResetSecurityKey('');
                      setResetNewPass('');
                      setResetConfirmPass('');
                      setResetError(null);
                      setResetSuccess(null);
                      setForgotModalOpen(true);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="Enter admin password"
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 mt-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Login as Administrator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          )}

          {/* TAB 2: STAFF LOGIN (COMING SOON) */}
          {activeTab === 'staff' && (
            <div className="py-6 px-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">Staff Portal - Phase 2</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  The Staff & Mentor coordination module is currently in development for Phase 2 rollout.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-left text-xs space-y-1.5">
                <div className="font-medium text-slate-300">Upcoming Staff Capabilities:</div>
                <ul className="text-slate-400 space-y-1 list-disc list-inside">
                  <li>Departmental mentor oversight</li>
                  <li>Weekly 1-on-1 check-in evaluations</li>
                  <li>Cross-team workload balancing</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer"
                >
                  Switch to Admin Portal instead
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: INTERN LOGIN */}
          {activeTab === 'intern' && (
            <form onSubmit={handleInternSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Intern User ID or Username
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={internIdentifier}
                    onChange={(e) => setInternIdentifier(e.target.value)}
                    required
                    placeholder="INT-2024-01 or alex.chen"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition tabular-nums"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Intern ID was issued by your administrator during onboarding.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotModalRole('intern');
                      setForgotEmail(internIdentifier);
                      setForgotSent(false);
                      setForgotModalOpen(true);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showInternPassword ? 'text' : 'password'}
                    value={internPassword}
                    onChange={(e) => setInternPassword(e.target.value)}
                    required
                    placeholder="Enter intern account password"
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInternPassword(!showInternPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showInternPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 mt-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Login as Intern'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      </main>

      {/* Forgot / Reset Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-950/80 rounded-lg border border-indigo-800 text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {forgotModalRole === 'admin' ? 'Administrator Password Reset' : 'Intern Password Assistance'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {forgotModalRole === 'admin'
                      ? 'Secure encrypted reset with server-side bcrypt hashing'
                      : 'Request credential reset from system supervisor'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {forgotModalRole === 'admin' ? (
              <div className="space-y-4">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Passwords are hashed with bcrypt before saving to MongoDB.</span>
                </div>

                {resetSuccess ? (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{resetSuccess}</span>
                  </div>
                ) : (
                  <form onSubmit={handleAdminResetSubmit} className="space-y-3">
                    {resetError && (
                      <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{resetError}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">Administrator Identifier</label>
                      <input
                        type="text"
                        value={resetAdminId}
                        onChange={(e) => setResetAdminId(e.target.value)}
                        required
                        placeholder="Admin ID or registered email"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">Security Authorization Key</label>
                      <input
                        type="text"
                        value={resetSecurityKey}
                        onChange={(e) => setResetSecurityKey(e.target.value)}
                        placeholder="Enter Admin ID or Master Security Key"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">New Password</label>
                      <div className="relative">
                        <input
                          type={showResetNewPass ? 'text' : 'password'}
                          value={resetNewPass}
                          onChange={(e) => setResetNewPass(e.target.value)}
                          required
                          placeholder="Minimum 6 characters"
                          className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetNewPass(!showResetNewPass)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                        >
                          {showResetNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">Confirm New Password</label>
                      <input
                        type="password"
                        value={resetConfirmPass}
                        onChange={(e) => setResetConfirmPass(e.target.value)}
                        required
                        placeholder="Re-enter new password"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(false)}
                        disabled={isResetting}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isResetting || !resetNewPass || resetNewPass !== resetConfirmPass}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5 transition"
                      >
                        {isResetting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Update Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered Intern ID or Email address. A reset notification will be routed to your administrator.
                </p>

                {forgotSent ? (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Password reset notice dispatched successfully!</span>
                  </div>
                ) : (
                  <form onSubmit={handleInternForgotPassword} className="space-y-3">
                    <input
                      type="text"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="Enter Intern ID or Email"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                      >
                        Send Reset Request
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        Phoenix Tech Solutions · Enterprise Project & Intern Management Platform
      </footer>
    </div>
  );
};
