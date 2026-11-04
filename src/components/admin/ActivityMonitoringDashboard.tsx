import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Users,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Calendar,
  Laptop,
  Building,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Terminal,
  FileText,
  Copy,
  Check,
  X,
  Send,
  Eye,
  Pause,
  Play,
  TrendingUp,
  Radio,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { ActivityLogItem, InternCheckInItem, ActivityCategory, ActivitySeverity, CheckInStatus, WorkMode } from '../../types';
import { Avatar } from '../common/Avatar';

export const ActivityMonitoringDashboard: React.FC = () => {
  const { interns, projects, socket } = useApp();

  // Navigation tab within monitoring:
  // 'overview' | 'checkins' | 'projects' | 'logs'
  const [activeTab, setActiveTab] = useState<'overview' | 'checkins' | 'projects' | 'logs'>('overview');

  // Loading & metrics states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<{
    summary: {
      totalInterns: number;
      todayCheckIns: number;
      activeInternsNow: number;
      projectUpdatesToday: number;
      criticalAlertsCount: number;
      checkInRate: number;
      todayDate: string;
    };
    recentCheckIns: InternCheckInItem[];
    recentProjectUpdates: ActivityLogItem[];
    activityTrend: { date: string; checkIns: number; projectUpdates: number }[];
  } | null>(null);

  // Central Logs state
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');
  const [logSeverityFilter, setLogSeverityFilter] = useState<string>('all');
  const [logRangeFilter, setLogRangeFilter] = useState<string>('today');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [isLivePaused, setIsLivePaused] = useState(false);

  // Check-ins list state
  const [checkInsList, setCheckInsList] = useState<InternCheckInItem[]>([]);
  const [checkInStatusFilter, setCheckInStatusFilter] = useState<string>('all');
  const [checkInDateFilter, setCheckInDateFilter] = useState<string>('today');
  const [checkInSearch, setCheckInSearch] = useState('');

  // Modals state
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<ActivityLogItem | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [manualCheckInOpen, setManualCheckInOpen] = useState(false);
  const [pruneModalOpen, setPruneModalOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Manual Check-in Form
  const [manualForm, setManualForm] = useState({
    internId: '',
    status: 'Present' as CheckInStatus,
    mode: 'Remote' as WorkMode,
    projectId: '',
    focusToday: '',
    blockers: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // Fetch Dashboard Summary Data
  const loadDashboardMetrics = async () => {
    try {
      const res = await api.activity.getDashboard();
      if (res.success) {
        setDashboardData({
          summary: res.summary,
          recentCheckIns: res.recentCheckIns || [],
          recentProjectUpdates: res.recentProjectUpdates || [],
          activityTrend: res.activityTrend || [],
        });
      }
    } catch (err: any) {
      console.error('Error fetching dashboard summary:', err);
    }
  };

  // Fetch Central Logs
  const loadLogs = async (page = 1) => {
    try {
      const res = await api.activity.getLogs({
        category: logCategoryFilter !== 'all' ? logCategoryFilter : undefined,
        severity: logSeverityFilter !== 'all' ? logSeverityFilter : undefined,
        range: logRangeFilter,
        search: logSearchQuery.trim() || undefined,
        page,
        limit: 40,
      });
      if (res.success) {
        setLogs(res.logs || []);
        setLogsTotal(res.pagination?.total || 0);
        setLogPage(res.pagination?.page || 1);
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err);
    }
  };

  // Fetch Check-ins
  const loadCheckIns = async () => {
    try {
      const res = await api.activity.getCheckIns({
        date: checkInDateFilter === 'today' ? undefined : checkInDateFilter === 'all' ? 'all' : checkInDateFilter,
        status: checkInStatusFilter !== 'all' ? checkInStatusFilter : undefined,
        search: checkInSearch.trim() || undefined,
      });
      if (res.success) {
        setCheckInsList(res.checkIns || []);
      }
    } catch (err: any) {
      console.error('Error fetching check-ins:', err);
    }
  };

  const reloadAll = async () => {
    setIsRefreshing(true);
    await Promise.all([loadDashboardMetrics(), loadLogs(1), loadCheckIns()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadDashboardMetrics(), loadLogs(1), loadCheckIns()]);
      setIsLoading(false);
    };
    init();
  }, []);

  // Reload logs when filters change
  useEffect(() => {
    loadLogs(1);
  }, [logCategoryFilter, logSeverityFilter, logRangeFilter, logSearchQuery]);

  // Reload check-ins when check-in filters change
  useEffect(() => {
    loadCheckIns();
  }, [checkInDateFilter, checkInStatusFilter, checkInSearch]);

  // Real-time socket events listener
  useEffect(() => {
    if (!socket) return;

    const handleActivityEvent = (newLog: ActivityLogItem) => {
      if (!isLivePaused) {
        setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
        setLogsTotal((t) => t + 1);
      }

      // If it's a project update, update recent project updates feed
      if (newLog.category === 'project_update') {
        setDashboardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            recentProjectUpdates: [newLog, ...prev.recentProjectUpdates.slice(0, 9)],
            summary: {
              ...prev.summary,
              projectUpdatesToday: prev.summary.projectUpdatesToday + 1,
            },
          };
        });
      }
    };

    const handleCheckInEvent = (newCheckIn: InternCheckInItem) => {
      // Update checkins list
      setCheckInsList((prev) => {
        const existingIdx = prev.findIndex((c) => c.checkInId === newCheckIn.checkInId);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newCheckIn;
          return updated;
        }
        return [newCheckIn, ...prev];
      });

      // Update dashboard recent check-ins & counts
      setDashboardData((prev) => {
        if (!prev) return prev;
        const exists = prev.recentCheckIns.some((c) => c.checkInId === newCheckIn.checkInId);
        const updatedList = exists
          ? prev.recentCheckIns.map((c) => (c.checkInId === newCheckIn.checkInId ? newCheckIn : c))
          : [newCheckIn, ...prev.recentCheckIns.slice(0, 9)];

        const activeCount =
          newCheckIn.status !== 'Checked Out' && !exists
            ? prev.summary.activeInternsNow + 1
            : newCheckIn.status === 'Checked Out'
            ? Math.max(0, prev.summary.activeInternsNow - 1)
            : prev.summary.activeInternsNow;

        return {
          ...prev,
          recentCheckIns: updatedList,
          summary: {
            ...prev.summary,
            todayCheckIns: exists ? prev.summary.todayCheckIns : prev.summary.todayCheckIns + 1,
            activeInternsNow: activeCount,
          },
        };
      });
    };

    socket.on('activity_event', handleActivityEvent);
    socket.on('checkin_event', handleCheckInEvent);

    return () => {
      socket.off('activity_event', handleActivityEvent);
      socket.off('checkin_event', handleCheckInEvent);
    };
  }, [socket, isLivePaused]);

  // Acknowledge check-in handler
  const handleAcknowledge = async (checkInId: string) => {
    try {
      const res = await api.activity.acknowledgeCheckIn(checkInId);
      if (res.success) {
        setFeedbackToast('Check-in successfully acknowledged by administrator.');
        setTimeout(() => setFeedbackToast(null), 3000);
        setCheckInsList((prev) =>
          prev.map((c) => (c.checkInId === checkInId ? { ...c, adminAcknowledged: true } : c))
        );
      }
    } catch (err: any) {
      console.error('Error acknowledging check-in:', err);
    }
  };

  // Manual Check-in submit handler
  const handleManualCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.internId) return;

    setIsManualSubmitting(true);
    try {
      const res = await api.activity.adminLogCheckIn(manualForm);
      if (res.success) {
        setFeedbackToast(res.message || 'Check-in recorded successfully.');
        setTimeout(() => setFeedbackToast(null), 3500);
        setManualCheckInOpen(false);
        setManualForm({
          internId: '',
          status: 'Present',
          mode: 'Remote',
          projectId: '',
          focusToday: '',
          blockers: '',
          date: new Date().toISOString().split('T')[0],
        });
        await reloadAll();
      }
    } catch (err: any) {
      console.error('Error submitting manual check-in:', err);
    } finally {
      setIsManualSubmitting(false);
    }
  };

  // Prune old logs handler
  const handlePruneLogs = async (retainCount: number) => {
    try {
      const res = await api.activity.clearLogs(retainCount);
      if (res.success) {
        setFeedbackToast(res.message || 'Audit logs pruned successfully.');
        setTimeout(() => setFeedbackToast(null), 3500);
        setPruneModalOpen(false);
        await loadLogs(1);
      }
    } catch (err: any) {
      console.error('Error pruning logs:', err);
    }
  };

  // Helper formatting
  const getSeverityBadge = (severity: ActivitySeverity) => {
    switch (severity) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SUCCESS
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            WARN
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            INFO
          </span>
        );
    }
  };

  const getCategoryBadge = (category: ActivityCategory) => {
    switch (category) {
      case 'check_in':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
            CHECK-IN
          </span>
        );
      case 'project_update':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
            PROJECT
          </span>
        );
      case 'report_submission':
      case 'report_review':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            REPORT
          </span>
        );
      case 'security':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
            SECURITY
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            SYSTEM
          </span>
        );
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-950/80 rounded-xl border border-indigo-800/80 text-indigo-400 shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                <span>Activity Monitoring & Central Log Center</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Live intern check-in monitoring, project milestone updates, and centralized security audit trail
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Socket Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-400">Live Socket Gateway</span>
          </div>

          {/* Export Logs Button */}
          <a
            href={api.activity.exportLogsUrl('csv')}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            title="Download CSV audit logs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </a>

          {/* Manual Check-in Button */}
          <button
            onClick={() => setManualCheckInOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Check-In</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={reloadAll}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-50"
            title="Refresh logs & check-ins"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast message banner */}
      {feedbackToast && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Tab Navigation Switcher */}
      <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Monitoring Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('checkins')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'checkins'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4 text-sky-400" />
          <span>Intern Check-Ins</span>
          {dashboardData?.summary && dashboardData.summary.todayCheckIns > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
              {dashboardData.summary.todayCheckIns}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FolderKanban className="w-4 h-4 text-indigo-400" />
          <span>Project Updates</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Central Log Viewer</span>
          {logsTotal > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
              {logsTotal}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: EXECUTIVE MONITORING OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Primary Top KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Today's Check-ins */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Today's Check-Ins</span>
                <Clock className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white tabular-nums">
                  {dashboardData?.summary.todayCheckIns || 0}
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  {dashboardData?.summary.checkInRate || 0}% Attendance
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, dashboardData?.summary.checkInRate || 0)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                {dashboardData?.summary.activeInternsNow || 0} interns currently active on sprint
              </p>
            </div>

            {/* KPI 2: Live Active Interns */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Active Interns Online</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white tabular-nums">
                  {dashboardData?.summary.activeInternsNow || 0}
                </span>
                <span className="text-xs text-slate-400">
                  of {dashboardData?.summary.totalInterns || interns.length} total
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      dashboardData?.summary.totalInterns
                        ? Math.min(100, (dashboardData.summary.activeInternsNow / dashboardData.summary.totalInterns) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-500">Live pulse synced via Socket.IO</p>
            </div>

            {/* KPI 3: Project Progress Updates in 24h */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Project Updates (24h)</span>
                <FolderKanban className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white tabular-nums">
                  {dashboardData?.summary.projectUpdatesToday || 0}
                </span>
                <span className="text-xs text-indigo-300 font-medium">Milestones & Commits</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full rounded-full" style={{ width: '70%' }} />
              </div>
              <p className="text-[10px] text-slate-500">Tracking all project status changes</p>
            </div>

            {/* KPI 4: Security & Audit Health */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>System & Audit Health</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-400">Enforced</span>
                <span className="text-xs text-slate-400">
                  {dashboardData?.summary.criticalAlertsCount || 0} Alerts
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '100%' }} />
              </div>
              <p className="text-[10px] text-slate-500">Bcrypt salted authentication active</p>
            </div>
          </div>

          {/* 7-Day Activity Trend Bar */}
          {dashboardData?.activityTrend && dashboardData.activityTrend.length > 0 && (
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    7-Day Attendance & Project Update Cadence
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Real-time daily activity frequency</span>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-2">
                {dashboardData.activityTrend.map((t, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 block font-medium truncate">{t.date}</span>
                    <div className="flex items-center justify-center gap-2 text-xs font-bold tabular-nums">
                      <span className="text-sky-400" title="Check-Ins">{t.checkIns}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-indigo-400" title="Project Updates">{t.projectUpdates}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 block">in / upd</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dual Live Feeds: Intern Check-Ins & Project Updates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feed 1: Latest Intern Check-ins */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Live Intern Check-Ins Feed</h3>
                </div>
                <button
                  onClick={() => setActiveTab('checkins')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                >
                  <span>View All Check-Ins</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {(!dashboardData?.recentCheckIns || dashboardData.recentCheckIns.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-50" />
                  <p>No intern check-ins recorded for today yet.</p>
                  <button
                    onClick={() => setManualCheckInOpen(true)}
                    className="mt-2 text-indigo-400 hover:underline"
                  >
                    + Record a manual check-in entry
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentCheckIns.slice(0, 5).map((ci) => (
                    <div
                      key={ci.checkInId}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={ci.internName} size="xs" />
                          <div>
                            <span className="font-semibold text-white block">{ci.internName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{ci.internId}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              ci.status === 'Checked Out'
                                ? 'bg-slate-900 text-slate-400 border-slate-700'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            {ci.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(ci.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">FOCUS:</span>
                        <p className="line-clamp-2 leading-relaxed">{ci.focusToday}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5">
                          {ci.mode === 'Remote' ? (
                            <Laptop className="w-3 h-3 text-indigo-400" />
                          ) : ci.mode === 'Office' ? (
                            <Building className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <MapPin className="w-3 h-3 text-amber-400" />
                          )}
                          <span>{ci.mode}</span>
                          {ci.projectTitle && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="text-slate-300 truncate max-w-[150px]">{ci.projectTitle}</span>
                            </>
                          )}
                        </span>

                        {!ci.adminAcknowledged ? (
                          <button
                            onClick={() => handleAcknowledge(ci.checkInId)}
                            className="px-2 py-1 text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900/80 rounded border border-indigo-800 transition"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            ✓ Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Feed 2: Latest Project Updates */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Live Project Updates & Milestones</h3>
                </div>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                >
                  <span>View All Projects</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {(!dashboardData?.recentProjectUpdates || dashboardData.recentProjectUpdates.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  <FolderKanban className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-50" />
                  <p>No project updates recorded yet.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Updates appear in real time when project status, progress, or milestones change.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentProjectUpdates.slice(0, 5).map((log) => (
                    <div
                      key={log.logId}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-2 cursor-pointer"
                      onClick={() => setSelectedLogForDetail(log)}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{log.target?.title || 'Project'}</span>
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-900">
                            {log.target?.id || 'PRJ'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatTimeAgo(log.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-medium">{log.summary}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="text-slate-400">
                          By <strong className="text-slate-200">{log.actor?.name || 'User'}</strong> ({log.actor?.role})
                        </span>
                        <span className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERN CHECK-INS BOARD */}
      {activeTab === 'checkins' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={checkInSearch}
                  onChange={(e) => setCheckInSearch(e.target.value)}
                  placeholder="Search intern name, ID, or task..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={checkInStatusFilter}
                onChange={(e) => setCheckInStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Check-In Statuses</option>
                <option value="Present">Present</option>
                <option value="Working Remotely">Working Remotely</option>
                <option value="In Office">In Office</option>
                <option value="Checked Out">Checked Out</option>
              </select>

              {/* Date Filter */}
              <select
                value={checkInDateFilter}
                onChange={(e) => setCheckInDateFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="today">Today's Check-Ins</option>
                <option value="all">All Historical Dates</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-slate-400 text-xs tabular-nums">
                Showing <strong className="text-white">{checkInsList.length}</strong> records
              </span>
              <button
                onClick={() => setManualCheckInOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Check-in</span>
              </button>
            </div>
          </div>

          {/* Check-ins Table & Roster */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {checkInsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <Clock className="w-10 h-10 text-slate-700 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-300">No Check-Ins Found</p>
                <p className="text-slate-500 mt-1">No intern has checked in for the selected date or filter.</p>
                <button
                  onClick={() => setManualCheckInOpen(true)}
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-600 text-white font-semibold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Check-in</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Intern</th>
                      <th className="py-3 px-3">Working Mode</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4">Today's Focus & Sprint Task</th>
                      <th className="py-3 px-3">Project</th>
                      <th className="py-3 px-3">Check-In Time</th>
                      <th className="py-3 px-3">Logged Duration</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {checkInsList.map((ci) => (
                      <tr key={ci.checkInId} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={ci.internName} size="sm" />
                            <div>
                              <span className="font-bold text-white block">{ci.internName}</span>
                              <span className="text-[10px] font-mono text-indigo-400">{ci.internId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                            {ci.mode === 'Remote' ? (
                              <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                            ) : ci.mode === 'Office' ? (
                              <Building className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            <span>{ci.mode}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              ci.status === 'Checked Out'
                                ? 'bg-slate-900 text-slate-400 border-slate-700'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            {ci.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-200 line-clamp-2 leading-relaxed">{ci.focusToday}</p>
                          {ci.blockers && (
                            <span className="text-[10px] text-amber-400 block mt-0.5 font-medium">
                              Blocker: {ci.blockers}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="text-slate-300 font-medium block truncate max-w-[140px]">
                            {ci.projectTitle || 'General Sprint'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(ci.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-[10px] text-slate-500 block">{ci.dateString}</span>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                          {ci.status === 'Checked Out'
                            ? `${Math.floor((ci.durationMinutes || 0) / 60)}h ${(ci.durationMinutes || 0) % 60}m`
                            : 'In progress'}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {!ci.adminAcknowledged ? (
                            <button
                              onClick={() => handleAcknowledge(ci.checkInId)}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-800 rounded-lg transition cursor-pointer"
                            >
                              Acknowledge
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-400 font-medium flex items-center justify-end gap-1 font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Acknowledged</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT UPDATES TRACKER */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Project Milestone & Progress Updates</h2>
              <p className="text-xs text-slate-400">
                Audited timeline of project progress changes, task deliverables, and milestone achievements
              </p>
            </div>
            <span className="text-xs text-indigo-300 font-mono bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800">
              {projects.length} Total Projects
            </span>
          </div>

          {/* Active Projects Status & Progress Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <div key={proj.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-900 block mb-1 w-max">
                      {proj.id}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight">{proj.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    {proj.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <strong className="text-white tabular-nums">{proj.progress}%</strong>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        proj.progress >= 100 ? 'bg-emerald-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Assigned Interns: <strong className="text-slate-200">{proj.assignedInternIds.length}</strong></span>
                  <span className="text-[11px] font-mono text-slate-500">Deadline: {proj.deadline}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Live Stream of Project Update Logs */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Project Updates Audit Stream</span>
            </h3>

            <div className="space-y-2">
              {logs
                .filter((l) => l.category === 'project_update')
                .slice(0, 15)
                .map((log) => (
                  <div
                    key={log.logId}
                    onClick={() => setSelectedLogForDetail(log)}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-indigo-950 text-indigo-400 rounded-md">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-white block">{log.summary}</span>
                        <span className="text-[10px] text-slate-500">
                          {log.actor?.name} · {log.target?.title || log.target?.id}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-slate-400 block">{formatTimeAgo(log.timestamp)}</span>
                      <span className="text-[10px] text-indigo-400 hover:underline">Inspect</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CENTRAL LOG VIEWER (CONSOLE/TERMINAL GRADE) */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Filter by keyword, action ID, intern, project..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Time Range Selector */}
              <select
                value={logRangeFilter}
                onChange={(e) => setLogRangeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="today">Today's Logs</option>
                <option value="24h">Past 24 Hours</option>
                <option value="7d">Past 7 Days</option>
                <option value="all">Full Log Archive</option>
              </select>

              {/* Severity Filter */}
              <select
                value={logSeverityFilter}
                onChange={(e) => setLogSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Severities</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>

              {/* Live Pause / Resume Toggle */}
              <button
                type="button"
                onClick={() => setIsLivePaused(!isLivePaused)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isLivePaused
                    ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                    : 'bg-slate-950 border-slate-700 text-emerald-400'
                }`}
              >
                {isLivePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isLivePaused ? 'Stream Paused' : 'Live Stream'}</span>
              </button>

              {/* Prune Logs Button */}
              <button
                type="button"
                onClick={() => setPruneModalOpen(true)}
                className="p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Archive maintenance & prune logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[11px] text-slate-500 font-semibold mr-1">CATEGORY:</span>
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'check_in', label: 'Intern Check-Ins' },
                { id: 'project_update', label: 'Project Updates' },
                { id: 'report_submission', label: 'Submissions' },
                { id: 'report_review', label: 'Reviews' },
                { id: 'security', label: 'Security & Auth' },
                { id: 'system', label: 'System' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setLogCategoryFilter(c.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    logCategoryFilter === c.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Central Terminal / Log Viewer Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <Terminal className="w-10 h-10 text-slate-700 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-300">No Activity Logs Found</p>
                <p className="text-slate-500 mt-1">No activity matches the current category or search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Actor</th>
                      <th className="py-2.5 px-4 font-sans font-semibold">Summary & Event Details</th>
                      <th className="py-2.5 px-3 text-right font-sans">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {logs.map((log) => (
                      <tr
                        key={log.logId}
                        onClick={() => setSelectedLogForDetail(log)}
                        className="hover:bg-slate-800/40 transition cursor-pointer group"
                      >
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(log.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {getSeverityBadge(log.severity)}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {getCategoryBadge(log.category)}
                        </td>

                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-300 whitespace-nowrap">
                          {log.action}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-xs font-semibold text-white block">{log.actor?.name || 'System'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.actor?.id}</span>
                        </td>

                        <td className="py-2.5 px-4 max-w-md">
                          <p className="text-xs text-slate-200 line-clamp-1 leading-snug">{log.summary}</p>
                          {log.target?.title && (
                            <span className="text-[10px] text-slate-500 block truncate">
                              Target: {log.target.title} ({log.target.id})
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            className="p-1.5 text-slate-400 group-hover:text-indigo-300 group-hover:bg-indigo-950/60 rounded transition"
                            title="Inspect log JSON payload"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Total <strong className="text-white">{logsTotal}</strong> activity records recorded
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadLogs(Math.max(1, logPage - 1))}
                  disabled={logPage <= 1}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:text-white disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="font-mono text-slate-300">Page {logPage}</span>
                <button
                  onClick={() => loadLogs(logPage + 1)}
                  disabled={logs.length < 40}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOG INSPECTOR DETAIL MODAL */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-950 rounded-lg text-indigo-400 border border-indigo-800">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Audit Log Event Details</span>
                    <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                      {selectedLogForDetail.logId}
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(selectedLogForDetail.timestamp).toISOString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Event summary banner */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(selectedLogForDetail.severity)}
                  {getCategoryBadge(selectedLogForDetail.category)}
                  <span className="font-mono text-slate-400 text-[10px]">{selectedLogForDetail.action}</span>
                </div>
                <p className="text-sm font-semibold text-white pt-1">{selectedLogForDetail.summary}</p>
              </div>

              {/* Actor & Target Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">ACTOR</span>
                  <div className="font-bold text-white text-xs">{selectedLogForDetail.actor?.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedLogForDetail.actor?.id} ({selectedLogForDetail.actor?.role})
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">TARGET ENTITY</span>
                  <div className="font-bold text-white text-xs">
                    {selectedLogForDetail.target?.title || 'System'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Type: {selectedLogForDetail.target?.type || 'n/a'} ({selectedLogForDetail.target?.id || 'none'})
                  </div>
                </div>
              </div>

              {/* Structured Details JSON */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">STRUCTURED PAYLOAD (JSON):</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedLogForDetail, null, 2));
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied' : 'Copy Payload'}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-indigo-300 overflow-x-auto max-h-60 leading-relaxed">
                  {JSON.stringify(selectedLogForDetail, null, 2)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL CHECK-IN MODAL (ADMIN ACTION) */}
      {manualCheckInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Record Check-in on Behalf of Intern</h3>
              </div>
              <button onClick={() => setManualCheckInOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualCheckInSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Select Intern</label>
                <select
                  value={manualForm.internId}
                  onChange={(e) => setManualForm({ ...manualForm, internId: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Choose an active intern...</option>
                  {interns.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.fullName} ({i.id}) · {i.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Working Mode</label>
                  <select
                    value={manualForm.mode}
                    onChange={(e) => setManualForm({ ...manualForm, mode: e.target.value as WorkMode })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Office">Office</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Attendance Status</label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as CheckInStatus })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Present">Present</option>
                    <option value="Working Remotely">Working Remotely</option>
                    <option value="In Office">In Office</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Associated Project (Optional)</label>
                <select
                  value={manualForm.projectId}
                  onChange={(e) => setManualForm({ ...manualForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select project (or general sprint)...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Focus of the Day & Sprint Task</label>
                <textarea
                  value={manualForm.focusToday}
                  onChange={(e) => setManualForm({ ...manualForm, focusToday: e.target.value })}
                  required
                  rows={2}
                  placeholder="Summary of daily planned focus..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setManualCheckInOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isManualSubmitting || !manualForm.internId || !manualForm.focusToday}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition"
                >
                  {isManualSubmitting ? 'Recording...' : 'Record Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRUNE LOGS ARCHIVE MODAL */}
      {pruneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Trash2 className="w-4 h-4" />
              <span>Prune Audit Logs Archive</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Maintain optimal database performance by retaining the most recent records and clearing older archival logs.
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handlePruneLogs(50)}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-left flex items-center justify-between transition cursor-pointer"
              >
                <span>Retain latest 50 logs</span>
                <span className="text-[10px] text-slate-500 font-mono">Recommended</span>
              </button>
              <button
                type="button"
                onClick={() => handlePruneLogs(100)}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-left flex items-center justify-between transition cursor-pointer"
              >
                <span>Retain latest 100 logs</span>
                <span className="text-[10px] text-slate-500 font-mono">Extended</span>
              </button>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPruneModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
