export type UserRole = 'admin' | 'intern' | 'staff';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  contactInfo: string;
  avatar?: string;
  password?: string;
}

export type GenderType = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export interface InternUser {
  id: string; // e.g. INT-2024-01
  username: string;
  password?: string;
  fullName: string;
  avatar?: string;
  dob: string;
  gender: GenderType;
  email: string;
  phone: string;
  address: string;
  college: string;
  department: string;
  degree: string;
  yearOfStudy: string;
  graduationYear: string;
  skills: string[];
  interests: string[];
  technicalSkills?: string[];
  areaOfInterest?: string[];
  customSkills?: string[];
  customInterests?: string[];
  designation: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface EmailLogItem {
  id: string;
  emailId: string;
  recipientEmail: string;
  recipientName: string;
  internId: string;
  projectId: string;
  projectName: string;
  subject: string;
  bodyHtml: string;
  status: 'sent' | 'logged_preview' | 'failed';
  errorDetails?: string;
  sentAt: string;
  assignedBy: string;
  deliveryAttempts: number;
}

export interface ProjectDomain {
  id: string; // e.g. 'dom-aiml'
  name: string; // e.g. 'Artificial Intelligence & Machine Learning'
  slug: string;
  description: string;
  color?: string; // e.g. 'indigo', 'sky', 'emerald', 'violet', 'amber'
  createdAt: string;
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'Under Review' | 'Completed';

export interface ProjectReferenceDoc {
  name: string;
  size?: string;
  url?: string;
  type?: string;
}

export interface Project {
  id: string; // e.g. PRJ-8041
  name: string;
  description: string;
  category: string;
  domainId?: string; // Associated ProjectDomain ID
  objectives: string[];
  requirements: string[];
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  referenceDocs: ProjectReferenceDoc[];
  assignedInternIds: string[];
  supervisorName: string;
  supervisorEmail: string;
  progress: number; // 0 - 100
  createdAt: string;
}

export type ReportStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';

export interface ReportFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // base64 or object url
  previewText?: string;
}

export interface ReportSubmission {
  id: string; // e.g. REP-5021
  projectId: string;
  internId: string;
  title: string;
  description: string;
  workSummary: string;
  progressPercentage: number;
  files: ReportFile[];
  status: ReportStatus;
  submittedAt: string;
  updatedAt: string;
  reviewComments?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  month?: string;
  year?: number;
  weekNumber?: number;
  weekStartDate?: string;
  weekEndDate?: string;
  completedActivities?: string;
  challengesFaced?: string;
  nextWeekPlan?: string;
  additionalComments?: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string; // Intern ID or 'admin'
  role: 'admin' | 'intern';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  projectId?: string;
  reportId?: string;
}

export interface SystemStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalInterns: number;
  availableInterns: number;
  assignedInterns: number;
  pendingReports: number;
  submittedReports: number;
}

export type ActivityCategory =
  | 'check_in'
  | 'project_update'
  | 'report_submission'
  | 'report_review'
  | 'assignment'
  | 'security'
  | 'system';

export type ActivitySeverity = 'info' | 'success' | 'warning' | 'error';

export interface ActivityLogItem {
  _id?: string;
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
    type?: 'intern' | 'project' | 'report' | 'system';
    id?: string;
    title?: string;
  };
  summary: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export type CheckInStatus = 'Present' | 'Working Remotely' | 'In Office' | 'Checked Out';
export type WorkMode = 'Remote' | 'Office' | 'Hybrid';

export interface InternCheckInItem {
  _id?: string;
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
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
  dateString: string;
  adminAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

