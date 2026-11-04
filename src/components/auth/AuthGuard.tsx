import React from 'react';
import { ShieldAlert, ShieldCheck, Lock, LogOut, ArrowRight, Loader2, UserX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { AuthPortal } from './AuthPortal';

export interface AuthGuardProps {
  children: React.ReactNode;
  /**
   * Required role(s) to access the wrapped dashboard module or layout.
   * Can be a single role ('admin' | 'intern') or an array of permitted roles.
   */
  requiredRole?: UserRole | UserRole[];
  allowedRoles?: UserRole[];
  /**
   * Optional custom fallback component when unauthorized
   */
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
  allowedRoles,
  fallback,
}) => {
  const {
    currentRole,
    isLoadingAuth,
    adminProfile,
    currentIntern,
    logout,
  } = useApp();

  // Normalize allowed roles into an array
  const rolesToCheck: UserRole[] = React.useMemo(() => {
    if (allowedRoles && allowedRoles.length > 0) return allowedRoles;
    if (!requiredRole) return ['admin', 'intern', 'staff'];
    return Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  }, [requiredRole, allowedRoles]);

  // 1. Loading Authentication State
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <Loader2 className="w-20 h-20 text-indigo-500 animate-spin absolute" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Verifying Security Credentials</h2>
        <p className="text-sm text-slate-400 mt-2 text-center max-w-sm">
          Validating cryptographic session token and role permissions...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated User Check
  if (!currentRole) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AuthPortal />;
  }

  // 3. Deactivated / Inactive Account Check (for Interns)
  if (currentRole === 'intern' && currentIntern && !currentIntern.isActive) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 text-rose-400">
            <UserX className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Account Deactivated</h2>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Your intern profile (<span className="text-slate-200 font-mono font-medium">{currentIntern.id}</span>) is currently marked as <span className="text-rose-400 font-medium">Inactive</span>. Dashboard access is temporarily suspended.
          </p>
          <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 text-left space-y-1">
            <p className="font-semibold text-slate-300">Next Steps:</p>
            <p>• Contact your project supervisor or talent director (<span className="text-indigo-400">admin@nexus.corp</span>).</p>
            <p>• Request account reactivation for your assigned term.</p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition border border-slate-700"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              Sign Out to Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Role Authorization Check
  const isAuthorized = rolesToCheck.includes(currentRole);

  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const currentUserName =
      currentRole === 'admin'
        ? adminProfile?.name || 'Administrator'
        : currentIntern?.fullName || currentIntern?.id || 'Intern';

    const formattedRequiredRoles = rolesToCheck
      .map((r) => r.toUpperCase())
      .join(' or ');

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-lg w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top subtle ambient badge */}
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-block text-[11px] font-semibold tracking-wider text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full mb-1">
                403 Forbidden · Access Guard
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Access Restricted</h2>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
            <p>
              This module requires <span className="text-amber-400 font-semibold">{formattedRequiredRoles}</span> privileges.
            </p>
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Active User:</span>
                <span className="font-medium text-slate-200">{currentUserName}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Role:</span>
                <span className="font-mono text-indigo-400 uppercase">{currentRole}</span>
              </div>
              <div className="flex justify-between">
                <span>Required Permission:</span>
                <span className="font-mono text-amber-400">{formattedRequiredRoles}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              To preserve data isolation and privacy regulations, access across administrative boundaries is locked.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={logout}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl transition border border-slate-700"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              Sign Out / Switch Account
            </button>
            <button
              onClick={() => {
                // Return to appropriate authorized home
                window.location.reload();
              }}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-indigo-600/25"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Authorized - Render protected module
  return <>{children}</>;
};
