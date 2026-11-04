import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  projectId: string;
  projectName: string;
  description: string;
  objectives: string[];
  requirements: string[];
  category: string;
  domainId?: string;
  startDate: string;
  deadline: string;
  projectStatus: 'Planning' | 'In Progress' | 'Under Review' | 'Completed';
  progress: number;
  referenceDocs: {
    name: string;
    size?: string;
    url?: string;
    type?: string;
    fileId?: string;
  }[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    projectId: { type: String, required: true, unique: true, index: true },
    projectName: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    objectives: [{ type: String }],
    requirements: [{ type: String }],
    category: { type: String, default: 'Web & Mobile Platforms' },
    domainId: { type: String, default: '' },
    startDate: { type: String, required: true },
    deadline: { type: String, required: true },
    projectStatus: {
      type: String,
      default: 'Planning',
      enum: ['Planning', 'In Progress', 'Under Review', 'Completed'],
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    referenceDocs: [
      {
        name: { type: String },
        size: { type: String },
        url: { type: String },
        type: { type: String },
        fileId: { type: String },
      },
    ],
    createdBy: { type: String, default: 'ADM-1001' },
  },
  { timestamps: true }
);

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
