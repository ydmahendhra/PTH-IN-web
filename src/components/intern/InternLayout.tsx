import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FileCheck2,
  FileText,
  User,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Send,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { InternOverview } from './InternOverview';
import { InternProjectDetails } from './InternProjectDetails';
import { InternReportSubmit } from './InternReportSubmit';
import { InternSubmissionsHistory } from './InternSubmissionsHistory';
import { InternProfileView } from './InternProfile';
import { NotificationsDrawer } from '../common/NotificationsDrawer';

export const InternLayout: React.FC = () => {
  const { currentIntern, projects, logout, unreadNotificationsCount } = useApp();

  // Active view: 'overview' | 'projects' | 'project_details' | 'submit_report' | 'my_submissions' | 'profile' | 'settings'
  const [currentView, setCurrentView] = useState<string>('overview');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  if (!currentIntern) return null;

  // Filter projects assigned to this intern
  const myProjects = projects.filter((p) => p.assignedInternIds.includes(currentIntern.id));

  const handleNavigate = (view: string, contextId?: string) => {
    setCurrentView(view);
    if (view === 'project_details' && contextId) {
      setActiveProjectId(contextId);
    }
    if (view === 'submit_report' && contextId) {
      setActiveProjectId(contextId);
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'My Projects', icon: FolderKanban },
    { id: 'submit_report', label: 'Submit Reports', icon: Send },
    { id: 'my_submissions', label: 'My Submissions', icon: FileCheck2 },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getBreadcrumbLabel = () => {
    switch (currentView) {
      case 'overview':
        return 'Intern Dashboard';
      case 'projects':
        return 'My Assigned Projects';
      case 'project_details':
        return `Project Details (${activeProjectId || ''})`;
      case 'submit_report':
        return 'Submit Work Report';
      case 'my_submissions':
        return 'My Submissions & History';
      case 'profile':
        return 'My Profile';
      case 'settings':
        return 'Account Settings';
      default:
        return 'Intern Workspace';
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
                Intern Portal
              </span>
            </div>
          </div>
        </div>

        {/* INTERN PROFILE SUMMARY (Section 6.A & 6.B) */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <Avatar name={currentIntern.fullName} size="md" />
            <div className="truncate flex-1">
              <span className="text-xs font-bold text-white truncate block">
                {currentIntern.fullName}
              </span>
              <span className="text-[10px] font-mono text-indigo-400 block tabular-nums">
                {currentIntern.id}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {currentIntern.designation}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate max-w-[150px]">{currentIntern.college}</span>
            <button
              onClick={() => handleNavigate('profile')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              Profile →
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id ||
              (item.id === 'projects' && currentView === 'project_details');

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
            <span>Sign Out Intern</span>
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
              <span>Sign Out Intern</span>
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
            <span>Intern Portal</span>
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

            {/* Quick Profile Snippet */}
            <div
              onClick={() => handleNavigate('profile')}
              className="flex items-center gap-2.5 pl-2 py-1 pr-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
            >
              <Avatar name={currentIntern.fullName} size="xs" />
              <div className="text-left">
                <span className="text-xs font-semibold text-white block leading-tight">
                  {currentIntern.fullName}
                </span>
                <span className="text-[10px] text-slate-400 block leading-tight font-mono tabular-nums">
                  {currentIntern.id}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentView === 'overview' && <InternOverview onNavigate={handleNavigate} />}
          {currentView === 'projects' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-5 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">My Assigned Projects</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a project to view specifications, requirements, and submit deliverables
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {myProjects.length} Projects
                </span>
              </div>

              {myProjects.length === 0 ? (
                <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-semibold text-slate-300">No Projects Assigned</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have not been assigned to any projects yet. Contact Dr. Sarah Sterling for assignment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myProjects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleNavigate('project_details', p.id)}
                      className="p-5 bg-slate-900 border border-slate-800 hover:border-indigo-600/60 rounded-xl transition cursor-pointer space-y-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-indigo-400 font-semibold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900 tabular-nums">
                          {p.id}
                        </span>
                        <span className="text-xs font-semibold text-emerald-400">{p.status}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span>Due: <span className="tabular-nums text-slate-200">{p.deadline}</span></span>
                        <span className="text-indigo-400 hover:text-indigo-300 font-medium">
                          Open Details →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {currentView === 'project_details' && activeProjectId && (
            <InternProjectDetails
              projectId={activeProjectId}
              onBack={() => setCurrentView('projects')}
              onSubmitReport={(id) => handleNavigate('submit_report', id)}
            />
          )}
          {currentView === 'submit_report' && (
            <InternReportSubmit
              initialProjectId={activeProjectId || undefined}
              onNavigateHistory={() => handleNavigate('my_submissions')}
              onSubmissionSuccess={() => handleNavigate('my_submissions')}
            />
          )}
          {currentView === 'my_submissions' && (
            <InternSubmissionsHistory
              onNewSubmission={() => handleNavigate('submit_report')}
            />
          )}
          {currentView === 'profile' && <InternProfileView />}
          {currentView === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div className="border-b border-slate-800 pb-5">
                <h1 className="text-xl font-bold text-white tracking-tight">Account Preferences</h1>
                <p className="text-xs text-slate-400 mt-1">Manage intern preferences and session security</p>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-200 block mb-1">Session Security</span>
                  <p className="text-slate-400">
                    Logged in as <strong>{currentIntern.fullName}</strong> ({currentIntern.username}). Account managed by organization administrator Dr. Sarah Sterling.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow transition cursor-pointer"
                  >
                    Sign Out of Intern Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Notifications Slide-Over Drawer */}
      <NotificationsDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
        role="intern"
        onSelectNotification={(notif) => {
          setNotifDrawerOpen(false);
          if (notif.projectId) {
            handleNavigate('project_details', notif.projectId);
          } else if (notif.reportId) {
            handleNavigate('my_submissions');
          }
        }}
      />
    </div>
  );
};
