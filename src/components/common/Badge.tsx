import React from 'react';
import { ProjectStatus, ReportStatus } from '../../types';

interface StatusBadgeProps {
  status: ProjectStatus | ReportStatus | 'Active' | 'Inactive' | 'Available' | 'Assigned';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  // Return clean typography with subtle indicator
  switch (status) {
    case 'Completed':
    case 'Approved':
    case 'Active':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{status}</span>
        </span>
      );

    case 'In Progress':
    case 'Under Review':
    case 'Assigned':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span>{status}</span>
        </span>
      );

    case 'Submitted':
    case 'Available':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span>{status}</span>
        </span>
      );

    case 'Planning':
    case 'Draft':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span>{status}</span>
        </span>
      );

    case 'Rejected':
    case 'Inactive':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span>{status}</span>
        </span>
      );

    default:
      return <span className={`text-xs text-slate-400 ${className}`}>{status}</span>;
  }
};
