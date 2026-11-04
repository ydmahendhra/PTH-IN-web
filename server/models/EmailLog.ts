import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailLog extends Document {
  emailId: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole: string;
  internId: string;
  projectId: string;
  projectName: string;
  subject: string;
  bodyHtml: string;
  status: 'sent' | 'logged_preview' | 'failed';
  errorDetails?: string;
  sentAt: Date;
  assignedBy: string;
  deliveryAttempts: number;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    emailId: { type: String, required: true, unique: true, index: true },
    recipientEmail: { type: String, required: true, index: true },
    recipientName: { type: String, required: true },
    recipientRole: { type: String, default: 'intern' },
    internId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    projectName: { type: String, required: true },
    subject: { type: String, required: true },
    bodyHtml: { type: String, required: true },
    status: { type: String, enum: ['sent', 'logged_preview', 'failed'], default: 'logged_preview' },
    errorDetails: { type: String, default: '' },
    sentAt: { type: Date, default: Date.now },
    assignedBy: { type: String, required: true },
    deliveryAttempts: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const EmailLog = mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
