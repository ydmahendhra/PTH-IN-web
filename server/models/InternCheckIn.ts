import mongoose, { Schema, Document } from 'mongoose';

export type CheckInStatus = 'Present' | 'Working Remotely' | 'In Office' | 'Checked Out';
export type WorkMode = 'Remote' | 'Office' | 'Hybrid';

export interface IInternCheckIn extends Document {
  checkInId: string;
  internId: string;
  internName: string;
  internAvatar?: string;
  department?: string;
  projectId?: string;
  projectTitle?: string;
  status: CheckInStatus;
  mode: WorkMode;
  focusToday: string;
  blockers?: string;
  checkInTime: Date;
  checkOutTime?: Date;
  durationMinutes?: number;
  dateString: string; // YYYY-MM-DD
  adminAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InternCheckInSchema = new Schema<IInternCheckIn>(
  {
    checkInId: { type: String, required: true, unique: true, index: true },
    internId: { type: String, required: true, index: true },
    internName: { type: String, required: true },
    internAvatar: { type: String, default: '' },
    department: { type: String, default: 'Engineering' },
    projectId: { type: String, default: '' },
    projectTitle: { type: String, default: '' },
    status: {
      type: String,
      required: true,
      enum: ['Present', 'Working Remotely', 'In Office', 'Checked Out'],
      default: 'Present',
      index: true,
    },
    mode: {
      type: String,
      required: true,
      enum: ['Remote', 'Office', 'Hybrid'],
      default: 'Remote',
    },
    focusToday: { type: String, required: true },
    blockers: { type: String, default: '' },
    checkInTime: { type: Date, default: Date.now, index: true },
    checkOutTime: { type: Date },
    durationMinutes: { type: Number, default: 0 },
    dateString: { type: String, required: true, index: true },
    adminAcknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: String, default: '' },
    acknowledgedAt: { type: Date },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

InternCheckInSchema.index({ dateString: 1, internId: 1 });
InternCheckInSchema.index({ checkInTime: -1 });

export const InternCheckIn =
  mongoose.models.InternCheckIn || mongoose.model<IInternCheckIn>('InternCheckIn', InternCheckInSchema);
