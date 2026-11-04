import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  FileText,
  Mail,
  Send,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { FilePreviewModal } from '../common/FilePreviewModal';
import { ReportFile } from '../../types';

interface InternProjectDetailsProps {
  projectId: string;
  onBack: () => void;
  onSubmitReport: (projectId: string) => void;
}

export const InternProjectDetails: React.FC<InternProjectDetailsProps> = ({
  projectId,
  onBack,
  onSubmitReport,
}) => {
  const { projects, interns, reports, currentIntern } = useApp();

  const project = projects.find((p) => p.id === projectId);
  const [previewFile, setPreviewFile] = useState<ReportFile | null>(null);

  if (!project) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <p className="text-sm text-slate-400">Project not found or not assigned to you.</p>
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 text-xs text-white bg-indigo-600 rounded-lg"
        >
          Back to My Projects
        </button>
      </div>
    );
  }

  // Assigned team peers
  const teamMembers = interns.filter((i) => project.assignedInternIds.includes(i.id));

  // My submissions for this project
  const myProjectReports = reports.filter(
    (r) => r.projectId === project.id && r.internId === currentIntern?.id
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Submission Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Back to My Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-400 font-semibold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900 tabular-nums">
                {project.id}
              </span>
              <StatusBadge status={project.status} />
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Read-Only Specification</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">{project.name}</h1>
          </div>
        </div>

        <button
          onClick={() => onSubmitReport(project.id)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition cursor-pointer self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Submit Project Report</span>
        </button>
      </div>

      {/* Main Grid: Specifications & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Scope, Objectives, Requirements */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Project Scope & Overview
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed">{project.description}</p>
          </div>

          {/* Objectives */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Project Objectives (Authorized by Administrator)
            </h2>
            {project.objectives && project.objectives.length > 0 ? (
              <ul className="space-y-2.5">
                {project.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No specific objectives defined.</p>
            )}
          </div>

          {/* Requirements */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Technical & Architecture Requirements
            </h2>
            {project.requirements && project.requirements.length > 0 ? (
              <ul className="space-y-2">
                {project.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No specific requirements defined.</p>
            )}
          </div>

          {/* Reference Docs */}
          {project.referenceDocs && project.referenceDocs.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Reference Material & Guidelines
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

        {/* Right Column: Supervisor & Team Members */}
        <div className="space-y-6">
          
          {/* Supervisor Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Project Supervisor
            </h2>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-white block">{project.supervisorName}</span>
              <span className="text-[11px] text-indigo-400 block">{project.supervisorEmail}</span>
              <span className="text-[10px] text-slate-500 block">Department of Engineering & Operations</span>
            </div>

            <div className="pt-2 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Technical Track:</span>
                <span className="text-indigo-300 font-semibold">{project.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Start Date:</span>
                <span className="text-slate-300 font-mono tabular-nums">{project.startDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Deliverable Deadline:</span>
                <span className="text-slate-300 font-mono tabular-nums">{project.deadline}</span>
              </div>
            </div>
          </div>

          {/* Assigned Peer Team */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assigned Team Members ({teamMembers.length})
            </h2>

            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center gap-3"
                >
                  <Avatar name={member.fullName} size="sm" />
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {member.fullName}
                      </span>
                      {member.id === currentIntern?.id && (
                        <span className="text-[9px] px-1 py-0.2 bg-indigo-950 text-indigo-300 rounded font-semibold border border-indigo-800">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {member.designation}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {member.college}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Submissions for This Project */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your Submissions ({myProjectReports.length})
              </h2>
            </div>

            {myProjectReports.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No reports submitted for this project yet.
              </p>
            ) : (
              <div className="space-y-2">
                {myProjectReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 truncate">{rep.title}</span>
                      <StatusBadge status={rep.status} />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Submitted: {new Date(rep.submittedAt).toLocaleDateString()}
                    </span>
                    {rep.reviewComments && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                        "{rep.reviewComments}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => onSubmitReport(project.id)}
              className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition cursor-pointer text-center block mt-2"
            >
              + Submit Work Report
            </button>
          </div>

        </div>

      </div>

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
};
