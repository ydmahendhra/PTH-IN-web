import ExcelJS from 'exceljs';
import { Intern } from '../models/Intern.js';
import { Project } from '../models/Project.js';
import { ProjectAssignment } from '../models/ProjectAssignment.js';
import { Report } from '../models/Report.js';

// Header style helper for clean enterprise look
function applyHeaderStyle(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF312E81' }, // Deep Indigo
  };
  row.alignment = { vertical: 'middle', horizontal: 'left' };
  row.height = 24;
}

export async function generateInternsExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phoenix Tech Solutions';
  const worksheet = workbook.addWorksheet('Intern Details');

  worksheet.columns = [
    { header: 'Intern ID', key: 'internId', width: 16 },
    { header: 'Full Name', key: 'fullName', width: 24 },
    { header: 'Intern Designation', key: 'designation', width: 28 },
    { header: 'Email Address', key: 'email', width: 28 },
    { header: 'Phone Number', key: 'phoneNumber', width: 18 },
    { header: 'College / University', key: 'collegeName', width: 30 },
    { header: 'Department', key: 'department', width: 26 },
    { header: 'Degree', key: 'degree', width: 24 },
    { header: 'Year of Study', key: 'yearOfStudy', width: 16 },
    { header: 'Area of Interest', key: 'interests', width: 32 },
    { header: 'Technical Skills', key: 'skills', width: 34 },
    { header: 'Start Date', key: 'startDate', width: 14 },
    { header: 'End Date', key: 'endDate', width: 14 },
    { header: 'Account Status', key: 'status', width: 14 },
  ];

  applyHeaderStyle(worksheet.getRow(1));

  const interns = await Intern.find().sort({ internId: 1 }).lean();

  interns.forEach((intern: any) => {
    const skillsList = (intern.technicalSkills && intern.technicalSkills.length > 0)
      ? intern.technicalSkills
      : intern.skills || [];
    const interestsList = (intern.areaOfInterest && intern.areaOfInterest.length > 0)
      ? intern.areaOfInterest
      : intern.interests || [];

    worksheet.addRow({
      internId: intern.internId,
      fullName: intern.fullName,
      designation: intern.designation || 'Software Development Intern',
      email: intern.email,
      phoneNumber: intern.phoneNumber || 'N/A',
      collegeName: intern.collegeName,
      department: intern.department,
      degree: intern.degree,
      yearOfStudy: intern.yearOfStudy,
      interests: interestsList.join(', '),
      skills: skillsList.join(', '),
      startDate: intern.internshipStartDate,
      endDate: intern.internshipEndDate,
      status: intern.accountStatus === 'active' ? 'Active' : 'Inactive',
    });
  });

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}

export async function generateProjectsExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phoenix Tech Solutions';
  const worksheet = workbook.addWorksheet('Projects Overview');

  worksheet.columns = [
    { header: 'Project ID', key: 'projectId', width: 14 },
    { header: 'Project Name', key: 'projectName', width: 32 },
    { header: 'Category / Domain', key: 'category', width: 26 },
    { header: 'Description', key: 'description', width: 44 },
    { header: 'Start Date', key: 'startDate', width: 14 },
    { header: 'Deadline', key: 'deadline', width: 14 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Progress (%)', key: 'progress', width: 14 },
    { header: 'Assigned Interns Count', key: 'internCount', width: 22 },
  ];

  applyHeaderStyle(worksheet.getRow(1));

  const projects = await Project.find().sort({ projectId: 1 }).lean();
  const assignments = await ProjectAssignment.find({ assignmentStatus: 'active' }).lean();

  projects.forEach((proj: any) => {
    const assignedCount = assignments.filter((a: any) => a.projectId === proj.projectId).length;
    worksheet.addRow({
      projectId: proj.projectId,
      projectName: proj.projectName,
      category: proj.category,
      description: proj.description,
      startDate: proj.startDate,
      deadline: proj.deadline,
      status: proj.projectStatus,
      progress: proj.progress,
      internCount: assignedCount,
    });
  });

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}

export async function generateAssignmentsExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phoenix Tech Solutions';
  const worksheet = workbook.addWorksheet('Project Assignments');

  worksheet.columns = [
    { header: 'Assignment ID', key: 'assignmentId', width: 16 },
    { header: 'Project ID', key: 'projectId', width: 14 },
    { header: 'Project Name', key: 'projectName', width: 32 },
    { header: 'Intern ID', key: 'internId', width: 14 },
    { header: 'Intern Full Name', key: 'internName', width: 24 },
    { header: 'Assigned Date', key: 'assignedDate', width: 16 },
    { header: 'Status', key: 'status', width: 14 },
  ];

  applyHeaderStyle(worksheet.getRow(1));

  const assignments = await ProjectAssignment.find().sort({ createdAt: -1 }).lean();
  const projects = await Project.find().lean();
  const interns = await Intern.find().lean();

  const projMap = new Map(projects.map((p: any) => [p.projectId, p.projectName]));
  const internMap = new Map(interns.map((i: any) => [i.internId, i.fullName]));

  assignments.forEach((asg: any) => {
    worksheet.addRow({
      assignmentId: asg.assignmentId,
      projectId: asg.projectId,
      projectName: projMap.get(asg.projectId) || asg.projectId,
      internId: asg.internId,
      internName: internMap.get(asg.internId) || asg.internId,
      assignedDate: asg.assignedDate ? asg.assignedDate.split('T')[0] : 'N/A',
      status: asg.assignmentStatus,
    });
  });

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}

export async function generateWeeklyReportsExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phoenix Tech Solutions';
  const worksheet = workbook.addWorksheet('Weekly Reports');

  worksheet.columns = [
    { header: 'Report ID', key: 'reportId', width: 14 },
    { header: 'Intern ID', key: 'internId', width: 14 },
    { header: 'Intern Name', key: 'internName', width: 22 },
    { header: 'Project Name', key: 'projectName', width: 28 },
    { header: 'Reporting Month', key: 'month', width: 16 },
    { header: 'Year', key: 'year', width: 10 },
    { header: 'Week Number', key: 'weekNumber', width: 14 },
    { header: 'Reporting Period', key: 'period', width: 24 },
    { header: 'Report Title', key: 'title', width: 32 },
    { header: 'Work Progress (%)', key: 'progress', width: 18 },
    { header: 'Submission Status', key: 'status', width: 16 },
    { header: 'Submitted At', key: 'submittedAt', width: 20 },
    { header: 'Reviewed By', key: 'reviewedBy', width: 20 },
    { header: 'Work Summary', key: 'workSummary', width: 44 },
  ];

  applyHeaderStyle(worksheet.getRow(1));

  const reports = await Report.find().sort({ createdAt: -1 }).lean();
  const interns = await Intern.find().lean();
  const projects = await Project.find().lean();

  const internMap = new Map(interns.map((i: any) => [i.internId, i.fullName]));
  const projMap = new Map(projects.map((p: any) => [p.projectId, p.projectName]));

  reports.forEach((rep: any) => {
    worksheet.addRow({
      reportId: rep.reportId,
      internId: rep.internId,
      internName: internMap.get(rep.internId) || rep.internId,
      projectName: projMap.get(rep.projectId) || rep.projectId,
      month: rep.month,
      year: rep.year,
      weekNumber: `Week ${rep.weekNumber}`,
      period: `${rep.weekStartDate} to ${rep.weekEndDate}`,
      title: rep.reportTitle,
      progress: rep.workProgress,
      status: rep.submissionStatus,
      submittedAt: rep.submittedAt ? new Date(rep.submittedAt).toLocaleDateString() : 'Draft',
      reviewedBy: rep.reviewedBy || 'Pending',
      workSummary: rep.workSummary,
    });
  });

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}

export async function generateMonthlyReportsExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phoenix Tech Solutions';
  const worksheet = workbook.addWorksheet('Monthly Report Aggregates');

  worksheet.columns = [
    { header: 'Intern ID', key: 'internId', width: 14 },
    { header: 'Intern Name', key: 'internName', width: 24 },
    { header: 'Project Name', key: 'projectName', width: 30 },
    { header: 'Reporting Month', key: 'month', width: 16 },
    { header: 'Reporting Year', key: 'year', width: 14 },
    { header: 'Weekly Reports Submitted', key: 'submittedCount', width: 24 },
    { header: 'Approved Reports', key: 'approvedCount', width: 18 },
    { header: 'Pending / Under Review', key: 'pendingCount', width: 22 },
    { header: 'Rejected Reports', key: 'rejectedCount', width: 18 },
  ];

  applyHeaderStyle(worksheet.getRow(1));

  const reports = await Report.find().lean();
  const interns = await Intern.find().lean();
  const projects = await Project.find().lean();

  const internMap = new Map(interns.map((i: any) => [i.internId, i.fullName]));
  const projMap = new Map(projects.map((p: any) => [p.projectId, p.projectName]));

  // Group by internId + projectId + month + year
  const groupMap = new Map<string, {
    internId: string;
    projectId: string;
    month: string;
    year: number;
    submitted: number;
    approved: number;
    pending: number;
    rejected: number;
  }>();

  reports.forEach((rep: any) => {
    const key = `${rep.internId}_${rep.projectId}_${rep.month}_${rep.year}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        internId: rep.internId,
        projectId: rep.projectId,
        month: rep.month,
        year: rep.year,
        submitted: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      });
    }

    const group = groupMap.get(key)!;
    if (rep.submissionStatus !== 'Draft') {
      group.submitted += 1;
    }
    if (rep.submissionStatus === 'Approved') {
      group.approved += 1;
    } else if (rep.submissionStatus === 'Submitted' || rep.submissionStatus === 'Under Review') {
      group.pending += 1;
    } else if (rep.submissionStatus === 'Rejected') {
      group.rejected += 1;
    }
  });

  groupMap.forEach((g) => {
    worksheet.addRow({
      internId: g.internId,
      internName: internMap.get(g.internId) || g.internId,
      projectName: projMap.get(g.projectId) || g.projectId,
      month: g.month,
      year: g.year,
      submittedCount: g.submitted,
      approvedCount: g.approved,
      pendingCount: g.pending,
      rejectedCount: g.rejected,
    });
  });

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}
