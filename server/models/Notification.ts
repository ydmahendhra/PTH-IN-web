import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  notificationId: string;
  recipientId: string;
  recipientRole: 'admin' | 'intern';
  notificationTitle: string;
  notificationMessage: string;
  notificationType: string;
  relatedProjectId?: string;
  relatedReportId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    recipientId: { type: String, required: true, index: true },
    recipientRole: { type: String, required: true, enum: ['admin', 'intern'], index: true },
    notificationTitle: { type: String, required: true },
    notificationMessage: { type: String, required: true },
    notificationType: { type: String, default: 'general' },
    relatedProjectId: { type: String },
    relatedReportId: { type: String },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
