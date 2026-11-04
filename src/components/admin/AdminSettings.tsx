import React, { useState } from 'react';
import {
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  Users,
  Briefcase,
  Layers,
  Calendar,
  Lock,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminPasswordResetModal } from './AdminPasswordResetModal';

export const AdminSettings: React.FC = () => {
  const { projects, interns, reports, notifications, exportExcel, refreshData } = useApp();
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);

  const handleExport = async (
    type: 'interns' | 'projects' | 'assignments' | 'weekly-reports' | 'monthly-reports',
    label: string
  ) => {
    try {
      setExportingType(type);
      await exportExcel(type);
      setExportSuccessMessage(`Successfully exported ${label} (.xlsx)`);
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Export error:', err);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportData = () => {
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      projects,
      interns,
      reports,
      notifications,
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_management_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold text-white tracking-tight">System Settings & Data Control</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure MongoDB database state, export Excel reports, and inspect security authority
        </p>
      </div>

      {exportSuccessMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      {/* ExcelJS Export Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold text-white">Excel Data Export Center (ExcelJS)</h2>
            <p className="text-xs text-slate-400">
              Download stylized multi-column XLSX spreadsheets formatted with headers, widths, and styling
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {/* Interns */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Interns Directory</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Full roster, university affiliations, contact info, and active statuses ({interns.length} records)
              </p>
            </div>
            <button
              onClick={() => handleExport('interns', 'Interns Directory')}
              disabled={exportingType === 'interns'}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{exportingType === 'interns' ? 'Exporting...' : 'Export Interns (.xlsx)'}</span>
            </button>
          </div>

          {/* Projects */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                <Briefcase className="w-4 h-4 text-sky-400" />
                <span>Projects Portfolio</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Project titles, domain tags, objectives, deadlines, and completion progress ({projects.length} projects)
              </p>
            </div>
            <button
              onClick={() => handleExport('projects', 'Projects Portfolio')}
              disabled={exportingType === 'projects'}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{exportingType === 'projects' ? 'Exporting...' : 'Export Projects (.xlsx)'}</span>
            </button>
          </div>

          {/* Assignments */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Assignment Matrix</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Cross-reference mapping of interns assigned to active projects
              </p>
            </div>
            <button
              onClick={() => handleExport('assignments', 'Assignment Matrix')}
              disabled={exportingType === 'assignments'}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{exportingType === 'assignments' ? 'Exporting...' : 'Export Assignments (.xlsx)'}</span>
            </button>
          </div>

          {/* Weekly Reports */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Weekly Reports Ledger</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Calendar week breakdown, deliverables, supervisor feedback, and approval status
              </p>
            </div>
            <button
              onClick={() => handleExport('weekly-reports', 'Weekly Reports')}
              disabled={exportingType === 'weekly-reports'}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{exportingType === 'weekly-reports' ? 'Exporting...' : 'Export Weekly (.xlsx)'}</span>
            </button>
          </div>

          {/* Monthly Reports */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                <FileSpreadsheet className="w-4 h-4 text-rose-400" />
                <span>Monthly Summary</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Aggregated monthly statistics, intern performance metrics, and completion summaries
              </p>
            </div>
            <button
              onClick={() => handleExport('monthly-reports', 'Monthly Summary')}
              disabled={exportingType === 'monthly-reports'}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{exportingType === 'monthly-reports' ? 'Exporting...' : 'Export Monthly (.xlsx)'}</span>
            </button>
          </div>

          {/* JSON Full Backup */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Full JSON Archive</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Complete database snapshot export for backup and disaster recovery
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Snapshot (.json)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Database Persistence & Admin Accounts Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">MongoDB Architecture & Multi-Admin Security</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The system runs a persistent MongoDB database engine with Mongoose ODM and GridFS binary bucket storage. All user passwords are encrypted with bcrypt rounds.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
          {/* Admin 1 */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Admin Account 1</span>
              <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-900">
                PTS-CEO-001
              </span>
            </div>
            <p className="text-slate-300 text-[11px] font-medium">Y Mahendhra Kumar (mahendhra2005@gamil.com)</p>
            <p className="text-[10px] text-slate-400">Designation: Chief Executive Officer</p>
            <span className="inline-block mt-1 text-[10px] text-emerald-400 font-mono">
              ✓ bcrypt hashed · Active
            </span>
          </div>

          {/* Admin 2 */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Admin Account 2</span>
              <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-900">
                PTS-COO-001
              </span>
            </div>
            <p className="text-slate-300 text-[11px] font-medium">P Praveen Kumar (praveenpraba399@gamil.com)</p>
            <p className="text-[10px] text-slate-400">Designation: Chief Operating Officer</p>
            <span className="inline-block mt-1 text-[10px] text-emerald-400 font-mono">
              ✓ bcrypt hashed · Active
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setPasswordResetOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Update Administrator Password</span>
          </button>
        </div>
      </div>

      {/* Role-Based Access Enforcement Guard */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Role-Based Access Enforcement (RBAC)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Admin Security Scope</span>
            <span className="text-emerald-400 font-semibold">Active & Enforced</span>
            <p className="text-[11px] text-slate-500 mt-1">Full project CRUD, user provisioning, evaluation authority</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Intern Isolation</span>
            <span className="text-emerald-400 font-semibold">Active & Enforced</span>
            <p className="text-[11px] text-slate-500 mt-1">Restricted strictly to assigned projects & report submissions</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Staff Portal</span>
            <span className="text-amber-400 font-semibold">Phase 2 Scheduled</span>
            <p className="text-[11px] text-slate-500 mt-1">Mentor check-in and departmental routing preview</p>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      <AdminPasswordResetModal
        isOpen={passwordResetOpen}
        onClose={() => setPasswordResetOpen(false)}
        onSuccess={(msg) => {
          setExportSuccessMessage(msg);
          setTimeout(() => setExportSuccessMessage(null), 4000);
        }}
      />
    </div>
  );
};
