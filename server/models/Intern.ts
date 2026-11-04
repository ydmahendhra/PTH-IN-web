import mongoose, { Schema, Document } from 'mongoose';

export interface IIntern extends Document {
  internId: string;
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  profileImage?: string;
  phoneNumber: string;
  collegeName: string;
  department: string;
  degree: string;
  yearOfStudy: string;
  graduationYear?: string;
  skills: string[];
  interests: string[];
  technicalSkills?: string[];
  areaOfInterest?: string[];
  customSkills?: string[];
  customInterests?: string[];
  designation: string;
  address: string;
  dob?: string;
  gender?: string;
  internshipStartDate: string;
  internshipEndDate: string;
  accountStatus: 'active' | 'inactive';
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InternSchema = new Schema<IIntern>(
  {
    internId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    profileImage: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    collegeName: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    yearOfStudy: { type: String, default: 'Junior Year' },
    graduationYear: { type: String, default: '2026' },
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    technicalSkills: [{ type: String, trim: true }],
    areaOfInterest: [{ type: String, trim: true }],
    customSkills: [{ type: String, trim: true }],
    customInterests: [{ type: String, trim: true }],
    designation: { type: String, default: 'Software Development Intern' },
    address: { type: String, default: '' },
    dob: { type: String, default: '' },
    gender: { type: String, default: 'Prefer not to say' },
    internshipStartDate: { type: String, required: true },
    internshipEndDate: { type: String, required: true },
    accountStatus: { type: String, default: 'active', enum: ['active', 'inactive'] },
    createdBy: { type: String, default: 'PTS-CEO-001' },
  },
  { timestamps: true }
);

export const Intern = mongoose.models.Intern || mongoose.model<IIntern>('Intern', InternSchema);
