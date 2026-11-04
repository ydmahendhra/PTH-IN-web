import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ChevronRight,
  Globe,
  Tag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus, ProjectDomain } from '../../types';
import { StatusBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';

interface ProjectManagementProps {
  onOpenProject: (projectId: string) => void;
  openCreateImmediately?: boolean;
}

export const ProjectManagement: React.FC<ProjectManagementProps> = ({
  onOpenProject,
  openCreateImmediately = false,
}) => {
  const {
    projects,
    domains,
    createDomain,
    createProject,
    updateProject,
    deleteProject,
    interns,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [domainFilter, setDomainFilter] = useState<string>('All');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(openCreateImmediately);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // New Domain Modal State
  const [isNewDomainModalOpen, setIsNewDomainModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainDescription, setNewDomainDescription] = useState('');
  const [newDomainColor, setNewDomainColor] = useState('indigo');

  // Form states for Create/Edit
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState<string>(
    domains.length > 0 ? domains[0].id : ''
  );
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('Planning');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [referenceDocInput, setReferenceDocInput] = useState('');

  const resetForm = () => {
    setProjectName('');
    setProjectDescription('');
    setSelectedDomainId(domains.length > 0 ? domains[0].id : '');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDeadline(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setProjectStatus('Planning');
    setObjectives(['']);
    setRequirements(['']);
    setReferenceDocInput('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingProject(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description);
    setSelectedDomainId(project.domainId || (domains.length > 0 ? domains[0].id : ''));
    setStartDate(project.startDate);
    setDeadline(project.deadline);
    setProjectStatus(project.status);
    setObjectives(project.objectives.length > 0 ? project.objectives : ['']);
    setRequirements(project.requirements.length > 0 ? project.requirements : ['']);
    setReferenceDocInput(project.referenceDocs.map((d) => d.name).join(', '));
    setIsCreateModalOpen(true);
  };

  const handleCreateNewDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;

    const created = createDomain({
      name: newDomainName.trim(),
      slug: newDomainName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: newDomainDescription.trim() || 'Custom organizational technical track.',
      color: newDomainColor,
    });

    // Auto-select in project creation
    setSelectedDomainId(created.id);
    setIsNewDomainModalOpen(false);
    setNewDomainName('');
    setNewDomainDescription('');
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectDescription.trim()) return;

    const cleanObjectives = objectives.filter((o) => o.trim().length > 0);
    const cleanRequirements = requirements.filter((r) => r.trim().length > 0);
    const refDocs = referenceDocInput
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0)
      .map((name) => ({ name, size: '1.2 MB' }));

    const targetDomain = domains.find((d) => d.id === selectedDomainId);
    const domainCategory = targetDomain ? targetDomain.name : 'Enterprise Engineering';

    if (editingProject) {
      updateProject(editingProject.id, {
        name: projectName,
        description: projectDescription,
        category: domainCategory,
        domainId: selectedDomainId,
        startDate,
        deadline,
        status: projectStatus,
        objectives: cleanObjectives,
        requirements: cleanRequirements,
        referenceDocs: refDocs.length > 0 ? refDocs : editingProject.referenceDocs,
      });
    } else {
      createProject({
        name: projectName,
        description: projectDescription,
        category: domainCategory,
        domainId: selectedDomainId,
        startDate,
        deadline,
        status: projectStatus,
        objectives: cleanObjectives,
        requirements: cleanRequirements,
        referenceDocs: refDocs,
        assignedInternIds: [],
        supervisorName: 'Dr. Sarah Sterling',
        supervisorEmail: 'admin@nexus.corp',
        progress: 0,
      });
    }

    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (deletingProject) {
      deleteProject(deletingProject.id);
      setDeletingProject(null);
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesDomain =
      domainFilter === 'All' ||
      p.domainId === domainFilter ||
      p.category.toLowerCase() === domainFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesDomain;
  });

  const getInternName = (id: string) => {
    const found = interns.find((i) => i.id === id);
    return found ? found.fullName : id;
  };

  const getDomainName = (proj: Project) => {
    if (proj.domainId) {
      const found = domains.find((d) => d.id === proj.domainId);
      if (found) return found.name;
    }
    return proj.category;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Project Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Oversee corporate deliverables, technical domains, team allocations, and deadlines
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsNewDomainModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ Add New Domain</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name, ID, domain, or description..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Domain Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="All" className="bg-slate-900">All Domains</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Statuses</option>
              <option value="Planning" className="bg-slate-900">Planning</option>
              <option value="In Progress" className="bg-slate-900">In Progress</option>
              <option value="Under Review" className="bg-slate-900">Under Review</option>
              <option value="Completed" className="bg-slate-900">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new project initiative using the button above.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
          >
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              className="bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition group cursor-pointer shadow-sm"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-indigo-400 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/80 tabular-nums">
                      {project.id}
                    </span>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                {/* Project Domain Tag */}
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-medium mb-1">
                  <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{getDomainName(project)}</span>
                </div>

                {/* Project Title & Description */}
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1.5">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {project.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-slate-300 font-medium tabular-nums">{project.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Deadline & Dates */}
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Due: <span className="tabular-nums text-slate-300">{project.deadline}</span></span>
                  </div>
                </div>
              </div>

              {/* Footer: Team Members & Actions */}
              <div className="pt-4 flex items-center justify-between">
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
                    <span className="text-[11px] text-amber-400/90 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Unassigned</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleOpenEdit(project, e)}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                    title="Edit Project"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingProject(project);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenProject(project.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800 transition cursor-pointer"
                    title="View Details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingProject ? `Edit Project (${editingProject.id})` : 'Create New Project'}
                </h3>
                <p className="text-xs text-slate-400">
                  Define project scope, technical domain track, and requirements
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              {/* Name & Domain */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enterprise Workflow System"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">Project Domain *</label>
                    <button
                      type="button"
                      onClick={() => setIsNewDomainModalOpen(true)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      + New Domain
                    </button>
                  </div>
                  <select
                    value={selectedDomainId}
                    onChange={(e) => setSelectedDomainId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.id} className="bg-slate-900">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Project Description *</label>
                <textarea
                  required
                  rows={2}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Develop a responsive website with frontend and backend functionality..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Expected Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Project Status</label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Objectives */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Project Objectives</label>
                  <button
                    type="button"
                    onClick={() => setObjectives([...objectives, ''])}
                    className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    + Add Objective
                  </button>
                </div>
                {objectives.map((obj, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => {
                        const next = [...objectives];
                        next[idx] = e.target.value;
                        setObjectives(next);
                      }}
                      placeholder={`Objective #${idx + 1}`}
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setObjectives(objectives.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Requirements */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Project Requirements</label>
                  <button
                    type="button"
                    onClick={() => setRequirements([...requirements, ''])}
                    className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    + Add Requirement
                  </button>
                </div>
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => {
                        const next = [...requirements];
                        next[idx] = e.target.value;
                        setRequirements(next);
                      }}
                      placeholder={`Requirement #${idx + 1}`}
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRequirements(requirements.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Reference Documents */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Reference Documents (optional, comma-separated names)
                </label>
                <input
                  type="text"
                  value={referenceDocInput}
                  onChange={(e) => setReferenceDocInput(e.target.value)}
                  placeholder="Architecture_Spec.pdf, API_Schema.json"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/30"
                >
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW DOMAIN MODAL */}
      {isNewDomainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Add New Project Domain</h3>
              </div>
              <button
                onClick={() => setIsNewDomainModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewDomain} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Domain Name *</label>
                <input
                  type="text"
                  required
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  placeholder="Quantum Computing & Algorithms"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Description / Focus Area</label>
                <textarea
                  rows={2}
                  value={newDomainDescription}
                  onChange={(e) => setNewDomainDescription(e.target.value)}
                  placeholder="Briefly describe the domain scope..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Domain Color Accent</label>
                <select
                  value={newDomainColor}
                  onChange={(e) => setNewDomainColor(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="indigo">Indigo Accent</option>
                  <option value="sky">Sky Blue Accent</option>
                  <option value="emerald">Emerald Green Accent</option>
                  <option value="rose">Rose Red Accent</option>
                  <option value="amber">Amber Gold Accent</option>
                  <option value="violet">Violet Purple Accent</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewDomainModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow"
                >
                  Add Domain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Delete Project</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently delete <strong className="text-slate-200">{deletingProject.name}</strong> ({deletingProject.id})? All assignments and historical records associated with this project will be removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition shadow-md shadow-rose-600/30"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
