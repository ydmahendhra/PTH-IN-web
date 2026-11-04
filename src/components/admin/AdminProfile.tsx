import React, { useState } from 'react';
import { Mail, Phone, Building2, Briefcase, MapPin, Edit3, CheckCircle2, User, KeyRound, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { AdminPasswordResetModal } from './AdminPasswordResetModal';

export const AdminProfileView: React.FC = () => {
  const { adminProfile, updateAdminProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [passwordSuccessToast, setPasswordSuccessToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: adminProfile.name,
    email: adminProfile.email,
    phone: adminProfile.phone,
    designation: adminProfile.designation,
    department: adminProfile.department,
    contactInfo: adminProfile.contactInfo,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile(formData);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Administrator Profile</h1>
          <p className="text-xs text-slate-400 mt-1">
            System supervisor credentials, contact information, and departmental authority
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setPasswordResetOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {passwordSuccessToast && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{passwordSuccessToast}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Admin profile updated successfully!</span>
        </div>
      )}

      {/* Main Profile Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-800">
          <Avatar name={adminProfile.name} size="xl" className="shadow-lg" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{adminProfile.name}</h2>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/80">
                {adminProfile.id}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-300">{adminProfile.designation}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{adminProfile.department}</span>
            </p>
          </div>
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-xs">
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email Address
                </span>
                <span className="text-sm font-medium text-slate-200">{adminProfile.email}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Direct Phone Number
                </span>
                <span className="text-sm font-medium text-slate-200">{adminProfile.phone}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  Designation / Role
                </span>
                <span className="text-sm font-medium text-slate-200">{adminProfile.designation}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Assigned Department
                </span>
                <span className="text-sm font-medium text-slate-200">{adminProfile.department}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Contact Information & Location
                </span>
                <span className="text-sm font-medium text-slate-200">{adminProfile.contactInfo}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Administrative Scope
                </span>
                <span className="text-sm font-medium text-emerald-400">
                  Full System Permissions · Account Provisioning & Approval Authority
                </span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Contact & Office Info</label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security & Password Reset Action Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Administrator Security & Credentials</h3>
          </div>
          <p className="text-xs text-slate-400">
            Securely update your administrator password via encrypted POST request with bcrypt hashing.
          </p>
        </div>
        <button
          onClick={() => setPasswordResetOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <KeyRound className="w-4 h-4" />
          <span>Update Password</span>
        </button>
      </div>

      {/* Password Reset Modal */}
      <AdminPasswordResetModal
        isOpen={passwordResetOpen}
        onClose={() => setPasswordResetOpen(false)}
        onSuccess={(msg) => {
          setPasswordSuccessToast(msg);
          setTimeout(() => setPasswordSuccessToast(null), 4000);
        }}
      />
    </div>
  );
};
