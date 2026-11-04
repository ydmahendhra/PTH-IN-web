import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCheck,
  UserPlus,
  FileCheck2,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  Shield,
  Edit3,
  Phone,
  Mail,
  Building2,
  Search,
  KeyRound,
  Activity,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { AdminOverview } from './AdminOverview';
import { ActivityMonitoringDashboard } from './ActivityMonitoringDashboard';
import { ProjectManagement } from './ProjectManagement';
import { ProjectDetailsView } from './ProjectDetailsView';
import { InternManagement } from './InternManagement';
import { AssignProjects } from './AssignProjects';
import { AdminReports } from './AdminReports';
import { AdminProfileView } from './AdminProfile';
import { AdminSettings } from './AdminSettings';
import { AdminPasswordResetModal } from './AdminPasswordResetModal';
import { NotificationsDrawer } from '../common/NotificationsDrawer';

export const AdminLayout: React.FC = () => {
  const { adminProfile, logout, unreadNotificationsCount } = useApp();

  // Navigation views:
  // 'overview' | 'projects' | 'project_details' | 'teams' | 'interns' | 'assign' | 'reports' | 'profile' | 'settings' | 'projects_new' | 'interns_new'
  const [currentView, setCurrentView] = useState<string>('overview');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false);
  const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false);

  const handleNavigate = (view: string, contextId?: string) => {
    setCurrentView(view);
    if (view === 'project_details' && contextId) {
      setActiveProjectId(contextId);
    }
    if (view === 'reports' && contextId) {
      setActiveReportId(contextId);
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'activity', label: 'Activity & Logs', icon: Activity },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'assign', label: 'Assign Projects', icon: UserCheck },
    { id: 'interns', label: 'Intern Management', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileCheck2 },
    { id: 'profile', label: 'Admin Profile', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getBreadcrumbLabel = () => {
    switch (currentView) {
      case 'overview':
        return 'Dashboard Overview';
      case 'activity':
        return 'Activity Monitoring & Central Logs';
      case 'projects':
      case 'projects_new':
        return 'Projects';
      case 'project_details':
        return `Project Details (${activeProjectId || ''})`;
      case 'assign':
        return 'Assign Projects';
      case 'interns':
      case 'interns_new':
        return 'Intern Management';
      case 'reports':
        return 'Reports Management';
      case 'profile':
        return 'Administrator Profile';
      case 'settings':
        return 'Settings';
      default:
        return 'Admin Workspace';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION (Desktop 260px) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-900 border-r border-slate-800 shrink-0">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_c321df86.png"
              alt="Phoenix Tech Solutions"
              className="w-10 h-10 rounded-lg object-contain shadow-md shadow-orange-500/20 bg-slate-950 border border-slate-800"
            />
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">Phoenix Tech Solutions</span>
              <span className="text-[10px] text-orange-400 font-semibold tracking-wide uppercase">
                Admin Console
              </span>
            </div>
          </div>
        </div>

        {/* ADMIN PROFILE SNIPPET (Requirements Section 3.A) */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <Avatar name={adminProfile.name} size="md" />
            <div className="truncate flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate block">
                  {adminProfile.name}
                </span>
                <button
                  onClick={() => setCurrentView('profile')}
                  className="p-1 text-slate-400 hover:text-indigo-400 rounded transition cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 block tabular-nums">
                {adminProfile.id}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {adminProfile.designation}
              </span>
            </div>
          </div>

          {/* Quick contact drawer toggle button */}
          <button
            onClick={() => setProfilePreviewOpen(!profilePreviewOpen)}
            className="w-full mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <span>View Full Contact Info</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${profilePreviewOpen ? 'rotate-90' : ''}`} />
          </button>

          {profilePreviewOpen && (
            <div className="mt-2 pt-2 border-t border-slate-800/60 space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 text-slate-400 truncate">
                <Mail className="w-3 h-3 shrink-0 text-slate-500" />
                <span className="truncate">{adminProfile.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 truncate">
                <Phone className="w-3 h-3 shrink-0 text-slate-500" />
                <span>{adminProfile.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 truncate">
                <Building2 className="w-3 h-3 shrink-0 text-slate-500" />
                <span className="truncate">{adminProfile.department}</span>
              </div>
              <button
                onClick={() => setPasswordResetModalOpen(true)}
                className="w-full mt-2 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700/80"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Change Password</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id ||
              (item.id === 'projects' && (currentView === 'project_details' || currentView === 'projects_new')) ||
              (item.id === 'interns' && currentView === 'interns_new');

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/aistudio/image_c321df86.png"
            alt="Phoenix Tech Solutions"
            className="w-8 h-8 rounded-lg object-contain shadow-sm bg-slate-950 border border-slate-800"
          />
          <span className="font-bold text-sm text-white">Phoenix Tech Solutions</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotifDrawerOpen(true)}
            className="relative p-2 text-slate-400 hover:text-white"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/40 backdrop-blur">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <span className="text-white font-medium">{getBreadcrumbLabel()}</span>
          </div>

          {/* Right Header Zone */}
          <div className="flex items-center gap-3">
            {/* Notifications Button */}
            <button
              onClick={() => setNotifDrawerOpen(true)}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center tabular-nums">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Quick Change Password Icon */}
            <button
              onClick={() => setPasswordResetModalOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition cursor-pointer"
              title="Update Administrator Password"
            >
              <KeyRound className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Quick Profile Pill */}
            <div
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-2.5 pl-2 py-1 pr-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
            >
              <Avatar name={adminProfile.name} size="xs" />
              <div className="text-left">
                <span className="text-xs font-semibold text-white block leading-tight">
                  {adminProfile.name}
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  Administrator
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentView === 'overview' && <AdminOverview onNavigate={handleNavigate} />}
          {currentView === 'activity' && <ActivityMonitoringDashboard />}
          {currentView === 'projects' && (
            <ProjectManagement onOpenProject={(id) => handleNavigate('project_details', id)} />
          )}
          {currentView === 'projects_new' && (
            <ProjectManagement
              onOpenProject={(id) => handleNavigate('project_details', id)}
              openCreateImmediately={true}
            />
          )}
          {currentView === 'project_details' && activeProjectId && (
            <ProjectDetailsView
              projectId={activeProjectId}
              onBack={() => setCurrentView('projects')}
              onOpenReport={(repId) => handleNavigate('reports', repId)}
            />
          )}
          {currentView === 'assign' && <AssignProjects />}
          {currentView === 'interns' && <InternManagement />}
          {currentView === 'interns_new' && <InternManagement openCreateImmediately={true} />}
          {currentView === 'reports' && <AdminReports initialReportId={activeReportId || undefined} />}
          {currentView === 'profile' && <AdminProfileView />}
          {currentView === 'settings' && <AdminSettings />}
        </main>
      </div>

      {/* Notifications Slide-Over Drawer */}
      <NotificationsDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        role="admin"
        onSelectNotification={(notif) => {
          setNotifDrawerOpen(false);
          if (notif.projectId) {
            handleNavigate('project_details', notif.projectId);
          } else if (notif.reportId) {
            handleNavigate('reports', notif.reportId);
          }
        }}
      />

      {/* Admin Password Reset Modal */}
      <AdminPasswordResetModal
        isOpen={passwordResetModalOpen}
        onClose={() => setPasswordResetModalOpen(false)}
      />
    </div>
  );
};
