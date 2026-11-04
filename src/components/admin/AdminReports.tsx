import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  MessageSquare,
  Sparkles,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReportSubmission, ReportStatus, ReportFile } from '../../types';
import { StatusBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { FilePreviewModal } from '../common/FilePreviewModal';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface AdminReportsProps {
  initialReportId?: string;
}

export const AdminReports: React.FC<AdminReportsProps> = ({ initialReportId }) => {
  const { reports, projects, interns, reviewReport, exportExcel } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [internFilter, setInternFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [weekFilter, setWeekFilter] = useState('All');

  // Review modal
  const [reviewingReport, setReviewingReport] = useState<ReportSubmission | null>(
    initialReportId ? reports.find((r) => r.id === initialReportId) || null : null
  );
  const [reviewComments, setReviewComments] = useState('');
  const [reviewAction, setReviewAction] = useState<ReportStatus>('Approved');
  const [previewFile, setPreviewFile] = useState<ReportFile | null>(null);

  const handleOpenReview = (report: ReportSubmission) => {
    setReviewingReport(report);
    setReviewComments(report.reviewComments || '');
    setReviewAction(report.status === 'Draft' ? 'Under Review' : report.status === 'Approved' ? 'Approved' : 'Approved');
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingReport) return;
    reviewReport(reviewingReport.id, reviewAction, reviewComments);
    setReviewingReport(null);
    setReviewComments('');
  };

  // Filter reports
  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase();
    const intern = interns.find((i) => i.id === r.internId);
    const project = projects.find((p) => p.id === r.projectId);

    const matchesSearch =
      r.title.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (intern && intern.fullName.toLowerCase().includes(q)) ||
      (project && project.name.toLowerCase().includes(q));

    const matchesProject = projectFilter === 'All' || r.projectId === projectFilter;
    const matchesIntern = internFilter === 'All' || r.internId === internFilter;
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesMonth = monthFilter === 'All' || r.month === monthFilter;
    const matchesWeek = weekFilter === 'All' || String(r.weekNumber) === weekFilter;

    return (
      matchesSearch &&
      matchesProject &&
      matchesIntern &&
      matchesStatus &&
      matchesMonth &&
      matchesWeek
    );
  });

  const getIntern = (id: string) => interns.find((i) => i.id === id);
  const getProject = (id: string) => projects.find((p) => p.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Report Review Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit deliverables, inspect submitted attachments, and provide evaluated feedback
          </p>
        </div>

        {/* Excel Export & Stats */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportExcel('weekly-reports')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Download Weekly Reports Ledger with full task details into Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Weekly Excel</span>
          </button>

          <button
            onClick={() => exportExcel('monthly-reports')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Download Monthly Performance Aggregates into Excel"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Monthly Excel</span>
          </button>

          <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 tabular-nums">
            {reports.length} Total Submissions
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report titles, authors..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer truncate"
          >
            <option value="All" className="bg-slate-900">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Intern Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={internFilter}
            onChange={(e) => setInternFilter(e.target.value)}
            className="w-full bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer truncate"
          >
            <option value="All" className="bg-slate-900">All Interns</option>
            {interns.map((i) => (
              <option key={i.id} value={i.id} className="bg-slate-900">
                {i.fullName} ({i.id})
              </option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer truncate"
          >
            <option value="All" className="bg-slate-900">All Months</option>
            {MONTHS.map((m) => (
              <option key={m} value={m} className="bg-slate-900">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Week Filter & Status Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="w-full bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-900">All Weeks</option>
            <option value="1" className="bg-slate-900">Week 1 (1–7)</option>
            <option value="2" className="bg-slate-900">Week 2 (8–14)</option>
            <option value="3" className="bg-slate-900">Week 3 (15–21)</option>
            <option value="4" className="bg-slate-900">Week 4 (22–28)</option>
            <option value="5" className="bg-slate-900">Week 5 (29+)</option>
          </select>
        </div>
      </div>

      {/* Status Bar Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['All', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Draft'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              statusFilter === st
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {st === 'All' ? 'All Statuses' : st}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Reports Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria, month, or week filter options above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const intern = getIntern(report.internId);
            const project = getProject(report.projectId);

            return (
              <div
                key={report.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition shadow-sm space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={intern ? intern.fullName : report.internId} size="md" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{report.title}</h3>
                        <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-900 tabular-nums">
                          {report.id}
                        </span>
                        {report.month && report.weekNumber && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                            {report.month} · Week {report.weekNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Author:{' '}
                        <strong className="text-slate-200">
                          {intern ? intern.fullName : report.internId}
                        </strong>{' '}
                        · Project: <span className="text-indigo-300">{project ? project.name : report.projectId}</span>
                        {report.submittedAt && (
                          <span className="text-slate-500 ml-2">
                            · Submitted {new Date(report.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={report.status} />
                    <button
                      onClick={() => handleOpenReview(report)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Evaluate & Review</span>
                    </button>
                  </div>
                </div>

                {/* Completed Activities preview if available */}
                {report.completedActivities && (
                  <div className="text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-indigo-400 font-semibold block text-[11px] mb-1">
                      Completed Activities:
                    </span>
                    <p className="text-slate-300 font-mono text-[11px] whitespace-pre-wrap line-clamp-2">
                      {report.completedActivities}
                    </p>
                  </div>
                )}

                {/* Summary */}
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 line-clamp-2">
                  {report.workSummary}
                </p>

                {/* Attachments & Metrics */}
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
                      <span className="text-slate-500 italic">None attached</span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    Reported Progress: <strong className="text-white">{report.progressPercentage}%</strong>
                  </span>
                </div>

                {/* Existing Review Feedback */}
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

      {/* EVALUATION / REVIEW MODAL */}
      {reviewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{reviewingReport.title}</h3>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {reviewingReport.id} · Submitted by {getIntern(reviewingReport.internId)?.fullName || reviewingReport.internId}
                </span>
              </div>
              <button
                onClick={() => setReviewingReport(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Reporting Period Info */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Reporting Window:</span>
                <span className="font-semibold text-slate-200">
                  {reviewingReport.month || 'Current Month'} · Week {reviewingReport.weekNumber || 1}
                  {reviewingReport.weekStartDate && reviewingReport.weekEndDate && (
                    <span className="text-slate-400 font-mono ml-2">
                      ({reviewingReport.weekStartDate} to {reviewingReport.weekEndDate})
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Reported Progress:</span>
                <span className="font-bold text-indigo-400 font-mono tabular-nums">
                  {reviewingReport.progressPercentage}%
                </span>
              </div>
            </div>

            {/* Completed Activities */}
            {reviewingReport.completedActivities && (
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  Completed Activities & Milestones:
                </span>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {reviewingReport.completedActivities}
                </div>
              </div>
            )}

            {/* Work Summary */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">Work Summary:</span>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {reviewingReport.workSummary}
              </div>
            </div>

            {/* Challenges & Next Week Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {reviewingReport.challengesFaced && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Challenges Faced:</span>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
                    {reviewingReport.challengesFaced}
                  </div>
                </div>
              )}
              {reviewingReport.nextWeekPlan && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Next Week Deliverables:</span>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
                    {reviewingReport.nextWeekPlan}
                  </div>
                </div>
              )}
            </div>

            {/* File Attachments */}
            {reviewingReport.files && reviewingReport.files.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Attached Deliverables ({reviewingReport.files.length}):
                </span>
                <div className="space-y-1.5">
                  {reviewingReport.files.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="text-slate-200 font-medium truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="px-2 py-1 text-xs text-indigo-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
                      >
                        Preview / Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Form */}
            <form onSubmit={handleSaveReview} className="space-y-4 pt-3 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Evaluation Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Approved', 'Under Review', 'Rejected'] as ReportStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setReviewAction(status)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        reviewAction === status
                          ? status === 'Approved'
                            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                            : status === 'Rejected'
                            ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                            : 'bg-amber-950/80 border-amber-600 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {status === 'Approved' && <CheckCircle className="w-3.5 h-3.5" />}
                      {status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                      {status === 'Under Review' && <Clock className="w-3.5 h-3.5" />}
                      <span>{status}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Supervisor Evaluation Notes & Feedback
                </label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Provide constructive feedback, next steps, or sign-off approval..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingReport(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/30"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
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
