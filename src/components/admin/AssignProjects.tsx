import React, { useState } from 'react';
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Search,
  Filter,
  Check,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { StatusBadge } from '../common/Badge';

export const AssignProjects: React.FC = () => {
  const { projects, interns, assignInternsToProject } = useApp();

  // Active selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : ''
  );

  // Selected intern checkboxes for the active project
  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const [selectedInternIds, setSelectedInternIds] = useState<string[]>(
    currentProject ? [...currentProject.assignedInternIds] : []
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [internSearchQuery, setInternSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'matrix' | 'by_intern'>('matrix');

  // When project selector changes, reload its assigned list
  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    const proj = projects.find((p) => p.id === projId);
    if (proj) {
      setSelectedInternIds([...proj.assignedInternIds]);
    }
    setSaveSuccess(false);
  };

  const handleToggleIntern = (internId: string) => {
    if (selectedInternIds.includes(internId)) {
      setSelectedInternIds(selectedInternIds.filter((id) => id !== internId));
    } else {
      setSelectedInternIds([...selectedInternIds, internId]);
    }
    setSaveSuccess(false);
  };

  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    assignInternsToProject(selectedProjectId, selectedInternIds);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Helper for availability
  const getInternWorkload = (internId: string) => {
    const assignedProjs = projects.filter((p) => p.assignedInternIds.includes(internId));
    return {
      count: assignedProjs.length,
      projects: assignedProjs,
      isAvailable: assignedProjs.length === 0,
    };
  };

  const filteredInterns = interns.filter((i) => {
    const q = internSearchQuery.toLowerCase();
    return (
      i.fullName.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.department.toLowerCase().includes(q) ||
      i.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Assign Projects & Team Matrix</h1>
          <p className="text-xs text-slate-400 mt-1">
            Allocate interns across projects, verify team capacity, and synchronize assignment states
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Assignment Console
          </button>
          <button
            onClick={() => setActiveTab('by_intern')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              activeTab === 'by_intern'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Workload by Intern
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="block text-emerald-200">Assignment Confirmed & Dispatched</strong>
              <span>
                "{currentProject?.name}" updated with {selectedInternIds.length} team members. Intern dashboards and notifications updated.
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matrix' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: STEP 1 - Select Project (4 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Step 1: Select Target Project
                </span>
                <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                  {projects.length} Initiatives
                </span>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {projects.map((proj) => {
                  const isCurrent = proj.id === selectedProjectId;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => handleSelectProject(proj.id)}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer select-none ${
                        isCurrent
                          ? 'bg-indigo-950/50 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-[10px] text-indigo-400 font-semibold bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-900 tabular-nums">
                          {proj.id}
                        </span>
                        <StatusBadge status={proj.status} />
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{proj.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {proj.description}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Due: <span className="tabular-nums text-slate-300">{proj.deadline}</span></span>
                        <span className="text-indigo-300 font-medium tabular-nums">
                          {proj.assignedInternIds.length} Assigned
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: STEP 2, 3, 4 - Intern Checkboxes & Confirmation (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {currentProject ? (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-0.5">
                      Step 2 & 3: Select & Assign Interns
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Target Initiative: <span className="text-indigo-300">{currentProject.name}</span>
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmAssignment}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/30 transition cursor-pointer self-start sm:self-auto"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Project Assignment</span>
                  </button>
                </div>

                {/* Search Bar for Interns */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={internSearchQuery}
                    onChange={(e) => setInternSearchQuery(e.target.value)}
                    placeholder="Search candidate interns by name, ID, or skills..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Interns List */}
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredInterns.map((intern) => {
                    const isSelected = selectedInternIds.includes(intern.id);
                    const workload = getInternWorkload(intern.id);

                    return (
                      <label
                        key={intern.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-600 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleIntern(intern.id)}
                            className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                          />
                          <Avatar name={intern.fullName} size="sm" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{intern.fullName}</span>
                              <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                                {intern.id}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              {intern.designation} · {intern.college}
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
                          {workload.isAvailable ? (
                            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
                              Available
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900">
                              {workload.count} Project{workload.count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    <strong className="text-white tabular-nums">{selectedInternIds.length}</strong> Interns Selected for "{currentProject.name}"
                  </span>
                  <button
                    type="button"
                    onClick={handleConfirmAssignment}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/30 transition cursor-pointer"
                  >
                    Confirm & Save Assignment
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">Please select a project to manage assignments.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* TAB 2: WORKLOAD BY INTERN MATRIX */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white">Project Workload Allocation by Intern</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interns.map((intern) => {
              const assigned = projects.filter((p) => p.assignedInternIds.includes(intern.id));
              return (
                <div
                  key={intern.id}
                  className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={intern.fullName} size="sm" />
                      <div>
                        <span className="text-xs font-bold text-white block">{intern.fullName}</span>
                        <span className="text-[11px] text-slate-400">{intern.designation}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900 tabular-nums">
                      {assigned.length} Projects
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    {assigned.length === 0 ? (
                      <span className="text-xs text-emerald-400 italic">
                        Currently available for new assignments.
                      </span>
                    ) : (
                      assigned.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-200 font-medium truncate max-w-[240px]">
                            {p.name}
                          </span>
                          <StatusBadge status={p.status} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
