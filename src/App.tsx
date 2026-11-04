/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthPortal } from './components/auth/AuthPortal';
import { AuthGuard } from './components/auth/AuthGuard';
import { AdminLayout } from './components/admin/AdminLayout';
import { InternLayout } from './components/intern/InternLayout';

const MainApp: React.FC = () => {
  const { currentRole, isLoadingAuth } = useApp();

  if (isLoadingAuth) {
    return (
      <AuthGuard>
        <div />
      </AuthGuard>
    );
  }

  if (currentRole === 'admin') {
    return (
      <AuthGuard requiredRole="admin">
        <AdminLayout />
      </AuthGuard>
    );
  }

  if (currentRole === 'intern') {
    return (
      <AuthGuard requiredRole="intern">
        <InternLayout />
      </AuthGuard>
    );
  }

  // Not authenticated or logged out
  return <AuthPortal />;
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
