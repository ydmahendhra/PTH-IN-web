import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Calendar,
  MapPin,
  Edit3,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';

export const InternProfileView: React.FC = () => {
  const { currentIntern, updateInternProfile } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!currentIntern) return null;

  const [phone, setPhone] = useState(currentIntern.phone);
  const [address, setAddress] = useState(currentIntern.address);
  const [interestsInput, setInterestsInput] = useState(
    ((currentIntern.areaOfInterest && currentIntern.areaOfInterest.length > 0)
      ? currentIntern.areaOfInterest
      : (currentIntern.interests || [])
    ).join(', ')
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const interests = interestsInput.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    updateInternProfile(currentIntern.id, {
      phone,
      address,
      interests,
      areaOfInterest: interests,
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Intern Profile & Records</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered candidate information, university credentials, and contact details
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer self-start sm:self-auto"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Contact Info'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Contact information successfully updated!</span>
        </div>
      )}

      {/* Main Profile Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-800">
          <Avatar name={currentIntern.fullName} size="xl" className="shadow-lg" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{currentIntern.fullName}</h2>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/80 tabular-nums">
                {currentIntern.id}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-300">{currentIntern.designation}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentIntern.college}</span>
            </p>
          </div>
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Left Column: Personal & Contact */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1">
                Personal & Contact Details
              </h3>

              <div>
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email Address
                </span>
                <span className="text-sm font-medium text-slate-200">{currentIntern.email}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Phone Number
                </span>
                <span className="text-sm font-medium text-slate-200">{currentIntern.phone}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Residential Address
                </span>
                <span className="text-sm font-medium text-slate-200">{currentIntern.address}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Date of Birth & Gender</span>
                <span className="text-sm font-medium text-slate-200">
                  {currentIntern.dob} · {currentIntern.gender}
                </span>
              </div>
            </div>

            {/* Right Column: Academic & Duration */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1">
                Academic & Internship Tenure
              </h3>

              <div>
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  College & Department
                </span>
                <span className="text-sm font-medium text-slate-200 block">{currentIntern.college}</span>
                <span className="text-slate-400 text-xs">{currentIntern.department}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Degree & Year of Study</span>
                <span className="text-sm font-medium text-slate-200 block">
                  {currentIntern.degree} ({currentIntern.yearOfStudy})
                </span>
                <span className="text-slate-400 text-xs">Class of {currentIntern.graduationYear}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Internship Duration
                </span>
                <span className="text-sm font-medium text-slate-200 font-mono tabular-nums">
                  {currentIntern.startDate} to {currentIntern.endDate}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Profile Editing Policy
                </span>
                <span className="text-[11px] text-slate-400 leading-snug block">
                  Academic details and role titles are verified and locked by the organization Administrator.
                </span>
              </div>
            </div>

            {/* Skills & Interests */}
            <div className="md:col-span-2 pt-4 border-t border-slate-800 space-y-4">
              <div>
                <span className="text-slate-400 block mb-1.5 font-semibold">Technical Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentIntern.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-md font-mono"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1.5 font-semibold">Areas of Interest:</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentIntern.interests.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 bg-indigo-950/60 border border-indigo-900 text-xs text-indigo-300 rounded-md"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* EDIT CONTACT FORM */
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-900/50 text-xs text-indigo-300 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>
                Authorized Edit Mode: You may update personal contact numbers, residential address, and interest areas.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Residential Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-semibold text-slate-300">
                  Areas of Interest (comma-separated)
                </label>
                <input
                  type="text"
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                  placeholder="Distributed Systems, Cloud Architecture, UI/UX"
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
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/30"
              >
                Save Contact Details
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
