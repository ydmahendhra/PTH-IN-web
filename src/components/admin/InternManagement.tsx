import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit3,
  KeyRound,
  UserX,
  UserCheck,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  Lock,
  Layers,
  FileText,
  Download,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InternUser, GenderType } from '../../types';
import { Avatar } from '../common/Avatar';
import { StatusBadge } from '../common/Badge';
import {
  INTERN_DESIGNATIONS,
  AREA_OF_INTEREST_GROUPS,
  TECHNICAL_SKILLS_GROUPS,
} from '../../constants/internshipOptions';
import { SearchableMultiSelect } from '../common/SearchableMultiSelect';

interface InternManagementProps {
  openCreateImmediately?: boolean;
}

export const InternManagement: React.FC<InternManagementProps> = ({
  openCreateImmediately = false,
}) => {
  const {
    interns,
    projects,
    reports,
    createIntern,
    updateIntern,
    toggleInternActive,
    resetInternPassword,
    uploadInternProfileImage,
    exportExcel,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(openCreateImmediately);
  const [viewingIntern, setViewingIntern] = useState<InternUser | null>(null);
  const [editingIntern, setEditingIntern] = useState<InternUser | null>(null);
  const [resettingIntern, setResettingIntern] = useState<InternUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('intern123');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  // Form states for Add / Edit
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [dob, setDob] = useState('2003-01-15');
  const [gender, setGender] = useState<GenderType>('Female');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+1 (555) 000-0000');
  const [address, setAddress] = useState('University Hall, California, USA');
  
  // Academic
  const [college, setCollege] = useState('University of California, Berkeley');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [degree, setDegree] = useState('B.S. in Computer Science');
  const [yearOfStudy, setYearOfStudy] = useState('Junior Year (3rd)');
  const [graduationYear, setGraduationYear] = useState('2026');

  // Professional
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'React.js',
    'TypeScript',
    'Node.js',
  ]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Web Development',
    'Full Stack Development',
  ]);
  const [designation, setDesignation] = useState<string>('Software Development Intern');
  const [customDesignation, setCustomDesignation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('intern123');

  const resetForm = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setFullName('');
    setAvatar('');
    setDob('2003-01-15');
    setGender('Female');
    setEmail('');
    setPhone('+1 (555) 000-0000');
    setAddress('University Hall, California, USA');
    setCollege('University of California, Berkeley');
    setDepartment('Computer Science & Engineering');
    setDegree('B.S. in Computer Science');
    setYearOfStudy('Junior Year (3rd)');
    setGraduationYear('2026');
    setSelectedSkills(['React.js', 'TypeScript', 'Node.js']);
    setSelectedInterests(['Web Development', 'Full Stack Development']);
    setDesignation('Software Development Intern');
    setCustomDesignation('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setUsername('');
    setPassword('intern123');
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingIntern(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (intern: InternUser) => {
    setEditingIntern(intern);
    setProfileImageFile(null);
    setProfileImagePreview(intern.avatar || null);
    setFullName(intern.fullName);
    setAvatar(intern.avatar || '');
    setDob(intern.dob);
    setGender(intern.gender);
    setEmail(intern.email);
    setPhone(intern.phone);
    setAddress(intern.address);
    setCollege(intern.college);
    setDepartment(intern.department);
    setDegree(intern.degree);
    setYearOfStudy(intern.yearOfStudy);
    setGraduationYear(intern.graduationYear);
    
    // Multi-select skills & interests
    const skillsList = intern.technicalSkills && intern.technicalSkills.length > 0
      ? intern.technicalSkills
      : (intern.skills || []);
    const interestsList = intern.areaOfInterest && intern.areaOfInterest.length > 0
      ? intern.areaOfInterest
      : (intern.interests || []);
    setSelectedSkills(skillsList);
    setSelectedInterests(interestsList);

    // Designation handling
    if (INTERN_DESIGNATIONS.includes(intern.designation as any) && intern.designation !== 'Other / Custom Designation') {
      setDesignation(intern.designation);
      setCustomDesignation('');
    } else {
      setDesignation('Other / Custom Designation');
      setCustomDesignation(intern.designation || '');
    }

    setStartDate(intern.startDate);
    setEndDate(intern.endDate);
    setUsername(intern.username);
    setPassword(intern.password || 'intern123');
    setIsAddModalOpen(true);
  };

  const handleSaveIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    const finalDesignation = designation === 'Other / Custom Designation'
      ? (customDesignation.trim() || 'Software Development Intern')
      : designation;
    const generatedUsername = username.trim() || fullName.toLowerCase().replace(/\s+/g, '.');

    if (editingIntern) {
      await updateIntern(editingIntern.id, {
        fullName,
        avatar,
        dob,
        gender,
        email,
        phone,
        address,
        college,
        department,
        degree,
        yearOfStudy,
        graduationYear,
        skills: selectedSkills,
        technicalSkills: selectedSkills,
        interests: selectedInterests,
        areaOfInterest: selectedInterests,
        designation: finalDesignation,
        startDate,
        endDate,
        username: generatedUsername,
        password,
      });
      if (profileImageFile) {
        await uploadInternProfileImage(editingIntern.id, profileImageFile);
      }
    } else {
      await createIntern(
        {
          fullName,
          avatar,
          dob,
          gender,
          email,
          phone,
          address,
          college,
          department,
          degree,
          yearOfStudy,
          graduationYear,
          skills: selectedSkills,
          technicalSkills: selectedSkills,
          interests: selectedInterests,
          areaOfInterest: selectedInterests,
          designation: finalDesignation,
          startDate,
          endDate,
          username: generatedUsername,
          password,
          isActive: true,
        },
        profileImageFile || undefined
      );
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (resettingIntern && newPasswordInput.trim()) {
      resetInternPassword(resettingIntern.id, newPasswordInput.trim());
      setPasswordResetSuccess(true);
      setTimeout(() => {
        setPasswordResetSuccess(false);
        setResettingIntern(null);
        setNewPasswordInput('intern123');
      }, 1800);
    }
  };

  // Filter interns
  const filteredInterns = interns.filter((i) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      i.fullName.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.college.toLowerCase().includes(q);

    const matchesDept = departmentFilter === 'All' || i.department === departmentFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && i.isActive) ||
      (statusFilter === 'Inactive' && !i.isActive);

    return matchesSearch && matchesDept && matchesStatus;
  });

  const departments = Array.from(new Set(interns.map((i) => i.department)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Intern Directory & Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Register new candidate profiles, generate secure credentials, and manage authorizations
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportExcel('interns')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New Intern</span>
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
            placeholder="Search interns by name, ID, email, or college..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d} className="bg-slate-900">{d}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Statuses</option>
              <option value="Active" className="bg-slate-900">Active Only</option>
              <option value="Inactive" className="bg-slate-900">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interns Table List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Intern Profile</th>
                <th className="px-4 py-3">Academic Details</th>
                <th className="px-4 py-3">Skills & Role</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInterns.map((intern) => {
                const assignedCount = projects.filter((p) =>
                  p.assignedInternIds.includes(intern.id)
                ).length;

                return (
                  <tr key={intern.id} className="hover:bg-slate-800/40 transition">
                    {/* Intern Profile */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={intern.fullName} size="md" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white">{intern.fullName}</span>
                            <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-900/60 tabular-nums">
                              {intern.id}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block">{intern.email}</span>
                          <span className="text-[10px] text-slate-500 font-mono">User: {intern.username}</span>
                        </div>
                      </div>
                    </td>

                    {/* Academic */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-200 block truncate max-w-[200px]">
                          {intern.college}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                          {intern.department} · {intern.degree}
                        </span>
                        <span className="text-[10px] text-slate-500 tabular-nums">
                          Class of {intern.graduationYear}
                        </span>
                      </div>
                    </td>

                    {/* Skills & Role */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className="font-medium text-indigo-300 block">{intern.designation}</span>
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {intern.skills.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono"
                            >
                              {s}
                            </span>
                          ))}
                          {intern.skills.length > 3 && (
                            <span className="text-[9px] text-slate-500 font-mono">
                              +{intern.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Duration & Projects */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-300 font-mono tabular-nums block">
                          {intern.startDate} → {intern.endDate}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Assigned Projects: <strong className="text-white tabular-nums">{assignedCount}</strong>
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={intern.isActive ? 'Active' : 'Inactive'} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setViewingIntern(intern)}
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                          title="View Full Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(intern)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800 transition cursor-pointer"
                          title="Edit Intern"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setResettingIntern(intern)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleInternActive(intern.id)}
                          className={`p-1.5 rounded hover:bg-slate-800 transition cursor-pointer ${
                            intern.isActive
                              ? 'text-slate-400 hover:text-rose-400'
                              : 'text-rose-400 hover:text-emerald-400'
                          }`}
                          title={intern.isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {intern.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT INTERN REGISTRATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-5 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingIntern ? `Edit Intern Profile (${editingIntern.id})` : 'Register New Intern Account'}
                </h3>
                <p className="text-xs text-slate-400">
                  Fill academic, professional, and login credentials to provision access.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIntern} className="overflow-y-auto flex-1 space-y-6 pr-1">
              
              {/* Section 1: Personal Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1">
                  1. Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Profile Photo Uploader */}
                  <div className="space-y-1.5 md:col-span-3 pb-2 border-b border-slate-800">
                    <label className="text-xs font-medium text-slate-300">Profile Photo (MongoDB GridFS Storage)</label>
                    <div className="flex items-center gap-3.5">
                      {profileImagePreview ? (
                        <img
                          src={profileImagePreview}
                          alt="Profile preview"
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 shrink-0 shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 text-xs font-bold font-mono">
                          {fullName ? fullName.slice(0, 2).toUpperCase() : 'IN'}
                        </div>
                      )}
                      <div>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{profileImageFile ? 'Change Photo' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setProfileImageFile(file);
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setProfileImagePreview(ev.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <p className="text-[10px] text-slate-500 mt-1">
                          PNG, JPG, or WEBP up to 5MB. Persisted directly into MongoDB GridFS.
                        </p>
                      </div>
                      {profileImageFile && (
                        <span className="text-[11px] text-emerald-400 font-mono">
                          ✓ {profileImageFile.name} (ready)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-slate-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jordan Miller"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as GenderType)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan.miller@edu.org"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-3">
                    <label className="text-xs font-medium text-slate-300">Permanent Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Academic Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1">
                  2. Academic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-slate-300">College / University Name *</label>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Department *</label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Degree Program</label>
                    <input
                      type="text"
                      required
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Year of Study</label>
                    <input
                      type="text"
                      required
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Graduation Year</label>
                    <input
                      type="text"
                      required
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Professional Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1">
                  3. Professional Information & Technical Profile
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Designation / Role Title *</label>
                    <select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      {INTERN_DESIGNATIONS.map((role) => (
                        <option key={role} value={role} className="bg-slate-900">
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Intern ID</label>
                    <input
                      type="text"
                      disabled
                      value={editingIntern ? editingIntern.id : 'Auto-generated on creation (INT-2024-XX)'}
                      className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-500 cursor-not-allowed font-mono"
                    />
                  </div>

                  {designation === 'Other / Custom Designation' && (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-amber-400">Specify Custom Designation *</label>
                      <input
                        type="text"
                        required
                        value={customDesignation}
                        onChange={(e) => setCustomDesignation(e.target.value)}
                        placeholder="Quantum Computing Intern / Satellite Systems Intern"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-amber-500/50 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                      />
                    </div>
                  )}

                  <div className="space-y-1 md:col-span-2">
                    <SearchableMultiSelect
                      label="Technical Skills (Categorized)"
                      groups={TECHNICAL_SKILLS_GROUPS}
                      selectedValues={selectedSkills}
                      onChange={setSelectedSkills}
                      placeholder="Search programming languages, frameworks, hardware, tools..."
                      customPlaceholder="Add custom skill (Zig, ROS2, PyBullet)..."
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <SearchableMultiSelect
                      label="Areas of Interest (Categorized)"
                      groups={AREA_OF_INTEREST_GROUPS}
                      selectedValues={selectedInterests}
                      onChange={setSelectedInterests}
                      placeholder="Search software, hardware, AI, cloud, security domains..."
                      customPlaceholder="Add custom domain (Avionics, Edge AI)..."
                    />
                  </div>

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
                    <label className="text-xs font-medium text-slate-300">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Login Credentials */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1">
                  4. Login Credentials
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Username / User ID</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Defaults to firstname.lastname"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Password *</label>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/30 transition"
                >
                  {editingIntern ? 'Save Changes' : 'Create Intern Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INDIVIDUAL INTERN DETAILS MODAL */}
      {viewingIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <Avatar name={viewingIntern.fullName} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{viewingIntern.fullName}</h3>
                    <span className="font-mono text-xs text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                      {viewingIntern.id}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{viewingIntern.designation}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingIntern(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block mb-0.5">Email</span>
                  <span className="text-slate-200 font-medium">{viewingIntern.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Phone</span>
                  <span className="text-slate-200 font-medium">{viewingIntern.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Address</span>
                  <span className="text-slate-200 font-medium">{viewingIntern.address}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Login Username</span>
                  <span className="font-mono text-indigo-400">{viewingIntern.username}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block mb-0.5">College & Degree</span>
                  <span className="text-slate-200 font-medium block">{viewingIntern.college}</span>
                  <span className="text-slate-400 text-[11px]">{viewingIntern.degree}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Department</span>
                  <span className="text-slate-200 font-medium">{viewingIntern.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Internship Tenure</span>
                  <span className="text-slate-200 font-mono text-[11px] tabular-nums">
                    {viewingIntern.startDate} to {viewingIntern.endDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div>
                <span className="text-xs text-slate-400 block mb-1.5 font-medium">Areas of Interest</span>
                <div className="flex flex-wrap gap-1.5">
                  {(viewingIntern.areaOfInterest || viewingIntern.interests || []).map((interest) => (
                    <span
                      key={interest}
                      className="px-2 py-0.5 bg-indigo-950/60 border border-indigo-900/70 text-xs text-indigo-300 rounded font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                  {(!viewingIntern.areaOfInterest || viewingIntern.areaOfInterest.length === 0) &&
                    (!viewingIntern.interests || viewingIntern.interests.length === 0) && (
                      <span className="text-xs text-slate-500">None specified</span>
                    )}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1.5 font-medium">Technical Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {(viewingIntern.technicalSkills || viewingIntern.skills || []).map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded font-mono"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setViewingIntern(null)}
                className="px-4 py-1.5 text-xs text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resettingIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Reset Intern Password</h3>
            </div>
            <p className="text-xs text-slate-400">
              Reset access key for <strong className="text-white">{resettingIntern.fullName}</strong> ({resettingIntern.id}).
            </p>

            {passwordResetSuccess ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Password successfully reset!</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">New Password</label>
                  <input
                    type="text"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResettingIntern(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
