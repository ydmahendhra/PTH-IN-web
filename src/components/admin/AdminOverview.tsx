import React from 'react';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  Users,
  UserCheck,
  UserPlus,
  FileCheck,
  FileClock,
  ArrowRight,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';

interface AdminOverviewProps {
  onNavigate: (view: string, contextId?: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const { stats, projects, reports, interns } = useApp();

  const recentProjects = projects.slice(0, 4);
  const pendingReports = reports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review');

  const getInternName = (id: string) => {
    const found = interns.find((i) => i.id === id);
    return found ? found.fullName : id;
  };

  const getProjectName = (id: string) => {
    const found = projects.find((p) => p.id === id);
    return found ? found.name : id;
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Organization Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time project velocity, intern availability, and review metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('activity')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-800 shadow-sm transition cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Activity & Logs</span>
          </button>
          <button
            onClick={() => onNavigate('projects_new')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
          >
            <span>+ Create Project</span>
          </button>
          <button
            onClick={() => onNavigate('interns_new')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <span>+ Register Intern</span>
          </button>
          <button
            onClick={() => onNavigate('assign')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <span>Assign Projects</span>
          </button>
        </div>
      </div>

      {/* 8 DYNAMIC KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Projects */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.totalProjects}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">In repository</span>
        </div>

        {/* Active Projects */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Active Projects</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.activeProjects}</div>
          <span className="text-[11px] text-sky-400/90 mt-1 block">In progress & planning</span>
        </div>

        {/* Completed Projects */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Completed Projects</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.completedProjects}</div>
          <span className="text-[11px] text-emerald-400/90 mt-1 block">Successfully signed off</span>
        </div>

        {/* Total Interns */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Interns</span>
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.totalInterns}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active directory</span>
        </div>

        {/* Available Interns */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Available Interns</span>
            <UserPlus className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">{stats.availableInterns}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Ready for assignment</span>
        </div>

        {/* Assigned Interns */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Assigned Interns</span>
            <UserCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.assignedInterns}</div>
          <span className="text-[11px] text-indigo-400/90 mt-1 block">Active on projects</span>
        </div>

        {/* Pending Reports */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Pending Reports</span>
            <FileClock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tabular-nums">{stats.pendingReports}</div>
          <span className="text-[11px] text-amber-400/90 mt-1 block">Awaiting admin review</span>
        </div>

        {/* Submitted Reports */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Submitted Reports</span>
            <FileCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.submittedReports}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Cumulative submissions</span>
        </div>
      </div>

      {/* Two Column Section: Recent Projects & Pending Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Projects Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white">Active Projects</h2>
              <p className="text-[11px] text-slate-400">Current initiatives & completion status</p>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onNavigate('project_details', project.id)}
                className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 rounded-lg transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="font-mono text-[10px] text-indigo-400 block tabular-nums">
                      {project.id}
                    </span>
                    <h3 className="text-xs font-semibold text-slate-200 hover:text-white line-clamp-1">
                      {project.name}
                    </h3>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center -space-x-1.5">
                    {project.assignedInternIds.slice(0, 3).map((id) => (
                      <Avatar key={id} name={getInternName(id)} size="xs" />
                    ))}
                    {project.assignedInternIds.length > 3 && (
                      <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-[10px] flex items-center justify-center text-slate-300 tabular-nums">
                        +{project.assignedInternIds.length - 3}
                      </span>
                    )}
                    {project.assignedInternIds.length === 0 && (
                      <span className="text-[11px] text-slate-500 italic">No interns assigned</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] tabular-nums text-slate-400">
                      {project.progress}% Done
                    </span>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reports Pending Review */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white">Pending Reports for Review</h2>
              <p className="text-[11px] text-slate-400">Deliverables submitted by interns</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>All Reports ({reports.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingReports.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              <span>All submitted reports have been reviewed!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReports.slice(0, 4).map((report) => (
                <div
                  key={report.id}
                  onClick={() => onNavigate('reports')}
                  className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 rounded-lg transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Avatar name={getInternName(report.internId)} size="xs" />
                      <div>
                        <span className="text-xs font-semibold text-slate-200">
                          {getInternName(report.internId)}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                          {getProjectName(report.projectId)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>

                  <p className="text-xs text-slate-300 mt-2 line-clamp-1 font-medium">
                    {report.title}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="tabular-nums">
                      {new Date(report.submittedAt).toLocaleDateString()}
                    </span>
                    <span className="text-indigo-400 hover:text-indigo-300 font-medium">
                      Review Submission →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
