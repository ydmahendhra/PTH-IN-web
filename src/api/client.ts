// REST API Client for NexusProject backend

const TOKEN_KEY = 'NEXUS_JWT_TOKEN';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; [key: string]: any }> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type for FormData (browser will set boundary automatically)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json();
      if (!response.ok) {
        return { success: false, message: json.message || `Request failed with status ${response.status}` };
      }
      return json;
    }

    if (!response.ok) {
      return { success: false, message: `Request failed with status ${response.status}` };
    }

    return { success: true } as any;
  } catch (err: any) {
    return { success: false, message: err.message || 'Network request failed' };
  }
}

export const api = {
  // Auth
  auth: {
    loginAdmin: (identifier: string, password?: string) =>
      apiRequest('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      }),
    loginIntern: (identifier: string, password?: string) =>
      apiRequest('/api/auth/intern/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      }),
    getMe: () => apiRequest('/api/auth/me'),
    logout: () => {
      setStoredToken(null);
      return apiRequest('/api/auth/logout', { method: 'POST' });
    },
    resetAdminPassword: (data: { identifier: string; securityKey?: string; newPassword: string; confirmPassword: string }) =>
      apiRequest('/api/auth/admin/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Admin
  admin: {
    getProfile: () => apiRequest('/api/admin/profile'),
    updateProfile: (data: any) =>
      apiRequest('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getAll: () => apiRequest('/api/admin'),
    create: (data: any) =>
      apiRequest('/api/admin/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resetPassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
      apiRequest('/api/admin/reset-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      }),
  },

  // Interns
  interns: {
    getAll: (params?: { search?: string; department?: string; status?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return apiRequest(`/api/interns?${q}`);
    },
    getById: (id: string) => apiRequest(`/api/interns/${id}`),
    create: (data: any) =>
      apiRequest('/api/interns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/api/interns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    uploadProfileImage: (id: string, file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return apiRequest(`/api/interns/${id}/profile-image`, {
        method: 'POST',
        body: formData,
      });
    },
    resetPassword: (id: string, newPassword: string) =>
      apiRequest(`/api/interns/${id}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword }),
      }),
    delete: (id: string, permanent?: boolean) =>
      apiRequest(`/api/interns/${id}?permanent=${permanent ? 'true' : 'false'}`, {
        method: 'DELETE',
      }),
  },

  // Projects
  projects: {
    getAll: (params?: { category?: string; status?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return apiRequest(`/api/projects?${q}`);
    },
    getById: (id: string) => apiRequest(`/api/projects/${id}`),
    create: (data: any) =>
      apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateProgress: (id: string, data: { progress?: number; status?: string; note?: string; milestoneCompleted?: string }) =>
      apiRequest(`/api/projects/${id}/progress`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/projects/${id}`, {
        method: 'DELETE',
      }),
  },

  // Assignments
  assignments: {
    getAll: () => apiRequest('/api/assignments'),
    getByIntern: (internId: string) => apiRequest(`/api/assignments/intern/${internId}`),
    getByProject: (projectId: string) => apiRequest(`/api/assignments/project/${projectId}`),
    assign: (projectId: string, internIds: string[]) =>
      apiRequest('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({ projectId, internIds }),
      }),
    delete: (assignmentId: string) =>
      apiRequest(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      }),
  },

  // Reports
  reports: {
    getAll: (params?: any) => {
      const q = new URLSearchParams(params as any).toString();
      return apiRequest(`/api/reports?${q}`);
    },
    getById: (id: string) => apiRequest(`/api/reports/${id}`),
    submit: (formData: FormData) =>
      apiRequest('/api/reports', {
        method: 'POST',
        body: formData,
      }),
    review: (id: string, status: string, reviewComments: string) =>
      apiRequest(`/api/reports/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ status, reviewComments }),
      }),
  },

  // Reporting Calendar
  reporting: {
    getMonths: (year?: number) => apiRequest(`/api/reporting/months${year ? `?year=${year}` : ''}`),
    getWeeks: (year: number, month: number) => apiRequest(`/api/reporting/weeks/${year}/${month}`),
  },

  // Notifications
  notifications: {
    getAll: () => apiRequest('/api/notifications'),
    getUnreadCount: () => apiRequest('/api/notifications/unread'),
    markRead: (id: string) =>
      apiRequest(`/api/notifications/${id}/read`, {
        method: 'PUT',
      }),
    markAllRead: () =>
      apiRequest('/api/notifications/read-all', {
        method: 'PUT',
      }),
  },

  // Export
  export: {
    downloadExcel: async (type: 'interns' | 'projects' | 'assignments' | 'weekly-reports' | 'monthly-reports') => {
      const token = getStoredToken();
      const headers = new Headers();
      if (token) headers.set('Authorization', `Bearer ${token}`);

      const response = await fetch(`/api/export/${type}`, { headers });
      if (!response.ok) throw new Error(`Export failed with status ${response.status}`);

      const blob = await response.blob();
      const filename = `Phoenix_Tech_${type.replace('-', '_')}_${Date.now()}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  },

  // Emails
  emails: {
    getAll: () => apiRequest('/api/emails'),
    retry: (emailId: string) =>
      apiRequest(`/api/emails/retry/${emailId}`, {
        method: 'POST',
      }),
  },

  // Activity & Central Logs
  activity: {
    getDashboard: () => apiRequest('/api/activity/dashboard'),
    getLogs: (params?: { category?: string; severity?: string; search?: string; range?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams(params as any).toString();
      return apiRequest(`/api/activity/logs?${q}`);
    },
    getCheckIns: (params?: { date?: string; status?: string; internId?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return apiRequest(`/api/activity/checkins?${q}`);
    },
    getMyCheckInStatus: () => apiRequest('/api/activity/checkins/status/me'),
    submitCheckIn: (data: { focusToday: string; status?: string; mode?: string; projectId?: string; blockers?: string }) =>
      apiRequest('/api/activity/checkins', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    checkOut: () =>
      apiRequest('/api/activity/checkins/checkout', {
        method: 'POST',
      }),
    adminLogCheckIn: (data: any) =>
      apiRequest('/api/activity/checkins/admin-log', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    acknowledgeCheckIn: (id: string) =>
      apiRequest(`/api/activity/checkins/${id}/acknowledge`, {
        method: 'PUT',
      }),
    clearLogs: (retainLatest?: number) =>
      apiRequest('/api/activity/logs/clear', {
        method: 'DELETE',
        body: JSON.stringify({ retainLatest }),
      }),
    exportLogsUrl: (format: 'json' | 'csv' = 'csv') => `/api/activity/export?format=${format}`,
  },
};
