import express from 'express';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import internRoutes from './routes/internRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import reportingCalendarRoutes from './routes/reportingCalendarRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import activityRoutes from './routes/activityRoutes.js';

export const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/interns', internRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reporting', reportingCalendarRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/emails', emailRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    system: 'NexusProject Full-Stack Server',
    database: 'MongoDB GridFS Operational',
    timestamp: new Date().toISOString(),
  });
});

export default app;
