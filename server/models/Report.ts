import mongoose, { Schema, Document } from 'mongoose';

export interface IUploadedFile {
  fileId: string;
  originalFileName: string;
  storedFileName: string;
  contentType: string;
  fileSize: number;
  dataUrl?: string;
}

export interface IReport extends Document {
  reportId: string;
  projectId: string;
  internId: string;
  month: string;
  year: number;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  reportTitle: string;
  description: string;
  workSummary: string;
  completedActivities?: string;
  workProgress: number;
  challengesFaced?: string;
  nextWeekPlan?: string;
  additionalComments?: string;
  uploadedFiles: IUploadedFile[];
  submissionStatus: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  submittedAt?: Date;
  reviewedBy?: string;
  reviewComments?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UploadedFileSchema = new Schema<IUploadedFile>(
  {
    fileId: { type: String, required: true },
    originalFileName: { type: String, required: true },
    storedFileName: { type: String, required: true },
    contentType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    dataUrl: { type: String },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    projectId: { type: String, required: true, index: true },
    internId: { type: String, required: true, index: true },
    month: { type: String, required: true, index: true },
    year: { type: Number, required: true, index: true },
    weekNumber: { type: Number, required: true, index: true },
    weekStartDate: { type: String, required: true },
    weekEndDate: { type: String, required: true },
    reportTitle: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    workSummary: { type: String, required: true },
    completedActivities: { type: String, default: '' },
    workProgress: { type: Number, default: 0, min: 0, max: 100 },
    challengesFaced: { type: String, default: '' },
    nextWeekPlan: { type: String, default: '' },
    additionalComments: { type: String, default: '' },
    uploadedFiles: [UploadedFileSchema],
    submissionStatus: {
      type: String,
      default: 'Draft',
      enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'],
      index: true,
    },
    submittedAt: { type: Date },
    reviewedBy: { type: String },
    reviewComments: { type: String, default: '' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for fast queries and duplicate prevention
ReportSchema.index({ projectId: 1, internId: 1, year: 1, month: 1, weekNumber: 1 });

export const Report = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
