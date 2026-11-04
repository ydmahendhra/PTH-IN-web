import mongoose, { Schema, Document } from 'mongoose';

export type ActivityCategory =
  | 'check_in'
  | 'project_update'
  | 'report_submission'
  | 'report_review'
  | 'assignment'
  | 'security'
  | 'system';

export type ActivitySeverity = 'info' | 'success' | 'warning' | 'error';

export interface IActivityLog extends Document {
  logId: string;
  category: ActivityCategory;
  action: string;
  severity: ActivitySeverity;
  actor: {
    id: string;
    name: string;
    role: 'admin' | 'intern' | 'system';
    avatar?: string;
  };
  target?: {
    type: 'intern' | 'project' | 'report' | 'system';
    id: string;
    title: string;
  };
  summary: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ['check_in', 'project_update', 'report_submission', 'report_review', 'assignment', 'security', 'system'],
      index: true,
    },
    action: { type: String, required: true, index: true },
    severity: {
      type: String,
      required: true,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
      index: true,
    },
    actor: {
      id: { type: String, required: true, index: true },
      name: { type: String, required: true },
      role: { type: String, required: true, enum: ['admin', 'intern', 'system'] },
      avatar: { type: String, default: '' },
    },
    target: {
      type: { type: String, enum: ['intern', 'project', 'report', 'system'] },
      id: { type: String },
      title: { type: String },
    },
    summary: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Index for multi-field queries and time sorting
ActivityLogSchema.index({ category: 1, timestamp: -1 });
ActivityLogSchema.index({ severity: 1, timestamp: -1 });

export const ActivityLog =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
