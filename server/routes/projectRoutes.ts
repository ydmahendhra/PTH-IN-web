import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { ProjectAssignment } from '../models/ProjectAssignment.js';
import { Intern } from '../models/Intern.js';
import { requireAdmin, authenticate } from '../middleware/auth.js';
import { logActivity, logProjectUpdate } from '../services/activityLogger.js';

const router = Router();

const getProjectQuery = (id: string) => {
  return mongoose.isValidObjectId(id)
    ? { $or: [{ projectId: id }, { _id: id }] }
    : { projectId: id };
};

// GET /api/projects - list all projects
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { category, status, search } = req.query;
    const filter: any = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (status && status !== 'All') {
      filter.projectStatus = status;
    }
    if (search) {
      const q = search.toString();
      filter.$or = [
        { projectName: { $regex: q, $options: 'i' } },
        { projectId: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();
    const activeAssignments = await ProjectAssignment.find({ assignmentStatus: 'active' }).lean();

    // Map assigned intern IDs into each project
    const projectsWithInterns = projects.map((p: any) => {
      const assigned = activeAssignments
        .filter((a: any) => a.projectId === p.projectId)
        .map((a: any) => a.internId);
      return {
        ...p,
        id: p.projectId,
        name: p.projectName,
        status: p.projectStatus,
        assignedInternIds: assigned,
      };
    });

    return res.json({ success: true, count: projectsWithInterns.length, projects: projectsWithInterns });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/:id - get single project
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const project = await Project.findOne(getProjectQuery(req.params.id)).lean();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const assignments = await ProjectAssignment.find({
      projectId: project.projectId,
      assignmentStatus: 'active',
    }).lean();

    const internIds = assignments.map((a: any) => a.internId);
    const assignedInterns = await Intern.find({ internId: { $in: internIds } })
      .select('-passwordHash')
      .lean();

    return res.json({
      success: true,
      project: {
        ...project,
        id: project.projectId,
        name: project.projectName,
        status: project.projectStatus,
        assignedInternIds: internIds,
        assignedInterns,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects - create project (Admin only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      projectName,
      name,
      description,
      objectives,
      requirements,
      category,
      domainId,
      startDate,
      deadline,
      projectStatus,
      status,
      referenceDocs,
    } = req.body;

    const projName = projectName || name;
    if (!projName || !description || !startDate || !deadline) {
      return res.status(400).json({ success: false, message: 'Missing required project attributes.' });
    }

    const randId = Math.floor(1000 + Math.random() * 9000);
    const projectId = `PRJ-${randId}`;

    const newProject = await Project.create({
      projectId,
      projectName: projName.trim(),
      description,
      objectives: objectives || [],
      requirements: requirements || [],
      category: category || 'Web & Mobile Platforms',
      domainId: domainId || '',
      startDate,
      deadline,
      projectStatus: projectStatus || status || 'Planning',
      progress: 0,
      referenceDocs: referenceDocs || [],
      createdBy: req.user?.id || 'ADM-1001',
    });

    await logActivity({
      category: 'project_update',
      action: 'PROJECT_CREATED',
      severity: 'info',
      actor: { id: req.user?.id || 'admin', name: req.user?.name || 'Administrator', role: 'admin' },
      target: { type: 'project', id: newProject.projectId, title: newProject.projectName },
      summary: `Administrator created project "${newProject.projectName}"`,
      details: { category: newProject.category, status: newProject.projectStatus, deadline: newProject.deadline },
    });

    return res.status(201).json({
      success: true,
      message: `Project "${newProject.projectName}" (${projectId}) created successfully.`,
      project: {
        ...newProject.toObject(),
        id: newProject.projectId,
        name: newProject.projectName,
        status: newProject.projectStatus,
        assignedInternIds: [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/projects/:id - update project
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updates = { ...req.body };
    if (updates.name && !updates.projectName) updates.projectName = updates.name;
    if (updates.status && !updates.projectStatus) updates.projectStatus = updates.status;

    delete updates.projectId; // preserve immutable ID

    const project = await Project.findOneAndUpdate(
      getProjectQuery(req.params.id),
      { $set: updates },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await logProjectUpdate(
      { id: req.user?.id || 'admin', name: req.user?.name || 'Administrator', role: 'admin' },
      { id: project.projectId, title: project.projectName },
      'PROJECT_UPDATED',
      `Administrator updated project "${project.projectName}" (Progress: ${project.progress}%, Status: ${project.projectStatus})`,
      { progress: project.progress, status: project.projectStatus, updates }
    );

    return res.json({
      success: true,
      message: `Project ${project.projectName} updated.`,
      project: {
        ...project.toObject(),
        id: project.projectId,
        name: project.projectName,
        status: project.projectStatus,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects/:id/progress - Post milestone / progress update (Admin or Assigned Intern)
router.post('/:id/progress', authenticate, async (req: Request, res: Response) => {
  try {
    const { progress, status, note, milestoneCompleted } = req.body;

    const project = await Project.findOne(getProjectQuery(req.params.id));

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const prevProgress = project.progress;
    const prevStatus = project.projectStatus;

    if (progress !== undefined) {
      project.progress = Math.min(100, Math.max(0, Number(progress)));
    }
    if (status) {
      project.projectStatus = status;
    }
    await project.save();

    const actorRole = req.user?.role === 'intern' ? 'intern' : 'admin';
    const actorName = req.user?.name || (actorRole === 'admin' ? 'Administrator' : 'Intern');
    const updateSummary = milestoneCompleted
      ? `${actorName} completed milestone "${milestoneCompleted}" on "${project.projectName}"`
      : `${actorName} updated "${project.projectName}" progress to ${project.progress}%`;

    await logProjectUpdate(
      { id: req.user?.id || 'user', name: actorName, role: actorRole },
      { id: project.projectId, title: project.projectName },
      milestoneCompleted ? 'MILESTONE_COMPLETED' : 'PROGRESS_UPDATE',
      updateSummary,
      {
        previousProgress: prevProgress,
        newProgress: project.progress,
        previousStatus: prevStatus,
        newStatus: project.projectStatus,
        note: note || '',
        milestoneCompleted: milestoneCompleted || '',
      }
    );

    return res.json({
      success: true,
      message: updateSummary,
      project: {
        ...project.toObject(),
        id: project.projectId,
        name: project.projectName,
        status: project.projectStatus,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/projects/:id - delete project
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const project = await Project.findOne(getProjectQuery(req.params.id));

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await Project.deleteOne({ _id: project._id });
    await ProjectAssignment.deleteMany({ projectId: project.projectId });

    return res.json({ success: true, message: `Project ${project.projectName} deleted.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
