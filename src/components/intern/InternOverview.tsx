import React from 'react';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  FileCheck2,
  FileClock,
  ArrowRight,
  Calendar,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { InternCheckInWidget } from './InternCheckInWidget';

interface InternOverviewProps {
  onNavigate: (view: string, contextId?: string) => void;
}

export const InternOverview: React.FC<InternOverviewProps> = ({ onNavigate }) => {
  const { currentIntern, projects, reports, interns } = useApp();

  if (!currentIntern) return null;

  // Only projects assigned to this logged in intern!
  const myProjects = projects.filter((p) => p.assignedInternIds.includes(currentIntern.id));

  // Reports submitted by this intern
  const myReports = reports.filter((r) => r.internId === currentIntern.id);

  const stats = {
    totalAssigned: myProjects.length,
    activeProjects: myProjects.filter((p) => p.status === 'In Progress' || p.status === 'Planning').length,
    completedProjects: myProjects.filter((p) => p.status === 'Completed').length,
    submittedReports: myReports.filter((r) => r.status !== 'Draft').length,
    pendingReports: myReports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review').length,
  };

  const getInternName = (id: string) => {
    const found = interns.find((i) => i.id === id);
    return found ? found.fullName : id;
  };

  const [domainFilter, setDomainFilter] = React.useState('All');

  const filteredProjects = myProjects.filter((p) => {
    if (domainFilter === 'All') return true;
    return p.domainId === domainFilter || p.category === domainFilter;
  });

  const domainsList = Array.from(new Set(myProjects.map((p) => p.category)));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-900/40 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={currentIntern.fullName} size="lg" />
            <div>
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
                Intern Workspace
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Welcome back, {currentIntern.fullName}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentIntern.designation} · {currentIntern.department} ({currentIntern.id})
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('submit_report')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition cursor-pointer self-start sm:self-auto"
          >
            <span>+ Submit Work Report</span>
          </button>
        </div>
      </div>

      {/* Daily Check-In & Standup Widget */}
      <InternCheckInWidget />

      {/* 5 KPI Stat Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Assigned */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Assigned Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.totalAssigned}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Active on your roster</span>
        </div>

        {/* Active Projects */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Active Projects</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.activeProjects}</div>
          <span className="text-[10px] text-sky-400/90 mt-1 block">In development</span>
        </div>

        {/* Completed */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.completedProjects}</div>
          <span className="text-[10px] text-emerald-400/90 mt-1 block">Delivered & verified</span>
        </div>

        {/* Submitted Reports */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Submitted Reports</span>
            <FileCheck2 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{stats.submittedReports}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Total deliverables</span>
        </div>

        {/* Pending Reports */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Under Review</span>
            <FileClock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tabular-nums">{stats.pendingReports}</div>
          <span className="text-[10px] text-amber-400/90 mt-1 block">Awaiting supervisor</span>
        </div>
      </div>

      {/* ASSIGNED PROJECTS SECTION (Section 6.C) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Your Assigned Projects</h2>
            <p className="text-xs text-slate-400">
              Only initiatives officially allocated to your profile by the Administrator
            </p>
          </div>
          <div className="flex items-center gap-2">
            {domainsList.length > 1 && (
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                <option value="All">All Domains</option>
                {domainsList.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom}
                  </option>
                ))}
              </select>
            )}
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {filteredProjects.length} Initiatives
            </span>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No initiatives match the selected domain filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[10px] text-indigo-400 font-semibold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900 tabular-nums">
                      {project.id}
                    </span>
                    <StatusBadge status={project.status} />
                  </div>

                  <span className="text-[11px] text-indigo-300 font-medium block truncate mb-1">
                    {project.category}
                  </span>

                  <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Progress */}
                  <div className="space-y-1 mt-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Completion</span>
                      <span className="text-slate-200 font-medium tabular-nums">{project.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Assigned Start:</span>
                      <span className="tabular-nums text-slate-300 font-mono">{project.startDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Submission Due:</span>
                      <span className="tabular-nums text-slate-300 font-mono">{project.deadline}</span>
                    </div>
                  </div>
                </div>

                {/* Team Members & View Button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center -space-x-1.5">
                    {project.assignedInternIds.slice(0, 3).map((id) => (
                      <Avatar key={id} name={getInternName(id)} size="xs" />
                    ))}
                    {project.assignedInternIds.length > 3 && (
                      <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-[10px] flex items-center justify-center text-slate-300 tabular-nums">
                        +{project.assignedInternIds.length - 3}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigate('project_details', project.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <span>View Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT SUBMISSIONS HISTORY SNIPPET */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white">Your Recent Deliverables & Review Status</h2>
            <p className="text-xs text-slate-400">Track supervisor feedback on submitted reports</p>
          </div>
          <button
            onClick={() => onNavigate('my_submissions')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            All Submissions ({myReports.length}) →
          </button>
        </div>

        {myReports.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            You haven't submitted any reports yet. Use the "Submit Work Report" button to record your progress.
          </div>
        ) : (
          <div className="space-y-2.5">
            {myReports.slice(0, 3).map((rep) => (
              <div
                key={rep.id}
                onClick={() => onNavigate('my_submissions')}
                className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 rounded-lg flex items-center justify-between gap-3 transition cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{rep.title}</span>
                    <span className="font-mono text-[10px] text-slate-500 tabular-nums">{rep.id}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Submitted: {new Date(rep.submittedAt).toLocaleDateString()} · Progress reported: {rep.progressPercentage}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={rep.status} />
                  <span className="text-xs text-indigo-400 hover:underline">Details</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
