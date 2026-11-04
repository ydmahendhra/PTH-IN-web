import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectAssignment extends Document {
  assignmentId: string;
  projectId: string;
  internId: string;
  assignedBy: string;
  assignedDate: string;
  assignmentStatus: 'active' | 'completed' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectAssignmentSchema = new Schema<IProjectAssignment>(
  {
    assignmentId: { type: String, required: true, unique: true, index: true },
    projectId: { type: String, required: true, index: true },
    internId: { type: String, required: true, index: true },
    assignedBy: { type: String, default: 'ADM-1001' },
    assignedDate: { type: String, default: () => new Date().toISOString() },
    assignmentStatus: {
      type: String,
      default: 'active',
      enum: ['active', 'completed', 'removed'],
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness of active assignments per (projectId, internId)
ProjectAssignmentSchema.index({ projectId: 1, internId: 1, assignmentStatus: 1 });

export const ProjectAssignment =
  mongoose.models.ProjectAssignment ||
  mongoose.model<IProjectAssignment>('ProjectAssignment', ProjectAssignmentSchema);
