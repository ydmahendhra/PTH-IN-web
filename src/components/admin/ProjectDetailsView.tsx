import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  FileText,
  UserPlus,
  UserMinus,
  Download,
  Clock,
  Sparkles,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { StatusBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { FilePreviewModal } from '../common/FilePreviewModal';
import { ReportFile, ProjectStatus } from '../../types';

interface ProjectDetailsViewProps {
  projectId: string;
  onBack: () => void;
  onOpenReport: (reportId: string) => void;
}

export const ProjectDetailsView: React.FC<ProjectDetailsViewProps> = ({
  projectId,
  onBack,
  onOpenReport,
}) => {
  const { projects, interns, reports, assignInternsToProject, refreshData } = useApp();

  const project = projects.find((p) => p.id === projectId);

  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(project ? project.progress : 0);
  const [statusValue, setStatusValue] = useState<ProjectStatus>(project ? project.status : 'In Progress');
  const [progressNote, setProgressNote] = useState('');
  const [milestoneCompleted, setMilestoneCompleted] = useState('');
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>(
    project ? [...project.assignedInternIds] : []
  );
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<ReportFile | null>(null);

  if (!project) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <p className="text-sm text-slate-400">Project not found or was removed.</p>
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 text-xs text-white bg-indigo-600 rounded-lg"
        >
          Back to Projects List
        </button>
      </div>
    );
  }

  // Assigned interns
  const assignedInterns = interns.filter((i) => project.assignedInternIds.includes(i.id));

  // Project reports
  const projectReports = reports.filter((r) => r.projectId === project.id);

  // Intern availability helper
  const getInternStatus = (internId: string) => {
    const isCurrentlyAssignedHere = project.assignedInternIds.includes(internId);
    if (isCurrentlyAssignedHere) return { label: 'Assigned to This Project', isAssigned: true };

    const totalAssignedProjects = projects.filter((p) =>
      p.assignedInternIds.includes(internId)
    ).length;

    if (totalAssignedProjects === 0) {
      return { label: 'Available', isAssigned: false };
    }
    return { label: `Assigned (${totalAssignedProjects} other projects)`, isAssigned: true };
  };

  const handleOpenAddMembers = () => {
    setSelectedInternIds([...project.assignedInternIds]);
    setIsAddMembersModalOpen(true);
  };

  const handleToggleMember = (internId: string) => {
    if (selectedInternIds.includes(internId)) {
      setSelectedInternIds(selectedInternIds.filter((id) => id !== internId));
    } else {
      setSelectedInternIds([...selectedInternIds, internId]);
    }
  };

  const handleSaveTeam = () => {
    assignInternsToProject(project.id, selectedInternIds);
    setIsAddMembersModalOpen(false);
  };

  const handleRemoveMember = (internId: string) => {
    const nextIds = project.assignedInternIds.filter((id) => id !== internId);
    assignInternsToProject(project.id, nextIds);
  };

  // Filtered interns for modal selection
  const filteredModalInterns = interns.filter((i) => {
    const query = memberSearchQuery.toLowerCase();
    return (
      i.fullName.toLowerCase().includes(query) ||
      i.id.toLowerCase().includes(query) ||
      i.department.toLowerCase().includes(query) ||
      i.skills.some((s) => s.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-400 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/80 tabular-nums">
                {project.id}
              </span>
              <StatusBadge status={project.status} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">{project.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              if (project) {
                setProgressValue(project.progress);
                setStatusValue(project.status);
              }
              setIsProgressModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700 transition cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Update Progress & Milestones</span>
          </button>
          <button
            onClick={handleOpenAddMembers}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add / Manage Members</span>
          </button>
        </div>
      </div>

      {/* Grid: Project Specifications + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Details, Objectives, Requirements */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Project Overview & Description
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed">{project.description}</p>
          </div>

          {/* Objectives */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Key Objectives & Deliverables
            </h2>
            {project.objectives && project.objectives.length > 0 ? (
              <ul className="space-y-2">
                {project.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">No specific objectives entered.</p>
            )}
          </div>

          {/* Requirements */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Technical & Architectural Requirements
            </h2>
            {project.requirements && project.requirements.length > 0 ? (
              <ul className="space-y-2">
                {project.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">No specific requirements entered.</p>
            )}
          </div>

          {/* Reference Documents */}
          {project.referenceDocs && project.referenceDocs.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Reference Specifications & Assets
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {project.referenceDocs.map((doc, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      setPreviewFile({
                        id: `ref-${i}`,
                        name: doc.name,
                        size: 1024 * 1024 * 2,
                        type: doc.type || 'application/pdf',
                        previewText: `Reference Document: ${doc.name}\nProject: ${project.name} (${project.id})\nAuthoritative enterprise specification document.`,
                      })
                    }
                    className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 rounded-lg flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-xs text-slate-300 font-medium truncate">{doc.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 tabular-nums ml-2">
                      {doc.size || '1.0 MB'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Timeline & Team Members */}
        <div className="space-y-6">
          
          {/* Progress & Timeline Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Timeline & Velocity
            </h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Completion</span>
                <span className="text-slate-200 font-bold tabular-nums">{project.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Technical Domain:</span>
                <span className="font-semibold text-indigo-300">{project.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Start Date:</span>
                <span className="font-mono text-slate-200 tabular-nums">{project.startDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Expected Deadline:</span>
                <span className="font-mono text-slate-200 tabular-nums">{project.deadline}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Supervisor:</span>
                <span className="font-medium text-indigo-300">{project.supervisorName}</span>
              </div>
            </div>
          </div>

          {/* Assigned Team Members Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Assigned Team ({assignedInterns.length})
                </h2>
              </div>
              <button
                onClick={handleOpenAddMembers}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                + Add / Edit
              </button>
            </div>

            {assignedInterns.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>No interns currently assigned.</p>
                <button
                  onClick={handleOpenAddMembers}
                  className="mt-2 text-indigo-400 hover:underline"
                >
                  Assign interns now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedInterns.map((intern) => (
                  <div
                    key={intern.id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Avatar name={intern.fullName} size="sm" />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white truncate">
                            {intern.fullName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                            ({intern.id})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {intern.designation} · {intern.department}
                        </span>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {intern.skills.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveMember(intern.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Remove from project"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Submitted Reports for this Project */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white">Project Work Submissions & Reports</h2>
            <p className="text-xs text-slate-400">Deliverables and progress updates logged for this project</p>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {projectReports.length} Submitted
          </span>
        </div>

        {projectReports.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>No reports submitted for this project yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projectReports.map((report) => {
              const intern = interns.find((i) => i.id === report.internId);
              return (
                <div
                  key={report.id}
                  className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={intern ? intern.fullName : report.internId} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{report.title}</span>
                          <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                            {report.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          By {intern ? intern.fullName : report.internId} · Submitted{' '}
                          {new Date(report.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={report.status} />
                      <button
                        onClick={() => onOpenReport(report.id)}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-400 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/80 rounded transition cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                    {report.workSummary}
                  </p>

                  {/* Attached files */}
                  {report.files && report.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {report.files.map((file) => (
                        <button
                          key={file.id}
                          onClick={() => setPreviewFile(file)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="truncate max-w-[160px]">{file.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Review comments if approved or rejected */}
                  {report.reviewComments && (
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
                      <span className="text-slate-400 font-semibold block mb-0.5">
                        Supervisor Review ({report.reviewedBy}):
                      </span>
                      <span>"{report.reviewComments}"</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / MANAGE MEMBERS MODAL (Multi-Select Checkboxes) */}
      {isAddMembersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Assign Team Members to "{project.name}"
                </h3>
                <p className="text-xs text-slate-400">
                  Select one or multiple interns using checkboxes below.
                </p>
              </div>
              <button
                onClick={() => setIsAddMembersModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Search interns by name, ID, department, or skill..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Interns List with Checkboxes */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {filteredModalInterns.map((intern) => {
                const isSelected = selectedInternIds.includes(intern.id);
                const statusInfo = getInternStatus(intern.id);

                return (
                  <label
                    key={intern.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-600/80'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleMember(intern.id)}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                      />
                      <Avatar name={intern.fullName} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {intern.fullName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                            {intern.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block">
                          {intern.department} · {intern.college}
                        </span>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {intern.skills.map((s) => (
                            <span
                              key={s}
                              className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[11px] font-medium block ${
                          statusInfo.isAssigned ? 'text-indigo-400' : 'text-emerald-400'
                        }`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                <strong className="text-white tabular-nums">{selectedInternIds.length}</strong> Interns Selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMembersModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTeam}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  Assign Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress & Milestone Update Modal */}
      {isProgressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Record Project Progress & Milestones</h3>
              </div>
              <button
                onClick={() => setIsProgressModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSavingProgress(true);
                try {
                  await api.projects.updateProgress(project.id, {
                    progress: progressValue,
                    status: statusValue,
                    note: progressNote.trim(),
                    milestoneCompleted: milestoneCompleted.trim() || undefined,
                  });
                  await refreshData();
                  setIsProgressModalOpen(false);
                  setProgressNote('');
                  setMilestoneCompleted('');
                } catch (err: any) {
                  console.error('Error saving progress update:', err);
                } finally {
                  setIsSavingProgress(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              {/* Progress Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-300">
                  <label>Completion Percentage</label>
                  <span className="text-indigo-400 font-mono text-sm tabular-nums">{progressValue}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Project Status</label>
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {/* Milestone achieved */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Milestone Achieved (Optional)</label>
                <input
                  type="text"
                  value={milestoneCompleted}
                  onChange={(e) => setMilestoneCompleted(e.target.value)}
                  placeholder="e.g. Phase 1 Wireframes Approved, Database Migrations Deployed"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Update Note */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Progress Update Log Note</label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  rows={2}
                  placeholder="Details of deliverables finished, review status, or next steps..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProgressModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProgress}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition cursor-pointer"
                >
                  {isSavingProgress ? 'Broadcasting Update...' : 'Commit Progress Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
};
