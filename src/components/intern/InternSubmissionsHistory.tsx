import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  FileClock,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReportSubmission, ReportFile } from '../../types';
import { StatusBadge } from '../common/Badge';
import { FilePreviewModal } from '../common/FilePreviewModal';

interface InternSubmissionsHistoryProps {
  onNewSubmission: () => void;
}

export const InternSubmissionsHistory: React.FC<InternSubmissionsHistoryProps> = ({
  onNewSubmission,
}) => {
  const { currentIntern, reports, projects } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState<ReportSubmission | null>(null);
  const [previewFile, setPreviewFile] = useState<ReportFile | null>(null);

  if (!currentIntern) return null;

  // Filter to only this intern's reports
  const myReports = reports.filter((r) => r.internId === currentIntern.id);

  const filteredReports = myReports.filter((r) => {
    const q = searchQuery.toLowerCase();
    const project = projects.find((p) => p.id === r.projectId);
    const matchesSearch =
      r.title.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (project && project.name.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProject = (id: string) => projects.find((p) => p.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">My Submissions & Deliverables</h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical audit log of all sprint summaries, draft deliverables, and supervisor sign-offs
          </p>
        </div>

        <button
          onClick={onNewSubmission}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition cursor-pointer self-start sm:self-auto"
        >
          <span>+ Submit New Report</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your submissions by title or project..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-900">All Statuses</option>
            <option value="Submitted" className="bg-slate-900">Submitted</option>
            <option value="Under Review" className="bg-slate-900">Under Review</option>
            <option value="Approved" className="bg-slate-900">Approved</option>
            <option value="Rejected" className="bg-slate-900">Rejected</option>
            <option value="Draft" className="bg-slate-900">Drafts</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Submissions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't logged any deliverables matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const project = getProject(report.projectId);

            return (
              <div
                key={report.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{report.title}</h3>
                      <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900 tabular-nums">
                        {report.id}
                      </span>
                      {report.month && report.weekNumber && (
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                          {report.month} · Week {report.weekNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      Project: <strong className="text-slate-200">{project ? project.name : report.projectId}</strong> · Submitted on {new Date(report.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={report.status} />
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
                    >
                      Inspect Details
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 line-clamp-3">
                  {report.workSummary}
                </p>

                {/* Attachments & Supervisor Feedback */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500">Attachments:</span>
                    {report.files && report.files.length > 0 ? (
                      report.files.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setPreviewFile(f)}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-indigo-400" />
                          <span className="truncate max-w-[140px]">{f.name}</span>
                        </button>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    Self-Reported Progress: <strong className="text-white">{report.progressPercentage}%</strong>
                  </span>
                </div>

                {/* Supervisor Review Comments if reviewed */}
                {report.reviewComments && (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-900/60 rounded-lg text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Review by Supervisor ({report.reviewedBy}):</span>
                    </div>
                    <p className="text-slate-300 italic">"{report.reviewComments}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedReport.title}</h3>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {selectedReport.id} · Status: {selectedReport.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Reporting Period Info */}
              {(selectedReport.month || selectedReport.weekNumber) && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block">Reporting Window:</span>
                    <span className="font-semibold text-slate-200">
                      {selectedReport.month} · Week {selectedReport.weekNumber}
                      {selectedReport.weekStartDate && selectedReport.weekEndDate && (
                        <span className="text-slate-400 font-mono ml-2">
                          ({selectedReport.weekStartDate} to {selectedReport.weekEndDate})
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Self-Reported Progress:</span>
                    <span className="font-bold text-indigo-400 font-mono tabular-nums">
                      {selectedReport.progressPercentage}%
                    </span>
                  </div>
                </div>
              )}

              {/* Completed Activities */}
              {selectedReport.completedActivities && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Completed Activities & Tasks:</span>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                    {selectedReport.completedActivities}
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Work Summary:</span>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {selectedReport.workSummary}
                </div>
              </div>

              {/* Challenges & Next Week Plan */}
              {(selectedReport.challengesFaced || selectedReport.nextWeekPlan) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedReport.challengesFaced && (
                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">Challenges Faced:</span>
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                        {selectedReport.challengesFaced}
                      </div>
                    </div>
                  )}
                  {selectedReport.nextWeekPlan && (
                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">Next Week Planned:</span>
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                        {selectedReport.nextWeekPlan}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedReport.reviewComments && (
                <div className="p-3 bg-indigo-950/50 border border-indigo-800 rounded-lg">
                  <span className="font-semibold text-indigo-300 block mb-1">
                    Supervisor Comments ({selectedReport.reviewedBy}):
                  </span>
                  <p className="text-slate-200 leading-relaxed italic">
                    "{selectedReport.reviewComments}"
                  </p>
                </div>
              )}

              {selectedReport.files && selectedReport.files.length > 0 && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-2">Attached Deliverables:</span>
                  <div className="space-y-1.5">
                    {selectedReport.files.map((file) => (
                      <div
                        key={file.id}
                        className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          <span className="text-slate-200 font-medium truncate">{file.name}</span>
                        </div>
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="px-2 py-1 text-xs text-indigo-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded"
                        >
                          View / Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-1.5 text-xs text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
};
