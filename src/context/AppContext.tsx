import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { io as socketIOClient, Socket } from 'socket.io-client';
import {
  AdminUser,
  InternUser,
  Project,
  ProjectDomain,
  ReportSubmission,
  NotificationItem,
  SystemStats,
  UserRole,
  ReportStatus,
} from '../types';
import { INITIAL_DOMAINS } from '../data/seedData';
import { api, getStoredToken, setStoredToken } from '../api/client';

interface AppContextType {
  // Authentication & Security State
  currentRole: UserRole | null;
  adminUser: AdminUser;
  currentIntern: InternUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (role: 'admin' | 'intern', identifier: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;

  // Data Collections (Persistent in MongoDB)
  adminProfile: AdminUser;
  domains: ProjectDomain[];
  interns: InternUser[];
  projects: Project[];
  reports: ReportSubmission[];
  notifications: NotificationItem[];
  stats: SystemStats;

  // Real-time Gateway
  socket: Socket | null;

  // Refresh methods
  refreshData: () => Promise<void>;

  // Project Domain Management
  createDomain: (data: Omit<ProjectDomain, 'id' | 'createdAt'>) => ProjectDomain;
  updateDomain: (id: string, data: Partial<ProjectDomain>) => void;
  deleteDomain: (id: string) => void;

  // Admin Actions (Backed by MongoDB REST APIs)
  updateAdminProfile: (data: Partial<AdminUser>) => Promise<void>;
  createIntern: (data: any, profileImageFile?: File) => Promise<any>;
  updateIntern: (id: string, data: Partial<InternUser>) => Promise<void>;
  uploadInternProfileImage: (id: string, file: File) => Promise<{ success: boolean; imageUrl?: string }>;
  toggleInternActive: (id: string) => Promise<void>;
  resetInternPassword: (id: string, newPass: string) => Promise<void>;
  createProject: (data: any) => Promise<any>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  assignInternsToProject: (projectId: string, internIds: string[]) => Promise<void>;
  reviewReport: (reportId: string, status: ReportStatus, comments: string) => Promise<void>;

  // Intern Actions (Backed by MongoDB REST APIs)
  submitReport: (formData: FormData) => Promise<any>;
  updateInternProfile: (id: string, allowedData: Partial<InternUser>) => Promise<void>;

  // Notifications
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Excel Export
  exportExcel: (type: 'interns' | 'projects' | 'assignments' | 'weekly-reports' | 'monthly-reports') => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentIntern, setCurrentIntern] = useState<InternUser | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser>({
    id: 'PTS-CEO-001',
    name: 'Y D Mahendhra',
    email: 'mahendhra2005@gamil.com',
    phone: '+91 98765 43210',
    designation: 'Chief Executive Officer (CEO)',
    department: 'Executive Leadership & Project Operations',
    contactInfo: 'Executive Office · Email: mahendhra2005@gamil.com',
  });

  const [domains, setDomains] = useState<ProjectDomain[]>(INITIAL_DOMAINS);
  const [interns, setInterns] = useState<InternUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<ReportSubmission[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const s = socketIOClient({
      path: '/socket.io',
      reconnectionAttempts: 5,
    });

    s.on('connect', () => {
      console.log('[Socket.IO Client] Connected to real-time notification engine.');
      if (currentRole) {
        s.emit('join_role', currentRole);
      }
      if (currentIntern) {
        s.emit('join_user', currentIntern.id);
      }
    });

    s.on('new_notification', (notif: any) => {
      setNotifications((prev) => [
        {
          id: notif.notificationId || `notif-${Date.now()}`,
          recipientId: notif.recipientId,
          role: notif.recipientRole,
          title: notif.notificationTitle,
          message: notif.notificationMessage,
          timestamp: notif.createdAt || new Date().toISOString(),
          isRead: notif.isRead || false,
          projectId: notif.relatedProjectId,
          reportId: notif.relatedReportId,
        },
        ...prev,
      ]);
      // Also refresh lists to keep state synchronized
      refreshData();
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [currentRole, currentIntern]);

  // Load all data from MongoDB
  const refreshData = async () => {
    try {
      const [internsRes, projectsRes, reportsRes, notifsRes] = await Promise.all([
        api.interns.getAll(),
        api.projects.getAll(),
        api.reports.getAll(),
        api.notifications.getAll(),
      ]);

      if (internsRes.success && internsRes.interns) {
        setInterns(
          internsRes.interns.map((i: any) => ({
            id: i.internId,
            username: i.username,
            fullName: i.fullName,
            avatar: i.profileImage,
            dob: i.dob || '',
            gender: i.gender || 'Prefer not to say',
            email: i.email,
            phone: i.phoneNumber || '',
            address: i.address || '',
            college: i.collegeName,
            department: i.department,
            degree: i.degree,
            yearOfStudy: i.yearOfStudy,
            graduationYear: i.graduationYear || '2026',
            skills: (i.technicalSkills && i.technicalSkills.length > 0) ? i.technicalSkills : i.skills || [],
            interests: (i.areaOfInterest && i.areaOfInterest.length > 0) ? i.areaOfInterest : i.interests || [],
            technicalSkills: i.technicalSkills || i.skills || [],
            areaOfInterest: i.areaOfInterest || i.interests || [],
            customSkills: i.customSkills || [],
            customInterests: i.customInterests || [],
            designation: i.designation || 'Software Development Intern',
            startDate: i.internshipStartDate,
            endDate: i.internshipEndDate,
            isActive: i.accountStatus === 'active',
            createdAt: i.createdAt,
          }))
        );
      }

      if (projectsRes.success && projectsRes.projects) {
        setProjects(
          projectsRes.projects.map((p: any) => ({
            id: p.projectId,
            name: p.projectName,
            description: p.description,
            category: p.category,
            domainId: p.domainId,
            objectives: p.objectives || [],
            requirements: p.requirements || [],
            startDate: p.startDate,
            deadline: p.deadline,
            status: p.projectStatus,
            referenceDocs: p.referenceDocs || [],
            assignedInternIds: p.assignedInternIds || [],
            supervisorName: p.createdBy || 'Dr. Sarah Sterling',
            supervisorEmail: 'admin@nexus.corp',
            progress: p.progress || 0,
            createdAt: p.createdAt,
          }))
        );
      }

      if (reportsRes.success && reportsRes.reports) {
        setReports(
          reportsRes.reports.map((r: any) => ({
            id: r.reportId,
            projectId: r.projectId,
            internId: r.internId,
            title: r.reportTitle,
            description: r.description,
            workSummary: r.workSummary,
            progressPercentage: r.workProgress,
            files: (r.uploadedFiles || []).map((f: any) => ({
              id: f.fileId,
              name: f.originalFileName,
              size: f.fileSize,
              type: f.contentType,
              dataUrl: f.dataUrl || `/api/files/${f.fileId}`,
            })),
            status: r.submissionStatus,
            submittedAt: r.submittedAt || r.createdAt,
            updatedAt: r.updatedAt,
            reviewComments: r.reviewComments,
            reviewedAt: r.reviewedAt,
            reviewedBy: r.reviewedBy,
            month: r.month,
            year: r.year,
            weekNumber: r.weekNumber,
            weekStartDate: r.weekStartDate,
            weekEndDate: r.weekEndDate,
            completedActivities: r.completedActivities,
            challengesFaced: r.challengesFaced,
            nextWeekPlan: r.nextWeekPlan,
            additionalComments: r.additionalComments,
          }))
        );
      }

      if (notifsRes.success && notifsRes.notifications) {
        setNotifications(
          notifsRes.notifications.map((n: any) => ({
            id: n.notificationId,
            recipientId: n.recipientId,
            role: n.recipientRole,
            title: n.notificationTitle,
            message: n.notificationMessage,
            timestamp: n.createdAt,
            isRead: n.isRead,
            projectId: n.relatedProjectId,
            reportId: n.relatedReportId,
          }))
        );
      }
    } catch (err) {
      console.warn('Initial data fetch issue:', err);
    }
  };

  // Check auth session on load
  useEffect(() => {
    async function initAuth() {
      setIsLoadingAuth(true);
      const token = getStoredToken();
      if (token) {
        const res = await api.auth.getMe();
        if (res.success && res.user) {
          if (res.role === 'admin') {
            setCurrentRole('admin');
            setAdminProfile({
              id: res.user.adminId || 'ADM-1001',
              name: res.user.name,
              email: res.user.email,
              phone: res.user.contactNumber || '',
              designation: res.user.designation || 'Director of Talent & Project Operations',
              department: res.user.department || 'Enterprise Innovation & Engineering',
              contactInfo: res.user.contactInfo || '',
              avatar: res.user.profileImage || '',
            });
          } else if (res.role === 'intern') {
            setCurrentRole('intern');
            setCurrentIntern({
              id: res.user.internId,
              username: res.user.username,
              fullName: res.user.fullName,
              avatar: res.user.profileImage || '',
              dob: res.user.dob || '',
              gender: res.user.gender || 'Prefer not to say',
              email: res.user.email,
              phone: res.user.phoneNumber || '',
              address: res.user.address || '',
              college: res.user.collegeName,
              department: res.user.department,
              degree: res.user.degree,
              yearOfStudy: res.user.yearOfStudy,
              graduationYear: res.user.graduationYear || '2026',
              skills: (res.user.technicalSkills && res.user.technicalSkills.length > 0) ? res.user.technicalSkills : res.user.skills || [],
              interests: (res.user.areaOfInterest && res.user.areaOfInterest.length > 0) ? res.user.areaOfInterest : res.user.interests || [],
              technicalSkills: res.user.technicalSkills || res.user.skills || [],
              areaOfInterest: res.user.areaOfInterest || res.user.interests || [],
              customSkills: res.user.customSkills || [],
              customInterests: res.user.customInterests || [],
              designation: res.user.designation || 'Software Development Intern',
              startDate: res.user.internshipStartDate,
              endDate: res.user.internshipEndDate,
              isActive: res.user.accountStatus === 'active',
              createdAt: res.user.createdAt,
            });
          }
        } else {
          setStoredToken(null);
        }
      }
      await refreshData();
      setIsLoadingAuth(false);
    }

    initAuth();
  }, []);

  // System stats
  const stats: SystemStats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'In Progress' || p.status === 'Planning').length;
    const completedProjects = projects.filter((p) => p.status === 'Completed').length;

    const totalInterns = interns.length;
    const assignedInternIdsSet = new Set<string>();
    projects.forEach((p) => {
      p.assignedInternIds.forEach((id) => assignedInternIdsSet.add(id));
    });
    const assignedInterns = interns.filter((i) => assignedInternIdsSet.has(i.id)).length;
    const availableInterns = interns.filter((i) => !assignedInternIdsSet.has(i.id) && i.isActive).length;

    const pendingReports = reports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review').length;
    const submittedReports = reports.filter((r) => r.status !== 'Draft').length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalInterns,
      availableInterns,
      assignedInterns,
      pendingReports,
      submittedReports,
    };
  }, [projects, interns, reports]);

  // Auth methods
  const login = async (role: 'admin' | 'intern', identifier: string, password?: string) => {
    if (role === 'admin') {
      const res = await api.auth.loginAdmin(identifier, password);
      if (res.success && res.token) {
        setStoredToken(res.token);
        setCurrentRole('admin');
        setCurrentIntern(null);
        setAdminProfile({
          id: res.user.adminId || 'ADM-1001',
          name: res.user.name,
          email: res.user.email,
          phone: res.user.contactNumber || '',
          designation: res.user.designation || 'Project Administrator',
          department: res.user.department || 'Operations',
          contactInfo: res.user.contactInfo || '',
          avatar: res.user.profileImage || '',
        });
        await refreshData();
        return { success: true, message: res.message || 'Login successful.' };
      }
      return { success: false, message: res.message || 'Admin authentication failed.' };
    }

    if (role === 'intern') {
      const res = await api.auth.loginIntern(identifier, password);
      if (res.success && res.token) {
        setStoredToken(res.token);
        setCurrentRole('intern');
        setCurrentIntern({
          id: res.user.internId,
          username: res.user.username,
          fullName: res.user.fullName,
          avatar: res.user.profileImage || '',
          dob: res.user.dob || '',
          gender: res.user.gender || 'Prefer not to say',
          email: res.user.email,
          phone: res.user.phoneNumber || '',
          address: res.user.address || '',
          college: res.user.collegeName,
          department: res.user.department,
          degree: res.user.degree,
          yearOfStudy: res.user.yearOfStudy,
          graduationYear: res.user.graduationYear || '2026',
          skills: (res.user.technicalSkills && res.user.technicalSkills.length > 0) ? res.user.technicalSkills : res.user.skills || [],
          interests: (res.user.areaOfInterest && res.user.areaOfInterest.length > 0) ? res.user.areaOfInterest : res.user.interests || [],
          technicalSkills: res.user.technicalSkills || res.user.skills || [],
          areaOfInterest: res.user.areaOfInterest || res.user.interests || [],
          customSkills: res.user.customSkills || [],
          customInterests: res.user.customInterests || [],
          designation: res.user.designation || 'Software Development Intern',
          startDate: res.user.internshipStartDate,
          endDate: res.user.internshipEndDate,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        await refreshData();
        return { success: true, message: res.message || 'Login successful.' };
      }
      return { success: false, message: res.message || 'Intern authentication failed.' };
    }

    return { success: false, message: 'Invalid role.' };
  };

  const logout = async () => {
    await api.auth.logout();
    setStoredToken(null);
    setCurrentRole(null);
    setCurrentIntern(null);
  };

  // Domain Management
  const createDomain = (data: Omit<ProjectDomain, 'id' | 'createdAt'>): ProjectDomain => {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newId = `dom-${Date.now().toString(36)}`;
    const newDomain: ProjectDomain = {
      ...data,
      id: newId,
      slug,
      createdAt: new Date().toISOString(),
    };
    setDomains((prev) => [...prev, newDomain]);
    return newDomain;
  };

  const updateDomain = (id: string, data: Partial<ProjectDomain>) => {
    setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
  };

  const deleteDomain = (id: string) => {
    setDomains((prev) => prev.filter((d) => d.id !== id));
  };

  // Admin Actions (MongoDB backed)
  const updateAdminProfile = async (data: Partial<AdminUser>) => {
    const res = await api.admin.updateProfile(data);
    if (res.success && res.admin) {
      setAdminProfile((prev) => ({ ...prev, ...data }));
    }
  };

  const createIntern = async (data: any, profileImageFile?: File) => {
    const res = await api.interns.create(data);
    if (!res.success) {
      throw new Error(res.message || 'Failed to create intern account.');
    }

    const created = res.intern;
    if (profileImageFile && created?.internId) {
      await api.interns.uploadProfileImage(created.internId, profileImageFile);
    }

    await refreshData();
    return created;
  };

  const updateIntern = async (id: string, data: Partial<InternUser>) => {
    await api.interns.update(id, data);
    await refreshData();
  };

  const uploadInternProfileImage = async (id: string, file: File) => {
    const res = await api.interns.uploadProfileImage(id, file);
    if (res.success) {
      await refreshData();
      return { success: true, imageUrl: res.imageUrl };
    }
    return { success: false };
  };

  const toggleInternActive = async (id: string) => {
    await api.interns.delete(id, false);
    await refreshData();
  };

  const resetInternPassword = async (id: string, newPass: string) => {
    const res = await api.interns.resetPassword(id, newPass);
    if (!res.success) throw new Error(res.message);
  };

  const createProject = async (data: any) => {
    const res = await api.projects.create(data);
    if (!res.success) throw new Error(res.message);
    await refreshData();
    return res.project;
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    await api.projects.update(id, data);
    await refreshData();
  };

  const deleteProject = async (id: string) => {
    await api.projects.delete(id);
    await refreshData();
  };

  const assignInternsToProject = async (projectId: string, internIds: string[]) => {
    await api.assignments.assign(projectId, internIds);
    await refreshData();
  };

  const reviewReport = async (reportId: string, status: ReportStatus, comments: string) => {
    const res = await api.reports.review(reportId, status, comments);
    if (!res.success) throw new Error(res.message);
    await refreshData();
  };

  // Intern Actions
  const submitReport = async (formData: FormData) => {
    const res = await api.reports.submit(formData);
    if (!res.success) throw new Error(res.message);
    await refreshData();
    return res.report;
  };

  const updateInternProfile = async (id: string, allowedData: Partial<InternUser>) => {
    await api.interns.update(id, allowedData);
    await refreshData();
  };

  // Notifications
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markNotificationAsRead = async (id: string) => {
    await api.notifications.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = async () => {
    await api.notifications.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const exportExcel = async (type: 'interns' | 'projects' | 'assignments' | 'weekly-reports' | 'monthly-reports') => {
    await api.export.downloadExcel(type);
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        adminUser: adminProfile,
        currentIntern,
        isAuthenticated: !!currentRole,
        isLoadingAuth,
        login,
        logout,
        adminProfile,
        domains,
        interns,
        projects,
        reports,
        notifications,
        stats,
        socket,
        refreshData,
        createDomain,
        updateDomain,
        deleteDomain,
        updateAdminProfile,
        createIntern,
        updateIntern,
        uploadInternProfileImage,
        toggleInternActive,
        resetInternPassword,
        createProject,
        updateProject,
        deleteProject,
        assignInternsToProject,
        reviewReport,
        submitReport,
        updateInternProfile,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        exportExcel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
