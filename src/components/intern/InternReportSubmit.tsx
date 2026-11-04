import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Save,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReportFile, ReportStatus } from '../../types';

interface InternReportSubmitProps {
  initialProjectId?: string;
  onNavigateHistory: () => void;
  onSubmissionSuccess?: (reportId: string) => void;
}

interface WeekOption {
  weekNumber: number;
  label: string;
  startDate: string;
  endDate: string;
  dateRangeStr: string;
}

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

export const InternReportSubmit: React.FC<InternReportSubmitProps> = ({
  initialProjectId,
  onNavigateHistory,
  onSubmissionSuccess,
}) => {
  const { currentIntern, projects, reports, submitReport } = useApp();

  // Assigned projects for this intern
  const myProjects = projects.filter(
    (p) => currentIntern && p.assignedInternIds.includes(currentIntern.id)
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || (myProjects.length > 0 ? myProjects[0].id : '')
  );

  // Calendar Period selection
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(
    MONTHS[currentDate.getMonth()]
  );
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1);

  // Calculate weeks for the selected month and year
  const reportingWeeks = useMemo<WeekOption[]>(() => {
    const monthIndex = MONTHS.indexOf(selectedMonth);
    const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();

    const weeks: WeekOption[] = [
      {
        weekNumber: 1,
        label: 'Week 1',
        startDate: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-01`,
        endDate: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-07`,
        dateRangeStr: `${selectedMonth} 1 – 7`,
      },
      {
        weekNumber: 2,
        label: 'Week 2',
        startDate: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-08`,
        endDate: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-14`,
        dateRangeStr: `${selectedMonth} 8 – 14`,
      },
      {
        weekNumber: 3,
        label: 'Week 3',
        startDate: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-15`,
        endDate: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-21`,
        dateRangeStr: `${selectedMonth} 15 – 21`,
      },
      {
        weekNumber: 4,
        label: 'Week 4',
        startDate: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-22`,
        endDate: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-28`,
        dateRangeStr: `${selectedMonth} 22 – 28`,
      },
    ];

    if (daysInMonth > 28) {
      weeks.push({
        weekNumber: 5,
        label: 'Week 5',
        startDate: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-29`,
        endDate: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`,
        dateRangeStr: `${selectedMonth} 29 – ${daysInMonth}`,
      });
    }

    return weeks;
  }, [selectedYear, selectedMonth]);

  const activeWeek = useMemo(() => {
    return (
      reportingWeeks.find((w) => w.weekNumber === selectedWeekNumber) ||
      reportingWeeks[0]
    );
  }, [reportingWeeks, selectedWeekNumber]);

  // Check if an existing report exists for this project, month, year, and week
  const existingReport = useMemo(() => {
    if (!currentIntern || !selectedProjectId) return null;
    return (
      reports.find(
        (r) =>
          r.internId === currentIntern.id &&
          r.projectId === selectedProjectId &&
          r.year === selectedYear &&
          r.month === selectedMonth &&
          r.weekNumber === selectedWeekNumber
      ) || null
    );
  }, [currentIntern, selectedProjectId, selectedYear, selectedMonth, selectedWeekNumber, reports]);

  // Form Fields
  const [reportTitle, setReportTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workSummary, setWorkSummary] = useState('');
  const [completedActivities, setCompletedActivities] = useState('');
  const [challengesFaced, setChallengesFaced] = useState('');
  const [nextWeekPlan, setNextWeekPlan] = useState('');
  const [progressPercentage, setProgressPercentage] = useState<number>(50);

  // Files
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Array<{ name: string; size: number; type: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status feedback
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-populate or default title when week or project changes
  useEffect(() => {
    const project = myProjects.find((p) => p.id === selectedProjectId);
    if (!reportTitle || reportTitle.startsWith('Weekly Progress Report')) {
      const projName = project ? project.name : 'Project';
      setReportTitle(
        `Weekly Progress Report - ${selectedMonth} ${activeWeek.label} (${projName})`
      );
    }
  }, [selectedProjectId, selectedMonth, activeWeek]);

  // Load existing report data if present
  const handleLoadExisting = () => {
    if (!existingReport) return;
    setReportTitle(existingReport.title || '');
    setDescription(existingReport.description || '');
    setWorkSummary(existingReport.workSummary || '');
    setCompletedActivities(existingReport.completedActivities || '');
    setChallengesFaced(existingReport.challengesFaced || '');
    setNextWeekPlan(existingReport.nextWeekPlan || '');
    setProgressPercentage(existingReport.progressPercentage || 50);
  };

  if (!currentIntern) return null;

  // File upload handler supporting PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    setErrorMessage('');

    const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png)$/i;
    const newFiles: File[] = [];
    const newPreviews: Array<{ name: string; size: number; type: string }> = [];

    Array.from(files).forEach((file) => {
      if (!allowedExtensions.test(file.name)) {
        setErrorMessage(
          `File "${file.name}" is not supported. Please upload PDF, DOC, DOCX, XLS, XLSX, JPG, or PNG files.`
        );
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage(`File "${file.name}" exceeds the 25MB limit.`);
        return;
      }
      newFiles.push(file);
      newPreviews.push({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      });
    });

    setRawFiles((prev) => [...prev, ...newFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setRawFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (isDraft: boolean) => {
    setErrorMessage('');
    if (!selectedProjectId) {
      setErrorMessage('Please select a project for this report.');
      return;
    }
    if (!reportTitle.trim()) {
      setErrorMessage('Report title is required.');
      return;
    }
    if (!workSummary.trim() && !isDraft) {
      setErrorMessage('Please provide a work summary before submitting for review.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('projectId', selectedProjectId);
      formData.append('reportTitle', reportTitle.trim());
      formData.append('description', description.trim());
      formData.append('workSummary', workSummary.trim());
      formData.append('completedActivities', completedActivities.trim());
      formData.append('challengesFaced', challengesFaced.trim());
      formData.append('nextWeekPlan', nextWeekPlan.trim());
      formData.append('workProgress', progressPercentage.toString());
      formData.append('month', selectedMonth);
      formData.append('year', selectedYear.toString());
      formData.append('weekNumber', selectedWeekNumber.toString());
      formData.append('weekStartDate', activeWeek.startDate);
      formData.append('weekEndDate', activeWeek.endDate);
      formData.append('isDraft', isDraft ? 'true' : 'false');

      if (existingReport) {
        formData.append('existingReportId', existingReport.id);
      }

      // Append attached files
      rawFiles.forEach((file) => {
        formData.append('files', file);
      });

      const result = await submitReport(formData);

      setSuccessStatus(
        isDraft
          ? 'Draft successfully saved to MongoDB. You can complete and submit it anytime from your submissions history.'
          : `Report for ${selectedMonth} ${activeWeek.label} successfully submitted to the Admin supervisor! Status: Submitted.`
      );

      // Reset form if submitted
      if (!isDraft) {
        setDescription('');
        setWorkSummary('');
        setCompletedActivities('');
        setChallengesFaced('');
        setNextWeekPlan('');
        setRawFiles([]);
        setFilePreviews([]);
      }

      if (onSubmissionSuccess && result) {
        onSubmissionSuccess(result.reportId || result.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Project Report Submission</h1>
          <p className="text-xs text-slate-400 mt-1">
            Log sprint deliverables, calendar week metrics, technical summaries, and upload deliverable attachments
          </p>
        </div>

        <button
          onClick={onNavigateHistory}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer self-start sm:self-auto"
        >
          <History className="w-3.5 h-3.5" />
          <span>View Submission History</span>
        </button>
      </div>

      {/* Success Notification */}
      {successStatus && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="block text-emerald-200">Submission Successful</strong>
              <span>{successStatus}</span>
            </div>
          </div>
          <button
            onClick={() => setSuccessStatus(null)}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Existing Report Notice */}
      {existingReport && (
        <div className="p-4 bg-indigo-950/50 border border-indigo-800/80 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-indigo-200">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="font-semibold block">
                Existing record found for {selectedMonth} {activeWeek.label} ({existingReport.id})
              </span>
              <span className="text-[11px] text-indigo-300">
                Current status: <span className="font-semibold">{existingReport.status}</span>. Submitting now will update and overwrite this report week.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLoadExisting}
            className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition cursor-pointer whitespace-nowrap"
          >
            Load Existing Data
          </button>
        </div>
      )}

      {myProjects.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Projects Allocated</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You must be assigned to at least one active project before submitting work reports.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(false);
          }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6"
        >
          {/* Metadata Section: Project Selector, Intern ID, Reporting Period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-800">
            {/* Project Select */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Project *</label>
              <select
                required
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {myProjects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900">
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Intern ID (Auto) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Submitting Intern</label>
              <input
                type="text"
                disabled
                value={`${currentIntern.fullName} (${currentIntern.id})`}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono cursor-not-allowed"
              />
            </div>

            {/* Current Timestamp */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Submission Timestamp</label>
              <input
                type="text"
                disabled
                value={new Date().toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono cursor-not-allowed tabular-nums"
              />
            </div>
          </div>

          {/* Dynamic Reporting Week & Month Division */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-white">Reporting Calendar Schedule</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Divides month into 4–5 reporting weeks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Year */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              {/* Month */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Week Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Reporting Week</label>
                <select
                  value={selectedWeekNumber}
                  onChange={(e) => setSelectedWeekNumber(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {reportingWeeks.map((w) => (
                    <option key={w.weekNumber} value={w.weekNumber}>
                      {w.label} ({w.dateRangeStr})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active week date range highlight */}
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-500">Selected Window:</span>
              <span className="font-semibold text-indigo-300">
                {activeWeek.startDate} to {activeWeek.endDate}
              </span>
            </div>
          </div>

          {/* Form Content: Title, Description, Work Summary, Activities, Roadblocks, Next Steps */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Report Title *</label>
              <input
                type="text"
                required
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Weekly Progress Report - Phoenix Tech Engineering Track"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Executive Summary / Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief high-level overview of accomplishments for this reporting window"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Completed Activities */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Completed Activities & Milestones
              </label>
              <textarea
                rows={3}
                value={completedActivities}
                onChange={(e) => setCompletedActivities(e.target.value)}
                placeholder={`• Implemented JWT token validation and middleware\n• Added GridFS file streaming endpoints\n• Completed unit tests with 98% coverage`}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-mono"
              />
            </div>

            {/* Detailed Work Summary */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Detailed Technical Work Summary *</label>
              <textarea
                required
                rows={5}
                value={workSummary}
                onChange={(e) => setWorkSummary(e.target.value)}
                placeholder={`Detailed architecture notes, system designs, algorithms used, and integration specifics...`}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Challenges Faced */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Challenges / Blockers Faced</label>
                <textarea
                  rows={3}
                  value={challengesFaced}
                  onChange={(e) => setChallengesFaced(e.target.value)}
                  placeholder="Any technical obstacles, dependencies on other teams, or open questions..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              {/* Next Week Plan */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Next Week Planned Deliverables</label>
                <textarea
                  rows={3}
                  value={nextWeekPlan}
                  onChange={(e) => setNextWeekPlan(e.target.value)}
                  placeholder="Target tasks, sprints, benchmarks, and deliverables for the following week..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            {/* Progress Slider */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Estimated Project / Task Progress</span>
                <span className="font-bold text-indigo-400 font-mono tabular-nums text-sm">
                  {progressPercentage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% Initiation</span>
                <span>50% Mid-Sprint</span>
                <span>100% Deliverable Complete</span>
              </div>
            </div>
          </div>

          {/* Section B: File Upload (PDF, DOC/DOCX, XLS/XLSX, JPG, PNG) into MongoDB GridFS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Deliverable Attachments (MongoDB GridFS Storage)
              </label>
              <span className="text-[11px] text-slate-500">Max size 25MB per file</span>
            </div>

            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-950/30'
                  : 'border-slate-700/80 bg-slate-950/60 hover:border-slate-600'
              }`}
            >
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-medium">
                Drag and drop files here, or{' '}
                <label className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer">
                  browse local files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Supports: Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX), Images (JPG, PNG)
              </p>
            </div>

            {/* Uploaded Files Chips */}
            {filePreviews.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Files staged for GridFS upload ({filePreviews.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filePreviews.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-slate-200 font-medium truncate">{f.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono tabular-nums shrink-0">
                          ({(f.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Save as Draft vs Submit Report */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              Submitted reports trigger real-time notification alerts to Admin supervisors.
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save as Draft</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-md shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
