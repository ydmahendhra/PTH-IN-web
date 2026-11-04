import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  adminId: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  profileImage?: string;
  contactNumber?: string;
  designation?: string;
  department?: string;
  contactInfo?: string;
  role: 'admin';
  accountStatus: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    adminId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    profileImage: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    designation: { type: String, default: 'Project Administrator' },
    department: { type: String, default: 'Engineering & Operations' },
    contactInfo: { type: String, default: '' },
    role: { type: String, default: 'admin', enum: ['admin'] },
    accountStatus: { type: String, default: 'active', enum: ['active', 'inactive'] },
  },
  { timestamps: true }
);

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
